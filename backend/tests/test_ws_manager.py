import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.app.api.ws_manager import WebSocketManager


@pytest.mark.asyncio
async def test_connect_and_disconnect():
    manager = WebSocketManager()
    mock_ws = AsyncMock()

    await manager.connect(mock_ws, channel="telemetry")
    assert mock_ws in manager.active_connections
    assert mock_ws in manager.channel_subscriptions["telemetry"]
    mock_ws.accept.assert_called_once()

    manager.disconnect(mock_ws, channel="telemetry")
    assert mock_ws not in manager.active_connections
    assert "telemetry" not in manager.channel_subscriptions


@pytest.mark.asyncio
async def test_broadcast_general():
    manager = WebSocketManager()
    mock_ws1 = AsyncMock()
    mock_ws2 = AsyncMock()

    await manager.connect(mock_ws1)
    await manager.connect(mock_ws2)

    msg = {"message": "hello"}
    await manager.broadcast(msg)

    mock_ws1.send_json.assert_called_once_with(msg)
    mock_ws2.send_json.assert_called_once_with(msg)


@pytest.mark.asyncio
async def test_broadcast_telemetry_alert_health():
    manager = WebSocketManager()
    mock_ws = AsyncMock()

    await manager.connect(mock_ws)

    telemetry = {"station_id": "STATION_01", "p": 1013.25}
    await manager.broadcast_telemetry(telemetry)
    mock_ws.send_json.assert_called_with({"event": "telemetry", "data": telemetry})

    alert = {"station_id": "STATION_01", "classification": "SENSOR_FAULT"}
    await manager.broadcast_alert(alert)
    mock_ws.send_json.assert_called_with({"event": "alert", "data": alert})

    health = {"station_id": "STATION_01", "health_index": 85.5, "rul_days": 12.0}
    await manager.broadcast_health_index(health)
    mock_ws.send_json.assert_called_with({"event": "health_index", "data": health})


@pytest.mark.asyncio
async def test_broadcast_qc_revision():
    manager = WebSocketManager()
    mock_ws = AsyncMock()

    await manager.connect(mock_ws)

    revision_payload = {
        "station_id": "STATION_01",
        "revised_records_count": 3,
        "flag_status": "FLAGGED_INVALID",
        "lookback_hours": 24.0,
    }
    await manager.broadcast_qc_revision(revision_payload)

    mock_ws.send_json.assert_called_with({
        "event": "qc_revision",
        "data": revision_payload,
    })


@pytest.mark.asyncio
async def test_disconnection_on_send_error():
    manager = WebSocketManager()
    mock_ws = AsyncMock()
    mock_ws.send_json.side_effect = Exception("Connection reset")

    await manager.connect(mock_ws)
    assert mock_ws in manager.active_connections

    await manager.broadcast({"data": "test"})
    assert mock_ws not in manager.active_connections
