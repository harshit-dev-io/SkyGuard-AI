from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from app.config.database import Base
from app.config.settings import settings


class SystemState(str, Enum):
    NORMAL = "NORMAL"
    SUSPICIOUS = "SUSPICIOUS"
    LOCALIZED_EXTREME_EVENT = "LOCALIZED_EXTREME_EVENT"
    REGIONAL_EXTREME_EVENT = "REGIONAL_EXTREME_EVENT"
    REGIONAL_FAULT = "REGIONAL_FAULT"
    COMMUNICATION_FAILURE = "COMMUNICATION_FAILURE"
    UNKNOWN = "UNKNOWN"


class FaultClass(str, Enum):
    NOMINAL = "NOMINAL"
    STUCK_SENSOR = "STUCK_SENSOR"
    DRIFT = "DRIFT"
    BIAS = "BIAS"
    INTERMITTENT_FAILURE = "INTERMITTENT_FAILURE"
    NOISE_INCREASE = "NOISE_INCREASE"
    CALIBRATION_LOSS = "CALIBRATION_LOSS"
    COMMUNICATION_FAULT = "COMMUNICATION_FAULT"
    POWER_FAULT = "POWER_FAULT"
    ENVIRONMENTAL_CONTAMINATION = "ENVIRONMENTAL_CONTAMINATION"
    UNKNOWN_FAULT = "UNKNOWN_FAULT"


# -----------------------------------------------------------------------------
# Fused Streaming Schemas
# -----------------------------------------------------------------------------
class FusedEvidenceBundle(BaseModel):
    station_id: str
    observation_id: str
    evidence_incomplete: bool = False
    engines_present: List[str] = Field(default_factory=list)
    temporal_evidence: Optional[Dict[str, Any]] = None
    spatial_evidence: Optional[Dict[str, Any]] = None
    event_evidence: Optional[Dict[str, Any]] = None
    health_evidence: Optional[Dict[str, Any]] = None
    first_received_epoch: float
    emitted_at: datetime


class StateAssignmentResult(BaseModel):
    station_id: str
    observation_id: str
    state: SystemState
    confidence: float
    hypotheses: Dict[str, float]
    evidence_incomplete: bool
    requires_classification: bool
    assigned_at: datetime


class ClassificationResult(BaseModel):
    station_id: str
    observation_id: str
    predicted_fault: FaultClass
    raw_confidence: float
    calibrated_probability: float
    uncertainty_band: float  # ± bound (e.g. 0.05 for tight, 0.35 for sparse)
    calibration_version: str
    is_sparse_sample: bool
    produced_at: datetime

class ActiveLearningQueueModel(Base):
    __tablename__ = "active_learning_queue"

    queue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    observation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False)
    predicted_fault: Mapped[str] = mapped_column(String(32), nullable=False)
    raw_score: Mapped[float] = mapped_column(Float, nullable=False)
    calibrated_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    uncertainty_band: Mapped[float] = mapped_column(Float, nullable=False)
    hypotheses: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    fused_bundle: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    operator_label: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    operator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    labeled_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    labeled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    used_in_training_run: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        Index("idx_al_status", "used_in_training_run", "operator_label"),
    )


class PersistedClassificationRecord(Base):
    __tablename__ = "observation_classifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    observation_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    assigned_state: Mapped[str] = mapped_column(String(32), nullable=False)
    predicted_fault: Mapped[str] = mapped_column(String(32), nullable=False)
    calibrated_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    uncertainty_band: Mapped[float] = mapped_column(Float, nullable=False)
    evidence_incomplete: Mapped[bool] = mapped_column(Boolean, nullable=False)
    fused_bundle: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )