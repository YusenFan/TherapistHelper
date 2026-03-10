"""
Client CRUD operations for Appwrite
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import encryption_manager, settings
from app.models.models import ClientCreate, ClientUpdate
from datetime import datetime
import uuid


class ClientCRUD:
    """Client CRUD operations using Appwrite"""

    async def create(self, obj_in: ClientCreate) -> Dict[str, Any]:
        """Create a new client with encrypted sensitive data"""
        # Generate document ID
        document_id = str(uuid.uuid4())

        # Prepare document data
        document_data = {
            "full_name_encrypted": encryption_manager.encrypt(obj_in.full_name),
            "background_encrypted": encryption_manager.encrypt(obj_in.background) if obj_in.background else "",
            "age": obj_in.age,
            "gender": obj_in.gender,
            "custom_gender": obj_in.custom_gender or "",
            "race": obj_in.race or "",
            "occupation": obj_in.occupation or "",
            "date_of_birth": obj_in.date_of_birth or "",
            "notes": obj_in.notes or "",
            "phone": obj_in.phone or "",
            "email": obj_in.email or "",
            "status": obj_in.status,
            "tags": obj_in.tags or [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        # Log for debugging
        print(f"[DEBUG] Creating client with data keys: {list(document_data.keys())}")
        print(f"[DEBUG] Document ID: {document_id}")

        # Create in Appwrite
        result = await db.create_client(document_data)
        print(f"[DEBUG] Create result keys: {list(result.keys()) if isinstance(result, dict) else type(result)}")
        return result

    async def get(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get client by ID"""
        try:
            result = await db.get_client(client_id)
            # Decrypt sensitive fields
            if "full_name_encrypted" in result:
                result["full_name"] = encryption_manager.decrypt(result["full_name_encrypted"])
            if "background_encrypted" in result and result["background_encrypted"]:
                result["background"] = encryption_manager.decrypt(result["background_encrypted"])
            return result
        except Exception:
            return None

    async def get_by_name(self, name: str) -> List[Dict[str, Any]]:
        """Get clients by name (requires decryption)"""
        # Note: This is inefficient - in production, use proper search or indexing
        all_clients = await self.get_multi()
        matching_clients = []
        for client in all_clients:
            if client.get("full_name", "").lower() == name.lower():
                matching_clients.append(client)
        return matching_clients

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get multiple clients with optional filtering"""
        try:
            queries = []
            if status:
                queries.append(f'equal("status", "{status}")')
            if tags:
                for tag in tags:
                    queries.append(f'search("tags", "{tag}")')

            result = await db.list_clients(queries if queries else None)
            clients = result.get("documents", [])

            # Decrypt sensitive fields for each client
            for client in clients:
                if "full_name_encrypted" in client:
                    client["full_name"] = encryption_manager.decrypt(client["full_name_encrypted"])
                if "background_encrypted" in client and client["background_encrypted"]:
                    client["background"] = encryption_manager.decrypt(client["background_encrypted"])

            # Apply pagination
            if skip > 0 or limit < len(clients):
                clients = clients[skip:skip + limit]

            return clients
        except Exception as e:
            print(f"Error getting clients: {e}")
            return []

    async def update(
        self,
        client_id: str,
        obj_in: ClientUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update client with new data"""
        try:
            # Get existing client
            existing = await db.get_client(client_id)

            # Prepare update data
            update_data = obj_in.model_dump(exclude_unset=True)

            # Handle encrypted fields
            if "full_name" in update_data:
                update_data["full_name_encrypted"] = encryption_manager.encrypt(update_data.pop("full_name"))
            if "background" in update_data:
                update_data["background_encrypted"] = encryption_manager.encrypt(update_data.pop("background"))

            # Update timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()

            # Update in Appwrite
            result = await db.update_client(client_id, update_data)

            # Decrypt for response
            if "full_name_encrypted" in result:
                result["full_name"] = encryption_manager.decrypt(result["full_name_encrypted"])
            if "background_encrypted" in result and result["background_encrypted"]:
                result["background"] = encryption_manager.decrypt(result["background_encrypted"])

            return result
        except Exception as e:
            print(f"Error updating client: {e}")
            return None

    async def delete(self, client_id: str) -> bool:
        """Delete client by ID"""
        try:
            await db.delete_client(client_id)
            return True
        except Exception:
            return False

    async def count(self) -> int:
        """Get total count of clients"""
        try:
            result = await db.list_clients()
            return result.get("total", 0)
        except Exception:
            return 0

    async def get_active_clients(self) -> List[Dict[str, Any]]:
        """Get all active clients"""
        return await self.get_multi(status="active")

    async def search_clients(self, query: str) -> List[Dict[str, Any]]:
        """Search clients by name, email, or tags"""
        try:
            queries = [f'search("{query}")']
            result = await db.list_clients(queries)
            clients = result.get("documents", [])

            # Decrypt sensitive fields
            for client in clients:
                if "full_name_encrypted" in client:
                    client["full_name"] = encryption_manager.decrypt(client["full_name_encrypted"])
                if "background_encrypted" in client and client["background_encrypted"]:
                    client["background"] = encryption_manager.decrypt(client["background_encrypted"])

            return clients
        except Exception as e:
            print(f"Error searching clients: {e}")
            return []

    async def add_tag(self, client_id: str, tag: str) -> Optional[Dict[str, Any]]:
        """Add a tag to a client"""
        try:
            existing = await db.get_client(client_id)
            tags = existing.get("tags", [])
            if tag not in tags:
                tags.append(tag)
                return await self.update(client_id, ClientUpdate(tags=tags))
            return existing
        except Exception:
            return None

    async def remove_tag(self, client_id: str, tag: str) -> Optional[Dict[str, Any]]:
        """Remove a tag from a client"""
        try:
            existing = await db.get_client(client_id)
            tags = existing.get("tags", [])
            if tag in tags:
                tags.remove(tag)
                return await self.update(client_id, ClientUpdate(tags=tags))
            return existing
        except Exception:
            return None

    async def update_background(
        self,
        client_id: str,
        background: str
    ) -> Optional[Dict[str, Any]]:
        """Update client background (usually AI-generated)"""
        return await self.update(client_id, ClientUpdate(background=background))


# Global CRUD instance
client_crud = ClientCRUD()
