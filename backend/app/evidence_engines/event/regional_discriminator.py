from typing import Dict, Tuple


class RegionalEventDiscriminator:
    """
    Strict 4-Clause Event vs Correlated Infrastructure Fault Decision Model[cite: 1, 2].
    Distinguishes genuine meteorological fronts from cascading power/network drops[cite: 1, 2].
    """

    @classmethod
    def evaluate(
        cls,
        local_event_fired: bool,
        corroborated_neighbors_count: int,
        signal_coherence: float,
        shares_correlated_infra: bool,
        k_threshold: int = 2,
    ) -> Tuple[str, Dict[str, float], float]:
        """
        Evaluates 4-clause logic:
        Clause 1: Local flags >= K AND coherent physical signals -> EXTREME_EVENT
        Clause 2: Shared infra AND local flags do NOT fire -> REGIONAL_FAULT
        Clause 3: Contradictory evidence -> UNKNOWN
        Clause 4: Normal operating conditions -> NONE
        """
        # Clause 1: Confirmed Real Extreme Event
        if (
            (local_event_fired or corroborated_neighbors_count >= k_threshold)
            and signal_coherence >= 0.60
        ):
            return (
                "EXTREME_EVENT",
                {"extreme_weather": 0.92, "sensor_fault": 0.08},
                0.92,
            )

        # Clause 2: Regional Infrastructure Collapse / Fault
        if shares_correlated_infra and not local_event_fired and corroborated_neighbors_count < k_threshold:
            return (
                "REGIONAL_FAULT",
                {"extreme_weather": 0.15, "infrastructure_failure": 0.85},
                0.85,
            )

        # Clause 3: Ambiguous / Competing Hypotheses
        if corroborated_neighbors_count > 0 and signal_coherence < 0.60:
            return (
                "UNKNOWN",
                {"extreme_weather": 0.50, "infrastructure_failure": 0.50},
                0.40,
            )

        # Clause 4: Baseline / Quiescent
        return (
            "NONE",
            {"extreme_weather": 0.01, "nominal_conditions": 0.99},
            0.99,
        )