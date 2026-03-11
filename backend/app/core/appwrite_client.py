"""
Appwrite Database Client - Simplified using REST API
Handles all Appwrite database operations for tablesdb type databases
"""
import requests
from app.core.config import settings
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid


class AppwriteDB:
    """Appwrite database client wrapper - simplified REST API calls"""

    def __init__(self):
        self.endpoint = settings.APPWRITE_ENDPOINT
        self.project_id = settings.APPWRITE_PROJECT_ID
        self.api_key = settings.APPWRITE_API_KEY
        self.database_id = settings.APPWRITE_DATABASE_ID

        # Common headers
        self.headers = {
            "Content-Type": "application/json",
            "X-Appwrite-Key": self.api_key,
            "X-Appwrite-Project": self.project_id
        }

    def _make_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Make a request to Appwrite API"""
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                timeout=30,
                **kwargs
            )
            return response
        except Exception as e:
            raise Exception(f"Appwrite API request failed: {str(e)}")

    def _handle_response(self, response: requests.Response, operation: str) -> Dict[str, Any]:
        """Handle Appwrite API response and check for errors"""
        try:
            result = response.json()

            if response.status_code >= 400:
                error_msg = result.get('message', 'Unknown error')
                error_type = result.get('type', 'unknown')
                error_code = result.get('code', response.status_code)

                raise Exception(
                    f"Appwrite {operation} error: {error_msg} "
                    f"(Type: {error_type}, Code: {error_code})"
                )

            return result
        except Exception as e:
            if "Appwrite" in str(e):
                raise
            # Response wasn't JSON
            raise Exception(
                f"Appwrite {operation} failed: "
                f"Status {response.status_code}, Response: {response.text[:200]}"
            )

    def _normalize_document(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Appwrite document fields to standard names"""
        if not doc:
            return doc
        # Map $id -> id
        if '$id' in doc and 'id' not in doc:
            doc['id'] = doc['$id']
        # Map $createdAt -> created_at (fallback if created_at is missing/None)
        if not doc.get('created_at') and '$createdAt' in doc:
            doc['created_at'] = doc['$createdAt']
        # Map $updatedAt -> updated_at
        if not doc.get('updated_at') and '$updatedAt' in doc:
            doc['updated_at'] = doc['$updatedAt']
        return doc

    # ==================== CREATE OPERATIONS ====================

    def create_row(
        self,
        table_id: str,
        column_data: Dict[str, Any],
        row_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new row in a table"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}/documents"

        payload = {
            "documentId": row_id or "unique()",
            "data": column_data
        }

        response = self._make_request(
            method="POST",
            url=url,
            json=payload
        )

        result = self._handle_response(response, "create")
        return self._normalize_document(result)

    def upsert_row(
        self,
        table_id: str,
        column_data: Dict[str, Any],
        row_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create or update a row (upsert)"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}/documents"

        payload = {
            "documentId": row_id or "unique()",
            "data": column_data
        }

        response = self._make_request(
            method="POST",
            url=url,
            json=payload
        )

        result = self._handle_response(response, "upsert")
        return self._normalize_document(result)

    # ==================== LIST/QUERY OPERATIONS ====================

    def list_rows(
        self,
        table_id: str,
        queries: Optional[List[str]] = None,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """List all rows in a table with optional filtering"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}/documents"

        params = {}
        if queries:
            params['queries'] = queries
        if limit:
            params['limit'] = limit

        response = self._make_request(
            method="GET",
            url=url,
            params=params
        )

        result = self._handle_response(response, "list")
        # Normalize each document in the list
        if result and 'documents' in result:
            result['documents'] = [self._normalize_document(d) for d in result['documents']]
        return result

    def search_rows(
        self,
        table_id: str,
        search_query: str
    ) -> Dict[str, Any]:
        """Search rows using query"""
        # Using the search query format from Appwrite docs
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}/documents"

        # Build search query
        # Appwrite uses search() method with Query class
        # For now, use simple text search
        from appwrite.query import Query
        search_query = Query.search(search_query)

        response = self._make_request(
            method="POST",
            url=url,
            json={'queries': [search_query]}
        )

        return self._handle_response(response, "search")

    # ==================== GET SINGLE ROW ====================

    def get_row(
        self,
        table_id: str,
        row_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a single row by ID"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}/documents/{row_id}"

        response = self._make_request(
            method="GET",
            url=url
        )

        if response.status_code == 404:
            return None

        return self._normalize_document(self._handle_response(response, "get"))

    # ==================== UPDATE OPERATIONS ====================

    def update_row(
        self,
        table_id: str,
        row_id: str,
        column_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update an existing row"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}/documents/{row_id}"

        response = self._make_request(
            method="PATCH",
            url=url,
            json=column_data
        )

        result = self._handle_response(response, "update")
        return self._normalize_document(result)

    # ==================== DELETE OPERATIONS ====================

    def delete_row(
        self,
        table_id: str,
        row_id: str
    ) -> bool:
        """Delete a row"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}/documents/{row_id}"

        response = self._make_request(
            method="DELETE",
            url=url
        )

        if response.status_code == 204:
            return True

        raise Exception(
            f"Failed to delete row: {response.status_code} - {response.text[:200]}"
        )

    # ==================== CONVENIENCE METHODS ====================

    def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new client (convenience method)"""
        return self.create_row(
            table_id=settings.COLLECTION_CLIENTS,
            column_data=client_data
        )

    def get_clients(self, **kwargs) -> Dict[str, Any]:
        """Get all clients (convenience method)"""
        return self.list_rows(
            table_id=settings.COLLECTION_CLIENTS,
            **kwargs
        )

    def get_client(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get a client by ID (convenience method)"""
        return self.get_row(
            table_id=settings.COLLECTION_CLIENTS,
            row_id=client_id
        )

    def update_client(self, client_id: str, client_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a client (convenience method)"""
        return self.update_row(
            table_id=settings.COLLECTION_CLIENTS,
            row_id=client_id,
            column_data=client_data
        )

    def delete_client(self, client_id: str) -> bool:
        """Delete a client (convenience method)"""
        return self.delete_row(
            table_id=settings.COLLECTION_CLIENTS,
            row_id=client_id
        )

    def count_clients(self) -> int:
        """Count total clients"""
        result = self.get_clients()
        return result.get('total', 0)

    # ==================== GENERIC DOCUMENT METHODS ====================

    def list_documents(
        self,
        collection_id: str,
        queries: Optional[List[str]] = None,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generic list documents for any collection"""
        return self.list_rows(collection_id, queries, limit)

    def get_document(
        self,
        collection_id: str,
        document_id: str
    ) -> Optional[Dict[str, Any]]:
        """Generic get document by ID"""
        return self.get_row(collection_id, document_id)

    def update_document(
        self,
        collection_id: str,
        document_id: str,
        document_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generic update document"""
        return self.update_row(collection_id, document_id, document_data)

    def delete_document(
        self,
        collection_id: str,
        document_id: str
    ) -> bool:
        """Generic delete document"""
        return self.delete_row(collection_id, document_id)

    # ==================== CLIENTS ALIASES ====================

    def list_clients(
        self,
        queries: Optional[List[str]] = None,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """List clients (alias for get_clients with queries support)"""
        return self.list_rows(settings.COLLECTION_CLIENTS, queries, limit)

    # ==================== SESSION METHODS ====================

    def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new session"""
        return self.create_row(settings.COLLECTION_SESSIONS, session_data)

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a session by ID"""
        return self.get_row(settings.COLLECTION_SESSIONS, session_id)

    def get_client_sessions(self, client_id: str) -> Dict[str, Any]:
        """Get all sessions for a client"""
        return self.list_rows(
            settings.COLLECTION_SESSIONS,
            [f'equal("client_id", ["{client_id}"])']
        )

    # ==================== NOTE METHODS ====================

    def create_note(self, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new note"""
        return self.create_row(settings.COLLECTION_NOTES, note_data)

    def get_client_notes(self, client_id: str) -> Dict[str, Any]:
        """Get all notes for a client"""
        return self.list_rows(
            settings.COLLECTION_NOTES,
            [f'equal("client_id", ["{client_id}"])']
        )


# Global Appwrite database instance
db = AppwriteDB()
