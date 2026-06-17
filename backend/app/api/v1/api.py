"""
Main API Router - v1 (new minimal schema)
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    ai,
    clients,
    sessions,
    templates,
    user_settings,
)

api_router = APIRouter()

api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(user_settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
