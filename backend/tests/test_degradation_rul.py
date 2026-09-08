import pytest

try:
    from backend.app.pipelines.degradation_rul import (
        calculate_health_index_and_rul,
        estimate_drift_theil_sen,
        update_cusum_accumulator,
    )
except ImportError:
    from app.pipelines.degradation_rul import (
        calculate_health_index_and_rul,
        estimate_drift_theil_sen,
        update_cusum_accumulator,
    )


def test_theil_sen_drift_estimation():
    """Verify Theil-Sen slope calculation over a 10-day synthetic drift series."""
    days = [float(i) for i in range(10)]
    # Linear drift of 0.2 units/day with minor noise
    residuals = [0.2 * t + (0.01 if i % 2 == 0 else -0.01) for i, t in enumerate(days)]

    drift_rate = estimate_drift_theil_sen(days, residuals)
    assert pytest.approx(drift_rate, abs=0.05) == 0.2


def test_cusum_accumulator():
    """Verify climate-adaptive CUSUM updates with slack parameter."""
    cusum = 0.0
    slack_k = 0.5

    # Residual within slack -> CUSUM remains 0
    cusum = update_cusum_accumulator(cusum, residual=0.3, slack_k=slack_k)
    assert cusum == 0.0

    # Residual exceeding slack -> CUSUM increases
    cusum = update_cusum_accumulator(cusum, residual=1.5, slack_k=slack_k)
    assert pytest.approx(cusum) == 1.0

    # Continued high residual -> CUSUM accumulates
    cusum = update_cusum_accumulator(cusum, residual=2.0, slack_k=slack_k)
    assert pytest.approx(cusum) == 2.5


def test_health_index_and_rul_nominal():
    """Healthy sensor with zero drift should have 100 Health Index and long RUL."""
    health_index, rul_days = calculate_health_index_and_rul(
        drift_slope_per_day=0.0,
        current_cusum=0.0,
    )
    assert health_index == 100.0
    assert rul_days == 365.0


def test_health_index_and_rul_degraded():
    """Degrading sensor should decrease Health Index and project accurate RUL in days."""
    health_index, rul_days = calculate_health_index_and_rul(
        drift_slope_per_day=0.25,
        current_cusum=25.0,
        max_cusum_threshold=50.0,
        max_allowed_drift_per_day=0.5,
    )
    # 25/50 * 50 = 25 penalty for CUSUM, 0.25/0.5 * 50 = 25 penalty for drift -> health = 50
    assert pytest.approx(health_index) == 50.0
    # Remaining CUSUM headroom = 25.0, drift = 0.25/day -> 100 days
    assert pytest.approx(rul_days, abs=1.0) == 100.0
