from typing import Any, Dict, List
import numpy as np


class EvidenceFeatureBuilder:
    """
    Transforms a FusedEvidenceBundle into a normalized feature vector
    for the 10-Class Fault Classifier.
    """

    FEATURE_NAMES: List[str] = [
        "harmonic_residual",
        "cusum_score",
        "edge_agreement_score",
        "spatial_residual",
        "neighbor_count",
        "healthy_neighbor_ratio",
        "infrastructure_correlation_flag",
        "signal_coherence_score",
        "corroborated_count",
        "degradation_slope",
        "ukf_innovation",
        "health_is_degraded",
        "evidence_incomplete_flag",
    ]

    @classmethod
    def extract_features(cls, bundle_dict: Dict[str, Any]) -> np.ndarray:
        temp = bundle_dict.get("temporal_evidence") or {}
        spat = bundle_dict.get("spatial_evidence") or {}
        evt = bundle_dict.get("event_evidence") or {}
        hlth = bundle_dict.get("health_evidence") or {}

        vec = [
            float(temp.get("harmonic_residual", 0.0)),
            float(temp.get("cusum_score", 0.0)),
            float(temp.get("edge_agreement_score", 1.0)),
            float(spat.get("spatial_residual", 0.0)),
            float(spat.get("neighbor_count", 0)),
            float(spat.get("healthy_neighbor_ratio", 1.0)),
            1.0 if spat.get("infrastructure_correlation_flag", False) else 0.0,
            float(evt.get("signal_coherence_score", 0.0)),
            float(evt.get("corroborated_count", 0)),
            float(hlth.get("degradation_slope", 0.0)),
            float(hlth.get("ukf_innovation", 0.0)),
            1.0 if hlth.get("health_state") in ("DEGRADED", "AT_RISK", "FAILED") else 0.0,
            1.0 if bundle_dict.get("evidence_incomplete", False) else 0.0,
        ]

        # NaN/Inf safety guard
        arr = np.nan_to_num(np.array(vec, dtype=np.float32), nan=0.0, posinf=1e4, neginf=-1e4)
        return arr

    @classmethod
    def get_dimension(cls) -> int:
        return len(cls.FEATURE_NAMES)