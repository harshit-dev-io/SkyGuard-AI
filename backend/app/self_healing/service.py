from datetime import datetime, timezone
import logging
from typing import Optional, Tuple
import uuid
import numpy as np
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from .feedback_guard import feedback_guard
from .gates import FourGateDecisionChecker
from .models import CorrectionModel, ProvenanceModel
from .provenance_serializer import ProvenanceSerializer
from .schemas import (
    CorrectionCandidateRequest,
    CorrectionResponse,
    GateEvaluationBreakdown,
)
from .ukf_imputer import ukf_imputer

logger = logging.getLogger("skyguard.healing.service")



class SelfHealingOrchestratorService:
    """
    Coordinates Gate verification -> UKF synthesis -> Raw Store Isolation -> Provenance Audit.
    Ensures zero mutation of raw_observations hypertable.
    """

    @classmethod
    async def process_healing_request(
        cls,
        db: AsyncSession,
        candidate: CorrectionCandidateRequest,
    ) -> Tuple[Optional[CorrectionResponse], GateEvaluationBreakdown]:
        """
        Attempts to compute an uncertainty-bounded self-healing correction.
        Aborts if any single gate fails.
        """
        # 1. Filter out candidate neighbors that are in active quarantine
        clean_neighbors = [
            n for n in candidate.candidate_neighbors
            if n.is_clean and n.distance_km <= settings.MAX_NEIGHBOR_DISTANCE_KM
        ]
        clean_station_ids = await feedback_guard.sanitize_candidate_neighbors(
            [n.station_id for n in clean_neighbors]
        )
        qualified_neighbors = [n for n in clean_neighbors if n.station_id in clean_station_ids]

        # 2. Dry-run UKF solver to compute innovation and posterior uncertainty metrics
        if len(qualified_neighbors) >= 1:
            n_vals = [n.temperature for n in qualified_neighbors]
            n_dists = [n.distance_km for n in qualified_neighbors]
            derived_val, post_var, innov, innov_var, chi2 = ukf_imputer.solve(
                prior_mean=candidate.prior_state_mean,
                prior_variance=candidate.prior_state_variance,
                neighbor_measurements=n_vals,
                neighbor_distances=n_dists,
            )
        else:
            derived_val, post_var, innov, innov_var, chi2 = (0.0, 99.0, 99.0, 99.0, 99.0)

        posterior_sigma = float(np.sqrt(post_var))

        # 3. Evaluate 4-Gate Decision Checker
        gate_breakdown = await FourGateDecisionChecker.evaluate_all(
            candidate=candidate,
            innovation=innov,
            innovation_variance=innov_var,
            chi2_metric=chi2,
            posterior_sigma=posterior_sigma,
        )

        # 4. Abort immediately if any gate failed
        if not gate_breakdown.passed:
            logger.warning(
                f"CORRECTION ABORTED for observation {candidate.observation_id} at {candidate.station_id}. "
                f"Reasons: {gate_breakdown.rejection_reasons}"
            )
            return None, gate_breakdown

        # 5. Passed all 4 gates: Persist derived correction record
        correction_id = uuid.uuid4()
        used_neighbor_ids = [n.station_id for n in qualified_neighbors]

        correction_entry = CorrectionModel(
            correction_id=correction_id,
            observation_id=candidate.observation_id,
            station_id=candidate.station_id,
            sensor_id=candidate.sensor_id,
            parameter_target=candidate.parameter_target,
            derived_value=round(derived_val, 3),
            raw_value=round(candidate.raw_value, 3),
            method="ukf_correction",
            model_version=settings.UKF_MODEL_VERSION,
            uncertainty=round(posterior_sigma, 4),
            source_neighbors=used_neighbor_ids,
            gate_results=gate_breakdown.model_dump(mode="json"),
            rejected=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(correction_entry)

        # 6. Generate and Persist Immutable Provenance Record
        provenance_payload = ProvenanceSerializer.build_provenance_payload(
            observation_id=str(candidate.observation_id),
            derived_value=derived_val,
            model_version=settings.UKF_MODEL_VERSION,
            confidence=candidate.calibrated_fault_probability,
            uncertainty=posterior_sigma,
            source_neighbors=used_neighbor_ids,
            climate_region=candidate.climate_region,
            validation_volume=candidate.validation_volume,
            calibration_version=candidate.calibration_version,
            evidence_incomplete=candidate.evidence_incomplete,
        )

        provenance_entry = ProvenanceModel(
            provenance_id=uuid.uuid4(),
            correction_id=correction_id,
            observation_id=candidate.observation_id,
            provenance_payload=provenance_payload,
            created_at=datetime.now(timezone.utc),
        )
        db.add(provenance_entry)

        await db.commit()
        await db.refresh(correction_entry)

        # 7. Apply Feedback Guard: Quarantine this station from neighbor pools
        await feedback_guard.quarantine_station(candidate.station_id)

        logger.info(
            f"Successfully self-healed observation {candidate.observation_id} "
            f"({candidate.station_id}): raw={candidate.raw_value:.2f} -> "
            f"derived={derived_val:.2f} ± {posterior_sigma:.3f}"
        )

        resp = CorrectionResponse(
            correction_id=correction_entry.correction_id,
            observation_id=correction_entry.observation_id,
            station_id=correction_entry.station_id,
            sensor_id=correction_entry.sensor_id,
            parameter_target=correction_entry.parameter_target,
            derived_value=correction_entry.derived_value,
            raw_value=correction_entry.raw_value,
            uncertainty=correction_entry.uncertainty,
            method=correction_entry.method,
            model_version=correction_entry.model_version,
            rejected=correction_entry.rejected,
            source_neighbors=correction_entry.source_neighbors,
            gate_results=gate_breakdown,
            created_at=correction_entry.created_at,
        )
        return resp, gate_breakdown

    @classmethod
    async def reject_correction(
        cls,
        db: AsyncSession,
        correction_id: uuid.UUID,
        operator_id: str,
        rejection_reason: str,
    ) -> bool:
        """
        Allows human operators to reject an imputation, reverting public streams
        to raw-flagged status without mutating raw hypertable rows.
        """
        stmt = (
            update(CorrectionModel)
            .where(CorrectionModel.correction_id == correction_id)
            .values(
                rejected=True,
                rejected_by=operator_id,
                rejection_reason=rejection_reason,
                rejected_at=datetime.now(timezone.utc),
            )
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount > 0