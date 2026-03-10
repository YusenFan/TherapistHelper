#!/usr/bin/env python3
"""Test creating a client using Python SDK"""

import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException

# Load environment
load_dotenv()

# Initialize client
client = Client()
client.set_endpoint(os.getenv("APPWRITE_ENDPOINT"))
client.set_project(os.getenv("APPWRITE_PROJECT_ID"))
client.set_key(os.getenv("APPWRITE_API_KEY"))

databases = Databases(client)

# Test creating a document
print("Creating test document...")

try:
    result = databases.create_document(
        database_id=os.getenv("APPWRITE_DATABASE_ID"),
        collection_id="clients",
        document_id="unique()",
        data={
            "full_name_encrypted": "Jane Doe",
            "age": 32,
            "gender": "female",
            "status": "active"
        }
    )
    print("✅ Success!")
    print(f"Document ID: {result.get('$id')}")
    print(f"Created at: {result.get('$createdAt')}")
except AppwriteException as e:
    print(f"❌ Failed: {e.message}")
    print(f"Error type: {e.type}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
