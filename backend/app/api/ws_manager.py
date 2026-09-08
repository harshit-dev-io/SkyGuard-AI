import logging
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Real-time distribution gateway manager handling client WebSocket connections and channel broadcasts."""

    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()
        self.channel_subscriptions: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: Optional[str] = None) -> None:
        """Accepts a WebSocket connection and registers it globally and to optional channel."""
        await websocket.accept()
        self.active_connections.add(websocket)
        if channel:
            if channel not in self.channel_subscriptions:
                self.channel_subscriptions[channel] = set()
            self.channel_subscriptions[channel].add(websocket)
        logger.info(f"WebSocket client connected. Channel: {channel}")

    def disconnect(self, websocket: WebSocket, channel: Optional[str] = None) -> None:
        """Removes a WebSocket connection from active pool and channel subscriptions."""
        self.active_connections.discard(websocket)
        if channel and channel in self.channel_subscriptions:
            self.channel_subscriptions[channel].discard(websocket)
            if not self.channel_subscriptions[channel]:
                del self.channel_subscriptions[channel]
        else:
            # Remove from all channels if channel not specified
            for ch, conns in list(self.channel_subscriptions.items()):
                conns.discard(websocket)
                if not conns:
                    del self.channel_subscriptions[ch]
        logger.info("WebSocket client disconnected.")

    async def broadcast(self, message: Dict[str, Any], channel: Optional[str] = None) -> None:
        """Broadcasts a JSON message to all connected clients or clients in a specific channel."""
        targets = (
            self.channel_subscriptions.get(channel, set())
            if channel
            else self.active_connections
        )
        stale_connections = []
        for connection in list(targets):
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"Error sending message to WebSocket client: {exc}")
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(stale, channel)

    async def broadcast_telemetry(self, telemetry_data: Dict[str, Any]) -> None:
        """Broadcasts processed telemetry to subscribers."""
        payload = {"event": "telemetry", "data": telemetry_data}
        await self.broadcast(payload, channel="telemetry")
        await self.broadcast(payload)

    async def broadcast_alert(self, alert_data: Dict[str, Any]) -> None:
        """Broadcasts alert flags to subscribers."""
        payload = {"event": "alert", "data": alert_data}
        await self.broadcast(payload, channel="alerts")
        await self.broadcast(payload)

    async def broadcast_health_index(self, health_data: Dict[str, Any]) -> None:
        """Broadcasts station Health Index updates to subscribers."""
        payload = {"event": "health_index", "data": health_data}
        await self.broadcast(payload, channel="health")
        await self.broadcast(payload)

    async def broadcast_qc_revision(self, revision_data: Dict[str, Any]) -> None:
        """Emits qc_revision payloads when Kalman retrospective rewind back-flags historical data."""
        payload = {"event": "qc_revision", "data": revision_data}
        await self.broadcast(payload, channel="qc_revisions")
        await self.broadcast(payload)
