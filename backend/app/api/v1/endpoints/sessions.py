"""
Session API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, BackgroundTasks, Depends
from app.crud.session import session_crud
from app.crud.client import client_crud
from app.crud.persona import persona_crud
from app.services.llm import llm_service
from app.models.models import SessionCreate, SessionUpdate, SessionResponse
from app.core.auth import get_current_user_id


async def _verify_session_ownership(session_id: str, therapist_id: str) -> dict:
    """
    Verify that a session belongs to the current therapist.
    Raises 404 if session not found or doesn't belong to therapist.
    Returns the session data if valid.
    """
    session = await session_crud.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # Get the client to verify therapist ownership
    client = await client_crud.get(session["client_id"])
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    return session


async def _verify_client_ownership(client_id: str, therapist_id: str) -> dict:
    """
    Verify that a client belongs to the current therapist.
    Raises 404 if client not found or doesn't belong to therapist.
    Returns the client data if valid.
    """
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client


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
    session_in: SessionCreate,
    therapist_id: str = Depends(get_current_user_id)
) -> SessionResponse:
    """
    Create a new session for a client.
    Verifies that the client belongs to the therapist.
    """
    # Verify client ownership
    await _verify_client_ownership(session_in.client_id, therapist_id)

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
    therapist_id: str = Depends(get_current_user_id)
) -> List[SessionResponse]:
    """
    Retrieve a list of sessions for the therapist's clients only.
    """
    # Get all sessions for this therapist's clients
    try:
        # First get all clients for this therapist
        clients = await client_crud.get_multi(therapist_id=therapist_id, skip=0, limit=200)
        client_ids = [c["id"] for c in clients]

        # Then get all sessions for those clients
        all_sessions = await session_crud.get_multi(skip=0, limit=500)

        # Filter sessions to only those belonging to therapist's clients
        therapist_sessions = [
            s for s in all_sessions
            if s.get("client_id") in client_ids
        ]

        # Apply pagination
        sessions = therapist_sessions[skip:skip + limit]
        return [SessionResponse(**session) for session in sessions]
    except Exception as e:
        print(f"Error listing sessions: {e}")
        return []


@router.get("/client/{client_id}/latest", response_model=Optional[SessionResponse])
async def get_latest_client_session(
    client_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> Optional[SessionResponse]:
    """
    Get most recent session for a client (for previous session context).
    Verifies client ownership.
    """
    # Verify client ownership
    await _verify_client_ownership(client_id, therapist_id)

    sessions = await session_crud.get_client_sessions(client_id, limit=1)
    if not sessions:
        return None
    return SessionResponse(**sessions[0])


@router.get("/client/{client_id}", response_model=List[SessionResponse])
async def get_client_sessions(
    client_id: str,
    limit: int = Query(10, ge=1, le=100),
    therapist_id: str = Depends(get_current_user_id)
) -> List[SessionResponse]:
    """
    Get all sessions for a specific client.
    Verifies client ownership.
    """
    # Verify client ownership
    await _verify_client_ownership(client_id, therapist_id)

    sessions = await session_crud.get_client_sessions(client_id, limit)
    return [SessionResponse(**session) for session in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> SessionResponse:
    """
    Get a specific session by ID.
    Verifies session ownership.
    """
    session = await _verify_session_ownership(session_id, therapist_id)
    return SessionResponse(**session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    *,
    session_id: str,
    session_in: SessionUpdate,
    background_tasks: BackgroundTasks,
    therapist_id: str = Depends(get_current_user_id)
) -> SessionResponse:
    """
    Update an existing session.
    Verifies session ownership and triggers persona update in background
    when transcript or summary is provided.
    """
    session = await _verify_session_ownership(session_id, therapist_id)

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
async def get_sessions_stats(
    therapist_id: str = Depends(get_current_user_id)
) -> dict:
    """
    Get total sessions count and total hours for the therapist's clients only.
    """
    try:
        # Get all clients for this therapist
        clients = await client_crud.get_multi(therapist_id=therapist_id, skip=0, limit=200)
        client_ids = [c["id"] for c in clients]

        # Get all sessions and filter by therapist's clients
        all_sessions = await session_crud.get_multi(skip=0, limit=500)
        therapist_sessions = [
            s for s in all_sessions
            if s.get("client_id") in client_ids
        ]

        total_minutes = sum(s.get("duration_minutes", 0) for s in therapist_sessions)
        return {
            "total_sessions": len(therapist_sessions),
            "total_hours": round(total_minutes / 60, 1)
        }
    except Exception as e:
        print(f"Error getting session stats: {e}")
        return {"total_sessions": 0, "total_hours": 0}


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    therapist_id: str = Depends(get_current_user_id)
):
    """
    Delete a session.
    Verifies session ownership.
    """
    # Verify session ownership
    await _verify_session_ownership(session_id, therapist_id)

    success = await session_crud.delete(session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return None
