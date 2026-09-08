from datetime import datetime, timedelta, timezone
import pytest

from app.pipelines.kalman_healing import (
    KinematicKalmanFilter1D,
    apply_retrospective_back_flagging,
    impute_missing_value,
)


def test_kalman_filter_predict_and_update():
    kf = KinematicKalmanFilter1D(initial_value=1013.25, initial_rate=0.1)

    # Predict forward 1 hour
    val, rate = kf.predict(dt_hours=1.0)
    assert pytest.approx(val, abs=1e-3) == 1013.35
    assert pytest.approx(rate, abs=1e-3) == 0.1

    # Update with measurement
    updated_val, updated_rate = kf.update(measurement=1013.5)
    assert updated_val > 1013.35


def test_impute_missing_value():
    kf = KinematicKalmanFilter1D(initial_value=1000.0, initial_rate=-0.5)
    result = impute_missing_value(kf, dt_hours=2.0)

    assert pytest.approx(result["imputed_value"], abs=1e-3) == 999.0
    assert pytest.approx(result["imputed_rate"], abs=1e-3) == -0.5
    assert "variance" in result


def test_retrospective_back_flagging_within_and_exceeding_72h_ceiling():
    now = datetime.now(timezone.utc)
    t_10h = now - timedelta(hours=10)
    t_50h = now - timedelta(hours=50)
    t_80h = now - timedelta(hours=80)

    ledger = [
        {"timestamp": t_10h, "value": 1012.0, "qc_state": "GOOD"},
        {"timestamp": t_50h, "value": 1011.5, "qc_state": "GOOD"},
        {"timestamp": t_80h, "value": 1010.0, "qc_state": "GOOD"},
    ]

    updated = apply_retrospective_back_flagging(
        ledger=ledger,
        flag_trigger_time=now,
        flag_status="SUSPECT",
        max_lookback_hours=72.0,
    )

    # 10h and 50h are within 72h ceiling -> flagged
    assert updated[0]["qc_state"] == "SUSPECT"
    assert updated[0]["back_flagged"] is True
    assert updated[0]["raw_value"] == 1012.0

    assert updated[1]["qc_state"] == "SUSPECT"
    assert updated[1]["back_flagged"] is True
    assert updated[1]["raw_value"] == 1011.5

    # 80h exceeds 72h ceiling -> unflagged
    assert updated[2]["qc_state"] == "GOOD"
    assert updated[2].get("back_flagged") is not True
    assert updated[2]["raw_value"] == 1010.0
