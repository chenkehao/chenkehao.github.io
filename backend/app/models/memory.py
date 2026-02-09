"""
Memory Model - 记忆存储
"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MemoryType(str, enum.Enum):
    """记忆类型"""
    CULTURE = "culture"      # 文化偏好
    TECH = "tech"            # 技术要求
    SKILL = "skill"          # 技能/能力
    EXPERIENCE = "experience" # 经验
    SALARY = "salary"        # 薪酬
    LOCATION = "location"    # 工作地点
    REPORTING = "reporting"  # 汇报关系
    TEAM = "team"            # 团队
    PROJECT = "project"      # 项目
    GOAL = "goal"            # 目标/职业目标
    PREFERENCE = "preference" # 求职偏好
    COMPANY = "company"      # 公司介绍
    REQUIREMENT = "requirement" # 招聘需求
    BENEFIT = "benefit"      # 福利待遇
    ACTION = "action"        # 动作/行为记忆
    STRATEGY = "strategy"    # 策略


class MemoryImportance(str, enum.Enum):
    """记忆重要性"""
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class MemoryScope(str, enum.Enum):
    """记忆范围 - 区分人才画像和企业画像"""
    CANDIDATE = "candidate"   # 人才画像记忆
    EMPLOYER = "employer"     # 企业画像记忆


class Memory(Base):
    """记忆模型 - 存储企业和候选人的偏好记忆"""
    
    __tablename__ = "memories"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 所属用户
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # 记忆范围 - 区分人才画像和企业画像
    scope: Mapped[MemoryScope] = mapped_column(
        Enum(MemoryScope), 
        default=MemoryScope.CANDIDATE,
        index=True
    )
    
    # 记忆内容
    type: Mapped[MemoryType] = mapped_column(Enum(MemoryType))
    content: Mapped[str] = mapped_column(Text)
    
    # 元数据
    importance: Mapped[MemoryImportance] = mapped_column(
        Enum(MemoryImportance), 
        default=MemoryImportance.MEDIUM
    )
    source: Mapped[str] = mapped_column(String(50), default="manual")  # manual, ai, import
    
    # 强调次数 - 重复内容会增加此值而不是创建新记忆
    emphasis_count: Mapped[int] = mapped_column(Integer, default=1)
    
    # Agent 推理逻辑 - 说明为什么保留/创建这条记忆
    ai_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 颜色标记
    color: Mapped[str] = mapped_column(String(50), default="border-slate-300")
    
    # 版本历史 - JSON数组，记录每次合并/修改的历史
    # 格式: [{"version": 1, "action": "create|merge|edit|optimize", "content": "旧内容", "date": "2026-02-09", "source": "说明"}]
    version_history: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=None)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Memory(id={self.id}, type={self.type}, content={self.content[:30]}...)>"
