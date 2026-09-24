import logging
from typing import List, Set
import redis.asyncio as aioredis
from app.config.settings import settings

logger = logging.getLogger("skyguard.healing.guard")



class ImputationFeedbackGuard:
    """
    Enforces the zero-contamination architectural boundary.
    Prevents regional model hallucination loops: any station undergoing
    correction/imputation is instantly quarantined from neighbor candidate pools.
    """

    def __init__(self):
        self._redis_client: aioredis.Redis | None = None

    async def _get_client(self) -> aioredis.Redis:
        if self._redis_client is None:
            self._redis_client = aioredis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=True,
            )
        return self._redis_client

    async def quarantine_station(self, station_id: str):
        """Adds a station ID to the active quarantined set."""
        client = await self._get_client()
        await client.sadd(settings.QUARANTINE_REDIS_SET_KEY, station_id)
        # Refresh quarantine key-level TTL
        await client.expire(settings.QUARANTINE_REDIS_SET_KEY, settings.QUARANTINE_TTL_SECONDS)
        logger.warning(f"FEEDBACK GUARD: Quarantined station '{station_id}' from spatial candidate pools.")

    async def release_station(self, station_id: str):
        """Releases a station once its hardware fault has physically resolved."""
        client = await self._get_client()
        await client.srem(settings.QUARANTINE_REDIS_SET_KEY, station_id)
        logger.info(f"FEEDBACK GUARD: Released station '{station_id}' back to clean candidate pool.")

    async def get_all_quarantined_stations(self) -> Set[str]:
        """Returns all stations currently blacklisted from neighbor evidence pools."""
        client = await self._get_client()
        members = await client.smembers(settings.QUARANTINE_REDIS_SET_KEY)
        return set(members)

    async def sanitize_candidate_neighbors(
        self, candidate_neighbors: List[str]
    ) -> List[str]:
        """
        Filters out any station currently undergoing active self-healing or imputation.
        Guarantees zero imputed data points ever leak into another station's spatial state.
        """
        quarantined = await self.get_all_quarantined_stations()
        clean = [st_id for st_id in candidate_neighbors if st_id not in quarantined]
        dropped_count = len(candidate_neighbors) - len(clean)
        if dropped_count > 0:
            logger.warning(
                f"FEEDBACK GUARD: Dropped {dropped_count} contaminated neighbors from spatial estimation pool."
            )
        return clean

    async def close(self):
        if self._redis_client:
            await self._redis_client.aclose()
            self._redis_client = None


feedback_guard = ImputationFeedbackGuard()