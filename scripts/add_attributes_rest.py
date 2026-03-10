#!/usr/bin/env python3
"""Add all attributes to Appwrite collections using REST API"""

import os
import json
import requests
from dotenv import load_dotenv

# Load environment
load_dotenv()

API_ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
API_KEY = os.getenv("APPWRITE_API_KEY")
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")

headers = {
    "Content-Type": "application/json",
    "X-Appwrite-Key": API_KEY,
    "X-Appwrite-Project": PROJECT_ID
}

def create_attribute(collection_id, key, type_name, size=None, required=False, default=None):
    """Create an attribute in a collection"""
    url = f"{API_ENDPOINT}/databases/{DATABASE_ID}/collections/{collection_id}/attributes/{type_name}"
    data = {
        "key": key,
        "required": required
    }
    if size is not None:
        data["size"] = size
    if default is not None:
        data["default"] = default

    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 201:
            print(f"  ✅ Created: {key} ({type_name})")
            return True
        else:
            error_data = response.json()
            print(f"  ⚠️  Failed: {key} - {error_data.get('message', response.text)}")
            return False
    except Exception as e:
        print(f"  ❌ Error creating {key}: {e}")
        return False

def main():
    print("=" * 60)
    print("Adding attributes to Appwrite collections")
    print("=" * 60)
    print(f"   Endpoint: {API_ENDPOINT}")
    print(f"   Database: {DATABASE_ID}")
    print()

    # Clients collection attributes
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("Adding attributes to: clients")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    client_attrs = [
        ("full_name_encrypted", "string", 200, True),
        ("background_encrypted", "string", 10000, False),
        ("age", "integer", None, True),
        ("gender", "string", 50, True),
        ("custom_gender", "string", 100, False),
        ("race", "string", 50, False),
        ("occupation", "string", 100, False),
        ("date_of_birth", "string", 20, False),
        ("notes", "string", 5000, False),
        ("phone", "string", 20, False),
        ("email", "string", 100, False),
        ("status", "string", 20, False),
        ("created_at", "datetime", None, False),
        ("updated_at", "datetime", None, False),
    ]

    for key, type_name, size, required in client_attrs:
        create_attribute("clients", key, type_name, size, required)

    # Sessions collection attributes
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("Adding attributes to: sessions")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    session_attrs = [
        ("client_id", "string", 50, True),
        ("session_date", "datetime", None, True),
        ("duration_minutes", "integer", None, True),
        ("session_type", "string", 20, False),
        ("transcript", "string", 50000, False),
        ("summary", "string", 5000, False),
        ("notes", "string", 5000, False),
        ("created_at", "datetime", None, False),
        ("updated_at", "datetime", None, False),
    ]

    for key, type_name, size, required in session_attrs:
        create_attribute("sessions", key, type_name, size, required)

    # Notes collection attributes
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("Adding attributes to: notes")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    note_attrs = [
        ("client_id", "string", 50, True),
        ("note_type", "string", 20, True),
        ("content", "string", 5000, True),
        ("created_at", "datetime", None, False),
        ("updated_at", "datetime", None, False),
    ]

    for key, type_name, size, required in note_attrs:
        create_attribute("notes", key, type_name, size, required)

    # Tags collection attributes
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("Adding attributes to: tags")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    tag_attrs = [
        ("name", "string", 100, True),
        ("color", "string", 7, False),
    ]

    for key, type_name, size, required in tag_attrs:
        create_attribute("tags", key, type_name, size, required)

    # Attendance collection attributes
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("Adding attributes to: attendance")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    attendance_attrs = [
        ("client_id", "string", 50, True),
        ("session_id", "string", 50, True),
        ("scheduled_date", "datetime", None, True),
        ("attended", "boolean", None, True),
        ("cancellation_reason", "string", 500, False),
        ("created_at", "datetime", None, False),
    ]

    for key, type_name, size, required in attendance_attrs:
        create_attribute("attendance", key, type_name, size, required)

    print()
    print("=" * 60)
    print("✨ Attribute creation complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
