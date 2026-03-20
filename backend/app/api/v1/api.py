"""
Main API Router - v1
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    clients,
    sessions,
    session_notes,
    clinical_assessments,
    transcription,
    ai,
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

# Session Notes endpoints
api_router.include_router(
    session_notes.router,
    prefix="/session-notes",
    tags=["session-notes"]
)

# Clinical Assessment endpoints
api_router.include_router(
    clinical_assessments.router,
    prefix="/clinical-assessments",
    tags=["clinical-assessments"]
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
