"""
Client API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.crud.client import client_crud
from app.models.models import ClientCreate, ClientUpdate, ClientResponse
from app.core.auth import get_current_user_id

router = APIRouter()


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_in: ClientCreate,
    therapist_id: str = Depends(get_current_user_id)
) -> ClientResponse:
    """Create a new client profile."""
    try:
        client = await client_crud.create(obj_in=client_in, therapist_id=therapist_id)
        return ClientResponse(**client)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create client: {str(e)}"
        )


@router.get("/", response_model=List[ClientResponse])
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = Query(None),
    therapist_id: str = Depends(get_current_user_id)
) -> List[ClientResponse]:
    """Retrieve a list of clients with pagination and filtering."""
    clients = await client_crud.get_multi(
        therapist_id=therapist_id, skip=skip, limit=limit, status=status
    )
    return [ClientResponse(**client) for client in clients]


@router.get("/active", response_model=List[ClientResponse])
async def list_active_clients(
    therapist_id: str = Depends(get_current_user_id)
) -> List[ClientResponse]:
    """Retrieve all active clients."""
    clients = await client_crud.get_active_clients(therapist_id=therapist_id)
    return [ClientResponse(**client) for client in clients]


@router.get("/stats/count")
async def get_clients_count(
    therapist_id: str = Depends(get_current_user_id)
) -> dict:
    """Get total count of clients."""
    count = await client_crud.count(therapist_id=therapist_id)
    return {"total_clients": count}


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> ClientResponse:
    """Get a specific client by ID."""
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return ClientResponse(**client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    *,
    client_id: str,
    client_in: ClientUpdate,
    therapist_id: str = Depends(get_current_user_id)
) -> ClientResponse:
    """Update an existing client."""
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    try:
        client = await client_crud.update(client_id=client_id, obj_in=client_in)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update client"
            )
        return ClientResponse(**client)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update client: {str(e)}"
        )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    therapist_id: str = Depends(get_current_user_id)
):
    """Delete a client."""
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    await client_crud.delete(client_id)
    return None
