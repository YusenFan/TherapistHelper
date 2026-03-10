# API Key Permissions - COMPLETE SOLUTION

## 🔴 The Problem

Your API key is **working for some operations** but **failing for document creation**:

**Working:**
- ✅ List databases
- ✅ List collections
- ✅ Create attributes

**Failing (401 Unauthorized):**
- ❌ Create documents
- ❌ List documents
- ❌ Get documents

## ✅ Solution: Update API Key with Correct Permissions

### Step 1: Go to Appwrite Console
1. Visit: https://cloud.appwrite.io
2. Select project: `69adbd67003e41b04c1f`
3. Navigate to: **Settings → API Keys**

### Step 2: Create NEW API Key

1. Click **"Create API Key"**
2. Name: `TherapistHelper Full Access`
3. Expiration: Never

**⚠️ CRITICAL: Select ALL of these scopes:**

#### For Documents API (Current):
```
✅ Documents: Read
✅ Documents: Create
✅ Documents: Update
✅ Documents: Delete
```

#### OR For Tables API (New - Recommended):
```
✅ Tables: Read
✅ Tables: Create
✅ Tables: Update
✅ Tables: Delete
```

**Also include:**
```
✅ Databases: Read
✅ Databases: Create
✅ Databases: Update
✅ Databases: Delete
```

```
✅ Collections: Read
✅ Collections: Create
✅ Collections: Update
✅ Collections: Delete
```

### Step 3: Copy New API Key

After creating, **immediately copy the key** - you won't see it again!

### Step 4: Update .env

Edit `/home/ubuntu/.openclaw/workspace/TherapistHelper/backend/.env`:

```bash
# Replace this line with your NEW API key:
APPWRITE_API_KEY=your-new-api-key-here
```

### Step 5: Test

Run the diagnostic:

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
python diagnose_api.py
```

**Expected Output:**
```
✅ SUCCESS with format 3!
Response: {'$id': 'xxx', 'full_name_encrypted': 'Test', ...}
```

## 🔍 How to Check Your Current API Key Permissions

Go to Appwrite Console → Settings → API Keys → Click on your API key

Look at the **"Scopes"** section. If you don't see:

- **Documents: Create** (or **Tables: Create**)
- **Documents: Update** (or **Tables: Update**)
- **Documents: Delete** (or **Tables: Delete**)

Then the key doesn't have write permissions!

## 📋 Why This Happens

Appwrite uses a granular permission system. You can have an API key that:

- ✅ Can read databases and collections (for setup)
- ✅ Can create attributes (for table setup)
- ❌ But CANNOT create documents (write permissions missing)

This is exactly what's happening with your current key.

## 🎯 Quick Fix Checklist

- [ ] Go to https://cloud.appwrite.io
- [ ] Navigate to Settings → API Keys
- [ ] Click "Create API Key"
- [ ] Name it appropriately
- [ ] ✅ Check "Documents: Create"
- [ ] ✅ Check "Documents: Update"  
- [ ] ✅ Check "Documents: Delete"
- [ ] ✅ Check "Documents: Read"
- [ ] ✅ Check "Databases: Read"
- [ ] ✅ Check "Collections: Read"
- [ ] Click "Create"
- [ ] Copy the new API key
- [ ] Update backend/.env with new key
- [ ] Run `python diagnose_api.py` to verify

## 🆘 If It Still Doesn't Work

After updating the API key, if you still get 401 errors, try:

1. **Check API key was actually updated** in .env
2. **Restart the backend** (it should auto-reload with --reload)
3. **Clear browser cache** if testing via web interface

If still failing, run this and share the output:

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
python diagnose_api.py 2>&1
```

---

**Created:** March 10, 2026
**Status:** 🟡 Waiting for API key with write permissions
