"""
Flow Schemas
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.flow import FlowStatus, FlowStage


# --- Flow Timeline Schema ---

class FlowTimelineResponse(BaseModel):
    """Flow timeline event response"""
    id: int
    action: str
    agent_name: Optional[str] = None
    tokens_used: int
    timestamp: datetime

    class Config:
        from_attributes = True


# --- Flow Step Schema ---

class FlowStepResponse(BaseModel):
    """Flow step response"""
    id: int
    name: str
    stage: FlowStage
    order: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    result: Optional[str] = None
    score: Optional[float] = None

    class Config:
        from_attributes = True


# --- Flow Schemas ---

class FlowCreate(BaseModel):
    """Create flow schema"""
    candidate_id: int
    job_id: int


class FlowUpdate(BaseModel):
    """Update flow schema"""
    status: Optional[FlowStatus] = None
    current_stage: Optional[FlowStage] = None
    next_action: Optional[str] = None
    next_schedule: Optional[datetime] = None
    details: Optional[str] = None


class FlowResponse(BaseModel):
    """Flow response schema"""
    id: int
    candidate_id: int
    job_id: int
    recruiter_id: int
    status: FlowStatus
    current_stage: FlowStage
    current_step: int
    match_score: float
    tokens_consumed: int
    next_action: Optional[str] = None
    next_schedule: Optional[datetime] = None
    agents_used: Optional[List[str]] = None
    details: Optional[str] = None
    last_action: Optional[str] = None
    steps: List[FlowStepResponse] = []
    timeline: List[FlowTimelineResponse] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FlowListResponse(BaseModel):
    """Flow list response with pagination"""
    items: List[FlowResponse]
    total: int
    page: int
    page_size: int
    pages: int


# --- Flow with Details (for frontend FlowData) ---

class FlowDetailResponse(BaseModel):
    """Detailed flow response matching frontend FlowData"""
    id: int
    candidate: str  # Candidate name
    candidateAvatar: Optional[str] = None
    job: str  # Job title
    company: str
    salary: str
    location: str
    tags: List[str]
    description: str
    status: str
    matchScore: float
    lastAction: Optional[str] = None
    nodes: List[str]  # Stage names
    currentStep: int
    tokensConsumed: int
    stage: str
    nextAction: Optional[str] = None
    nextSchedule: Optional[str] = None
    agents: List[str]
    details: Optional[str] = None
    timeline: List[dict]
