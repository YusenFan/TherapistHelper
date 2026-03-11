"""
Authentication utilities for TherapistHelper
Validates Appwrite JWTs and extracts the current user ID
"""
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validate an Appwrite JWT and return the authenticated user's ID.
    Raises 401 if the token is missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jwt = credentials.credentials
    try:
        response = requests.get(
            f"{settings.APPWRITE_ENDPOINT}/account",
            headers={
                "X-Appwrite-Project": settings.APPWRITE_PROJECT_ID,
                "X-Appwrite-JWT": jwt,
            },
            timeout=10,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth service unreachable: {e}",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = response.json()
    user_id = user_data.get("$id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not extract user ID from token",
        )

    return user_id
