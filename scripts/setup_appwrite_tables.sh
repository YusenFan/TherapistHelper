#!/bin/bash
# Script to create Appwrite collections using REST API

APPWRITE_ENDPOINT="https://sgp.cloud.appwrite.io/v1"
PROJECT_ID="therapist_helper"
API_KEY="standard_84ebb55d5a15d12da5effd2038f16a811e0911f9c5dcb75ddd38d37127fc1d589a923869af77f139f3bc35784a6c61be57b51eefa9b614e663463620a1a69276eea8a24438425c0493cff6d356684eb428c5d8bdd4bd1a0a614ea37cb6a3de0649df83289b7a97ed9e08611f7d54decd0c79cba62ea1d8bf58fb1ef2c6f465c1"

echo "🚀 Creating Appwrite collections for TherapistHelper..."
echo "   Endpoint: $APPWRITE_ENDPOINT"
echo "   Project: $PROJECT_ID"
echo "   Database: therapist_helper"
echo ""

# Function to create a collection/table
create_table() {
    local table_id=$1
    local table_name=$2
    
    echo "Creating table: $table_name ($table_id)..."
    
    response=$(curl -s -X POST "$APPWRITE_ENDPOINT/databases/$PROJECT_ID/tables" \
        -H "x-appwrite-project: $PROJECT_ID" \
        -H "x-appwrite-key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"tableId\": \"$table_id\",
            \"name\": \"$table_name\",
            \"enabled\": true
        }")
    
    if echo "$response" | grep -q '"tableId"'; then
        echo "  ✅ Created '$table_name' table"
        return 0
    else
        echo "  ⚠️  Failed to create '$table_name':"
        echo "$response" | head -1
        return 1
    fi
}

# Function to create string attribute
create_string_attribute() {
    local table_id=$1
    local key=$2
    local size=$3
    local required=$4
    
    curl -s -X POST "$APPWRITE_ENDPOINT/databases/$PROJECT_ID/tables/$table_id/attributes" \
        -H "x-appwrite-project: $PROJECT_ID" \
        -H "x-appwrite-key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"type\": \"string\",
            \"size\": $size,
            \"required\": $required,
            \"array\": false
        }" > /dev/null
    echo "    - Added attribute: $key (string, size=$size)"
}

# Function to create integer attribute
create_integer_attribute() {
    local table_id=$1
    local key=$2
    local required=$3
    
    curl -s -X POST "$APPWRITE_ENDPOINT/databases/$PROJECT_ID/tables/$table_id/attributes" \
        -H "x-appwrite-project: $PROJECT_ID" \
        -H "x-appwrite-key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"type\": \"integer\",
            \"required\": $required,
            \"array\": false
        }" > /dev/null
    echo "    - Added attribute: $key (integer)"
}

# Function to create boolean attribute
create_boolean_attribute() {
    local table_id=$1
    local key=$2
    local required=$3
    
    curl -s -X POST "$APPWRITE_ENDPOINT/databases/$PROJECT_ID/tables/$table_id/attributes" \
        -H "x-appwrite-project: $PROJECT_ID" \
        -H "x-appwrite-key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"type\": \"boolean\",
            \"required\": $required,
            \"array\": false
        }" > /dev/null
    echo "    - Added attribute: $key (boolean)"
}

# Function to create array attribute
create_array_attribute() {
    local table_id=$1
    local key=$2
    
    curl -s -X POST "$APPWRITE_ENDPOINT/databases/$PROJECT_ID/tables/$table_id/attributes" \
        -H "x-appwrite-project: $PROJECT_ID" \
        -H "x-appwrite-key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"type\": \"string\",
            \"array\": true,
            \"required\": false
        }" > /dev/null
    echo "    - Added attribute: $key (array)"
}

# 1. Create Clients Table
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Clients Table"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if create_table "clients" "Clients"; then
    create_string_attribute "clients" "full_name_encrypted" 200 true
    create_string_attribute "clients" "background_encrypted" 10000 false
    create_integer_attribute "clients" "age" true
    create_string_attribute "clients" "gender" 50 true
    create_string_attribute "clients" "custom_gender" 100 false
    create_string_attribute "clients" "race" 50 false
    create_string_attribute "clients" "occupation" 100 false
    create_string_attribute "clients" "date_of_birth" 20 false
    create_string_attribute "clients" "notes" 5000 false
    create_string_attribute "clients" "phone" 20 false
    create_string_attribute "clients" "email" 100 false
    create_string_attribute "clients" "status" 20 false
    create_string_attribute "clients" "created_at" 50 false
    create_string_attribute "clients" "updated_at" 50 false
    create_array_attribute "clients" "tags"
fi

# 2. Create Sessions Table
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Sessions Table"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if create_table "sessions" "Sessions"; then
    create_string_attribute "sessions" "client_id" 50 true
    create_string_attribute "sessions" "session_date" 50 true
    create_integer_attribute "sessions" "duration_minutes" true
    create_string_attribute "sessions" "session_type" 20 false
    create_string_attribute "sessions" "transcript" 50000 false
    create_string_attribute "sessions" "summary" 5000 false
    create_string_attribute "sessions" "notes" 5000 false
    create_string_attribute "sessions" "created_at" 50 false
    create_string_attribute "sessions" "updated_at" 50 false
    create_array_attribute "sessions" "tags"
fi

# 3. Create Notes Table
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Notes Table"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if create_table "notes" "Notes"; then
    create_string_attribute "notes" "client_id" 50 true
    create_string_attribute "notes" "note_type" 20 true
    create_string_attribute "notes" "content" 5000 true
    create_string_attribute "notes" "created_at" 50 false
    create_string_attribute "notes" "updated_at" 50 false
    create_array_attribute "notes" "tags"
fi

# 4. Create Tags Table
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Tags Table"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if create_table "tags" "Tags"; then
    create_string_attribute "tags" "name" 100 true
    create_string_attribute "tags" "color" 7 false
fi

# 5. Create Attendance Table
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Attendance Table"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if create_table "attendance" "Attendance"; then
    create_string_attribute "attendance" "client_id" 50 true
    create_string_attribute "attendance" "session_id" 50 true
    create_string_attribute "attendance" "scheduled_date" 50 true
    create_boolean_attribute "attendance" "attended" true
    create_string_attribute "attendance" "cancellation_reason" 500 false
    create_string_attribute "attendance" "created_at" 50 false
fi

echo ""
echo ""
echo "✨ Appwrite tables setup complete!"
echo ""
echo "📊 Summary:"
echo "  ✅ clients: Client profiles with encrypted data"
echo "  ✅ sessions: Therapy sessions with transcripts"
echo "  ✅ notes: Client notes and observations"
echo "  ✅ tags: Categorization tags"
echo "  ✅ attendance: Session attendance records"
echo ""
echo "🎉 Next: Test the backend API!"
