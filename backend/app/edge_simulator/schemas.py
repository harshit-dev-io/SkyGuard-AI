import re
from datetime import datetime
from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class TerrainType(str, Enum):
    COASTAL = "coastal"
    PLAIN = "plain"
    MOUNTAIN = "mountain"
    URBAN = "urban"
    ALLUVIAL = "alluvial"


class ClimateRegion(str, Enum):
    MONSOON_COASTAL = "monsoon_coastal"
    ARID_DESERT = "arid_desert"
    INDO_GANGETIC = "indo_gangetic"
    COMPOSITE = "composite"
    SUBTROPICAL_HUMID = "subtropical_humid"


class FaultType(str, Enum):
    STUCK_SENSOR = "STUCK_SENSOR"
    DRIFT = "DRIFT"
    BIAS = "BIAS"
    NOISE_INCREASE = "NOISE_INCREASE"
    INTERMITTENT_FAILURE = "INTERMITTENT_FAILURE"


class StationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    sensor_type: str = Field(..., min_length=2, max_length=64)
    installation_date: datetime
    firmware_version: str = Field("fw-1.4.2", max_length=32)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    elevation: float = Field(..., ge=-430.0, le=9000.0)
    terrain: TerrainType
    climate_region: ClimateRegion
    power_segment: str = Field(..., min_length=2, max_length=64)
    backhaul_id: str = Field(..., min_length=2, max_length=64)


class StationCreate(StationBase):
    station_id: str = Field(..., min_length=3, max_length=32, pattern=r"^[A-Za-z0-9_\-]+$")
    wsi: Optional[str] = Field(None, max_length=64)

    @field_validator("wsi")
    @classmethod
    def validate_wsi(cls, v: Optional[str]) -> Optional[str]:
        if v:
            pattern = r"^[0-9]+-[0-9]+-[0-9]+-[A-Za-z0-9]+$"
            if not re.match(pattern, v):
                raise ValueError("WSI must match standard WIGOS format: series-issuer-issue-number[cite: 1, 3]")
        return v


class StationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=128)
    sensor_type: Optional[str] = None
    replacement_date: Optional[datetime] = None
    firmware_version: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    elevation: Optional[float] = Field(None, ge=-430.0, le=9000.0)
    terrain: Optional[TerrainType] = None
    climate_region: Optional[ClimateRegion] = None
    power_segment: Optional[str] = None
    backhaul_id: Optional[str] = None
    is_active: Optional[bool] = None


class StationResponse(StationBase):
    station_id: str
    wsi: Optional[str] = None
    wsi_status: str = "PENDING_REGISTRATION"
    replacement_date: Optional[datetime] = None
    calibration_history: List[dict[str, Any]] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def derive_wsi_status(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "wsi_status" not in data or not data["wsi_status"]:
                data["wsi_status"] = "REGISTERED" if data.get("wsi") else "PENDING_REGISTRATION"
        elif hasattr(data, "wsi"):
            data.wsi_status = "REGISTERED" if getattr(data, "wsi", None) else "PENDING_REGISTRATION"
        return data

    class Config:
        from_attributes = True


class EdgeProvisioningArtifacts(BaseModel):
    station_id: str
    client_cert_pem: str
    client_key_pem: str
    station_token: str
    broker_url: str
    publish_topic: str


class StationRegistrationResult(BaseModel):
    station: StationResponse
    provisioning: EdgeProvisioningArtifacts


class SimulationConfig(BaseModel):
    sample_interval_seconds: float = Field(10.0, ge=1.0, le=300.0)
    batch_size: int = Field(3, ge=1, le=12)
    broker_host: str = Field("localhost", min_length=1)
    broker_port: int = Field(1883, ge=1, le=65535)
    use_tls: bool = Field(False)


class InjectFaultRequest(BaseModel):
    fault_type: FaultType
    target_channel: str = Field("humidity", pattern=r"^(temperature|humidity|pressure|wind_speed)$")
    magnitude: float
    duration_ticks: int = Field(12, ge=1, le=288)


class InjectEventRequest(BaseModel):
    pressure_drop_rate: float = Field(3.5, ge=1.0, le=15.0)
    gust_speed: float = Field(22.0, ge=5.0, le=60.0)
    rh_spike: float = Field(15.0, ge=0.0, le=40.0)
    duration_ticks: int = Field(6, ge=1, le=24)


class EdgeTelemetryPayload(BaseModel):
    station_id: str
    sensor_id: str
    timestamp: str
    sequence: int
    temperature: float
    pressure: float
    humidity: float
    wind_speed: float
    wind_direction: float
    rainfall: float
    edge_flags: List[str]
    edge_residual: float
    local_event_flag: bool
    model_version: str = "tinyml-v3"
    firmware_version: str = "fw-1.4.2"
    battery_voltage: float