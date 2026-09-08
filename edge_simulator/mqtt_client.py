import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import paho.mqtt.client as mqtt


class MQTTPublisher:
    """MQTT Publisher for Edge Simulator matching WIS 2.0 GeoJSON specifications."""

    def __init__(self, client: Optional[mqtt.Client] = None) -> None:
        if client is not None:
            self.client = client
        else:
            # Paho MQTT v2.0+ API compatibility
            if hasattr(mqtt, "CallbackAPIVersion"):
                self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
            else:
                self.client = mqtt.Client()

    def connect(self, host: str = "localhost", port: int = 1883, keepalive: int = 60) -> None:
        """Connects to the specified MQTT broker."""
        self.client.connect(host, port, keepalive)
        self.client.loop_start()

    def disconnect(self) -> None:
        """Disconnects from the MQTT broker."""
        self.client.loop_stop()
        self.client.disconnect()

    def publish_payload(self, station_id: str, wis2_dict: Dict[str, Any]) -> None:
        """Publishes a WIS 2.0 GeoJSON dictionary payload to topic origin/a/wis2/in-imd/station/{station_id}/data with QoS 1."""
        topic = f"origin/a/wis2/in-imd/station/{station_id}/data"
        payload_str = json.dumps(wis2_dict)
        self.client.publish(topic, payload_str, qos=1)

    def publish_reading(
        self,
        station_id: str,
        coords: List[float],
        t: float,
        p: float,
        rh: float,
        z_scores: Dict[str, float],
        qc_bitmask: int,
        qc_flags: Dict[str, bool],
        timestamp: Optional[datetime] = None,
    ) -> None:
        """Serializes observation parameters into WIS 2.0 GeoJSON format and publishes."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)
        elif timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)

        dt_str = timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        urn_id = f"urn:wmo:md:in-imd:station_{station_id.lower()}:data"

        wis2_dict = {
            "id": urn_id,
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": coords,
            },
            "properties": {
                "station_id": station_id,
                "datetime": dt_str,
                "t": t,
                "p": p,
                "rh": rh,
                "z_scores": z_scores,
                "qc_flags": qc_flags,
                "qc_bitmask": qc_bitmask,
            },
        }

        self.publish_payload(station_id, wis2_dict)
