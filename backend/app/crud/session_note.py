"""
Session Note CRUD operations for Appwrite

One note per session. All note content fields are stored with '_encrypted' suffix.
Appwrite handles encryption at rest natively.
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import SessionNoteCreate, SessionNoteUpdate, NoteFormat
from appwrite.query import Query
from datetime import datetime


_ENCRYPTED_FIELDS = [
    "free_content",
    "birp_behavior",
    "birp_intervention",
    "birp_response",
    "birp_plan",
    "dap_data",
    "dap_assessment",
    "dap_plan",
    "soap_subjective",
    "soap_objective",
    "soap_assessment",
    "soap_plan",
]

# Which fields belong to which format
_FORMAT_FIELDS = {
    "free": ["free_content"],
    "birp": ["birp_behavior", "birp_intervention", "birp_response", "birp_plan"],
    "dap": ["dap_data", "dap_assessment", "dap_plan"],
    "soap": ["soap_subjective", "soap_objective", "soap_assessment", "soap_plan"],
}


def _to_appwrite(data: Dict[str, Any]) -> Dict[str, Any]:
    """Map model fields to Appwrite column names."""
    result = {}
    for k, v in data.items():
        if k in _ENCRYPTED_FIELDS:
            result[f"{k}_encrypted"] = v
        else:
            if hasattr(v, "value"):
                v = v.value
            if isinstance(v, datetime):
                v = v.isoformat()
            result[k] = v
    return result


def _from_appwrite(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Map Appwrite fields back to model names."""
    for field in _ENCRYPTED_FIELDS:
        enc_key = f"{field}_encrypted"
        if enc_key in doc:
            doc[field] = doc[enc_key]
    return doc


def _clear_incompatible_fields(data: Dict[str, Any], note_format: str) -> Dict[str, Any]:
    """Clear fields that don't belong to the selected note format.
    Prevents stale data leakage when switching formats.
    """
    active_fields = _FORMAT_FIELDS.get(note_format, [])
    for fmt_fields in _FORMAT_FIELDS.values():
        for field in fmt_fields:
            if field not in active_fields and field not in data:
                # Explicitly set incompatible fields to None
                data[field] = None
    return data


class SessionNoteCRUD:
    """Session Note CRUD operations"""

    async def create(self, obj_in: SessionNoteCreate, therapist_id: str) -> Dict[str, Any]:
        """Create a session note (one per session)"""
        now = datetime.utcnow().isoformat()

        data = obj_in.model_dump(exclude_unset=False)
        data["therapist_id"] = therapist_id
        data["created_at"] = now
        data["updated_at"] = now

        # Clear fields incompatible with selected format
        data = _clear_incompatible_fields(data, obj_in.note_format.value)

        document_data = _to_appwrite(data)
        result = db.create_row(
            table_id=settings.COLLECTION_SESSION_NOTES,
            column_data=document_data
        )
        return _from_appwrite(result)

    async def get(self, note_id: str) -> Optional[Dict[str, Any]]:
        """Get note by ID"""
        try:
            result = db.get_row(
                table_id=settings.COLLECTION_SESSION_NOTES,
                row_id=note_id
            )
            return _from_appwrite(result) if result else None
        except Exception:
            return None

    async def get_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the note for a session (one note per session)"""
        try:
            result = db.list_documents(
                collection_id=settings.COLLECTION_SESSION_NOTES,
                queries=[Query.equal("session_id", session_id)]
            )
            docs = result.get("documents", [])
            if docs:
                return _from_appwrite(docs[0])
            return None
        except Exception:
            return None

    async def get_client_notes(self, client_id: str) -> List[Dict[str, Any]]:
        """Get all notes for a client"""
        try:
            result = db.list_documents(
                collection_id=settings.COLLECTION_SESSION_NOTES,
                queries=[Query.equal("client_id", client_id)]
            )
            notes = result.get("documents", [])
            for n in notes:
                _from_appwrite(n)
            return notes
        except Exception:
            return []

    async def update(self, note_id: str, obj_in: SessionNoteUpdate) -> Optional[Dict[str, Any]]:
        """Update a session note.
        If note_format changes, incompatible fields are cleared.
        """
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            update_data["updated_at"] = datetime.utcnow().isoformat()

            # If format is changing, clear incompatible fields
            if "note_format" in update_data:
                fmt = update_data["note_format"]
                if hasattr(fmt, "value"):
                    fmt = fmt.value
                update_data = _clear_incompatible_fields(update_data, fmt)

            document_data = _to_appwrite(update_data)
            result = db.update_row(
                table_id=settings.COLLECTION_SESSION_NOTES,
                row_id=note_id,
                column_data=document_data
            )
            return _from_appwrite(result)
        except Exception as e:
            print(f"Error updating session note: {e}")
            return None

    async def delete(self, note_id: str) -> bool:
        """Delete a session note"""
        try:
            db.delete_row(
                table_id=settings.COLLECTION_SESSION_NOTES,
                row_id=note_id
            )
            return True
        except Exception:
            return False


# Global CRUD instance
session_note_crud = SessionNoteCRUD()
