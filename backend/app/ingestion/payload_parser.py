from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

QC_BIT_PHYSICAL_THERMO_VIOLATION: int = 1 << 0  # 1
QC_BIT_FROZEN_REGISTER_FAULT: int = 1 << 1  # 2
QC_BIT_THERMODYNAMIC_INVARIANT_VIOLATION: int = 1 << 2  # 4

VALID_RANGES = {
    "longitude": (-180.0, 180.0),
    "latitude": (-90.0, 90.0),
    "t": (-90.0, 60.0),  # Temperature in Celsius
    "p": (300.0, 1100.0),  # Pressure in hPa
    "rh": (0.0, 100.0),  # Relative Humidity in %
}


class PayloadValidationError(ValueError):
    """Raised when WIS 2.0 GeoJSON payload fails structure or domain validation."""

    pass


@dataclass
class ParsedTelemetry:
    station_id: str
    timestamp: datetime
    longitude: float
    latitude: float
    elevation: float
    t: float
    p: float
    rh: float
    qc_bitmask: int
    qc_flags: Dict[str, bool]
    properties: Dict[str, Any]


def decode_qc_bitmask(bitmask: int) -> Dict[str, bool]:
    """Decodes edge QC bitmask into flag names and boolean status."""
    return {
        "PHYSICAL_THERMO_VIOLATION": bool(
            bitmask & QC_BIT_PHYSICAL_THERMO_VIOLATION
        ),
        "FROZEN_REGISTER_FAULT": bool(bitmask & QC_BIT_FROZEN_REGISTER_FAULT),
        "THERMODYNAMIC_INVARIANT_VIOLATION": bool(
            bitmask & QC_BIT_THERMODYNAMIC_INVARIANT_VIOLATION
        ),
    }


def parse_wis2_payload(payload: Dict[str, Any]) -> ParsedTelemetry:
    """Parses and validates a WIS 2.0 GeoJSON telemetry envelope."""
    if not isinstance(payload, dict):
        raise PayloadValidationError("Payload must be a dictionary JSON object")

    if payload.get("type") != "Feature":
        raise PayloadValidationError("Payload missing required 'type': 'Feature'")

    geometry = payload.get("geometry")
    if not isinstance(geometry, dict) or geometry.get("type") != "Point":
        raise PayloadValidationError(
            "Geometry must be a GeoJSON Point object"
        )

    coords = geometry.get("coordinates")
    if not isinstance(coords, (list, tuple)) or len(coords) < 2:
        raise PayloadValidationError(
            "Geometry coordinates must be a list/tuple of [lon, lat, optional elevation]"
        )

    lon, lat = float(coords[0]), float(coords[1])
    elevation = float(coords[2]) if len(coords) > 2 and coords[2] is not None else 0.0

    min_lon, max_lon = VALID_RANGES["longitude"]
    if not (min_lon <= lon <= max_lon):
        raise PayloadValidationError(f"Longitude {lon} out of valid range [{min_lon}, {max_lon}]")

    min_lat, max_lat = VALID_RANGES["latitude"]
    if not (min_lat <= lat <= max_lat):
        raise PayloadValidationError(f"Latitude {lat} out of valid range [{min_lat}, {max_lat}]")

    properties = payload.get("properties")
    if not isinstance(properties, dict):
        raise PayloadValidationError("Payload missing valid 'properties' dictionary")

    station_id = properties.get("station_id") or payload.get("id")
    if not station_id or not isinstance(station_id, str):
        raise PayloadValidationError("Missing valid 'station_id' in properties or feature id")

    raw_datetime = properties.get("datetime")
    if not raw_datetime:
        raise PayloadValidationError("Missing required 'datetime' field in properties")

    try:
        dt_str = str(raw_datetime).replace("Z", "+00:00")
        timestamp = datetime.fromisoformat(dt_str)
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
    except Exception as exc:
        raise PayloadValidationError(f"Invalid timestamp format '{raw_datetime}': {exc}") from exc

    for param in ("t", "p", "rh"):
        if param not in properties or properties[param] is None:
            raise PayloadValidationError(f"Missing required sensor reading '{param}'")
        try:
            val = float(properties[param])
        except (ValueError, TypeError) as exc:
            raise PayloadValidationError(f"Sensor reading '{param}' is not numeric") from exc

        min_val, max_val = VALID_RANGES[param]
        if not (min_val <= val <= max_val):
            raise PayloadValidationError(
                f"Sensor reading '{param}' = {val} out of valid range [{min_val}, {max_val}]"
            )

    t = float(properties["t"])
    p = float(properties["p"])
    rh = float(properties["rh"])

    qc_bitmask = int(properties.get("qc_bitmask", 0))
    qc_flags = decode_qc_bitmask(qc_bitmask)

    return ParsedTelemetry(
        station_id=station_id,
        timestamp=timestamp,
        longitude=lon,
        latitude=lat,
        elevation=elevation,
        t=t,
        p=p,
        rh=rh,
        qc_bitmask=qc_bitmask,
        qc_flags=qc_flags,
        properties=properties,
    )
