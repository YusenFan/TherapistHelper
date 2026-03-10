#!/bin/bash
# Add all attributes to Appwrite collections using REST API

# Load environment variables
ENDPOINT="https://sgp.cloud.appwrite.io/v1"
PROJECT_ID="69adbd67003e41b04c1f"
API_KEY="standard_eb925913049361116f758dc0c9e2f5ad0a3f631765d0f9955f105a2bfb2feb8c4142304c34f2dcf99bd4a2a4bc286e34adb00d9678954c8d644d2f15692aebf7a321b2ebaa856547c57d82b2b6eceb33d89e3026c02951e1f8ce735f5fbc17b90ffb1707e58b4b36f5adbfe8c8886db3fb39ccccc20aede91a6c5ac32a6d6f0f"
DATABASE_ID="69ae233c0026eb1facc0"

echo "============================================================"
echo "Adding attributes to Appwrite collections"
echo "============================================================"
echo "   Endpoint: $ENDPOINT"
echo "   Database: $DATABASE_ID"
echo

# Function to create attribute
create_attribute() {
    local collection_id=$1
    local key=$2
    local type=$3
    local size=$4
    local required=$5

    local url="${ENDPOINT}/databases/${DATABASE_ID}/collections/${collection_id}/attributes/${type}"

    # Build JSON data
    if [ -n "$size" ]; then
        local data="{\"key\":\"${key}\",\"size\":${size},\"required\":${required}}"
    else
        local data="{\"key\":\"${key}\",\"required\":${required}}"
    fi

    local response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -H "X-Appwrite-Key: $API_KEY" \
        -H "X-Appwrite-Project: $PROJECT_ID" \
        -d "$data")

    if echo "$response" | grep -q '"$key"'; then
        echo "  ✅ Created: $key ($type)"
    else
        echo "  ⚠️  Failed: $key - $(echo $response | jq -r '.message' 2>/dev/null || echo $response)"
    fi
}

# Clients collection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: clients"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_attribute "clients" "full_name_encrypted" "string" 200 "true"
create_attribute "clients" "background_encrypted" "string" 10000 "false"
create_attribute "clients" "age" "integer" "" "true"
create_attribute "clients" "gender" "string" 50 "true"
create_attribute "clients" "custom_gender" "string" 100 "false"
create_attribute "clients" "race" "string" 50 "false"
create_attribute "clients" "occupation" "string" 100 "false"
create_attribute "clients" "date_of_birth" "string" 20 "false"
create_attribute "clients" "notes" "string" 5000 "false"
create_attribute "clients" "phone" "string" 20 "false"
create_attribute "clients" "email" "string" 100 "false"
create_attribute "clients" "status" "string" 20 "false"
create_attribute "clients" "created_at" "datetime" "" "false"
create_attribute "clients" "updated_at" "datetime" "" "false"

# Sessions collection
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: sessions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_attribute "sessions" "client_id" "string" 50 "true"
create_attribute "sessions" "session_date" "datetime" "" "true"
create_attribute "sessions" "duration_minutes" "integer" "" "true"
create_attribute "sessions" "session_type" "string" 20 "false"
create_attribute "sessions" "transcript" "string" 50000 "false"
create_attribute "sessions" "summary" "string" 5000 "false"
create_attribute "sessions" "notes" "string" 5000 "false"
create_attribute "sessions" "created_at" "datetime" "" "false"
create_attribute "sessions" "updated_at" "datetime" "" "false"

# Notes collection
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: notes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_attribute "notes" "client_id" "string" 50 "true"
create_attribute "notes" "note_type" "string" 20 "true"
create_attribute "notes" "content" "string" 5000 "true"
create_attribute "notes" "created_at" "datetime" "" "false"
create_attribute "notes" "updated_at" "datetime" "" "false"

# Tags collection
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: tags"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_attribute "tags" "name" "string" 100 "true"
create_attribute "tags" "color" "string" 7 "false"

# Attendance collection
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: attendance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_attribute "attendance" "client_id" "string" 50 "true"
create_attribute "attendance" "session_id" "string" 50 "true"
create_attribute "attendance" "scheduled_date" "datetime" "" "true"
create_attribute "attendance" "attended" "boolean" "" "true"
create_attribute "attendance" "cancellation_reason" "string" 500 "false"
create_attribute "attendance" "created_at" "datetime" "" "false"

echo
echo "============================================================"
echo "✨ Attribute creation complete!"
echo "============================================================"
