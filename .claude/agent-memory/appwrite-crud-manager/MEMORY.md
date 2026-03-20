# Appwrite CRUD Manager Memory

## CLI Auth Pattern
The Appwrite CLI has a BigInt serialization bug that prevents table rendering for list-collections and list-attributes.
Workaround: use direct REST API calls with curl instead of the CLI for these commands.

Auth config that works:
```bash
appwrite client \
  --endpoint https://sgp.cloud.appwrite.io/v1 \
  --project-id 69adbd67003e41b04c1f \
  --key <API_KEY_FROM_backend/.env>
```

## Active Collections (Database: 69ae233c0026eb1facc0)

| Collection Name       | Collection ID         |
|-----------------------|-----------------------|
| clients               | clients               |
| sessions              | sessions              |
| session_notes         | session_notes         |
| clinical_assessments  | clinical_assessments  |

Note: Collection IDs are the same as collection names (human-readable slugs).
`notes`, `tags`, and `attendance` collections were deleted on 2026-03-15 (v3 migration).

## clients Collection Schema (ID: `clients`) — verified live 2026-03-17

28 attributes total. All are optional (required=false). None have enum constraints.

| Attribute                      | Type     | Array | Encrypted | Size     |
|-------------------------------|----------|-------|-----------|----------|
| therapist_id                   | string   | no    | no        | 100      |
| administrative_sex             | string   | no    | no        | 30       |
| gender_identity                | string   | no    | no        | 50       |
| gender_identity_other          | string   | no    | no        | 100      |
| pronouns                       | string   | no    | no        | 50       |
| sexual_orientation             | string   | no    | no        | 50       |
| sexual_orientation_other       | string   | no    | no        | 100      |
| race_other                     | string   | no    | no        | 100      |
| ethnicity_other                | string   | no    | no        | 100      |
| smoking_status                 | string   | no    | no        | 30       |
| marital_status                 | string   | no    | no        | 30       |
| employment_status              | string   | no    | no        | 30       |
| occupation_title               | string   | no    | no        | 100      |
| religious_spiritual_affiliation| string   | no    | no        | 100      |
| full_name_encrypted            | string   | no    | YES       | 500      |
| preferred_name_encrypted       | string   | no    | YES       | 500      |
| date_of_birth_encrypted        | string   | no    | YES       | 500      |
| email_encrypted                | string   | no    | YES       | 500      |
| phone_encrypted                | string   | no    | YES       | 500      |
| background_summary_encrypted   | string   | no    | YES       | 65535    |
| approximate_age                | integer  | no    | —         | BigInt   |
| race_values                    | string   | YES   | no        | 100/elem |
| ethnicity_values               | string   | YES   | no        | 100/elem |
| language_codes                 | string   | YES   | no        | 20/elem  |
| created_at                     | datetime | no    | —         | —        |
| updated_at                     | datetime | no    | —         | —        |
| archived_at                    | datetime | no    | —         | —        |
| status                         | string   | no    | no        | 20       |

Note: listAttributes API silently caps at 25 results despite total=28. Fetch status/updated_at/archived_at individually if needed. No `tags`, `age`, `gender`, `race`, `occupation`, `notes`, `phone`, or `email` plain-text fields exist — v3 schema replaced them.

## sessions Collection Schema (ID: `sessions`)

| Attribute            | Type     | Required | Max Size / Constraint        |
|----------------------|----------|----------|------------------------------|
| client_id            | string   | YES      | 50 chars                     |
| session_date         | datetime | YES      |                              |
| duration_minutes     | integer  | YES      | BigInt range                 |
| session_type         | string   | NO       | 20 chars                     |
| transcript           | string   | NO       | 50,000 chars                 |
| summary              | string   | NO       | 5,000 chars                  |
| notes                | string   | NO       | 5,000 chars                  |
| created_at           | datetime | NO       |                              |
| updated_at           | datetime | NO       |                              |
| tags                 | string[] | NO       | 100 chars/element, array     |
| analysis             | longtext | NO       | unlimited (stores JSON)      |
| client_presentation  | string   | NO       | 5,000 chars                  |
| risk_assessment      | longtext | NO       | unlimited                    |
| homework             | longtext | NO       | unlimited                    |
| planning             | longtext | NO       | unlimited                    |
| private_notes        | longtext | NO       | unlimited (private/process)  |

Note: sessions is at the Appwrite plan string-attribute cap (12 string-type). New large-text fields must use `longtext` type.
`longtext` type bypasses the size-based string limit and does not count toward same cap — use it for large text fields.

## notes Collection Schema (ID: `notes`)

| Attribute  | Type     | Required | Max Size |
|------------|----------|----------|----------|
| client_id  | string   | YES      | 50 chars |
| note_type  | string   | YES      | 20 chars |
| content    | string   | YES      | 5,000 chars |
| created_at | datetime | NO       |          |
| updated_at | datetime | NO       |          |

