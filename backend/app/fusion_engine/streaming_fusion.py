from datetime import datetime, timezone
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
    KafkaSource,
)
from pyflink.datastream.functions import KeyedProcessFunction, RuntimeContext
from pyflink.datastream.state import ValueStateDescriptor

from app.config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skyguard.fusion.streaming")
from app.config.settings import settings

class BoundedEvidenceFusionFunction(KeyedProcessFunction):
    """
    Co-groups evidence streams keyed strictly by composite (station_id, observation_id).
    Enforces a strict 2.0-second processing-time timer:
    - If all 4 engine tokens arrive: Emits complete bundle (evidence_incomplete=False).
    - If 2.0s timer fires with partial tokens: Emits bundle immediately without stalling (evidence_incomplete=True).
    """

    def open(self, runtime_context: RuntimeContext):
        self.bundle_state = runtime_context.get_state(
            ValueStateDescriptor("bundle_accumulator", Types.STRING())
        )
        self.timer_state = runtime_context.get_state(
            ValueStateDescriptor("timer_registration", Types.LONG())
        )

    def process_element(self, raw_evidence_json: str, ctx: KeyedProcessFunction.Context):
        try:
            evidence = json.loads(raw_evidence_json)
        except Exception:
            return

        engine_name = evidence.get("engine")
        observation_id = evidence.get("observation_id")
        station_id = evidence.get("station_id")

        if not engine_name or not observation_id:
            return

        current_time_ms = ctx.timer_service().current_processing_time()

        # Load or initialize accumulator
        raw_bundle = self.bundle_state.value()
        if raw_bundle:
            bundle = json.loads(raw_bundle)
        else:
            bundle = {
                "station_id": station_id,
                "observation_id": observation_id,
                "first_received_epoch": current_time_ms / 1000.0,
                "engines_present": [],
                "temporal_evidence": None,
                "spatial_evidence": None,
                "event_evidence": None,
                "health_evidence": None,
            }

            # Register 2.0-second timeout timer on first evidence token arrival
            timeout_ms = current_time_ms + int(settings.FUSION_JOIN_TIMEOUT_SECONDS * 1000)
            ctx.timer_service().register_processing_time_timer(timeout_ms)
            self.timer_state.update(timeout_ms)

        # Merge evidence token
        if engine_name not in bundle["engines_present"]:
            bundle["engines_present"].append(engine_name)
            bundle[f"{engine_name}_evidence"] = evidence

        # All 4 engines accounted for: Fast-path emission
        all_engines = {"temporal", "spatial", "event", "health"}
        if all_engines.issubset(set(bundle["engines_present"])):
            bundle["evidence_incomplete"] = False
            bundle["emitted_at"] = datetime.now(timezone.utc).isoformat()

            # Clean up registered timer
            registered_timer = self.timer_state.value()
            if registered_timer:
                ctx.timer_service().delete_processing_time_timer(registered_timer)

            self.bundle_state.clear()
            self.timer_state.clear()
            yield json.dumps(bundle)
        else:
            self.bundle_state.update(json.dumps(bundle))

    def on_timer(self, timestamp: int, ctx: KeyedProcessFunction.OnTimerContext):
        """Timer fired on missing evidence. Never stall the pipeline."""
        raw_bundle = self.bundle_state.value()
        if not raw_bundle:
            return

        bundle = json.loads(raw_bundle)
        bundle["evidence_incomplete"] = True
        bundle["emitted_at"] = datetime.now(timezone.utc).isoformat()

        logger.warning(
            f"Evidence timeout (2.0s) fired for obs={bundle['observation_id']}. "
            f"Emitting degraded bundle with engines: {bundle['engines_present']}"
        )

        self.bundle_state.clear()
        self.timer_state.clear()
        yield json.dumps(bundle)


def run_fusion_pipeline():
    """Initializes PyFlink fusion topology combining all four Kafka evidence topics."""
    config = Configuration()
    config.set_string("restart-strategy.type", "fixed-delay")
    config.set_string("restart-strategy.fixed-delay.attempts", "3")
    config.set_string("restart-strategy.fixed-delay.delay", "5s")

    env = StreamExecutionEnvironment.get_execution_environment(configuration=config)
    env = StreamExecutionEnvironment.get_execution_environment()
    
    # --- FIX: Register JAR BEFORE building any Kafka sources ---
    backend_root = Path(__file__).resolve().parent.parent.parent
    jar_path = backend_root / "lib" / "flink-sql-connector-kafka-5.0.0-2.2.jar"
    if not jar_path.exists():
        raise FileNotFoundError(f"Kafka connector JAR not found at: {jar_path}")
    
    jar_uri = f"file://{jar_path.resolve()}"
    env.add_jars(jar_uri)
    logger.info(f"Registered Kafka connector JAR with Flink JVM: {jar_uri}")
    # -----------------------------------------------------------
    env.set_parallelism(2)

    # Attach Kafka Connector JAR
    backend_root = Path(__file__).resolve().parent.parent
    jar_path = backend_root / "lib" / "flink-sql-connector-kafka-5.0.0-2.2.jar"
    if jar_path.exists():
        env.add_jars(f"file://{jar_path.resolve()}")

    evidence_topics = [
        settings.TOPIC_EVIDENCE_TEMPORAL,
        settings.TOPIC_EVIDENCE_SPATIAL,
        settings.TOPIC_EVIDENCE_EVENT,
        settings.TOPIC_EVIDENCE_HEALTH,
    ]

    source = (
        KafkaSource.builder()
        .set_bootstrap_servers(settings.KAFKA_BOOTSTRAP_SERVERS)
        .set_topics(*evidence_topics)
        .set_group_id(settings.KAFKA_FUSION_GROUP_ID)
        .set_starting_offsets(KafkaOffsetsInitializer.latest())
        .set_value_only_deserializer(SimpleStringSchema())
        .build()
    )

    sink = (
        KafkaSink.builder()
        .set_bootstrap_servers(settings.KAFKA_BOOTSTRAP_SERVERS)
        .set_record_serializer(
            KafkaRecordSerializationSchema.builder()
            .set_topic(settings.TOPIC_FUSED_BUNDLES)
            .set_value_serialization_schema(SimpleStringSchema())
            .build()
        )
        .set_delivery_guarantee(DeliveryGuarantee.AT_LEAST_ONCE)
        .build()
    )

    stream = env.from_source(source, WatermarkStrategy.no_watermarks(), "Kafka_Evidence_Union_Source")

    def extract_composite_key(raw_json: str) -> str:
        try:
            d = json.loads(raw_json)
            return f"{d.get('station_id')}:{d.get('observation_id')}"
        except Exception:
            return "UNKNOWN:UNKNOWN"

    fused_stream = (
        stream.filter(lambda s: bool(s and s.strip()))
        .key_by(extract_composite_key, key_type=Types.STRING())
        .process(BoundedEvidenceFusionFunction(), output_type=Types.STRING())
    )

    fused_stream.print(" [FUSED_BUNDLE] ")
    fused_stream.sink_to(sink).name("Sink_Fused_Bundles")

    logger.info("Executing SkyGuard AI Streaming Fusion Topology...")
    env.execute("SkyGuard_Evidence_Fusion_Pipeline")


if __name__ == "__main__":
    run_fusion_pipeline()