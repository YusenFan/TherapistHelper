import os
from typing import List
from pydantic_settings import BaseSettings
from cryptography.fernet import Fernet


class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "TherapistHelper API"
    VERSION: str = "2.0.0"
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
    COLLECTION_NOTES: str = "notes"
    COLLECTION_TAGS: str = "tags"
    COLLECTION_ATTENDANCE: str = "attendance"

    # Tinfoil.sh API Configuration (for LLM)
    TINFOIL_API_KEY: str = os.getenv("TINFOIL_API_KEY", "tk_Y8afZljtIO7bsSE4joTfmRlbuwNLAMZjRnWNawl3MLcjP1B0")
    TINFOIL_API_ENDPOINT: str = os.getenv("TINFOIL_API_ENDPOINT", "https://inference.tinfoil.sh/v1")

    # OpenAI Configuration (for Whisper transcription)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_WHISPER_MODEL: str = "whisper-1"

    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ENCRYPTION_KEY: bytes = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())

    # CORS Configuration
    ALLOWED_HOSTS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://therapist-helper.vercel.app"
    ]

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"

    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_AUDIO_FORMATS: List[str] = ["mp3", "wav", "m4a", "ogg", "flac", "webm"]

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Encryption utility
class EncryptionManager:
    def __init__(self, key: str):
        # Handle both string and bytes keys
        if isinstance(key, str):
            key = key.encode()
        self.fernet = Fernet(key)

    def encrypt(self, data: str) -> str:
        """Encrypt string data and return base64 encoded result"""
        if not data:
            return data
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt base64 encoded data and return original string"""
        if not encrypted_data:
            return encrypted_data
        try:
            return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return "[DECRYPTION_FAILED]"


# Global encryption manager
encryption_manager = EncryptionManager(settings.ENCRYPTION_KEY)
