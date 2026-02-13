"""
Admin Role & Permission Models
管理员角色与权限管理
"""

import enum
import json
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ─── 权限模块定义 ──────────────────────────────────────────────────

PERMISSION_MODULES = {
    "dashboard":      {"label": "仪表盘",    "actions": ["view"]},
    "analytics":      {"label": "运营数据",   "actions": ["view"]},
    "users":          {"label": "用户管理",   "actions": ["view", "edit", "delete"]},
    "enterprises":    {"label": "企业管理",   "actions": ["view", "edit"]},
    "jobs":           {"label": "职位管理",   "actions": ["view", "edit", "delete"]},
    "candidates":     {"label": "候选人",     "actions": ["view"]},
    "flows":          {"label": "招聘流程",   "actions": ["view"]},
    "tokens":         {"label": "Token管理",  "actions": ["view", "manage"]},
    "orders":         {"label": "订单管理",   "actions": ["view", "manage", "refund"]},
    "invitations":    {"label": "邀请管理",   "actions": ["view", "manage"]},
    "tickets":        {"label": "工单管理",   "actions": ["view", "handle"]},
    "notifications":  {"label": "通知管理",   "actions": ["view", "send"]},
    "ai":             {"label": "AI 监控",   "actions": ["view"]},
    "content":        {"label": "内容管理",   "actions": ["view", "edit"]},
    "audit":          {"label": "审计安全",   "actions": ["view"]},
    "settings":       {"label": "系统设置",   "actions": ["view", "edit"]},
    "admin_mgmt":     {"label": "管理员管理", "actions": ["view", "manage"]},
}

ACTION_LABELS = {
    "view": "查看",
    "edit": "编辑",
    "delete": "删除",
    "manage": "管理",
    "refund": "退款",
    "handle": "处理",
    "send": "发送",
}

# 预设角色权限 (name -> permissions list)
PRESET_ROLES = {
    "super_admin": {
        "display_name": "超级管理员",
        "description": "拥有系统所有权限，可管理其他管理员",
        "permissions": ["*"],  # 通配符代表所有权限
    },
    "ops_admin": {
        "display_name": "运营管理员",
        "description": "负责平台日常运营，管理用户、订单和Token",
        "permissions": [
            "dashboard:view", "analytics:view",
            "users:view", "users:edit",
            "orders:view", "orders:manage", "orders:refund",
            "tokens:view", "tokens:manage",
            "invitations:view", "invitations:manage",
            "tickets:view", "tickets:handle",
            "notifications:view",
        ],
    },
    "content_admin": {
        "display_name": "内容管理员",
        "description": "负责内容维护、通知发送和职位审核",
        "permissions": [
            "dashboard:view",
            "content:view", "content:edit",
            "notifications:view", "notifications:send",
            "jobs:view", "jobs:edit",
            "candidates:view",
        ],
    },
    "cs_admin": {
        "display_name": "客服管理员",
        "description": "负责工单处理和用户问题解答",
        "permissions": [
            "dashboard:view",
            "tickets:view", "tickets:handle",
            "users:view",
            "notifications:view", "notifications:send",
            "orders:view",
        ],
    },
}


class AdminRole(Base):
    """管理员角色模型"""

    __tablename__ = "admin_roles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # JSON 存储权限列表，如 ["dashboard:view", "users:view", "users:edit"] 或 ["*"]
    permissions_json: Mapped[str] = mapped_column(Text, default="[]")

    # 系统角色不可删除
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="admin_role")

    @property
    def permissions(self) -> list:
        try:
            return json.loads(self.permissions_json)
        except (json.JSONDecodeError, TypeError):
            return []

    @permissions.setter
    def permissions(self, value: list):
        self.permissions_json = json.dumps(value, ensure_ascii=False)

    def has_permission(self, module: str, action: str) -> bool:
        """检查角色是否具有指定权限"""
        perms = self.permissions
        if "*" in perms:
            return True
        return f"{module}:{action}" in perms

    @property
    def user_count(self) -> int:
        return len(self.users) if self.users else 0

    def __repr__(self):
        return f"<AdminRole(id={self.id}, name={self.name})>"
