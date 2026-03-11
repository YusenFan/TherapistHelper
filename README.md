# TherapistHelper

**TheraBee: AI-Powered Session Assistant for Therapists**

TherapistHelper is a web application designed to help therapists enhance client engagement by minimizing time spent on note-taking and administrative tasks. By leveraging AI, the app automates transcription, generates valuable insights, and helps prepare for future sessions.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **Language**: TypeScript/JavaScript

### Backend
- **Framework**: FastAPI (Python)
- **Language**: Python 3.9+
- **API Documentation**: Automatic OpenAPI/Swagger

### Database
- **Primary Database**: Appwrite (Cloud-based, HIPAA-ready)
- **No ORM**: Direct Appwrite Python SDK

### AI & External Services
- **Audio Transcription**: OpenAI Whisper
- **AI Language Model**: Tinfoil.sh API (confidential, patient data safe)
- **File Storage**: Appwrite Storage

### Development & Deployment
- **No Docker**: Run locally
- **Package Management**:
  - Frontend: npm/yarn
  - Backend: pip with virtual environment
- **Version Control**: Git

## ✨ Core Features

### 📋 Client Database
- Create and manage client profiles
- Encrypted storage of sensitive data (names, background)
- Tag system for organization
- Notes and documentation
- Attendance tracking
- Search and filtering

### 🎙️ Audio Transcription
- Upload session recordings (MP3, WAV, M4A, etc.)
- OpenAI Whisper for accurate transcription
- Automatic session creation
- Support for audio URLs

### 🤖 AI-Powered Insights
- **Transcript Analysis**: Generate summaries, key points, emotional states
- **Progress Tracking**: Identify indicators of progress
- **Therapeutic Recommendations**: AI-suggested interventions
- **Client Background Updates**: Auto-update profiles from transcripts

### 📅 Session Helper
- **Pre-Session**: Generate agendas and suggested questions
- **Engagement Activities**: Suggest games and exercises
- **Post-Session**: Generate clinical documentation and logs
- **Context-Aware**: AI remembers each client's background

### 📝 Intake Forms
- Comprehensive client intake
- Family structure and relationships
- Health and medical history
- Work and education background
- Shareable links for clients to fill out

### 🔒 Security & Privacy
- Field-level encryption for all sensitive data
- Tinfoil.sh API ensures confidential LLM processing
- Client context awareness (never confuse patients)
- HIPAA-ready infrastructure with Appwrite

## 🏛️ Architecture

### System Design
```
Frontend (Next.js) → Backend (FastAPI) → Appwrite Database
     ↓                    ↓                     ↓
Port 3000            Port 8000             Cloud API
                          ↓
                    OpenAI Whisper
                    (Transcription)
                          ↓
                    Tinfoil.sh API
                    (Confidential AI)
```

### Data Flow
1. Therapist interacts with **Next.js Frontend**
2. Frontend sends requests to **FastAPI Backend**
3. Backend stores data in **Appwrite Database** (encrypted)
4. For transcription → **OpenAI Whisper**
5. For AI analysis → **Tinfoil.sh API** (confidential)
6. Results stored and returned to frontend

### Appwrite Collections
- `clients` - Client profiles with encrypted data
- `sessions` - Therapy sessions with transcripts
- `notes` - Client notes and observations
- `tags` - Client categorization tags
- `attendance` - Session attendance records

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or later)
- **Python** (v3.9 or later)
- **Appwrite Account** (free tier works)
- **OpenAI API Key** (for Whisper)
- **Tinfoil.sh API Key** (provided in .env)

### Step 1: Setup Appwrite

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Create a new project
3. Get your **Project ID** and **API Key**
4. Create a database named `therapist_helper`
5. Create collections (optional - will auto-create on first use):
   - `clients`
   - `sessions`
   - `notes`
   - `tags`
   - `attendance`

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
# Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key

# OpenAI (Whisper)
OPENAI_API_KEY=sk-your-openai-key

# Tinfoil.sh (LLM)
TINFOIL_API_KEY=tk_Y8afZljtIO7bsSE4joTfmRlbuwNLAMZjRnWNawl3MLcjP1B0

# Security
SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

**Generate Encryption Keys:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Run Backend:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Run frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

## 📁 Project Structure

```
TherapistHelper/
├── frontend/              # Next.js React application
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── public/           # Static assets
├── backend/              # FastAPI Python application
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   │           ├── clients.py
│   │   │           ├── sessions.py
│   │   │           ├── transcription.py
│   │   │           ├── ai.py
│   │   │           ├── notes.py
│   │   │           └── intake.py
│   │   ├── core/        # Configuration
│   │   │   ├── config.py
│   │   │   └── appwrite_client.py
│   │   ├── crud/        # Database operations
│   │   │   ├── client.py
│   │   │   ├── session.py
│   │   │   └── note.py
│   │   ├── models/      # Pydantic models
│   │   ├── services/    # External services
│   │   │   ├── transcription.py
│   │   │   └── llm.py
│   │   └── main.py      # FastAPI app
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## 🔌 API Endpoints

### Clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients` - List clients
- `GET /api/v1/clients/{id}` - Get client
- `PUT /api/v1/clients/{id}` - Update client
- `DELETE /api/v1/clients/{id}` - Delete client
- `GET /api/v1/clients/search/{query}` - Search clients

### Sessions
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions` - List sessions
- `GET /api/v1/sessions/client/{id}` - Get client sessions
- `GET /api/v1/sessions/{id}` - Get session
- `PUT /api/v1/sessions/{id}` - Update session

### Transcription
- `POST /api/v1/transcription/upload` - Upload & transcribe audio
- `POST /api/v1/transcription/from-url` - Transcribe from URL

### AI Services
- `POST /api/v1/ai/analyze` - Analyze transcript
- `POST /api/v1/ai/session/agenda` - Generate session agenda
- `POST /api/v1/ai/session/log` - Generate session log
- `POST /api/v1/ai/client/background` - Update client background
- `POST /api/v1/ai/chat` - Chat with AI (client context aware)

### Notes
- `POST /api/v1/notes` - Create note
- `GET /api/v1/notes` - List notes
- `GET /api/v1/notes/client/{id}` - Get client notes
- `PUT /api/v1/notes/{id}` - Update note
- `DELETE /api/v1/notes/{id}` - Delete note

### Intake Forms
- `POST /api/v1/intake/{id}` - Submit intake form
- `GET /api/v1/intake/{id}` - Get intake form
- `POST /api/v1/intake/{id}/share-link` - Generate share link

## 🔒 Security & HIPAA Compliance

### Implemented Security Measures
- ✅ Field-level encryption for sensitive data
- ✅ Tinfoil.sh API for confidential AI processing
- ✅ Client context awareness (prevent patient confusion)
- ✅ Secure API key management
- ✅ CORS protection
- ✅ Input validation

### Important Notes
- This application handles **Protected Health Information (PHI)**
- Use only on HIPAA-compliant infrastructure in production
- Ensure all API keys are kept secure
- Implement proper authentication/authorization before production
- Regular security audits recommended

## 🚧 Roadmap

### Phase 1: MVP (Current)
- ✅ Client database with encryption
- ✅ Audio transcription (Whisper)
- ✅ AI analysis (Tinfoil.sh)
- ✅ Session management
- ✅ Notes system
- ✅ Intake forms

### Phase 2: Frontend & UX
- 🚧 React frontend development
- 🚧 Client overview page
- 🚧 Session management UI
- 🚧 Transcription upload interface
- 🚧 AI insights dashboard

### Phase 3: Advanced Features
- ⏳ User authentication
- ⏳ Role-based access control
- ⏳ Calendar integration
- ⏳ Automated reminders
- ⏳ Advanced analytics

### Phase 4: Production
- ⏳ Landing page
- ⏳ Payment integration (Stripe)
- ⏳ Multi-tenant support
- ⏳ HIPAA certification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI Whisper for transcription
- Tinfoil.sh for confidential AI services
- Appwrite for the database platform
- FastAPI for the backend framework
- Next.js for the frontend framework
