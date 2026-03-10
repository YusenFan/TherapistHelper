#!/usr/bin/env python3
"""Test Tables API - insert data directly to table"""

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
print("Testing Table Row Insert (not document creation)")
print("=" * 70)
print(f"Using: {DATABASE_ID} database (tablesdb type)")
print()

# Try different Tables API variations
test_endpoints = [
    ("POST /collections/clients/rows", f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/rows"),
    ("POST /collections/rows", f"{ENDPOINT}/databases/{DATABASE_ID}/collections/rows"),
]

data = {
    "full_name_encrypted": "Test Client",
    "age": 30,
    "gender": "female",
    "status": "active"
}

for endpoint_name, url in test_endpoints:
    print(f"\n{'='*70}")
    print(f"{endpoint_name}")
    print('='*70)
    print(f"URL: {url}")

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 201:
            print(f"✅ SUCCESS!")
            print(f"Response: {response.text[:500]}")
            print()
            break
        else:
            try:
                error = response.json()
                print(f"❌ FAILED: {error.get('message', 'Unknown error')}")
                print(f"Error details: {response.text[:300]}")
            except:
                print(f"❌ FAILED: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Exception: {e}")

print("=" * 70)
print("Test complete!")
print("=" * 70)
