# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs at http://localhost:8000/docs

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # dev server on port 3000
npm run build        # production build
npm run lint         # ESLint
```

### Deployment
Deployed on Render via `render.yaml` at project root. Auto-deploys on push to master.
- Backend: `https://therapisthelper-backend.onrender.com`
- Frontend: `https://therapisthelper-frontend.onrender.com`

## Architecture

**Frontend** (Next.js 14 / TypeScript / Tailwind) → **Backend** (FastAPI / Python) → **Appwrite Cloud** (database)

### Backend Structure
- `app/main.py` — FastAPI app with CORS middleware
- `app/core/config.py` — `Settings` class (pydantic-settings), global `settings` instance
- `app/core/appwrite_client.py` — `AppwriteDB` class wrapping Appwrite REST API; global `db` instance
- `app/core/auth.py` — JWT validation via Appwrite `/account` endpoint; `get_current_user_id` dependency
- `app/api/v1/api.py` — Router aggregation for all endpoints
- `app/api/v1/endpoints/` — Route handlers (clients, sessions, session_notes, clinical_assessments, ai, transcription)
- `app/crud/` — CRUD classes with encrypted field mapping (client, session, session_note, clinical_assessment)
- `app/models/models.py` — Pydantic request/response models
- `app/services/llm.py` — Tinfoil.sh LLM integration (OpenAI-compatible)
- `app/services/transcription.py` — Audio transcription (Voxtral/Whisper)

### Frontend Structure
- `app/` — Next.js app router pages (clients, sessions, chat, login, landing)
- `components/` — React components including `MainLayout`, `ClientChat`
- `lib/api.ts` — Backend API client with typed interfaces
- `lib/auth-context.tsx` — Appwrite auth context provider

### Critical Patterns

**Appwrite DB client is synchronous.** `AppwriteDB` uses the `requests` library (not async). CRUD methods are declared `async` but must NOT `await` db calls — they call `db.create_row()`, `db.list_rows()`, etc. directly.

**Encrypted field mapping.** Each CRUD file has `_ENCRYPTED_FIELD_MAP` / `_ENCRYPTED_FIELDS` dicts that map model field names (e.g., `full_name`) to Appwrite column names (e.g., `full_name_encrypted`). `_to_appwrite()` converts outbound data, `_from_appwrite()` converts inbound data. Appwrite handles AES-128-GCM encryption at rest — no custom encryption in app code.

**Document normalization.** `AppwriteDB._normalize_document()` maps `$id`→`id`, `$createdAt`→`created_at`, `$updatedAt`→`updated_at` on every response.

**Authentication.** All protected endpoints use `therapist_id: str = Depends(get_current_user_id)`. Frontend sends Appwrite JWTs. The backend validates them by calling Appwrite's `/account` endpoint.

**Appwrite attribute key limit.** Appwrite has a 36-character limit on attribute keys. Long field names must be abbreviated (e.g., `educational_vocational_history` → `edu_vocational_history_enc`).

## Collections (Appwrite)
- `clients` — Client demographics + encrypted PII
- `sessions` — Session metadata + encrypted transcript/summary
- `session_notes` — One note per session (BIRP/DAP/SOAP/free formats), linked by `session_id` (unique)
- `clinical_assessments` — Intake/reassessment/discharge documents per client

## AI Services
- **LLM:** Tinfoil.sh API (OpenAI-compatible endpoint) for analysis, chat, note conversion
- **Chat modes:** investigate, role_play, supervisor, psychological_schools
- **Transcription:** Voxtral for speech-to-text
