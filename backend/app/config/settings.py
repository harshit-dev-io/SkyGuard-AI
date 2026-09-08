from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MQTT Configuration
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_KEEPALIVE: int = 60
    MQTT_TOPICS: List[str] = Field(default_factory=lambda: ["wis2/#"])

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./wis2_backend.db"

    # Logging Configuration
    LOG_LEVEL: str = "INFO"

    # Spatial Neighbor Search Thresholds
    SPATIAL_RADIUS_DEFAULT_KM: float = 30.0
    SPATIAL_RADIUS_MAX_KM: float = 75.0
    MAX_STALENESS_MINUTES: float = 20.0
    IDW_POWER_PARAMETER: float = 2.0

    class Config:
        env_prefix = "WIS2_BACKEND_"
        case_sensitive = False


settings = Settings()
