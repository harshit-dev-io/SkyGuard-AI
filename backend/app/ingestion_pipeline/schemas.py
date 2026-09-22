from datetime import datetime
from enum import Enum
from typing import Any, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


class DataSource(str, Enum):
    NATIVE_EDGE = "native_edge"
    LEGACY_ADAPTER = "legacy_adapter"
    HTTP_FALLBACK = "http_fallback"


class EdgeTelemetryPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    station_id: str = Field(..., min_length=2, max_length=32)
    sensor_id: str = Field(..., min_length=2, max_length=32)
    timestamp: datetime
    sequence: int = Field(..., ge=0)
    temperature: float = Field(..., ge=-60.0, le=75.0)
    pressure: float = Field(..., ge=600.0, le=1150.0)
    humidity: float = Field(..., ge=0.0, le=105.0)
    wind_speed: float = Field(..., ge=0.0, le=150.0)
    wind_direction: float = Field(..., ge=0.0, le=360.0)
    rainfall: float = Field(..., ge=0.0, le=600.0)
    edge_flags: List[str] = Field(default_factory=list)
    edge_residual: float = Field(..., ge=0.0)
    local_event_flag: bool = False
    model_version: str = Field("tinyml-v3", max_length=32)
    firmware_version: str = Field("fw-1.4.2", max_length=32)
    battery_voltage: float = Field(..., ge=1.5, le=5.5)

    @field_validator("timestamp", mode="before")
    @classmethod
    def parse_iso_datetime(cls, v: Any) -> datetime:
        if isinstance(v, str):
            clean_str = v.replace("Z", "+00:00")
            return datetime.fromisoformat(clean_str)
        if isinstance(v, (int, float)):
            return datetime.fromtimestamp(v)
        return v


class LegacyRawDataRequest(BaseModel):
    raw_record: str = Field(..., description="ASCII string, SYNOP code, or CSV format line")
    data_format: str = Field("ASCII_CR1000", pattern=r"^(ASCII_CR1000|SYNOP_FM12|CSV_GENERIC)$")
    station_id: Optional[str] = Field(None, max_length=32)
    recorded_at: Optional[datetime] = None


class DeadLetterRecordResponse(BaseModel):
    id: uuid.UUID
    raw_payload: str
    error_reason: str
    source_ip: Optional[str]
    quarantined_at: datetime
    replayed: bool

    model_config = ConfigDict(from_attributes=True)


class IngestionConfirmation(BaseModel):
    status: str
    observation_id: uuid.UUID
    station_id: str
    sequence: int
    data_source: DataSource
    clock_suspect: bool
    late_arrival: bool
    buffered_in_dejitter: bool