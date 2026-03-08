"""
Notes API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.crud.note import note_crud
from app.models.models import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_in: NoteCreate
) -> NoteResponse:
    """
    Create a new note for a client.
    """
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
    note_type: Optional[str] = Query(None)
) -> List[NoteResponse]:
    """
    Retrieve a list of notes with pagination and filtering.
    """
    notes = await note_crud.get_multi(
        skip=skip,
        limit=limit,
        client_id=client_id,
        note_type=note_type
    )
    return [NoteResponse(**note) for note in notes]


@router.get("/client/{client_id}", response_model=List[NoteResponse])
async def get_client_notes(
    client_id: str,
    limit: int = Query(50, ge=1, le=200)
) -> List[NoteResponse]:
    """
    Get all notes for a specific client.
    """
    notes = await note_crud.get_client_notes(client_id, limit)
    return [NoteResponse(**note) for note in notes]


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str
) -> NoteResponse:
    """
    Get a specific note by ID.
    """
    note = await note_crud.get(note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return NoteResponse(**note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    *,
    note_id: str,
    note_in: NoteUpdate
) -> NoteResponse:
    """
    Update an existing note.
    """
    note = await note_crud.get(note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

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
    note_id: str
):
    """
    Delete a note.
    """
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
    query: str
):
    """
    Search notes for a client.
    """
    notes = await note_crud.search_notes(client_id, query)
    return {"notes": notes, "count": len(notes)}
