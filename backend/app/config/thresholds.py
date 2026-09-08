from typing import Dict

# Climate-adaptive CUSUM Köppen slack parameters (k)
KOPPEN_CUSUM_SLACK: Dict[str, float] = {
    "A": 0.5,  # Tropical
    "B": 0.8,  # Arid
    "C": 0.5,  # Temperate
    "D": 0.6,  # Continental
    "E": 0.7,  # Polar
    "DEFAULT": 0.5,
}

# CUSUM Decision Interval (h) threshold for flagging drift
CUSUM_DECISION_INTERVAL: float = 4.0

# WMO Health Index Thresholds (0.0 to 1.0)
WMO_HEALTH_INDEX_EXCELLENT: float = 0.90
WMO_HEALTH_INDEX_GOOD: float = 0.75
WMO_HEALTH_INDEX_WARNING: float = 0.50
WMO_HEALTH_INDEX_CRITICAL: float = 0.25

# RUL and Drift Thresholds
THEIL_SEN_DRIFT_THRESHOLD_PER_DAY: float = 0.1
MAX_RETROSPECTIVE_REWIND_HOURS: float = 72.0
