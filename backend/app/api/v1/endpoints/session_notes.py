"""
Session Notes API endpoints
One canonical note per session.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.crud.session_note import session_note_crud
from app.crud.session import session_crud
from app.crud.client import client_crud
from app.models.models import (
    SessionNoteCreate,
    SessionNoteUpdate,
    SessionNoteResponse,
)
from app.core.auth import get_current_user_id


async def _verify_session_ownership(session_id: str, therapist_id: str) -> dict:
    session = await session_crud.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    client = await client_crud.get(session["client_id"])
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session


async def _verify_note_ownership(note_id: str, therapist_id: str) -> dict:
    note = await session_note_crud.get(note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    client = await client_crud.get(note["client_id"])
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return note


router = APIRouter()


@router.post("/", response_model=SessionNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_session_note(
    note_in: SessionNoteCreate,
    therapist_id: str = Depends(get_current_user_id)
) -> SessionNoteResponse:
    """Create a session note. Only one note per session is allowed."""
    await _verify_session_ownership(note_in.session_id, therapist_id)

    # Check if note already exists for this session
    existing = await session_note_crud.get_by_session(note_in.session_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A note already exists for this session. Use PUT to update."
        )

    try:
        note = await session_note_crud.create(obj_in=note_in, therapist_id=therapist_id)
        return SessionNoteResponse(**note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create note: {str(e)}"
        )


@router.get("/session/{session_id}", response_model=Optional[SessionNoteResponse])
async def get_session_note(
    session_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> Optional[SessionNoteResponse]:
    """Get the note for a specific session."""
    await _verify_session_ownership(session_id, therapist_id)
    note = await session_note_crud.get_by_session(session_id)
    if not note:
        return None
    return SessionNoteResponse(**note)


@router.get("/{note_id}", response_model=SessionNoteResponse)
async def get_note(
    note_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> SessionNoteResponse:
    """Get a specific note by ID."""
    note = await _verify_note_ownership(note_id, therapist_id)
    return SessionNoteResponse(**note)


@router.put("/{note_id}", response_model=SessionNoteResponse)
async def update_session_note(
    *,
    note_id: str,
    note_in: SessionNoteUpdate,
    therapist_id: str = Depends(get_current_user_id)
) -> SessionNoteResponse:
    """Update a session note. If note_format changes, incompatible fields are cleared."""
    await _verify_note_ownership(note_id, therapist_id)
    try:
        updated = await session_note_crud.update(note_id=note_id, obj_in=note_in)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update note"
            )
        return SessionNoteResponse(**updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update note: {str(e)}"
        )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session_note(
    note_id: str,
    therapist_id: str = Depends(get_current_user_id)
):
    """Delete a session note."""
    await _verify_note_ownership(note_id, therapist_id)
    success = await session_note_crud.delete(note_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return None
