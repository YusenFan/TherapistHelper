# TherapistHelper

**Therapist Helper AI: Session Assistant for Therapists (MVP)**

Therapist Helper AI is a web application designed to help consultant therapists enhance client engagement by minimizing time spent on note-taking and administrative tasks. By leveraging AI, the app automates transcription, generates valuable insights, and helps prepare for future sessions, allowing therapists to focus fully on their clients.

This repository contains the source code for the Minimum Viable Product (MVP).

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
- **Primary Database**: PostgreSQL
- **ORM**: SQLAlchemy (recommended)

### AI & External Services
- **Audio Transcription**: AssemblyAI
- **AI Language Model**: OpenAI GPT-4o
- **File Storage**: Local/Cloud storage (to be configured)

### Development & Deployment
- **Containerization**: Docker & Docker Compose (recommended)
- **Package Management**: 
  - Frontend: npm/yarn
  - Backend: pip with virtual environment
- **Environment**: Docker for development and production
- **Version Control**: Git

## ✨ Core Features (MVP)

**Client Database**: An organized system to create and manage client profiles, including basic demographics and a centralized location for all session-related data.

**Audio Transcription**: Upload session audio recordings and receive fast, accurate transcripts.

**AI-Powered Summaries & Insights**: Automatically generate concise summaries and key insights from session transcripts to track client progress and themes.

**AI Session Helper (Pre-Session)**: Receive AI-generated session guidelines before each meeting, including suggested talking points, questions, and engagement strategies based on the client's history.

**AI Documentation (Post-Session)**: Instantly generate structured session logs and notes based on the transcript, streamlining the documentation process.

## 🏛️ High-Level Architecture

For the MVP, we are using a **Monolithic Architecture**. This approach simplifies development, testing, and deployment, making it ideal for a small team and rapid iteration. The entire application (frontend and backend) is built as a single, unified system that communicates with third-party APIs for specialized tasks.

### Data Flow:
1. Therapist interacts with the **React Frontend** (Next.js)
2. Frontend sends requests (e.g., audio upload) to the **Python Backend API** (FastAPI)
3. Backend securely sends the audio file to the **Transcription Service API** (AssemblyAI)
4. Backend receives the transcript and sends it to the **Language Model API** (OpenAI GPT-4o) for analysis, summarization, and generation
5. Backend stores client data, transcripts, and AI-generated content in the **PostgreSQL Database**
6. Processed information is sent back to the frontend for the therapist to view

## 🚀 Getting Started

## 🚀 Quick Start with Docker (Recommended)

The easiest way to run TherapistHelper is using Docker:

### Prerequisites
- **Docker** and **Docker Compose** installed
- **API keys** for:
  - OpenAI (for transcription and analysis)

### Setup Steps

#### 1. Clone the repository:
```bash
git clone https://github.com/your-username/Therapist Helper-ai.git
cd TherapistHelper
```

#### 2. Configure Environment Variables:
Create a `.env` file in the project root:
```env
# OpenAI API Keys (get these from https://platform.openai.com/api-keys)
OPENAI_TRANSCRIPTION_API_KEY=sk-proj-your-transcription-key-here
OPENAI_ANALYSIS_API_KEY=sk-proj-your-analysis-key-here

# Optional: Other environment variables
DATABASE_URL=postgresql://therapist:therapist123@localhost:5432/therapist_helper
ENVIRONMENT=development
```

#### 3. Run with Docker:
```bash
# Make the setup script executable
chmod +x scripts/dev-setup.sh

# Start all services (PostgreSQL, Backend, Frontend)
./scripts/dev-setup.sh
```

This will automatically:
- Start PostgreSQL database
- Build and run the FastAPI backend
- Build and run the Next.js frontend
- Set up all necessary dependencies

#### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (username: `therapist`, password: `therapist123`)

#### 5. Stop Services
```bash
# Stop all services
docker-compose down
```

### 🔧 Docker Useful Commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Restart specific service
docker-compose restart backend

# Rebuild and restart everything
docker-compose down && docker-compose up --build

# Access database directly
docker-compose exec postgres psql -U therapist -d therapist_helper

# Check running containers
docker-compose ps

# Remove all containers and volumes (CAUTION: This deletes data)
docker-compose down -v
```

### 🐛 Docker Troubleshooting

**If you encounter Docker network issues:**
```bash
# Clean Docker system
docker system prune -f

# Try building specific service
docker-compose build backend

# Check Docker is running
docker --version
docker-compose --version
```

**If ports are already in use:**
```bash
# Check what's using the ports
lsof -i :3000  # Frontend port
lsof -i :8000  # Backend port
lsof -i :5432  # Database port

# Kill processes using the ports
sudo kill -9 <PID>
```

---

## 🛠️ Manual Setup (Alternative)

If you prefer to run components individually without Docker:

### Prerequisites
- **Node.js** (v18 or later)
- **Python** (v3.9 or later)  
- **PostgreSQL** installed and running
- **API keys** for OpenAI

### Installation Steps

#### 1. Clone the repository:
```bash
git clone https://github.com/your-username/Therapist Helper-ai.git
cd TherapistHelper
```

#### 2. Setup Database:
```bash
# Start PostgreSQL (if using Docker for database only)
docker-compose up -d postgres

# Or setup local PostgreSQL
createdb therapist_helper
```

#### 3. Setup Backend:
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://therapist:therapist123@localhost:5432/therapist_helper
OPENAI_TRANSCRIPTION_API_KEY=sk-proj-your-transcription-key
OPENAI_ANALYSIS_API_KEY=sk-proj-your-analysis-key
SECRET_KEY=your-secret-key-change-in-production
ENVIRONMENT=development
EOF

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 4. Setup Frontend:
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

#### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## ⚠️ CRITICAL NOTE: Security & HIPAA Compliance

This application is designed to handle extremely sensitive **Protected Health Information (PHI)**. Standard development practices are not sufficient.

### Security Requirements:
- **DO NOT** use this code in production without ensuring full HIPAA compliance
- The application **MUST** be deployed on a HIPAA-compliant hosting provider (e.g., AWS, Google Cloud, Azure) with a signed Business Associate Agreement (BAA)
- All data **MUST** be encrypted at rest and in transit
- Implement robust authentication, authorization, and audit logging features
- Regular security audits and penetration testing are required

**Security is the most critical feature of this application. All development work must be done with a "security-first" mindset.**

## 📁 Project Structure
```
Therapist Helper-ai/
├── frontend/          # Next.js React application
├── backend/           # FastAPI Python application  
├── database/          # Database migrations and schemas
├── docs/              # Documentation
└── README.md          # This file
```

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.