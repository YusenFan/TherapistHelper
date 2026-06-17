"""
Note Template CRUD operations for Appwrite (new minimal schema).

A template stores a reusable section list (and optional base format). The
`sections` list is JSON-serialized to/from a string for Appwrite.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import NoteTemplateCreate, NoteTemplateUpdate
from appwrite.query import Query


def _to_appwrite(data: Dict[str, Any]) -> Dict[str, Any]:
    result = {}
    for k, v in data.items():
        if k == "sections" and isinstance(v, list):
            v = json.dumps(v)
        result[k] = v
    return result


class NoteTemplateCRUD:
    async def get_user_templates(self, therapist_id: str) -> List[Dict[str, Any]]:
        try:
            result = db.list_rows(
                settings.COLLECTION_NOTE_TEMPLATES,
                [Query.equal("therapist_id", therapist_id)],
            )
            return result.get("documents", [])
        except Exception:
            return []

    async def get(self, template_id: str) -> Optional[Dict[str, Any]]:
        try:
            return db.get_row(settings.COLLECTION_NOTE_TEMPLATES, template_id)
        except Exception:
            return None

    async def create(self, obj_in: NoteTemplateCreate, therapist_id: str) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        data = obj_in.model_dump(exclude_unset=False)
        data["therapist_id"] = therapist_id
        data["created_at"] = now
        data["updated_at"] = now
        return db.create_row(settings.COLLECTION_NOTE_TEMPLATES, _to_appwrite(data))

    async def update(self, template_id: str, obj_in: NoteTemplateUpdate) -> Optional[Dict[str, Any]]:
        try:
            data = obj_in.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.utcnow().isoformat()
            return db.update_row(settings.COLLECTION_NOTE_TEMPLATES, template_id, _to_appwrite(data))
        except Exception as e:
            print(f"Error updating template: {e}")
            return None

    async def delete(self, template_id: str) -> bool:
        try:
            db.delete_row(settings.COLLECTION_NOTE_TEMPLATES, template_id)
            return True
        except Exception:
            return False


note_template_crud = NoteTemplateCRUD()
