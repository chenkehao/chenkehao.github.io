"""
Todo/Task Model - 任务模型
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, DateTime, Enum, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TodoStatus(str, enum.Enum):
    """任务状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TodoPriority(str, enum.Enum):
    """任务优先级"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TodoSource(str, enum.Enum):
    """任务来源"""
    USER = "user"       # 用户创建
    AGENT = "agent"     # AI 智能体分发
    SYSTEM = "system"   # 系统生成


class TodoType(str, enum.Enum):
    """任务类型"""
    CANDIDATE = "candidate"   # 候选人相关
    EMPLOYER = "employer"     # 企业相关
    SYSTEM = "system"         # 系统任务


class Todo(Base):
    """待办任务模型"""
    
    __tablename__ = "todos"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 所属用户
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # 任务基本信息
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 状态与优先级
    status: Mapped[TodoStatus] = mapped_column(Enum(TodoStatus), default=TodoStatus.PENDING)
    priority: Mapped[TodoPriority] = mapped_column(Enum(TodoPriority), default=TodoPriority.MEDIUM)
    source: Mapped[TodoSource] = mapped_column(Enum(TodoSource), default=TodoSource.USER)
    todo_type: Mapped[TodoType] = mapped_column(Enum(TodoType), default=TodoType.SYSTEM)
    
    # 进度
    progress: Mapped[int] = mapped_column(Integer, default=0)
    
    # AI 建议
    ai_advice: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 步骤（JSON 数组）
    steps: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    
    # 时间
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # 图标（用于前端显示）
    icon: Mapped[str] = mapped_column(String(50), default="Calendar")
    
    def __repr__(self):
        return f"<Todo(id={self.id}, title={self.title}, status={self.status})>"


class ChatMessage(Base):
    """AI 助手聊天消息"""
    
    __tablename__ = "chat_messages"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 所属用户
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # 关联的 Todo（可选）
    todo_id: Mapped[Optional[int]] = mapped_column(ForeignKey("todos.id"), nullable=True)
    
    # 消息内容
    role: Mapped[str] = mapped_column(String(20))  # user, assistant
    content: Mapped[str] = mapped_column(Text)
    
    # 元数据
    model: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    
    # 时间
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role={self.role})>"
