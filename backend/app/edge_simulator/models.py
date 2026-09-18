from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Index,
    String,
    PrimaryKeyConstraint,
    Integer,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geography
from app.config.database import Base


class StationModel(Base):
    __tablename__ = "stations"

    station_id: Mapped[str] = mapped_column(String(32), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False, default="Unnamed Station")
    wsi: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, index=True)
    sensor_type: Mapped[str] = mapped_column(String(64), nullable=False)
    installation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    replacement_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    calibration_history: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    firmware_version: Mapped[str] = mapped_column(String(32), default="fw-1.4.2", nullable=False)

    location = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    elevation: Mapped[float] = mapped_column(Float, nullable=False)
    terrain: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    climate_region: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    power_segment: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    backhaul_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_stations_spatial", "location", postgresql_using="gist"),
        Index("idx_stations_infra", "power_segment", "backhaul_id"),
    )

class StaticTopologyModel(Base):
    __tablename__ = "topology_static"

    station_id: Mapped[str] = mapped_column(String(32), ForeignKey("stations.station_id", ondelete="CASCADE"), index=True)
    neighbor_id: Mapped[str] = mapped_column(String(32), ForeignKey("stations.station_id", ondelete="CASCADE"), index=True)
    distance_m: Mapped[float] = mapped_column(Float, nullable=False)
    elevation_delta_m: Mapped[float] = mapped_column(Float, nullable=False)  
    terrain_similarity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)  
    rank: Mapped[int] = mapped_column(Integer, nullable=False)  
    rebuilt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        PrimaryKeyConstraint("station_id", "neighbor_id", name="pk_topology_static"),
        Index("idx_topology_station_rank", "station_id", "rank"),
    )