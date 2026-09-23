from pydantic_settings import BaseSettings, SettingsConfigDict


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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  
    )


settings = Settings()