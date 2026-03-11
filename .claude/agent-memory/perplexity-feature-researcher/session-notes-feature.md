# Session Notes Feature — Detailed Research Notes

## Clinical Note Formats Compared

### BIRP (Behavior, Intervention, Response, Plan)
- Best for counseling/behavioral health — most relevant to TherapistHelper
- B: Observed client behavior, mood, affect, presenting concerns this session
- I: Therapeutic interventions used (CBT techniques, EMDR, Motivational Interviewing, etc.)
- R: Client's response to interventions during the session
- P: Plan for next session, homework assigned, referrals

### DAP (Data, Assessment, Plan)
- Popular in community mental health, narrative-heavy
- D: Objective/subjective data from session (what client said + therapist observations)
- A: Clinical assessment, progress toward goals, diagnosis updates
- P: Next steps, homework, follow-up

### SOAP (Subjective, Objective, Assessment, Plan)
- Standard in medical/psychiatric contexts, less common in pure counseling
- S: Client's self-report
- O: Objective clinician observations (appearance, affect, cognition)
- A: Assessment/diagnosis
- P: Plan

## Core Fields Every Post-Session Note Needs

### Administrative / Required by HIPAA
- session_date (datetime)
- session_start_time / session_end_time — or duration_minutes
- session_type (individual, family, couple, group)
- modality / approach (CBT, DBT, EMDR, person-centred, etc.)

### Clinical Content
- presenting_concerns: What the client brought to this session
- mood_rating: Numeric 1–10 scale (client self-report)
- affect: Observed emotional tone (flat, congruent, labile, anxious, etc.) — dropdown
- appearance: Brief note on presentation (grooming, eye contact, psychomotor)
- interventions_used: List/multi-select of techniques used this session
- client_response: How the client responded to the interventions
- progress_toward_goals: Free text or scale (regressed / unchanged / progressing / achieved)

### Risk
- risk_level: None / Low / Moderate / High
- suicidality_screened: boolean
- safety_plan_updated: boolean
- risk_notes: Free text if any risk flag raised

### Homework & Planning
- homework_assigned: Text — what was assigned
- homework_completion: (only relevant if reviewing last session) — % or descriptive
- next_session_focus: What to address next time
- follow_up_actions: Referrals, medication review, crisis contacts to notify

### Private Process Notes (kept separate from progress notes per HIPAA)
- therapist_private_notes: Internal observations, hypotheses, countertransference — NOT part of the official record

## UX Best Practices Discovered

1. **Note format selector at the top** — let therapist choose BIRP / DAP / SOAP, then show the right sections
2. **Auto-populate from previous session** — pull last session's plan/homework as context
3. **Structured fields + free text areas** — don't force only dropdowns; therapists need narrative space
4. **Mood rating with visual slider** (1–10), not a bare number input
5. **Multi-select interventions** with common therapy techniques pre-loaded as chips
6. **Risk flag section** should be visually distinct (colored border) to signal clinical importance
7. **Save draft + Finalize** two-stage workflow — therapists often fill notes in pieces
8. **Session timer** shown at top of form — start/end time auto-populated if possible
9. **Client context panel** (sidebar or collapsed section) — show client background + last session summary as reference while writing

## Appwrite Schema Decisions

### Use existing `notes` field as BIRP/DAP structured JSON string
- Store a stringified JSON object with the BIRP sections inside `notes`
- Avoids schema migration for MVP
- Example: `{"format":"BIRP","behavior":"...","intervention":"...","response":"...","plan":"..."}`

### Use existing `analysis` JSON field for:
- mood_rating, affect, risk_level, interventions_used[], homework_assigned, next_session_focus
- This is already a Dict[str, Any] in the model — flexible enough

### Fields that need NEW Appwrite collection attributes (if strict typed storage desired):
- mood_rating (integer 1–10)
- risk_level (string enum)
- session_format (string: BIRP/DAP/SOAP)
- But for MVP: pack into `analysis` JSON to avoid schema changes

## API Endpoints Needed

- PATCH /api/v1/sessions/{session_id} — already exists (SessionUpdate), can accept notes + analysis
- POST /api/v1/sessions/ — already exists (SessionCreate)
- GET /api/v1/sessions/client/{client_id} — already exists, used to show previous session context
- GET /api/v1/clients/{client_id} — needed to show client context panel in the form

## Frontend Page Structure: /sessions/new

### Query params: ?client_id=xxx (pre-select client)
### Or navigate from client profile page

Sections of the form:
1. Header bar: Client selector, session date/time, duration, session type
2. Note format selector: BIRP / DAP / Free text
3. Dynamic note body based on format
4. Mood & Affect row: slider + dropdown
5. Interventions used: multi-select chips
6. Risk assessment panel: colored, distinct
7. Homework & Next session plan
8. Private notes (clearly labeled "not part of official record")
9. Action buttons: Save Draft | Finalize Session
