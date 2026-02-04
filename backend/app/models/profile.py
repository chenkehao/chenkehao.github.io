"""
User Profile Models - 用户详细资料（人才画像/企业画像）
"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ProfileType(str, enum.Enum):
    """资料类型"""
    CANDIDATE = "candidate"  # 人才画像
    EMPLOYER = "employer"    # 企业画像


class UserProfile(Base):
    """用户详细资料模型"""
    
    __tablename__ = "user_profiles"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    profile_type: Mapped[ProfileType] = mapped_column(Enum(ProfileType), default=ProfileType.CANDIDATE)
    
    # 基本信息
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # 职位/公司标语
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 个人简介/公司简介
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # 封面图
    
    # 人才端特有字段 (JSON)
    # skills: ['React', 'Python', ...]
    # experience_years: 5
    # career_path: [{role, timeframe, description}, ...]
    # certifications: [{name, issuer, date}, ...]
    # awards: [{name, org, year}, ...]
    # radar_data: [{subject, value}, ...]
    # ideal_job: '期望职位描述'
    candidate_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    
    # 企业端特有字段 (JSON)
    # company_name: '公司名称'
    # industry: '行业'
    # size: '规模'
    # location: '地点'
    # founded: '成立年份'
    # website: '官网'
    # culture: '企业文化'
    # benefits: ['福利1', '福利2', ...]
    # tech_stack: ['技术1', '技术2', ...]
    # open_positions: [{title, department, count}, ...]
    employer_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, type={self.profile_type})>"
