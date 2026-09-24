import json
import logging
from pathlib import Path

from pyflink.common import Configuration, SimpleStringSchema, Types, WatermarkStrategy
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors.kafka import (
    DeliveryGuarantee,
    KafkaOffsetsInitializer,
    KafkaRecordSerializationSchema,
    KafkaSink,
    KafkaSinkBuilder,
    KafkaSource,
    KafkaSourceBuilder,
)

from app.config.settings import settings
from .event.event_engine import EventValidationEngine
from .health.health_engine import SensorHealthEngine
from .spatial.spatial_engine import SpatialConsensusEngine
from .temporal.temporal_engine import TemporalEvidenceEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skyguard.evidence.pipeline")


def apply_kafka_security(builder: KafkaSourceBuilder | KafkaSinkBuilder):
    """Applies SASL/SSL credentials to Flink Kafka connectors if configured."""
    sec_proto = getattr(settings, "KAFKA_SECURITY_PROTOCOL", "PLAINTEXT")
    if sec_proto in ("SASL_PLAINTEXT", "SASL_SSL", "SSL"):
        builder.set_property("security.protocol", sec_proto)

    sasl_mech = getattr(settings, "KAFKA_SASL_MECHANISM", None)
    sasl_user = getattr(settings, "KAFKA_SASL_USERNAME", None)
    sasl_pass = getattr(settings, "KAFKA_SASL_PASSWORD", None)

    if sasl_mech and sasl_user and sasl_pass:
        builder.set_property("sasl.mechanism", sasl_mech)
        jaas_cfg = (
            f'org.apache.flink.kafka.shaded.org.apache.kafka.common.security.plain.PlainLoginModule required '
            f'username="{sasl_user}" password="{sasl_pass}";'
        )
        builder.set_property("sasl.jaas.config", jaas_cfg)


def build_kafka_sink(topic: str) -> KafkaSink:
    """Configures an at-least-once Kafka Sink for structured evidence topics."""
    sink_builder = (
        KafkaSink.builder()
        .set_bootstrap_servers(settings.KAFKA_BOOTSTRAP_SERVERS)
        .set_record_serializer(
            KafkaRecordSerializationSchema.builder()
            .set_topic(topic)
            .set_value_serialization_schema(SimpleStringSchema())
            .build()
        )
        .set_delivery_guarantee(DeliveryGuarantee.AT_LEAST_ONCE)
    )
    apply_kafka_security(sink_builder)
    return sink_builder.build()


def is_valid_json_observation(raw_str: str) -> bool:
    """Discards empty messages, newlines, and non-JSON corruption."""
    if not raw_str or not raw_str.strip():
        return False
    try:
        data = json.loads(raw_str)
        return isinstance(data, dict) and "station_id" in data
    except Exception:
        return False


def extract_station_id(raw_json: str) -> str:
    """Safely extracts station_id key."""
    try:
        return json.loads(raw_json).get("station_id", "UNKNOWN")
    except Exception:
        return "UNKNOWN"


def run_pipeline():
    config = Configuration()
    config.set_string("restart-strategy.type", "fixed-delay")
    config.set_string("restart-strategy.fixed-delay.attempts", "3")
    config.set_string("restart-strategy.fixed-delay.delay", "5s")

    env = StreamExecutionEnvironment.get_execution_environment(configuration=config)
    env.set_parallelism(settings.FLINK_PARALLELISM)

    # Checkpoint Configuration
    env.enable_checkpointing(settings.CHECKPOINT_INTERVAL_MS)
    env.get_checkpoint_config().set_checkpoint_timeout(settings.CHECKPOINT_TIMEOUT_MS)
    env.get_checkpoint_config().set_min_pause_between_checkpoints(
        settings.MIN_PAUSE_BETWEEN_CHECKPOINTS_MS
    )

    # Resolve and register Kafka Connector JAR
    backend_root = Path(__file__).resolve().parent.parent.parent
    jar_path = backend_root / "lib" / "flink-sql-connector-kafka-5.0.0-2.2.jar"
    if not jar_path.exists():
        raise FileNotFoundError(f"Kafka connector JAR not found at: {jar_path}")

    jar_uri = f"file://{jar_path.resolve()}"
    env.add_jars(jar_uri)
    logger.info(f"Registered Kafka connector JAR with Flink JVM: {jar_uri}")

    # Kafka Raw Ingestion Source
    source_builder = (
        KafkaSource.builder()
        .set_bootstrap_servers(settings.KAFKA_BOOTSTRAP_SERVERS)
        .set_topics(settings.KAFKA_TOPIC_RAW_OBSERVATIONS)
        .set_group_id(f"{settings.KAFKA_GROUP_ID}-clean-v1")
        .set_starting_offsets(KafkaOffsetsInitializer.earliest())
        .set_value_only_deserializer(SimpleStringSchema())
    )
    apply_kafka_security(source_builder)
    kafka_source = source_builder.build()

    raw_stream = env.from_source(
        source=kafka_source,
        watermark_strategy=WatermarkStrategy.no_watermarks(),
        source_name="Kafka_Raw_Observations_Source",
    )

    # 1. Sanitize stream: Drop blanks and corrupt payloads
    clean_stream = raw_stream.filter(is_valid_json_observation)

    # 2. Key by station_id with explicit String key_type
    keyed_stream = clean_stream.key_by(
        extract_station_id,
        key_type=Types.STRING(),
    )

    # -------------------------------------------------------------------------
    # 1. Temporal Engine
    # -------------------------------------------------------------------------
    temporal_stream = keyed_stream.process(
        TemporalEvidenceEngine(),
        output_type=Types.STRING(),
    )
    temporal_stream.print(" [EVIDENCE:TEMPORAL] ")
    temporal_stream.sink_to(
        build_kafka_sink(settings.TOPIC_EVIDENCE_TEMPORAL)
    ).name("Sink_Evidence_Temporal")

    # -------------------------------------------------------------------------
    # 2. Spatial Engine
    # -------------------------------------------------------------------------
    spatial_stream = keyed_stream.process(
        SpatialConsensusEngine(),
        output_type=Types.STRING(),
    )
    spatial_stream.print(" [EVIDENCE:SPATIAL] ")
    spatial_stream.sink_to(
        build_kafka_sink(settings.TOPIC_EVIDENCE_SPATIAL)
    ).name("Sink_Evidence_Spatial")

    # -------------------------------------------------------------------------
    # 3. Event Engine
    # -------------------------------------------------------------------------
    event_stream = keyed_stream.process(
        EventValidationEngine(),
        output_type=Types.STRING(),
    )
    event_stream.print(" [EVIDENCE:EVENT] ")
    event_stream.sink_to(
        build_kafka_sink(settings.TOPIC_EVIDENCE_EVENT)
    ).name("Sink_Evidence_Event")

    # -------------------------------------------------------------------------
    # 4. Health Engine
    # -------------------------------------------------------------------------
    health_stream = keyed_stream.process(
        SensorHealthEngine(),
        output_type=Types.STRING(),
    )
    health_stream.print(" [EVIDENCE:HEALTH] ")
    health_stream.sink_to(
        build_kafka_sink(settings.TOPIC_EVIDENCE_HEALTH)
    ).name("Sink_Evidence_Health")

    logger.info("Executing SkyGuard AI Parallel Evidence Engines Flink Topology...")
    env.execute("SkyGuard_Parallel_Evidence_Engines")


if __name__ == "__main__":
    run_pipeline()