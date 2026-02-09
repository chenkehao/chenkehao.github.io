"""
Job, Job Tags, and Job Log Models
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Float, DateTime, Enum, ForeignKey, Text, Boolean, Table, Column, JSON
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
    logs: Mapped[List["JobLog"]] = relationship(
        "JobLog",
        back_populates="job",
        order_by="JobLog.created_at.desc()",
        cascade="all, delete-orphan"
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


class JobLogAction(str, enum.Enum):
    """岗位日志操作类型"""
    PUBLISH = "publish"           # 岗位发布
    UPDATE = "update"             # 岗位修改
    PAUSE = "pause"               # 岗位暂停
    RESUME = "resume"             # 岗位恢复
    CLOSE = "close"               # 岗位关闭
    INVITE_START = "invite_start"     # 开始智能邀请
    INVITE_MATCH = "invite_match"     # 候选人匹配
    INVITE_SEND = "invite_send"       # 发送邀请
    SCREEN_START = "screen_start"     # 开始智能筛选
    SCREEN_RESULT = "screen_result"   # 筛选结果
    EXCHANGE_REQUEST = "exchange_request"  # 请求互换联系方式
    EXCHANGE_CONFIRM = "exchange_confirm"  # 确认互换联系方式
    AI_ANALYSIS = "ai_analysis"   # AI 分析/建议
    USER_ACTION = "user_action"   # 用户自定义操作
    SYSTEM = "system"             # 系统操作


class JobLog(Base):
    """岗位交互日志 — 记录岗位全生命周期的所有操作"""
    
    __tablename__ = "job_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 关联岗位
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True)
    
    # 操作者（可以是用户，也可以是 AI/系统）
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    actor_type: Mapped[str] = mapped_column(String(20), default="user")  # user / ai / system
    
    # 操作类型和内容
    action: Mapped[JobLogAction] = mapped_column(Enum(JobLogAction), index=True)
    title: Mapped[str] = mapped_column(String(200))  # 日志标题，如"岗位发布成功"
    content: Mapped[str] = mapped_column(Text)  # 日志详细内容
    
    # 额外元数据（JSON）—— 存储结构化数据，如候选人列表、匹配分数等
    extra_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    
    # 关联的招聘任务（Todo）
    todo_id: Mapped[Optional[int]] = mapped_column(ForeignKey("todos.id"), nullable=True)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="logs")
    
    def __repr__(self):
        return f"<JobLog(id={self.id}, job_id={self.job_id}, action={self.action})>"
