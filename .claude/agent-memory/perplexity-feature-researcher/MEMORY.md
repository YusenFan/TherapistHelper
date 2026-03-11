# Perplexity Feature Researcher — Agent Memory

## Session Notes Feature (researched 2026-03-11)
- BIRP is the most clinically appropriate format for TherapistHelper (behavioral/counseling focus)
- DAP is also popular in community mental health; SOAP is standard for medical/psychiatric teams
- HIPAA distinguishes progress notes (part of medical record, shareable) vs. psychotherapy notes (private, kept separately)
- Notes should be written within 24 hours; immediate post-session is ideal
- Required HIPAA fields for progress notes: session start/stop time, modality/frequency, diagnosis summary, functional status, treatment plan, symptoms, prognosis, progress to date
- See `session-notes-feature.md` for full field list and schema decisions

## Appwrite Sessions Collection
- Existing fields: client_id, session_date, duration_minutes, session_type, notes, transcript, summary, analysis (JSON), created_at, updated_at
- `notes` field is currently a plain freetext string — can store BIRP/DAP structured note as JSON string or extend schema
- `analysis` field is a JSON object — suitable for storing AI-generated structured content

## Frontend Routing Pattern
- New session page should be at `/sessions/new` (already linked from dashboard Quick Actions)
- Existing sessions list at `/sessions/page.tsx` uses mock data — real API wiring needed
- Client detail page exists at `/clients/[id]/page.tsx`

## Key Architecture Constraints (from project MEMORY.md)
- Appwrite DB calls are SYNC (requests library) — no await on db calls in CRUD
- Sessions collection does NOT have a `tags` field in Appwrite — do not send tags
- update_row uses PATCH, not PUT
