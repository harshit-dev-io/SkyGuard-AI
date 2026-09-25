import os
from pathlib import Path
from typing import Any, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "SkyGuard AI Core"

    SECRET_KEY: str = "CHANGE_THIS_TO_A_SECURE_SECRET_MIN_32_CHARS_0123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    PBKDF2_ITERATIONS: int = 600_000
    PBKDF2_SALT_SIZE: int = 16

    DATABASE_URL: str = "postgresql+asyncpg://skyguard_admin:skyguard_secure_pwd@localhost:5432/skyguard"
    DATABASE_SYNC_URL: str = "postgresql+psycopg2://skyguard_admin:skyguard_secure_pwd@localhost:5432/skyguard"

    @field_validator("DATABASE_URL", "DATABASE_SYNC_URL", mode="before")
    @classmethod
    def expand_db_urls(cls, v: Any) -> Any:
        if isinstance(v, str) and "${" in v:
            expanded = os.path.expandvars(v)
            if "${" in expanded:
                return "postgresql+asyncpg://skyguard_admin:skyguard_secure_pwd@localhost:5432/skyguard" if "asyncpg" in v else "postgresql+psycopg2://skyguard_admin:skyguard_secure_pwd@localhost:5432/skyguard"
            return expanded
        return v


    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_RAW_OBSERVATIONS: str = "observations.raw"
    KAFKA_TOPIC_DEAD_LETTER: str = "observations.deadletter"
    KAFKA_CONSUMER_GROUP: str = "skyguard-raw-ingestion-workers"
    KAFKA_CLIENT_ID: str = "skyguard-ingest-substrate"
    KAFKA_SECURITY_PROTOCOL: str = "PLAINTEXT"
    KAFKA_SASL_MECHANISM: Optional[str] = None
    KAFKA_SASL_USERNAME: Optional[str] = None
    KAFKA_SASL_PASSWORD: Optional[str] = None
    KAFKA_GROUP_ID: str = "skyguard-evidence-engines-flock"

    TOPIC_EVIDENCE_TEMPORAL: str = "evidence.temporal"
    TOPIC_EVIDENCE_SPATIAL: str = "evidence.spatial"
    TOPIC_EVIDENCE_EVENT: str = "evidence.event"
    TOPIC_EVIDENCE_HEALTH: str = "evidence.health"

    KAFKA_FUSION_GROUP_ID: str = "skyguard-fusion-classifier-group"
    TOPIC_FUSED_BUNDLES: str = "bundles.fused"
    TOPIC_CLASSIFICATION_OUTPUT: str = "classifications.state_fault"

    FUSION_JOIN_TIMEOUT_SECONDS: float = 2.0
    EVIDENCE_DEGRADE_ALLOWED: bool = True

    ACTIVE_LEARNING_UNCERTAINTY_THRESHOLD: float = 0.70
    SPARSE_CLASS_SAMPLE_THRESHOLD: int = 50
    CALIBRATION_BINS: int = 10

    MODEL_ARTIFACTS_DIR: str = str(
        Path(__file__).resolve().parent.parent / "fusion_engine" / "classifier" / "artifacts"
    )

    FLINK_PARALLELISM: int = 4
    CHECKPOINT_INTERVAL_MS: int = 15000
    CHECKPOINT_TIMEOUT_MS: int = 60000
    MIN_PAUSE_BETWEEN_CHECKPOINTS_MS: int = 5000

    EVENT_CORROBORATION_WINDOW_SECONDS: int = 300
    HEALTH_STREAM_BLOCK_SIZE: int = 60
    HEALTH_MAX_BUFFERED_BLOCKS: int = 48

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_IS_CLUSTER: bool = False

    DEDUP_TTL_SECONDS: int = 86400
    DEJITTER_WINDOW_SECONDS: float = 30.0
    CLOCK_DRIFT_MAX_BACKWARD_SECONDS: float = -10.0
    CLOCK_DRIFT_MAX_FORWARD_SECONDS: float = 300.0

    QUARANTINE_REDIS_SET_KEY: str = "stations:under_correction"
    QUARANTINE_TTL_SECONDS: int = 7200

    # Gate 1: Confirmed Hardware Fault Constraints
    MIN_CLASSIFICATION_PROBABILITY: float = 0.85
    PERMITTED_FAULT_CLASSES: list[str] = [
        "STUCK_SENSOR",
        "DRIFT",
        "BIAS",
        "CALIBRATION_LOSS",
        "NOISE_INCREASE",
    ]

    # Gate 2: State Estimate Trustworthiness
    CHI2_INNOVATION_ALPHA_THRESHOLD: float = 6.635

    # Gate 3: Bounded Uncertainty Constraints
    MAX_ALLOWABLE_POSTERIOR_SIGMA: float = 1.25

    # Gate 4: Spatial Neighbor Constraints
    MIN_REQUIRED_CLEAN_NEIGHBORS: int = 2
    MAX_NEIGHBOR_DISTANCE_KM: float = 45.0

    # UKF Filter Dynamics Parameters
    UKF_MODEL_VERSION: str = "ukf-v2.1"
    UKF_ALPHA: float = 1e-3
    UKF_BETA: float = 2.0
    UKF_KAPPA: float = 0.0
    UKF_PROCESS_NOISE_Q: float = 0.04
    UKF_DEFAULT_MEASUREMENT_NOISE_R: float = 0.36

    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 3600
    CELERY_TASK_SOFT_TIME_LIMIT: int = 3300

    LOAD_SHEDDING_LAG_THRESHOLD: int = 5000
    LOAD_SHEDDING_RECOVERY_THRESHOLD: int = 500
    LOAD_SHEDDING_PROBE_INTERVAL_SECONDS: int = 30

    RUL_ESTIMATOR_VERSION: str = "rul-v2.0"
    RUL_TEMPERATURE_MAX_DRIFT_CELSIUS: float = 2.5
    RUL_PRESSURE_MAX_DRIFT_HPA: float = 4.0
    RUL_HUMIDITY_MAX_DRIFT_PERCENT: float = 8.0
    RUL_MIN_DATA_POINTS: int = 144

    TOPOLOGY_H3_RESOLUTION: int = 6
    TOPOLOGY_DEFAULT_K_NEIGHBORS: int = 8
    TOPOLOGY_MAX_DISTANCE_KM: float = 50.0

    REWIND_DEFAULT_LOOKBACK_HOURS: int = 72
    REWIND_BATCH_CHUNK_SIZE: int = 1000

    ADAPTIVE_UKF_INNOVATION_ALPHA_LOW: float = 0.50
    ADAPTIVE_UKF_INNOVATION_ALPHA_HIGH: float = 2.50
    ADAPTIVE_UKF_Q_STEP_UP: float = 1.25
    ADAPTIVE_UKF_Q_STEP_DOWN: float = 0.85
    MAX_ALLOWABLE_ECE: float = 0.08

    # WIS2 / WMO Settings
    WIS2_CENTRE_ID: str = "in-imd-delhi"
    WIS2_GB_HOST: str = "localhost"
    WIS2_GB_PORT: int = 1883
    WIS2_STORAGE_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "data" / "wis2_objects")
    WIS2_BASE_URL: str = "http://localhost:8000/api/v1/wis2/data"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
