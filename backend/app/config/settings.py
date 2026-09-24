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

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/skyguard"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  
    )


settings = Settings()