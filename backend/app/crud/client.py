"""
Client CRUD operations for Appwrite (new minimal schema).

Column names match model field names. Appwrite handles at-rest encryption on
the configured attributes (name, date_of_birth, primary_diagnosis,
other_diagnoses, extra_info). The only transform is JSON (de)serialization of
the `other_diagnoses` list, since Appwrite stores it as a string.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import ClientCreate, ClientUpdate
from appwrite.query import Query


def _to_appwrite(data: Dict[str, Any]) -> Dict[str, Any]:
    result = {}
    for k, v in data.items():
        if hasattr(v, "value"):  # enum -> str
            v = v.value
        if k == "other_diagnoses" and isinstance(v, list):
            v = json.dumps(v)
        if isinstance(v, datetime):
            v = v.isoformat()
        result[k] = v
    return result


class ClientCRUD:
    async def create(self, obj_in: ClientCreate, therapist_id: str) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        data = obj_in.model_dump(exclude_unset=False)
        data["therapist_id"] = therapist_id
        data["created_at"] = now
        data["updated_at"] = now
        return db.create_row(settings.COLLECTION_CLIENTS, _to_appwrite(data))

    async def get(self, client_id: str) -> Optional[Dict[str, Any]]:
        try:
            return db.get_row(settings.COLLECTION_CLIENTS, client_id)
        except Exception:
            return None

    async def get_multi(
        self, *, therapist_id: str, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        try:
            result = db.list_rows(
                settings.COLLECTION_CLIENTS,
                [Query.equal("therapist_id", therapist_id)],
            )
            clients = result.get("documents", [])
            return clients[skip:skip + limit]
        except Exception as e:
            print(f"Error getting clients: {e}")
            return []

    async def update(self, client_id: str, obj_in: ClientUpdate) -> Optional[Dict[str, Any]]:
        try:
            data = obj_in.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.utcnow().isoformat()
            return db.update_row(settings.COLLECTION_CLIENTS, client_id, _to_appwrite(data))
        except Exception as e:
            print(f"Error updating client: {e}")
            return None

    async def delete(self, client_id: str) -> bool:
        try:
            db.delete_row(settings.COLLECTION_CLIENTS, client_id)
            return True
        except Exception:
            return False

    async def count(self, therapist_id: str) -> int:
        try:
            result = db.list_rows(
                settings.COLLECTION_CLIENTS,
                [Query.equal("therapist_id", therapist_id)],
            )
            return result.get("total", 0)
        except Exception:
            return 0


client_crud = ClientCRUD()
