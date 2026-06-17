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

### Frontend Structure
- `app/(protected)/` — Next.js app router pages (clients, sessions, templates, settings)
- `components/` — React components: `MainLayout`, `Sidebar`, `ClientForm`, `SessionEditor`
- `lib/api.ts` — Backend API client with typed interfaces
- `lib/noteFormats.ts` — Built-in note formats + sections, client types, DSM-5 picker list
- `lib/auth-context.tsx` — Appwrite auth context provider

### Critical Patterns

**Appwrite DB client is synchronous.** `AppwriteDB` uses the `requests` library (not async). CRUD methods are declared `async` but must NOT `await` db calls — they call `db.create_row()`, `db.list_rows()`, etc. directly.

**Column names match model field names.** No `_encrypted` suffix mapping. Appwrite native at-rest encryption is enabled directly on the sensitive attributes (see `scripts/setup_database.py`). The only CRUD transform is JSON (de)serialization of list/dict fields stored as strings: `clients.other_diagnoses`, `sessions.note_content`, `note_templates.sections`.

**Document normalization.** `AppwriteDB._normalize_document()` maps `$id`→`id`, `$createdAt`→`created_at`, `$updatedAt`→`updated_at` on every response.

**Authentication.** All protected endpoints use `therapist_id: str = Depends(get_current_user_id)`. Frontend sends Appwrite JWTs. The backend validates them by calling Appwrite's `/account` endpoint. Every row is owned via `therapist_id`.

## Collections (Appwrite) — minimal schema

See `DATABASE_SCHEMA.md` for the full relationship table. Four collections:

- `clients` — name, pronouns, date_of_birth, client_type, primary_diagnosis, other_diagnoses (JSON), high_risk, extra_info (encrypted PII)
- `sessions` — client_id, session_date, summary, note_format, note_content (JSON sections), template_id. The note lives inside the session (one note per session).
- `note_templates` — reusable section lists: name, base_format, sections (JSON)
- `user_settings` — one row per user: default_ehr, last_used_ehr

The app uses a dedicated Appwrite database (default id `therabee`, override with `APPWRITE_DATABASE_ID`). The full schema — database, collections, attributes, encryption, and indexes — is created by `scripts/setup_database.py` (run from backend venv, reads backend/.env; idempotent).

## EHR Sync (Chrome extension)
- **Settings:** `frontend/app/(protected)/settings/page.tsx` — default EHR selection + extension install instructions.
- **Templates:** `frontend/app/(protected)/templates/page.tsx` — create/edit reusable note templates (from a base format or from scratch).
- **Chrome extension:** `extension/` (MV3, load unpacked). Popup signs into Appwrite (email session → JWT → backend Bearer). Pick EHR → client → session note; the content script generically matches each note section to a field on the EHR page (confidence-scored, never fills uncertain fields) and syncs. Backend CORS allows `chrome-extension://` origins via `allow_origin_regex`.
- **Endpoints:** `/api/v1/clients/`, `/api/v1/sessions/`, `/api/v1/templates/`, `/api/v1/settings/`
