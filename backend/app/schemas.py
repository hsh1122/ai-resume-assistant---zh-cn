from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class OptimizeRequest(BaseModel):
    """Request payload for resume optimization."""

    resume_text: str = Field(..., min_length=1)
    jd_text: str = Field(..., min_length=1)
    style: str = Field(default="Professional", min_length=1)


class OptimizeResponse(BaseModel):
    """Response payload returned to frontend after optimization."""

    optimized_resume: str
    match_analysis: str
    suggestions: List[str]
    result_source: Optional[str] = None
    fallback_reason: Optional[str] = None


class RecordResponse(BaseModel):
    """DB record payload returned to frontend."""

    id: int
    original_resume: str
    jd_text: str
    style: str
    optimized_resume: str
    match_analysis: str
    suggestions: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecordSummaryResponse(BaseModel):
    """Lightweight record payload returned to history lists."""

    id: int
    display_number: int
    style: str
    preview_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecordsPageResponse(BaseModel):
    """Paginated records response for history list."""

    items: List[RecordSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DeleteRecordResponse(BaseModel):
    message: str


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    password: str = Field(..., min_length=6, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
