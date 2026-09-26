import logging
from typing import Dict
from kafka import KafkaConsumer, TopicPartition
import redis

from .celery_app import celery_app
from app.config.settings import settings
 

logger = logging.getLogger("skyguard.jobs.loadshedder")

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True,
)

class TaskThrottleCoordinator:
    """
    Maintains centralized task pause flags in Redis.redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True,
)
    Tasks check their state before starting.
    """

    REDIS_PREFIX = "skyguard:loadshed:paused"

    # Degradation Hierarchy (v2 §2.2):
    # 1. Historical QC Rewind (Pause immediately)
    # 2. Daily RUL & Health Scoring (Pause)
    # 3. Static Topology Rebuild (Pause)
    # Real-time QC and local event detection must NEVER be throttled.
    SHEDDABLE_TASKS = [
        "historical_rewind",
        "rul_estimator",
        "topology_worker",
        "calibration_refit",
    ]

    @classmethod
    def set_task_state(cls, task_name: str, paused: bool):
        key = f"{cls.REDIS_PREFIX}:{task_name}"
        if paused:
            redis_client.set(key, "1", ex=3600)  # Auto-expire safety after 1 hour
        else:
            redis_client.delete(key)

    @classmethod
    def is_task_paused(cls, task_name: str) -> bool:
        return bool(redis_client.exists(f"{cls.REDIS_PREFIX}:{task_name}"))

    @classmethod
    def get_all_states(cls) -> Dict[str, bool]:
        return {task: cls.is_task_paused(task) for task in cls.SHEDDABLE_TASKS}


class KafkaLagProbe:
    """Computes aggregate consumer group lag across all partitions of observations.raw."""

    @classmethod
    def get_consumer_lag(cls) -> int:
        try:
            consumer = KafkaConsumer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id=settings.KAFKA_CONSUMER_GROUP,
                enable_auto_commit=False,
                request_timeout_ms=15000,
            )
            partitions = consumer.partitions_for_topic(settings.KAFKA_TOPIC_RAW_OBSERVATIONS)
            if not partitions:
                consumer.close()
                return 0

            tps = [TopicPartition(settings.KAFKA_TOPIC_RAW_OBSERVATIONS, p) for p in partitions]
            end_offsets = consumer.end_offsets(tps)

            total_lag = 0
            for tp in tps:
                committed = consumer.committed(tp)
                if committed is not None:
                    current_offset = committed
                    lag = max(0, end_offsets[tp] - current_offset)
                    total_lag += lag

            consumer.close()
            return total_lag
        except Exception as err:
            logger.warning(f"Unable to probe Kafka consumer lag: {err}")
            return 0


@celery_app.task(name="app.background_jobs.load_shedder.monitor_consumer_lag_and_shed_load")
def monitor_consumer_lag_and_shed_load():
    """
    Periodic beat task monitoring Kafka consumer lag.
    Sheds load if lag > 5,000 messages; resumes jobs when lag < 500 messages.
    """
    lag = KafkaLagProbe.get_consumer_lag()
    logger.debug(f"Consumer Lag Probe on '{settings.KAFKA_TOPIC_RAW_OBSERVATIONS}': {lag} messages.")

    if lag >= settings.LOAD_SHEDDING_LAG_THRESHOLD:
        logger.critical(
            f"LOAD SHEDDING ACTIVE: Consumer lag ({lag}) exceeds critical limit "
            f"({settings.LOAD_SHEDDING_LAG_THRESHOLD}). Pausing background maintenance jobs in hierarchy order."
        )
        # Apply load shedding in exact order
        for task_name in TaskThrottleCoordinator.SHEDDABLE_TASKS:
            TaskThrottleCoordinator.set_task_state(task_name, paused=True)

        return {"status": "load_shedding_active", "lag": lag}

    elif lag <= settings.LOAD_SHEDDING_RECOVERY_THRESHOLD:
        # Check if tasks were previously paused, and resume in reverse order
        any_paused = any(TaskThrottleCoordinator.get_all_states().values())
        if any_paused:
            logger.info(
                f"LOAD SHEDDING RECOVERY: Lag normalized ({lag} <= {settings.LOAD_SHEDDING_RECOVERY_THRESHOLD}). "
                "Resuming background maintenance jobs."
            )
            for task_name in reversed(TaskThrottleCoordinator.SHEDDABLE_TASKS):
                TaskThrottleCoordinator.set_task_state(task_name, paused=False)

        return {"status": "nominal", "lag": lag}

    return {"status": "monitoring", "lag": lag}