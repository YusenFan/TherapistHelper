#!/bin/bash
# Quick script to update API key in .env

echo "======================================"
echo "Update Appwrite API Key"
echo "======================================"
echo

read -p "Enter your NEW API key: " new_key

if [ -z "$new_key" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

echo
echo "Updating backend/.env..."
sed -i "s/^APPWRITE_API_KEY=.*/APPWRITE_API_KEY=$new_key/" /home/ubuntu/.openclaw/workspace/TherapistHelper/backend/.env

echo "✅ API key updated!"
echo
echo "Testing connection..."
echo

cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
python diagnose_api.py

echo
echo "======================================"
echo "Complete!"
echo "======================================"
