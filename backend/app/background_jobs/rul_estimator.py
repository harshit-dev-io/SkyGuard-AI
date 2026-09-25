from datetime import datetime, timezone
import logging
from typing import Dict, Optional, Tuple
import numpy as np
from scipy import stats
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from .celery_app import celery_app
from app.config.settings import settings
 
from .load_shedder import TaskThrottleCoordinator

logger = logging.getLogger("skyguard.jobs.rul")

engine = create_engine(settings.DATABASE_SYNC_URL, pool_pre_ping=True, pool_size=5)


class DegradationPathEstimator:
    """
    Computes sensor degradation velocity and projects Remaining Useful Life (RUL)
    using residual growth rates, repeated median drift slopes, and Weibull survival modeling.
    Enforces honest uncertainty: if trend is non-monotonic or noisy, rul_days is set to NULL.
    """

    MAX_PERMISSIBLE_DRIFT: Dict[str, float] = {
        "temperature": settings.RUL_TEMPERATURE_MAX_DRIFT_CELSIUS,
        "pressure": settings.RUL_PRESSURE_MAX_DRIFT_HPA,
        "humidity": settings.RUL_HUMIDITY_MAX_DRIFT_PERCENT,
    }

    @classmethod
    def estimate_sensor_rul(
        cls,
        timestamps_epoch: np.ndarray,
        residuals: np.ndarray,
        sensor_type: str,
    ) -> Tuple[str, float, Optional[int], float]:
        """
        Calculates failure trajectory distribution.
        Returns:
            health_state: 'HEALTHY' | 'DEGRADED' | 'AT_RISK' | 'FAILED'
            health_score: float in [0.0, 1.0]
            rul_days: Optional[int] (None if indeterminate)
            drift_slope_per_day: float
        """
        if len(residuals) < settings.RUL_MIN_DATA_POINTS:
            return "UNKNOWN", 0.5, None, 0.0

        days_axis = (timestamps_epoch - timestamps_epoch[0]) / 86400.0
        abs_residuals = np.abs(residuals)

        # 1. Theil-Sen Robust Linear Trend (Resistant to outliers and extreme spikes)
        slope, intercept, _, _ = stats.theilslopes(abs_residuals, days_axis, alpha=0.95)
        drift_slope_per_day = float(slope)

        # 2. Monotonicity Test via Spearman Rank Correlation
        spearman_rho, spearman_p = stats.spearmanr(days_axis, abs_residuals)
        is_monotonic_deterioration = bool(spearman_rho > 0.40 and spearman_p < 0.01)

        max_limit = cls.MAX_PERMISSIBLE_DRIFT.get(sensor_type, 2.5)
        current_smoothed_error = float(np.median(abs_residuals[-24:]))  # 24-sample recent median

        # 3. Health State & Scoring
        health_ratio = max(0.0, 1.0 - (current_smoothed_error / max_limit))
        health_score = round(float(np.clip(health_ratio, 0.0, 1.0)), 3)

        if current_smoothed_error >= max_limit:
            return "FAILED", 0.0, 0, drift_slope_per_day
        elif health_score < 0.40:
            health_state = "AT_RISK"
        elif health_score < 0.75:
            health_state = "DEGRADED"
        else:
            health_state = "HEALTHY"

        # 4. RUL Projection
        if drift_slope_per_day <= 0.001 or not is_monotonic_deterioration:
            # Trajectory is stable, declining, or non-monotonic: cannot project a precise lifespan
            return health_state, health_score, None, drift_slope_per_day

        remaining_margin = max(0.0, max_limit - current_smoothed_error)
        projected_days_mean = remaining_margin / drift_slope_per_day

        # 5. Weibull Residual Survival Scale Factor
        # Fit 2-parameter Weibull to residual increments for stochastic survival discount
        positive_diffs = np.diff(abs_residuals)
        positive_diffs = positive_diffs[positive_diffs > 0.001]

        if len(positive_diffs) > 30:
            shape, loc, scale = stats.weibull_min.fit(positive_diffs, floc=0)
            # Conservative survival discounting (80th percentile risk frontier)
            survival_discount = float(stats.weibull_min.ppf(0.80, shape, loc=loc, scale=scale))
            projected_days = max(1, int(projected_days_mean / max(1.0, survival_discount * 10.0)))
        else:
            projected_days = max(1, int(projected_days_mean))

        # Clamp max realistic RUL to 2 years (730 days)
        rul_days = min(730, projected_days)
        return health_state, health_score, rul_days, round(drift_slope_per_day, 5)


@celery_app.task(name="app.background_jobs.rul_estimator.execute_daily_rul_estimation", bind=True)
def execute_daily_rul_estimation(self):
    """Daily offline job computing degradation velocity and RUL across all deployed stations."""
    if TaskThrottleCoordinator.is_task_paused("rul_estimator"):
        logger.warning("LOAD SHEDDING: RUL estimation task throttled due to consumer lag.")
        return {"status": "throttled", "reason": "load_shedding"}

    logger.info("Executing Daily Remaining Useful Life (RUL) Analysis...")
    now_utc = datetime.now(timezone.utc)
    records_processed = 0

    with Session(engine) as session:
        # Fetch distinct stations and sensors active in the last 14 days
        stations_query = text("""
            SELECT DISTINCT station_id, sensor_id, data_source
            FROM raw_observations
            WHERE timestamp >= NOW() - INTERVAL '14 days'
        """)
        sensors = session.execute(stations_query).fetchall()

        for st_id, sens_id, source in sensors:
            # Query timeseries history
            ts_query = text("""
                SELECT 
                    EXTRACT(EPOCH FROM timestamp)::double precision as ep,
                    (payload->>'temperature')::double precision as val,
                    COALESCE((payload->>'edge_residual')::double precision, 0.0) as res
                FROM raw_observations
                WHERE station_id = :st_id AND sensor_id = :sens_id
                  AND timestamp >= NOW() - INTERVAL '14 days'
                ORDER BY timestamp ASC
            """)
            rows = session.execute(ts_query, {"st_id": st_id, "sens_id": sens_id}).fetchall()
            if not rows:
                continue

            epochs = np.array([r.ep for r in rows], dtype=np.float64)
            residuals = np.array([r.res for r in rows], dtype=np.float64)

            state, score, rul, slope = DegradationPathEstimator.estimate_sensor_rul(
                timestamps_epoch=epochs,
                residuals=residuals,
                sensor_type="temperature",
            )

            # Persist health record to station_health
            insert_stmt = text("""
                INSERT INTO station_health (
                    station_id, sensor_id, health_state, health_score,
                    rul_days, degradation_slope, estimator_version, computed_at
                ) VALUES (
                    :st_id, :sens_id, :h_state, :h_score,
                    :rul, :slope, :version, :computed_at
                )
                ON CONFLICT (station_id, sensor_id) DO UPDATE SET
                    health_state = EXCLUDED.health_state,
                    health_score = EXCLUDED.health_score,
                    rul_days = EXCLUDED.rul_days,
                    degradation_slope = EXCLUDED.degradation_slope,
                    estimator_version = EXCLUDED.estimator_version,
                    computed_at = EXCLUDED.computed_at
            """)
            session.execute(insert_stmt, {
                "st_id": st_id,
                "sens_id": sens_id,
                "h_state": state,
                "h_score": score,
                "rul": rul,
                "slope": slope,
                "version": settings.RUL_ESTIMATOR_VERSION,
                "computed_at": now_utc,
            })
            records_processed += 1

        session.commit()

    logger.info(f"RUL Estimation Complete. Updated {records_processed} sensor profiles.")
    return {"status": "success", "sensors_evaluated": records_processed}