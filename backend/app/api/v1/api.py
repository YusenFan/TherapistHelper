from fastapi import APIRouter
from app.api.v1.endpoints import clients

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    clients.router, 
    prefix="/clients", 
    tags=["clients"]
) 