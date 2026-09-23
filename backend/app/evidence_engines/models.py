from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RawObservationEvent(BaseModel):
    """Raw payload structure ingested from observations.raw."""
    station_id: str
    sensor_id: str
    timestamp: datetime
    sequence: int
    temperature: float
    pressure: float
    humidity: float
    wind_speed: float
    wind_direction: float
    rainfall: float
    edge_flags: List[str] = Field(default_factory=list)
    edge_residual: float
    local_event_flag: bool = False
    model_version: str = "tinyml-v3"
    firmware_version: str = "fw-1.4.2"
    battery_voltage: float
    elevation: Optional[float] = 0.0
    terrain: Optional[str] = "plain"
    climate_region: Optional[str] = "indo_gangetic"
    power_segment: Optional[str] = "GRID-NORTH"
    backhaul_id: Optional[str] = "BH-4G-01"


class TemporalEvidence(BaseModel):
    engine: str = "temporal"
    station_id: str
    observation_id: str
    harmonic_residual: float
    cusum_score: float
    edge_agreement_score: float
    confidence: float
    produced_at: str


class SpatialEvidence(BaseModel):
    engine: str = "spatial"
    station_id: str
    observation_id: str
    spatial_residual: float
    neighbor_count: int
    healthy_neighbor_ratio: float
    infrastructure_correlation_flag: bool
    confidence: float
    produced_at: str


class EventEvidence(BaseModel):
    engine: str = "event"
    station_id: str
    observation_id: str
    event_state: str  # EXTREME_EVENT | REGIONAL_FAULT | UNKNOWN | NONE
    corroborated_count: int
    signal_coherence_score: float
    infra_conflict_flag: bool
    hypotheses: Dict[str, float]
    confidence: float
    produced_at: str


class HealthEvidence(BaseModel):
    engine: str = "health"
    station_id: str
    observation_id: str
    sensor_id: str
    degradation_slope: float
    ukf_state_estimate: float
    ukf_innovation: float
    health_state: str  # HEALTHY | DEGRADED | AT_RISK | FAILED
    confidence: float
    produced_at: str