"""
Clinical Assessment API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.crud.clinical_assessment import clinical_assessment_crud
from app.crud.client import client_crud
from app.models.models import (
    ClinicalAssessmentCreate,
    ClinicalAssessmentUpdate,
    ClinicalAssessmentResponse,
)
from app.core.auth import get_current_user_id


async def _verify_client_ownership(client_id: str, therapist_id: str) -> dict:
    client = await client_crud.get(client_id)
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client


async def _verify_assessment_ownership(assessment_id: str, therapist_id: str) -> dict:
    assessment = await clinical_assessment_crud.get(assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    client = await client_crud.get(assessment["client_id"])
    if not client or client.get("therapist_id") != therapist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    return assessment


router = APIRouter()


@router.post("/", response_model=ClinicalAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    assessment_in: ClinicalAssessmentCreate,
    therapist_id: str = Depends(get_current_user_id)
) -> ClinicalAssessmentResponse:
    """Create a new clinical assessment (intake, reassessment, or discharge summary)."""
    await _verify_client_ownership(assessment_in.client_id, therapist_id)
    try:
        assessment = await clinical_assessment_crud.create(
            obj_in=assessment_in, therapist_id=therapist_id
        )
        return ClinicalAssessmentResponse(**assessment)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create assessment: {str(e)}"
        )


@router.get("/client/{client_id}", response_model=List[ClinicalAssessmentResponse])
async def get_client_assessments(
    client_id: str,
    assessment_type: Optional[str] = Query(None),
    therapist_id: str = Depends(get_current_user_id)
) -> List[ClinicalAssessmentResponse]:
    """Get all assessments for a client, optionally filtered by type."""
    await _verify_client_ownership(client_id, therapist_id)
    assessments = await clinical_assessment_crud.get_client_assessments(
        client_id, assessment_type=assessment_type
    )
    return [ClinicalAssessmentResponse(**a) for a in assessments]


@router.get("/client/{client_id}/current", response_model=Optional[ClinicalAssessmentResponse])
async def get_current_assessment(
    client_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> Optional[ClinicalAssessmentResponse]:
    """Get the current (most recent is_current=true) assessment for a client."""
    await _verify_client_ownership(client_id, therapist_id)
    assessment = await clinical_assessment_crud.get_current(client_id)
    if not assessment:
        return None
    return ClinicalAssessmentResponse(**assessment)


@router.get("/{assessment_id}", response_model=ClinicalAssessmentResponse)
async def get_assessment(
    assessment_id: str,
    therapist_id: str = Depends(get_current_user_id)
) -> ClinicalAssessmentResponse:
    """Get a specific assessment by ID."""
    assessment = await _verify_assessment_ownership(assessment_id, therapist_id)
    return ClinicalAssessmentResponse(**assessment)


@router.put("/{assessment_id}", response_model=ClinicalAssessmentResponse)
async def update_assessment(
    *,
    assessment_id: str,
    assessment_in: ClinicalAssessmentUpdate,
    therapist_id: str = Depends(get_current_user_id)
) -> ClinicalAssessmentResponse:
    """Update an existing assessment."""
    await _verify_assessment_ownership(assessment_id, therapist_id)
    try:
        updated = await clinical_assessment_crud.update(
            assessment_id=assessment_id, obj_in=assessment_in
        )
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update assessment"
            )
        return ClinicalAssessmentResponse(**updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update assessment: {str(e)}"
        )


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    therapist_id: str = Depends(get_current_user_id)
):
    """Delete an assessment."""
    await _verify_assessment_ownership(assessment_id, therapist_id)
    success = await clinical_assessment_crud.delete(assessment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    return None
