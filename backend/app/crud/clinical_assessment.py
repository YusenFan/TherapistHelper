"""
Clinical Assessment CRUD operations for Appwrite

All clinical content fields are stored with '_encrypted' suffix.
Appwrite handles encryption at rest natively.
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import ClinicalAssessmentCreate, ClinicalAssessmentUpdate
from appwrite.query import Query
from datetime import datetime


# Fields that map to _encrypted Appwrite columns
_ENCRYPTED_FIELDS = [
    "identification_summary",
    "presenting_problem",
    "psychiatric_history",
    "trauma_history",
    "family_psychiatric_history",
    "medical_history",
    "current_medications",
    "substance_use",
    "family_history",
    "social_history",
    "spiritual_cultural_factors",
    "developmental_history",
    "educational_vocational_history",
    "legal_history",
    "snap_strengths",
    "snap_needs",
    "snap_abilities",
    "snap_preferences",
    "diagnosis_impressions",
    "risk_summary",
    "treatment_goals",
]

# Special case: educational_vocational_history was shortened in Appwrite to fit 36-char key limit
_APPWRITE_KEY_OVERRIDES = {
    "educational_vocational_history": "edu_vocational_history_enc",
}


def _to_appwrite(data: Dict[str, Any]) -> Dict[str, Any]:
    """Map model fields to Appwrite column names."""
    result = {}
    for k, v in data.items():
        if k in _APPWRITE_KEY_OVERRIDES:
            result[_APPWRITE_KEY_OVERRIDES[k]] = v
        elif k in _ENCRYPTED_FIELDS:
            result[f"{k}_encrypted"] = v
        else:
            # Convert enums and datetimes
            if hasattr(v, "value"):
                v = v.value
            if isinstance(v, datetime):
                v = v.isoformat()
            result[k] = v
    return result


def _from_appwrite(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Map Appwrite fields back to model names."""
    for field in _ENCRYPTED_FIELDS:
        if field in _APPWRITE_KEY_OVERRIDES:
            enc_key = _APPWRITE_KEY_OVERRIDES[field]
        else:
            enc_key = f"{field}_encrypted"
        if enc_key in doc:
            doc[field] = doc[enc_key]
    return doc


class ClinicalAssessmentCRUD:
    """Clinical Assessment CRUD operations"""

    async def create(self, obj_in: ClinicalAssessmentCreate, therapist_id: str) -> Dict[str, Any]:
        """Create a new clinical assessment"""
        now = datetime.utcnow().isoformat()

        data = obj_in.model_dump(exclude_unset=False)
        data["therapist_id"] = therapist_id
        data["created_at"] = now
        data["updated_at"] = now

        document_data = _to_appwrite(data)
        result = db.create_row(
            table_id=settings.COLLECTION_CLINICAL_ASSESSMENTS,
            column_data=document_data
        )
        return _from_appwrite(result)

    async def get(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        """Get assessment by ID"""
        try:
            result = db.get_row(
                table_id=settings.COLLECTION_CLINICAL_ASSESSMENTS,
                row_id=assessment_id
            )
            return _from_appwrite(result) if result else None
        except Exception:
            return None

    async def get_client_assessments(
        self,
        client_id: str,
        assessment_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get all assessments for a client"""
        try:
            queries = [Query.equal("client_id", client_id)]
            if assessment_type:
                queries.append(Query.equal("assessment_type", assessment_type))

            result = db.list_documents(
                collection_id=settings.COLLECTION_CLINICAL_ASSESSMENTS,
                queries=queries
            )
            assessments = result.get("documents", [])
            for a in assessments:
                _from_appwrite(a)
            return assessments
        except Exception as e:
            print(f"Error getting assessments: {e}")
            return []

    async def get_current(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get the current assessment for a client"""
        assessments = await self.get_client_assessments(client_id)
        for a in assessments:
            if a.get("is_current"):
                return a
        return assessments[0] if assessments else None

    async def update(
        self,
        assessment_id: str,
        obj_in: ClinicalAssessmentUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update an assessment"""
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            update_data["updated_at"] = datetime.utcnow().isoformat()

            document_data = _to_appwrite(update_data)
            result = db.update_row(
                table_id=settings.COLLECTION_CLINICAL_ASSESSMENTS,
                row_id=assessment_id,
                column_data=document_data
            )
            return _from_appwrite(result)
        except Exception as e:
            print(f"Error updating assessment: {e}")
            return None

    async def delete(self, assessment_id: str) -> bool:
        """Delete an assessment"""
        try:
            db.delete_row(
                table_id=settings.COLLECTION_CLINICAL_ASSESSMENTS,
                row_id=assessment_id
            )
            return True
        except Exception:
            return False


# Global CRUD instance
clinical_assessment_crud = ClinicalAssessmentCRUD()
