from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class PointGeometry(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(
        ...,
        min_length=2,
        max_length=3,
        description="Coordinates formatted as [longitude, latitude] or [longitude, latitude, elevation]",
    )


class WIS2Properties(BaseModel):
    station_id: str
    datetime: datetime
    t: float = Field(..., description="Temperature in degrees Celsius")
    p: float = Field(..., description="Station pressure in hPa")
    rh: float = Field(..., description="Relative humidity in percentage (0-100)")
    z_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Z-scores for calculated parameters",
    )
    qc_flags: Dict[str, bool] = Field(
        default_factory=dict,
        description="Detailed quality control check flags",
    )
    qc_bitmask: int = Field(
        ...,
        description="Bitmask representation of quality control state",
    )
    qc_state: Optional[str] = Field(
        default="GOOD",
        description="Overall QC classification state (e.g., 'GOOD', 'SUSPECT', 'BAD')",
    )


class WIS2GeoJSONPayload(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: Optional[str] = None
    geometry: PointGeometry
    properties: WIS2Properties
