from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class WIS2WSIMappingModel(Base):
    __tablename__ = "wis2_wsi_mapping"

    station_id: Mapped[str] = mapped_column(String(32), primary_key=True, index=True)
    wsi: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    wsi_series: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    issuer_id: Mapped[int] = mapped_column(Integer, nullable=False, default=356)  # 356 = India IMD
    issue_number: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    local_identifier: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="REGISTERED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class WIS2PendingBufferModel(Base):
    __tablename__ = "wis2_pending_buffer"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    observation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    raw_payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    quarantine_reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class WIS2DisseminationLogModel(Base):
    __tablename__ = "wis2_dissemination_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    wsi: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    bufr_object_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    wnm_topic: Mapped[str] = mapped_column(String(255), nullable=False)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
