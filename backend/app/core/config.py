
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(ROOT_DIR, ".env"),
        extra="ignore",
        env_file_encoding="utf-8"
    )
    DATABASE_URL : str
    SECRET_KEY : str
    DEBUG : bool = False
    APP_NAME : str = "SMARTBIN"


settings = Settings()