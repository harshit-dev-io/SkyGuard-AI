import asyncio
import inspect
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from backend.app.api.ws_manager import WebSocketManager
from backend.app.config.logging import setup_logging
from backend.app.config.settings import Settings
from backend.app.ingestion.mqtt_subscriber import AsyncMQTTSubscriber
from backend.app.pipelines.orchestrator import CentralPipelineOrchestrator

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
        ws_manager=ws_manager,
    )

    start_res = mqtt_subscriber.start()
    if inspect.isawaitable(start_res):
        task = asyncio.create_task(start_res)
    else:
        task = None

    yield

    mqtt_subscriber.stop()
    if task is not None:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

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
