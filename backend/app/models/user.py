"""
User and Team Models
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Boolean, DateTime, Enum, ForeignKey, Text, Index
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
    admin_role_id: Mapped[Optional[int]] = mapped_column(ForeignKey("admin_roles.id"), nullable=True, index=True)
    
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
    admin_role: Mapped[Optional["AdminRole"]] = relationship(
        "AdminRole",
        back_populates="users",
        foreign_keys=[admin_role_id],
        lazy="joined",
    )
    team_members: Mapped[List["TeamMember"]] = relationship(
        "TeamMember", 
        back_populates="owner",
        foreign_keys="TeamMember.owner_id"
    )
    admin_enterprise: Mapped[Optional["Enterprise"]] = relationship(
        "Enterprise",
        back_populates="admin_user",
        foreign_keys="Enterprise.admin_user_id",
        uselist=False
    )
    
    # Invitation / Referral
    invite_code: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True, index=True)
    invited_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Memory/Preferences stored as JSON
    memory_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class Enterprise(Base):
    """Enterprise model for verified companies"""
    
    __tablename__ = "enterprises"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    credit_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # 统一社会信用代码
    company_name: Mapped[str] = mapped_column(String(255))
    legal_person: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # 主管理员
    admin_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # 企业状态
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, suspended
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    admin_user: Mapped["User"] = relationship("User", back_populates="admin_enterprise", foreign_keys=[admin_user_id])
    members: Mapped[List["TeamMember"]] = relationship("TeamMember", back_populates="enterprise")
    
    def __repr__(self):
        return f"<Enterprise(id={self.id}, name={self.company_name}, credit_code={self.credit_code})>"


class TeamMember(Base):
    """Team member model for enterprise teams"""
    
    __tablename__ = "team_members"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    member_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    enterprise_id: Mapped[Optional[int]] = mapped_column(ForeignKey("enterprises.id"), nullable=True, index=True)
    
    # Invitation info
    invited_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    invited_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.VIEWER)
    status: Mapped[str] = mapped_column(String(20), default="invited")  # invited, active, pending_approval
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)  # 是否是管理员
    
    # Timestamps
    invited_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="team_members", foreign_keys=[owner_id])
    member: Mapped[Optional["User"]] = relationship("User", foreign_keys=[member_id])
    enterprise: Mapped[Optional["Enterprise"]] = relationship("Enterprise", back_populates="members")
    
    def __repr__(self):
        return f"<TeamMember(id={self.id}, email={self.invited_email}, phone={self.invited_phone}, status={self.status})>"
