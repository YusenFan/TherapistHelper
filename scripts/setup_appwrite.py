"""
Script to create Appwrite collections for TherapistHelper
"""
import sys
import os
from dotenv import load_dotenv

# Load .env from backend directory (absolute path)
env_path = '/home/ubuntu/.openclaw/workspace/TherapistHelper/backend/.env'
load_dotenv(env_path)

APPWRITE_ENDPOINT = os.getenv('APPWRITE_ENDPOINT')
APPWRITE_PROJECT_ID = os.getenv('APPWRITE_PROJECT_ID')
APPWRITE_API_KEY = os.getenv('APPWRITE_API_KEY')

if not all([APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY]):
    print("❌ Error: Missing Appwrite credentials in .env file")
    print(f"   APPWRITE_ENDPOINT: {APPWRITE_ENDPOINT}")
    print(f"   APPWRITE_PROJECT_ID: {APPWRITE_PROJECT_ID}")
    print(f"   APPWRITE_API_KEY: {APPWRITE_API_KEY[:20]}..." if APPWRITE_API_KEY else "   APPWRITE_API_KEY: [not set]")
    sys.exit(1)

from appwrite.client import Client
from appwrite.services.databases import Databases

# Initialize Appwrite client
client = Client()
client.set_endpoint(APPWRITE_ENDPOINT)
client.set_project(APPWRITE_PROJECT_ID)
client.set_key(APPWRITE_API_KEY)

databases = Databases(client)

database_id = 'therapist_helper'

print("🚀 Creating Appwrite collections for TherapistHelper...")
print(f"   Endpoint: {APPWRITE_ENDPOINT}")
print(f"   Project: {APPWRITE_PROJECT_ID}")
print(f"   Database: {database_id}\n")

# 1. Clients Collection
try:
    result = databases.create_collection(
        database_id=database_id,
        collection_id='clients',
        name='Clients',
        permissions=[
            "read(\"any\")",
            "create(\"any\")",
            "update(\"any\")",
            "delete(\"any\")"
        ]
    )
    print("✅ Created 'clients' collection")

    # Add attributes
    attributes = [
        ("full_name_encrypted", 200, True),
        ("background_encrypted", 10000, False),
        ("age", 0, True),  # integer
        ("gender", 50, True),
        ("custom_gender", 100, False),
        ("race", 50, False),
        ("occupation", 100, False),
        ("date_of_birth", 20, False),
        ("notes", 5000, False),
        ("phone", 20, False),
        ("email", 100, False),
        ("status", 20, False),
        ("created_at", 50, False),
        ("updated_at", 50, False),
    ]

    for attr_name, size, required in attributes:
        if attr_name == "age":
            databases.create_integer_attribute(
                database_id=database_id,
                collection_id='clients',
                key=attr_name,
                required=required
            )
        else:
            databases.create_string_attribute(
                database_id=database_id,
                collection_id='clients',
                key=attr_name,
                size=size,
                required=required
            )
        print(f"  - Added attribute: {attr_name}")

    # Add tags array attribute
    databases.create_array_attribute(
        database_id=database_id,
        collection_id='clients',
        key='tags',
        elements=["string"],
        required=False
    )
    print("  - Added attribute: tags (array)")

    # Create index
    databases.create_index(
        database_id=database_id,
        collection_id='clients',
        key='status',
        type='key'
    )
    print("  - Created index: status")

except Exception as e:
    print(f"⚠️  Clients collection: {e}")

print()

# 2. Sessions Collection
try:
    result = databases.create_collection(
        database_id=database_id,
        collection_id='sessions',
        name='Sessions',
        permissions=[
            "read(\"any\")",
            "create(\"any\")",
            "update(\"any\")",
            "delete(\"any\")"
        ]
    )
    print("✅ Created 'sessions' collection")

    attributes = [
        ("client_id", 50, True),
        ("session_date", 50, True),
        ("duration_minutes", 0, True),  # integer
        ("session_type", 20, False),
        ("transcript", 50000, False),
        ("summary", 5000, False),
        ("notes", 5000, False),
        ("created_at", 50, False),
        ("updated_at", 50, False),
    ]

    for attr_name, size, required in attributes:
        if attr_name == "duration_minutes":
            databases.create_integer_attribute(
                database_id=database_id,
                collection_id='sessions',
                key=attr_name,
                required=required
            )
        else:
            databases.create_string_attribute(
                database_id=database_id,
                collection_id='sessions',
                key=attr_name,
                size=size,
                required=required
            )
        print(f"  - Added attribute: {attr_name}")

    # Add tags array
    databases.create_array_attribute(
        database_id=database_id,
        collection_id='sessions',
        key='tags',
        elements=["string"],
        required=False
    )
    print("  - Added attribute: tags (array)")

    # Add analysis as document attribute
    databases.create_document_attribute(
        database_id=database_id,
        collection_id='sessions',
        key='analysis',
        required=False
    )
    print("  - Added attribute: analysis (document)")

    # Create indexes
    databases.create_index(
        database_id=database_id,
        collection_id='sessions',
        key='client_id',
        type='key'
    )
    print("  - Created index: client_id")

    databases.create_index(
        database_id=database_id,
        collection_id='sessions',
        key='created_at',
        type='key',
        orders=["DESC"]
    )
    print("  - Created index: created_at")

except Exception as e:
    print(f"⚠️  Sessions collection: {e}")

print()

# 3. Notes Collection
try:
    result = databases.create_collection(
        database_id=database_id,
        collection_id='notes',
        name='Notes',
        permissions=[
            "read(\"any\")",
            "create(\"any\")",
            "update(\"any\")",
            "delete(\"any\")"
        ]
    )
    print("✅ Created 'notes' collection")

    attributes = [
        ("client_id", 50, True),
        ("note_type", 20, True),
        ("content", 5000, True),
        ("created_at", 50, False),
        ("updated_at", 50, False),
    ]

    for attr_name, size, required in attributes:
        databases.create_string_attribute(
            database_id=database_id,
            collection_id='notes',
            key=attr_name,
            size=size,
            required=required
        )
        print(f"  - Added attribute: {attr_name}")

    # Add tags array
    databases.create_array_attribute(
        database_id=database_id,
        collection_id='notes',
        key='tags',
        elements=["string"],
        required=False
    )
    print("  - Added attribute: tags (array)")

    # Create indexes
    databases.create_index(
        database_id=database_id,
        collection_id='notes',
        key='client_id',
        type='key'
    )
    print("  - Created index: client_id")

except Exception as e:
    print(f"⚠️  Notes collection: {e}")

print()

# 4. Tags Collection
try:
    result = databases.create_collection(
        database_id=database_id,
        collection_id='tags',
        name='Tags',
        permissions=[
            "read(\"any\")",
            "create(\"any\")",
            "update(\"any\")",
            "delete(\"any\")"
        ]
    )
    print("✅ Created 'tags' collection")

    databases.create_string_attribute(
        database_id=database_id,
        collection_id='tags',
        key='name',
        size= 100,
        required=True
    )
    print("  - Added attribute: name")

    databases.create_string_attribute(
        database_id=database_id,
        collection_id='tags',
        key='color',
        size= 7,
        required=False
    )
    print("  - Added attribute: color")

except Exception as e:
    print(f"⚠️  Tags collection: {e}")

print()

# 5. Attendance Collection
try:
    result = databases.create_collection(
        database_id=database_id,
        collection_id='attendance',
        name='Attendance',
        permissions=[
            "read(\"any\")",
            "create(\"any\")",
            "update(\"any\")",
            "delete(\"any\")"
        ]
    )
    print("✅ Created 'attendance' collection")

    attributes = [
        ("client_id", 50, True),
        ("session_id", 50, True),
        ("scheduled_date", 50, True),
        ("attended", 0, True),  # boolean
        ("cancellation_reason", 500, False),
        ("created_at", 50, False),
    ]

    for attr_name, size, required in attributes:
        if attr_name == "attended":
            databases.create_boolean_attribute(
                database_id=database_id,
                collection_id='attendance',
                key=attr_name,
                required=required
            )
        else:
            databases.create_string_attribute(
                database_id=database_id,
                collection_id='attendance',
                key=attr_name,
                size=size,
                required=required
            )
        print(f"  - Added attribute: {attr_name}")

    # Create indexes
    databases.create_index(
        database_id=database_id,
        collection_id='attendance',
        key='client_id',
        type='key'
    )
    print("  - Created index: client_id")

except Exception as e:
    print(f"⚠️  Attendance collection: {e}")

print()
print("✨ Appwrite collections setup complete!")
print("\n📊 Summary:")
print("  - clients: Client profiles with encrypted data")
print("  - sessions: Therapy sessions with transcripts")
print("  - notes: Client notes and observations")
print("  - tags: Categorization tags")
print("  - attendance: Session attendance records")
