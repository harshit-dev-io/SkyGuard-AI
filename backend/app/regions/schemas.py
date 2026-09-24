from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RegionSummary(BaseModel):
    id: str = Field(..., description="Unique slug for the region, e.g. haryana")
    name: str = Field(..., description="Display name of the state/UT")
    code: str = Field(..., description="Two-letter state code, e.g. HR")
    capital: str = Field(..., description="Capital city")
    center: List[float] = Field(..., description="[Latitude, Longitude] center coordinate")
    bounds: List[List[float]] = Field(..., description="[[South, West], [North, East]] bounding box")
    station_count: int = Field(..., description="Total AWS stations in region")
    healthy: int = Field(..., description="Healthy stations")
    anomalies: int = Field(..., description="Anomalous / extreme event stations")
    faults: int = Field(..., description="Hardware fault stations")
    drift: int = Field(0, description="Calibration drift stations")
    unknown: int = Field(0, description="Unconfirmed / dual anomaly stations")
    district_count: int = Field(..., description="Number of administrative districts")

class DistrictSummary(BaseModel):
    id: str = Field(..., description="Unique district slug, e.g. ambala")
    name: str = Field(..., description="Display name of the district")
    region_id: str = Field(..., description="Parent region ID")
    region_name: str = Field(..., description="Parent region name")
    center: List[float] = Field(..., description="[Latitude, Longitude]")
    bounds: List[List[float]] = Field(..., description="Bounding box")
    station_count: int = Field(..., description="Total stations in district")
    healthy: int = Field(..., description="Healthy stations")
    anomalies: int = Field(..., description="Stations under local extreme events")
    faults: int = Field(..., description="Stations with detected sensor faults")
    drift: int = Field(0, description="Stations with calibration drift")
    unknown: int = Field(0, description="Unknown status")
    elevation: int = Field(250, description="Average elevation in meters")

class StationTelemetry(BaseModel):
    temperature: float = Field(..., description="Ambient temperature (°C)")
    relative_humidity: float = Field(..., description="Relative humidity (%)")
    atmospheric_pressure: float = Field(..., description="Surface pressure (hPa)")
    dew_point: float = Field(..., description="Thermodynamic dew point (°C)")
    wind_speed: float = Field(..., description="Wind speed (m/s)")
    wind_direction: str = Field(..., description="Wind compass direction")
    rainfall_rate: float = Field(..., description="Precipitation rate (mm/h)")
    solar_radiation: float = Field(..., description="Solar flux (W/m²)")
    timestamp: str = Field(..., description="ISO 8601 reading timestamp")

class StationDetail(BaseModel):
    id: str = Field(..., description="Station ID (e.g. AWS-HR-AMB-01)")
    name: str = Field(..., description="Station human-readable name")
    district_id: str
    district_name: str
    region_id: str
    region_name: str
    latitude: float
    longitude: float
    elevation: int
    status: str = Field(..., description="HEALTHY | LOCAL_EXTREME | SENSOR_FAULT | CALIBRATION_DRIFT | UNKNOWN_DUAL")
    status_label: str
    wsi: str = Field(..., description="WMO Station Identifier")
    firmware_version: str = "v2.4.1-sg"
    telemetry: StationTelemetry
    sensor_health: Dict[str, str]
    anomaly_attribution: Optional[str] = None
    evidence_chain: List[str] = []
    confidence: Optional[float] = None
