from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from .models import (
    ActiveLearningQueueModel,
    ClassificationResult,
    StateAssignmentResult,
    SystemState,
)
import json

logger = logging.getLogger("skyguard.fusion.active_learning")


class ActiveLearningService:
    """
    Manages human-in-the-loop review routing for low-confidence or conflicting edge states.
    Prevents continuous training instability via batched retraining dispatch.
    """

    @classmethod
    async def evaluate_and_route(
        cls,
        db: AsyncSession,
        state_result: StateAssignmentResult,
        classification_result: Optional[ClassificationResult],
        fused_bundle: Dict[str, Any],
    ) -> Optional[uuid.UUID]:
        """
        Evaluates queue routing rules:
        1. Final state is UNKNOWN.
        2. Calibrated confidence < ACTIVE_LEARNING_UNCERTAINTY_THRESHOLD.
        3. Wide uncertainty band (sparse sample classes).
        """
        route_needed = False
        if state_result.state == SystemState.UNKNOWN:
            route_needed = True
        elif classification_result:
            if classification_result.calibrated_probability < settings.ACTIVE_LEARNING_UNCERTAINTY_THRESHOLD:
                route_needed = True
            elif classification_result.uncertainty_band >= 0.30:
                route_needed = True

        if not route_needed:
            return None
        if hasattr(fused_bundle, "model_dump"):
            clean_bundle = fused_bundle.model_dump(mode="json")
        elif isinstance(fused_bundle, dict):
            clean_bundle = json.loads(json.dumps(fused_bundle, default=str))
        else:
            clean_bundle = {}

        queue_id = uuid.uuid4()
        entry = ActiveLearningQueueModel(
            queue_id=queue_id,
            observation_id=state_result.observation_id,
            station_id=state_result.station_id,
            state=state_result.state.value if hasattr(state_result.state, "value") else str(state_result.state),
            predicted_fault=(
                classification_result.predicted_fault.value
                if classification_result and hasattr(classification_result.predicted_fault, "value")
                else (classification_result.predicted_fault if classification_result else "UNKNOWN_FAULT")
            ),
            raw_score=classification_result.raw_confidence if classification_result else 0.0,
            calibrated_confidence=(
                classification_result.calibrated_probability
                if classification_result
                else state_result.confidence
            ),
            uncertainty_band=classification_result.uncertainty_band if classification_result else 0.40,
            hypotheses=state_result.hypotheses,
            fused_bundle=clean_bundle,  # <-- JSON-safe dictionary
            used_in_training_run=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        await db.commit()
        logger.info(f"Routed observation {state_result.observation_id} to Active Learning Queue.")
        return queue_id

    @classmethod
    async def submit_operator_label(
        cls,
        db: AsyncSession,
        queue_id: uuid.UUID,
        label: str,
        operator_id: str,
        notes: Optional[str] = None,
    ) -> bool:
        stmt = (
            update(ActiveLearningQueueModel)
            .where(ActiveLearningQueueModel.queue_id == queue_id)
            .values(
                operator_label=label,
                operator_notes=notes,
                labeled_by=operator_id,
                labeled_at=datetime.now(timezone.utc),
            )
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount > 0

    @classmethod
    async def get_labeled_batch_for_retraining(
        cls,
        db: AsyncSession,
        limit: int = 1000,
    ) -> List[ActiveLearningQueueModel]:
        stmt = (
            select(ActiveLearningQueueModel)
            .where(
                ActiveLearningQueueModel.operator_label.is_not(None),
                ActiveLearningQueueModel.used_in_training_run == False,
            )
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())