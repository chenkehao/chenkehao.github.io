"""
Audit logging utility
统一审计日志写入工具函数
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.settings import AuditLog


async def log_audit(
    db: AsyncSession,
    user_id: int,
    action: str,
    actor: str = "系统",
    category: str = "system",
    risk_level: str = "info",
    ip_address: str = None,
    user_agent: str = None,
    auto_commit: bool = False,
):
    """
    记录审计日志

    Args:
        db: 数据库会话
        user_id: 用户 ID
        action: 操作描述
        actor: 执行者名称
        category: 分类 (auth/data/ai/system/api)
        risk_level: 风险等级 (info/warning/danger)
        ip_address: IP 地址
        user_agent: 浏览器 UA
        auto_commit: 是否自动提交事务（默认 False，由调用方统一 commit）
    """
    log = AuditLog(
        user_id=user_id,
        action=action,
        actor=actor,
        category=category,
        risk_level=risk_level,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    if auto_commit:
        await db.commit()
