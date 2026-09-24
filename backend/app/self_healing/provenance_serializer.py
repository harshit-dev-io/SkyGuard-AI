from datetime import datetime, timezone
import json
from typing import Any, Dict, List
from .schemas import ProvenanceBlockSchema


class ProvenanceSerializer:
    """
    Builds the immutable audit block conforming strictly to SkyGuard Stage 8 Specification.
    Includes isotonic calibration context, estimator versioning, and neighbor source chains.
    """

    @classmethod
    def build_provenance_payload(
        cls,
        observation_id: str,
        derived_value: float,
        model_version: str,
        confidence: float,
        uncertainty: float,
        source_neighbors: List[str],
        climate_region: str,
        validation_volume: int,
        calibration_version: str,
        evidence_incomplete: bool,
    ) -> Dict[str, Any]:
        block = ProvenanceBlockSchema(
            source_observation_id=str(observation_id),
            derived_value=round(derived_value, 3),
            method="ukf_correction",
            model_version=model_version,
            estimator_version="skyguard-ukf-state-v2",
            confidence=round(confidence, 4),
            confidence_calibration={
                "method": "isotonic",
                "climate_region": climate_region,
                "validation_volume": validation_volume,
                "calibration_version": calibration_version,
            },
            uncertainty=round(uncertainty, 4),
            source_neighbors=source_neighbors,
            evidence_incomplete=evidence_incomplete,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        # Dump using JSON mode to guarantee clean primitive serialization for Postgres JSONB
        return block.model_dump(mode="json")