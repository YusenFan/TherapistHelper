"""
User Settings API endpoints (EHR preferences, extension connection)
"""
from fastapi import APIRouter, HTTPException, status, Depends
from app.crud.user_settings import user_settings_crud
from app.models.models import UserSettingsUpdate, UserSettingsResponse
from app.core.auth import get_current_user_id

router = APIRouter()


@router.get("/", response_model=UserSettingsResponse)
async def get_settings(
    therapist_id: str = Depends(get_current_user_id)
) -> UserSettingsResponse:
    """Get the current user's settings (auto-created with defaults)."""
    doc = await user_settings_crud.get_or_create(therapist_id)
    return UserSettingsResponse(**doc)


@router.put("/", response_model=UserSettingsResponse)
async def update_settings(
    settings_in: UserSettingsUpdate,
    therapist_id: str = Depends(get_current_user_id)
) -> UserSettingsResponse:
    """Update the current user's settings (default EHR, last used EHR)."""
    updated = await user_settings_crud.update(therapist_id, settings_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update settings"
        )
    return UserSettingsResponse(**updated)
