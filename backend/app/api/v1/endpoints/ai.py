"""
AI Services API endpoints using Tinfoil.sh
"""
from fastapi import APIRouter, HTTPException, status
from app.services.llm import llm_service
from app.crud.client import client_crud
from app.crud.session import session_crud
from app.models.models import (
    AnalysisRequest,
    AnalysisResponse,
    SessionAgendaRequest,
    SessionAgendaResponse,
    SessionLogRequest,
    SessionLogResponse
)

router = APIRouter()


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
