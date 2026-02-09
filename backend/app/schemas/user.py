"""
User Schemas
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole, AccountTier


# --- Token Schemas ---

class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """JWT Token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None


# --- User Schemas ---

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class UserCreate(UserBase):
    """User registration schema"""
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.CANDIDATE
    company_name: Optional[str] = None
    ref_code: Optional[str] = Field(None, max_length=20, description="邀请码（推荐人的邀请码）")


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None


class UserResponse(UserBase):
    """User response schema"""
    id: int
    role: UserRole
    account_tier: AccountTier
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    invite_code: Optional[str] = None

    class Config:
        from_attributes = True


# --- Team Member Schemas ---

class TeamMemberCreate(BaseModel):
    """Team member invitation schema"""
    email: EmailStr
    role: UserRole = UserRole.VIEWER


class TeamMemberResponse(BaseModel):
    """Team member response schema"""
    id: int
    invited_email: str
    role: UserRole
    status: str
    invited_at: datetime
    joined_at: Optional[datetime] = None

    class Config:
        from_attributes = True
