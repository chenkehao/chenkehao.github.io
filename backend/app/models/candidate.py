"""
Candidate and Profile Models
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SkillPriority(str, enum.Enum):
    """Skill gap priority levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AgentFeedbackType(str, enum.Enum):
    """AI Agent feedback types"""
    TECHNICAL = "technical"
    SOFT_SKILLS = "soft_skills"
    STRATEGY = "strategy"


class Candidate(Base):
    """Candidate model - links user to their profile"""
    
    __tablename__ = "candidates"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    
    # Resume
    resume_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resume_file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status
    is_profile_complete: Mapped[bool] = mapped_column(default=False)
    last_analysis_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile: Mapped[Optional["CandidateProfile"]] = relationship(
        "CandidateProfile", 
        back_populates="candidate",
        uselist=False
    )
    skills: Mapped[List["Skill"]] = relationship("Skill", back_populates="candidate")
    career_paths: Mapped[List["CareerPath"]] = relationship("CareerPath", back_populates="candidate")
    skill_gaps: Mapped[List["SkillGap"]] = relationship("SkillGap", back_populates="candidate")
    
    def __repr__(self):
        return f"<Candidate(id={self.id}, user_id={self.user_id})>"


class CandidateProfile(Base):
    """AI-generated candidate profile from resume analysis"""
    
    __tablename__ = "candidate_profiles"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), unique=True, index=True)
    
    # Basic info
    display_name: Mapped[str] = mapped_column(String(100))
    current_role: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    experience_years: Mapped[float] = mapped_column(Float, default=0)
    
    # AI Analysis results
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ideal_job_persona: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    salary_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    market_demand: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Radar chart data (stored as JSON)
    radar_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # AI-generated content (stored as JSON arrays)
    interview_questions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    optimization_suggestions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    agent_feedbacks: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Certifications, Awards (stored as JSON)
    certifications: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    awards: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    credentials: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="profile")
    
    def __repr__(self):
        return f"<CandidateProfile(id={self.id}, name={self.display_name})>"


class Skill(Base):
    """Candidate skills"""
    
    __tablename__ = "skills"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    
    name: Mapped[str] = mapped_column(String(100))
    level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-100
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="skills")
    
    def __repr__(self):
        return f"<Skill(id={self.id}, name={self.name})>"


class CareerPath(Base):
    """AI-suggested career path nodes"""
    
    __tablename__ = "career_paths"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    
    role: Mapped[str] = mapped_column(String(200))
    requirement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timeframe: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="career_paths")
    
    def __repr__(self):
        return f"<CareerPath(id={self.id}, role={self.role})>"


class SkillGap(Base):
    """AI-identified skill gaps"""
    
    __tablename__ = "skill_gaps"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    
    skill: Mapped[str] = mapped_column(String(100))
    priority: Mapped[SkillPriority] = mapped_column(Enum(SkillPriority), default=SkillPriority.MEDIUM)
    resource: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="skill_gaps")
    
    def __repr__(self):
        return f"<SkillGap(id={self.id}, skill={self.skill})>"
