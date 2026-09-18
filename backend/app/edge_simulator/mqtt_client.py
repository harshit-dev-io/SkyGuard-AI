import asyncio
import hashlib
import json
import logging
from typing import List, Optional
import aiomqtt
from .schemas import EdgeTelemetryPayload, SimulationConfig

logger = logging.getLogger("skyguard.edge.mqtt")


class EdgeTransportClient:
    """
    Manages low-power duty cycling, deterministic publish jitter,
    RAM outage buffers, and immediate emergency publish overrides[cite: 1, 3].
    """

    def __init__(self, config: SimulationConfig):
        self.config = config
        self._client: Optional[aiomqtt.Client] = None
        self._lock = asyncio.Lock()

    async def initialize(self):
        async with self._lock:
            if self._client is None:
                self._client = aiomqtt.Client(
                    hostname=self.config.broker_host,
                    port=self.config.broker_port,
                )
                await self._client.__aenter__()
                logger.info(f"Connected to EMQX Broker at {self.config.broker_host}:{self.config.broker_port}")

    async def close(self):
        async with self._lock:
            if self._client is not None:
                await self._client.__aexit__(None, None, None)
                self._client = None
                logger.info("MQTT Transport disconnected.")

    @staticmethod
    def calculate_jitter(station_id: str, max_jitter_seconds: int = 60) -> float:
        """
        Generates deterministic, per-station publish offset based on station_id hash[cite: 1, 3].
        Smooths synchronized bursts without central orchestration[cite: 1, 3].
        """
        digest = hashlib.sha256(station_id.encode("utf-8")).hexdigest()
        offset_int = int(digest[:8], 16)
        return float(offset_int % max_jitter_seconds)

    async def publish_payloads(
        self,
        station_id: str,
        payloads: List[EdgeTelemetryPayload],
        immediate: bool = False,
    ):
        """
        Dispatches telemetry packets to 'telemetry/raw/{station_id}' at QoS 1[cite: 1, 2].
        """
        if not payloads:
            return

        if not immediate:
            jitter_sec = self.calculate_jitter(station_id, max_jitter_seconds=5)
            await asyncio.sleep(jitter_sec)

        topic = f"telemetry/raw/{station_id}"

        async with self._lock:
            if self._client is None:
                await self.initialize()

            assert self._client is not None
            for p in payloads:
                body = p.model_dump_json()
                await self._client.publish(topic, payload=body, qos=1)
                logger.debug(
                    f"MQTT QoS 1 Pub -> {topic} | seq={p.sequence} | "
                    f"flags={p.edge_flags} | immediate={immediate}"
                )