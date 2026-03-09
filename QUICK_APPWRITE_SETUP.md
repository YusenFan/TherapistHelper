# Appwrite Setup Update

## Status

- ✅ Backend configured with correct Project ID and Database ID
- ✅ Tables created (clients, sessions, notes, tags, attendance)
- ⚠️ Tables need attributes added

## What You Need to Do

### Option 1: Use Appwrite Console (RECOMMENDED - 5 minutes)

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project (ID: 69adbd67003e41b04c1f)
3. Go to **Databases**
4. Click on database `therapist_helper` (ID: 69ae233c0026eb1facc0)
5. For each table, click and add attributes

### Attribute Lists:

#### Clients Table
Click on `clients` table → Add Attributes:

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| full_name_encrypted | String | 200 | ✅ |
| background_encrypted | String | 10000 | |
| age | Integer | - | ✅ |
| gender | String | 50 | ✅ |
| custom_gender | String | 100 | |
| race | String | 50 | |
| occupation | String | 100 | |
| date_of_birth | String | 20 | |
| notes | String | 5000 | |
| phone | String | 20 | |
| email | String | 100 | |
| status | String | 20 | |
| tags | String Array | - | |
| created_at | String | 50 | |
| updated_at | String | 50 | |

#### Sessions Table

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| client_id | String | 50 | ✅ |
| session_date | String | 50 | ✅ |
| duration_minutes | Integer | - | ✅ |
| session_type | String | 20 | |
| transcript | String | 50000 | |
| summary | String | 5000 | |
| notes | String | 5000 | |
| analysis | Document | - | |
| tags | String Array | - | |
| created_at | String | 50 | |
| updated_at | String | 50 | |

#### Notes Table

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| client_id | String | 50 | ✅ |
| note_type | String | 20 | ✅ |
| content | String | 5000 | ✅ |
| tags | String Array | - | |
| created_at | String | 50 | |
| updated_at | String | 50 | |

#### Tags Table

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| name | String | 100 | ✅ |
| color | String | 7 | |

#### Attendance Table

| Attribute | Type | Size | Required |
|-----------|------|------|----------|
| client_id | String | 50 | ✅ |
| session_id | String | 50 | ✅ |
| scheduled_date | String | 50 | ✅ |
| attended | Boolean | - | ✅ |
| cancellation_reason | String | 500 | |
| created_at | String | 50 | |

## After Adding Attributes

Test the backend:

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Test creating a client:

```bash
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Client",
    "age": 30,
    "gender": "female",
    "background": "Test background information"
  }'
```

## Summary

- **Tables created:** ✅ Yes (5 tables)
- **Attributes added:** ⚠️ No (need to be added manually)
- **Estimated time:** 10-15 minutes
- **Difficulty:** Easy (just clicking in UI)

## Next

After attributes are added:
1. Test backend API
2. Start building frontend pages
3. Use multi-agent system for development tasks
