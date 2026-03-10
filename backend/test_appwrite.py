#!/usr/bin/env python3
"""Test Appwrite connection and permissions"""

import os
import sys
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException

# Load environment variables from .env
load_dotenv()

# Get environment variables
endpoint = os.getenv("APPWRITE_ENDPOINT")
project_id = os.getenv("APPWRITE_PROJECT_ID")
api_key = os.getenv("APPWRITE_API_KEY")
database_id = os.getenv("APPWRITE_DATABASE_ID")

print("=" * 60)
print("Appwrite Connection Test")
print("=" * 60)
print(f"Endpoint: {endpoint}")
print(f"Project ID: {project_id}")
print(f"Database ID: {database_id}")
print(f"API Key: {api_key[:20]}..." if api_key else "API Key: NOT SET")
print("=" * 60)

if not all([endpoint, project_id, api_key, database_id]):
    print("❌ Error: Missing environment variables")
    sys.exit(1)

# Initialize client
client = Client()
client.set_endpoint(endpoint)
client.set_project(project_id)
client.set_key(api_key)

databases = Databases(client)

# Test 1: List collections
print("\n📋 Test 1: List collections in database")
try:
    result = databases.list_collections(database_id=database_id)
    print(f"✅ Success! Found {len(result.get('collections', []))} collections:")
    for col in result.get('collections', []):
        print(f"   - {col.get('name')} (ID: {col.get('id')})")
except AppwriteException as e:
    print(f"❌ Failed: {e.message}")
    print(f"   Error type: {e.type}")
    print(f"   Response: {e.response}")

# Test 2: List documents in 'clients' collection
print("\n📋 Test 2: List documents in 'clients' collection")
try:
    result = databases.list_documents(
        database_id=database_id,
        collection_id="clients"
    )
    print(f"✅ Success! Found {result.get('total', 0)} total documents")
    print(f"   Returning {len(result.get('documents', []))} documents")
except AppwriteException as e:
    print(f"❌ Failed: {e.message}")
    print(f"   Error type: {e.type}")
    print(f"   Response: {e.response}")

# Test 3: Create a test document
print("\n📋 Test 3: Create test document")
test_data = {
    "full_name_encrypted": "Test Client",
    "age": 30,
    "gender": "other",
    "status": "active",
    "tags": ["test"]
}
try:
    result = databases.create_document(
        database_id=database_id,
        collection_id="clients",
        document_id="unique()",
        data=test_data
    )
    print(f"✅ Success! Document created")
    print(f"   Document ID: {result.get('$id')}")
except AppwriteException as e:
    print(f"❌ Failed: {e.message}")
    print(f"   Error type: {e.type}")
    print(f"   Response: {e.response}")

print("\n" + "=" * 60)
print("Test Complete")
print("=" * 60)
