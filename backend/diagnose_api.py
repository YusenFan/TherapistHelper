#!/usr/bin/env python3
"""Check Appwrite API version and test document creation"""

import os
import json
import requests
from dotenv import load_dotenv

# Load environment
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

print("=" * 60)
print("Appwrite API Diagnostics")
print("=" * 60)
print(f"Endpoint: {ENDPOINT}")
print(f"Project ID: {PROJECT_ID}")
print(f"Database ID: {DATABASE_ID}")
print()

# Test 1: Check database type
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("Test 1: Check database type and version")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
url = f"{ENDPOINT}/databases/{DATABASE_ID}"
response = requests.get(url, headers=headers)
data = response.json()
print(f"Database name: {data.get('name')}")
print(f"Database type: {data.get('type')}")
print(f"Enabled: {data.get('enabled')}")
print()

# Test 2: Try creating with minimal data
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("Test 2: Create document with minimal data")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

# Try with data parameter name variations
test_formats = [
    {"data": {"full_name_encrypted": "Test", "age": 30}},
    {"documentData": {"full_name_encrypted": "Test", "age": 30}},
    {"full_name_encrypted": "Test", "age": 30},
]

for i, payload in enumerate(test_formats, 1):
    print(f"\n  Attempt {i}: {payload}")
    url = f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/documents?documentId=unique()"
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 201:
            print(f"  ✅ SUCCESS with format {i}!")
            print(f"  Response: {response.json()}")
            break
        else:
            error_data = response.json()
            print(f"  ❌ Failed: {error_data.get('message', response.text[:100])}")
            print(f"  Status: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Exception: {e}")

# Test 3: Try Tables API (new API)
print()
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("Test 3: Try Tables API (create_row)")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

url = f"{ENDPOINT}/databases/{DATABASE_ID}/tables/clients/rows"
try:
    response = requests.post(
        url,
        headers=headers,
        json={"full_name_encrypted": "Test", "age": 30},
        timeout=10
    )
    if response.status_code == 201:
        print(f"  ✅ Tables API works!")
        print(f"  Response: {response.json()}")
    else:
        error_data = response.json()
        print(f"  ❌ Failed: {error_data.get('message', response.text[:100])}")
        print(f"  Status: {response.status_code}")
except Exception as e:
    print(f"  ❌ Exception or 404 (tables endpoint not available): {e}")

print()
print("=" * 60)
print("Diagnostics complete!")
print("=" * 60)
