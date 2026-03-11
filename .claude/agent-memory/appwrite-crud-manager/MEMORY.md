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

## All 5 Collections (Database: 69ae233c0026eb1facc0)

| Collection Name | Collection ID |
|---|---|
| clients    | clients    |
| sessions   | sessions   |
| notes      | notes      |
| tags       | tags       |
| attendance | attendance |

Note: Collection IDs are the same as collection names (human-readable slugs).

## clients Collection Schema (ID: `clients`)

| Attribute             | Type     | Required | Max Size   |
|-----------------------|----------|----------|------------|
| full_name_encrypted   | string   | YES      | 200 chars  |
| background_encrypted  | string   | NO       | 10,000 chars |
| age                   | integer  | YES      | —          |
| gender                | string   | YES      | 50 chars   |
| custom_gender         | string   | NO       | 100 chars  |
| race                  | string   | NO       | 50 chars   |
| occupation            | string   | NO       | 100 chars  |
| date_of_birth         | string   | NO       | 20 chars   |
| notes                 | string   | NO       | 5,000 chars |
| phone                 | string   | NO       | 20 chars   |
| email                 | string   | NO       | 100 chars  |
| status                | string   | NO       | 20 chars   |
| created_at            | datetime | NO       | —          |
| updated_at            | datetime | NO       | —          |
| therapist_id          | string   | NO       | 100 chars  |

Note: `therapist_id` was added 2026-03-11. No `tags` field exists on clients.

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

## tags Collection Schema (ID: `tags`)

| Attribute | Type   | Required | Max Size |
|-----------|--------|----------|----------|
| name      | string | YES      | 100 chars |
| color     | string | NO       | 7 chars  |

## attendance Collection Schema (ID: `attendance`)

| Attribute           | Type     | Required | Max Size  |
|---------------------|----------|----------|-----------|
| client_id           | string   | YES      | 50 chars  |
| session_id          | string   | YES      | 50 chars  |
| scheduled_date      | datetime | YES      |           |
| attended            | boolean  | YES      |           |
| cancellation_reason | string   | NO       | 500 chars |
| created_at          | datetime | NO       |           |
