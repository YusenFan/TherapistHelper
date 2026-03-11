"""
Notes API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.crud.note import note_crud
from app.crud.client import client_crud
from app.models.models import NoteCreate, NoteUpdate, NoteResponse
from app.core.auth import get_current_user_id


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


async def _verify_note_ownership(note_id: str, therapist_id: str) -> dict:
    """
    Verify that a note belongs to the current therapist (by checking client ownership).
    Raises 404 if note not found or client doesn't belong to therapist.
    Returns the note data if valid.
    """
    note = await note_crud.get(note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # Verify the client belongs to the therapist
    client = await client_crud.get(note["client_id"])
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    return note


router = APIRouter()


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_in: NoteCreate,
    therapist_id: str = Depends(get_current_user_id)
) -> NoteResponse:
    """
    Create a new note for a client.
    Verifies that the client belongs to the therapist.
    """
    # Verify client ownership
    await _verify_client_ownership(note_in.client_id, therapist_id)

    try:
        note = await note_crud.create(obj_in=note_in)
        return NoteResponse(**note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create note: {str(e)}"
        )


@router.get("/", response_model=List[NoteResponse])
async def list_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    client_id: Optional[str] = Query(None),
    note_type: Optional[str] = Query(None),
    therapist_id: str = Depends(get_current_user_id)
) -> List[NoteResponse]:
    """
    Retrieve a list of notes with pagination and filtering.
    Only returns notes for the therapist's clients.
    """
    if client_id:
        # Verify client ownership first
        await _verify_client_ownership(client_id, therapist_id)
        notes = await note_crud.get_multi(
            skip=skip,
            limit=limit,
            client_id=client_id,
            note_type=note_type
        )
    else:
        # Get all notes, then filter by therapist's clients
        try:
            # Get all clients for this therapist
            clients = await client_crud.get_multi(therapist_id=therapist_id, skip=0, limit=200)
            client_ids = [c["id"] for c in clients]

            # Get all notes
            all_notes = await note_crud.get_multi(skip=0, limit=500)

            # Filter notes to only those belonging to therapist's clients
            therapist_notes = [
                n for n in all_notes
                if n.get("client_id") in client_ids
            ]

            # Apply filters
            if note_type:
                therapist_notes = [n for n in therapist_notes if n.get("note_type") == note_type]

            # Apply pagination
            notes = therapist_notes[skip:skip + limit]
        except Exception as e:
            print(f"Error listing notes: {e}")
            notes = []

    return [NoteResponse(**note) for note in notes]


@router.get("/client/{client_id}", response_model=List[NoteResponse])
async def get_client_notes(
    client_id: str,
    limit: int = Query(50, ge=1, le=200),
    therapist_id: str = Depends(get_current_user_id)
) -> List[NoteResponse]:
    """
    Get all notes for a specific client.
    Verifies client ownership.
    """
    # Verify client ownership
    await _verify_client_ownership(client_id, therapist_id)

    notes = await note_crud.get_client_notes(client_id, limit)
    return [NoteResponse(**note) for note in notes]


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> NoteResponse:
    """
    Get a specific note by ID.
    Verifies note ownership.
    """
    note = await _verify_note_ownership(note_id, therapist_id)
    return NoteResponse(**note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    *,
    note_id: str,
    note_in: NoteUpdate,
    therapist_id: str = Depends(get_current_user_id)
) -> NoteResponse:
    """
    Update an existing note.
    Verifies note ownership.
    """
    # Verify note ownership
    await _verify_note_ownership(note_id, therapist_id)

    try:
        note = await note_crud.update(note_id=note_id, obj_in=note_in)
        if not note:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update note"
            )
        return NoteResponse(**note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update note: {str(e)}"
        )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    therapist_id: str = Depends(get_current_user_id)
):
    """
    Delete a note.
    Verifies note ownership.
    """
    # Verify note ownership
    await _verify_note_ownership(note_id, therapist_id)

    success = await note_crud.delete(note_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return None


@router.get("/search/{query}")
async def search_notes(
    client_id: str,
    query: str,
    therapist_id: str = Depends(get_current_user_id)
):
    """
    Search notes for a client.
    Verifies client ownership.
    """
    # Verify client ownership
    await _verify_client_ownership(client_id, therapist_id)

    notes = await note_crud.search_notes(client_id, query)
    return {"notes": notes, "count": len(notes)}
