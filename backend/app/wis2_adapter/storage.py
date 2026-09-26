import os
import pathlib
from typing import Optional
from app.config.settings import settings


class CanonicalBUFRStorage:
    """
    Manages local canonical file storage for BUFR objects served to global subscribers.
    """

    @classmethod
    def initialize_storage(cls):
        pathlib.Path(settings.WIS2_STORAGE_DIR).mkdir(parents=True, exist_ok=True)

    @classmethod
    def save_object(cls, object_id: str, data: bytes) -> str:
        cls.initialize_storage()
        filepath = os.path.join(settings.WIS2_STORAGE_DIR, f"{object_id}.bufr")
        with open(filepath, "wb") as f:
            f.write(data)
        return filepath

    @classmethod
    def get_object_path(cls, object_id: str) -> Optional[str]:
        filepath = os.path.join(settings.WIS2_STORAGE_DIR, f"{object_id}.bufr")
        if os.path.exists(filepath):
            return filepath
        return None
