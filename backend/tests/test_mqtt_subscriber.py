import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import aiomqtt
import pytest

from backend.app.ingestion.mqtt_subscriber import DEFAULT_TOPIC, AsyncMQTTSubscriber
from backend.app.pipelines.orchestrator import CentralPipelineOrchestrator


def get_sample_wis2_payload():
    return {
        "id": "urn:wmo:md:in-imd:station_delhi_04:data:20260330",
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [77.2090, 28.6139, 216.0],
        },
        "properties": {
            "station_id": "DELHI_AWS_04",
            "datetime": "2026-03-30T12:00:00Z",
            "air_temperature": 29.5,
            "relative_humidity": 62.0,
            "barometric_pressure": 1013.25,
            "qc_bitmask": 0,
        },
    }


def test_subscriber_default_topic_and_init():
    orchestrator = MagicMock(spec=CentralPipelineOrchestrator)
    subscriber = AsyncMQTTSubscriber(orchestrator=orchestrator)
    assert subscriber.topic == DEFAULT_TOPIC
    assert subscriber.topic == "origin/a/wis2/in-imd/station/+/data"


def test_handle_message_valid_payload():
    async def _run():
        orchestrator = MagicMock(spec=CentralPipelineOrchestrator)
        subscriber = AsyncMQTTSubscriber(orchestrator=orchestrator)

        payload_dict = get_sample_wis2_payload()
        payload_bytes = json.dumps(payload_dict).encode("utf-8")

        await subscriber.handle_message(payload_bytes)

        assert orchestrator.process_telemetry.called
        telemetry = orchestrator.process_telemetry.call_args[0][0]
        assert telemetry.station_id == "DELHI_AWS_04"
        assert telemetry.barometric_pressure == 1013.25

    asyncio.run(_run())


def test_handle_message_invalid_json():
    async def _run():
        orchestrator = MagicMock(spec=CentralPipelineOrchestrator)
        subscriber = AsyncMQTTSubscriber(orchestrator=orchestrator)

        invalid_bytes = b"not-a-json"
        await subscriber.handle_message(invalid_bytes)

        orchestrator.process_telemetry.assert_not_called()

    asyncio.run(_run())


def test_subscriber_subscription_and_loop():
    async def _run():
        mock_orchestrator = MagicMock(spec=CentralPipelineOrchestrator)
        subscriber = AsyncMQTTSubscriber(
            broker_host="localhost",
            broker_port=1883,
            orchestrator=mock_orchestrator,
            reconnect_interval=0.01,
            max_reconnect_attempts=1,
        )

        mock_client = AsyncMock()

        class MockMessage:
            def __init__(self, payload: bytes):
                self.payload = payload

        async def mock_messages_gen():
            yield MockMessage(json.dumps(get_sample_wis2_payload()).encode("utf-8"))
            subscriber.stop()

        mock_client.messages = mock_messages_gen()

        with patch("aiomqtt.Client") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value = mock_client
            await subscriber.start()

            mock_client.subscribe.assert_called_once_with(DEFAULT_TOPIC)
            assert mock_orchestrator.process_telemetry.called

    asyncio.run(_run())


def test_reconnection_resilience():
    async def _run():
        mock_orchestrator = MagicMock(spec=CentralPipelineOrchestrator)
        subscriber = AsyncMQTTSubscriber(
            broker_host="localhost",
            broker_port=1883,
            orchestrator=mock_orchestrator,
            reconnect_interval=0.01,
            max_reconnect_attempts=2,
        )

        call_count = 0

        def client_factory(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise aiomqtt.MqttError("Simulated disconnect")

            mock_client = AsyncMock()

            async def mock_messages_gen():
                yield MagicMock(payload=json.dumps(get_sample_wis2_payload()).encode("utf-8"))
                subscriber.stop()

            mock_client.messages = mock_messages_gen()
            ctx = AsyncMock()
            ctx.__aenter__.return_value = mock_client
            return ctx

        with patch("aiomqtt.Client", side_effect=client_factory):
            await subscriber.start()

        assert call_count == 2
        assert mock_orchestrator.process_telemetry.called

    asyncio.run(_run())
