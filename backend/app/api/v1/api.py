"""
Main API Router - v1
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    clients,
    sessions,
    transcription,
    ai,
    notes,
    intake
)

api_router = APIRouter()

# Client endpoints
api_router.include_router(
    clients.router,
    prefix="/clients",
    tags=["clients"]
)

# Session endpoints
api_router.include_router(
    sessions.router,
    prefix="/sessions",
    tags=["sessions"]
)

# Transcription endpoints
api_router.include_router(
    transcription.router,
    prefix="/transcription",
    tags=["transcription"]
)

# AI Services endpoints
api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["ai"]
)

# Notes endpoints
api_router.include_router(
    notes.router,
    prefix="/notes",
    tags=["notes"]
)

# Intake form endpoints
api_router.include_router(
    intake.router,
    prefix="/intake",
    tags=["intake"]
)
