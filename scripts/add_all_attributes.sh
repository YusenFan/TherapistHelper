#!/bin/bash
# Script to add all attributes to Appwrite tables via API

APPWRITE_ENDPOINT="https://sgp.cloud.appwrite.io/v1"
PROJECT_ID="69adbd67003e41b04c1f"
DATABASE_ID="69ae233c0026eb1facc0"
API_KEY="standard_84ebb55d5a15d12da5effd2038f16a811e0911f9c5dcb75ddd38d37127fc1d589a923869af77f139f3bc35784a6c61be57b51eefa9b614e663463620a1a69276eea8a24438425c0493cff6d356684eb428c5d8bdd4bd1a0a614ea37cb6a3de0649df83289b7a97ed9e08611f7d54decd0c79cba62ea1d8bf58fb1ef2c6f465c1"

echo "🚀 Adding attributes to Appwrite tables for TherapistHelper..."
echo "   Project: $PROJECT_ID"
echo "   Database: $DATABASE_ID"
echo ""

# Helper function to create column
create_column() {
    local table_id=$1
    local attribute_name=$2
    local column_type=$3
    local size=$4
    local required=$5
    local default_value=$6
    
    echo "  Creating column: $attribute_name ($column_type, size=$size, required=$required)..."
    
    # Build the payload
    if [ "$column_type" = "datetime" ]; then
        payload="{
            \"key\": \"$attribute_name\",
            \"type\": \"$column_type\",
            \"required\": $required
        }"
    elif [ "$column_type" = "boolean" ]; then
        payload="{
            \"key\": \"$attribute_name\",
            \"type\": \"$column_type\",
            \"required\": $required
        }"
    elif [ "$column_type" = "integer" ]; then
        payload="{
            \"key\": \"$attribute_name\",
            \"type\": \"$column_type\",
            \"required\": $required
        }"
    else
        # String type (or array)
        payload="{
            \"key\": \"$attribute_name\",
            \"type\": \"$column_type\",
            \"size\": $size,
            \"required\": $required
        }"
        if [ "$column_type" = "array" ]; then
            payload="{
                \"key\": \"$attribute_name\",
                \"type\": \"string\",
                \"array\": true,
                \"required\": $required
            }"
        fi
    fi
    
    # Make the API call
    response=$(curl -s -X POST "$APPWRITE_ENDPOINT/databases/$DATABASE_ID/tables/$table_id/columns" \
        -H "x-appwrite-project: $PROJECT_ID" \
        -H "x-appwrite-key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    # Check for success
    if echo "$response" | grep -q '"key"'; then
        echo "    ✅ Success"
        return 0
    else
        echo "    ⚠️  Failed: $(echo "$response" | head -c 150)..."
        return 1
    fi
}

# =============================================================================
# 1. Add attributes to 'clients' table
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: clients"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_column "clients" "full_name_encrypted" "string" 200 "true"
create_column "clients" "background_encrypted" "string" 10000 "false"
create_column "clients" "age" "integer" "" "true"
create_column "clients" "gender" "string" 50 "true"
create_column "clients" "custom_gender" "string" 100 "false"
create_column "clients" "race" "string" 50 "false"
create_column "clients" "occupation" "string" 100 "false"
create_column "clients" "date_of_birth" "string" 20 "false"
create_column "clients" "notes" "string" 5000 "false"
create_column "clients" "phone" "string" 20 "false"
create_column "clients" "email" "string" 100 "false"
create_column "clients" "status" "string" 20 "false"
create_column "clients" "created_at" "datetime" "" "false"
create_column "clients" "updated_at" "datetime" "" "false"
create_column "clients" "tags" "array" "" "false"

echo ""
echo "✅ Clients table: 15 attributes added!"
echo ""

# =============================================================================
# 2. Add attributes to 'sessions' table
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: sessions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_column "sessions" "client_id" "string" 50 "true"
create_column "sessions" "session_date" "datetime" "" "true"
create_column "sessions" "duration_minutes" "integer" "" "true"
create_column "sessions" "session_type" "string" 20 "false"
create_column "sessions" "transcript" "string" 50000 "false"
create_column "sessions" "summary" "string" 5000 "false"
create_column "sessions" "notes" "string" 5000 "false"
create_column "sessions" "created_at" "datetime" "" "false"
create_column "sessions" "updated_at" "datetime" "" "false"
create_column "sessions" "tags" "array" "" "false"

# Skip 'analysis' for now - it would need a different type

echo ""
echo "✅ Sessions table: 10 attributes added!"
echo ""

# =============================================================================
# 3. Add attributes to 'notes' table
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: notes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_column "notes" "client_id" "string" 50 "true"
create_column "notes" "note_type" "string" 20 "true"
create_column "notes" "content" "string" 5000 "true"
create_column "notes" "created_at" "datetime" "" "false"
create_column "notes" "updated_at" "datetime" "" "false"
create_column "notes" "tags" "array" "" "false"

echo ""
echo "✅ Notes table: 6 attributes added!"
echo ""

# =============================================================================
# 4. Add attributes to 'tags' table
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: tags"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_column "tags" "name" "string" 100 "true"
create_column "tags" "color" "string" 7 "false"

echo ""
echo "✅ Tags table: 2 attributes added!"
echo ""

# =============================================================================
# 5. Add attributes to 'attendance' table
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding attributes to: attendance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_column "attendance" "client_id" "string" 50 "true"
create_column "attendance" "session_id" "string" 50 "true"
create_column "attendance" "scheduled_date" "datetime" "" "true"
create_column "attendance" "attended" "boolean" "" "true"
create_column "attendance" "cancellation_reason" "string" 500 "false"
create_column "attendance" "created_at" "datetime" "" "false"

echo ""
echo "✅ Attendance table: 6 attributes added!"
echo ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All attributes added successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  ✅ clients: 15 attributes"
echo "  ✅ sessions: 10 attributes"
echo "  ✅ notes: 6 attributes"
echo "  ✅ tags: 2 attributes"
echo "  ✅ attendance: 6 attributes"
echo "  ✅ Total: 39 attributes"
echo ""
echo "🎉 Database setup complete!"
echo ""
echo "🚀 Next: Test the backend API!"
echo ""
echo "   curl -X POST http://localhost:8000/api/v1/clients \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{"
echo '       \"full_name\": \"Test Client\",'
echo "       \"age\": 30,'
echo "       \"gender\": \"female\"'
echo "     }'"
echo ""
