import sys
from pathlib import Path
from datetime import datetime, timezone

# Ensure project root & backend package are in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pytest
from backend.app.pipelines.tidal_demod import calculate_solar_tide, demodulate_pressure


def test_solar_tide_peaks_and_troughs():
    lat = 0.0  # Equatorial max amplitude

    # Peaks at 10:00 and 22:00
    tide_10 = calculate_solar_tide(10.0, station_lat=lat)
    tide_22 = calculate_solar_tide(22.0, station_lat=lat)
    assert pytest.approx(tide_10, abs=0.05) == 1.16
    assert pytest.approx(tide_22, abs=0.05) == 1.16

    # Troughs at 04:00 and 16:00
    tide_04 = calculate_solar_tide(4.0, station_lat=lat)
    tide_16 = calculate_solar_tide(16.0, station_lat=lat)
    assert pytest.approx(tide_04, abs=0.05) == -1.16
    assert pytest.approx(tide_16, abs=0.05) == -1.16


def test_demodulate_pressure_strips_tidal_oscillation():
    synoptic_base_pressure = 1013.25
    lat, lon = 0.0, 0.0  # Greenwich Meridian at Equator

    # Time at 10:00 UTC (peak tide ~ +1.16 hPa)
    time_peak = datetime(2023, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    raw_peak_pressure = synoptic_base_pressure + 1.16

    demodulated_peak = demodulate_pressure(
        station_pressure=raw_peak_pressure,
        timestamp_utc=time_peak,
        station_lat=lat,
        station_lon=lon,
    )
    assert pytest.approx(demodulated_peak, abs=0.01) == synoptic_base_pressure

    # Time at 16:00 UTC (trough tide ~ -1.16 hPa)
    time_trough = datetime(2023, 1, 1, 16, 0, 0, tzinfo=timezone.utc)
    raw_trough_pressure = synoptic_base_pressure - 1.16

    demodulated_trough = demodulate_pressure(
        station_pressure=raw_trough_pressure,
        timestamp_utc=time_trough,
        station_lat=lat,
        station_lon=lon,
    )
    assert pytest.approx(demodulated_trough, abs=0.01) == synoptic_base_pressure
