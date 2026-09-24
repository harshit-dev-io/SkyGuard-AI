from datetime import datetime, timezone
import logging
from typing import Dict, Tuple

from .models import FusedEvidenceBundle, StateAssignmentResult, SystemState

logger = logging.getLogger("skyguard.fusion.state_machine")


class StateAssignmentEngine:
    """
    Deterministic State Machine assigning exactly one of 7 system states.
    Adheres strictly to the principle: ANOMALY != FAULT.
    Routes SUSPICIOUS or ambiguous states to the 10-Class Fault Classifier.
    """

    @classmethod
    def evaluate(cls, bundle: FusedEvidenceBundle) -> StateAssignmentResult:
        now = datetime.now(timezone.utc)
        station_id = bundle.station_id
        observation_id = bundle.observation_id

        temp = bundle.temporal_evidence or {}
        spat = bundle.spatial_evidence or {}
        evt = bundle.event_evidence or {}
        hlth = bundle.health_evidence or {}

        harmonic_res = abs(temp.get("harmonic_residual", 0.0))
        cusum_score = temp.get("cusum_score", 0.0)
        spatial_res = abs(spat.get("spatial_residual", 0.0))
        infra_correlated = spat.get("infrastructure_correlation_flag", False)
        event_state = evt.get("event_state", "NONE")
        signal_coherence = evt.get("signal_coherence_score", 0.0)
        health_state = hlth.get("health_state", "HEALTHY")
        deg_slope = abs(hlth.get("degradation_slope", 0.0))

        # ---------------------------------------------------------------------
        # Clause A: COMMUNICATION_FAILURE
        # (Missing payloads, telemetry gaps, dead backhaul heartbeats)
        # ---------------------------------------------------------------------
        if "COMMUNICATION_FAULT" in str(temp.get("edge_flags", [])):
            return cls._build_result(
                station_id, observation_id, SystemState.COMMUNICATION_FAILURE,
                confidence=0.98, hypotheses={"communication_loss": 0.98, "sensor_fault": 0.02},
                bundle=bundle, requires_classification=False, now=now,
            )

        # ---------------------------------------------------------------------
        # Clause B: REGIONAL_EXTREME_EVENT (Discriminator Clause 1)
        # (Corroborated across neighbors + coherent physical propagation)
        # ---------------------------------------------------------------------
        if event_state == "EXTREME_EVENT" and signal_coherence >= 0.60:
            return cls._build_result(
                station_id, observation_id, SystemState.REGIONAL_EXTREME_EVENT,
                confidence=0.94, hypotheses={"regional_storm": 0.94, "correlated_fault": 0.06},
                bundle=bundle, requires_classification=False, now=now,
            )

        # ---------------------------------------------------------------------
        # Clause C: REGIONAL_FAULT (Discriminator Clause 2)
        # (Correlated infrastructure signature without local physical shock)
        # ---------------------------------------------------------------------
        if (event_state == "REGIONAL_FAULT" or infra_correlated) and (
            harmonic_res > 3.0 or spatial_res > 2.5
        ) and signal_coherence < 0.30:
            return cls._build_result(
                station_id, observation_id, SystemState.REGIONAL_FAULT,
                confidence=0.89, hypotheses={"infrastructure_failure": 0.89, "extreme_weather": 0.11},
                bundle=bundle, requires_classification=True, now=now,
            )

        # ---------------------------------------------------------------------
        # Clause D: LOCALIZED_EXTREME_EVENT
        # (Isolated physical microburst: local event fired, spatial consensus bypassed)
        # ---------------------------------------------------------------------
        if evt.get("local_event_flag", False) and harmonic_res > 2.5 and deg_slope < 0.015:
            return cls._build_result(
                station_id, observation_id, SystemState.LOCALIZED_EXTREME_EVENT,
                confidence=0.91, hypotheses={"microburst_or_cloudburst": 0.91, "sensor_shock": 0.09},
                bundle=bundle, requires_classification=False, now=now,
            )

        # ---------------------------------------------------------------------
        # Clause E: UNKNOWN (Degraded evidence, contradictory signals)
        # ---------------------------------------------------------------------
        if bundle.evidence_incomplete and (harmonic_res > 2.0 or spatial_res > 2.0):
            return cls._build_result(
                station_id, observation_id, SystemState.UNKNOWN,
                confidence=0.45, hypotheses={"data_missing": 0.50, "unverified_fault": 0.50},
                bundle=bundle, requires_classification=True, now=now,
            )

        # ---------------------------------------------------------------------
        # Clause F: SUSPICIOUS (Statistically anomalous; needs 10-Class Classifier)
        # ---------------------------------------------------------------------
        if (
            cusum_score > 0.40
            or spatial_res > 1.8
            or health_state in ("DEGRADED", "AT_RISK")
            or deg_slope > 0.02
        ):
            return cls._build_result(
                station_id, observation_id, SystemState.SUSPICIOUS,
                confidence=0.75, hypotheses={"sensor_degradation": 0.65, "incipient_anomaly": 0.35},
                bundle=bundle, requires_classification=True, now=now,
            )

        # ---------------------------------------------------------------------
        # Clause G: NORMAL (Nominal baseline conditions)
        # ---------------------------------------------------------------------
        return cls._build_result(
            station_id, observation_id, SystemState.NORMAL,
            confidence=0.99, hypotheses={"nominal": 0.99},
            bundle=bundle, requires_classification=False, now=now,
        )

    @staticmethod
    def _build_result(
        station_id: str,
        observation_id: str,
        state: SystemState,
        confidence: float,
        hypotheses: Dict[str, float],
        bundle: FusedEvidenceBundle,
        requires_classification: bool,
        now: datetime,
    ) -> StateAssignmentResult:
        return StateAssignmentResult(
            station_id=station_id,
            observation_id=observation_id,
            state=state,
            confidence=confidence,
            hypotheses=hypotheses,
            evidence_incomplete=bundle.evidence_incomplete,
            requires_classification=requires_classification,
            assigned_at=now,
        )