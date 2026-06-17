"""
Note Template API endpoints. Reusable section lists for building session notes.
"""
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from app.crud.note_template import note_template_crud
from app.models.models import NoteTemplateCreate, NoteTemplateUpdate, NoteTemplateResponse
from app.core.auth import get_current_user_id

router = APIRouter()


@router.get("/", response_model=List[NoteTemplateResponse])
async def list_templates(
    therapist_id: str = Depends(get_current_user_id),
) -> List[NoteTemplateResponse]:
    templates = await note_template_crud.get_user_templates(therapist_id)
    return [NoteTemplateResponse(**t) for t in templates]


@router.post("/", response_model=NoteTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: NoteTemplateCreate,
    therapist_id: str = Depends(get_current_user_id),
) -> NoteTemplateResponse:
    try:
        template = await note_template_crud.create(template_in, therapist_id)
        return NoteTemplateResponse(**template)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create template: {e}")


@router.put("/{template_id}", response_model=NoteTemplateResponse)
async def update_template(
    template_id: str,
    template_in: NoteTemplateUpdate,
    therapist_id: str = Depends(get_current_user_id),
) -> NoteTemplateResponse:
    existing = await note_template_crud.get(template_id)
    if not existing or existing.get("therapist_id") != therapist_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    updated = await note_template_crud.update(template_id, template_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update template")
    return NoteTemplateResponse(**updated)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    therapist_id: str = Depends(get_current_user_id),
):
    existing = await note_template_crud.get(template_id)
    if not existing or existing.get("therapist_id") != therapist_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    await note_template_crud.delete(template_id)
    return None
