import pytest
from datetime import datetime, timezone
from backend.app.ingestion.payload_parser import (
    parse_wis2_payload,
    decode_qc_bitmask,
    PayloadValidationError,
    QC_BIT_PHYSICAL_THERMO_VIOLATION,
    QC_BIT_FROZEN_REGISTER_FAULT,
    QC_BIT_THERMODYNAMIC_INVARIANT_VIOLATION,
)


def get_valid_payload():
    return {
        "type": "Feature",
        "id": "urn:wmo:md:in-imd:station_delhi_04:data",
        "geometry": {
            "type": "Point",
            "coordinates": [77.2090, 28.6139, 216.0],
        },
        "properties": {
            "station_id": "DELHI_AWS_04",
            "datetime": "2023-10-25T12:00:00Z",
            "t": 25.4,
            "p": 1013.25,
            "rh": 55.0,
            "qc_bitmask": 0,
        },
    }


def test_parse_valid_wis2_payload():
    payload = get_valid_payload()
    telemetry = parse_wis2_payload(payload)

    assert telemetry.station_id == "DELHI_AWS_04"
    assert telemetry.longitude == 77.2090
    assert telemetry.latitude == 28.6139
    assert telemetry.elevation == 216.0
    assert telemetry.t == 25.4
    assert telemetry.p == 1013.25
    assert telemetry.rh == 55.0
    assert telemetry.qc_bitmask == 0
    assert telemetry.qc_flags["PHYSICAL_THERMO_VIOLATION"] is False
    assert telemetry.qc_flags["FROZEN_REGISTER_FAULT"] is False
    assert telemetry.qc_flags["THERMODYNAMIC_INVARIANT_VIOLATION"] is False


def test_qc_bitmask_decoding():
    bitmask = (
        QC_BIT_PHYSICAL_THERMO_VIOLATION | QC_BIT_THERMODYNAMIC_INVARIANT_VIOLATION
    )
    flags = decode_qc_bitmask(bitmask)

    assert flags["PHYSICAL_THERMO_VIOLATION"] is True
    assert flags["FROZEN_REGISTER_FAULT"] is False
    assert flags["THERMODYNAMIC_INVARIANT_VIOLATION"] is True

    payload = get_valid_payload()
    payload["properties"]["qc_bitmask"] = (
        QC_BIT_FROZEN_REGISTER_FAULT | QC_BIT_THERMODYNAMIC_INVARIANT_VIOLATION
    )
    telemetry = parse_wis2_payload(payload)

    assert telemetry.qc_flags["PHYSICAL_THERMO_VIOLATION"] is False
    assert telemetry.qc_flags["FROZEN_REGISTER_FAULT"] is True
    assert telemetry.qc_flags["THERMODYNAMIC_INVARIANT_VIOLATION"] is True


def test_malformed_geojson_structure():
    with pytest.raises(PayloadValidationError, match="dictionary JSON object"):
        parse_wis2_payload("not a dict")

    payload = get_valid_payload()
    payload["type"] = "InvalidType"
    with pytest.raises(PayloadValidationError, match="type"):
        parse_wis2_payload(payload)

    payload = get_valid_payload()
    payload["geometry"] = {"type": "LineString", "coordinates": [[0, 0], [1, 1]]}
    with pytest.raises(PayloadValidationError, match="Point"):
        parse_wis2_payload(payload)


def test_missing_coordinates():
    payload = get_valid_payload()
    payload["geometry"]["coordinates"] = [77.2090]
    with pytest.raises(PayloadValidationError, match="coordinates"):
        parse_wis2_payload(payload)

    payload = get_valid_payload()
    payload["geometry"]["coordinates"] = None
    with pytest.raises(PayloadValidationError, match="coordinates"):
        parse_wis2_payload(payload)


def test_out_of_range_coordinates():
    payload = get_valid_payload()
    payload["geometry"]["coordinates"] = [195.0, 28.6139]
    with pytest.raises(PayloadValidationError, match="Longitude"):
        parse_wis2_payload(payload)

    payload = get_valid_payload()
    payload["geometry"]["coordinates"] = [77.2090, -95.0]
    with pytest.raises(PayloadValidationError, match="Latitude"):
        parse_wis2_payload(payload)


def test_out_of_range_sensor_values():
    payload = get_valid_payload()
    payload["properties"]["t"] = 75.0
    with pytest.raises(PayloadValidationError, match="t"):
        parse_wis2_payload(payload)

    payload = get_valid_payload()
    payload["properties"]["p"] = 200.0
    with pytest.raises(PayloadValidationError, match="p"):
        parse_wis2_payload(payload)

    payload = get_valid_payload()
    payload["properties"]["rh"] = -5.0
    with pytest.raises(PayloadValidationError, match="rh"):
        parse_wis2_payload(payload)


def test_missing_or_invalid_datetime():
    payload = get_valid_payload()
    del payload["properties"]["datetime"]
    with pytest.raises(PayloadValidationError, match="datetime"):
        parse_wis2_payload(payload)

    payload = get_valid_payload()
    payload["properties"]["datetime"] = "not-a-timestamp"
    with pytest.raises(PayloadValidationError, match="timestamp format"):
        parse_wis2_payload(payload)
