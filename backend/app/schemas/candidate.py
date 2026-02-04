"""
Candidate Schemas
"""

from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel, Field


# --- Skill Gap Schema ---

class SkillGapSchema(BaseModel):
    """Skill gap schema"""
    skill: str
    priority: str  # High, Medium, Low
    resource: Optional[str] = None


# --- Career Path Schema ---

class CareerPathSchema(BaseModel):
    """Career path node schema"""
    role: str
    requirement: Optional[str] = None
    timeframe: Optional[str] = None


# --- Agent Feedback Schema ---

class AgentFeedbackSchema(BaseModel):
    """AI agent feedback schema"""
    agentName: str
    type: str  # Technical, SoftSkills, Strategy
    comment: str
    score: float


# --- Radar Data Schema ---

class RadarDataPoint(BaseModel):
    """Radar chart data point"""
    subject: str
    value: float


# --- Candidate Profile Schemas ---

class CandidateProfileCreate(BaseModel):
    """Create candidate profile schema"""
    display_name: str
    current_role: Optional[str] = None
    experience_years: float = 0
    summary: Optional[str] = None


class CandidateProfileResponse(BaseModel):
    """Candidate profile response schema"""
    id: int
    display_name: str
    current_role: Optional[str] = None
    experience_years: float
    summary: Optional[str] = None
    ideal_job_persona: Optional[str] = None
    salary_range: Optional[str] = None
    market_demand: Optional[str] = None
    radar_data: Optional[List[RadarDataPoint]] = None
    interview_questions: Optional[List[str]] = None
    optimization_suggestions: Optional[List[str]] = None
    agent_feedbacks: Optional[List[AgentFeedbackSchema]] = None
    certifications: Optional[List[Any]] = None
    awards: Optional[List[Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Candidate Schemas ---

class CandidateCreate(BaseModel):
    """Create candidate schema"""
    resume_text: Optional[str] = None


class CandidateResponse(BaseModel):
    """Candidate response schema"""
    id: int
    user_id: int
    resume_text: Optional[str] = None
    resume_file_url: Optional[str] = None
    is_profile_complete: bool
    last_analysis_at: Optional[datetime] = None
    profile: Optional[CandidateProfileResponse] = None
    skills: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


# --- Resume Analysis Schemas ---

class ResumeAnalysisRequest(BaseModel):
    """Resume analysis request schema"""
    resume_text: str = Field(..., min_length=10, description="简历文本内容")


class ResumeAnalysisResponse(BaseModel):
    """Resume analysis response schema - matches frontend CandidateProfile type"""
    name: str
    role: str
    skills: List[str]
    experienceYears: float
    summary: str
    idealJobPersona: Optional[str] = None
    salaryRange: Optional[str] = None
    marketDemand: Optional[str] = None
    radarData: List[RadarDataPoint]
    interviewQuestions: Optional[List[str]] = None
    optimizationSuggestions: Optional[List[str]] = None
    careerPath: Optional[List[CareerPathSchema]] = None
    skillGaps: Optional[List[SkillGapSchema]] = None
    agentFeedbacks: Optional[List[AgentFeedbackSchema]] = None
