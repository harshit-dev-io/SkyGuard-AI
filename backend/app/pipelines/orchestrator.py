from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from backend.app.ingestion.payload_parser import ParsedTelemetry
from backend.app.pipelines.degradation_rul import (
    calculate_health_index_and_rul,
    update_cusum_accumulator,
)
from backend.app.pipelines.disambiguation import (
    EventClassification,
    classify_event,
)
from backend.app.pipelines.kalman_healing import (
    KinematicKalmanFilter1D,
    impute_missing_value,
)
from backend.app.pipelines.spatial_idw import predict_spatial_value
from backend.app.pipelines.tidal_demod import demodulate_pressure


@dataclass
class StationState:
    station_id: str
    cusum: float = 0.0
    kalman_filter: Optional[KinematicKalmanFilter1D] = None
    last_timestamp: Optional[datetime] = None
    historical_timestamps: List[float] = field(default_factory=list)
    historical_residuals: List[float] = field(default_factory=list)


@dataclass
class OrchestratorResult:
    station_id: str
    timestamp: datetime
    raw_pressure: float
    demodulated_pressure: float
    predicted_spatial_pressure: Optional[float]
    classification: EventClassification
    cusum: float
    health_index: float
    rul_days: float
    imputed_pressure: Optional[float]
    qc_state: str


class CentralPipelineOrchestrator:
    """End-to-end pipeline orchestrator processing inbound WIS 2.0 telemetry."""

    def __init__(self) -> None:
        self.stations: Dict[str, StationState] = {}

    def get_or_create_station(self, station_id: str) -> StationState:
        if station_id not in self.stations:
            self.stations[station_id] = StationState(station_id=station_id)
        return self.stations[station_id]

    def process_telemetry(
        self,
        telemetry: ParsedTelemetry,
        neighbor_candidates: Optional[List[Dict[str, Any]]] = None,
        edge_confidence: float = 0.8,
    ) -> OrchestratorResult:
        if neighbor_candidates is None:
            neighbor_candidates = []

        station_state = self.get_or_create_station(telemetry.station_id)

        # 1. Tidal Pressure Demodulation
        p_demod = demodulate_pressure(
            station_pressure=telemetry.p,
            timestamp_utc=telemetry.timestamp,
            station_lat=telemetry.latitude,
            station_lon=telemetry.longitude,
            station_elevation_m=telemetry.elevation,
        )

        # 2. Spatial IDW Prediction
        predicted_p = predict_spatial_value(
            target_lat=telemetry.latitude,
            target_lon=telemetry.longitude,
            target_time=telemetry.timestamp,
            candidates=neighbor_candidates,
            value_key="p_demod",
        )

        # 3. Disambiguation
        if predicted_p is not None:
            classification = classify_event(
                observed_value=p_demod,
                predicted_value=predicted_p,
                edge_confidence=edge_confidence,
            )
        else:
            classification = EventClassification.NOMINAL

        # 4. Sensor Degradation & CUSUM Tracking
        spatial_residual = (
            abs(p_demod - predicted_p) if predicted_p is not None else 0.0
        )
        station_state.cusum = update_cusum_accumulator(
            current_cusum=station_state.cusum,
            residual=spatial_residual,
        )

        # Compute health index & RUL (slope = 0.0 if not enough points)
        health_index, rul_days = calculate_health_index_and_rul(
            drift_slope_per_day=0.0,
            current_cusum=station_state.cusum,
        )

        # 5. Kalman Filter State & Imputation
        dt_hours = 0.0
        if station_state.last_timestamp is not None:
            dt_hours = (
                telemetry.timestamp - station_state.last_timestamp
            ).total_seconds() / 3600.0

        if station_state.kalman_filter is None:
            station_state.kalman_filter = KinematicKalmanFilter1D(
                initial_value=p_demod
            )
        else:
            if dt_hours > 0:
                station_state.kalman_filter.predict(dt_hours)

        imputed_p: Optional[float] = None
        qc_state = "GOOD"

        if classification == EventClassification.SENSOR_FAULT:
            qc_state = "QUARANTINED"
            imputed_p = impute_missing_value(
                station_state.kalman_filter, dt_hours=max(dt_hours, 0.0)
            )
        else:
            station_state.kalman_filter.update(p_demod)

        station_state.last_timestamp = telemetry.timestamp

        return OrchestratorResult(
            station_id=telemetry.station_id,
            timestamp=telemetry.timestamp,
            raw_pressure=telemetry.p,
            demodulated_pressure=p_demod,
            predicted_spatial_pressure=predicted_p,
            classification=classification,
            cusum=station_state.cusum,
            health_index=health_index,
            rul_days=rul_days,
            imputed_pressure=imputed_p,
            qc_state=qc_state,
        )
