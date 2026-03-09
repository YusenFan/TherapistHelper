"""
Appwrite Database Client
Handles all Appwrite database operations
"""
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException
from app.core.config import settings
from typing import Dict, List, Optional, Any
import json
import uuid


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

    async def create_document(
        self,
        collection_id: str,
        document_data: Dict[str, Any],
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new document in a collection"""
        try:
            # Generate document ID if not provided
            if not document_id:
                document_id = str(uuid.uuid4())

            result = self.databases.create_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=collection_id,
                document_id=document_id,
                data=document_data
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite create document error: {e.message}")

    async def get_document(
        self,
        collection_id: str,
        document_id: str
    ) -> Dict[str, Any]:
        """Get a document by ID"""
        try:
            result = self.databases.get_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=collection_id,
                document_id=document_id
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite get document error: {e.message}")

    async def list_documents(
        self,
        collection_id: str,
        queries: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """List all documents in a collection"""
        try:
            result = self.databases.list_documents(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=collection_id,
                queries=queries or []
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite list documents error: {e.message}")

    async def update_document(
        self,
        collection_id: str,
        document_id: str,
        document_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a document"""
        try:
            result = self.databases.update_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=collection_id,
                document_id=document_id,
                data=document_data
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite update document error: {e.message}")

    async def delete_document(
        self,
        collection_id: str,
        document_id: str
    ) -> Dict[str, Any]:
        """Delete a document"""
        try:
            result = self.databases.delete_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=collection_id,
                document_id=document_id
            )
            return result
        except AppwriteException as e:
            raise Exception(f"Appwrite delete document error: {e.message}")

    # Client-specific operations

    async def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new client"""
        return await self.create_document(
            collection_id=settings.COLLECTION_CLIENTS,
            document_data=client_data
        )

    async def get_client(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get a client by ID"""
        try:
            result = await self.get_document(
                collection_id=settings.COLLECTION_CLIENTS,
                document_id=client_id
            )
            return result
        except Exception:
            return None

    async def list_clients(self, queries: Optional[List[str]] = None) -> Dict[str, Any]:
        """List all clients"""
        return await self.list_documents(
            collection_id=settings.COLLECTION_CLIENTS,
            queries=queries
        )

    async def update_client(self, client_id: str, client_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a client"""
        try:
            result = await self.update_document(
                collection_id=settings.COLLECTION_CLIENTS,
                document_id=client_id,
                document_data=client_data
            )
            return result
        except Exception:
            return None

    async def delete_client(self, client_id: str) -> bool:
        """Delete a client by ID"""
        try:
            await self.delete_document(
                collection_id=settings.COLLECTION_CLIENTS,
                document_id=client_id
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
        """Search clients by name, email, or tags"""
        try:
            # Note: This is inefficient - in production, use proper search or indexing
            queries = [f'search("{query}")']
            return await self.list_documents(
                collection_id=settings.COLLECTION_CLIENTS,
                queries=queries
            )
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
            if tag not in tags:
                tags.append(tag)
                return await self.update_client(client_id, {"tags": tags})
            return existing
        except Exception:
            return None

    async def remove_tag(self, client_id: str, tag: str) -> Optional[Dict[str, Any]]:
        """Remove a tag from a client"""
        try:
            existing = await self.get_client(client_id)
            if not existing:
                return None

            tags = existing.get("tags", [])
            if tag in tags:
                tags.remove(tag)
                return await self.update_client(client_id, {"tags": tags})
            return existing
        except Exception:
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
