"""
Persona CRUD operations for Appwrite
Persona is stored as a special note with note_type="persona" — one per client.
"""
from typing import Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from datetime import datetime


class PersonaCRUD:
    """CRUD operations for client persona notes (sync db — no await)."""

    def get_persona(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get the persona note for a client. Returns None if not found."""
        try:
            result = db.list_documents(
                collection_id=settings.COLLECTION_NOTES,
                queries=[f'equal("client_id", ["{client_id}"])']
            )
            docs = result.get("documents", [])
            # Filter by note_type in Python for safety (multi-query Appwrite support varies)
            for doc in docs:
                if doc.get("note_type") == "persona":
                    return doc
            return None
        except Exception as e:
            print(f"[PersonaCRUD] get_persona error for {client_id}: {e}")
            return None

    def save_persona(self, client_id: str, text: str) -> Optional[Dict[str, Any]]:
        """Upsert persona note: update if exists, create if not."""
        try:
            existing = self.get_persona(client_id)
            now = datetime.utcnow().isoformat()

            if existing:
                doc_id = existing.get("id") or existing.get("$id")
                result = db.update_document(
                    collection_id=settings.COLLECTION_NOTES,
                    document_id=doc_id,
                    document_data={"content": text, "updated_at": now}
                )
                return result
            else:
                note_data = {
                    "client_id": client_id,
                    "note_type": "persona",
                    "content": text,
                    "created_at": now,
                    "updated_at": now
                }
                result = db.create_note(note_data)
                return result
        except Exception as e:
            print(f"[PersonaCRUD] save_persona error for {client_id}: {e}")
            return None


persona_crud = PersonaCRUD()
