import math
import statistics
import pytest
from datetime import datetime, timezone

from edge_simulator.simulator import (
    EdgeSimulator,
    StationConfig,
    AnomalyMode,
    calculate_sonntag_e_s,
    calculate_dew_point,
    BITMASK_THERMO_INVARIANT,
    BITMASK_PHYSICAL_LIMIT,
    BITMASK_FROZEN_REGISTER,
)


def test_atmospheric_data_generation_valid_ranges():
    sim = EdgeSimulator()
    payload = sim.process_step(mode=AnomalyMode.NORMAL)
    props = payload["properties"]

    assert -50.0 <= props["t"] <= 60.0
    assert 800.0 <= props["p"] <= 1100.0
    assert 0.0 <= props["rh"] <= 100.0


def test_sonntag_saturation_vapor_pressure_and_dew_point():
    # Test known value at 20°C: e_s ~ 23.37 hPa
    e_s_20 = calculate_sonntag_e_s(20.0)
    assert pytest.approx(e_s_20, abs=0.5) == 23.37

    # Dew point invariant for standard conditions (RH <= 100%) -> T_dew <= T_ambient
    temp = 25.0
    rh = 50.0
    t_dew = calculate_dew_point(temp, rh)
    assert t_dew <= temp

    # At 100% RH, T_dew should equal T_ambient
    t_dew_100 = calculate_dew_point(temp, 100.0)
    assert pytest.approx(t_dew_100, abs=0.01) == temp


def test_micro_turbulence_variance_gate():
    sim = EdgeSimulator()

    # Fill rolling buffer with 12 identical high humidity steps (frozen register)
    for _ in range(12):
        payload = sim.process_step(mode=AnomalyMode.FROZEN_ADC)

    props = payload["properties"]
    assert props["qc_flags"]["frozen_register"] is True
    assert props["qc_bitmask"] & BITMASK_FROZEN_REGISTER != 0


def test_wis2_geojson_structure_and_qc_bitmask():
    config = StationConfig(
        station_id="DELHI_AWS_04",
        urn_id="urn:wmo:md:in-imd:station_delhi_04:data",
        longitude=77.2090,
        latitude=28.6139,
        elevation=216.0,
    )
    sim = EdgeSimulator(config=config)
    now = datetime(2026, 9, 8, 9, 0, 0, tzinfo=timezone.utc)
    payload = sim.process_step(mode=AnomalyMode.SUPER_SATURATION, timestamp=now)

    # Check GeoJSON envelope
    assert payload["id"] == "urn:wmo:md:in-imd:station_delhi_04:data"
    assert payload["type"] == "Feature"
    assert payload["geometry"]["type"] == "Point"
    assert payload["geometry"]["coordinates"] == [77.2090, 28.6139, 216.0]

    # Check Properties
    props = payload["properties"]
    assert props["station_id"] == "DELHI_AWS_04"
    assert props["datetime"] == "2026-09-08T09:00:00Z"
    assert "z_scores" in props
    assert "qc_flags" in props
    assert "qc_bitmask" in props

    # Supersaturation should trigger physical limit exceeded
    assert props["qc_flags"]["physical_limit_exceeded"] is True
    assert props["qc_bitmask"] & BITMASK_PHYSICAL_LIMIT != 0
