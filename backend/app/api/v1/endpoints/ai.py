"""
AI Services API endpoints using Tinfoil.sh
"""
import httpx
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from app.core.config import settings
from app.services.llm import llm_service
from app.crud.client import client_crud
from app.crud.session import session_crud
from app.crud.persona import persona_crud
from app.models.models import (
    AnalysisRequest,
    AnalysisResponse,
    SessionAgendaRequest,
    SessionAgendaResponse,
    SessionLogRequest,
    SessionLogResponse,
    IntakeAnalysisRequest,
    IntakeAnalysisResponse,
    NoteConvertRequest,
    NoteConvertResponse,
    ClientChatRequest,
    SchoolChatRequest,
    ChatResponse,
)

router = APIRouter()


@router.post("/intake-analysis", response_model=IntakeAnalysisResponse)
async def analyze_intake_background(
    request: IntakeAnalysisRequest
) -> IntakeAnalysisResponse:
    """
    Analyze client background text and generate structured clinical intake assessment.
    Returns 8 clinical fields for the new client preview page.
    """
    try:
        client_info = {}
        if request.name:
            client_info["name"] = request.name
        if request.age is not None:
            client_info["age"] = request.age
        if request.gender:
            client_info["gender"] = request.gender

        result = await llm_service.analyze_client_intake(
            background=request.background,
            client_info=client_info if client_info else None
        )
        return IntakeAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Intake analysis failed: {str(e)}"
        )


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_transcript(
    request: AnalysisRequest
) -> AnalysisResponse:
    """
    Analyze a session transcript using AI.
    Generates summary, insights, emotional state, and recommendations.
    """
    try:
        result = await llm_service.analyze_transcript(
            transcript=request.transcript,
            client_context=request.client_context
        )
        return AnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/session/agenda", response_model=SessionAgendaResponse)
async def generate_session_agenda(
    client_id: str,
    previous_sessions: list = None
) -> SessionAgendaResponse:
    """
    Generate a pre-session agenda and guidelines based on client profile.
    """
    try:
        # Get client context
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        # Build client context for AI
        client_context = {
            "name": client.get("full_name", "Unknown"),
            "age": client.get("age"),
            "gender": client.get("gender"),
            "background": client.get("background", ""),
            "tags": client.get("tags", []),
            "status": client.get("status")
        }

        # Get previous sessions
        if previous_sessions is None:
            sessions = await session_crud.get_client_sessions(client_id, limit=5)
            previous_sessions = [s.get("summary", "") for s in sessions if s.get("summary")]

        result = await llm_service.generate_session_agenda(
            client_context=client_context,
            previous_sessions=previous_sessions
        )

        return SessionAgendaResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agenda generation failed: {str(e)}"
        )


@router.post("/session/log", response_model=SessionLogResponse)
async def generate_session_log(
    request: SessionLogRequest
) -> SessionLogResponse:
    """
    Generate a structured clinical session log from transcript.
    """
    try:
        result = await llm_service.generate_session_log(
            transcript=request.transcript,
            client_context=request.client_context
        )
        return SessionLogResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session log generation failed: {str(e)}"
        )


@router.post("/client/background")
async def analyze_client_background(
    client_id: str,
    transcript: str
):
    """
    Analyze transcript and update client background with new information.
    This helps maintain accurate client profiles over time.
    """
    try:
        # Get existing client
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        existing_background = client.get("background", "")

        # Analyze and generate updated background
        updated_background = await llm_service.analyze_client_background(
            transcript=transcript,
            existing_background=existing_background
        )

        # Update client background
        await client_crud.update_background(client_id, updated_background)

        return {
            "message": "Client background updated successfully",
            "updated_background": updated_background
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Background analysis failed: {str(e)}"
        )


@router.post("/chat")
async def chat_with_client_context(
    message: str,
    client_id: str,
    conversation_history: list = None
):
    """
    Chat with AI while maintaining client context.
    IMPORTANT: Ensures LLM remembers this specific client's background.

    This is a critical feature to avoid confusing different patients.
    """
    try:
        # Get client context
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        # Build client context
        client_context = {
            "id": client.get("$id"),
            "name": client.get("full_name"),
            "age": client.get("age"),
            "gender": client.get("gender"),
            "background": client.get("background", ""),
            "tags": client.get("tags", []),
            "status": client.get("status"),
            "occupation": client.get("occupation"),
            "notes": client.get("notes", "")
        }

        # Chat with AI
        response = await llm_service.chat_with_context(
            message=message,
            client_context=client_context,
            conversation_history=conversation_history
        )

        return {
            "response": response,
            "client_id": client_id,
            "client_name": client.get("full_name")
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )


@router.post("/convert-notes", response_model=NoteConvertResponse)
async def convert_note_format(
    request: NoteConvertRequest
) -> NoteConvertResponse:
    """
    Convert free-text session notes into a structured BIRP, DAP, or SOAP format using AI.
    """
    if request.target_format not in ('BIRP', 'DAP', 'SOAP'):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="target_format must be 'BIRP', 'DAP', or 'SOAP'"
        )
    try:
        result = await llm_service.convert_note_format(
            free_text=request.free_text,
            target_format=request.target_format
        )
        return NoteConvertResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Note conversion failed: {str(e)}"
        )


@router.post("/chat/client", response_model=ChatResponse)
async def chat_client_mode(request: ClientChatRequest) -> ChatResponse:
    """
    Chat with LLM in a client-focused mode.
    Modes: investigate (clinical insights), role_play (simulate client), supervisor (clinical supervision).
    """
    try:
        client = await client_crud.get(request.client_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        client_info = {
            "name": client.get("full_name", "Unknown"),
            "age": client.get("age"),
            "gender": client.get("gender", ""),
            "background": client.get("background", "")
        }

        persona_doc = persona_crud.get_persona(request.client_id)
        persona = persona_doc.get("content") if persona_doc else None

        session_summaries = None
        if request.mode.value == "supervisor" and request.session_ids:
            summaries = []
            for sid in request.session_ids:
                session = await session_crud.get(sid)
                if session:
                    text = session.get("summary") or session.get("notes")
                    if text:
                        summaries.append(text)
            session_summaries = summaries if summaries else None

        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        reply = await llm_service.chat_with_client_mode(
            mode=request.mode.value,
            client_info=client_info,
            persona=persona,
            messages=messages,
            session_summaries=session_summaries
        )

        return ChatResponse(reply=reply, mode=request.mode.value)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )


@router.post("/chat/school", response_model=ChatResponse)
async def chat_school_mode(request: SchoolChatRequest) -> ChatResponse:
    """
    Chat from the perspective of a psychological therapeutic school.
    """
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        reply = await llm_service.chat_psychological_school(
            school=request.school.value,
            messages=messages,
            client_context=request.client_context
        )
        return ChatResponse(reply=reply, school=request.school.value)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"School chat failed: {str(e)}"
        )


@router.post("/persona/generate")
async def generate_persona(client_id: str) -> dict:
    """
    Generate or regenerate a clinical persona for a client.
    Fetches client info and recent session summaries, calls LLM, saves to notes collection.
    """
    try:
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

        client_info = {
            "name": client.get("full_name", "Unknown"),
            "age": client.get("age"),
            "gender": client.get("gender", ""),
            "background": client.get("background", "")
        }

        sessions = await session_crud.get_client_sessions(client_id, limit=5)
        summaries = [
            s.get("summary") or s.get("notes")
            for s in sessions
            if s.get("summary") or s.get("notes")
        ]

        persona_text = await llm_service.generate_client_persona(
            client_info=client_info,
            session_summaries=summaries if summaries else None
        )

        persona_crud.save_persona(client_id, persona_text)

        return {"success": True, "message": "Persona generated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Persona generation failed: {str(e)}"
        )


@router.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...)
):
    """
    Transcribe audio using Voxtral via Tinfoil API.
    Used for speech-to-text input in the background field.
    """
    try:
        content = await file.read()
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.TINFOIL_API_ENDPOINT}/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.TINFOIL_API_KEY}"},
                files={"file": (file.filename or "recording.webm", content, file.content_type or "audio/webm")},
                data={"model": "voxtral-small-24b"}
            )
            response.raise_for_status()
            result = response.json()
        return {"text": result.get("text", "")}
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription API error: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech to text failed: {str(e)}"
        )
