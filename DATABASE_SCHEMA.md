# Therabee — New Minimal Database Schema

This is the rebuilt "minimum but essential" data model for the new Therabee
workflow. It replaces the previous 8‑collection design (clients, sessions,
session_notes, clinical_assessments, note_templates, user_settings,
transfer_logs, waitlist) with **4 collections**.

Backend: Appwrite Cloud. Auth/users are managed by Appwrite Auth (not a
collection). Every row is owned by a therapist via `therapist_id` = the
Appwrite user `$id`.

## Entity relationships

```
┌──────────────────────┐
│  Appwrite Auth User   │  (login / signup — managed by Appwrite, no collection)
│  $id = therapist_id   │
└───────────┬───────────┘
            │ 1
            │
    ┌───────┼───────────────┬───────────────────────┐
    │ N     │ N             │ N                     │ 1
    ▼       ▼               ▼                       ▼
┌─────────┐ ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
│ clients │ │ note_templates│ │ user_settings│ │ user_settings│
└────┬────┘ └───────┬───────┘ └──────────────┘ └──────────────┘
     │ 1            │ 0..1 (optional)
     │ N            │
     ▼              │
┌──────────┐        │
│ sessions │◀───────┘   sessions.template_id → note_templates.$id (nullable)
└──────────┘
```

Relationship summary:

| From | To | Cardinality | Foreign key |
|------|----|-------------|-------------|
| user | clients | 1 → N | `clients.therapist_id` |
| client | sessions | 1 → N | `sessions.client_id` |
| user | sessions | 1 → N | `sessions.therapist_id` (denormalized for fast listing) |
| user | note_templates | 1 → N | `note_templates.therapist_id` |
| note_template | sessions | 1 → N (optional) | `sessions.template_id` |
| user | user_settings | 1 → 1 | `user_settings.therapist_id` |

The saved note lives **inside** the session (one note per session), so there is
no separate `session_notes` collection. Note content is stored as structured
JSON keyed by section name, which supports every format and custom templates
without per‑format columns.

## Collections

Legend: `🔒` = Appwrite native at‑rest encryption (AES). Encrypted attributes
cannot be indexed or used in queries.

### 1. `clients`

| Attribute | Type | Size | Req | Enc | Notes |
|-----------|------|------|-----|-----|-------|
| `therapist_id` | string | 64 | ✓ | | Appwrite user `$id`; **indexed** |
| `name` | string | 512 | ✓ | 🔒 | Client full name |
| `pronouns` | string | 50 | | | e.g. "she/her" |
| `date_of_birth` | string | 256 | | 🔒 | ISO date `YYYY-MM-DD` |
| `client_type` | string | 20 | | | `individual` \| `couple` \| `family` \| `child_adolescent` |
| `primary_diagnosis` | string | 512 | | 🔒 | DSM‑5 code + label |
| `other_diagnoses` | string | 4096 | | 🔒 | JSON array of comorbidity strings |
| `high_risk` | boolean | — | | | Yes / No |
| `extra_info` | string | 8192 | | 🔒 | Free notes |
| `created_at` | string | 40 | | | ISO timestamp |
| `updated_at` | string | 40 | | | ISO timestamp |

Index: `therapist_id` (key).

### 2. `sessions`

| Attribute | Type | Size | Req | Enc | Notes |
|-----------|------|------|-----|-----|-------|
| `therapist_id` | string | 64 | ✓ | | Owner; **indexed** |
| `client_id` | string | 64 | ✓ | | → `clients.$id`; **indexed** |
| `session_date` | string | 40 | ✓ | | ISO date of session |
| `summary` | string | 50000 | | 🔒 | Long‑text session summary |
| `note_format` | string | 20 | | | `soap` \| `dap` \| `girp` \| `birp` \| `pirp` \| `sirp` \| `pie` \| `emdr` \| `mse_intake` \| `custom` |
| `note_content` | string | 100000 | | 🔒 | JSON object: `{ "<section>": "<text>" }` |
| `template_id` | string | 64 | | | → `note_templates.$id` (nullable) |
| `created_at` | string | 40 | | | ISO timestamp |
| `updated_at` | string | 40 | | | ISO timestamp |

Indexes: `therapist_id` (key), `client_id` (key).

### 3. `note_templates`

Reusable across any client/session. A template fixes the section list (and
optionally a base format) that a session note is built from.

| Attribute | Type | Size | Req | Enc | Notes |
|-----------|------|------|-----|-----|-------|
| `therapist_id` | string | 64 | ✓ | | Owner; **indexed** |
| `name` | string | 100 | ✓ | | Template display name |
| `base_format` | string | 20 | | | A built‑in format key, or `custom` |
| `sections` | string | 6000 | ✓ | | JSON array of section names, e.g. `["Subjective","Objective",...]` |
| `created_at` | string | 40 | | | ISO timestamp |
| `updated_at` | string | 40 | | | ISO timestamp |

Index: `therapist_id` (key).

### 4. `user_settings`

One row per user. Stores the Chrome‑extension EHR preference.

| Attribute | Type | Size | Req | Enc | Notes |
|-----------|------|------|-----|-----|-------|
| `therapist_id` | string | 64 | ✓ | | Owner; **indexed (unique)** |
| `default_ehr` | string | 40 | | | `therapynotes` \| `simplepractice` \| `janeapp` … |
| `last_used_ehr` | string | 40 | | | Last EHR used in the extension |
| `created_at` | string | 40 | | | ISO timestamp |
| `updated_at` | string | 40 | | | ISO timestamp |

Index: `therapist_id` (unique).

## Built‑in note formats → default sections

Stored client‑side (`frontend/lib/noteFormats.ts`) and used to seed templates:

| Format | Sections |
|--------|----------|
| SOAP | Subjective, Objective, Assessment, Plan |
| DAP | Data, Assessment, Plan |
| GIRP | Goal, Intervention, Response, Plan |
| BIRP | Behavior, Intervention, Response, Plan |
| PIRP | Problem, Intervention, Response, Plan |
| SIRP | Situation, Intervention, Response, Plan |
| PIE | Problem, Intervention, Evaluation |
| EMDR | Target Memory, Negative Cognition, Positive Cognition, SUDs/VOC, Desensitization, Installation, Body Scan, Closure |
| MSE Intake | Appearance, Behavior, Speech, Mood, Affect, Thought Process, Thought Content, Perception, Cognition, Insight & Judgment |

Custom templates define their own section list.
</invoke>
