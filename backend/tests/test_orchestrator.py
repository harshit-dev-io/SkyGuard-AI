from datetime import datetime, timezone, timedelta
from backend.app.ingestion.payload_parser import ParsedTelemetry
from backend.app.pipelines.orchestrator import CentralPipelineOrchestrator
from backend.app.pipelines.disambiguation import EventClassification


def make_parsed_telemetry(
    station_id="STATION_01",
    lat=28.6139,
    lon=77.2090,
    elevation=200.0,
    p=1013.25,
    timestamp=None,
) -> ParsedTelemetry:
    if timestamp is None:
        timestamp = datetime(2023, 10, 25, 12, 0, 0, tzinfo=timezone.utc)
    return ParsedTelemetry(
        station_id=station_id,
        timestamp=timestamp,
        longitude=lon,
        latitude=lat,
        elevation=elevation,
        t=25.0,
        p=p,
        rh=50.0,
        qc_bitmask=0,
        qc_flags={"PHYSICAL_THERMO_VIOLATION": False, "FROZEN_REGISTER_FAULT": False, "THERMODYNAMIC_INVARIANT_VIOLATION": False},
        properties={},
    )


def test_orchestrator_nominal_flow():
    orchestrator = CentralPipelineOrchestrator()
    telemetry = make_parsed_telemetry()

    result = orchestrator.process_telemetry(telemetry)

    assert result.station_id == "STATION_01"
    assert result.raw_pressure == 1013.25
    assert result.demodulated_pressure != 1013.25  # Demodulation applied
    assert result.predicted_spatial_pressure is None  # No neighbors provided
    assert result.classification == EventClassification.NOMINAL
    assert result.qc_state == "GOOD"
    assert result.imputed_pressure is None


def test_orchestrator_with_spatial_neighbors():
    orchestrator = CentralPipelineOrchestrator()
    now = datetime(2023, 10, 25, 12, 0, 0, tzinfo=timezone.utc)
    telemetry = make_parsed_telemetry(timestamp=now)

    neighbors = [
        {
            "latitude": 28.6200,
            "longitude": 77.2100,
            "timestamp": now,
            "p_demod": 1012.0,
            "qc_state": "GOOD",
        },
        {
            "latitude": 28.6100,
            "longitude": 77.2000,
            "timestamp": now,
            "p_demod": 1012.2,
            "qc_state": "GOOD",
        },
    ]

    result = orchestrator.process_telemetry(telemetry, neighbor_candidates=neighbors)

    assert result.predicted_spatial_pressure is not None
    assert abs(result.predicted_spatial_pressure - 1012.1) < 0.5


def test_orchestrator_sensor_fault_and_kalman_imputation():
    orchestrator = CentralPipelineOrchestrator()
    now = datetime(2023, 10, 25, 12, 0, 0, tzinfo=timezone.utc)

    # Initial Step
    telemetry_1 = make_parsed_telemetry(p=1013.25, timestamp=now)
    orchestrator.process_telemetry(telemetry_1)

    # Second step with large pressure spike and close neighbors predicting ~1013.0
    now_2 = now + timedelta(minutes=10)
    telemetry_2 = make_parsed_telemetry(p=1050.0, timestamp=now_2)

    neighbors = [
        {
            "latitude": 28.6140,
            "longitude": 77.2091,
            "timestamp": now_2,
            "p_demod": 1013.0,
            "qc_state": "GOOD",
        }
    ]

    result_2 = orchestrator.process_telemetry(
        telemetry_2, neighbor_candidates=neighbors, edge_confidence=0.9
    )

    assert result_2.classification == EventClassification.SENSOR_FAULT
    assert result_2.qc_state == "QUARANTINED"
    assert result_2.imputed_pressure is not None
    assert abs(result_2.imputed_pressure - 1013.25) < 5.0
    assert result_2.cusum > 0.0
