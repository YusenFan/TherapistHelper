#!/usr/bin/env python3
"""Test Appwrite document creation with different formats"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
API_KEY = "standard_eb925913049361116f758dc0c9e2f5ad0a3f631765d0f9955f105a2bfb2feb8c4142304c34f2dcf99bd4a2a4bc286e34adb00d9678954c8d644d2f15692aebf7a321b2ebaa856547c57d82b2b6eceb33d89e3026c02951e1f8ce735f5fbc17b90ffb1707e58b4b36f5adbfe8c8886db3fb39ccccc20aede91a6c5ac32a6d6f0f"
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")

headers = {
    "Content-Type": "application/json",
    "X-Appwrite-Key": API_KEY,
    "X-Appwrite-Project": PROJECT_ID
}

test_payloads = [
    {
        "name": "Test 1: Direct fields",
        "payload": {
            "full_name_encrypted": "Test Client",
            "age": 30,
            "gender": "female",
            "status": "active"
        }
    },
    {
        "name": "Test 2: Wrapped in data",
        "payload": {
            "data": {
                "full_name_encrypted": "Test Client",
                "age": 30,
                "gender": "female",
                "status": "active"
            }
        }
    },
    {
        "name": "Test 3: Empty object wrapper",
        "payload": {}
    },
    {
        "name": "Test 4: With documentId in query",
        "payload": {
            "full_name_encrypted": "Test Client",
            "age": 30,
            "gender": "female",
            "status": "active"
        },
        "use_query": True
    }
]

for test in test_payloads:
    print(f"\n{'='*70}")
    print(f"{test['name']}")
    print('='*70)

    url = f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/documents"
    if test.get("use_query"):
        url += "?documentId=unique()"

    try:
        response = requests.post(
            url,
            headers=headers,
            json=test["payload"],
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Sent: {json.dumps(test['payload'], indent=2)}")
        print(f"Response: {response.text[:300]}")
    except Exception as e:
        print(f"Error: {e}")
