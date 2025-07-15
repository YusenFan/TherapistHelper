from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.client import client_crud
from app.schemas.client import (
    ClientCreate, 
    ClientUpdate, 
    ClientResponse, 
    ClientListResponse,
    ErrorResponse
)

router = APIRouter()


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    *,
    db: Session = Depends(get_db),
    client_in: ClientCreate
) -> ClientResponse:
    """
    Create a new client profile with encrypted sensitive data.
    """
    try:
        client = client_crud.create(db=db, obj_in=client_in)
        return ClientResponse.from_orm(client)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create client: {str(e)}"
        )


@router.get("/", response_model=List[ClientListResponse])
async def list_clients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[ClientListResponse]:
    """
    Retrieve a list of clients with pagination.
    """
    clients = client_crud.get_multi(db=db, skip=skip, limit=limit)
    return [ClientListResponse.from_orm(client) for client in clients]


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db)
) -> ClientResponse:
    """
    Get a specific client by ID.
    """
    client = client_crud.get(db=db, id=client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return ClientResponse.from_orm(client)


@router.get("/uuid/{client_uuid}", response_model=ClientResponse)
async def get_client_by_uuid(
    client_uuid: str,
    db: Session = Depends(get_db)
) -> ClientResponse:
    """
    Get a specific client by UUID.
    """
    client = client_crud.get_by_uuid(db=db, uuid=client_uuid)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return ClientResponse.from_orm(client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    *,
    client_id: int,
    db: Session = Depends(get_db),
    client_in: ClientUpdate
) -> ClientResponse:
    """
    Update an existing client.
    """
    client = client_crud.get(db=db, id=client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    try:
        client = client_crud.update(db=db, db_obj=client, obj_in=client_in)
        return ClientResponse.from_orm(client)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update client: {str(e)}"
        )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a client.
    """
    client = client_crud.get(db=db, id=client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    client_crud.delete(db=db, id=client_id)
    return None


@router.get("/stats/count")
async def get_clients_count(
    db: Session = Depends(get_db)
) -> dict:
    """
    Get total count of clients.
    """
    count = client_crud.count(db=db)
    return {"total_clients": count} 