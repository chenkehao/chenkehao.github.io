"""
Job Schemas
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.job import JobStatus, JobType


# --- Job Tag Schemas ---

class JobTagCreate(BaseModel):
    """Create job tag schema"""
    name: str = Field(..., max_length=50)
    category: Optional[str] = None


class JobTagResponse(BaseModel):
    """Job tag response schema"""
    id: int
    name: str
    category: Optional[str] = None

    class Config:
        from_attributes = True


# --- Job Schemas ---

class JobBase(BaseModel):
    """Base job schema"""
    title: str = Field(..., max_length=200)
    company: str = Field(..., max_length=200)
    location: str = Field(..., max_length=200)
    description: str


class JobCreate(JobBase):
    """Create job schema"""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    job_type: JobType = JobType.FULL_TIME
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    tags: List[str] = []  # Tag names
    min_match_score: int = 60


class JobUpdate(BaseModel):
    """Update job schema"""
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    job_type: Optional[JobType] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    status: Optional[JobStatus] = None
    tags: Optional[List[str]] = None
    min_match_score: Optional[int] = None


class JobResponse(JobBase):
    """Job response schema"""
    id: int
    owner_id: int
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    job_type: JobType
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    status: JobStatus
    is_featured: bool
    min_match_score: int
    view_count: int
    apply_count: int
    tags: List[JobTagResponse] = []
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """Job list response with pagination"""
    items: List[JobResponse]
    total: int
    page: int
    page_size: int
    pages: int
