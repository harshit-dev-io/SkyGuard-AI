from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.api.ws_manager import WebSocketManager
from app.config.logging import setup_logging
from app.config.settings import Settings
from app.ingestion.mqtt_subscriber import AsyncMQTTSubscriber
from app.pipelines.orchestrator import CentralPipelineOrchestrator

# Global application dependencies
ws_manager = WebSocketManager()
orchestrator = CentralPipelineOrchestrator()
mqtt_subscriber: Optional[AsyncMQTTSubscriber] = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global mqtt_subscriber
    setup_logging()
    settings = Settings()

    broker_host = getattr(settings, "MQTT_BROKER_HOST", "localhost")
    broker_port = getattr(settings, "MQTT_BROKER_PORT", 1883)

    mqtt_subscriber = AsyncMQTTSubscriber(
        broker_host=broker_host,
        broker_port=broker_port,
        orchestrator=orchestrator,
    )

    yield

    mqtt_subscriber = None


app = FastAPI(title="WIS 2.0 Central Backend API", lifespan=lifespan)


@app.get("/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket) -> None:
    channel = "telemetry"
    await ws_manager.connect(websocket, channel=channel)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel=channel)
