"""
Appwrite Database Client
Handles all Appwrite database operations using Tables API (new)
"""
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException
from app.core.config import settings
from typing import Dict, List, Optional, Any
import json


class AppwriteDB:
    """Appwrite database client wrapper"""

    def __init__(self):
        self.client = Client()
        self._setup_client()
        self.databases = Databases(self.client)

    def _setup_client(self):
        """Configure Appwrite client"""
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)

    # Collection Operations

    async def create_row(
        self,
        table_id: str,
        column_data: Dict[str, Any],
        row_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new row in a table (using Appwrite Documents API)"""
        try:
            result = self.databases.create_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=table_id,
                document_id=row_id or "unique()",
                data=column_data
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite create document error: {e.message}")

    async def list_rows(
        self,
        table_id: str,
        queries: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """List all rows in a table (using Appwrite Documents API)"""
        try:
            result = self.databases.list_documents(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=table_id,
                queries=queries or []
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite list documents error: {e.message}")

    async def get_row(
        self,
        table_id: str,
        row_id: str
    ) -> Dict[str, Any]:
        """Get a row by ID (using Appwrite Documents API)"""
        try:
            result = self.databases.get_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=table_id,
                document_id=row_id
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite get document error: {e.message}")

    async def update_row(
        self,
        table_id: str,
        row_id: str,
        column_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a row (using Appwrite Documents API)"""
        try:
            result = self.databases.update_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=table_id,
                document_id=row_id,
                data=column_data
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite update document error: {e.message}")

    async def delete_row(
        self,
        table_id: str,
        row_id: str
    ) -> Dict[str, Any]:
        """Delete a row (using Appwrite Documents API)"""
        try:
            result = self.databases.delete_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=table_id,
                document_id=row_id
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite delete document error: {e.message}")

    # Client-specific operations

    async def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new client"""
        return await self.create_row(
            table_id=settings.COLLECTION_CLIENTS,
            column_data=client_data
        )

    async def get_client(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get a client by ID"""
        try:
            result = await self.get_row(
                table_id=settings.COLLECTION_CLIENTS,
                row_id=client_id
            )
            return result
        except Exception:
            return None

    async def list_clients(self, queries: Optional[List[str]] = None) -> Dict[str, Any]:
        """List all clients"""
        return await self.list_rows(
            table_id=settings.COLLECTION_CLIENTS,
            queries=queries
        )

    async def update_client(self, client_id: str, client_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a client"""
        try:
            result = await self.update_row(
                table_id=settings.COLLECTION_CLIENTS,
                row_id=client_id,
                column_data=client_data
            )
            return result
        except Exception as e:
            print(f"Error updating client: {e}")
            return None

    async def delete_client(self, client_id: str) -> bool:
        """Delete a client by ID"""
        try:
            await self.delete_row(
                table_id=settings.COLLECTION_CLIENTS,
                row_id=client_id
            )
            return True
        except Exception:
            return False

    async def count(self) -> int:
        """Get total count of clients"""
        try:
            result = await self.list_clients()
            return result.get("total", 0)
        except Exception:
            return 0

    async def get_active_clients(self) -> Dict[str, Any]:
        """Get all active clients"""
        return await self.list_clients(queries=['equal("status", "active")'])

    async def search_clients(self, query: str) -> Dict[str, Any]:
        """Search clients by name or tags"""
        try:
            queries = [f'search("{query}")']
            return await self.list_clients(queries=queries)
        except Exception as e:
            print(f"Error searching clients: {e}")
            return {"documents": [], "total": 0}

    async def add_tag(self, client_id: str, tag: str) -> Optional[Dict[str, Any]]:
        """Add a tag to a client"""
        try:
            existing = await self.get_client(client_id)
            if not existing:
                return None

            tags = existing.get("tags", [])
            if isinstance(tags, str):
                tags = json.loads(tags)
            elif not isinstance(tags, list):
                tags = []

            if tag not in tags:
                tags.append(tag)
                return await self.update_client(client_id, {"tags": json.dumps(tags)})
            return existing
        except Exception as e:
            print(f"Error adding tag: {e}")
            return None

    async def remove_tag(self, client_id: str, tag: str) -> Optional[Dict[str, Any]]:
        """Remove a tag from a client"""
        try:
            existing = await self.get_client(client_id)
            if not existing:
                return None

            tags = existing.get("tags", [])
            if isinstance(tags, str):
                tags = json.loads(tags)
            elif not isinstance(tags, list):
                tags = []

            if tag in tags:
                tags.remove(tag)
                return await self.update_client(client_id, {"tags": json.dumps(tags)})
            return existing
        except Exception as e:
            print(f"Error removing tag: {e}")
            return None

    async def update_background(
        self,
        client_id: str,
        background: str
    ) -> Optional[Dict[str, Any]]:
        """Update client background (usually AI-generated from transcripts)."""
        return await self.update_client(client_id, {"background": background})


# Global Appwrite database instance
db = AppwriteDB()
