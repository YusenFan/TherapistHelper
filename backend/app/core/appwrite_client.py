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
            # Response wasn't JSON
            raise Exception(
                f"Appwrite {operation} failed: "
                f"Status {response.status_code}, Response: {response.text[:200]}"
            )

    # ==================== CREATE OPERATIONS ====================

    def create_row(
        self,
        table_id: str,
        column_data: Dict[str, Any],
        row_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new row in a table"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}"

        response = self._make_request(
            method="POST",
            url=url,
            json=column_data
        )

        result = self._handle_response(response, "create")

        # Add system fields if not present
        if result and result.get('$id'):
            result['created_at'] = datetime.utcnow().isoformat()
            result['updated_at'] = datetime.utcnow().isoformat()

        return result

    def upsert_row(
        self,
        table_id: str,
        column_data: Dict[str, Any],
        row_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create or update a row (upsert)"""
        url = f"{self.endpoint}/databases/{self.database_id}/collections/{table_id}"

        response = self._make_request(
            method="POST",
            url=url,
            json=column_data
        )

        result = self._handle_response(response, "upsert")

        # Add system fields
        if result and result.get('$id'):
            result['updated_at'] = datetime.utcnow().isoformat()

        return result

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

        return self._handle_response(response, "list")

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

        return self._handle_response(response, "get")

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

        # Add updated timestamp
        if result:
            result['updated_at'] = datetime.utcnow().isoformat()

        return result

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


# Global Appwrite database instance
db = AppwriteDB()
