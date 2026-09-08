import pytest
from datetime import datetime, timedelta, timezone

try:
    from app.pipelines.spatial_idw import (
        haversine_distance,
        filter_neighbors,
        inverse_distance_weighting,
        predict_spatial_value,
    )
except ModuleNotFoundError:
    from backend.app.pipelines.spatial_idw import (
        haversine_distance,
        filter_neighbors,
        inverse_distance_weighting,
        predict_spatial_value,
    )


def test_haversine_distance_zero():
    # Distance to self should be 0
    dist = haversine_distance(28.6139, 77.2090, 28.6139, 77.2090)
    assert pytest.approx(dist, abs=1e-3) == 0.0


def test_haversine_distance_known_points():
    # Approx distance between New Delhi (28.6139, 77.2090) and Gurgaon (28.4595, 77.0266) is ~24 km
    dist = haversine_distance(28.6139, 77.2090, 28.4595, 77.0266)
    assert 20.0 < dist < 30.0


def test_filter_neighbors_qc_staleness_and_distance():
    now = datetime.now(timezone.utc)
    target_lat, target_lon = 28.6139, 77.2090

    candidates = [
        # Valid neighbor (within 30 km, fresh, GOOD)
        {
            "station_id": "ST_01",
            "latitude": 28.6200,
            "longitude": 77.2100,
            "datetime": now - timedelta(minutes=5),
            "qc_state": "GOOD",
            "t": 25.0,
        },
        # Staleness failure (> 20 mins)
        {
            "station_id": "ST_02",
            "latitude": 28.6200,
            "longitude": 77.2100,
            "datetime": now - timedelta(minutes=25),
            "qc_state": "GOOD",
            "t": 24.0,
        },
        # Bad QC state failure
        {
            "station_id": "ST_03",
            "latitude": 28.6200,
            "longitude": 77.2100,
            "datetime": now - timedelta(minutes=5),
            "qc_state": "SUSPECT",
            "t": 26.0,
        },
        # Distance failure (> 30 km)
        {
            "station_id": "ST_04",
            "latitude": 29.5000,
            "longitude": 78.5000,
            "datetime": now - timedelta(minutes=2),
            "qc_state": "GOOD",
            "t": 22.0,
        },
    ]

    filtered = filter_neighbors(target_lat, target_lon, now, candidates, max_radius_km=30.0)
    assert len(filtered) == 1
    assert filtered[0][0]["station_id"] == "ST_01"


def test_inverse_distance_weighting_power_two():
    neighbors_with_dist = [
        ({"t": 20.0}, 10.0),  # weight 1/100 = 0.01
        ({"t": 30.0}, 20.0),  # weight 1/400 = 0.0025
    ]
    # expected: (20 * 0.01 + 30 * 0.0025) / (0.01 + 0.0025) = (0.2 + 0.075) / 0.0125 = 0.275 / 0.0125 = 22.0
    predicted = inverse_distance_weighting(neighbors_with_dist, value_key="t", power=2.0)
    assert pytest.approx(predicted, abs=1e-4) == 22.0


def test_inverse_distance_weighting_zero_distance():
    neighbors_with_dist = [
        ({"t": 25.5}, 0.0),
        ({"t": 30.0}, 10.0),
    ]
    predicted = inverse_distance_weighting(neighbors_with_dist, value_key="t", power=2.0)
    assert predicted == 25.5


def test_predict_spatial_value_radius_expansion():
    now = datetime.now(timezone.utc)
    target_lat, target_lon = 28.6139, 77.2090

    # Neighbor at ~40 km (outside 30 km default, inside 75 km max)
    candidates = [
        {
            "station_id": "ST_FAR",
            "latitude": 28.9000,
            "longitude": 77.3000,
            "datetime": now,
            "qc_state": "GOOD",
            "t": 28.0,
        }
    ]

    # Searching with max 30 km return None
    pred_30 = predict_spatial_value(
        target_lat, target_lon, now, candidates, value_key="t", default_radius_km=30.0, max_radius_km=30.0
    )
    assert pred_30 is None

    # Searching with expansion to 75 km returns prediction
    pred_75 = predict_spatial_value(
        target_lat, target_lon, now, candidates, value_key="t", default_radius_km=30.0, max_radius_km=75.0
    )
    assert pred_75 == 28.0
