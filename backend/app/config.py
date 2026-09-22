"""
ANNARAKSHAK Configuration
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "ANNARAKSHAK"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database - anchor to backend folder so Cwd differences don't create multiple DBs
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(_BASE_DIR, 'annarakshak.db').replace(os.sep, '/')}"
    )

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "annarakshak-prototype-secret-key-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    # Redis (optional for prototype)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # File uploads - anchor to backend folder
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(_BASE_DIR, "uploads"))
    MAX_UPLOAD_SIZE_MB: int = 10

    # Maps / Routing
    DEFAULT_CENTER_LAT: float = 20.5937  # India center
    DEFAULT_CENTER_LNG: float = 78.9629

    # Rescue Clock thresholds (minutes)
    RESCUE_SAFE_THRESHOLD: int = 240      # > 4 hours
    RESCUE_URGENT_THRESHOLD: int = 60     # 1-4 hours
    RESCUE_CRITICAL_THRESHOLD: int = 0    # < 1 hour

    # Impact estimation constants
    MEALS_PER_KG: float = 4.0
    CO2_SAVED_PER_KG: float = 2.5        # kg CO2
    WATER_SAVED_PER_KG: float = 1000.0   # liters
    ENERGY_SAVED_PER_KG: float = 4.5     # kWh

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
