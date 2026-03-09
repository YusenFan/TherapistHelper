# Appwrite Setup Instructions

## ⚠️ Important: Project ID Required

The current Appwrite Project ID (`therapist_helper`) does not exist in your account. You have two options:

## Option 1: Create Project with Specific ID

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Click "Create Project"
3. Use ID: `therapist_helper` (if possible, or note the actual ID assigned)
4. Copy the **actual Project ID** (shown in project settings)

## Option 2: Use Your Existing Project ID

If you already have a project:

1. Go to your project in Appwrite Console
2. Copy the Project ID from settings (it looks like: `66abc123def456`)
3. Update the `.env` file:

```bash
# File: /home/ubuntu/.openclaw/workspace/TherapistHelper/backend/.env
APPWRITE_PROJECT_ID=YOUR_ACTUAL_PROJECT_ID_HERE
```

## Then Create Tables

Once you have the correct Project ID:

### Option A: Use Appwrite Console (Recommended)

Easier and more visual:

1. Go to Databases in your project
2. Click "Create Database"
3. Name it: `therapist_helper`
4. Then create 5 tables:

#### Table 1: Clients
- **Table ID:** `clients`
- **Attributes:**
  - `full_name_encrypted` (string, 200, required)
  - `background_encrypted` (string, 10000)
  - `age` (integer, required)
  - `gender` (string, 50, required)
  - `custom_gender` (string, 100)
  - `race` (string, 50)
  - `occupation` (string, 100)
  - `date_of_birth` (string, 20)
  - `notes` (string, 5000)
  - `phone` (string, 20)
  - `email` (string, 100)
  - `status` (string, 20)
  - `tags` (string array)
  - `created_at` (string, 50)
  - `updated_at` (string, 50)

#### Table 2: Sessions
- **Table ID:** `sessions`
- **Attributes:**
  - `client_id` (string, 50, required)
  - `session_date` (string, 50, required)
  - `duration_minutes` (integer, required)
  - `session_type` (string, 20)
  - `transcript` (string, 50000)
  - `summary` (string, 5000)
  - `notes` (string, 5000)
  - `tags` (string array)
  - `analysis` (document)
  - `created_at` (string, 50)
  - `updated_at` (string, 50)

#### Table 3: Notes
- **Table ID:** `notes`
- **Attributes:**
  - `client_id` (string, 50, required)
  - `note_type` (string, 20, required)
  - `content` (string, 5000, required)
  - `tags` (string array)
  - `created_at` (string, 50)
  - `updated_at` (string, 50)

#### Table 4: Tags
- **Table ID:** `tags`
- **Attributes:**
  - `name` (string, 100, required)
  - `color` (string, 7)

#### Table 5: Attendance
- **Table ID:** `attendance`
- **Attributes:**
  - `client_id` (string, 50, required)
  - `session_id` (string, 50, required)
  - `scheduled_date` (string, 50, required)
  - `attended` (boolean, required)
  - `cancellation_reason` (string, 500)
  - `created_at` (string, 50)

### Option B: Use Setup Script (After Project ID is Fixed)

1. Update `.env` with your actual Project ID
2. Run:
```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper
./scripts/setup_appwrite_tables.sh
```

## Verify Setup

After creating tables, verify by testing the API:

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

In another terminal:
```bash
# Test creating a client
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Client",
    "age": 30,
    "gender": "female",
    "background": "Test background information"
  }'
```

## Current Status

- ✅ Appwrite CLI installed (version 14.0.1)
- ✅ Backend configured with API keys
- ✅ Setup scripts created
- ⚠️ Project ID needs to be fixed in `.env`
- ⚠️ Database tables need to be created (either via console or script)

## Next Steps

1. **Get your actual Project ID** from Appwrite Console
2. **Update** `backend/.env` with correct `APPWRITE_PROJECT_ID`
3. **Create database** named `therapist_helper` in Appwrite Console
4. **Create 5 tables** (either manually or run script)
5. **Test the API** to verify everything works

Once complete, the backend will be fully functional and ready for frontend development!
