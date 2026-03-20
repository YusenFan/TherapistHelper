"""
Session CRUD operations for Appwrite

Encrypted fields (transcript, summary, next_focus, followup_actions_json)
are stored with '_encrypted' suffix. Appwrite handles encryption at rest.
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import SessionCreate, SessionUpdate
from datetime import datetime
import json


_ENCRYPTED_FIELD_MAP = {
    "next_focus": "next_focus_encrypted",
    "followup_actions": "followup_actions_json_encrypted",
    "transcript": "transcript_encrypted",
    "summary": "summary_encrypted",
}

_ENCRYPTED_FIELD_MAP_REV = {v: k for k, v in _ENCRYPTED_FIELD_MAP.items()}


def _to_appwrite(data: Dict[str, Any]) -> Dict[str, Any]:
    """Map model fields to Appwrite column names and serialize complex types."""
    result = {}
    for k, v in data.items():
        appwrite_key = _ENCRYPTED_FIELD_MAP.get(k, k)

        # Serialize followup_actions list to JSON string
        if k == "followup_actions" and v is not None:
            if isinstance(v, list):
                serialized = []
                for item in v:
                    if hasattr(item, "model_dump"):
                        serialized.append(item.model_dump())
                    elif isinstance(item, dict):
                        serialized.append(item)
                v = json.dumps(serialized)
            elif isinstance(v, dict):
                v = json.dumps(v)

        # Convert enums
        if hasattr(v, "value"):
            v = v.value

        # Convert datetime
        if isinstance(v, datetime):
            v = v.isoformat()

        result[appwrite_key] = v
    return result


def _from_appwrite(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Map Appwrite fields back to model names and deserialize JSON."""
    for enc_key, plain_key in _ENCRYPTED_FIELD_MAP_REV.items():
        if enc_key in doc:
            val = doc[enc_key]
            # Deserialize followup_actions JSON
            if plain_key == "followup_actions" and isinstance(val, str) and val:
                try:
                    val = json.loads(val)
                except Exception:
                    pass
            doc[plain_key] = val
    return doc


class SessionCRUD:
    """Session CRUD operations using Appwrite"""

    async def create(self, obj_in: SessionCreate, therapist_id: str) -> Dict[str, Any]:
        """Create a new session"""
        now = datetime.utcnow().isoformat()

        data = obj_in.model_dump(exclude_unset=False)
        data["therapist_id"] = therapist_id
        data["created_at"] = now
        data["updated_at"] = now

        document_data = _to_appwrite(data)
        result = db.create_session(document_data)
        return _from_appwrite(result)

    async def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        try:
            result = db.get_session(session_id)
            return _from_appwrite(result)
        except Exception:
            return None

    async def get_client_sessions(
        self,
        client_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get all sessions for a client"""
        try:
            result = db.get_client_sessions(client_id)
            sessions = result.get("documents", [])
            for s in sessions:
                _from_appwrite(s)
            return sessions[:limit] if limit else sessions
        except Exception:
            return []

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        client_id: Optional[str] = None,
        therapist_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get multiple sessions with optional filtering"""
        if client_id:
            return await self.get_client_sessions(client_id, limit)
        try:
            queries = []
            result = db.list_documents(
                collection_id=settings.COLLECTION_SESSIONS,
                queries=queries
            )
            sessions = result.get("documents", [])
            for s in sessions:
                _from_appwrite(s)
            return sessions[skip:skip + limit]
        except Exception:
            return []

    async def update(self, session_id: str, obj_in: SessionUpdate) -> Optional[Dict[str, Any]]:
        """Update session with new data"""
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            update_data["updated_at"] = datetime.utcnow().isoformat()

            document_data = _to_appwrite(update_data)
            result = db.update_document(
                collection_id=settings.COLLECTION_SESSIONS,
                document_id=session_id,
                document_data=document_data
            )
            return _from_appwrite(result)
        except Exception as e:
            print(f"Error updating session: {e}")
            return None

    async def delete(self, session_id: str) -> bool:
        """Delete session by ID"""
        try:
            db.delete_document(
                collection_id=settings.COLLECTION_SESSIONS,
                document_id=session_id
            )
            return True
        except Exception:
            return False


# Global CRUD instance
session_crud = SessionCRUD()
