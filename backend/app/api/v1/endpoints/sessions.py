"""
Session API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.crud.session import session_crud
from app.models.models import SessionCreate, SessionUpdate, SessionResponse

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
    session_in: SessionUpdate
) -> SessionResponse:
    """
    Update an existing session.
    """
    session = await session_crud.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    try:
        session = await session_crud.update(session_id=session_id, obj_in=session_in)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update session"
            )
        return SessionResponse(**session)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update session: {str(e)}"
        )


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
