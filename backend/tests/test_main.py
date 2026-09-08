import pytest
from unittest.mock import MagicMock, patch
import httpx
from fastapi.testclient import TestClient

from app.main import app, ws_manager


@pytest.mark.asyncio
async def test_health_check() -> None:
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_websocket_telemetry() -> None:
    client = TestClient(app)
    with client.websocket_connect("/ws/telemetry") as websocket:
        test_payload = {"type": "telemetry_update", "station_id": "STATION_01"}
        
        # Broadcast message via WebSocketManager
        import asyncio
        asyncio.run(ws_manager.broadcast(test_payload, channel="telemetry"))
        
        data = websocket.receive_json()
        assert data == test_payload


@pytest.mark.asyncio
async def test_lifespan_events() -> None:
    with patch("app.main.AsyncMQTTSubscriber") as mock_subscriber_cls:
        mock_subscriber = MagicMock()
        mock_subscriber_cls.return_value = mock_subscriber
        
        with TestClient(app) as client:
            response = client.get("/health")
            assert response.status_code == 200
            assert mock_subscriber_cls.called
