import asyncio
import json
import logging
from typing import Any, Optional

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
        ws_manager: Optional[Any] = None,
        reconnect_interval: float = 1.0,
        max_reconnect_attempts: Optional[int] = None,
    ) -> None:
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic = topic
        self.orchestrator = orchestrator or CentralPipelineOrchestrator()
        self.ws_manager = ws_manager
        self.reconnect_interval = reconnect_interval
        self.max_reconnect_attempts = max_reconnect_attempts
        self._is_running = False

    async def handle_message(self, payload_bytes: bytes) -> None:
        """Parses payload bytes, processes telemetry, and broadcasts via ws_manager."""
        try:
            payload_dict = json.loads(payload_bytes.decode("utf-8"))
            telemetry = parse_wis2_payload(payload_dict)
            result = self.orchestrator.process_telemetry(telemetry)

            if self.ws_manager is not None:
                classification_str = str(
                    result.classification.value
                    if hasattr(result.classification, "value")
                    else result.classification
                )
                result_dict = {
                    "station_id": result.station_id,
                    "timestamp": result.timestamp.isoformat(),
                    "raw_pressure": result.raw_pressure,
                    "demodulated_pressure": result.demodulated_pressure,
                    "predicted_spatial_pressure": result.predicted_spatial_pressure,
                    "classification": classification_str,
                    "cusum": result.cusum,
                    "health_index": result.health_index,
                    "rul_days": result.rul_days,
                    "imputed_pressure": result.imputed_pressure,
                    "qc_state": result.qc_state,
                }
                await self.ws_manager.broadcast_telemetry(result_dict)
                await self.ws_manager.broadcast_health_index(
                    {
                        "station_id": result.station_id,
                        "health_index": result.health_index,
                        "rul_days": result.rul_days,
                    }
                )
                if classification_str == "SENSOR_FAULT":
                    await self.ws_manager.broadcast_alert(result_dict)
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
