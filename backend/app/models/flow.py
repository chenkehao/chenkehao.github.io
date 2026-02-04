"""
Recruitment Flow and Timeline Models
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FlowStatus(str, enum.Enum):
    """Recruitment flow status"""
    PARSING = "parsing"           # 简历解析中
    BENCHMARKING = "benchmarking" # 对标分析中
    SCREENING = "screening"       # 初筛中
    INTERVIEWING = "interviewing" # 面试中
    EVALUATING = "evaluating"     # 评估中
    OFFER = "offer"               # Offer阶段
    ACCEPTED = "accepted"         # 已接受
    REJECTED = "rejected"         # 已拒绝
    WITHDRAWN = "withdrawn"       # 已撤回


class FlowStage(str, enum.Enum):
    """Recruitment flow stages"""
    PARSE = "parse"       # 解析
    BENCHMARK = "benchmark"  # 对标
    FIRST_INTERVIEW = "first_interview"  # 初试
    SECOND_INTERVIEW = "second_interview"  # 复试
    FINAL = "final"       # 终审


class Flow(Base):
    """Recruitment flow - tracks candidate progress through hiring pipeline"""
    
    __tablename__ = "flows"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Relations
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Status
    status: Mapped[FlowStatus] = mapped_column(Enum(FlowStatus), default=FlowStatus.PARSING)
    current_stage: Mapped[FlowStage] = mapped_column(Enum(FlowStage), default=FlowStage.PARSE)
    current_step: Mapped[int] = mapped_column(Integer, default=1)
    
    # AI Analysis
    match_score: Mapped[float] = mapped_column(Float, default=0)
    tokens_consumed: Mapped[int] = mapped_column(Integer, default=0)
    
    # Next action
    next_action: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    next_schedule: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # AI Agents involved
    agents_used: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Details/Notes
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_action: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    steps: Mapped[List["FlowStep"]] = relationship("FlowStep", back_populates="flow")
    timeline: Mapped[List["FlowTimeline"]] = relationship("FlowTimeline", back_populates="flow")
    
    def __repr__(self):
        return f"<Flow(id={self.id}, status={self.status})>"


class FlowStep(Base):
    """Individual steps within a recruitment flow"""
    
    __tablename__ = "flow_steps"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("flows.id"), index=True)
    
    name: Mapped[str] = mapped_column(String(100))
    stage: Mapped[FlowStage] = mapped_column(Enum(FlowStage))
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Status
    is_completed: Mapped[bool] = mapped_column(default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Result
    result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    flow: Mapped["Flow"] = relationship("Flow", back_populates="steps")
    
    def __repr__(self):
        return f"<FlowStep(id={self.id}, name={self.name})>"


class FlowTimeline(Base):
    """Timeline events for a recruitment flow"""
    
    __tablename__ = "flow_timeline"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("flows.id"), index=True)
    
    # Event details
    action: Mapped[str] = mapped_column(String(200))
    agent_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamp
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    flow: Mapped["Flow"] = relationship("Flow", back_populates="timeline")
    
    def __repr__(self):
        return f"<FlowTimeline(id={self.id}, action={self.action})>"
