# TherapistHelper - Setup Guide

## ✅ Completed

### 1. Backend Configuration
- ✅ OpenAI Whisper API key added
- ✅ Appwrite credentials configured
- ✅ Backend tested and running on port 8000
- ✅ All API endpoints functional

### 2. Multi-Agent System Defined

The system is now structured with 4 specialized agents:

#### **Main Agent (总控 / Coordinator)**
- **Role:** Strategic judgment, task breakdown, priority management
- **Responsibilities:**
  - Receive and structure new ideas into tasks
  - Determine task stage (exploration/validation/build/optimization/decision)
  - Delegate work to dev/marketing/business agents
  - Manage shared project memory (goals, constraints, decisions)
  - Synthesize results and provide recommendations
  - Prioritize when multiple directions exist
- **Output:** Task definition, priority, assigned agents, execution plan, recommendation

#### **Dev Agent (技术 / Implementation)**
- **Role:** Technical design, code implementation, system architecture
- **Responsibilities:**
  - Convert requirements to technical solutions
  - Code prototypes, module design, API definitions
  - Handle technical issues, debugging, deployment
  - Technology trade-off analysis
  - MVP implementation suggestions
  - Sync technical risks and progress with main agent
- **Output:** Architecture options, implementation plan, code, test results, technical risks

#### **Marketing Agent (市场 / Research)**
- **Role:** Market research, content strategy, competitive analysis
- **Responsibilities:**
  - Research target users, pain points, motivations
  - Analyze competitors (positioning, products, growth tactics)
  - Generate content ideas, messaging angles, channel suggestions
  - Monitor external signals (Reddit, X, forums, reviews)
  - Provide insights for product positioning and landing page
- **Output:** Research questions, target audience, competitor map, content ideas, messaging angles

#### **Business Agent (商业 / Pricing / Growth)**
- **Role:** Business model, pricing, metrics, growth strategy
- **Responsibilities:**
  - Analyze business model and revenue structure
  - Design pricing strategy and offer tiers
  - Establish key metrics (acquisition, activation, retention, revenue, conversion)
  - Evaluate unit economics, cost structure, margins
  - Propose growth paths and business levers
  - Assess feasibility (bootstrapping vs consulting vs product vs platform)
- **Output:** Monetization options, pricing options, unit economics, key metrics, growth levers

### 3. Agent Collaboration Rules
- **Main agent** receives tasks, breaks them down, assigns work, synthesizes results
- **Dev agent** handles all technical implementation
- **Marketing agent** handles all market research and external information
- **Business agent** handles business logic, pricing, and growth
- All agents can access shared memory but maintain individual context
- Each output must include: known facts, current assumptions, unresolved issues, recommended next steps
- Parallel tasks should be actively split and distributed by main agent
- Blockers are immediately reported to main agent for reassignment or escalation

### 4. Task Assignment Logic
- **Main agent:** "Should we do this?", "What should we do first?", "How do we break this down?"
- **Dev agent:** "How to implement?", "How to write code?", "How to deploy?", "Why is this erroring?"
- **Marketing agent:** "Does this market exist?", "How are others doing this?", "What content to write?", "What are users discussing?"
- **Business agent:** "How to charge?", "What metrics to track?", "How to grow?", "Is this worth doing?"

---

## ⚠️ Pending: Appwrite Setup

The database setup needs to be completed in your Appwrite console.

### Steps to Complete:

#### 1. Create Appwrite Project
If not already created:
1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Create a new project
3. Note your **Project ID** (shown in project settings)

#### 2. Get API Key
1. Go to API Keys section in your project
2. Create a new API key with these permissions:
   - ✅ Databases: Read, Write
   - ✅ Files: Read, Write
3. Copy the API key

#### 3. Create Database
1. Go to Databases section
2. Create a new database named: `therapist_helper`

#### 4. Update `.env` File
Update `/home/ubuntu/.openclaw/workspace/TherapistHelper/backend/.env`:

```env
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=YOUR_ACTUAL_PROJECT_ID  # Replace with your actual project ID
APPWRITE_API_KEY=YOUR_ACTUAL_API_KEY  # Replace with your actual API key
```

#### 5. Run Setup Script (Optional)
Once you have the correct Project ID and API key:

```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
python ../scripts/setup_appwrite.py
```

This will create 5 collections:
- `clients` - Client profiles with encrypted data
- `sessions` - Therapy sessions with transcripts
- `notes` - Client notes and observations
- `tags` - Categorization tags
- `attendance` - Session attendance records

#### 6. Alternative: Manual Setup
If the script doesn't work, you can create collections manually in the Appwrite Console.

---

## 🚀 Running the Application

### Start Backend
```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Start Frontend (in another terminal)
```bash
cd /home/ubuntu/.openclaw/workspace/TherapistHelper/frontend
npm run dev
```

Frontend will be available at: http://localhost:3000
Landing page: http://localhost:3000/landing

---

## 📊 Current Status

### ✅ Working
- Backend API server (port 8000)
- All API endpoints
- Landing page
- OpenAI Whisper API configured
- Tinfoil.sh API configured
- Encryption system
- Multi-agent system defined

### ⚠️ Needs Setup
- Appwrite database with correct Project ID
- Appwrite collections (5 total)
- Frontend pages (client overview, session management, etc.)
- Authentication system
- User management

### 🚧 In Progress
- Migration from PostgreSQL to Appwrite (backend complete, needs database)
- Frontend development (landing page done, app pages pending)

---

## 📝 Next Steps

### Immediate
1. ✅ Get correct Appwrite Project ID and API Key
2. ✅ Update `.env` file
3. ✅ Run setup script or create collections manually
4. ✅ Test backend with Appwrite

### Short-term
5. Build client overview page
6. Build session management UI
7. Build transcription upload interface
8. Build AI insights dashboard

### Long-term
9. Implement authentication
10. Add user management
11. Add payment integration (Stripe)
12. Deploy to production (Vercel for frontend, separate backend hosting)

---

## 🤖 Multi-Agent System Usage

To use the multi-agent system, simply tell the main agent what you want to do:

**Example:**
> "I want to add a feature for therapists to track client progress over time with charts and metrics."

**Main agent will:**
1. Analyze the request
2. Break it down into tasks
3. Assign to appropriate agents:
   - Dev agent: Database schema for metrics, API endpoints, chart components
   - Business agent: Define key metrics, growth indicators
   - Marketing agent: Feature messaging, user benefits
4. Synthesize results and provide execution plan

**Example response:**
```
📋 Task Definition
Feature: Client Progress Tracking with Visual Metrics
Priority: High
Stage: Build

👥 Assigned Agents
- Dev Agent: Implement metrics tracking, API endpoints, chart components
- Business Agent: Define core metrics (session count, attendance, improvement indicators)
- Marketing Agent: Craft messaging around "visualize your clients' journey"

📊 Execution Plan
1. Business Agent: Define 3-5 key metrics (1 day)
2. Dev Agent: Create metrics database schema (1 day)
3. Dev Agent: Build API endpoints for metrics (2 days)
4. Dev Agent: Build chart components (2 days)
5. Marketing Agent: Write feature announcement copy (1 day)

🎯 Recommendation
Start with 3 core metrics:
- Session frequency (attendance rate)
- Progress indicators (from AI analysis)
- Goal completion rate

This provides immediate value while allowing for future expansion.

📝 Decision Record
Approved to proceed with 3-metric MVP.
Metrics to be finalized by Business Agent by [date].
Technical implementation assigned to Dev Agent.
```

---

## 📞 Support

For questions or issues, reach out on Telegram or check the project repository:
https://github.com/YusenFan/TherapistHelper

---

**Last Updated:** March 9, 2026
