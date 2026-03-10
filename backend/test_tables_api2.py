#!/usr/bin/env python3
"""Test Tables API endpoints with full URLs"""

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
    ("collections/rows", f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/rows"),
    ("tables/{table}/rows", f"{ENDPOINT}/databases/{DATABASE_ID}/tables/clients/rows"),
    ("tables/{table}", f"{ENDPOINT}/databases/{DATABASE_ID}/tables/clients"),
]

data = {
    "full_name_encrypted": "Test Client",
    "age": 30,
    "gender": "female",
    "status": "active"
}

for endpoint_name, url in tables_endpoints:
    print(f"\n{'='*70}")
    print(f"{endpoint_name}")
    print(f"URL: {url}")
    print('='*70)

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 201:
            print(f"✅ SUCCESS!")
            print(f"Response: {response.text[:400]}")
            print()
            break
        else:
            try:
                error = response.json()
                print(f"❌ FAILED: {error.get('message', 'Unknown error')}")
            except:
                print(f"❌ FAILED: {response.text[:300]}")
            print(f"Full response: {response.text[:500]}")
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

print("=" * 70)
print("Test complete!")
print("=" * 70)
