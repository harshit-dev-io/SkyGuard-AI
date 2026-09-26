import re
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field, field_validator


class WSIMappingRequest(BaseModel):
    station_id: str = Field(..., min_length=2, max_length=32)
    wsi: str = Field(..., min_length=7, max_length=64)

    @field_validator("wsi")
    @classmethod
    def validate_wsi(cls, v: str) -> str:
        pattern = r"^[0-9]+-[0-9]+-[0-9]+-[A-Za-z0-9]+$"
        if not re.match(pattern, v):
            raise ValueError(
                "Invalid WIGOS Station Identifier (WSI) structure. Must be '<series>-<issuer>-<issue-number>-<local-id>'"
            )
        return v


class WSIMappingResponse(BaseModel):
    station_id: str
    wsi: str
    wsi_series: int
    issuer_id: int
    issue_number: int
    local_identifier: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class WIS2NotificationMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]
    links: List[Dict[str, str]]


class BUFRGenerationResult(BaseModel):
    object_id: str
    file_path: str
    size_bytes: int
    checksum_md5: str
    wsi: str
    timestamp: datetime
