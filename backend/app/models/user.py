"""
User and Team Models
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    """User roles in the system"""
    ADMIN = "admin"
    RECRUITER = "recruiter"
    VIEWER = "viewer"
    CANDIDATE = "candidate"


class AccountTier(str, enum.Enum):
    """Account subscription tiers"""
    FREE = "free"
    PRO = "pro"
    ULTRA = "ultra"


class User(Base):
    """User model for both enterprise and candidate users"""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    
    # Profile
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Role & Permissions
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CANDIDATE)
    account_tier: Mapped[AccountTier] = mapped_column(Enum(AccountTier), default=AccountTier.FREE)
    
    # Enterprise info (for recruiters)
    company_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    company_logo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    team_members: Mapped[List["TeamMember"]] = relationship(
        "TeamMember", 
        back_populates="owner",
        foreign_keys="TeamMember.owner_id"
    )
    
    # Memory/Preferences stored as JSON
    memory_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class TeamMember(Base):
    """Team member model for enterprise teams"""
    
    __tablename__ = "team_members"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    member_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Invitation info
    invited_email: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.VIEWER)
    status: Mapped[str] = mapped_column(String(20), default="invited")  # invited, active
    
    # Timestamps
    invited_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="team_members", foreign_keys=[owner_id])
    member: Mapped[Optional["User"]] = relationship("User", foreign_keys=[member_id])
    
    def __repr__(self):
        return f"<TeamMember(id={self.id}, email={self.invited_email}, status={self.status})>"
