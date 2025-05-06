from pydantic import BaseSettings
from typing import List
from functools import lru_cache
import os
from dotenv import load_dotenv

# Charge explicitement le fichier .env situé dans le répertoire parent (app/.env)
env_path = os.path.join(os.path.dirname(__file__), os.pardir, ".env")
load_dotenv(env_path)

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ab-test-calculator-api"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = bool(os.getenv("DEBUG", "False") == "True")

    # API
    API_PREFIX: str = "/api/v1"

    # CORS
    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = os.getenv("CORS_ORIGINS", "*")
        if origins == "*":
            return ["*"]
        return origins.split(",")

    # Statistiques
    DEFAULT_ALPHA: float = 0.05  # 95% confiance
    DEFAULT_POWER: float = 0.80  # 80% puissance
    DEFAULT_PRIOR_ALPHA: float = 0.5  # Jeffreys prior
    DEFAULT_PRIOR_BETA: float = 0.5  # Jeffreys prior

    # Database settings (can be expanded as needed)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # API Keys
    HF_API_KEY: str = os.getenv("HF_API_KEY", "")
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    
    # Models configurations
    HF_LLAMA_MODEL: str = os.getenv("HF_LLAMA_MODEL", "meta-llama/Llama-3.3-70B-Instruct")
    DEEPSEEK_API_URL: str = os.getenv("DEEPSEEK_API_URL", "https://api.deepseek.com/v1/chat/completions")
    DEEPSEEK_REASONER_MODEL: str = os.getenv("DEEPSEEK_REASONER_MODEL", "deepseek-ai/deepseek-reasoner-v1.5")
    
    # Accesseurs
    @property
    def hf_api_key(self) -> str:
        return self.HF_API_KEY
    
    @property
    def deepseek_api_key(self) -> str:
        return self.DEEPSEEK_API_KEY
    
    @property
    def hf_llama_model(self) -> str:
        return self.HF_LLAMA_MODEL
    
    @property
    def deepseek_api_url(self) -> str:
        return self.DEEPSEEK_API_URL
    
    @property
    def deepseek_reasoner_model(self) -> str:
        return self.DEEPSEEK_REASONER_MODEL

    # Cache settings
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))  # Default: 1 hour cache

    # Redis settings (if used for caching)
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    class Config:
        # Charger explicitement le même .env pour BaseSettings
        env_file = env_path
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
