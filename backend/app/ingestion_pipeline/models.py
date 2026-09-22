from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import  Mapped, mapped_column

from app.config.database import Base

class RawObservationModel(Base):
    __tablename__ = "raw_observations"

    observation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    sensor_id: Mapped[str] = mapped_column(String(32), nullable=False)
    sequence: Mapped[int] = mapped_column(BigInteger, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        primary_key=True,  
        nullable=False,
        index=True,
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    data_source: Mapped[str] = mapped_column(String(32), nullable=False)
    clock_suspect: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    late_arrival: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("idx_raw_obs_station_seq", "station_id", "sequence"),
        Index("idx_raw_obs_station_time", "station_id", "timestamp"),
    )


class DeadLetterObservationModel(Base):
    __tablename__ = "dead_letter_observations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    raw_payload: Mapped[str] = mapped_column(Text, nullable=False)
    error_reason: Mapped[str] = mapped_column(Text, nullable=False)
    source_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    quarantined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    replayed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
