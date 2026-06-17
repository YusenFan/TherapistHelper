"""
Session CRUD operations for Appwrite (new minimal schema).

The note lives inside the session: `note_format` + `note_content` (a JSON
object of section -> text). `summary` and `note_content` are encrypted at rest
by Appwrite. note_content is JSON-serialized to/from a string here.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import SessionCreate, SessionUpdate
from appwrite.query import Query


def _to_appwrite(data: Dict[str, Any]) -> Dict[str, Any]:
    result = {}
    for k, v in data.items():
        if hasattr(v, "value"):
            v = v.value
        if k == "note_content" and isinstance(v, (dict, list)):
            v = json.dumps(v)
        if isinstance(v, datetime):
            v = v.isoformat()
        result[k] = v
    return result


class SessionCRUD:
    async def create(self, obj_in: SessionCreate, therapist_id: str) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        data = obj_in.model_dump(exclude_unset=False)
        data["therapist_id"] = therapist_id
        data["created_at"] = now
        data["updated_at"] = now
        return db.create_row(settings.COLLECTION_SESSIONS, _to_appwrite(data))

    async def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        try:
            return db.get_row(settings.COLLECTION_SESSIONS, session_id)
        except Exception:
            return None

    async def get_by_therapist(
        self, therapist_id: str, skip: int = 0, limit: int = 200
    ) -> List[Dict[str, Any]]:
        try:
            result = db.list_rows(
                settings.COLLECTION_SESSIONS,
                [Query.equal("therapist_id", therapist_id)],
            )
            sessions = result.get("documents", [])
            sessions.sort(key=lambda s: s.get("session_date", ""), reverse=True)
            return sessions[skip:skip + limit]
        except Exception as e:
            print(f"Error listing sessions: {e}")
            return []

    async def get_client_sessions(self, client_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        try:
            result = db.list_rows(
                settings.COLLECTION_SESSIONS,
                [Query.equal("client_id", client_id)],
            )
            sessions = result.get("documents", [])
            sessions.sort(key=lambda s: s.get("session_date", ""), reverse=True)
            return sessions[:limit] if limit else sessions
        except Exception:
            return []

    async def update(self, session_id: str, obj_in: SessionUpdate) -> Optional[Dict[str, Any]]:
        try:
            data = obj_in.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.utcnow().isoformat()
            return db.update_row(settings.COLLECTION_SESSIONS, session_id, _to_appwrite(data))
        except Exception as e:
            print(f"Error updating session: {e}")
            return None

    async def delete(self, session_id: str) -> bool:
        try:
            db.delete_row(settings.COLLECTION_SESSIONS, session_id)
            return True
        except Exception:
            return False


session_crud = SessionCRUD()
