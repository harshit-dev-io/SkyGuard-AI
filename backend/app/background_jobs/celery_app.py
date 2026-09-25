from celery import Celery
from celery.schedules import crontab
from app.config.settings import settings

celery_app = Celery(
    "skyguard_maintenance",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.background_jobs.rul_estimator",
        "app.background_jobs.topology_worker",
        "app.background_jobs.historical_rewind",
        "app.background_jobs.calibration_refit",
        "app.background_jobs.load_shedder",
    ],
)

celery_app.conf.update(
    task_track_started=settings.CELERY_TASK_TRACK_STARTED,
    task_time_limit=settings.CELERY_TASK_TIME_LIMIT,
    task_soft_time_limit=settings.CELERY_TASK_SOFT_TIME_LIMIT,
    worker_concurrency=4,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

# Automated Beat Schedule
celery_app.conf.beat_schedule = {
    # Priority 1: Real-time Kafka Lag Load Shedder Probe (Every 30 seconds)
    "probe-kafka-consumer-lag-shedder": {
        "task": "app.background_jobs.load_shedder.monitor_consumer_lag_and_shed_load",
        "schedule": float(settings.LOAD_SHEDDING_PROBE_INTERVAL_SECONDS),
        "options": {"queue": "monitoring"},
    },
    # Priority 2: Daily Remaining Useful Life Estimation (Daily 02:00 UTC)
    "daily-sensor-remaining-useful-life": {
        "task": "app.background_jobs.rul_estimator.execute_daily_rul_estimation",
        "schedule": crontab(hour=2, minute=0),
        "options": {"queue": "analytics"},
    },
    # Priority 3: Weekly Static Topology Sweep (Sunday 03:00 UTC)
    "weekly-spatial-topology-rebuild": {
        "task": "app.background_jobs.topology_worker.rebuild_static_topology_graph",
        "schedule": crontab(day_of_week=0, hour=3, minute=0),
        "options": {"queue": "topology"},
    },
    # Priority 4: Weekly Rolling Adaptive UKF Q/R & Isotonic Refitting (Sunday 04:00 UTC)
    "weekly-adaptive-calibration-refit": {
        "task": "app.background_jobs.calibration_refit.execute_rolling_calibration_refit",
        "schedule": crontab(day_of_week=0, hour=4, minute=0),
        "options": {"queue": "analytics"},
    },
}