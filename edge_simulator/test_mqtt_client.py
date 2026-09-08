import json
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from edge_simulator.mqtt_client import MQTTPublisher


class TestMQTTPublisher(unittest.TestCase):
    def setUp(self) -> None:
        self.mock_mqtt_client = MagicMock()
        self.publisher = MQTTPublisher(client=self.mock_mqtt_client)

    def test_connect_and_disconnect(self) -> None:
        self.publisher.connect(host="mqtt.example.com", port=1883, keepalive=30)
        self.mock_mqtt_client.connect.assert_called_once_with("mqtt.example.com", 1883, 30)
        self.mock_mqtt_client.loop_start.assert_called_once()

        self.publisher.disconnect()
        self.mock_mqtt_client.loop_stop.assert_called_once()
        self.mock_mqtt_client.disconnect.assert_called_once()

    def test_publish_payload(self) -> None:
        station_id = "DELHI_AWS_04"
        sample_payload = {"type": "Feature", "properties": {"station_id": station_id}}

        self.publisher.publish_payload(station_id, sample_payload)

        expected_topic = "origin/a/wis2/in-imd/station/DELHI_AWS_04/data"
        expected_payload_str = json.dumps(sample_payload)

        self.mock_mqtt_client.publish.assert_called_once_with(
            expected_topic, expected_payload_str, qos=1
        )

    def test_publish_reading_geojson_structure(self) -> None:
        station_id = "DELHI_AWS_04"
        coords = [77.2090, 28.6139, 216.0]
        t = 32.4
        p = 1008.2
        rh = 68.5
        z_scores = {"z_t": 0.12, "z_p": 0.05, "z_rh": -0.21}
        qc_flags = {
            "thermo_violation": False,
            "frozen_register": False,
            "physical_limit_exceeded": False,
        }
        qc_bitmask = 0
        ts = datetime(2026, 9, 8, 9, 0, 0, tzinfo=timezone.utc)

        self.publisher.publish_reading(
            station_id=station_id,
            coords=coords,
            t=t,
            p=p,
            rh=rh,
            z_scores=z_scores,
            qc_bitmask=qc_bitmask,
            qc_flags=qc_flags,
            timestamp=ts,
        )

        self.mock_mqtt_client.publish.assert_called_once()
        args, kwargs = self.mock_mqtt_client.publish.call_args
        topic, published_str = args[0], args[1]
        qos = kwargs.get("qos")

        self.assertEqual(topic, "origin/a/wis2/in-imd/station/DELHI_AWS_04/data")
        self.assertEqual(qos, 1)

        payload_dict = json.loads(published_str)
        self.assertEqual(payload_dict["id"], "urn:wmo:md:in-imd:station_delhi_aws_04:data")
        self.assertEqual(payload_dict["type"], "Feature")
        self.assertEqual(payload_dict["geometry"]["type"], "Point")
        self.assertEqual(payload_dict["geometry"]["coordinates"], coords)
        
        props = payload_dict["properties"]
        self.assertEqual(props["station_id"], "DELHI_AWS_04")
        self.assertEqual(props["datetime"], "2026-09-08T09:00:00Z")
        self.assertEqual(props["t"], t)
        self.assertEqual(props["p"], p)
        self.assertEqual(props["rh"], rh)
        self.assertEqual(props["z_scores"], z_scores)
        self.assertEqual(props["qc_flags"], qc_flags)
        self.assertEqual(props["qc_bitmask"], qc_bitmask)


if __name__ == "__main__":
    unittest.main()
