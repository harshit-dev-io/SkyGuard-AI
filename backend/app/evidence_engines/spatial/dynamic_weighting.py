from typing import Dict, List


class DynamicSpatialWeighting:
    """
    Computes dynamic edge weights across neighbor graphs.
    Enforces the Bad-Neighbor Contamination Guard and detects infrastructure correlation[cite: 1, 2].
    """

    HEALTH_WEIGHTS: Dict[str, float] = {
        "HEALTHY": 1.0,
        "DEGRADED": 0.4,
        "AT_RISK": 0.1,
        "FAILED": 0.0,
    }

    @classmethod
    def evaluate_neighbor_weight(
        cls,
        health_state: str,
        is_operating_under_correction: bool,
    ) -> float:
        """
        Imputation Guard: Any station currently operating under derived or
        corrected status is assigned weight 0.0 to prevent circular feedback loops[cite: 1, 2].
        """
        if is_operating_under_correction:
            return 0.0
        return cls.HEALTH_WEIGHTS.get(health_state.upper(), 0.0)

    @staticmethod
    def detect_infrastructure_correlation(
        target_infra: Dict[str, str],
        neighbor_infras: List[Dict[str, str]],
    ) -> bool:
        """
        Returns True if agreeing neighbors share identical power, backhaul,
        or firmware configurations (susceptible to common-cause failure)[cite: 1].
        """
        if not neighbor_infras:
            return False

        shared_power = sum(
            1 for n in neighbor_infras if n.get("power_segment") == target_infra.get("power_segment")
        )
        shared_backhaul = sum(
            1 for n in neighbor_infras if n.get("backhaul_id") == target_infra.get("backhaul_id")
        )

        ratio_power = shared_power / len(neighbor_infras)
        ratio_bh = shared_backhaul / len(neighbor_infras)

        return ratio_power >= 0.8 or ratio_bh >= 0.8