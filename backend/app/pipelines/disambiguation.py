from enum import Enum
from typing import Union


class EventClassification(str, Enum):
    SENSOR_FAULT = "SENSOR_FAULT"
    VALIDATED_MICROSCALE_EVENT = "VALIDATED_MICROSCALE_EVENT"
    NOMINAL = "NOMINAL"


def classify_event(
    observed_value: float,
    predicted_value: float,
    edge_confidence: float,
    spatial_deviation_threshold: float = 3.0,
    edge_confidence_threshold: float = 0.7,
) -> EventClassification:
    """Classifies an observation based on edge confidence and spatial deviation.

    - High edge confidence + large spatial deviation -> SENSOR_FAULT
    - High edge confidence + low spatial deviation -> VALIDATED_MICROSCALE_EVENT
    - Otherwise -> NOMINAL
    """
    spatial_deviation = abs(observed_value - predicted_value)
    is_high_edge_confidence = edge_confidence >= edge_confidence_threshold
    is_large_spatial_deviation = spatial_deviation >= spatial_deviation_threshold

    if is_high_edge_confidence and is_large_spatial_deviation:
        return EventClassification.SENSOR_FAULT

    if is_high_edge_confidence and not is_large_spatial_deviation:
        return EventClassification.VALIDATED_MICROSCALE_EVENT

    if is_large_spatial_deviation:
        return EventClassification.SENSOR_FAULT

    return EventClassification.NOMINAL
