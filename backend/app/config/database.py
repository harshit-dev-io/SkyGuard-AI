from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional
import uuid

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    PrimaryKeyConstraint,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from geoalchemy2 import Geography

from app.config.settings import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
)

async_session_factory = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


# -----------------------------------------------------------------------------
# Database Models & Complete ORM Declarations
# -----------------------------------------------------------------------------

class StationHealthModel(Base):
    __tablename__ = "station_health"

    station_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    health_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    degradation_slope: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    rul_days: Mapped[float] = mapped_column(Float, nullable=False, default=365.0)
    last_assessment: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)


class QCResultModel(Base):
    __tablename__ = "qc_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    flags: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class EvidenceRecordModel(Base):
    __tablename__ = "evidence_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    engine: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    produced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class QCRevisionModel(Base):
    __tablename__ = "qc_revisions"

    revision_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    station_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    previous_state: Mapped[str] = mapped_column(String(32), nullable=False)
    new_state: Mapped[str] = mapped_column(String(32), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(64), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    revised_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


async def setup_timescaledb() -> None:
    """Executes extension creation and TimescaleDB hypertable setup."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
        await conn.run_sync(Base.metadata.create_all)

        hypertable_sql = text("""
            SELECT create_hypertable(
                'raw_observations',
                by_range('timestamp', INTERVAL '1 day'),
                if_not_exists => TRUE,
                migrate_data => TRUE
            );
        """)
        await conn.execute(hypertable_sql)
