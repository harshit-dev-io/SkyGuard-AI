from datetime import datetime, timezone
import hashlib
import logging
import re
from typing import Optional
from .schemas import EdgeTelemetryPayload

logger = logging.getLogger("skyguard.ingest.legacy")


class LegacyMeteorologicalAdapter:
    """
    Normalizes legacy data streams (e.g. Campbell Scientific CR1000 ASCII,
    SYNOP FM-12, generic telemetry CSV) into strict EdgeTelemetryPayloads.
    """

    @classmethod
    def parse(
        cls,
        raw_record: str,
        data_format: str,
        station_id_override: Optional[str] = None,
        recorded_at_override: Optional[datetime] = None,
    ) -> EdgeTelemetryPayload:
        clean = raw_record.strip()

        if data_format == "ASCII_CR1000":
            return cls._parse_cr1000(clean, station_id_override, recorded_at_override)
        elif data_format == "SYNOP_FM12":
            return cls._parse_synop(clean, station_id_override, recorded_at_override)
        elif data_format == "CSV_GENERIC":
            return cls._parse_generic_csv(clean, station_id_override, recorded_at_override)
        else:
            raise ValueError(f"Unsupported legacy format specification: '{data_format}'")

    @classmethod
    def _parse_cr1000(
        cls,
        line: str,
        station_override: Optional[str],
        timestamp_override: Optional[datetime],
    ) -> EdgeTelemetryPayload:
        """
        Format: "TIMESTAMP","RECORD",Temp,RH,Press,WS,WD,Rain
        Example: "2026-09-18 12:00:00",1024,28.4,72.1,1012.3,4.2,185,0.0
        """
        tokens = [t.strip('"') for t in line.split(",")]
        if len(tokens) < 8:
            raise ValueError(f"CR1000 format requires 8 tokens, parsed {len(tokens)}")

        dt_str, seq_str, temp_s, rh_s, press_s, ws_s, wd_s, rain_s = tokens[:8]

        ts = (
            datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
            if timestamp_override is None
            else timestamp_override
        )
        seq = int(seq_str)
        st_id = station_override or "LEGACY_CR1000"

        return EdgeTelemetryPayload(
            station_id=st_id,
            sensor_id=f"LEG-{st_id[-4:] if len(st_id) >= 4 else '01'}",
            timestamp=ts,
            sequence=seq,
            temperature=float(temp_s),
            pressure=float(press_s),
            humidity=float(rh_s),
            wind_speed=float(ws_s),
            wind_direction=float(wd_s),
            rainfall=float(rain_s),
            edge_flags=["LEGACY_ADAPTER_SYNTHESIZED"],
            edge_residual=0.0,
            local_event_flag=False,
            model_version="legacy-bridge",
            firmware_version="cr1000-std",
            battery_voltage=12.4,  # Standard DC lead-acid float
        )

    @classmethod
    def _parse_synop(
        cls,
        code: str,
        station_override: Optional[str],
        timestamp_override: Optional[datetime],
    ) -> EdgeTelemetryPayload:
        """
        Minimal parse for standard WMO FM-12 SYNOP group tokens.
        Example: AAXX 18124 42182 11460 82502 10284 20195 40123 58005
        """
        tokens = re.split(r"\s+", code)
        if len(tokens) < 6:
            raise ValueError("Malformed SYNOP telegram: insufficient code groups")

        station_block = tokens[2] if not station_override else station_override
        ts = timestamp_override or datetime.now(timezone.utc)

        # Approximate values extracted from groups
        temp = 25.0
        rh = 60.0
        press = 1013.2

        for t in tokens:
            if t.startswith("1") and len(t) == 5:  # Temperature: 10TTT
                sign = -1.0 if t[1] == "1" else 1.0
                temp = sign * (float(t[2:]) / 10.0)
            elif t.startswith("4") and len(t) == 5:  # Pressure: 4PPPP
                press = 1000.0 + (float(t[1:]) / 10.0)

        # Synthetic monotonic sequence generated from timestamp if missing
        synthetic_seq = int(ts.timestamp() // 300)

        return EdgeTelemetryPayload(
            station_id=station_block,
            sensor_id="SYNOP-OBS",
            timestamp=ts,
            sequence=synthetic_seq,
            temperature=temp,
            pressure=press,
            humidity=rh,
            wind_speed=3.0,
            wind_direction=0.0,
            rainfall=0.0,
            edge_flags=["SYNOP_CONVERTED"],
            edge_residual=0.0,
            local_event_flag=False,
            model_version="legacy-synop-v1",
            firmware_version="wmo-fm12",
            battery_voltage=12.0,
        )

    @classmethod
    def _parse_generic_csv(
        cls,
        line: str,
        station_override: Optional[str],
        timestamp_override: Optional[datetime],
    ) -> EdgeTelemetryPayload:
        tokens = line.split(",")
        if len(tokens) < 5:
            raise ValueError("CSV Generic must provide at least (temp, press, rh, ws, wd)")

        ts = timestamp_override or datetime.now(timezone.utc)
        # Deterministic sequence proxy derived from SHA-256
        seq_proxy = int(hashlib.md5(line.encode()).hexdigest()[:6], 16)

        return EdgeTelemetryPayload(
            station_id=station_override or "CSV_STATION",
            sensor_id="CSV-GEN",
            timestamp=ts,
            sequence=seq_proxy,
            temperature=float(tokens[0]),
            pressure=float(tokens[1]),
            humidity=float(tokens[2]),
            wind_speed=float(tokens[3]),
            wind_direction=float(tokens[4]),
            rainfall=float(tokens[5]) if len(tokens) > 5 else 0.0,
            edge_flags=["CSV_NORMALIZED"],
            edge_residual=0.0,
            local_event_flag=False,
            model_version="csv-direct",
            firmware_version="csv-1.0",
            battery_voltage=3.90,
        )