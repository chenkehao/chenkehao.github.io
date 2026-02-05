"""
Application configuration management using Pydantic Settings
"""

import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the directory where this config file is located
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # App
    app_name: str = "Devnors API"
    api_version: str = "v1"
    debug: bool = False
    
    # Database (default to SQLite for easy local development)
    database_url: str = "sqlite+aiosqlite:///./devnors.db"
    sync_database_url: str = "sqlite:///./devnors.db"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Gemini API
    gemini_api_key: Optional[str] = None
    
    # 阿里云 OCR
    aliyun_access_key_id: Optional[str] = None
    aliyun_access_key_secret: Optional[str] = None
    
    # MiniMax API
    minimax_api_key: Optional[str] = None
    minimax_group_id: Optional[str] = None
    
    # AI Provider: "minimax" or "gemini"
    ai_provider: str = "minimax"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]


def get_settings() -> Settings:
    """Get settings instance"""
    return Settings()


# Create settings instance
settings = Settings()

# Debug: Print loaded config
if settings.debug:
    print(f"[Config] AI Provider: {settings.ai_provider}")
    print(f"[Config] MiniMax API Key: {'*' * 10 + settings.minimax_api_key[-8:] if settings.minimax_api_key else 'Not set'}")
