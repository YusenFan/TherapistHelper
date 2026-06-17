"""
Client API endpoints
"""
from typing import List
from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.crud.client import client_crud
from app.models.models import ClientCreate, ClientUpdate, ClientResponse
from app.core.auth import get_current_user_id

router = APIRouter()


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_in: ClientCreate,
    therapist_id: str = Depends(get_current_user_id),
) -> ClientResponse:
    try:
        client = await client_crud.create(obj_in=client_in, therapist_id=therapist_id)
        return ClientResponse(**client)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create client: {e}")


@router.get("/", response_model=List[ClientResponse])
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    therapist_id: str = Depends(get_current_user_id),
) -> List[ClientResponse]:
    clients = await client_crud.get_multi(therapist_id=therapist_id, skip=skip, limit=limit)
    return [ClientResponse(**c) for c in clients]


@router.get("/stats/count")
async def get_clients_count(therapist_id: str = Depends(get_current_user_id)) -> dict:
    count = await client_crud.count(therapist_id=therapist_id)
    return {"total_clients": count}


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    therapist_id: str = Depends(get_current_user_id),
) -> ClientResponse:
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientResponse(**client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    *,
    client_id: str,
    client_in: ClientUpdate,
    therapist_id: str = Depends(get_current_user_id),
) -> ClientResponse:
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    updated = await client_crud.update(client_id=client_id, obj_in=client_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update client")
    return ClientResponse(**updated)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    therapist_id: str = Depends(get_current_user_id),
):
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    await client_crud.delete(client_id)
    return None
