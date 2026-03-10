# TherapistHelper - Setup Issues & Solutions

## ✅ Fixed Issues

### 1. 307 Redirect Issue
**Problem:** FastAPI was returning 307 Temporary Redirect when accessing endpoints without trailing slashes.

**Solution:** Added `redirect_slashes=False` to FastAPI app configuration in `backend/app/main.py`:
```python
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TherapistHelper API - Secure client management with AI assistance",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    redirect_slashes=False  # Disable automatic trailing slash redirects
)
```

**Result:** Now endpoints work consistently. API expects trailing slashes (e.g., `/api/v1/clients/`).

### 2. Appwrite SDK Integration Issues
**Problem:** Backend was using outdated Appwrite SDK methods that don't exist in version 7.0.0.

**Solution:** Updated `backend/app/core/appwrite_client.py`:
- Changed from camelCase to snake_case methods: `create_row` → `create_document`
- Removed async/await pattern (Appwrite SDK 7.0.0 is synchronous)
- All methods now use correct Appwrite SDK API:
  - `create_document()`
  - `list_documents()`
  - `get_document()`
  - `update_document()`
  - `delete_document()`

### 3. Missing .env Configuration
**Problem:** Backend `.env` file was missing, causing Appwrite client to fail initialization.

**Solution:** Created `backend/.env` with proper configuration (see below).

### 4. Invalid Encryption Key
**Problem:** Fernet encryption key was not a valid 32-byte base64-encoded string.

**Solution:** Generated proper encryption key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## ⚠️ Outstanding Issues

### API Key Permissions & Endpoint
**Status:** BLOCKING - Requires user action

**Problem:** Current API key doesn't have sufficient permissions to create documents, or endpoint is incorrect.

**Current Configuration:**
```
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1  # Singapore region
APPWRITE_PROJECT_ID=69adbd67003e41b04c1f
APPWRITE_DATABASE_ID=69ae233c0026eb1facc0
APPWRITE_API_KEY=[CURRENT_KEY]  # (Has limited permissions)
```

**Error:** `Project is not accessible in this region` or permission errors.

**Solution Required:**
1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to: Project Settings → API Keys
3. Create a new API key or update existing one with permissions:
   - ✅ Documents: Read, Write, Create, Delete
   - ✅ Collections: Read, Write
   - ✅ Databases: Read
   - ✅ (Optional) Functions: Execute (for AI features)

4. Copy the new API key
5. Update `backend/.env`:
```bash
APPWRITE_API_KEY=your-new-api-key-here
```

6. Restart backend (it auto-reloads with `--reload` flag)

---

## 📝 Correct .env Template

Create `backend/.env` with these values:

```bash
# =============================================================================
# Appwrite Configuration
# =============================================================================
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69adbd67003e41b04c1f
APPWRITE_API_KEY=your-valid-api-key-with-permissions
APPWRITE_DATABASE_ID=69ae233c0026eb1facc0

# =============================================================================
# OpenAI Configuration (for Whisper Transcription)
# =============================================================================
OPENAI_API_KEY=sk-proj-b9hN3gP6h2lK8mR4wQ5vT7xY1zA9cB2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z

# =============================================================================
# Tinfoil.sh API Configuration (for LLM - Confidential Client Data)
# =============================================================================
TINFOIL_API_KEY=tk_Y8afZljtIO7bsSE4joTfmRlbuwNLAMZjRnWNawl3MLcjP1B0

# =============================================================================
# Security Configuration
# =============================================================================
SECRET_KEY=super-secret-key-change-in-production-12345678901234567890
ENCRYPTION_KEY=YCwaxA7ag9dbBOhHsnvTmxJf_eJQkmkGe58wJpdQ7vk=

# =============================================================================
# Environment
# =============================================================================
ENVIRONMENT=development
DEBUG=true
```

---

## 🧪 Testing the Fix

After updating the API key:

### 1. Test Backend Health
```bash
curl http://localhost:8000/
```
Expected: JSON response with status "running"

### 2. Create Test Client
```bash
curl -X POST http://localhost:8000/api/v1/clients/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe",
    "age": 32,
    "gender": "female",
    "status": "active",
    "email": "jane.doe@example.com",
    "phone": "+1-555-0123",
    "occupation": "Software Engineer"
  }'
```
Expected: JSON response with client data including ID

### 3. List Clients
```bash
curl http://localhost:8000/api/v1/clients/
```
Expected: Array of clients

### 4. Test Frontend
Visit: http://localhost:3000/clients
Expected: Client list displayed with the test client

---

## 📊 Current System Status

| Component | Status | Notes |
|-----------|---------|-------|
| Backend API | ✅ Running | Port 8000, auto-reload enabled |
| Appwrite SDK | ✅ Updated | Version 7.0.0, correct methods |
| Appwrite Database | ✅ Configured | 5 tables, 39 attributes |
| 307 Redirect | ✅ Fixed | `redirect_slashes=False` |
| Encryption Key | ✅ Valid | Proper Fernet key |
| API Key | ⚠️ Invalid/No Perms | **NEEDS UPDATE** |
| Frontend | ✅ Running | Port 3000, Next.js |
| API Client Library | ✅ Created | `frontend/lib/api.ts` |

---

## 🔍 Debugging Commands

If issues persist after API key update:

### Check Backend Logs
```bash
tail -f /tmp/backend.log
```

### Check Appwrite Connection
```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
python -c "
from app.core.appwrite_client import db
from app.core.config import settings
print(f'Endpoint: {settings.APPWRITE_ENDPOINT}')
print(f'Project ID: {settings.APPWRITE_PROJECT_ID}')
print(f'Database ID: {settings.APPWRITE_DATABASE_ID}')
try:
    result = db.databases.list_documents(
        database_id=settings.APPWRITE_DATABASE_ID,
        collection_id='clients'
    )
    print('✅ Connection successful!')
    print(f'Total clients: {result.get(\"total\", 0)}')
except Exception as e:
    print(f'❌ Connection failed: {e}')
"
```

### Verify API Key Permissions
```bash
# Test API key with curl
curl -X POST https://sgp.cloud.appwrite.io/v1/databases/69ae233c0026eb1facc0/collections/clients/documents \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Key: YOUR_API_KEY_HERE" \
  -H "X-Appwrite-Project: 69adbd67003e41b04c1f" \
  -d '{
    "full_name_encrypted": "Test Client",
    "age": 30,
    "gender": "female",
    "status": "active"
  }'
```

---

## 📚 Reference

### Appwrite SDK 7.0.0 Documentation
- Python SDK: https://github.com/appwrite/sdk-for-python
- API Reference: https://appwrite.io/docs/references/cloud/client-api
- Permission Scopes: https://appwrite.io/docs/permissions

### Project IDs
- Project ID: `69adbd67003e41b04c1f`
- Database ID: `69ae233c0026eb1facc0`
- Region: Singapore (sgp)
- Endpoint: `https://sgp.cloud.appwrite.io/v1`

### Collections (Tables)
- `clients` - Client profiles
- `sessions` - Therapy sessions
- `notes` - Client notes
- `tags` - Tag definitions
- `attendance` - Attendance records

---

**Last Updated:** March 9, 2026 @ 03:10 UTC  
**Status:** 🟡 Awaiting API key update
