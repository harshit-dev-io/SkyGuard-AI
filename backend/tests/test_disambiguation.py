import pytest
from app.pipelines.disambiguation import EventClassification, classify_event


def test_sensor_fault_classification():
    """High edge confidence/residual with large spatial deviation should yield SENSOR_FAULT."""
    classification = classify_event(
        observed_value=1015.0,
        predicted_value=1000.0,
        edge_confidence=0.85,
        spatial_deviation_threshold=3.0,
        edge_confidence_threshold=0.7,
    )
    assert classification == EventClassification.SENSOR_FAULT


def test_validated_microscale_event_classification():
    """High edge confidence/residual with low spatial deviation should yield VALIDATED_MICROSCALE_EVENT."""
    classification = classify_event(
        observed_value=1001.5,
        predicted_value=1000.0,
        edge_confidence=0.90,
        spatial_deviation_threshold=3.0,
        edge_confidence_threshold=0.7,
    )
    assert classification == EventClassification.VALIDATED_MICROSCALE_EVENT


def test_nominal_classification():
    """Standard readings aligning with spatial expectations should yield NOMINAL."""
    classification = classify_event(
        observed_value=1000.5,
        predicted_value=1000.0,
        edge_confidence=0.20,
        spatial_deviation_threshold=3.0,
        edge_confidence_threshold=0.7,
    )
    assert classification == EventClassification.NOMINAL


def test_large_spatial_deviation_low_confidence_fault():
    """Large spatial deviation with low edge confidence should still classify as SENSOR_FAULT."""
    classification = classify_event(
        observed_value=1020.0,
        predicted_value=1000.0,
        edge_confidence=0.30,
        spatial_deviation_threshold=3.0,
        edge_confidence_threshold=0.7,
    )
    assert classification == EventClassification.SENSOR_FAULT
