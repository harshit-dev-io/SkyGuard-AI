import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Optional
import uuid
import aiomqtt
from aiokafka import AIOKafkaProducer

from app.config.database import async_session_factory
from app.config.settings import settings
from app.ingestion_pipeline.models import (
    DeadLetterObservationModel,
    RawObservationModel,
)
from .redis_client import redis_buffer
from .schemas import DataSource, EdgeTelemetryPayload

logger = logging.getLogger("skyguard.ingest.worker")


class IngestionPipelineWorker:
    def __init__(self):
        self.client: Optional[aiomqtt.Client] = None
        self.kafka_producer: Optional[AIOKafkaProducer] = None
        self.is_running: bool = False
        self._worker_task: Optional[asyncio.Task] = None
        self.topic = "telemetry/raw/#"

    async def start(self):
        try:
            await redis_buffer.connect()

            # Initialize Kafka Producer for observations.raw
            self.kafka_producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                client_id=f"{getattr(settings, 'KAFKA_CLIENT_ID', 'skyguard')}-raw-producer",
            )
            await self.kafka_producer.start()

            self.is_running = True
            self._worker_task = asyncio.create_task(self._consume_loop())
            logger.info("Ingestion pipeline worker started (Listening to EMQX MQTT, forwarding to Kafka).")
        except Exception as err:
            logger.error(f"Failed to initialize Ingestion Worker: {err}", exc_info=True)
            raise err

    async def stop(self):
        self.is_running = False
        if self._worker_task:
            self._worker_task.cancel()
        if self.kafka_producer:
            await self.kafka_producer.stop()
        await redis_buffer.disconnect()
        logger.info("Ingestion pipeline worker stopped.")

    async def _consume_loop(self):
        while self.is_running:
            try:
                async with aiomqtt.Client("localhost", port=1883) as client:
                    self.client = client
                    await client.subscribe(self.topic)
                    logger.info(f"Connected to EMQX Broker and subscribed to {self.topic}")

                    async for message in client.messages:
                        if not self.is_running:
                            break

                        await self.process_raw_message(
                            message_bytes=message.payload,
                            source_ip="EMQX_MQTT_DIRECT",
                            data_source=DataSource.NATIVE_EDGE,
                        )
            except asyncio.CancelledError:
                break
            except Exception as err:
                logger.error(f"MQTT connection error in consumer loop: {err}. Retrying in 3s...", exc_info=True)
                await asyncio.sleep(3.0)

    async def process_raw_message(
        self,
        message_bytes: bytes,
        source_ip: str,
        data_source: DataSource,
    ) -> Optional[uuid.UUID]:
        raw_text = message_bytes.decode("utf-8", errors="replace")
        arrival_time = datetime.now(timezone.utc)
        arrival_epoch = arrival_time.timestamp()

        # 1. Parse JSON & Validate Schema
        try:
            parsed_json = json.loads(raw_text)
            telemetry = EdgeTelemetryPayload.model_validate(parsed_json)
        except Exception as validation_err:
            logger.warning(f"Schema violation detected. Quarantining: {validation_err}")
            await self.quarantine_dead_letter(
                raw_payload=raw_text,
                error_reason=str(validation_err),
                source_ip=source_ip,
            )
            return None

        # 2. Redis Deduplication (SET NX EX 86400)
        is_unique = await redis_buffer.check_and_set_dedup(
            station_id=telemetry.station_id,
            sensor_id=telemetry.sensor_id,
            sequence=telemetry.sequence,
        )
        if not is_unique:
            logger.info(
                f"Duplicate record dropped: {telemetry.station_id} | "
                f"seq={telemetry.sequence} | sensor={telemetry.sensor_id}"
            )
            return None

        # 3. Clock-Drift Analysis
        clock_suspect = False
        prev_state = await redis_buffer.get_and_set_last_known_state(
            station_id=telemetry.station_id,
            sequence=telemetry.sequence,
            timestamp_epoch=telemetry.timestamp.timestamp(),
        )

        if prev_state:
            prev_seq = prev_state["sequence"]
            prev_time_epoch = prev_state["timestamp"]
            current_time_epoch = telemetry.timestamp.timestamp()

            if telemetry.sequence > prev_seq:
                delta_seconds = current_time_epoch - prev_time_epoch
                if delta_seconds < settings.CLOCK_DRIFT_MAX_BACKWARD_SECONDS:
                    clock_suspect = True
                    logger.warning(
                        f"Clock-drift flagged: {telemetry.station_id} sequence progressed "
                        f"({prev_seq} -> {telemetry.sequence}) but timestamp regressed by {delta_seconds}s"
                    )

        # 4. De-jitter Buffering (30s window)
        late_arrival = await redis_buffer.stage_in_dejitter(
            station_id=telemetry.station_id,
            sequence=telemetry.sequence,
            raw_payload_json=raw_text,
            arrival_epoch=arrival_epoch,
        )

        # 5. Persist Immutable Raw Record to TimescaleDB (Write-Before-Analysis)
        obs_id = uuid.uuid4()
        async with async_session_factory() as session:
            async with session.begin():
                raw_entry = RawObservationModel(
                    observation_id=obs_id,
                    station_id=telemetry.station_id,
                    sensor_id=telemetry.sensor_id,
                    sequence=telemetry.sequence,
                    timestamp=telemetry.timestamp,
                    received_at=arrival_time,
                    payload=parsed_json,
                    data_source=data_source.value,
                    clock_suspect=clock_suspect,
                    late_arrival=late_arrival,
                )
                session.add(raw_entry)

        # 6. CRITICAL FIX: Forward to Kafka 'observations.raw' for Flink
        if self.kafka_producer:
            # Partition Key MUST be station_id for deterministic ordering
            kafka_payload = telemetry.model_dump_json().encode("utf-8")
            await self.kafka_producer.send_and_wait(
                settings.KAFKA_TOPIC_RAW_OBSERVATIONS,
                key=telemetry.station_id.encode("utf-8"),
                value=kafka_payload,
            )

        logger.debug(
            f"Stored raw record and forwarded to Kafka: {telemetry.station_id} | "
            f"seq={telemetry.sequence} | late={late_arrival} | suspect={clock_suspect}"
        )
        return obs_id

    async def quarantine_dead_letter(
        self,
        raw_payload: str,
        error_reason: str,
        source_ip: str,
    ):
        """Persists defective payload to dead_letter_observations table."""
        dlq_id = uuid.uuid4()
        async with async_session_factory() as session:
            async with session.begin():
                dlq_record = DeadLetterObservationModel(
                    id=dlq_id,
                    raw_payload=raw_payload,
                    error_reason=error_reason,
                    source_ip=source_ip,
                    quarantined_at=datetime.now(timezone.utc),
                    replayed=False,
                )
                session.add(dlq_record)


pipeline_worker = IngestionPipelineWorker()