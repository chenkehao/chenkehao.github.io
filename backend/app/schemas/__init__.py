"""
Pydantic Schemas for API request/response validation
"""

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token,
    TokenData,
    TeamMemberCreate,
    TeamMemberResponse,
)
from app.schemas.candidate import (
    CandidateCreate,
    CandidateResponse,
    CandidateProfileCreate,
    CandidateProfileResponse,
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
)
from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobListResponse,
    JobTagCreate,
    JobTagResponse,
)
from app.schemas.flow import (
    FlowCreate,
    FlowUpdate,
    FlowResponse,
    FlowListResponse,
    FlowTimelineResponse,
)

__all__ = [
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenData",
    "TeamMemberCreate",
    "TeamMemberResponse",
    # Candidate
    "CandidateCreate",
    "CandidateResponse",
    "CandidateProfileCreate",
    "CandidateProfileResponse",
    "ResumeAnalysisRequest",
    "ResumeAnalysisResponse",
    # Job
    "JobCreate",
    "JobUpdate",
    "JobResponse",
    "JobListResponse",
    "JobTagCreate",
    "JobTagResponse",
    # Flow
    "FlowCreate",
    "FlowUpdate",
    "FlowResponse",
    "FlowListResponse",
    "FlowTimelineResponse",
]
