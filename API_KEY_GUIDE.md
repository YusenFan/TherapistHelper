# API Key Permissions Issue - SOLUTION GUIDE

## 🎯 The Problem

The current API key doesn't have the necessary permissions to access the Appwrite database.

**Actual Error:** `The current user is not authorized to perform the requested action` (401 user_unauthorized)

**Not:** Region issue (endpoint is correct: `https://sgp.cloud.appwrite.io/v1`)

---

## ✅ Step-by-Step Solution

### Step 1: Go to Appwrite Console

1. Visit: https://cloud.appwrite.io
2. Select your project: `69adbd67003e41b04c1f`
3. Navigate to: **Settings → API Keys**

### Step 2: Create New API Key

1. Click **"Create API Key"** button
2. Fill in the details:
   - **Name:** `TherapistHelper Backend`
   - **Expires:** Never (or choose your preferred expiry)

3. **Select Scopes** (⚠️ CRITICAL - check all these):

   **Databases:**
   - ✅ Read
   - ✅ Create
   - ✅ Update
   - ✅ Delete

   **Collections:**
   - ✅ Read
   - ✅ Create
   - ✅ Update
   - ✅ Delete

   **Documents:**
   - ✅ Read
   - ✅ Create
   - ✅ Update
   - ✅ Delete

   **(Optional) For AI Features:**
   - **Functions:** Execute (if you plan to use AI features)

4. Click **"Create"**

### Step 3: Copy the New API Key

1. After creating, you'll see the new API key
2. **Copy it immediately** (you won't be able to see it again)
3. It should look like: `standard_[long-random-string]`

### Step 4: Update Backend .env File

Edit `/home/ubuntu/.openclaw/workspace/TherapistHelper/backend/.env`:

```bash
# Find this line and replace with your new API key:
APPWRITE_API_KEY=standard_YOUR_NEW_API_KEY_HERE
```

### Step 5: Test the Connection

Run the test script:

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
python test_appwrite.py
```

**Expected Output:**
```
✅ Success! Found 5 collections:
   - clients (ID: clients)
   - sessions (ID: sessions)
   - notes (ID: notes)
   - tags (ID: tags)
   - attendance (ID: attendance)

✅ Success! Found X total documents

✅ Success! Document created
   Document ID: [generated-id]
```

### Step 6: Test the Backend API

```bash
# Create a test client
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

**Expected:** JSON response with client data

### Step 7: Verify Frontend

Visit: http://localhost:3000/clients

You should see your test client displayed!

---

## 🔍 Why This Happened

The original API key was created with limited permissions (possibly for setup purposes only). It allowed certain operations but not full database access.

The test script revealed the exact issue:
- ❌ Current key: No database access permissions
- ✅ New key needed: Full CRUD permissions

---

## 📋 Permissions Reference

Here's what each permission does:

| Permission | What It Allows | Why We Need It |
|------------|----------------|----------------|
| **Databases: Read** | List databases | Verify connection |
| **Databases: Create** | Create databases | Future use |
| **Databases: Update** | Update database config | Future use |
| **Databases: Delete** | Delete databases | Future use |
| **Collections: Read** | List collections | Verify setup |
| **Collections: Create** | Create collections | Future use |
| **Collections: Update** | Update collections | Future use |
| **Collections: Delete** | Delete collections | Future use |
| **Documents: Read** | List/get documents | Read clients, sessions, notes |
| **Documents: Create** | Create documents | Create clients, sessions, notes |
| **Documents: Update** | Update documents | Edit clients, sessions, notes |
| **Documents: Delete** | Delete documents | Delete clients, sessions, notes |

---

## 🚨 Security Notes

1. **Never commit .env file** - It's in .gitignore
2. **Store API key securely** - Only in .env file
3. **Rotate keys periodically** - Good security practice
4. **Use different keys** for development and production

---

## 🎉 After You Fix This

Once the API key is updated and tested, TherapistHelper will be fully functional:

- ✅ Backend API working
- ✅ Frontend displaying clients
- ✅ Create new clients
- ✅ View client profiles
- ✅ Manage sessions
- ✅ Upload transcriptions
- ✅ Get AI insights

---

## 🆘 Still Having Issues?

Run this command and share the output:

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
python test_appwrite.py 2>&1
```

---

**Created:** March 9, 2026
**Status:** 🟡 Waiting for API key update
