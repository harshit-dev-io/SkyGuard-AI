import re
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.wis2_adapter.models import WIS2WSIMappingModel


class WSIRegistryGate:
    """
    Enforces WIGOS Station Identifier (WSI) standards (WMO-No. 1160).
    Quarantines unmapped or malformed station IDs into the WIS2 Pending Buffer.
    """

    WSI_REGEX = re.compile(r"^(?P<series>[0-9]+)-(?P<issuer>[0-9]+)-(?P<issue>[0-9]+)-(?P<local>[A-Za-z0-9_\-]+)$")

    @classmethod
    def parse_wsi(cls, wsi_str: str) -> Optional[Tuple[int, int, int, str]]:
        match = cls.WSI_REGEX.match(wsi_str)
        if not match:
            return None
        return (
            int(match.group("series")),
            int(match.group("issuer")),
            int(match.group("issue")),
            match.group("local"),
        )

    @classmethod
    async def get_wsi_for_station(
        cls, db: AsyncSession, station_id: str
    ) -> Optional[WIS2WSIMappingModel]:
        stmt = select(WIS2WSIMappingModel).where(WIS2WSIMappingModel.station_id == station_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def register_wsi(
        cls, db: AsyncSession, station_id: str, wsi_str: str
    ) -> Optional[WIS2WSIMappingModel]:
        parsed = cls.parse_wsi(wsi_str)
        if not parsed:
            return None

        series, issuer, issue, local_id = parsed
        existing = await cls.get_wsi_for_station(db, station_id)
        if existing:
            existing.wsi = wsi_str
            existing.wsi_series = series
            existing.issuer_id = issuer
            existing.issue_number = issue
            existing.local_identifier = local_id
            existing.status = "REGISTERED"
            await db.commit()
            return existing

        mapping = WIS2WSIMappingModel(
            station_id=station_id,
            wsi=wsi_str,
            wsi_series=series,
            issuer_id=issuer,
            issue_number=issue,
            local_identifier=local_id,
            status="REGISTERED",
        )
        db.add(mapping)
        await db.commit()
        await db.refresh(mapping)
        return mapping
