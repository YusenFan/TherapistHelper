"""
Audio Transcription Service using OpenAI Whisper
"""
from openai import OpenAI
from app.core.config import settings
from typing import Optional
import os
from pathlib import Path
import tempfile


class TranscriptionService:
    """Service for transcribing audio files using OpenAI Whisper"""

    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_WHISPER_MODEL

    async def transcribe_file(
        self,
        file_path: str,
        language: Optional[str] = None
    ) -> dict:
        """
        Transcribe an audio file to text using Whisper

        Args:
            file_path: Path to the audio file
            language: Optional language code (e.g., 'en', 'zh', 'es')

        Returns:
            dict: {
                'text': str,  # Transcribed text
                'duration': float,  # Audio duration in seconds
                'language': str  # Detected language
            }
        """
        try:
            # Validate file exists
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Audio file not found: {file_path}")

            # Check file size
            file_size = os.path.getsize(file_path)
            if file_size > settings.MAX_UPLOAD_SIZE:
                raise ValueError(f"File too large: {file_size} bytes (max: {settings.MAX_UPLOAD_SIZE})")

            # Transcribe with Whisper
            with open(file_path, "rb") as audio_file:
                transcription = self.client.audio.transcriptions.create(
                    model=self.model,
                    file=audio_file,
                    language=language,
                    response_format="verbose_json"
                )

            return {
                'text': transcription.text,
                'duration': transcription.duration,
                'language': transcription.language
            }

        except Exception as e:
            raise Exception(f"Transcription error: {str(e)}")

    async def transcribe_from_url(
        self,
        audio_url: str,
        language: Optional[str] = None
    ) -> dict:
        """
        Transcribe audio from a URL

        Args:
            audio_url: URL to the audio file
            language: Optional language code

        Returns:
            dict: Transcription result with text, duration, and language
        """
        try:
            # Download audio file to temp location
            import aiohttp
            import asyncio

            async with aiohttp.ClientSession() as session:
                async with session.get(audio_url) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to download audio: {response.status}")

                    # Create temp file
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                        content = await response.read()
                        temp_file.write(content)
                        temp_path = temp_file.name

            try:
                # Transcribe the downloaded file
                result = await self.transcribe_file(temp_path, language)
                return result
            finally:
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

        except Exception as e:
            raise Exception(f"URL transcription error: {str(e)}")

    def get_supported_formats(self) -> list:
        """Get list of supported audio formats"""
        return settings.ALLOWED_AUDIO_FORMATS

    def validate_file_format(self, filename: str) -> bool:
        """Check if file format is supported"""
        ext = Path(filename).suffix.lower().lstrip('.')
        return ext in self.get_supported_formats()


# Global transcription service instance
transcription_service = TranscriptionService()
