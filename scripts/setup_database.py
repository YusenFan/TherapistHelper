"""
Therabee — Appwrite database setup (new minimal schema).

Creates the dedicated database + 4 collections (clients, sessions,
note_templates, user_settings) with attributes, native encryption, and
indexes. Idempotent: re-running skips anything that already exists.

Run from the backend virtualenv (reads backend/.env):

    cd backend && source venv/bin/activate
    python ../scripts/setup_database.py

Required env: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
Optional env: APPWRITE_DATABASE_ID (default "therabee")
"""
import os
import sys
import time

from dotenv import load_dotenv

# Load backend/.env relative to this file (scripts/ is a sibling of backend/)
_HERE = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_HERE, "..", "backend", ".env"))

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException

ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
API_KEY = os.getenv("APPWRITE_API_KEY")
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "therabee")

if not all([PROJECT_ID, API_KEY]):
    print("❌ Missing APPWRITE_PROJECT_ID or APPWRITE_API_KEY in backend/.env")
    sys.exit(1)

client = Client().set_endpoint(ENDPOINT).set_project(PROJECT_ID).set_key(API_KEY)
databases = Databases(client)


def _exists(exc: AppwriteException) -> bool:
    """True if the error just means the resource already exists."""
    return exc.code == 409 or "already exists" in str(exc).lower()


def ensure_database():
    try:
        databases.create(database_id=DATABASE_ID, name="Therabee")
        print(f"✅ Created database '{DATABASE_ID}'")
    except AppwriteException as e:
        if _exists(e):
            print(f"• Database '{DATABASE_ID}' already exists")
        else:
            raise


def ensure_collection(cid: str, name: str):
    try:
        # Locked down: only the server API key may access. The backend
        # enforces per-therapist ownership; the web app never hits Appwrite DB
        # directly (only Appwrite Auth).
        databases.create_collection(
            database_id=DATABASE_ID,
            collection_id=cid,
            name=name,
            permissions=[],
            document_security=False,
        )
        print(f"✅ Created collection '{cid}'")
    except AppwriteException as e:
        if _exists(e):
            print(f"• Collection '{cid}' already exists")
        else:
            raise


def add_string(cid, key, size, required=False, encrypt=False, array=False):
    try:
        databases.create_string_attribute(
            database_id=DATABASE_ID,
            collection_id=cid,
            key=key,
            size=size,
            required=required,
            array=array,
            encrypt=encrypt,
        )
        tag = " 🔒" if encrypt else ""
        print(f"   - {cid}.{key} (string{tag})")
    except AppwriteException as e:
        if _exists(e):
            print(f"   - {cid}.{key} exists")
        else:
            print(f"   ⚠️  {cid}.{key}: {e}")


def add_bool(cid, key, required=False):
    try:
        databases.create_boolean_attribute(
            database_id=DATABASE_ID, collection_id=cid, key=key, required=required
        )
        print(f"   - {cid}.{key} (boolean)")
    except AppwriteException as e:
        if _exists(e):
            print(f"   - {cid}.{key} exists")
        else:
            print(f"   ⚠️  {cid}.{key}: {e}")


def wait_available(cid, keys, timeout=60):
    """Block until the given attributes finish processing (needed before indexes)."""
    deadline = time.time() + timeout
    pending = set(keys)
    while pending and time.time() < deadline:
        for key in list(pending):
            try:
                attr = databases.get_attribute(
                    database_id=DATABASE_ID, collection_id=cid, key=key
                )
                if attr.get("status") == "available":
                    pending.discard(key)
            except AppwriteException:
                pass
        if pending:
            time.sleep(1.5)
    if pending:
        print(f"   ⚠️  attributes still processing: {pending}")


def add_index(cid, key, attribute, index_type="key"):
    try:
        databases.create_index(
            database_id=DATABASE_ID,
            collection_id=cid,
            key=key,
            type=index_type,
            attributes=[attribute],
        )
        print(f"   - index {cid}.{key} ({index_type})")
    except AppwriteException as e:
        if _exists(e):
            print(f"   - index {cid}.{key} exists")
        else:
            print(f"   ⚠️  index {cid}.{key}: {e}")


def main():
    print(f"🚀 Setting up Therabee database on {ENDPOINT}\n")
    ensure_database()

    # ---- clients ----
    ensure_collection("clients", "Clients")
    add_string("clients", "therapist_id", 64, required=True)
    add_string("clients", "name", 512, required=True, encrypt=True)
    add_string("clients", "pronouns", 50)
    add_string("clients", "date_of_birth", 256, encrypt=True)
    add_string("clients", "client_type", 20)
    add_string("clients", "primary_diagnosis", 512, encrypt=True)
    add_string("clients", "other_diagnoses", 4096, encrypt=True)
    add_bool("clients", "high_risk")
    add_string("clients", "extra_info", 8192, encrypt=True)
    add_string("clients", "created_at", 40)
    add_string("clients", "updated_at", 40)
    wait_available("clients", ["therapist_id"])
    add_index("clients", "idx_therapist", "therapist_id")

    # ---- sessions ----
    ensure_collection("sessions", "Sessions")
    add_string("sessions", "therapist_id", 64, required=True)
    add_string("sessions", "client_id", 64, required=True)
    add_string("sessions", "session_date", 40, required=True)
    add_string("sessions", "summary", 50000, encrypt=True)
    add_string("sessions", "note_format", 20)
    add_string("sessions", "note_content", 100000, encrypt=True)
    add_string("sessions", "template_id", 64)
    add_string("sessions", "created_at", 40)
    add_string("sessions", "updated_at", 40)
    wait_available("sessions", ["therapist_id", "client_id"])
    add_index("sessions", "idx_therapist", "therapist_id")
    add_index("sessions", "idx_client", "client_id")

    # ---- note_templates ----
    ensure_collection("note_templates", "Note Templates")
    add_string("note_templates", "therapist_id", 64, required=True)
    add_string("note_templates", "name", 100, required=True)
    add_string("note_templates", "base_format", 20)
    add_string("note_templates", "sections", 6000, required=True)
    add_string("note_templates", "created_at", 40)
    add_string("note_templates", "updated_at", 40)
    wait_available("note_templates", ["therapist_id"])
    add_index("note_templates", "idx_therapist", "therapist_id")

    # ---- user_settings ----
    ensure_collection("user_settings", "User Settings")
    add_string("user_settings", "therapist_id", 64, required=True)
    add_string("user_settings", "default_ehr", 40)
    add_string("user_settings", "last_used_ehr", 40)
    add_string("user_settings", "created_at", 40)
    add_string("user_settings", "updated_at", 40)
    wait_available("user_settings", ["therapist_id"])
    add_index("user_settings", "idx_therapist", "therapist_id", index_type="unique")

    print("\n✨ Done. Database is ready.")


if __name__ == "__main__":
    main()
