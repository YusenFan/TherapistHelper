"""
Pydantic Models for TherapistHelper
Used with Appwrite database
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


# ============================================================================
# Client Models
# ============================================================================

class ClientBase(BaseModel):
    """Base client model"""
    age: int = Field(..., ge=0, le=120)
    gender: str = Field(..., max_length=50)
    custom_gender: Optional[str] = Field(None, max_length=100)
    race: Optional[str] = Field(None, max_length=50)
    occupation: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    status: str = Field(default="active", max_length=20)  # active, inactive, discharged


class ClientCreate(ClientBase):
    """Model for creating a new client"""
    full_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: Optional[str] = Field(None, max_length=20)  # ISO format
    background: Optional[str] = Field(None, max_length=5000)
    notes: Optional[str] = Field(None, max_length=5000)
    tags: Optional[List[str]] = Field(default_factory=list)


class ClientUpdate(BaseModel):
    """Model for updating a client"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = Field(None, max_length=50)
    custom_gender: Optional[str] = Field(None, max_length=100)
    race: Optional[str] = Field(None, max_length=50)
    occupation: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    background: Optional[str] = Field(None, max_length=5000)
    notes: Optional[str] = Field(None, max_length=5000)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=20)
    tags: Optional[List[str]] = None


class ClientResponse(ClientBase):
    """Model for client response (including encrypted fields)"""
    id: str
    full_name_encrypted: str
    background_encrypted: Optional[str] = None
    date_of_birth: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientDetail(ClientResponse):
    """Detailed client model with decrypted sensitive data"""
    full_name: str  # Decrypted
    background: Optional[str] = None  # Decrypted


# ============================================================================
# Intake Form Models
# ============================================================================

class IntakeForm(BaseModel):
    """Client intake form with detailed background"""
    client_id: str

    # Family structure and relationships
    family_structure: Optional[str] = Field(None, max_length=1000)
    parents_relationship: Optional[str] = Field(None, max_length=1000)

    # Major life events
    major_life_events: Optional[str] = Field(None, max_length=2000)

    # Health status
    physical_health: Optional[str] = Field(None, max_length=1000)
    mental_health: Optional[str] = Field(None, max_length=1000)
    medications: Optional[str] = Field(None, max_length=1000)

    # Work and education
    education_status: Optional[str] = Field(None, max_length=500)
    work_status: Optional[str] = Field(None, max_length=500)

    # Relationship status
    relationship_status: Optional[str] = Field(None, max_length=500)

    # Additional notes
    additional_notes: Optional[str] = Field(None, max_length=2000)


# ============================================================================
# Session Models
# ============================================================================

class SessionBase(BaseModel):
    """Base session model"""
    client_id: str
    session_date: datetime = Field(default_factory=datetime.utcnow)
    duration_minutes: int = Field(..., ge=1, le=180)
    session_type: str = Field(default="individual", max_length=20)  # individual, family, couple


class SessionCreate(SessionBase):
    """Model for creating a new session"""
    notes: Optional[str] = Field(None, max_length=5000)
    tags: Optional[List[str]] = Field(default_factory=list)


class SessionUpdate(BaseModel):
    """Model for updating a session"""
    duration_minutes: Optional[int] = Field(None, ge=1, le=180)
    session_type: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=5000)
    tags: Optional[List[str]] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None


class SessionResponse(SessionBase):
    """Model for session response"""
    id: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Transcript Models
# ============================================================================

class TranscriptUpload(BaseModel):
    """Model for transcript upload"""
    client_id: str
    audio_file_path: str
    language: Optional[str] = Field(None, max_length=10)  # e.g., 'en', 'zh'


class TranscriptResponse(BaseModel):
    """Model for transcript response"""
    id: str
    session_id: str
    transcript_text: str
    duration: float
    language: str
    created_at: datetime


# ============================================================================
# Analysis Models
# ============================================================================

class AnalysisRequest(BaseModel):
    """Model for AI analysis request"""
    transcript: str
    client_context: Optional[Dict[str, Any]] = None
    analysis_type: str = Field(default="full", max_length=20)  # full, summary, insights


class AnalysisResponse(BaseModel):
    """Model for AI analysis response"""
    summary: str
    key_points: List[str]
    emotional_state: str
    progress_indicators: List[str]
    recommendations: List[str]
    raw_response: Optional[str] = None


# ============================================================================
# Session Helper Models
# ============================================================================

class SessionAgendaRequest(BaseModel):
    """Model for session agenda generation"""
    client_id: str
    previous_sessions: Optional[List[str]] = None


class SessionAgendaResponse(BaseModel):
    """Model for session agenda response"""
    agenda: List[str]
    suggested_questions: List[str]
    engagement_activities: List[str]
    focus_areas: List[str]
    raw_response: Optional[str] = None


class SessionLogRequest(BaseModel):
    """Model for session log generation"""
    transcript: str
    client_context: Optional[Dict[str, Any]] = None


class SessionLogResponse(BaseModel):
    """Model for session log response"""
    session_date: str
    topics_discussed: List[str]
    observations: str
    interventions_used: List[str]
    homework_assigned: Optional[str]
    next_session_focus: str
    raw_response: Optional[str] = None


# ============================================================================
# Note Models
# ============================================================================

class NoteBase(BaseModel):
    """Base note model"""
    client_id: str
    note_type: str = Field(..., max_length=20)  # general, insight, reminder


class NoteCreate(NoteBase):
    """Model for creating a note"""
    content: str = Field(..., min_length=1, max_length=5000)
    tags: Optional[List[str]] = Field(default_factory=list)


class NoteUpdate(BaseModel):
    """Model for updating a note"""
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    tags: Optional[List[str]] = None


class NoteResponse(NoteBase):
    """Model for note response"""
    id: str
    content: str
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Attendance Models
# ============================================================================

class AttendanceRecord(BaseModel):
    """Client attendance record"""
    id: str
    client_id: str
    session_id: str
    scheduled_date: datetime
    attended: bool
    cancellation_reason: Optional[str] = None
    created_at: datetime


# ============================================================================
# Tag Models
# ============================================================================

class Tag(BaseModel):
    """Client tag"""
    id: str
    name: str
    color: Optional[str] = Field(None, max_length=7)  # Hex color


class ClientTagsResponse(BaseModel):
    """Response with all client tags"""
    tags: List[str]
    total_clients: int
