import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "Therabee API"
    VERSION: str = "4.0.0"
    API_V1_STR: str = "/api/v1"

    # Appwrite Configuration
    APPWRITE_ENDPOINT: str = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
    APPWRITE_PROJECT_ID: str = os.getenv("APPWRITE_PROJECT_ID", "")
    APPWRITE_API_KEY: str = os.getenv("APPWRITE_API_KEY", "")

    # Dedicated database (created by scripts/setup_database.py)
    APPWRITE_DATABASE_ID: str = os.getenv("APPWRITE_DATABASE_ID", "therabee")

    # Collections (new minimal schema)
    COLLECTION_CLIENTS: str = "clients"
    COLLECTION_SESSIONS: str = "sessions"
    COLLECTION_NOTE_TEMPLATES: str = "note_templates"
    COLLECTION_USER_SETTINGS: str = "user_settings"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

    # CORS
    ALLOWED_HOSTS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://therapist-helper.vercel.app",
        "https://therapisthelper-frontend.onrender.com",
    ]
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")

    @property
    def cors_origins(self) -> List[str]:
        origins = list(self.ALLOWED_HOSTS)
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


# Global settings instance
settings = Settings()
