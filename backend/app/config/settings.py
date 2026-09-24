from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "SkyGuard AI Core"

    SECRET_KEY: str = "CHANGE_THIS_TO_A_SECURE_SECRET_MIN_32_CHARS"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    PBKDF2_ITERATIONS: int = 600_000
    PBKDF2_SALT_SIZE: int = 16

    DATABASE_URL: str 

    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_RAW_OBSERVATIONS: str = "observations.raw"
    KAFKA_TOPIC_DEAD_LETTER: str = "observations.deadletter"
    KAFKA_CONSUMER_GROUP: str = "skyguard-raw-ingestion-workers"
    KAFKA_CLIENT_ID: str = "skyguard-ingest-substrate"
    KAFKA_SECURITY_PROTOCOL: str = "SASL_SSL"
    KAFKA_SASL_MECHANISM: str = "PLAIN"
    KAFKA_SASL_USERNAME: str 
    KAFKA_SASL_PASSWORD: str 
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
    REDIS_PASSWORD: str | None = None
    REDIS_IS_CLUSTER: bool = False

    DEDUP_TTL_SECONDS: int = 86400 
    DEJITTER_WINDOW_SECONDS: float = 30.0  
    CLOCK_DRIFT_MAX_BACKWARD_SECONDS: float = -10.0  
    CLOCK_DRIFT_MAX_FORWARD_SECONDS: float = 300.0  

    QUARANTINE_REDIS_SET_KEY: str = "stations:under_correction"
    QUARANTINE_TTL_SECONDS: int = 7200  # 2 hours without clean ping before auto-eviction

    # Gate 1: Confirmed Hardware Fault Constraints
    MIN_CLASSIFICATION_PROBABILITY: float = 0.85
    PERMITTED_FAULT_CLASSES: list[str] = [
        "STUCK_SENSOR",
        "DRIFT",
        "BIAS",
        "CALIBRATION_LOSS",
        "NOISE_INCREASE",
    ]

    # Gate 2: State Estimate Trustworthiness (Innovation Chi-Square Test)
    # 1 degree of freedom (single observable scalar update), p=0.01 threshold -> chi2 = 6.635
    CHI2_INNOVATION_ALPHA_THRESHOLD: float = 6.635

    # Gate 3: Bounded Uncertainty Constraints
    MAX_ALLOWABLE_POSTERIOR_SIGMA: float = 1.25  # Max standard deviation (e.g. °C, hPa, or % RH)

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  
    )


settings = Settings()