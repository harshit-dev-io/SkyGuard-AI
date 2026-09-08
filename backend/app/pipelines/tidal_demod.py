import math
from datetime import datetime, timezone


def calculate_solar_tide(
    solar_time_hours: float,
    station_lat: float,
    station_elevation_m: float = 0.0,
) -> float:
    """Calculates the semi-diurnal solar atmospheric pressure tide anomaly (in hPa).

    The main atmospheric tide component S2(p) has a 12-hour period, peaking
    at approx 10:00 and 22:00 local solar time, with troughs at 04:00 and 16:00.
    Amplitude is maximum (~1.16 hPa) at the equator and attenuates with latitude (cos^3(lat)).
    """
    # Base equatorial S2 amplitude (~1.16 hPa)
    base_amplitude = 1.16

    # Latitude factor: cos^3(latitude)
    lat_rad = math.radians(station_lat)
    lat_factor = (math.cos(lat_rad)) ** 3

    # Elevation adjustment (pressure scale height ~8400m)
    elevation_factor = math.exp(-station_elevation_m / 8400.0)

    amplitude = base_amplitude * lat_factor * elevation_factor

    # Phase angle: peaks at 10:00 and 22:00 LST (where 2 * pi * (t - 10) / 12 = 0)
    phase_rad = (2.0 * math.pi * (solar_time_hours - 10.0)) / 12.0

    return amplitude * math.cos(phase_rad)


def demodulate_pressure(
    station_pressure: float,
    timestamp_utc: datetime,
    station_lat: float,
    station_lon: float,
    station_elevation_m: float = 0.0,
) -> float:
    """Subtracts the predictable semi-diurnal solar atmospheric pressure tide

    from the measured station pressure to isolate synoptic anomalies.
    """
    if timestamp_utc.tzinfo is None:
        timestamp_utc = timestamp_utc.replace(tzinfo=timezone.utc)

    # Local Solar Time = UTC hours + (longitude / 15 degrees per hour)
    utc_hours = timestamp_utc.hour + timestamp_utc.minute / 60.0 + timestamp_utc.second / 3600.0
    solar_time_hours = (utc_hours + (station_lon / 15.0)) % 24.0

    tide_anomaly = calculate_solar_tide(
        solar_time_hours=solar_time_hours,
        station_lat=station_lat,
        station_elevation_m=station_elevation_m,
    )

    return station_pressure - tide_anomaly
