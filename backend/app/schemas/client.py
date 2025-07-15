from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class ClientBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200, description="Client's full name")
    age: int = Field(..., ge=0, le=120, description="Client's age")
    gender: str = Field(..., min_length=1, max_length=50, description="Client's gender")
    custom_gender: Optional[str] = Field(None, max_length=100, description="Custom gender specification")
    background: Optional[str] = Field(None, max_length=2400, description="Client background information")
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()
    
    @validator('gender')
    def validate_gender(cls, v):
        allowed_genders = ['female', 'male', 'non-binary', 'prefer-not-to-say', 'other']
        if v not in allowed_genders:
            raise ValueError(f'Gender must be one of: {", ".join(allowed_genders)}')
        return v


class ClientCreate(ClientBase):
    """Schema for creating a new client"""
    pass


class ClientUpdate(BaseModel):
    """Schema for updating an existing client"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = Field(None, min_length=1, max_length=50)
    custom_gender: Optional[str] = Field(None, max_length=100)
    background: Optional[str] = Field(None, max_length=2400)
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Full name cannot be empty')
        return v.strip() if v else v
    
    @validator('gender')
    def validate_gender(cls, v):
        if v is not None:
            allowed_genders = ['female', 'male', 'non-binary', 'prefer-not-to-say', 'other']
            if v not in allowed_genders:
                raise ValueError(f'Gender must be one of: {", ".join(allowed_genders)}')
        return v


class ClientResponse(ClientBase):
    """Schema for client responses"""
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ClientListResponse(BaseModel):
    """Schema for client list responses"""
    id: int
    uuid: str
    full_name: str
    age: int
    gender: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Schema for error responses"""
    detail: str
    error_code: Optional[str] = None 