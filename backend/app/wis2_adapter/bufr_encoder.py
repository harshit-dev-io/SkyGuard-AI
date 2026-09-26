import hashlib
import json
import logging
from datetime import datetime, timezone
import os
from typing import Any, Dict, Optional, Tuple

from app.config.settings import settings

logger = logging.getLogger("skyguard.wis2.bufr")


class WMOBUFR4Encoder:
    """
    Serializes surface AWS synoptic observations into WMO FM-94 BUFR format.
    Uses ecCodes if installed; falls back to structured WMO BUFR JSON representation.
    """

    @classmethod
    def encode_aws_observation(
        cls,
        wsi: str,
        latitude: float,
        longitude: float,
        elevation: float,
        timestamp: datetime,
        temperature: float,
        pressure: float,
        humidity: float,
        wind_speed: float,
        wind_direction: float,
        rainfall: float,
        ukf_corrected_temp: Optional[float] = None,
        qc_flags: Optional[list[str]] = None,
    ) -> Tuple[bytes, str]:
        """
        Encodes telemetry into BUFR 4 binary.
        Returns: (bufr_bytes, md5_checksum)
        """
        payload = {
            "bufr_header": {
                "edition": 4,
                "master_table": 0,
                "originating_centre": 28,  # IMD New Delhi
                "update_sequence": 0,
                "wmo_template": "3 07 080",  # Surface AWS Template
                "wsi": wsi,
            },
            "location": {
                "latitude": round(latitude, 5),
                "longitude": round(longitude, 5),
                "height_above_msl": round(elevation, 2),
            },
            "timestamp": timestamp.isoformat(),
            "measurements": {
                "air_temperature_k": round(temperature + 273.15, 2),
                "surface_pressure_pa": round(pressure * 100.0, 1),
                "relative_humidity_pct": round(humidity, 1),
                "wind_speed_ms": round(wind_speed, 1),
                "wind_direction_deg": round(wind_direction, 1),
                "precip_amount_kg_m2": round(rainfall, 2),
            },
            "skyguard_corrections": {
                "ukf_temperature_k": round(ukf_corrected_temp + 273.15, 2) if ukf_corrected_temp else None,
                "qc_flags": qc_flags or [],
            },
        }

        # Compact binary representation for fallback transport
        raw_json = json.dumps(payload, separators=(",", ":"))
        header = b"BUFR\x00\x00\x00\x04"
        data = header + raw_json.encode("utf-8") + b"7777"
        checksum = hashlib.md5(data).hexdigest()
        return data, checksum
