import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points on Earth in kilometers."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_KM * c


def filter_neighbors(
    target_lat: float,
    target_lon: float,
    target_time: datetime,
    candidates: List[Dict[str, Any]],
    max_radius_km: float = 30.0,
    max_staleness_seconds: float = 1200.0,  # 20 minutes
) -> List[Tuple[Dict[str, Any], float]]:
    """Filters candidate neighbor stations based on distance, staleness, and QC state ('GOOD').

    Returns list of tuples (candidate, distance_km).
    """
    filtered = []

    for station in candidates:
        # Filter by QC state
        qc_state = station.get("qc_state", "").upper()
        if qc_state != "GOOD":
            continue

        # Filter by staleness (> 20 mins)
        station_time = station.get("datetime")
        if isinstance(station_time, str):
            station_time = datetime.fromisoformat(station_time)

        if station_time.tzinfo is None and target_time.tzinfo is not None:
            station_time = station_time.replace(tzinfo=timezone.utc)
        elif station_time.tzinfo is not None and target_time.tzinfo is None:
            target_time = target_time.replace(tzinfo=timezone.utc)

        time_diff = abs((target_time - station_time).total_seconds())
        if time_diff > max_staleness_seconds:
            continue

        # Distance calculation
        st_lat = station["latitude"]
        st_lon = station["longitude"]
        dist = haversine_distance(target_lat, target_lon, st_lat, st_lon)

        if dist <= max_radius_km:
            filtered.append((station, dist))

    return filtered


def inverse_distance_weighting(
    neighbors_with_dist: List[Tuple[Dict[str, Any], float]],
    value_key: str,
    power: float = 2.0,
) -> float:
    """Computes Inverse Distance Weighting interpolation for a given observation parameter key."""
    if not neighbors_with_dist:
        raise ValueError("No valid neighbors available for IDW calculation.")

    # If any neighbor is co-located (distance == 0), return its value directly
    for station, dist in neighbors_with_dist:
        if dist < 1e-6:
            return float(station[value_key])

    weighted_sum = 0.0
    weight_total = 0.0

    for station, dist in neighbors_with_dist:
        weight = 1.0 / (dist ** power)
        weighted_sum += float(station[value_key]) * weight
        weight_total += weight

    return weighted_sum / weight_total


def predict_spatial_value(
    target_lat: float,
    target_lon: float,
    target_time: datetime,
    candidates: List[Dict[str, Any]],
    value_key: str,
    default_radius_km: float = 30.0,
    max_radius_km: float = 75.0,
    max_staleness_seconds: float = 1200.0,
    power: float = 2.0,
) -> Optional[float]:
    """Predicts expected parameter value using IDW with radius expansion (30 km -> 75 km)."""
    # First search within default radius
    neighbors = filter_neighbors(
        target_lat,
        target_lon,
        target_time,
        candidates,
        max_radius_km=default_radius_km,
        max_staleness_seconds=max_staleness_seconds,
    )

    # Expand to max_radius_km if no neighbors found in default radius
    if not neighbors and default_radius_km < max_radius_km:
        neighbors = filter_neighbors(
            target_lat,
            target_lon,
            target_time,
            candidates,
            max_radius_km=max_radius_km,
            max_staleness_seconds=max_staleness_seconds,
        )

    if not neighbors:
        return None

    return inverse_distance_weighting(neighbors, value_key=value_key, power=power)
