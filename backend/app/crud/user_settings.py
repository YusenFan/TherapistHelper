"""
User Settings CRUD operations for Appwrite

One settings document per user (EHR preferences etc.).
Auto-created with defaults on first access.
"""
from typing import Optional, Dict, Any
from app.core.appwrite_client import db
from app.core.config import settings
from app.models.models import UserSettingsUpdate
from appwrite.query import Query
from datetime import datetime


class UserSettingsCRUD:
    """User settings CRUD operations (one document per therapist)"""

    async def get_or_create(self, therapist_id: str) -> Dict[str, Any]:
        try:
            result = db.list_documents(
                collection_id=settings.COLLECTION_USER_SETTINGS,
                queries=[Query.equal("therapist_id", therapist_id)]
            )
            docs = result.get("documents", [])
            if docs:
                return docs[0]
        except Exception:
            pass

        now = datetime.utcnow().isoformat()
        return db.create_row(
            table_id=settings.COLLECTION_USER_SETTINGS,
            column_data={
                "therapist_id": therapist_id,
                "default_ehr": None,
                "last_used_ehr": None,
                "default_note_template": None,
                "created_at": now,
                "updated_at": now,
            }
        )

    async def update(self, therapist_id: str, obj_in: UserSettingsUpdate) -> Optional[Dict[str, Any]]:
        current = await self.get_or_create(therapist_id)
        update_data = obj_in.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            if hasattr(v, "value"):
                update_data[k] = v.value
        update_data["updated_at"] = datetime.utcnow().isoformat()
        try:
            return db.update_row(
                table_id=settings.COLLECTION_USER_SETTINGS,
                row_id=current["id"],
                column_data=update_data
            )
        except Exception as e:
            print(f"Error updating user settings: {e}")
            return None


# Global CRUD instance
user_settings_crud = UserSettingsCRUD()
