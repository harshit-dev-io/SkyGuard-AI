import hashlib
import logging
import secrets
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from geoalchemy2.elements import WKTElement
from geoalchemy2.functions import ST_Distance
from sqlalchemy import delete, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import async_session_factory
from .models import StationModel, StaticTopologyModel
from .schemas import (
    EdgeProvisioningArtifacts,
    StationCreate,
    StationRegistrationResult,
    StationResponse,
    StationUpdate,
)
from .simulator import VirtualStationInstance, simulator_fleet

logger = logging.getLogger("skyguard.edge.services")


class EdgeStationService:
    @staticmethod
    def generate_edge_credentials(station_id: str) -> Tuple[str, str, str]:
        client_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "SkyGuard MoES Network"),
            x509.NameAttribute(NameOID.COMMON_NAME, f"station:{station_id}"),
        ])

        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(client_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.now(timezone.utc))
            .not_valid_after(datetime.now(timezone.utc).replace(year=2030))
            .sign(client_key, hashes.SHA256())
        )

        cert_pem = cert.public_bytes(serialization.Encoding.PEM).decode("utf-8")
        key_pem = client_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")

        fallback_token = f"sg_tok_{station_id}_{secrets.token_urlsafe(32)}"
        return cert_pem, key_pem, fallback_token

    @staticmethod
    def _calculate_terrain_similarity(t1: str, t2: str) -> float:
        """
        Computes physical similarity between terrain classes.
        Same terrain = 1.0; incompatible boundary (mountain vs coastal) = lower correlation[cite: 1, 2].
        """
        if t1 == t2:
            return 1.0
        terrain_groups = {
            "plains": {"plain", "alluvial", "urban"},
            "coastal": {"coastal"},
            "elevated": {"mountain"},
        }
        g1 = next((g for g, members in terrain_groups.items() if t1 in members), "other")
        g2 = next((g for g, members in terrain_groups.items() if t2 in members), "other")
        return 0.75 if g1 == g2 else 0.40

    @classmethod
    async def trigger_topology_rebuild(
        cls,
        station_id: str,
        k_neighbors: int = 5,
        max_distance_meters: float = 150_000.0,  # 150 km max candidate search radius
    ) -> None:
        """
        Recomputes static spatial topology via PostGIS for the target station[cite: 1, 2, 3].
        1. Clears prior static links for station_id.
        2. Queries nearest active stations using PostGIS ST_Distance on spheroidal Geography[cite: 3].
        3. Computes pairwise elevation deltas and terrain similarities[cite: 1].
        4. Writes rows to topology_static and updates bidirectional links[cite: 1].
        5. Updates the running in-memory VirtualStationInstance.
        """
        async with async_session_factory() as db:
            try:
                # 1. Fetch current station
                stmt = select(StationModel).where(StationModel.station_id == station_id)
                res = await db.execute(stmt)
                station = res.scalar_one_or_none()

                if not station or not station.is_active:
                    logger.warning(f"[Topology] Station {station_id} not found or inactive; aborting rebuild.")
                    return

                # 2. Query nearest neighbor candidates ordered by geodesic distance
                distance_expr = func.ST_Distance(StationModel.location, station.location).label("dist_m")
                neighbor_stmt = (
                    select(StationModel, distance_expr)
                    .where(
                        StationModel.station_id != station_id,
                        StationModel.is_active == True,
                        func.ST_DWithin(StationModel.location, station.location, max_distance_meters),
                    )
                    .order_by("dist_m")
                    .limit(k_neighbors)
                )

                candidates = (await db.execute(neighbor_stmt)).all()

                # Fallback: if no stations inside max_distance_meters, pick closest k globally
                if not candidates:
                    fallback_stmt = (
                        select(StationModel, distance_expr)
                        .where(
                            StationModel.station_id != station_id,
                            StationModel.is_active == True,
                        )
                        .order_by("dist_m")
                        .limit(k_neighbors)
                    )
                    candidates = (await db.execute(fallback_stmt)).all()

                # 3. Clean up existing topology records for this station
                await db.execute(
                    delete(StaticTopologyModel).where(
                        or_(
                            StaticTopologyModel.station_id == station_id,
                            StaticTopologyModel.neighbor_id == station_id,
                        )
                    )
                )

                # 4. Insert new static candidate records (forward & reciprocal)
                now_utc = datetime.now(timezone.utc)
                neighbor_ids: List[str] = []

                for rank, (nbr_model, dist_m) in enumerate(candidates, start=1):
                    elevation_delta = nbr_model.elevation - station.elevation
                    similarity = cls._calculate_terrain_similarity(station.terrain, nbr_model.terrain)
                    neighbor_ids.append(nbr_model.station_id)

                    # Forward entry: station -> neighbor
                    db.add(
                        StaticTopologyModel(
                            station_id=station.station_id,
                            neighbor_id=nbr_model.station_id,
                            distance_m=round(float(dist_m), 2),
                            elevation_delta_m=round(float(elevation_delta), 2),
                            terrain_similarity=similarity,
                            rank=rank,
                            rebuilt_at=now_utc,
                        )
                    )

                    # Reciprocal entry: neighbor -> station
                    db.add(
                        StaticTopologyModel(
                            station_id=nbr_model.station_id,
                            neighbor_id=station.station_id,
                            distance_m=round(float(dist_m), 2),
                            elevation_delta_m=round(float(-elevation_delta), 2),
                            terrain_similarity=similarity,
                            rank=rank,
                            rebuilt_at=now_utc,
                        )
                    )

                await db.commit()

                # 5. Push neighbor links to in-memory virtual station (if running in simulator)
                virtual_node = simulator_fleet.get_station(station_id)
                if virtual_node:
                    # Update local candidate reference
                    setattr(virtual_node, "neighbors", neighbor_ids)

                logger.info(
                    f"[Topology] Completed static graph rebuild for {station_id}: "
                    f"{len(candidates)} neighbors linked (IDs: {neighbor_ids})[cite: 1, 2]."
                )

            except Exception as e:
                await db.rollback()
                logger.error(f"[Topology] Rebuild failed for station {station_id}: {e}", exc_info=True)

    @classmethod
    async def create_station(
        cls,
        db: AsyncSession,
        payload: StationCreate,
    ) -> StationRegistrationResult:
        location_point = WKTElement(f"POINT({payload.longitude} {payload.latitude})", srid=4326)

        station = StationModel(
            station_id=payload.station_id,
            name=payload.name,
            wsi=payload.wsi,
            sensor_type=payload.sensor_type,
            installation_date=payload.installation_date,
            firmware_version=payload.firmware_version,
            location=location_point,
            latitude=payload.latitude,
            longitude=payload.longitude,
            elevation=payload.elevation,
            terrain=payload.terrain.value if hasattr(payload.terrain, "value") else str(payload.terrain),
            climate_region=payload.climate_region.value if hasattr(payload.climate_region, "value") else str(payload.climate_region),
            power_segment=payload.power_segment,
            backhaul_id=payload.backhaul_id,
            calibration_history=[],
            is_active=True,
        )

        db.add(station)
        await db.commit()
        await db.refresh(station)

        # Register instance into fleet manager
        v_station = VirtualStationInstance(
            station_id=station.station_id,
            climate_region=payload.climate_region,
            elevation=payload.elevation,
            firmware_version=station.firmware_version,
        )
        simulator_fleet.register_station_instance(v_station)

        cert_pem, key_pem, token = cls.generate_edge_credentials(station.station_id)
        station_resp = StationResponse.model_validate(station)

        artifacts = EdgeProvisioningArtifacts(
            station_id=station.station_id,
            client_cert_pem=cert_pem,
            client_key_pem=key_pem,
            station_token=token,
            broker_url="emqx.skyguard.internal:8883",
            publish_topic=f"telemetry/raw/{station.station_id}",
        )

        return StationRegistrationResult(station=station_resp, provisioning=artifacts)

    @classmethod
    async def get_station(cls, db: AsyncSession, station_id: str) -> Optional[StationResponse]:
        stmt = select(StationModel).where(StationModel.station_id == station_id)
        result = await db.execute(stmt)
        station = result.scalar_one_or_none()
        if not station:
            return None
        return StationResponse.model_validate(station)

    @classmethod
    async def list_stations(
        cls,
        db: AsyncSession,
        climate_region: Optional[str] = None,
        terrain: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[StationResponse]:
        query = select(StationModel)
        if climate_region:
            query = query.where(StationModel.climate_region == climate_region)
        if terrain:
            query = query.where(StationModel.terrain == terrain)
        if is_active is not None:
            query = query.where(StationModel.is_active == is_active)

        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        stations = result.scalars().all()
        return [StationResponse.model_validate(s) for s in stations]

    @classmethod
    async def update_station(
        cls,
        db: AsyncSession,
        station_id: str,
        payload: StationUpdate,
    ) -> Optional[StationResponse]:
        values = payload.model_dump(exclude_unset=True)
        if not values:
            return await cls.get_station(db, station_id)

        if "terrain" in values and hasattr(values["terrain"], "value"):
            values["terrain"] = values["terrain"].value
        if "climate_region" in values and hasattr(values["climate_region"], "value"):
            values["climate_region"] = values["climate_region"].value

        if "latitude" in values or "longitude" in values:
            lat = values.get("latitude")
            lng = values.get("longitude")
            current = await cls.get_station(db, station_id)
            if current:
                lat = lat if lat is not None else current.latitude
                lng = lng if lng is not None else current.longitude
                values["location"] = WKTElement(f"POINT({lng} {lat})", srid=4326)

        stmt = (
            update(StationModel)
            .where(StationModel.station_id == station_id)
            .values(**values)
            .execution_options(synchronize_session="fetch")
        )
        await db.execute(stmt)
        await db.commit()
        return await cls.get_station(db, station_id)

    @classmethod
    async def soft_delete(cls, db: AsyncSession, station_id: str) -> bool:
        stmt = (
            update(StationModel)
            .where(StationModel.station_id == station_id)
            .values(is_active=False)
        )
        result = await db.execute(stmt)
        await db.commit()
        simulator_fleet.remove_station_instance(station_id)
        return bool(result.rowcount > 0)