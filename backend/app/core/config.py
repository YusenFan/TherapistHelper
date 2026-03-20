import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "TherapistHelper API"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api/v1"

    # Appwrite Configuration
    APPWRITE_ENDPOINT: str = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
    APPWRITE_PROJECT_ID: str = os.getenv("APPWRITE_PROJECT_ID", "")
    APPWRITE_API_KEY: str = os.getenv("APPWRITE_API_KEY", "")

    # Appwrite Database IDs
    APPWRITE_DATABASE_ID: str = os.getenv("APPWRITE_DATABASE_ID", "therapist_helper")

    # Appwrite Collection IDs
    COLLECTION_CLIENTS: str = "clients"
    COLLECTION_SESSIONS: str = "sessions"
    COLLECTION_SESSION_NOTES: str = "session_notes"
    COLLECTION_CLINICAL_ASSESSMENTS: str = "clinical_assessments"

    # Tinfoil.sh API Configuration (for LLM)
    TINFOIL_API_KEY: str = os.getenv("TINFOIL_API_KEY", "tk_Y8afZljtIO7bsSE4joTfmRlbuwNLAMZjRnWNawl3MLcjP1B0")
    TINFOIL_API_ENDPOINT: str = os.getenv("TINFOIL_API_ENDPOINT", "https://inference.tinfoil.sh/v1")

    # OpenAI Configuration (for Whisper transcription)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_WHISPER_MODEL: str = "whisper-1"

    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

    # CORS Configuration
    ALLOWED_HOSTS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://therapist-helper.vercel.app",
        "https://therapisthelper-frontend.onrender.com"
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

    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_AUDIO_FORMATS: List[str] = ["mp3", "wav", "m4a", "ogg", "flac", "webm"]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


# Global settings instance
settings = Settings()
