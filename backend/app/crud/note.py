"""
Note CRUD operations for Appwrite
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import NoteCreate, NoteUpdate
from appwrite.query import Query
from datetime import datetime
import uuid


class NoteCRUD:
    """Note CRUD operations using Appwrite"""

    async def create(self, obj_in: NoteCreate) -> Dict[str, Any]:
        """Create a new note"""
        document_id = str(uuid.uuid4())

        document_data = {
            "client_id": obj_in.client_id,
            "note_type": obj_in.note_type,
            "content": obj_in.content,
            "tags": obj_in.tags or [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = db.create_note(document_data)
        return result

    async def get(self, note_id: str) -> Optional[Dict[str, Any]]:
        """Get note by ID"""
        try:
            return db.get_document(
                collection_id=settings.COLLECTION_NOTES,
                document_id=note_id
            )
        except Exception:
            return None

    async def get_client_notes(
        self,
        client_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get all notes for a client"""
        try:
            result = db.get_client_notes(client_id)
            notes = result.get("documents", [])
            return notes[:limit] if limit else notes
        except Exception:
            return []

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        client_id: Optional[str] = None,
        note_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get multiple notes with optional filtering"""
        try:
            queries = []
            if client_id:
                queries.append(Query.equal("client_id", client_id))
            if note_type:
                queries.append(Query.equal("note_type", note_type))

            result = db.list_documents(
                collection_id=settings.COLLECTION_NOTES,
                queries=queries if queries else None
            )
            notes = result.get("documents", [])

            # Apply pagination
            if skip > 0 or limit < len(notes):
                notes = notes[skip:skip + limit]

            return notes
        except Exception as e:
            print(f"Error getting notes: {e}")
            return []

    async def update(
        self,
        note_id: str,
        obj_in: NoteUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update note with new data"""
        try:
            existing = await self.get(note_id)

            # Prepare update data
            update_data = obj_in.model_dump(exclude_unset=True)

            # Update timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()

            # Update in Appwrite
            result = db.update_document(
                collection_id=settings.COLLECTION_NOTES,
                document_id=note_id,
                document_data=update_data
            )

            return result
        except Exception as e:
            print(f"Error updating note: {e}")
            return None

    async def delete(self, note_id: str) -> bool:
        """Delete note by ID"""
        try:
            db.delete_document(
                collection_id=settings.COLLECTION_NOTES,
                document_id=note_id
            )
            return True
        except Exception:
            return False

    async def search_notes(
        self,
        client_id: str,
        query: str
    ) -> List[Dict[str, Any]]:
        """Search notes for a client"""
        try:
            queries = [
                Query.equal("client_id", client_id),
                Query.search("content", query),
            ]
            result = db.list_documents(
                collection_id=settings.COLLECTION_NOTES,
                queries=queries
            )
            return result.get("documents", [])
        except Exception:
            return []


# Global CRUD instance
note_crud = NoteCRUD()
