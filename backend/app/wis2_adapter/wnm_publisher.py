import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict
import aiomqtt

from app.config.settings import settings
from app.wis2_adapter.schemas import WIS2NotificationMessage

logger = logging.getLogger("skyguard.wis2.publisher")


class WIS2NotificationPublisher:
    """
    Generates and publishes WMO WIS2 Notification Messages (WNM)
    adhering to the notify-then-fetch pattern over MQTT.
    """

    @classmethod
    def build_wnm(
        cls,
        wsi: str,
        latitude: float,
        longitude: float,
        object_id: str,
        file_size_bytes: int,
        checksum_md5: str,
        timestamp: datetime,
    ) -> WIS2NotificationMessage:
        download_url = f"{settings.WIS2_BASE_URL}/{object_id}"
        topic = f"origin/a/wis2/{settings.WIS2_CENTRE_ID}/data/core/weather/surface-based-observations/synop"

        return WIS2NotificationMessage(
            geometry={
                "type": "Point",
                "coordinates": [longitude, latitude],
            },
            properties={
                "data_id": f"{topic}/{wsi}/{timestamp.strftime('%Y%m%dT%H%M%SZ')}",
                "pubtime": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "datetime": timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "wsi": wsi,
                "centre_id": settings.WIS2_CENTRE_ID,
                "content": {
                    "size": file_size_bytes,
                    "checksum": {
                        "type": "md5",
                        "value": checksum_md5,
                    },
                },
            },
            links=[
                {
                    "rel": "canonical",
                    "type": "application/x-bufr",
                    "href": download_url,
                }
            ],
        )

    @classmethod
    async def publish_wnm(cls, wnm: WIS2NotificationMessage) -> bool:
        topic = f"origin/a/wis2/{settings.WIS2_CENTRE_ID}/data/core/weather/surface-based-observations/synop"
        try:
            async with aiomqtt.Client(hostname=settings.WIS2_GB_HOST, port=settings.WIS2_GB_PORT) as client:
                payload = json.dumps(wnm.model_dump(), separators=(",", ":"))
                await client.publish(topic, payload=payload, qos=1)
                logger.info(f"Published WIS2 WNM for WSI {wnm.properties.get('wsi')} to topic '{topic}'")
                return True
        except Exception as err:
            logger.error(f"Failed to publish WNM to WIS2 broker: {err}")
            return False
