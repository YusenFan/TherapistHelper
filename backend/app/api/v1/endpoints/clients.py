"""
Client API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, BackgroundTasks
from app.crud.client import client_crud
from app.crud.persona import persona_crud
from app.services.llm import llm_service
from app.models.models import ClientCreate, ClientUpdate, ClientResponse


async def _generate_persona_task(client_id: str, client_info: dict) -> None:
    """Background task: generate and save a persona for a newly created client."""
    try:
        persona_text = await llm_service.generate_client_persona(client_info)
        persona_crud.save_persona(client_id, persona_text)
        print(f"[PersonaTask] Generated persona for client {client_id}")
    except Exception as e:
        print(f"[PersonaTask] Failed for client {client_id}: {e}")

router = APIRouter()


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_in: ClientCreate,
    background_tasks: BackgroundTasks
) -> ClientResponse:
    """
    Create a new client profile with encrypted sensitive data.
    Triggers persona generation as a background task.
    """
    try:
        client = await client_crud.create(obj_in=client_in)
        client_id = client.get("id") or client.get("$id", "")
        if client_id:
            client_info = {
                "name": client_in.full_name,
                "age": client_in.age,
                "gender": client_in.gender,
                "background": client_in.background or ""
            }
            background_tasks.add_task(_generate_persona_task, client_id, client_info)
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
    tags: Optional[List[str]] = Query(None)
) -> List[ClientResponse]:
    """
    Retrieve a list of clients with pagination and filtering.
    """
    clients = await client_crud.get_multi(skip=skip, limit=limit, status=status, tags=tags)
    return [ClientResponse(**client) for client in clients]


@router.get("/active", response_model=List[ClientResponse])
async def list_active_clients() -> List[ClientResponse]:
    """
    Retrieve all active clients.
    """
    clients = await client_crud.get_active_clients()
    return [ClientResponse(**client) for client in clients]


@router.get("/search/{query}", response_model=List[ClientResponse])
async def search_clients(
    query: str
) -> List[ClientResponse]:
    """
    Search clients by name, email, or tags.
    """
    clients = await client_crud.search_clients(query)
    return [ClientResponse(**client) for client in clients]


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str
) -> ClientResponse:
    """
    Get a specific client by ID.
    """
    client = await client_crud.get(client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return ClientResponse(**client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    *,
    client_id: str,
    client_in: ClientUpdate
) -> ClientResponse:
    """
    Update an existing client.
    """
    client = await client_crud.get(client_id)
    if not client:
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update client: {str(e)}"
        )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str
):
    """
    Delete a client.
    """
    success = await client_crud.delete(client_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return None


@router.get("/stats/count")
async def get_clients_count() -> dict:
    """
    Get total count of clients.
    """
    count = await client_crud.count()
    return {"total_clients": count}


@router.post("/{client_id}/tags/{tag}", response_model=ClientResponse)
async def add_client_tag(
    client_id: str,
    tag: str
) -> ClientResponse:
    """
    Add a tag to a client.
    """
    client = await client_crud.add_tag(client_id, tag)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found or tag already exists"
        )
    return ClientResponse(**client)


@router.delete("/{client_id}/tags/{tag}", response_model=ClientResponse)
async def remove_client_tag(
    client_id: str,
    tag: str
) -> ClientResponse:
    """
    Remove a tag from a client.
    """
    client = await client_crud.remove_tag(client_id, tag)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found or tag does not exist"
        )
    return ClientResponse(**client)


@router.post("/{client_id}/background", response_model=ClientResponse)
async def update_client_background(
    client_id: str,
    background: str = Query(..., min_length=1)
) -> ClientResponse:
    """
    Update client background (usually AI-generated from transcripts).
    """
    client = await client_crud.update_background(client_id, background)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return ClientResponse(**client)
