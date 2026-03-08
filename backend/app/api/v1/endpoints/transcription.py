"""
Transcription API endpoints using OpenAI Whisper
"""
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from app.services.transcription import transcription_service
from app.crud.session import session_crud
from app.models.models import TranscriptResponse
import os

router = APIRouter()


@router.post("/upload", response_model=TranscriptResponse)
async def upload_and_transcribe(
    file: UploadFile = File(...),
    client_id: str = Form(...),
    language: str = Form(None)
):
    """
    Upload an audio file and transcribe it using OpenAI Whisper.
    Creates a new session if not provided.
    """
    # Validate file format
    if not transcription_service.validate_file_format(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Supported: {', '.join(transcription_service.get_supported_formats())}"
        )

    # Save uploaded file to temp location
    import tempfile
    import uuid

    # Create temp directory if it doesn't exist
    temp_dir = "/tmp/therapist_uploads"
    os.makedirs(temp_dir, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    temp_filename = f"{uuid.uuid4()}{file_extension}"
    temp_path = os.path.join(temp_dir, temp_filename)

    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Transcribe audio
        result = await transcription_service.transcribe_file(temp_path, language)

        # Create a new session for this transcription
        from app.models.models import SessionCreate
        from datetime import datetime
        from app.crud.client import client_crud

        # Check client exists
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        # Create session
        session_in = SessionCreate(
            client_id=client_id,
            duration_minutes=int(result['duration'] / 60) if result['duration'] > 0 else 60
        )
        session = await session_crud.create(session_in)

        # Add transcript to session
        await session_crud.add_transcript(
            session['$id'],
            result['text'],
            result['language'],
            result['duration']
        )

        return TranscriptResponse(
            id=session['$id'],
            session_id=session['$id'],
            transcript_text=result['text'],
            duration=result['duration'],
            language=result['language'],
            created_at=datetime.utcnow()
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )

    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.unlink(temp_path)


@router.post("/from-url", response_model=TranscriptResponse)
async def transcribe_from_url(
    audio_url: str,
    client_id: str,
    language: str = None
):
    """
    Transcribe audio from a URL using OpenAI Whisper.
    Creates a new session if not provided.
    """
    try:
        # Transcribe from URL
        result = await transcription_service.transcribe_from_url(audio_url, language)

        # Create a new session for this transcription
        from app.models.models import SessionCreate
        from app.crud.client import client_crud

        # Check client exists
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        # Create session
        session_in = SessionCreate(
            client_id=client_id,
            duration_minutes=int(result['duration'] / 60) if result['duration'] > 0 else 60
        )
        session = await session_crud.create(session_in)

        # Add transcript to session
        await session_crud.add_transcript(
            session['$id'],
            result['text'],
            result['language'],
            result['duration']
        )

        return TranscriptResponse(
            id=session['$id'],
            session_id=session['$id'],
            transcript_text=result['text'],
            duration=result['duration'],
            language=result['language'],
            created_at=datetime.utcnow()
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"URL transcription failed: {str(e)}"
        )


@router.get("/formats")
async def get_supported_formats():
    """
    Get list of supported audio formats.
    """
    return {
        "supported_formats": transcription_service.get_supported_formats(),
        "max_upload_size_mb": 100
    }
