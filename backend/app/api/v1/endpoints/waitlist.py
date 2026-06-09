"""
Public waitlist endpoint for the marketing landing page.
"""
from fastapi import APIRouter, HTTPException, status
from appwrite.query import Query

from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import WaitlistCreate, WaitlistResponse

router = APIRouter()


@router.post("/", response_model=WaitlistResponse, status_code=status.HTTP_201_CREATED)
async def join_waitlist(waitlist_in: WaitlistCreate) -> WaitlistResponse:
    """Create a waitlist entry or acknowledge an existing one."""
    try:
        existing = db.list_rows(
            settings.COLLECTION_WAITLIST,
            queries=[Query.equal("email", waitlist_in.email)],
            limit=1,
        )
        if existing.get("documents"):
            return WaitlistResponse(
                message="You're already on the waitlist. We'll reach out when early access opens.",
                already_joined=True,
            )

        db.create_row(
            settings.COLLECTION_WAITLIST,
            {
                "email": waitlist_in.email,
                "source": "landing_page",
            },
        )
        return WaitlistResponse(
            message="Thanks. You're on the waitlist and we'll be in touch soon.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to join waitlist: {exc}",
        )
