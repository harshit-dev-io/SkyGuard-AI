import json
import logging
from typing import List, Optional
import redis.asyncio as aioredis
from app.config.settings import settings

logger = logging.getLogger("skyguard.ingest.redis")


class RedisPipelineBuffer:
    def __init__(self):
        self.pool: Optional[aioredis.ConnectionPool] = None
        self.client: Optional[aioredis.Redis] = None

    async def connect(self):
        if self.client is None:
            self.pool = aioredis.ConnectionPool(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=True,
                max_connections=50,
            )
            self.client = aioredis.Redis(connection_pool=self.pool)
            await self.client.ping()
            logger.info("Connected to Redis Ingestion Buffer.")

    async def disconnect(self):
        if self.client:
            await self.client.aclose()
            if self.pool:
                await self.pool.disconnect()
            self.client = None
            self.pool = None

    async def check_and_set_dedup(
        self,
        station_id: str,
        sensor_id: str,
        sequence: int,
    ) -> bool:
        if not self.client:
            await self.connect()

        assert self.client is not None
        dedup_key = f"dedup:{station_id}:{sensor_id}:{sequence}"
        is_new = await self.client.set(
            name=dedup_key,
            value="1",
            nx=True,
            ex=settings.DEDUP_TTL_SECONDS,
        )
        return bool(is_new)

    async def get_and_set_last_known_state(
        self,
        station_id: str,
        sequence: int,
        timestamp_epoch: float,
    ) -> Optional[dict]:
        if not self.client:
            await self.connect()

        assert self.client is not None
        state_key = f"station:last_seen:{station_id}"

        prev_data_raw = await self.client.get(state_key)
        prev_data = json.loads(prev_data_raw) if prev_data_raw else None

        new_state = {"sequence": sequence, "timestamp": timestamp_epoch}
        await self.client.set(state_key, json.dumps(new_state), ex=604800)

        return prev_data

    async def stage_in_dejitter(
        self,
        station_id: str,
        sequence: int,
        raw_payload_json: str,
        arrival_epoch: float,
    ) -> bool:
        if not self.client:
            await self.connect()

        assert self.client is not None
        zset_key = f"dejitter:{station_id}"

        earliest = await self.client.zrange(zset_key, 0, 0, withscores=True)
        late_arrival = False

        if earliest:
            _, earliest_arrival = earliest[0]
            if (arrival_epoch - earliest_arrival) > settings.DEJITTER_WINDOW_SECONDS:
                late_arrival = True

        pipe = self.client.pipeline()
        pipe.zadd(zset_key, {raw_payload_json: sequence})
        pipe.zremrangebyrank(zset_key, 0, -256)
        pipe.expire(zset_key, int(settings.DEJITTER_WINDOW_SECONDS * 4))
        await pipe.execute()

        return late_arrival

    async def pop_reordered_dejitter_window(self, station_id: str) -> List[str]:
        if not self.client:
            await self.connect()

        assert self.client is not None
        zset_key = f"dejitter:{station_id}"

        entries = await self.client.zrange(zset_key, 0, -1)
        if entries:
            await self.client.delete(zset_key)
        return entries


redis_buffer = RedisPipelineBuffer()
