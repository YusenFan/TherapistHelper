"""
Session CRUD operations for Appwrite
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import SessionCreate, SessionUpdate
from datetime import datetime
import uuid


class SessionCRUD:
    """Session CRUD operations using Appwrite"""

    async def create(self, obj_in: SessionCreate) -> Dict[str, Any]:
        """Create a new session"""
        document_id = str(uuid.uuid4())

        document_data = {
            "client_id": obj_in.client_id,
            "session_date": obj_in.session_date.isoformat() if hasattr(obj_in.session_date, 'isoformat') else str(obj_in.session_date),
            "duration_minutes": obj_in.duration_minutes,
            "session_type": obj_in.session_type,
            "notes": obj_in.notes or "",
            "tags": obj_in.tags or [],
            "transcript": "",
            "summary": "",
            "analysis": obj_in.analysis or {},
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = db.create_session(document_data)
        return result

    async def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        try:
            return db.get_session(session_id)
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
            return sessions[:limit] if limit else sessions
        except Exception:
            return []

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        client_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get multiple sessions with optional filtering"""
        if client_id:
            return await self.get_client_sessions(client_id, limit)
        else:
            # Get all sessions (less common, but possible)
            try:
                queries = []
                result = db.list_documents(
                    collection_id=settings.COLLECTION_SESSIONS,
                    queries=queries
                )
                sessions = result.get("documents", [])
                return sessions[skip:skip + limit]
            except Exception:
                return []

    async def update(
        self,
        session_id: str,
        obj_in: SessionUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update session with new data"""
        try:
            existing = db.get_session(session_id)

            # Prepare update data
            update_data = obj_in.model_dump(exclude_unset=True)

            # Update timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()

            # Update in Appwrite
            result = db.update_document(
                collection_id=settings.COLLECTION_SESSIONS,
                document_id=session_id,
                document_data=update_data
            )

            return result
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

    async def add_transcript(
        self,
        session_id: str,
        transcript: str,
        language: str,
        duration: float
    ) -> Optional[Dict[str, Any]]:
        """Add transcript to a session"""
        return await self.update(
            session_id,
            SessionUpdate(
                transcript=transcript,
                analysis={"language": language, "duration": duration}
            )
        )

    async def update_analysis(
        self,
        session_id: str,
        summary: str,
        analysis: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update session with AI analysis"""
        return await self.update(
            session_id,
            SessionUpdate(summary=summary, analysis=analysis)
        )


# Global CRUD instance
session_crud = SessionCRUD()
