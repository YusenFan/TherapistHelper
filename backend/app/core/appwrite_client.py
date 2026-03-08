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
            if document_id:
                result = self.databases.create_document(
                    database_id=settings.APPWRITE_DATABASE_ID,
                    collection_id=collection_id,
                    document_id=document_id,
                    data=document_data
                )
            else:
                result = self.databases.create_document(
                    database_id=settings.APPWRITE_DATABASE_ID,
                    collection_id=collection_id,
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

    async def get_client(self, client_id: str) -> Dict[str, Any]:
        """Get a client by ID"""
        return await self.get_document(
            collection_id=settings.COLLECTION_CLIENTS,
            document_id=client_id
        )

    async def list_clients(self, queries: Optional[List[str]] = None) -> Dict[str, Any]:
        """List all clients"""
        return await self.list_documents(
            collection_id=settings.COLLECTION_CLIENTS,
            queries=queries
        )

    async def update_client(self, client_id: str, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a client"""
        return await self.update_document(
            collection_id=settings.COLLECTION_CLIENTS,
            document_id=client_id,
            document_data=client_data
        )

    async def delete_client(self, client_id: str) -> Dict[str, Any]:
        """Delete a client"""
        return await self.delete_document(
            collection_id=settings.COLLECTION_CLIENTS,
            document_id=client_id
        )

    # Session-specific operations

    async def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new session"""
        return await self.create_document(
            collection_id=settings.COLLECTION_SESSIONS,
            document_data=session_data
        )

    async def get_client_sessions(self, client_id: str) -> Dict[str, Any]:
        """Get all sessions for a client"""
        queries = [
            f'equal("client_id", "{client_id}")',
            'orderDesc("created_at")'
        ]
        return await self.list_documents(
            collection_id=settings.COLLECTION_SESSIONS,
            queries=queries
        )

    async def get_session(self, session_id: str) -> Dict[str, Any]:
        """Get a session by ID"""
        return await self.get_document(
            collection_id=settings.COLLECTION_SESSIONS,
            document_id=session_id
        )

    # Note-specific operations

    async def create_note(self, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new note"""
        return await self.create_document(
            collection_id=settings.COLLECTION_NOTES,
            document_data=note_data
        )

    async def get_client_notes(self, client_id: str) -> Dict[str, Any]:
        """Get all notes for a client"""
        queries = [
            f'equal("client_id", "{client_id}")',
            'orderDesc("created_at")'
        ]
        return await self.list_documents(
            collection_id=settings.COLLECTION_NOTES,
            queries=queries
        )


# Global Appwrite database instance
db = AppwriteDB()
