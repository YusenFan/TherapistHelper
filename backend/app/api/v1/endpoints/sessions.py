"""
Session API endpoints. Each session carries its own note (format + content).
Ownership is enforced via the session's therapist_id.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.crud.session import session_crud
from app.crud.client import client_crud
from app.models.models import SessionCreate, SessionUpdate, SessionResponse
from app.core.auth import get_current_user_id

router = APIRouter()


async def _owned_session(session_id: str, therapist_id: str) -> dict:
    session = await session_crud.get(session_id)
    if not session or session.get("therapist_id") != therapist_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


async def _owned_client(client_id: str, therapist_id: str) -> dict:
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_in: SessionCreate,
    therapist_id: str = Depends(get_current_user_id),
) -> SessionResponse:
    await _owned_client(session_in.client_id, therapist_id)
    try:
        session = await session_crud.create(obj_in=session_in, therapist_id=therapist_id)
        return SessionResponse(**session)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create session: {e}")


@router.get("/", response_model=List[SessionResponse])
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    therapist_id: str = Depends(get_current_user_id),
) -> List[SessionResponse]:
    sessions = await session_crud.get_by_therapist(therapist_id, skip=skip, limit=limit)
    return [SessionResponse(**s) for s in sessions]


@router.get("/client/{client_id}", response_model=List[SessionResponse])
async def get_client_sessions(
    client_id: str,
    limit: int = Query(50, ge=1, le=200),
    therapist_id: str = Depends(get_current_user_id),
) -> List[SessionResponse]:
    await _owned_client(client_id, therapist_id)
    sessions = await session_crud.get_client_sessions(client_id, limit)
    return [SessionResponse(**s) for s in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    therapist_id: str = Depends(get_current_user_id),
) -> SessionResponse:
    session = await _owned_session(session_id, therapist_id)
    return SessionResponse(**session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    *,
    session_id: str,
    session_in: SessionUpdate,
    therapist_id: str = Depends(get_current_user_id),
) -> SessionResponse:
    await _owned_session(session_id, therapist_id)
    updated = await session_crud.update(session_id=session_id, obj_in=session_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update session")
    return SessionResponse(**updated)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    therapist_id: str = Depends(get_current_user_id),
):
    await _owned_session(session_id, therapist_id)
    await session_crud.delete(session_id)
    return None
