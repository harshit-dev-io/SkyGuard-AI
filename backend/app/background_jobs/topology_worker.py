from datetime import datetime, timezone
import json
import logging
from typing import Dict, List
import h3
import numpy as np
import redis
from scipy.spatial import KDTree
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from .celery_app import celery_app
from app.config.settings import settings
 
from .load_shedder import TaskThrottleCoordinator

logger = logging.getLogger("skyguard.jobs.topology")
from app.config.settings import settings


engine = create_engine(settings.DATABASE_SYNC_URL, pool_pre_ping=True)
redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)


class SpatialTopologyBuilder:
    """
    Constructs geographic graph topology using PostGIS, H3 discrete hexagonal binning,
    and 3D Cartesian KD-Tree projection (adjusting for altitude deltas).
    """

    EARTH_RADIUS_METERS = 6371000.0

    @classmethod
    def lat_lon_alt_to_cartesian(cls, lats: np.ndarray, lons: np.ndarray, alts: np.ndarray) -> np.ndarray:
        """Converts geodetic lat/lon/alt coordinates to ECEF (Earth-Centered, Earth-Fixed) 3D points."""
        phi = np.radians(lats)
        lam = np.radians(lons)
        r = cls.EARTH_RADIUS_METERS + alts

        x = r * np.cos(phi) * np.cos(lam)
        y = r * np.cos(phi) * np.sin(lam)
        z = r * np.sin(phi)
        return np.column_stack((x, y, z))

    @classmethod
    def calculate_terrain_similarity(cls, class_a: str, class_b: str, elev_delta: float) -> float:
        """Computes similarity coefficient in [0.0, 1.0] penalizing vertical cliff cuts and land-use shifts."""
        base_match = 1.0 if class_a == class_b else 0.65
        elev_decay = float(np.exp(-abs(elev_delta) / 400.0))  # 400m scale height
        return round(base_match * elev_decay, 3)


@celery_app.task(name="app.background_jobs.topology_worker.rebuild_static_topology_graph", bind=True)
def rebuild_static_topology_graph(self):
    """Sweeps all active stations, builds 3D spatial KD-Tree, and updates database + Redis cache."""
    if TaskThrottleCoordinator.is_task_paused("topology_worker"):
        logger.warning("LOAD SHEDDING: Topology rebuild throttled due to consumer lag.")
        return {"status": "throttled", "reason": "load_shedding"}

    logger.info("Rebuilding SkyGuard Static Spatial Topology Graph...")
    now_utc = datetime.now(timezone.utc)

    with Session(engine) as session:
        stations_query = text("""
            SELECT 
                station_id,
                ST_Y(location::geometry) as latitude,
                ST_X(location::geometry) as longitude,
                COALESCE(elevation, 0.0) as elevation,
                COALESCE(terrain_class, 'flat_rural') as terrain_class
            FROM stations
            WHERE is_active = TRUE
        """)
        rows = session.execute(stations_query).fetchall()
        if len(rows) < 2:
            logger.warning("Fewer than 2 active stations registered; skipping topology graph build.")
            return {"status": "aborted", "reason": "insufficient_stations"}

        station_ids = [r.station_id for r in rows]
        lats = np.array([r.latitude for r in rows], dtype=np.float64)
        lons = np.array([r.longitude for r in rows], dtype=np.float64)
        alts = np.array([r.elevation for r in rows], dtype=np.float64)
        terrains = {r.station_id: r.terrain_class for r in rows}
        elevations = {r.station_id: r.elevation for r in rows}

        # 1. H3 Hexagonal Binning Verification
        h3_indices = [
            h3.latlng_to_cell(lat, lon, settings.TOPOLOGY_H3_RESOLUTION)
            for lat, lon in zip(lats, lons)
        ]

        # 2. Build 3D Cartesian Coordinates & KD-Tree
        points_3d = SpatialTopologyBuilder.lat_lon_alt_to_cartesian(lats, lons, alts)
        tree = KDTree(points_3d)

        k = min(len(station_ids), settings.TOPOLOGY_DEFAULT_K_NEIGHBORS + 1)
        max_dist_meters = settings.TOPOLOGY_MAX_DISTANCE_KM * 1000.0

        # Query top-k nearest neighbors within Euclidean distance
        distances, indices = tree.query(points_3d, k=k, distance_upper_bound=max_dist_meters)

        # 3. Clean and Populate Database Table topology_static
        session.execute(text("TRUNCATE TABLE topology_static;"))

        redis_pipeline = redis_client.pipeline()
        total_edges = 0

        for i, source_id in enumerate(station_ids):
            neighbor_list_for_redis = []

            for dist_m, neighbor_idx in zip(distances[i], indices[i]):
                if neighbor_idx == i or neighbor_idx >= len(station_ids):
                    continue  # Skip self or infinite distance results

                target_id = station_ids[neighbor_idx]
                elev_delta = float(elevations[target_id] - elevations[source_id])
                terrain_sim = SpatialTopologyBuilder.calculate_terrain_similarity(
                    terrains[source_id], terrains[target_id], elev_delta
                )

                session.execute(
                    text("""
                        INSERT INTO topology_static (
                            station_id, neighbor_id, distance_m,
                            elevation_delta, terrain_similarity, rebuilt_at
                        ) VALUES (
                            :st_id, :nbr_id, :dist, :elev_delta, :sim, :rebuilt_at
                        )
                    """),
                    {
                        "st_id": source_id,
                        "nbr_id": target_id,
                        "dist": round(float(dist_m), 1),
                        "elev_delta": round(elev_delta, 1),
                        "sim": terrain_sim,
                        "rebuilt_at": now_utc,
                    },
                )

                neighbor_list_for_redis.append({
                    "station_id": target_id,
                    "distance_m": round(float(dist_m), 1),
                    "elevation_delta": round(elev_delta, 1),
                    "terrain_similarity": terrain_sim,
                })
                total_edges += 1

            # Update Redis Cache (topology:neighbors:{station_id})
            redis_pipeline.set(
                f"topology:neighbors:{source_id}",
                json.dumps(neighbor_list_for_redis),
                ex=604800,  # 7-day TTL
            )

        session.commit()
        redis_pipeline.execute()

    logger.info(f"Topology Graph Rebuilt: {len(station_ids)} stations, {total_edges} directional edges.")
    return {"status": "success", "stations_indexed": len(station_ids), "edges_created": total_edges}