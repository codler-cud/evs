"""Application settings loaded from environment variables."""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for EcoSort API.

    Values can be overridden via environment variables or a `.env` file.
    SQLite is used by default for local development/demo, and DATABASE_URL
    can be switched to PostgreSQL without changing application code.
    """

    APP_NAME: str = "EcoSort API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "ecosort-local-dev-secret-change-before-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database (SQLite default; PostgreSQL compatible via SQLAlchemy)
    DATABASE_URL: str = "sqlite:///./ecosort.db"

    # CORS
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:3000"
    )

    # AI Classification Service
    AI_PROVIDER: str = "cv_prototype"
    AI_CONFIDENCE_THRESHOLD: float = 0.62
    MAX_UPLOAD_SIZE_MB: int = 5

    # Demo Seeding
    SEED_DEMO_DATA: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
