from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RegionSummary(BaseModel):
    id: str = Field(..., description="Region / Climate Zone identifier")
    name: str = Field(..., description="Display name of meteorological region")
    code: str = Field(..., description="Region short code")
    capital: str = Field("Observatory Node", description="Regional meteorological center")
    center: List[float] = Field(..., description="Geographic centroid [latitude, longitude]")
    bounds: List[List[float]] = Field(..., description="Spatial bounding box [[min_lat, min_lng], [max_lat, max_lng]]")
    station_count: int = Field(0, description="Total AWS nodes in region")
    healthy: int = Field(0, description="Nominal operational stations")
    anomalies: int = Field(0, description="Stations under anomalous conditions")
    faults: int = Field(0, description="Stations with confirmed hardware faults")
    drift: int = Field(0, description="Stations exhibiting calibration drift")
    unknown: int = Field(0, description="Stations awaiting classification")
    district_count: int = Field(1, description="Number of sub-regional clusters")


class DistrictSummary(BaseModel):
    id: str = Field(..., description="Sub-cluster identifier")
    name: str = Field(..., description="Sub-cluster name")
    region_id: str = Field(..., description="Parent region identifier")
    region_name: str = Field(..., description="Parent region name")
    center: List[float] = Field(..., description="Centroid [lat, lng]")
    bounds: List[List[float]] = Field(..., description="Bounding box")
    station_count: int = Field(0)
    healthy: int = Field(0)
    anomalies: int = Field(0)
    faults: int = Field(0)
    drift: int = Field(0)
    unknown: int = Field(0)
    elevation: float = Field(200.0)


class StationTelemetry(BaseModel):
    temperature: Optional[float] = None
    relative_humidity: Optional[float] = None
    atmospheric_pressure: Optional[float] = None
    dew_point: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[str] = None
    rainfall_rate: Optional[float] = None
    solar_radiation: Optional[float] = None
    timestamp: Optional[str] = None


class StationDetail(BaseModel):
    id: str = Field(..., description="Station alphanumeric identifier")
    name: str = Field(..., description="Official station designation")
    district_id: str = Field("default", description="Sub-district / cluster")
    district_name: str = Field("Default Sector", description="Sub-district name")
    region_id: str = Field(..., description="Climate region or state ID")
    region_name: str = Field(..., description="Climate region name")
    latitude: float
    longitude: float
    elevation: float
    status: str = Field("HEALTHY", description="Authoritative operational state")
    status_label: str = Field("Healthy", description="Human-readable state")
    wsi: Optional[str] = None
    firmware_version: str = "fw-1.4.2"
    telemetry: Optional[StationTelemetry] = None
    sensor_health: Dict[str, str] = Field(default_factory=dict)
    confidence: float = 1.0


class SensorHealthItem(BaseModel):
    sensor_id: str
    health: str
    score: float


class CommunicationTelemetry(BaseModel):
    status: str
    last_seen: Optional[str] = None
    packet_loss_percent: float = 0.0


class StationHealthResponse(BaseModel):
    station_id: str
    health: str
    health_score: float
    observation_confidence: float
    communication: CommunicationTelemetry
    sensors: List[SensorHealthItem] = Field(default_factory=list)


class StationRULResponse(BaseModel):
    station_id: str
    sensor_id: Optional[str] = None
    rul_days: Optional[int] = None
    lower_bound_days: Optional[int] = None
    upper_bound_days: Optional[int] = None
    confidence: float = 0.95
    status: str = "HEALTHY"
    model_version: str = "rul-v2.0"
    reason: Optional[str] = None


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    properties: Dict[str, Any]
    geometry: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


class NearbyStationItem(BaseModel):
    station_id: str
    name: str
    latitude: float
    longitude: float
    elevation: float
    distance_km: float
    status: str
    status_label: str
    wsi: Optional[str] = None
    temperature: Optional[float] = None
    relative_humidity: Optional[float] = None
    atmospheric_pressure: Optional[float] = None
    temperature_delta: Optional[float] = None
    humidity_delta: Optional[float] = None
    pressure_delta: Optional[float] = None
    spatial_correlation: float = 0.98


class StationNearbyResponse(BaseModel):
    target_station_id: str
    target_station_name: str
    target_latitude: float
    target_longitude: float
    target_telemetry: Optional[StationTelemetry] = None
    neighbor_count: int
    neighbors: List[NearbyStationItem]
    consensus_status: str
    spatial_consistency_score: float
    anomaly_isolation_flag: bool = False


class InvariantCheckResult(BaseModel):
    name: str
    formula: str
    status: str  # PASS / WARN / FAIL
    observed_value: str
    expected_range: str
    detail: str


class StandardizedStationReport(BaseModel):
    report_id: str
    generated_at: str
    compliance_standard: str = "WMO-No. 8 / WIS2 Manual on AWS Quality Assurance"
    station_id: str
    station_name: str
    wsi: str
    climate_region: str
    terrain: str
    coordinates: Dict[str, float]
    elevation_meters: float
    firmware_version: str
    uptime_percentage: float
    current_status: str
    telemetry_snapshot: Optional[StationTelemetry] = None
    physical_invariants: List[InvariantCheckResult]
    sensor_health_matrix: Dict[str, str]
    overall_health_score: float
    remaining_useful_life_days: int
    spatial_consensus_summary: Dict[str, Any]
    quality_flag: str  # e.g. QC-PASSED, QC-FLAGGED, QC-DERIVED
    certifying_authority: str = "SkyGuard AI Meteorological Quality Assurance Daemon"
