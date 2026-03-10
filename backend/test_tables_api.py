#!/usr/bin/env python3
"""Test Tables API endpoints for tablesdb type database"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
API_KEY = os.getenv("APPWRITE_API_KEY")
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")

headers = {
    "Content-Type": "application/json",
    "X-Appwrite-Key": API_KEY,
    "X-Appwrite-Project": PROJECT_ID
}

print("=" * 70)
print("Testing Tables API Endpoints")
print("=" * 70)
print(f"Database ID: {DATABASE_ID}")
print(f"Database type: tablesdb (should use Tables API)")
print()

# Test various Tables API endpoints
tables_endpoints = [
    ("POST /databases/{db}/collections/{col}/rows", "Old collections/rows"),
    ("POST /databases/{db}/collections/rows", "collections/rows without table ID"),
    ("POST /databases/{db}/tables/{table}/rows", "New tables/{table}/rows"),
    ("POST /databases/{db}/tables/{table}", "New tables/{table}"),
    ("POST /databases/{db}/rows", "New /rows"),
    ("POST /databases/{db}/collections/{col}/documents", "Old documents"),
]

data = {
    "full_name_encrypted": "Test Client",
    "age": 30,
    "gender": "female",
    "status": "active"
}

for endpoint_template, description in tables_endpoints:
    if "{col}" in endpoint_template:
        url = endpoint_template.format(db=DATABASE_ID, col="clients")
    elif "{table}" in endpoint_template:
        url = endpoint_template.format(db=DATABASE_ID, table="clients")
    else:
        url = endpoint_template.format(db=DATABASE_ID)

    print(f"\n{'='*70}")
    print(f"{description}")
    print(f"URL: {url}")
    print('='*70)

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 201:
            print(f"✅ SUCCESS!")
            print(f"Response: {response.text[:300]}")
            print()
            break
        else:
            error = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            print(f"❌ FAILED: {error.get('message', response.text[:200])}")
            print(f"Error details: {response.text[:400]}")
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

print("=" * 70)
print("Test complete!")
print("=" * 70)
