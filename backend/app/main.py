"""
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TherapistHelper API - Secure client management with AI assistance",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": "TherapistHelper API",
        "version": settings.VERSION,
        "status": "running",
        "database": "Appwrite",
        "features": {
            "client_management": True,
            "transcription": "OpenAI Whisper",
            "ai_analysis": "Tinfoil.sh",
            "session_helper": True
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "Appwrite",
        "environment": settings.ENVIRONMENT
    }
