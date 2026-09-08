import asyncio
import json
import logging
from typing import Optional

import aiomqtt

from backend.app.ingestion.payload_parser import parse_wis2_payload, PayloadValidationError
from backend.app.pipelines.orchestrator import CentralPipelineOrchestrator

logger = logging.getLogger(__name__)

DEFAULT_TOPIC = "origin/a/wis2/in-imd/station/+/data"


class AsyncMQTTSubscriber:
    """Async MQTT subscriber for WIS 2.0 telemetry with automated reconnection."""

    def __init__(
        self,
        broker_host: str = "localhost",
        broker_port: int = 1883,
        topic: str = DEFAULT_TOPIC,
        orchestrator: Optional[CentralPipelineOrchestrator] = None,
        reconnect_interval: float = 1.0,
        max_reconnect_attempts: Optional[int] = None,
    ) -> None:
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic = topic
        self.orchestrator = orchestrator or CentralPipelineOrchestrator()
        self.reconnect_interval = reconnect_interval
        self.max_reconnect_attempts = max_reconnect_attempts
        self._is_running = False

    async def handle_message(self, payload_bytes: bytes) -> None:
        """Parses payload bytes and passes telemetry to the orchestrator."""
        try:
            payload_dict = json.loads(payload_bytes.decode("utf-8"))
            telemetry = parse_wis2_payload(payload_dict)
            self.orchestrator.process_telemetry(telemetry)
        except (json.JSONDecodeError, PayloadValidationError) as err:
            logger.error("Validation or JSON error processing MQTT message: %s", err)
        except Exception as err:
            logger.error("Unexpected error handling payload: %s", err)

    async def start(self) -> None:
        """Starts listening loop with automatic reconnection resilience."""
        self._is_running = True
        attempts = 0

        while self._is_running:
            try:
                async with aiomqtt.Client(self.broker_host, self.broker_port) as client:
                    await client.subscribe(self.topic)
                    logger.info("Subscribed to MQTT topic %s", self.topic)
                    attempts = 0

                    async for message in client.messages:
                        if not self._is_running:
                            break
                        await self.handle_message(message.payload)
            except aiomqtt.MqttError as err:
                logger.warning(
                    "MQTT connection error: %s. Reconnecting in %s seconds...",
                    err,
                    self.reconnect_interval,
                )
            except Exception as err:
                logger.error("Unexpected error in MQTT subscriber loop: %s", err)

            attempts += 1
            if self.max_reconnect_attempts is not None and attempts >= self.max_reconnect_attempts:
                logger.error("Max reconnection attempts (%d) reached. Stopping loop.", self.max_reconnect_attempts)
                break

            if self._is_running:
                await asyncio.sleep(self.reconnect_interval)

    def stop(self) -> None:
        """Stops the subscriber loop."""
        self._is_running = False
