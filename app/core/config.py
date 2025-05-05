from pydantic import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ab-test-calculator-api"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API
    API_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080", "*"]

    # Statistiques
    DEFAULT_ALPHA: float = 0.05  # 95% confiance
    DEFAULT_POWER: float = 0.80  # 80% puissance
    DEFAULT_PRIOR_ALPHA: float = 0.5  # Jeffreys prior
    DEFAULT_PRIOR_BETA: float = 0.5  # Jeffreys prior

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings() 