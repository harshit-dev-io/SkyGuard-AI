import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict
from aiokafka import AIOKafkaConsumer

from app.config.database import async_session_factory
from app.config.settings import settings
from .active_learning import ActiveLearningService
from .classifier.fault_classifier import MultiClassFaultClassifier
from .models import (
    FusedEvidenceBundle,
    PersistedClassificationRecord,
    StateAssignmentResult,
)
from .state_machine import StateAssignmentEngine

logger = logging.getLogger("skyguard.fusion.consumer")

EVIDENCE_TOPICS = [
    getattr(settings, "TOPIC_EVIDENCE_TEMPORAL", "evidence.temporal"),
    getattr(settings, "TOPIC_EVIDENCE_SPATIAL", "evidence.spatial"),
    getattr(settings, "TOPIC_EVIDENCE_EVENT", "evidence.event"),
    getattr(settings, "TOPIC_EVIDENCE_HEALTH", "evidence.health"),
]


class LiveEvidencePersisterDaemon:
    """
    Consumes live evidence streams directly from Kafka, merges partial/complete
    bundles in memory, runs the deterministic State Machine + 10-Class Fault Classifier,
    and persists records into PostgreSQL.
    """

    def __init__(self):
        self.consumer: AIOKafkaConsumer | None = None
        self.is_running = False
        self._worker_task: asyncio.Task | None = None
        self.pending_bundles: Dict[str, Dict[str, Any]] = {}
        self.classifier = MultiClassFaultClassifier.load(
            getattr(settings, "MODEL_ARTIFACTS_DIR", "app/fusion_classifier/classifier/artifacts"),
            "et-v1.0.0",
        )

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            *EVIDENCE_TOPICS,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="skyguard-live-persister-group-v2",
            auto_offset_reset="earliest",
            enable_auto_commit=True,
        )
        await self.consumer.start()
        self.is_running = True
        self._worker_task = asyncio.create_task(self._consume_loop())
        logger.info(f"LiveEvidencePersisterDaemon active and listening to {EVIDENCE_TOPICS}")

    async def stop(self):
        self.is_running = False
        if self._worker_task:
            self._worker_task.cancel()
        if self.consumer:
            await self.consumer.stop()
        logger.info("LiveEvidencePersisterDaemon stopped.")

    async def _consume_loop(self):
        while self.is_running:
            try:
                assert self.consumer is not None
                batch = await self.consumer.getmany(timeout_ms=1000, max_records=100)
                for tp, messages in batch.items():
                    for msg in messages:
                        await self._process_evidence_message(msg.value)
            except asyncio.CancelledError:
                break
            except Exception as err:
                logger.error(f"Error in LiveEvidencePersister loop: {err}", exc_info=True)
                await asyncio.sleep(1.0)

    async def _process_evidence_message(self, raw_bytes: bytes):
        try:
            ev = json.loads(raw_bytes.decode("utf-8"))
        except Exception:
            return

        obs_id = ev.get("observation_id")
        station_id = ev.get("station_id")
        engine = ev.get("engine")
        if not obs_id or not engine:
            return

        now_loop = asyncio.get_event_loop().time()

        if obs_id not in self.pending_bundles:
            self.pending_bundles[obs_id] = {
                "station_id": station_id,
                "observation_id": obs_id,
                "engines_present": [],
                "temporal_evidence": None,
                "spatial_evidence": None,
                "event_evidence": None,
                "health_evidence": None,
                "first_seen": now_loop,
            }

        bundle = self.pending_bundles[obs_id]
        if engine not in bundle["engines_present"]:
            bundle["engines_present"].append(engine)
            bundle[f"{engine}_evidence"] = ev

        required_engines = {"temporal", "spatial", "event", "health"}
        has_all = required_engines.issubset(set(bundle["engines_present"]))
        time_elapsed = now_loop - bundle["first_seen"]

        # Fast path: All 4 engines arrived, OR 2.0s bounded timeout expired
        if has_all or time_elapsed > 2.0:
            del self.pending_bundles[obs_id]
            await self._persist_bundle_evaluation(bundle, is_incomplete=not has_all)

    async def _persist_bundle_evaluation(self, b_data: dict, is_incomplete: bool):
        bundle = FusedEvidenceBundle(
            station_id=b_data["station_id"],
            observation_id=b_data["observation_id"],
            evidence_incomplete=is_incomplete,
            engines_present=b_data["engines_present"],
            temporal_evidence=b_data.get("temporal_evidence"),
            spatial_evidence=b_data.get("spatial_evidence"),
            event_evidence=b_data.get("event_evidence"),
            health_evidence=b_data.get("health_evidence"),
            first_received_epoch=b_data["first_seen"],
            emitted_at=datetime.now(timezone.utc),
        )

        clean_bundle_dict = bundle.model_dump(mode="json")
        state_res = StateAssignmentEngine.evaluate(bundle)
        clf_res = None

        if state_res.requires_classification or state_res.state.value in ("SUSPICIOUS", "REGIONAL_FAULT", "UNKNOWN"):
            clf_res = self.classifier.predict(
                fused_bundle_dict=clean_bundle_dict,
                climate_region="composite",
            )

        async with async_session_factory() as session:
            async with session.begin():
                rec = PersistedClassificationRecord(
                    observation_id=bundle.observation_id,
                    station_id=bundle.station_id,
                    assigned_state=state_res.state.value,
                    predicted_fault=clf_res.predicted_fault.value if clf_res else "NOMINAL",
                    calibrated_confidence=clf_res.calibrated_probability if clf_res else state_res.confidence,
                    uncertainty_band=clf_res.uncertainty_band if clf_res else 0.05,
                    evidence_incomplete=bundle.evidence_incomplete,
                    fused_bundle=clean_bundle_dict,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(rec)

                await ActiveLearningService.evaluate_and_route(
                    db=session,
                    state_result=state_res,
                    classification_result=clf_res,
                    fused_bundle=clean_bundle_dict,
                )

        logger.info(f"Persisted classification for {bundle.observation_id} -> {state_res.state.value}")


fused_consumer_daemon = LiveEvidencePersisterDaemon()