"""
消息通知数据模型
支持多种通知类型和重要程度，确保重要消息触达，不骚扰用户
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from enum import Enum
from app.database import Base


class NotificationType(str, Enum):
    """通知类型"""
    SYSTEM = "system"          # 系统通知（注册欢迎、账户变更、安全提醒）
    MATCH = "match"            # 匹配动态（AI 邀请、AI 投递、简历匹配）
    INTERVIEW = "interview"    # 面试相关（流程推进、阶段变更、结果通知）
    MESSAGE = "message"        # 消息互动（联系方式互换、沟通提醒）


class NotificationImportance(str, Enum):
    """
    消息重要程度 — 决定是否强推 / 是否可静默
    - CRITICAL: 必须触达（安全警告、面试结果、联系互换）— 无论用户是否开启推送都显示
    - IMPORTANT: 重要提醒（AI 邀请收到、新投递、流程推进）— 尊重推送设置
    - NORMAL: 一般通知（系统公告、Token 提醒）— 尊重推送设置，可合并
    - LOW: 低优先级（产品更新、营销）— 仅在消息中心展示，不推送
    """
    CRITICAL = "critical"
    IMPORTANT = "important"
    NORMAL = "normal"
    LOW = "low"


class Notification(Base):
    """用户消息通知"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # 通知内容（使用 String 存储 enum 值以兼容 SQLite）
    type = Column(String(20), default="system", nullable=False)
    importance = Column(String(20), default="normal", nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)

    # 展示样式
    icon = Column(String(50), default="Bell")          # 前端图标名
    color = Column(String(50), default="text-slate-600")
    bg_color = Column(String(50), default="bg-slate-50")

    # 跳转链接
    link = Column(String(500), default="/notifications")

    # 状态
    is_read = Column(Boolean, default=False, index=True)
    is_deleted = Column(Boolean, default=False, index=True)

    # 关联实体（可选，用于去重和关联查看）
    related_flow_id = Column(Integer, nullable=True)
    related_job_id = Column(Integer, nullable=True)
    related_candidate_id = Column(Integer, nullable=True)

    # 发送者标识
    sender = Column(String(100), default="系统")  # "系统" / "smart_invite" / "smart_apply" / 用户名

    # 时间戳
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, title={self.title})>"
