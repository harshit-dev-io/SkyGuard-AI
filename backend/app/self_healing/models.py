from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.config.database import Base

class CorrectionModel(Base):
    """
    Derived physical correction layer.
    Architectural Guarantee: Raw observations hypertable remains byte-identical.
    Corrections link via foreign key to raw_observations.observation_id.
    """
    __tablename__ = "corrections"

    correction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Foreign link to TimescaleDB raw hypertable
    observation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    sensor_id: Mapped[str] = mapped_column(String(32), nullable=False)
    parameter_target: Mapped[str] = mapped_column(String(32), default="temperature", nullable=False)
    derived_value: Mapped[float] = mapped_column(Float, nullable=False)
    raw_value: Mapped[float] = mapped_column(Float, nullable=False)
    method: Mapped[str] = mapped_column(String(32), default="ukf_correction", nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    uncertainty: Mapped[float] = mapped_column(Float, nullable=False)  # Posterior 1-sigma variance
    source_neighbors: Mapped[List[str]] = mapped_column(JSONB, nullable=False)
    gate_results: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    rejected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rejected_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    rejected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    provenance_entry: Mapped[Optional["ProvenanceModel"]] = relationship(
        "ProvenanceModel", back_populates="correction", uselist=False, cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_corrections_station_created", "station_id", "created_at"),
        Index("idx_corrections_rejected_obs", "rejected", "observation_id"),
    )


class ProvenanceModel(Base):
    """
    Cryptographic-grade provenance and calibration audit store.
    Provides immutable lineage for downstream meteorologists and regulatory pipelines.
    """
    __tablename__ = "provenance"

    provenance_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    correction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("corrections.correction_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    observation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    provenance_payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    correction: Mapped["CorrectionModel"] = relationship(
        "CorrectionModel", back_populates="provenance_entry"
    )