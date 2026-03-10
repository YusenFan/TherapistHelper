#!/usr/bin/env python3
"""Test direct API call to create row"""

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

data = {
    "full_name_encrypted": "Test Client",
    "age": 30,
    "gender": "female",
    "status": "active"
}

url = f"{ENDPOINT}/databases/{DATABASE_ID}/collections/clients/documents"

print(f"Testing: POST {url}")
print(f"Headers: {headers}")
print(f"Data: {data}")
print()

try:
    response = requests.post(url, headers=headers, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
