import json
from typing import List, Union, Any
from pydantic import Field

try:
    from pydantic_settings import BaseSettings
    try:
        from pydantic import field_validator
        HAS_V2_VALIDATOR = True
    except ImportError:
        from pydantic import validator  # type: ignore
        HAS_V2_VALIDATOR = False
except ImportError:
    try:
        from pydantic import BaseSettings, validator  # type: ignore
        HAS_V2_VALIDATOR = False
    except ImportError:
        from pydantic.v1 import BaseSettings, validator  # type: ignore
        HAS_V2_VALIDATOR = False


class Settings(BaseSettings):
    # MQTT Configuration
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_KEEPALIVE: int = 60
    MQTT_TOPICS: List[str] = ["wis2/#"]

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./wis2_backend.db"

    # Logging Configuration
    LOG_LEVEL: str = "INFO"

    # Spatial Neighbor Search Thresholds
    SPATIAL_RADIUS_DEFAULT_KM: float = 30.0
    SPATIAL_RADIUS_MAX_KM: float = 75.0
    MAX_STALENESS_MINUTES: float = 20.0
    IDW_POWER_PARAMETER: float = 2.0

    if HAS_V2_VALIDATOR:
        @field_validator("MQTT_TOPICS", mode="before")
        @classmethod
        def parse_mqtt_topics(cls, v: Any) -> Any:
            if isinstance(v, str):
                v = v.strip()
                if v.startswith("[") and v.endswith("]"):
                    try:
                        return json.loads(v)
                    except json.JSONDecodeError:
                        pass
                return [item.strip() for item in v.split(",") if item.strip()]
            return v
    else:
        @validator("MQTT_TOPICS", pre=True, always=True)
        def parse_mqtt_topics(cls, v: Any) -> Any:
            if isinstance(v, str):
                v = v.strip()
                if v.startswith("[") and v.endswith("]"):
                    try:
                        return json.loads(v)
                    except json.JSONDecodeError:
                        pass
                return [item.strip() for item in v.split(",") if item.strip()]
            return v

    class Config:
        env_prefix = "WIS2_BACKEND_"
        case_sensitive = False


settings = Settings()
