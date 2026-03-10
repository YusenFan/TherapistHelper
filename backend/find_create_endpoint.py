#!/usr/bin/env python3
"""Check database endpoints and find create API"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
API_KEY = "standard_eb925913049361116f758dc0c9e2f5ad0a3f631765d0f9955f105a2bfb2feb8c4142304c34f2dcf99bd4a2a4bc286e34adb00d9678954c8d644d2f15692aebf7a321b2ebaa856547c57d82b2b6eceb33d89e3026c02951e1f8ce735f5fbc17b90ffb1707e58b4b36f5adbfe8c8886db3fb39ccccc20aede91a6c5ac32a6d6f0f"
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")

# Test with both header case variations
header_variations = [
    {
        "name": "Standard headers (as used before)",
        "headers": {
            "Content-Type": "application/json",
            "X-Appwrite-Key": API_KEY,
            "X-Appwrite-Project": PROJECT_ID
        }
    },
    {
        "name": "Lowercase headers",
        "headers": {
            "content-type": "application/json",
            "x-appwrite-key": API_KEY,
            "x-appwrite-project": PROJECT_ID
        }
    }
]

for header_test in header_variations:
    print(f"\n{'='*70}")
    print(f"{header_test['name']}")
    print('='*70)

    # Test 1: Get database details
    print("\nTest 1: Get database details")
    url = f"{ENDPOINT}/databases/{DATABASE_ID}"
    response = requests.get(url, headers=header_test["headers"])
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text[:200]}")
        continue

    db_info = response.json()
    print(f"Database type: {db_info.get('type')}")
    print(f"Database name: {db_info.get('name')}")

    # Test 2: List collections
    print("\nTest 2: List collections")
    url = f"{ENDPOINT}/databases/{DATABASE_ID}/collections"
    response = requests.get(url, headers=header_test["headers"])
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text[:200]}")
        continue

    # Test 3: Try to find create endpoint based on database type
    db_type = db_info.get('type')

    print(f"\nTest 3: Check available endpoints for type '{db_type}'")

    if db_type == "tablesdb":
        print("Database is tablesdb - trying tables endpoints...")
        test_endpoints = [
            f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/rows",
            f"{ENDPOINT}/databases/{DATABASE_ID}/tables/clients/rows",
            f"{ENDPOINT}/databases/{DATABASE_ID}/clients/rows",
        ]
    else:
        print("Database is documentdb - using collections/documents endpoint...")
        test_endpoints = [
            f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/documents",
            f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/rows",
        ]

    for endpoint_url in test_endpoints:
        print(f"\n  Trying: {endpoint_url}")
        try:
            response = requests.post(
                endpoint_url,
                headers=header_test["headers"],
                json={"full_name_encrypted": "Test", "age": 30, "gender": "female", "status": "active"},
                timeout=5
            )
            print(f"  Status: {response.status_code}")
            if response.status_code in [200, 201]:
                print(f"  ✅ SUCCESS! Response: {response.text[:200]}")
                break
            else:
                print(f"  ❌ Error: {response.text[:200]}")
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Request failed: {e}")
