#!/usr/bin/env python3
"""Test correct Tables API endpoint: POST to collection"""

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
print("Testing: POST to Collection Endpoint")
print("=" * 70)
print(f"Endpoint: {ENDPOINT}/databases/{DATABASE_ID}/collections/clients")
print()

data = {
    "full_name_encrypted": "Test Client",
    "age": 30,
    "gender": "female",
    "status": "active"
}

print(f"Data: {data}")
print()

url = f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients"

try:
    response = requests.post(url, headers=headers, json=data, timeout=10)
    print(f"Status: {response.status_code}")

    if response.status_code == 201:
        print(f"✅ SUCCESS!")
        print(f"Response: {response.text}")
    else:
        try:
            error = response.json()
            print(f"❌ FAILED: {error.get('message', 'Unknown error')}")
        except:
            print(f"❌ FAILED: {response.text[:200]}")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")

print("=" * 70)
