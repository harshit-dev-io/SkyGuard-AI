from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple


class KinematicKalmanFilter1D:
    """1D Kinematic Kalman Filter tracking synoptic pressure state [P, dP/dt]^T."""

    def __init__(
        self,
        initial_value: float,
        initial_rate: float = 0.0,
        process_noise_p: float = 0.01,
        process_noise_rate: float = 0.001,
        measurement_noise: float = 0.1,
    ) -> None:
        # State vector: [value, rate_of_change]
        self.x: List[float] = [float(initial_value), float(initial_rate)]
        # Covariance matrix 2x2
        self.P: List[List[float]] = [[1.0, 0.0], [0.0, 1.0]]
        self.q_p = process_noise_p
        self.q_rate = process_noise_rate
        self.r_meas = measurement_noise

    def predict(self, dt_hours: float) -> Tuple[float, float]:
        """Predict state forward by dt_hours."""
        if dt_hours < 0:
            dt_hours = 0.0

        # State transition F = [[1, dt], [0, 1]]
        f00, f01 = 1.0, dt_hours
        f10, f11 = 0.0, 1.0

        x0 = f00 * self.x[0] + f01 * self.x[1]
        x1 = f10 * self.x[0] + f11 * self.x[1]
        self.x = [x0, x1]

        # P_new = F * P * F^T + Q
        p00 = self.P[0][0] + dt_hours * (self.P[1][0] + self.P[0][1]) + (dt_hours ** 2) * self.P[1][1] + self.q_p
        p01 = self.P[0][1] + dt_hours * self.P[1][1]
        p10 = self.P[1][0] + dt_hours * self.P[1][1]
        p11 = self.P[1][1] + self.q_rate

        self.P = [[p00, p01], [p10, p11]]
        return self.x[0], self.x[1]

    def update(self, measurement: float) -> Tuple[float, float]:
        """Update state estimate with new measurement H = [1, 0]."""
        # Innovation y = z - Hx
        y = measurement - self.x[0]

        # Innovation covariance S = H * P * H^T + R = P00 + R
        s = self.P[0][0] + self.r_meas

        # Kalman gain K = P * H^T / S
        k0 = self.P[0][0] / s
        k1 = self.P[1][0] / s

        # State update
        self.x[0] += k0 * y
        self.x[1] += k1 * y

        # Covariance update P = (I - K H) P
        p00 = (1.0 - k0) * self.P[0][0]
        p01 = (1.0 - k0) * self.P[0][1]
        p10 = self.P[1][0] - k1 * self.P[0][0]
        p11 = self.P[1][1] - k1 * self.P[0][1]

        self.P = [[p00, p01], [p10, p11]]
        return self.x[0], self.x[1]


def impute_missing_value(
    kf: KinematicKalmanFilter1D, dt_hours: float
) -> Dict[str, float]:
    """Generates predicted state and rate for data imputation during gaps."""
    predicted_val, predicted_rate = kf.predict(dt_hours)
    return {
        "imputed_value": predicted_val,
        "imputed_rate": predicted_rate,
        "variance": kf.P[0][0],
    }


def apply_retrospective_back_flagging(
    ledger: List[Dict[str, Any]],
    flag_trigger_time: datetime,
    flag_status: str = "FLAGGED_INVALID",
    max_lookback_hours: float = 72.0,
) -> List[Dict[str, Any]]:
    """Flags past observations up to max_lookback_hours (72h ceiling) without changing raw values."""
    max_seconds = max_lookback_hours * 3600.0
    updated_ledger: List[Dict[str, Any]] = []

    for entry in ledger:
        new_entry = dict(entry)
        entry_time = new_entry["timestamp"]
        if isinstance(entry_time, str):
            entry_dt = datetime.fromisoformat(entry_time)
        else:
            entry_dt = entry_time

        time_diff_sec = (flag_trigger_time - entry_dt).total_seconds()

        # Preserve immutable raw record field
        if "raw_value" not in new_entry:
            new_entry["raw_value"] = new_entry.get("value")

        if 0.0 <= time_diff_sec <= max_seconds:
            new_entry["qc_state"] = flag_status
            new_entry["back_flagged"] = True

        updated_ledger.append(new_entry)

    return updated_ledger
