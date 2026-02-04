"""
Job and Job Tags Models
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Float, DateTime, Enum, ForeignKey, Text, Boolean, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class JobStatus(str, enum.Enum):
    """Job posting status"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class JobType(str, enum.Enum):
    """Job type"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    REMOTE = "remote"


# Many-to-many relationship table for Job and JobTag
job_tags_association = Table(
    "job_tags_association",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("jobs.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("job_tags.id"), primary_key=True),
)


class Job(Base):
    """Job posting model"""
    
    __tablename__ = "jobs"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Owner (recruiter)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Basic info
    title: Mapped[str] = mapped_column(String(200), index=True)
    company: Mapped[str] = mapped_column(String(200))
    location: Mapped[str] = mapped_column(String(200))
    
    # Salary
    salary_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_display: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Description
    description: Mapped[str] = mapped_column(Text)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    benefits: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Display
    logo: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Emoji or icon
    ai_intro: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # AI introduction
    
    # Job details
    job_type: Mapped[JobType] = mapped_column(Enum(JobType), default=JobType.FULL_TIME)
    experience_required: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    education_required: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Status
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.DRAFT)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # AI matching score threshold
    min_match_score: Mapped[int] = mapped_column(Integer, default=60)
    
    # Statistics
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    apply_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    tags: Mapped[List["JobTag"]] = relationship(
        "JobTag",
        secondary=job_tags_association,
        back_populates="jobs"
    )
    
    def __repr__(self):
        return f"<Job(id={self.id}, title={self.title})>"


class JobTag(Base):
    """Job tags/skills for matching"""
    
    __tablename__ = "job_tags"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Relationships
    jobs: Mapped[List["Job"]] = relationship(
        "Job",
        secondary=job_tags_association,
        back_populates="tags"
    )
    
    def __repr__(self):
        return f"<JobTag(id={self.id}, name={self.name})>"
