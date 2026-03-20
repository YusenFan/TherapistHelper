"""
Pydantic Models for TherapistHelper
Used with Appwrite database

Encryption note: Sensitive fields are stored with '_encrypted' suffix in Appwrite
and have Appwrite-native encryption enabled. The API sends/receives plaintext —
Appwrite handles encryption at rest transparently.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import json


# ============================================================================
# Enums
# ============================================================================

class ClientStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCHARGED = "discharged"


class AssessmentType(str, Enum):
    INTAKE = "intake"
    REASSESSMENT = "reassessment"
    DISCHARGE_SUMMARY = "discharge_summary"


class SessionType(str, Enum):
    INDIVIDUAL = "individual"
    COUPLE = "couple"
    FAMILY = "family"
    GROUP = "group"


class SessionModality(str, Enum):
    IN_PERSON = "in_person"
    TELEHEALTH = "telehealth"
    PHONE = "phone"
    OTHER = "other"


class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class NoteFormat(str, Enum):
    FREE = "free"
    BIRP = "birp"
    DAP = "dap"
    SOAP = "soap"


# ============================================================================
# Client Models
# ============================================================================

class ClientCreate(BaseModel):
    """Model for creating a new client.
    Plaintext fields (full_name, email, etc.) are mapped to _encrypted
    Appwrite attributes in the CRUD layer.
    """
    full_name: str = Field(..., min_length=1, max_length=200)
    preferred_name: Optional[str] = Field(None, max_length=200)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    approximate_age: Optional[int] = Field(None, ge=0, le=120)
    administrative_sex: Optional[str] = Field(None, max_length=30)
    gender_identity: Optional[str] = Field(None, max_length=50)
    gender_identity_other: Optional[str] = Field(None, max_length=100)
    pronouns: Optional[str] = Field(None, max_length=50)
    sexual_orientation: Optional[str] = Field(None, max_length=50)
    sexual_orientation_other: Optional[str] = Field(None, max_length=100)
    race_values: Optional[List[str]] = Field(default_factory=list)
    race_other: Optional[str] = Field(None, max_length=100)
    ethnicity_values: Optional[List[str]] = Field(default_factory=list)
    ethnicity_other: Optional[str] = Field(None, max_length=100)
    language_codes: Optional[List[str]] = Field(default_factory=list)
    smoking_status: Optional[str] = Field(None, max_length=30)
    marital_status: Optional[str] = Field(None, max_length=30)
    employment_status: Optional[str] = Field(None, max_length=30)
    occupation_title: Optional[str] = Field(None, max_length=100)
    religious_spiritual_affiliation: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    background_summary: Optional[str] = None
    status: ClientStatus = ClientStatus.ACTIVE


class ClientUpdate(BaseModel):
    """Model for updating a client"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    preferred_name: Optional[str] = Field(None, max_length=200)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    approximate_age: Optional[int] = Field(None, ge=0, le=120)
    administrative_sex: Optional[str] = Field(None, max_length=30)
    gender_identity: Optional[str] = Field(None, max_length=50)
    gender_identity_other: Optional[str] = Field(None, max_length=100)
    pronouns: Optional[str] = Field(None, max_length=50)
    sexual_orientation: Optional[str] = Field(None, max_length=50)
    sexual_orientation_other: Optional[str] = Field(None, max_length=100)
    race_values: Optional[List[str]] = None
    race_other: Optional[str] = Field(None, max_length=100)
    ethnicity_values: Optional[List[str]] = None
    ethnicity_other: Optional[str] = Field(None, max_length=100)
    language_codes: Optional[List[str]] = None
    smoking_status: Optional[str] = Field(None, max_length=30)
    marital_status: Optional[str] = Field(None, max_length=30)
    employment_status: Optional[str] = Field(None, max_length=30)
    occupation_title: Optional[str] = Field(None, max_length=100)
    religious_spiritual_affiliation: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    background_summary: Optional[str] = None
    status: Optional[ClientStatus] = None
    archived_at: Optional[datetime] = None


class ClientResponse(BaseModel):
    """Model for client response"""
    id: str
    therapist_id: Optional[str] = None
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    approximate_age: Optional[int] = None
    administrative_sex: Optional[str] = None
    gender_identity: Optional[str] = None
    gender_identity_other: Optional[str] = None
    pronouns: Optional[str] = None
    sexual_orientation: Optional[str] = None
    sexual_orientation_other: Optional[str] = None
    race_values: List[str] = []
    race_other: Optional[str] = None
    ethnicity_values: List[str] = []
    ethnicity_other: Optional[str] = None
    language_codes: List[str] = []
    smoking_status: Optional[str] = None
    marital_status: Optional[str] = None
    employment_status: Optional[str] = None
    occupation_title: Optional[str] = None
    religious_spiritual_affiliation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    background_summary: Optional[str] = None
    status: Optional[str] = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Clinical Assessment Models
# ============================================================================

class ClinicalAssessmentCreate(BaseModel):
    """Model for creating a clinical assessment"""
    client_id: str
    assessment_type: AssessmentType
    assessment_date: Optional[datetime] = None
    is_current: bool = True
    version: int = 1
    identification_summary: Optional[str] = None
    presenting_problem: Optional[str] = None
    psychiatric_history: Optional[str] = None
    trauma_history: Optional[str] = None
    family_psychiatric_history: Optional[str] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    substance_use: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    spiritual_cultural_factors: Optional[str] = None
    developmental_history: Optional[str] = None
    educational_vocational_history: Optional[str] = None
    legal_history: Optional[str] = None
    snap_strengths: Optional[str] = None
    snap_needs: Optional[str] = None
    snap_abilities: Optional[str] = None
    snap_preferences: Optional[str] = None
    diagnosis_impressions: Optional[str] = None
    risk_summary: Optional[str] = None
    treatment_goals: Optional[str] = None


class ClinicalAssessmentUpdate(BaseModel):
    """Model for updating a clinical assessment"""
    assessment_type: Optional[AssessmentType] = None
    assessment_date: Optional[datetime] = None
    is_current: Optional[bool] = None
    version: Optional[int] = None
    identification_summary: Optional[str] = None
    presenting_problem: Optional[str] = None
    psychiatric_history: Optional[str] = None
    trauma_history: Optional[str] = None
    family_psychiatric_history: Optional[str] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    substance_use: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    spiritual_cultural_factors: Optional[str] = None
    developmental_history: Optional[str] = None
    educational_vocational_history: Optional[str] = None
    legal_history: Optional[str] = None
    snap_strengths: Optional[str] = None
    snap_needs: Optional[str] = None
    snap_abilities: Optional[str] = None
    snap_preferences: Optional[str] = None
    diagnosis_impressions: Optional[str] = None
    risk_summary: Optional[str] = None
    treatment_goals: Optional[str] = None


class ClinicalAssessmentResponse(BaseModel):
    """Model for clinical assessment response"""
    id: str
    client_id: str
    therapist_id: Optional[str] = None
    assessment_type: str
    assessment_date: Optional[datetime] = None
    is_current: Optional[bool] = False
    version: Optional[int] = 1
    identification_summary: Optional[str] = None
    presenting_problem: Optional[str] = None
    psychiatric_history: Optional[str] = None
    trauma_history: Optional[str] = None
    family_psychiatric_history: Optional[str] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    substance_use: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    spiritual_cultural_factors: Optional[str] = None
    developmental_history: Optional[str] = None
    educational_vocational_history: Optional[str] = None
    legal_history: Optional[str] = None
    snap_strengths: Optional[str] = None
    snap_needs: Optional[str] = None
    snap_abilities: Optional[str] = None
    snap_preferences: Optional[str] = None
    diagnosis_impressions: Optional[str] = None
    risk_summary: Optional[str] = None
    treatment_goals: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Session Models
# ============================================================================

class FollowupAction(BaseModel):
    """A single follow-up action item"""
    task: str
    owner: Optional[str] = None
    due_date: Optional[str] = None
    status: str = "pending"


class SessionCreate(BaseModel):
    """Model for creating a new session"""
    client_id: str
    session_date: datetime = Field(default_factory=datetime.utcnow)
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    session_type: SessionType = SessionType.INDIVIDUAL
    modality: SessionModality = SessionModality.IN_PERSON
    status: SessionStatus = SessionStatus.SCHEDULED
    selected_note_format: Optional[NoteFormat] = None
    next_focus: Optional[str] = None
    followup_actions: Optional[List[FollowupAction]] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None


class SessionUpdate(BaseModel):
    """Model for updating a session"""
    session_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    session_type: Optional[SessionType] = None
    modality: Optional[SessionModality] = None
    status: Optional[SessionStatus] = None
    selected_note_format: Optional[NoteFormat] = None
    next_focus: Optional[str] = None
    followup_actions: Optional[List[FollowupAction]] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None


class SessionResponse(BaseModel):
    """Model for session response"""
    id: str
    client_id: str
    therapist_id: Optional[str] = None
    session_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    session_type: Optional[str] = "individual"
    modality: Optional[str] = "in_person"
    status: Optional[str] = "scheduled"
    selected_note_format: Optional[str] = None
    next_focus: Optional[str] = None
    followup_actions: Optional[List[FollowupAction]] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("followup_actions", mode="before")
    @classmethod
    def parse_followup_actions(cls, v):
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
# Session Note Models
# ============================================================================

class SessionNoteCreate(BaseModel):
    """Model for creating a session note"""
    session_id: str
    client_id: str
    note_format: NoteFormat
    free_content: Optional[str] = None
    birp_behavior: Optional[str] = None
    birp_intervention: Optional[str] = None
    birp_response: Optional[str] = None
    birp_plan: Optional[str] = None
    dap_data: Optional[str] = None
    dap_assessment: Optional[str] = None
    dap_plan: Optional[str] = None
    soap_subjective: Optional[str] = None
    soap_objective: Optional[str] = None
    soap_assessment: Optional[str] = None
    soap_plan: Optional[str] = None
    is_finalized: bool = False


class SessionNoteUpdate(BaseModel):
    """Model for updating a session note"""
    note_format: Optional[NoteFormat] = None
    free_content: Optional[str] = None
    birp_behavior: Optional[str] = None
    birp_intervention: Optional[str] = None
    birp_response: Optional[str] = None
    birp_plan: Optional[str] = None
    dap_data: Optional[str] = None
    dap_assessment: Optional[str] = None
    dap_plan: Optional[str] = None
    soap_subjective: Optional[str] = None
    soap_objective: Optional[str] = None
    soap_assessment: Optional[str] = None
    soap_plan: Optional[str] = None
    is_finalized: Optional[bool] = None


class SessionNoteResponse(BaseModel):
    """Model for session note response"""
    id: str
    session_id: str
    client_id: str
    therapist_id: Optional[str] = None
    note_format: str
    free_content: Optional[str] = None
    birp_behavior: Optional[str] = None
    birp_intervention: Optional[str] = None
    birp_response: Optional[str] = None
    birp_plan: Optional[str] = None
    dap_data: Optional[str] = None
    dap_assessment: Optional[str] = None
    dap_plan: Optional[str] = None
    soap_subjective: Optional[str] = None
    soap_objective: Optional[str] = None
    soap_assessment: Optional[str] = None
    soap_plan: Optional[str] = None
    is_finalized: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Transcript Models
# ============================================================================

class TranscriptUpload(BaseModel):
    """Model for transcript upload"""
    client_id: str
    audio_file_path: str
    language: Optional[str] = Field(None, max_length=10)


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
    """Structured clinical intake assessment matching clinical_assessments schema"""
    identification: Optional[str] = ""
    presenting_problem: Optional[str] = ""
    psychiatric_history: Optional[str] = ""
    trauma_history: Optional[str] = ""
    family_psychiatric_history: Optional[str] = ""
    medical_history: Optional[str] = ""
    current_medications: Optional[str] = ""
    substance_use: Optional[str] = ""
    family_history: Optional[str] = ""
    social_history: Optional[str] = ""
    spiritual_cultural_factors: Optional[str] = ""
    developmental_history: Optional[str] = ""
    educational_vocational_history: Optional[str] = ""
    legal_history: Optional[str] = ""
    snap_strengths: Optional[str] = ""
    snap_needs: Optional[str] = ""
    snap_abilities: Optional[str] = ""
    snap_preferences: Optional[str] = ""


class AnalysisRequest(BaseModel):
    """Model for AI analysis request"""
    transcript: str
    client_context: Optional[Dict[str, Any]] = None
    analysis_type: str = Field(default="full", max_length=20)


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


class SchoolChatRequest(BaseModel):
    client_id: str
    school: PsychologicalSchool
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    mode: Optional[str] = None
    school: Optional[str] = None
