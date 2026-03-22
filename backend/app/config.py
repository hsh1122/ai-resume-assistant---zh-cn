import json
from pathlib import Path
from typing import List

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"


def _normalize_database_url(value: str) -> str:
    prefix = "sqlite:///"
    if not value.startswith(prefix):
        return value

    sqlite_path = value[len(prefix) :]
    if sqlite_path == ":memory:" or value.startswith("sqlite:////"):
        return value

    candidate = Path(sqlite_path)
    if not candidate.is_absolute():
        candidate = (BASE_DIR / candidate).resolve()

    return f"sqlite:///{candidate.as_posix()}"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    openai_api_key: str = ""
    # Defaults target DeepSeek's OpenAI-compatible API, but any compatible provider can be used.
    openai_base_url: str = "https://api.deepseek.com/v1"
    openai_model: str = "deepseek-reasoner"
    database_url: str = "sqlite:///./resume_assistant.db"

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24
    cors_allowed_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    @model_validator(mode="after")
    def validate_jwt_secret_key(self):
        if not self.jwt_secret_key.strip():
            raise ValueError("JWT_SECRET_KEY must be set in the environment.")
        self.database_url = _normalize_database_url(self.database_url)
        return self

    @property
    def cors_allowed_origins_list(self) -> List[str]:
        value = self.cors_allowed_origins.strip()
        if not value:
            return []
        if value.startswith("["):
            return json.loads(value)
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
