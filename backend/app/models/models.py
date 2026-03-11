"""
Pydantic Models for TherapistHelper
Used with Appwrite database
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
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
    background: Optional[str] = None
    notes: Optional[str] = None
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
    background: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=20)
    tags: Optional[List[str]] = None


class ClientResponse(ClientBase):
    """Model for client response (including encrypted fields)"""
    id: str
    full_name: Optional[str] = None
    full_name_encrypted: str
    background_encrypted: Optional[str] = None
    background: Optional[str] = None  # Decrypted
    date_of_birth: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tags: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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


# ============================================================================
# Session Clinical Sub-Models
# ============================================================================

class ClientPresentation(BaseModel):
    """How the client presented during the session"""
    mood_rating: Optional[int] = Field(None, ge=1, le=10)  # 1-10 scale
    affect: Optional[str] = Field(None, max_length=50)     # e.g. appropriate, flat, labile
    tags: List[str] = Field(default_factory=list)           # presenting issues / themes
    notes: Optional[str] = None                             # free text observations


class RiskAssessment(BaseModel):
    """Session risk assessment"""
    risk_level: Optional[str] = Field(None, max_length=20)        # none, low, moderate, high, imminent
    suicidal_ideation: Optional[str] = Field(None, max_length=50) # none, passive, active_without_plan, active_with_plan
    self_harm: Optional[bool] = None
    homicidal_ideation: Optional[bool] = None
    protective_factors: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class HomeworkItem(BaseModel):
    task: str
    completed: bool = False


class Homework(BaseModel):
    """Homework assigned / reviewed"""
    items: List[HomeworkItem] = Field(default_factory=list)
    notes: Optional[str] = None


class Planning(BaseModel):
    """Session planning / treatment goals"""
    goals: List[str] = Field(default_factory=list)
    interventions: List[str] = Field(default_factory=list)
    next_session_focus: Optional[str] = None
    notes: Optional[str] = None


class SessionCreate(SessionBase):
    """Model for creating a new session"""
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    analysis: Optional[Dict[str, Any]] = None
    client_presentation: Optional[ClientPresentation] = None
    risk_assessment: Optional[RiskAssessment] = None
    homework: Optional[Homework] = None
    planning: Optional[Planning] = None
    private_notes: Optional[str] = None


class SessionUpdate(BaseModel):
    """Model for updating a session"""
    duration_minutes: Optional[int] = Field(None, ge=1, le=180)
    session_type: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None
    client_presentation: Optional[ClientPresentation] = None
    risk_assessment: Optional[RiskAssessment] = None
    homework: Optional[Homework] = None
    planning: Optional[Planning] = None
    private_notes: Optional[str] = None


def _parse_json_field(v: Any) -> Optional[Any]:
    """Helper to parse a JSON string field into a dict/object."""
    if isinstance(v, str):
        if not v:
            return None
        try:
            import json
            return json.loads(v)
        except Exception:
            return None
    return v


class SessionResponse(SessionBase):
    """Model for session response"""
    id: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    tags: List[str] = []
    client_presentation: Optional[ClientPresentation] = None
    risk_assessment: Optional[RiskAssessment] = None
    homework: Optional[Homework] = None
    planning: Optional[Planning] = None
    private_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("analysis", "client_presentation", "risk_assessment", "homework", "planning", mode="before")
    @classmethod
    def parse_json_fields(cls, v):
        if isinstance(v, str):
            if not v:
                return None
            try:
                import json
                return json.loads(v)
            except Exception:
                return None
        return v

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
    created_at: Optional[datetime] = None


# ============================================================================
# Analysis Models
# ============================================================================

class IntakeAnalysisRequest(BaseModel):
    """Request model for client intake analysis"""
    background: str = Field(..., min_length=1)
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class IntakeAnalysisResponse(BaseModel):
    """Structured 8-field clinical intake assessment"""
    presenting_problem: str
    clinical_symptoms: str
    diagnosis: str
    case_formulation: str
    risk_level: str
    functioning_severity: str
    personality_patterns: str
    strengths_resources: str


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
    content: str = Field(..., min_length=1)
    tags: Optional[List[str]] = Field(default_factory=list)


class NoteUpdate(BaseModel):
    """Model for updating a note"""
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None


class NoteResponse(NoteBase):
    """Model for note response"""
    id: str
    content: str
    tags: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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
    created_at: Optional[datetime] = None


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


# ============================================================================
# Note Conversion Models
# ============================================================================

class NoteConvertRequest(BaseModel):
    """Request to convert free-text notes to a structured clinical format"""
    free_text: str = Field(..., min_length=1)
    target_format: str = Field(..., description="'BIRP', 'DAP', or 'SOAP'")


class NoteConvertResponse(BaseModel):
    """Structured note fields returned by AI conversion"""
    behavior: Optional[str] = None
    intervention: Optional[str] = None
    response: Optional[str] = None
    data: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None


# ============================================================================
# Chat Models
# ============================================================================

class ChatMode(str, Enum):
    INVESTIGATE = "investigate"
    ROLE_PLAY = "role_play"
    SUPERVISOR = "supervisor"


class PsychologicalSchool(str, Enum):
    CBT = "CBT"
    PSYCHOANALYTIC = "Psychoanalytic"
    HUMANISTIC = "Humanistic"
    EXISTENTIAL = "Existential"
    GESTALT = "Gestalt"
    ACT = "ACT"
    DBT = "DBT"
    NARRATIVE = "Narrative"
    SFBT = "SFBT"
    ADLERIAN = "Adlerian"
    BEHAVIORAL = "Behavioral"
    IPT = "IPT"


class ChatMessage(BaseModel):
    role: str
    content: str


class ClientChatRequest(BaseModel):
    client_id: str
    mode: ChatMode
    messages: List[ChatMessage]
    session_ids: Optional[List[str]] = None


class SchoolChatRequest(BaseModel):
    school: PsychologicalSchool
    messages: List[ChatMessage]
    client_context: Optional[str] = None
    session_ids: Optional[List[str]] = None


class ChatResponse(BaseModel):
    reply: str
    mode: Optional[str] = None
    school: Optional[str] = None
