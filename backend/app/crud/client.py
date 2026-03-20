"""
Client CRUD operations for Appwrite

Encryption: Sensitive fields are stored with '_encrypted' suffix in Appwrite.
Appwrite handles encryption at rest natively. This CRUD layer maps plaintext
model fields to/from Appwrite's _encrypted field names transparently.
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import ClientCreate, ClientUpdate
from appwrite.query import Query
from datetime import datetime


# Maps plaintext model field -> Appwrite encrypted field name
_ENCRYPTED_FIELD_MAP = {
    "full_name": "full_name_encrypted",
    "preferred_name": "preferred_name_encrypted",
    "date_of_birth": "date_of_birth_encrypted",
    "email": "email_encrypted",
    "phone": "phone_encrypted",
    "background_summary": "background_summary_encrypted",
}

# Reverse map for reading
_ENCRYPTED_FIELD_MAP_REV = {v: k for k, v in _ENCRYPTED_FIELD_MAP.items()}


def _to_appwrite(data: Dict[str, Any]) -> Dict[str, Any]:
    """Rename plaintext fields to their _encrypted Appwrite column names."""
    result = {}
    for k, v in data.items():
        appwrite_key = _ENCRYPTED_FIELD_MAP.get(k, k)
        result[appwrite_key] = v
    return result


def _from_appwrite(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Rename _encrypted Appwrite fields back to plaintext model names."""
    for enc_key, plain_key in _ENCRYPTED_FIELD_MAP_REV.items():
        if enc_key in doc:
            doc[plain_key] = doc[enc_key]
    return doc


class ClientCRUD:
    """Client CRUD operations using Appwrite"""

    async def create(self, obj_in: ClientCreate, therapist_id: str) -> Dict[str, Any]:
        """Create a new client"""
        now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000+00:00')

        data = obj_in.model_dump(exclude_unset=False)
        data["therapist_id"] = therapist_id
        data["created_at"] = now
        data["updated_at"] = now

        # Convert enum to string
        if "status" in data and hasattr(data["status"], "value"):
            data["status"] = data["status"].value

        # Map to Appwrite field names
        document_data = _to_appwrite(data)

        result = db.create_client(document_data)
        return _from_appwrite(result)

    async def get(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get client by ID"""
        try:
            result = db.get_client(client_id)
            return _from_appwrite(result)
        except Exception:
            return None

    async def get_multi(
        self,
        *,
        therapist_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get multiple clients with optional filtering"""
        try:
            queries = [Query.equal("therapist_id", therapist_id)]
            if status:
                queries.append(Query.equal("status", status))

            result = db.list_clients(queries)
            clients = result.get("documents", [])

            for client in clients:
                _from_appwrite(client)

            if skip > 0 or limit < len(clients):
                clients = clients[skip:skip + limit]

            return clients
        except Exception as e:
            print(f"Error getting clients: {e}")
            return []

    async def update(self, client_id: str, obj_in: ClientUpdate) -> Optional[Dict[str, Any]]:
        """Update client with new data"""
        try:
            update_data = obj_in.model_dump(exclude_unset=True)

            # Convert enum to string
            if "status" in update_data and hasattr(update_data["status"], "value"):
                update_data["status"] = update_data["status"].value

            # Convert archived_at datetime
            if "archived_at" in update_data and update_data["archived_at"]:
                update_data["archived_at"] = update_data["archived_at"].isoformat()

            update_data["updated_at"] = datetime.utcnow().isoformat()

            # Map to Appwrite field names
            document_data = _to_appwrite(update_data)

            result = db.update_client(client_id, document_data)
            return _from_appwrite(result)
        except Exception as e:
            print(f"Error updating client: {e}")
            return None

    async def delete(self, client_id: str) -> bool:
        """Delete client by ID"""
        try:
            db.delete_client(client_id)
            return True
        except Exception:
            return False

    async def count(self, therapist_id: str) -> int:
        """Get total count of clients for a therapist"""
        try:
            result = db.list_clients([Query.equal("therapist_id", therapist_id)])
            return result.get("total", 0)
        except Exception:
            return 0

    async def get_active_clients(self, therapist_id: str) -> List[Dict[str, Any]]:
        """Get all active clients for a therapist"""
        return await self.get_multi(therapist_id=therapist_id, status="active")


# Global CRUD instance
client_crud = ClientCRUD()
