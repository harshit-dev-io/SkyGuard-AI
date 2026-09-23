from typing import Dict, Tuple

CLIMATE_CUSUM_CONFIG: Dict[str, Dict[str, float]] = {
    "indo_gangetic": {"k": 0.5, "h": 4.5, "reset_factor": 0.8},
    "monsoon_coastal": {"k": 0.3, "h": 3.0, "reset_factor": 0.85},
    "arid_desert": {"k": 0.8, "h": 6.0, "reset_factor": 0.75},
    "composite": {"k": 0.5, "h": 4.0, "reset_factor": 0.8},
    "subtropical_humid": {"k": 0.4, "h": 3.8, "reset_factor": 0.8},
}


class ClimateAdaptiveCUSUM:
    """
    Directional Cumulative Sum change detector with parameterized hysteresis buffers[cite: 1, 2].
    Prevents persistent fault flags from isolated microclimatic blips[cite: 1, 2].
    """

    def __init__(self, climate_region: str):
        cfg = CLIMATE_CUSUM_CONFIG.get(climate_region, CLIMATE_CUSUM_CONFIG["composite"])
        self.k: float = cfg["k"]                      # Allowance parameter
        self.h: float = cfg["h"]                      # Decision interval
        self.reset_factor: float = cfg["reset_factor"] # Damped recovery

    def update(
        self,
        residual: float,
        pos_sum: float,
        neg_sum: float,
    ) -> Tuple[float, float, float, bool]:
        """
        Updates CUSUM tracking buffers.
        Returns: (new_pos_sum, new_neg_sum, normalized_cusum_score, threshold_breached)
        """
        new_pos = max(0.0, pos_sum + residual - self.k)
        new_neg = max(0.0, neg_sum - residual - self.k)

        max_accumulated = max(new_pos, new_neg)
        breached = max_accumulated >= self.h

        # Apply soft hysteresis if decaying
        if not breached:
            new_pos *= self.reset_factor
            new_neg *= self.reset_factor

        normalized_score = min(1.0, max_accumulated / self.h)
        return new_pos, new_neg, normalized_score, breached