"""
AI Services API endpoints using Tinfoil.sh
"""
import httpx
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from app.core.config import settings
from app.services.llm import llm_service
from app.crud.client import client_crud
from app.crud.session import session_crud
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


def _build_client_info(client: dict) -> dict:
    """Build a client info dict for LLM context from the new schema."""
    return {
        "name": client.get("full_name", "Unknown"),
        "preferred_name": client.get("preferred_name"),
        "approximate_age": client.get("approximate_age"),
        "gender_identity": client.get("gender_identity", ""),
        "pronouns": client.get("pronouns", ""),
        "background_summary": client.get("background_summary", ""),
    }


async def _fetch_client_context(client_id: str):
    """Fetch client info and all session summaries for LLM context."""
    client = await client_crud.get(client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    client_info = _build_client_info(client)

    # Fetch all sessions for this client and extract summaries
    sessions = await session_crud.get_client_sessions(client_id, limit=50)
    session_summaries = []
    for s in sessions:
        summary = s.get("summary") or ""
        if summary:
            date = s.get("session_date", "unknown date")
            session_type = s.get("session_type", "")
            session_summaries.append(f"[{date} - {session_type}] {summary}")

    return client_info, session_summaries or None


@router.post("/intake-analysis", response_model=IntakeAnalysisResponse)
async def analyze_intake_background(
    request: IntakeAnalysisRequest
) -> IntakeAnalysisResponse:
    """Analyze client background text and generate structured clinical intake assessment."""
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
    """Analyze a session transcript using AI."""
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
    """Generate a pre-session agenda and guidelines."""
    try:
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        client_context = _build_client_info(client)
        client_context["status"] = client.get("status")

        if previous_sessions is None:
            sessions = await session_crud.get_client_sessions(client_id, limit=5)
            previous_sessions = [s.get("summary", "") for s in sessions if s.get("summary")]

        result = await llm_service.generate_session_agenda(
            client_context=client_context,
            previous_sessions=previous_sessions
        )
        return SessionAgendaResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agenda generation failed: {str(e)}"
        )


@router.post("/session/log", response_model=SessionLogResponse)
async def generate_session_log(
    request: SessionLogRequest
) -> SessionLogResponse:
    """Generate a structured clinical session log from transcript."""
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


@router.post("/convert-notes", response_model=NoteConvertResponse)
async def convert_note_format(
    request: NoteConvertRequest
) -> NoteConvertResponse:
    """Convert free-text session notes into BIRP, DAP, or SOAP format using AI."""
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
    """Chat with LLM in a client-focused mode (investigate, role_play, supervisor)."""
    try:
        client_info, session_summaries = await _fetch_client_context(request.client_id)
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        reply = await llm_service.chat_with_client_mode(
            mode=request.mode.value,
            client_info=client_info,
            persona=None,
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
    """Chat from the perspective of a psychological therapeutic school."""
    try:
        client_info, session_summaries = await _fetch_client_context(request.client_id)
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        reply = await llm_service.chat_psychological_school(
            school=request.school.value,
            messages=messages,
            client_info=client_info,
            session_summaries=session_summaries
        )
        return ChatResponse(reply=reply, school=request.school.value)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"School chat failed: {str(e)}"
        )


@router.post("/chat/client/stream")
async def stream_chat_client_mode(request: ClientChatRequest) -> StreamingResponse:
    """Streaming version of /chat/client."""
    try:
        client_info, session_summaries = await _fetch_client_context(request.client_id)
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        return StreamingResponse(
            llm_service.stream_chat_with_client_mode(
                mode=request.mode.value,
                client_info=client_info,
                persona=None,
                messages=messages,
                session_summaries=session_summaries,
            ),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stream chat failed: {str(e)}"
        )


@router.post("/chat/school/stream")
async def stream_chat_school_mode(request: SchoolChatRequest) -> StreamingResponse:
    """Streaming version of /chat/school."""
    try:
        client_info, session_summaries = await _fetch_client_context(request.client_id)
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        return StreamingResponse(
            llm_service.stream_chat_psychological_school(
                school=request.school.value,
                messages=messages,
                client_info=client_info,
                session_summaries=session_summaries,
            ),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stream school chat failed: {str(e)}"
        )


@router.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...)
):
    """Transcribe audio using Voxtral via Tinfoil API."""
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
