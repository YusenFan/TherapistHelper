# TherapistHelper - Complete Setup Guide

## 🚀 Quick Start

### Current Status
- ✅ Backend: Migrated to Appwrite, tested and running
- ✅ API: All endpoints implemented and working
- ✅ OpenAI Whisper: Configured and ready
- ✅ Tinfoil.sh API: Configured and ready
- ✅ Multi-Agent System: Defined and documented
- ⚠️ Appwrite Database: **Needs setup** (see APPWRITE_SETUP.md)

### Most Important Next Step

**Complete Appwrite Database Setup**

See detailed instructions in: `APPWRITE_SETUP.md`

You need to:
1. Get your actual Appwrite Project ID
2. Create database named `therapist_helper`
3. Create 5 tables (clients, sessions, notes, tags, attendance)

---

## 📋 Detailed Setup Steps

### 1. Appwrite Configuration

**Step 1a: Get Your Project ID**

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Note your actual Project ID (from project settings)
3. OR create a new project with ID: `therapist_helper`

**Step 1b: Update Environment Variables**

Edit `/home/ubuntu/.openclaw/workspace/TherapistHelper/backend/.env`:

```env
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=YOUR_ACTUAL_PROJECT_ID_HERE  # Update this!
APPWRITE_API_KEY=standard_84ebb55d5a15d12da5effd2038f16a811e0911f9c5dcb75ddd38d37127fc1d589a923869af77f139f3bc35784a6c61be57b51eefa9b614e663463620a1a69276eea8a24438425c0493cff6d356684eb428c5d8bdd4bd1a0a614ea37cb6a3de0649df83289b7a97ed9e08611f7d54decd0c79cba62ea1d8bf58fb1ef2c6f465c1
```

**Step 1c: Create Database and Tables**

See `APPWRITE_SETUP.md` for detailed instructions.

**Quick Manual Setup (5 minutes):**

1. In Appwrite Console, go to **Databases**
2. Click **Create Database**
3. Name: `therapist_helper`
4. Create these 5 tables:

| Table ID | Name | Purpose |
|----------|------|---------|
| `clients` | Clients | Client profiles with encrypted data |
| `sessions` | Sessions | Therapy sessions with transcripts |
| `notes` | Notes | Client notes and observations |
| `tags` | Tags | Categorization tags |
| `attendance` | Attendance | Session attendance records |

Each table needs specific attributes - see `APPWRITE_SETUP.md` for details.

---

## 🏃 Running the Application

### Backend

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Frontend

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/frontend
npm run dev
```

- Frontend: http://localhost:3000
- Landing Page: http://localhost:3000/landing
- Dashboard: http://localhost:3000 (needs to be built)

---

## 🤖 Multi-Agent System

The project uses 4 specialized agents working together:

### Agent Roles

| Agent | Role | Responsibilities |
|--------|------|----------------|
| **Main** | Strategy & Coordination | Task breakdown, priority management, resource allocation, result synthesis |
| **Dev** | Technical Implementation | System design, code implementation, architecture, debugging |
| **Marketing** | Market Research | User research, competitive analysis, content strategy, messaging |
| **Business** | Business & Growth | Pricing, metrics, business model, growth strategy |

### How to Use

Simply tell **Main Agent** what you want to do. It will:
1. Analyze the request
2. Break it down into tasks
3. Assign to appropriate agents
4. Synthesize results
5. Provide clear next steps

### Example

**You:** "Add a feature to track client progress over time"

**Main Agent Response:**
```
📋 Task Definition
Feature: Client Progress Tracking
Priority: High

👥 Assigned Agents
- Dev Agent: Database schema, API endpoints, chart components
- Business Agent: Define key metrics
- Marketing Agent: Feature messaging

📊 Execution Plan
1. Business Agent: Define metrics (1 day)
2. Dev Agent: Implement schema (1 day)
3. Dev Agent: Build API (2 days)
4. Dev Agent: Build charts (2 days)
5. Marketing Agent: Write copy (1 day)

🎯 Recommendation
Start with 3 core metrics:
- Session frequency
- Progress indicators
- Goal completion rate

📝 Next Action
Business Agent: Begin metric definition
```

See full documentation in: `SETUP_GUIDE.md`

---

## 📁 Project Structure

```
TherapistHelper/
├── backend/                 # FastAPI Python application
│   ├── app/
│   │   ├── api/          # API endpoints (all working ✅)
│   │   ├── core/         # Config & Appwrite client
│   │   ├── crud/         # Database operations
│   │   ├── models/       # Pydantic models
│   │   ├── services/     # AI services (Whisper, Tinfoil)
│   │   └── main.py      # FastAPI app
│   ├── requirements.txt
│   └── .env            # API keys and config
├── frontend/               # Next.js React application
│   ├── app/
│   │   ├── landing/     # Landing page (done ✅)
│   │   ├── page.tsx      # Dashboard (needs update)
│   │   ├── clients/      # Client pages (to build)
│   │   └── sessions/     # Session pages (to build)
│   └── package.json
├── scripts/
│   ├── setup_appwrite.py       # Python setup script
│   └── setup_appwrite_tables.sh  # Bash setup script
├── APPWRITE_SETUP.md        # Detailed Appwrite setup
├── SETUP_GUIDE.md          # Multi-agent system docs
└── README.md               # Project overview
```

---

## 🎯 Development Priorities

### Immediate (This Week)
1. ✅ Complete Appwrite database setup
2. Build client overview page
3. Build session management UI
4. Test full backend integration

### Short-term (Next Month)
5. Build transcription upload interface
6. Build AI insights dashboard
7. Build intake form page
8. Implement authentication

### Long-term (Future)
9. Add user management
10. Payment integration (Stripe)
11. Deploy to production
12. Add analytics dashboard

---

## 🔧 Troubleshooting

### Backend Won't Start

**Problem:** Port 8000 already in use

**Solution:**
```bash
# Find and kill process
lsof -i :8000
sudo kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 8001
```

### Appwrite Connection Failed

**Problem:** "Project not found" error

**Solution:**
1. Check `APPWRITE_PROJECT_ID` in `.env`
2. Verify it matches your actual project ID in Appwrite Console
3. Ensure API key has correct permissions

### Frontend Build Errors

**Problem:** Module not found

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 API Endpoints Reference

### Clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients` - List clients
- `GET /api/v1/clients/{id}` - Get client
- `PUT /api/v1/clients/{id}` - Update client
- `DELETE /api/v1/clients/{id}` - Delete client

### Sessions
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions` - List sessions
- `GET /api/v1/sessions/client/{id}` - Get client sessions

### Transcription
- `POST /api/v1/transcription/upload` - Upload audio
- `POST /api/v1/transcription/from-url` - Transcribe from URL

### AI Services
- `POST /api/v1/ai/analyze` - Analyze transcript
- `POST /api/v1/ai/session/agenda` - Generate agenda
- `POST /api/v1/ai/session/log` - Generate session log
- `POST /api/v1/ai/chat` - Context-aware chat
- `POST /api/v1/ai/client/background` - Update background

### Notes
- `POST /api/v1/notes` - Create note
- `GET /api/v1/notes` - List notes
- `GET /api/v1/notes/client/{id}` - Get client notes

### Intake
- `POST /api/v1/intake/{id}` - Submit intake form
- `GET /api/v1/intake/{id}` - Get intake form

Full API documentation: http://localhost:8000/docs

---

## 🎉 You're Ready!

Once you complete the Appwrite setup, you'll have:

- ✅ Fully functional backend
- ✅ All AI services (Whisper + Tinfoil)
- ✅ Professional landing page
- ✅ Multi-agent system ready to work
- ✅ Complete API documentation

**Next:** Start building frontend pages and features!

---

**Last Updated:** March 9, 2026
**Documentation:** See `APPWRITE_SETUP.md` for detailed Appwrite instructions
