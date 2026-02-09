"""
Token Usage and Package Models
"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TokenAction(str, enum.Enum):
    """Types of token-consuming actions"""
    RESUME_PARSE = "resume_parse"
    PROFILE_BUILD = "profile_build"
    JOB_MATCH = "job_match"
    INTERVIEW = "interview"
    MARKET_ANALYSIS = "market_analysis"
    ROUTE_DISPATCH = "route_dispatch"
    CHAT = "chat"
    INVITE_REWARD = "invite_reward"
    OTHER = "other"


class PackageType(str, enum.Enum):
    """Token package types"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class TokenUsage(Base):
    """Token usage record for billing"""
    
    __tablename__ = "token_usage"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Action details
    action: Mapped[TokenAction] = mapped_column(Enum(TokenAction))
    tokens_used: Mapped[int] = mapped_column(Integer)
    
    # Related entities
    flow_id: Mapped[Optional[int]] = mapped_column(ForeignKey("flows.id"), nullable=True)
    candidate_id: Mapped[Optional[int]] = mapped_column(ForeignKey("candidates.id"), nullable=True)
    job_id: Mapped[Optional[int]] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    
    # AI Model info
    model_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Description
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<TokenUsage(id={self.id}, action={self.action}, tokens={self.tokens_used})>"


class TokenPackage(Base):
    """User token package/subscription"""
    
    __tablename__ = "token_packages"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Package details
    package_type: Mapped[PackageType] = mapped_column(Enum(PackageType), default=PackageType.FREE)
    
    # Token quota
    total_tokens: Mapped[int] = mapped_column(Integer, default=10000)
    used_tokens: Mapped[int] = mapped_column(Integer, default=0)
    remaining_tokens: Mapped[int] = mapped_column(Integer, default=10000)
    
    # Validity
    is_active: Mapped[bool] = mapped_column(default=True)
    purchased_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Price
    price: Mapped[float] = mapped_column(Float, default=0)
    
    def __repr__(self):
        return f"<TokenPackage(id={self.id}, type={self.package_type}, remaining={self.remaining_tokens})>"
