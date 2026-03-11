"""
Session API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, BackgroundTasks
from app.crud.session import session_crud
from app.crud.client import client_crud
from app.crud.persona import persona_crud
from app.services.llm import llm_service
from app.models.models import SessionCreate, SessionUpdate, SessionResponse


async def _update_persona_task(client_id: str, session_update: SessionUpdate) -> None:
    """Background task: update client persona after a session gains new content."""
    try:
        client = await client_crud.get(client_id)
        if not client:
            return

        client_info = {
            "name": client.get("full_name", "Unknown"),
            "age": client.get("age"),
            "gender": client.get("gender", ""),
            "background": client.get("background", "")
        }

        summaries = []
        if session_update.summary:
            summaries.append(session_update.summary)
        elif session_update.transcript:
            summaries.append(f"Session transcript excerpt: {session_update.transcript[:500]}")

        persona_text = await llm_service.generate_client_persona(
            client_info=client_info,
            session_summaries=summaries if summaries else None
        )
        persona_crud.save_persona(client_id, persona_text)
        print(f"[PersonaUpdateTask] Updated persona for client {client_id}")
    except Exception as e:
        print(f"[PersonaUpdateTask] Failed for client {client_id}: {e}")

router = APIRouter()


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_in: SessionCreate
) -> SessionResponse:
    """
    Create a new session for a client.
    """
    try:
        session = await session_crud.create(obj_in=session_in)
        return SessionResponse(**session)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get("/", response_model=List[SessionResponse])
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    client_id: Optional[str] = Query(None)
) -> List[SessionResponse]:
    """
    Retrieve a list of sessions with pagination and filtering.
    """
    sessions = await session_crud.get_multi(skip=skip, limit=limit, client_id=client_id)
    return [SessionResponse(**session) for session in sessions]


@router.get("/client/{client_id}/latest", response_model=Optional[SessionResponse])
async def get_latest_client_session(client_id: str) -> Optional[SessionResponse]:
    """
    Get the most recent session for a client (for previous session context).
    """
    sessions = await session_crud.get_client_sessions(client_id, limit=1)
    if not sessions:
        return None
    return SessionResponse(**sessions[0])


@router.get("/client/{client_id}", response_model=List[SessionResponse])
async def get_client_sessions(
    client_id: str,
    limit: int = Query(10, ge=1, le=100)
) -> List[SessionResponse]:
    """
    Get all sessions for a specific client.
    """
    sessions = await session_crud.get_client_sessions(client_id, limit)
    return [SessionResponse(**session) for session in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str
) -> SessionResponse:
    """
    Get a specific session by ID.
    """
    session = await session_crud.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return SessionResponse(**session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    *,
    session_id: str,
    session_in: SessionUpdate,
    background_tasks: BackgroundTasks
) -> SessionResponse:
    """
    Update an existing session.
    Triggers persona update in background when transcript or summary is provided.
    """
    session = await session_crud.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    try:
        updated = await session_crud.update(session_id=session_id, obj_in=session_in)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update session"
            )
        if session_in.transcript or session_in.summary:
            client_id = session.get("client_id")
            if client_id:
                background_tasks.add_task(_update_persona_task, client_id, session_in)
        return SessionResponse(**updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update session: {str(e)}"
        )


@router.get("/stats/totals")
async def get_sessions_stats() -> dict:
    """
    Get total sessions count and total hours across all sessions.
    """
    sessions = await session_crud.get_multi(skip=0, limit=200)
    total_minutes = sum(s.get("duration_minutes", 0) for s in sessions)
    return {
        "total_sessions": len(sessions),
        "total_hours": round(total_minutes / 60, 1)
    }


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str
):
    """
    Delete a session.
    """
    success = await session_crud.delete(session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return None
