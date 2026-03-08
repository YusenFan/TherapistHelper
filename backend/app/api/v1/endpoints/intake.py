"""
Intake Form API endpoints
"""
from fastapi import APIRouter, HTTPException, status
from app.crud.client import client_crud
from app.models.models import IntakeForm
from app.core.config import encryption_manager

router = APIRouter()


@router.post("/{client_id}")
async def submit_intake_form(
    client_id: str,
    intake_data: IntakeForm
):
    """
    Submit or update an intake form for a client.
    Intake forms contain detailed background information.
    """
    try:
        # Verify client exists
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        # Combine all intake information into a structured background
        background_parts = []

        if intake_data.family_structure:
            background_parts.append(f"Family Structure: {intake_data.family_structure}")
        if intake_data.parents_relationship:
            background_parts.append(f"Parents Relationship: {intake_data.parents_relationship}")
        if intake_data.major_life_events:
            background_parts.append(f"Major Life Events: {intake_data.major_life_events}")
        if intake_data.physical_health:
            background_parts.append(f"Physical Health: {intake_data.physical_health}")
        if intake_data.mental_health:
            background_parts.append(f"Mental Health: {intake_data.mental_health}")
        if intake_data.medications:
            background_parts.append(f"Medications: {intake_data.medications}")
        if intake_data.education_status:
            background_parts.append(f"Education: {intake_data.education_status}")
        if intake_data.work_status:
            background_parts.append(f"Work: {intake_data.work_status}")
        if intake_data.relationship_status:
            background_parts.append(f"Relationship Status: {intake_data.relationship_status}")
        if intake_data.additional_notes:
            background_parts.append(f"Additional Notes: {intake_data.additional_notes}")

        # Join with newlines for readability
        combined_background = "\n\n".join(background_parts)

        # Update client background
        await client_crud.update_background(client_id, combined_background)

        return {
            "message": "Intake form submitted successfully",
            "client_id": client_id,
            "background_updated": True
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit intake form: {str(e)}"
        )


@router.get("/{client_id}")
async def get_intake_form(
    client_id: str
):
    """
    Get the intake form data for a client.
    Parses the background information to return structured data.
    """
    try:
        # Get client
        client = await client_crud.get(client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )

        # Parse background to extract structured data
        background = client.get("background", "")

        # Simple parsing - in production, you'd want more robust parsing
        # This is a basic implementation
        intake_data = {
            "client_id": client_id,
            "family_structure": None,
            "parents_relationship": None,
            "major_life_events": None,
            "physical_health": None,
            "mental_health": None,
            "medications": None,
            "education_status": None,
            "work_status": None,
            "relationship_status": None,
            "additional_notes": None
        }

        # Parse background sections
        if "Family Structure:" in background:
            intake_data["family_structure"] = background.split("Family Structure:")[1].split("\n\n")[0].strip()
        if "Parents Relationship:" in background:
            intake_data["parents_relationship"] = background.split("Parents Relationship:")[1].split("\n\n")[0].strip()
        if "Major Life Events:" in background:
            intake_data["major_life_events"] = background.split("Major Life Events:")[1].split("\n\n")[0].strip()
        if "Physical Health:" in background:
            intake_data["physical_health"] = background.split("Physical Health:")[1].split("\n\n")[0].strip()
        if "Mental Health:" in background:
            intake_data["mental_health"] = background.split("Mental Health:")[1].split("\n\n")[0].strip()
        if "Medications:" in background:
            intake_data["medications"] = background.split("Medications:")[1].split("\n\n")[0].strip()
        if "Education:" in background:
            intake_data["education_status"] = background.split("Education:")[1].split("\n\n")[0].strip()
        if "Work:" in background:
            intake_data["work_status"] = background.split("Work:")[1].split("\n\n")[0].strip()
        if "Relationship Status:" in background:
            intake_data["relationship_status"] = background.split("Relationship Status:")[1].split("\n\n")[0].strip()
        if "Additional Notes:" in background:
            intake_data["additional_notes"] = background.split("Additional Notes:")[1].strip()

        return intake_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get intake form: {str(e)}"
        )


@router.post("/{client_id}/share-link")
async def generate_intake_share_link(
    client_id: str
):
    """
    Generate a shareable link for the client to fill out their intake form.
    """
    try:
        # In production, this would generate a unique, secure link
        # For now, return a placeholder
        import uuid

        share_token = str(uuid.uuid4())
        share_link = f"{settings.ALLOWED_HOSTS[0]}/intake/{client_id}?token={share_token}"

        return {
            "client_id": client_id,
            "share_token": share_token,
            "share_link": share_link,
            "expires_in_hours": 72  # Link expires in 72 hours
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate share link: {str(e)}"
        )
