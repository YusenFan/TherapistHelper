# Appwrite Console Manual Setup Guide

## Overview

Your tables are created, but they need attributes added before the backend will work.

## Step-by-Step Instructions (10-15 minutes)

### Step 1: Go to Appwrite Console
URL: https://cloud.appwrite.io
1. Log in
2. Click on your project (ID: 69adbd67003e41b04c1f)

### Step 2: Go to Databases
1. In the left sidebar, click **"Databases"**
2. You should see database: `therapist_helper` (ID: 69ae233c0026eb1facc0)

### Step 3: Add Attributes to "clients" Table

Click on **"clients"** table, then click **"Create Attribute"** for each:

| # | Attribute Name | Type | Size | Required | Default |
|---|---------------|------|------|----------|---------|
| 1 | full_name_encrypted | String | 200 | ✅ Yes | |
| 2 | background_encrypted | String | 10000 | No | |
| 3 | age | Integer | - | ✅ Yes | |
| 4 | gender | String | 50 | ✅ Yes | |
| 5 | custom_gender | String | 100 | No | |
| 6 | race | String | 50 | No | |
| 7 | occupation | String | 100 | No | |
| 8 | date_of_birth | String | 20 | No | |
| 9 | notes | String | 5000 | No | |
| 10 | phone | String | 20 | No | |
| 11 | email | String | 100 | No | |
| 12 | status | String | 20 | No | "active" |
| 13 | created_at | String | 50 | No | |
| 14 | updated_at | String | 50 | No | |
| 15 | tags | String Array | - | No | |

### Step 4: Add Attributes to "sessions" Table

Click on **"sessions"** table, then click **"Create Attribute"** for each:

| # | Attribute Name | Type | Size | Required |
|---|---------------|------|------|----------|
| 1 | client_id | String | 50 | ✅ Yes |
| 2 | session_date | String | 50 | ✅ Yes |
| 3 | duration_minutes | Integer | - | ✅ Yes |
| 4 | session_type | String | 20 | No |
| 5 | transcript | String | 50000 | No |
| 6 | summary | String | 5000 | No |
| 7 | notes | String | 5000 | No |
| 8 | tags | String Array | - | No |
| 9 | created_at | String | 50 | No |
| 10 | updated_at | String | 50 | No |

*Note: Skip "analysis" attribute - not needed for now*

### Step 5: Add Attributes to "notes" Table

Click on **"notes"** table, then click **"Create Attribute"** for each:

| # | Attribute Name | Type | Size | Required |
|---|---------------|------|------|----------|
| 1 | client_id | String | 50 | ✅ Yes |
| 2 | note_type | String | 20 | ✅ Yes |
| 3 | content | String | 5000 | ✅ Yes |
| 4 | tags | String Array | - | No |
| 5 | created_at | String | 50 | No |
| 6 | updated_at | String | 50 | No |

### Step 6: Add Attributes to "tags" Table

Click on **"tags"** table, then click **"Create Attribute"** for each:

| # | Attribute Name | Type | Size | Required |
|---|---------------|------|------|----------|
| 1 | name | String | 100 | ✅ Yes |
| 2 | color | String | 7 | No |

### Step 7: Add Attributes to "attendance" Table

Click on **"attendance"** table, then click **"Create Attribute"** for each:

| # | Attribute Name | Type | Size | Required |
|---|---------------|------|------|----------|
| 1 | client_id | String | 50 | ✅ Yes |
| 2 | session_id | String | 50 | ✅ Yes |
| 3 | scheduled_date | String | 50 | ✅ Yes |
| 4 | attended | Boolean | - | ✅ Yes |
| 5 | cancellation_reason | String | 500 | No |
| 6 | created_at | String | 50 | No |

---

## Testing

After adding all attributes, test the backend:

### 1. Start Backend

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Test Creating a Client

In a new terminal:

```bash
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Client",
    "age": 30,
    "gender": "female",
    "background": "This is a test background"
  }'
```

**Expected response:**
```json
{
  "$id": "...",
  "full_name_encrypted": "...",
  "background_encrypted": "...",
  "age": 30,
  "gender": "female",
  "status": "active",
  "tags": [],
  "created_at": "2026-03-09T01:40:00.000Z",
  "updated_at": "2026-03-09T01:40:00.000Z"
}
```

### 3. Test Listing Clients

```bash
curl http://localhost:8000/api/v1/clients
```

**Expected response:** Array of clients (should include the test client)

---

## Troubleshooting

### Error: "Attribute already exists"

This means the attribute was already added. Just skip it and move to the next one.

### Error: "Invalid attribute type"

Double-check the type:
- For ages, durations: Use **Integer**
- For name, dates, notes: Use **String**
- For yes/no values: Use **Boolean**
- For lists (like tags): Use **String Array**

### Error: "Size too large"

Reduce the size value:
- Try using 5000 instead of 10000
- Reduce to 200 for names

---

## Summary

- **Tables to update:** 5
- **Total attributes to add:** 38
  - clients: 14
  - sessions: 9
  - notes: 6
  - tags: 2
  - attendance: 6
- **Estimated time:** 10-15 minutes

---

## Ready to Proceed?

Once you've added all attributes and tested the backend:

✅ TherapistHelper backend will be fully functional
✅ Multi-agent system ready to use
✅ Ready to build frontend pages

**Next:** Start building client overview page and other features!
