# TherapistHelper

**TheraScribe AI: Session Assistant for Therapists (MVP)**

TheraScribe AI is a web application designed to help consultant therapists enhance client engagement by minimizing time spent on note-taking and administrative tasks. By leveraging AI, the app automates transcription, generates valuable insights, and helps prepare for future sessions, allowing therapists to focus fully on their clients.

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
- **Package Management**: 
  - Frontend: npm/yarn
  - Backend: pip with virtual environment
- **Environment**: Docker (optional)
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

### Prerequisites
- **Node.js** (v18 or later)
- **Python** (v3.9 or later)  
- **PostgreSQL** installed and running
- **API keys** for:
  - An audio transcription service (AssemblyAI)
  - An AI language model service (OpenAI)

### Installation & Setup

#### 1. Clone the repository:
```bash
git clone https://github.com/your-username/therascribe-ai.git
cd therascribe-ai
```

#### 2. Setup Backend:
Navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file and add your secret keys and database URL:
```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
OPENAI_API_KEY="sk-..."
ASSEMBLYAI_API_KEY="..."
SECRET_KEY="your-secret-key-here"
```

Run the server:
```bash
uvicorn main:app --reload
```

#### 3. Setup Frontend:
Navigate to the frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Create a `.env.local` file and add the backend API URL:
```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
```

Run the development server:
```bash
npm run dev
```

### 4. Access the Application
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
therascribe-ai/
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