import statistics
from typing import List, Tuple


def estimate_drift_theil_sen(
    timestamps_days: List[float], residuals: List[float]
) -> float:
    """Estimates long-term calibration drift rate (units/day) using the Theil-Sen estimator.

    Computes the median of slopes across all pairwise points (i < j).
    """
    n = len(timestamps_days)
    if n < 2 or len(residuals) != n:
        return 0.0

    slopes: List[float] = []
    for i in range(n):
        for j in range(i + 1, n):
            dx = timestamps_days[j] - timestamps_days[i]
            if dx != 0:
                dy = residuals[j] - residuals[i]
                slopes.append(dy / dx)

    if not slopes:
        return 0.0

    return float(statistics.median(slopes))


def update_cusum_accumulator(
    current_cusum: float,
    residual: float,
    target_mean: float = 0.0,
    slack_k: float = 0.5,
) -> float:
    """Updates a climate-adaptive CUSUM accumulator tracking cumulative positive deviation.

    C_t = max(0, C_{t-1} + (|residual - target_mean| - slack_k))
    """
    deviation = abs(residual - target_mean)
    updated = current_cusum + (deviation - slack_k)
    return max(0.0, float(updated))


def calculate_health_index_and_rul(
    drift_slope_per_day: float,
    current_cusum: float,
    max_cusum_threshold: float = 50.0,
    max_allowed_drift_per_day: float = 0.5,
    max_drift_tolerance: float = 5.0,
) -> Tuple[float, float]:
    """Computes the WMO Health Index (0 - 100 scale) and Remaining Useful Life (RUL) in days.

    Returns:
        Tuple[float, float]: (health_index, rul_days)
    """
    cusum_penalty = min(100.0, (current_cusum / max_cusum_threshold) * 50.0)
    abs_drift = abs(drift_slope_per_day)
    drift_penalty = min(100.0, (abs_drift / max_allowed_drift_per_day) * 50.0)

    health_index = max(0.0, min(100.0, 100.0 - (cusum_penalty + drift_penalty)))

    if abs_drift > 0:
        remaining_cusum_headroom = max(0.0, max_cusum_threshold - current_cusum)
        rul_cusum = remaining_cusum_headroom / abs_drift
        rul_drift = max_drift_tolerance / abs_drift
        rul_days = max(0.0, min(rul_cusum, rul_drift))
    else:
        rul_days = 365.0 if health_index > 0 else 0.0

    return round(health_index, 2), round(rul_days, 2)
