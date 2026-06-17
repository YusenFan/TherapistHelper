"""
Pydantic models for Therabee (new minimal schema).

Encryption note: sensitive client/session fields are stored in Appwrite with
native at-rest encryption enabled on the attribute. The API sends/receives
plaintext — Appwrite encrypts transparently. No app-level mapping is required
because the column names match the model field names.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import json


# ============================================================================
# Enums
# ============================================================================

class ClientType(str, Enum):
    INDIVIDUAL = "individual"
    COUPLE = "couple"
    FAMILY = "family"
    CHILD_ADOLESCENT = "child_adolescent"


class NoteFormat(str, Enum):
    SOAP = "soap"
    DAP = "dap"
    GIRP = "girp"
    BIRP = "birp"
    PIRP = "pirp"
    SIRP = "sirp"
    PIE = "pie"
    EMDR = "emdr"
    MSE_INTAKE = "mse_intake"
    CUSTOM = "custom"


class EHRPlatform(str, Enum):
    THERAPYNOTES = "therapynotes"
    SIMPLEPRACTICE = "simplepractice"
    JANEAPP = "janeapp"


# ============================================================================
# Client
# ============================================================================

class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    pronouns: Optional[str] = Field(None, max_length=50)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    client_type: ClientType = ClientType.INDIVIDUAL
    primary_diagnosis: Optional[str] = Field(None, max_length=300)
    other_diagnoses: List[str] = Field(default_factory=list)
    high_risk: bool = False
    extra_info: Optional[str] = Field(None, max_length=8000)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    pronouns: Optional[str] = Field(None, max_length=50)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    client_type: Optional[ClientType] = None
    primary_diagnosis: Optional[str] = Field(None, max_length=300)
    other_diagnoses: Optional[List[str]] = None
    high_risk: Optional[bool] = None
    extra_info: Optional[str] = Field(None, max_length=8000)


class ClientResponse(BaseModel):
    id: str
    therapist_id: Optional[str] = None
    name: Optional[str] = None
    pronouns: Optional[str] = None
    date_of_birth: Optional[str] = None
    client_type: Optional[str] = "individual"
    primary_diagnosis: Optional[str] = None
    other_diagnoses: List[str] = []
    high_risk: Optional[bool] = False
    extra_info: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("other_diagnoses", mode="before")
    @classmethod
    def parse_other_diagnoses(cls, v):
        if isinstance(v, str):
            if not v:
                return []
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True


# ============================================================================
# Session (note embedded as JSON sections)
# ============================================================================

class SessionCreate(BaseModel):
    client_id: str
    session_date: datetime = Field(default_factory=datetime.utcnow)
    summary: Optional[str] = None
    note_format: Optional[NoteFormat] = None
    note_content: Optional[dict] = None  # { section_name: text }
    template_id: Optional[str] = None


class SessionUpdate(BaseModel):
    session_date: Optional[datetime] = None
    summary: Optional[str] = None
    note_format: Optional[NoteFormat] = None
    note_content: Optional[dict] = None
    template_id: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    therapist_id: Optional[str] = None
    client_id: str
    session_date: Optional[datetime] = None
    summary: Optional[str] = None
    note_format: Optional[str] = None
    note_content: Optional[dict] = None
    template_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("note_content", mode="before")
    @classmethod
    def parse_note_content(cls, v):
        if isinstance(v, str):
            if not v:
                return None
            try:
                return json.loads(v)
            except Exception:
                return None
        return v

    class Config:
        from_attributes = True


# ============================================================================
# Note Template
# ============================================================================

class NoteTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    base_format: Optional[str] = Field(None, max_length=20)
    sections: List[str] = Field(..., min_length=1)


class NoteTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    base_format: Optional[str] = Field(None, max_length=20)
    sections: Optional[List[str]] = None


class NoteTemplateResponse(BaseModel):
    id: str
    therapist_id: Optional[str] = None
    name: str
    base_format: Optional[str] = None
    sections: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("sections", mode="before")
    @classmethod
    def parse_sections(cls, v):
        if isinstance(v, str):
            if not v:
                return []
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True


# ============================================================================
# User Settings (EHR preference)
# ============================================================================

class UserSettingsUpdate(BaseModel):
    default_ehr: Optional[EHRPlatform] = None
    last_used_ehr: Optional[EHRPlatform] = None


class UserSettingsResponse(BaseModel):
    id: str
    therapist_id: str
    default_ehr: Optional[str] = None
    last_used_ehr: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
