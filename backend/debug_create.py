#!/usr/bin/env python3
"""Debug create_row method directly"""

import os
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
API_KEY = os.getenv("APPWRITE_API_KEY")
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")

print("Testing create_row method logic...")
print(f"ENDPOINT: {ENDPOINT}")
print(f"DATABASE_ID: {DATABASE_ID}")

# Test the URL construction
url = f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients"
print(f"URL: {url}")

# Test with requests
import requests

response = requests.post(
    url,
    headers={
        "Content-Type": "application/json",
        "X-Appwrite-Key": API_KEY,
        "X-Appwrite-Project": PROJECT_ID
    },
    json={
        "full_name_encrypted": "Test Client",
        "age": 30,
        "gender": "female",
        "status": "active"
    }
)

print(f"Status: {response.status_code}")
print(f"Response type: {type(response.json())}")

# Check what methods are available
result = response.json()
print(f"Response keys: {list(result.keys())}")
print(f"Full response: {result}")
