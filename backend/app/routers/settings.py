"""
设置相关 API 路由
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import secrets

from app.database import get_db
from app.models.settings import (
    UserSettings, 
    EnterpriseCertification, 
    PersonalCertification,
    AIEngineConfig,
    APIKey,
    AuditLog,
    CertificationStatus
)
from app.models.user import TeamMember, UserRole

router = APIRouter(tags=["settings"])


# === Pydantic 模型 ===

class UserSettingsUpdate(BaseModel):
    display_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    notification_enabled: Optional[bool] = None
    dark_mode: Optional[bool] = None


class TeamMemberCreate(BaseModel):
    name: str
    email: str
    role: str = "viewer"


class AIEngineConfigCreate(BaseModel):
    task: str
    model_name: str
    provider: str = "Devnors"


class AuditLogCreate(BaseModel):
    action: str
    actor: str
    ip_address: Optional[str] = None


# === 基础设置 API ===

@router.get("")
async def get_settings(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取用户设置"""
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    
    if not settings:
        # 返回默认设置
        return {
            "display_name": "",
            "contact_email": "",
            "contact_name": "",
            "contact_phone": "",
            "address": "",
            "website": "",
            "industry": "人工智能",
            "company_size": "1-50人",
            "description": "",
            "notification_enabled": True,
            "dark_mode": False
        }
    
    return {
        "display_name": settings.display_name or "",
        "contact_email": settings.contact_email or "",
        "contact_name": settings.contact_name or "",
        "contact_phone": settings.contact_phone or "",
        "address": settings.address or "",
        "website": settings.website or "",
        "industry": settings.industry or "人工智能",
        "company_size": settings.company_size or "1-50人",
        "description": settings.description or "",
        "notification_enabled": settings.notification_enabled if settings.notification_enabled is not None else True,
        "dark_mode": settings.dark_mode if settings.dark_mode is not None else False
    }


@router.put("")
async def update_settings(
    data: UserSettingsUpdate,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """更新用户设置"""
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    
    if not settings:
        # 创建新设置
        settings = UserSettings(user_id=user_id)
        db.add(settings)
    
    # 更新字段
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(settings, key, value)
    
    await db.commit()
    await db.refresh(settings)
    
    # 记录审计日志
    audit_log = AuditLog(
        user_id=user_id,
        action="用户设置被更新",
        actor="用户",
        ip_address="127.0.0.1"
    )
    db.add(audit_log)
    await db.commit()
    
    return {"message": "设置已更新", "settings": {
        "display_name": settings.display_name,
        "contact_email": settings.contact_email,
        "contact_name": settings.contact_name,
        "contact_phone": settings.contact_phone,
        "address": settings.address,
        "website": settings.website,
        "industry": settings.industry,
        "company_size": settings.company_size,
        "description": settings.description,
        "notification_enabled": settings.notification_enabled,
        "dark_mode": settings.dark_mode
    }}


# === 企业认证信息 API ===

@router.get("/enterprise-certifications")
async def get_enterprise_certifications(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取企业认证信息"""
    result = await db.execute(
        select(EnterpriseCertification)
        .where(EnterpriseCertification.user_id == user_id)
        .order_by(EnterpriseCertification.created_at.desc())
    )
    certs = result.scalars().all()
    
    return [{
        "id": c.id,
        "name": c.name,
        "organization": c.organization,
        "date": c.cert_date,
        "status": c.status.value if c.status else "valid",
        "category": c.category,
        "score": c.score,
        "color": c.color,
        "icon": c.icon
    } for c in certs]


@router.post("/enterprise-certifications")
async def create_enterprise_certification(
    name: str,
    organization: str,
    cert_date: str,
    category: str = "qualification",
    color: str = None,
    icon: str = None,
    score: int = None,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """创建企业认证"""
    cert = EnterpriseCertification(
        user_id=user_id,
        name=name,
        organization=organization,
        cert_date=cert_date,
        category=category,
        color=color,
        icon=icon,
        score=score,
        status=CertificationStatus.VALID
    )
    db.add(cert)
    await db.commit()
    
    return {"message": "认证已添加", "id": cert.id}


# === 个人认证信息 API ===

@router.get("/personal-certifications")
async def get_personal_certifications(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取个人认证信息"""
    result = await db.execute(
        select(PersonalCertification)
        .where(PersonalCertification.user_id == user_id)
        .order_by(PersonalCertification.created_at.desc())
    )
    certs = result.scalars().all()
    
    return [{
        "id": c.id,
        "name": c.name,
        "organization": c.organization,
        "date": c.cert_date,
        "status": c.status.value if c.status else "valid",
        "category": c.category,
        "degree": c.degree,
        "major": c.major,
        "score": c.score,
        "level": c.level,
        "color": c.color,
        "icon": c.icon
    } for c in certs]


@router.post("/personal-certifications")
async def create_personal_certification(
    name: str,
    organization: str,
    cert_date: str,
    category: str = "education",
    degree: str = None,
    major: str = None,
    score: int = None,
    level: str = None,
    color: str = None,
    icon: str = None,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """创建个人认证"""
    cert = PersonalCertification(
        user_id=user_id,
        name=name,
        organization=organization,
        cert_date=cert_date,
        category=category,
        degree=degree,
        major=major,
        score=score,
        level=level,
        color=color,
        icon=icon,
        status=CertificationStatus.VALID
    )
    db.add(cert)
    await db.commit()
    
    return {"message": "认证已添加", "id": cert.id}


# === 团队成员 API ===

@router.get("/team-members")
async def get_team_members(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取团队成员列表"""
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.owner_id == user_id)
        .order_by(TeamMember.invited_at.desc())
    )
    members = result.scalars().all()
    
    return [{
        "id": str(m.id),
        "name": m.invited_email.split('@')[0].title(),  # 从邮箱提取名字
        "email": m.invited_email,
        "role": m.role.value if m.role else "viewer",
        "status": m.status.title() if m.status else "Invited",
        "lastActive": m.joined_at.isoformat() if m.joined_at else None
    } for m in members]


@router.post("/team-members")
async def create_team_member(
    data: TeamMemberCreate,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """邀请新团队成员"""
    # 检查是否已存在
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.owner_id == user_id)
        .where(TeamMember.invited_email == data.email)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="该邮箱已被邀请")
    
    # 解析角色
    try:
        role = UserRole(data.role.lower())
    except ValueError:
        role = UserRole.VIEWER
    
    member = TeamMember(
        owner_id=user_id,
        invited_email=data.email,
        role=role,
        status="invited"
    )
    db.add(member)
    await db.commit()
    
    # 记录审计日志
    audit_log = AuditLog(
        user_id=user_id,
        action=f"邀请新成员: {data.email}",
        actor="管理员",
        ip_address="127.0.0.1"
    )
    db.add(audit_log)
    await db.commit()
    
    return {"message": "邀请已发送", "id": member.id}


@router.delete("/team-members/{member_id}")
async def delete_team_member(
    member_id: int,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """删除团队成员"""
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.id == member_id)
        .where(TeamMember.owner_id == user_id)
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="成员不存在")
    
    await db.delete(member)
    await db.commit()
    
    return {"message": "成员已移除"}


# === AI引擎配置 API ===

@router.get("/ai-configs")
async def get_ai_configs(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取AI引擎配置"""
    result = await db.execute(
        select(AIEngineConfig)
        .where(AIEngineConfig.user_id == user_id)
        .order_by(AIEngineConfig.created_at)
    )
    configs = result.scalars().all()
    
    return [{
        "id": c.id,
        "task": c.task,
        "modelName": c.model_name,
        "provider": c.provider
    } for c in configs]


@router.post("/ai-configs")
async def create_ai_config(
    data: AIEngineConfigCreate,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """创建AI引擎配置"""
    config = AIEngineConfig(
        user_id=user_id,
        task=data.task,
        model_name=data.model_name,
        provider=data.provider
    )
    db.add(config)
    await db.commit()
    
    return {"message": "配置已添加", "id": config.id}


@router.put("/ai-configs/{config_id}")
async def update_ai_config(
    config_id: int,
    data: AIEngineConfigCreate,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """更新AI引擎配置"""
    result = await db.execute(
        select(AIEngineConfig)
        .where(AIEngineConfig.id == config_id)
        .where(AIEngineConfig.user_id == user_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    config.task = data.task
    config.model_name = data.model_name
    config.provider = data.provider
    
    await db.commit()
    
    return {"message": "配置已更新"}


@router.delete("/ai-configs/{config_id}")
async def delete_ai_config(
    config_id: int,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """删除AI引擎配置"""
    result = await db.execute(
        select(AIEngineConfig)
        .where(AIEngineConfig.id == config_id)
        .where(AIEngineConfig.user_id == user_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    await db.delete(config)
    await db.commit()
    
    return {"message": "配置已删除"}


# === API密钥 API ===

@router.get("/api-keys")
async def get_api_keys(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取API密钥列表"""
    result = await db.execute(
        select(APIKey)
        .where(APIKey.user_id == user_id)
        .order_by(APIKey.created_at.desc())
    )
    keys = result.scalars().all()
    
    return [{
        "id": k.id,
        "key": k.key,
        "name": k.name,
        "environment": k.environment,
        "isActive": k.is_active,
        "createdAt": k.created_at.isoformat() if k.created_at else None,
        "lastUsedAt": k.last_used_at.isoformat() if k.last_used_at else None
    } for k in keys]


@router.post("/api-keys")
async def create_api_key(
    name: str = "Production Key",
    environment: str = "production",
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """生成新API密钥"""
    # 生成随机密钥
    key = f"devnors_sk_live_{secrets.token_hex(16)}"
    
    api_key = APIKey(
        user_id=user_id,
        key=key,
        name=name,
        environment=environment,
        is_active=True
    )
    db.add(api_key)
    await db.commit()
    
    # 记录审计日志
    audit_log = AuditLog(
        user_id=user_id,
        action="生成新API密钥",
        actor="用户",
        ip_address="127.0.0.1"
    )
    db.add(audit_log)
    await db.commit()
    
    return {"message": "API密钥已生成", "key": key}


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: int,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """删除API密钥"""
    result = await db.execute(
        select(APIKey)
        .where(APIKey.id == key_id)
        .where(APIKey.user_id == user_id)
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API密钥不存在")
    
    await db.delete(api_key)
    await db.commit()
    
    return {"message": "API密钥已删除"}


# === 审计日志 API ===

@router.get("/audit-logs")
async def get_audit_logs(
    user_id: int = Query(1, description="用户ID"),
    limit: int = Query(50, description="返回数量"),
    db: AsyncSession = Depends(get_db)
):
    """获取审计日志"""
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id == user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    
    def format_time_ago(dt):
        if not dt:
            return "未知"
        now = datetime.utcnow()
        diff = now - dt.replace(tzinfo=None)
        
        if diff.days > 0:
            return f"{diff.days}天前"
        hours = diff.seconds // 3600
        if hours > 0:
            return f"{hours}小时前"
        minutes = diff.seconds // 60
        if minutes > 0:
            return f"{minutes}分钟前"
        return "刚刚"
    
    return [{
        "id": log.id,
        "action": log.action,
        "user": log.actor,
        "time": format_time_ago(log.created_at),
        "ip": log.ip_address or "未知"
    } for log in logs]


@router.post("/audit-logs")
async def create_audit_log(
    data: AuditLogCreate,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """创建审计日志"""
    log = AuditLog(
        user_id=user_id,
        action=data.action,
        actor=data.actor,
        ip_address=data.ip_address
    )
    db.add(log)
    await db.commit()
    
    return {"message": "日志已记录", "id": log.id}


# === 账户等级 API ===

@router.get("/account-tier")
async def get_account_tier(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取账户等级信息"""
    from app.models.user import User, AccountTier
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    tier = user.account_tier.value if user and user.account_tier else "free"
    
    tier_names = {
        "free": "Devnors 1.0",
        "pro": "Devnors 1.0 Pro",
        "ultra": "Devnors 1.0 Ultra"
    }
    
    tier_privileges = {
        "free": [
            "基础简历解析",
            "每月100次AI对话",
            "基础职位匹配"
        ],
        "pro": [
            "无限制简历结构化解析",
            "自定义多 LLM 用户路由策略",
            "API 对外调用权限",
            "团队成员无限制协作",
            "专属智能体部署通道",
            "24/7 技术专家支持"
        ],
        "ultra": [
            "所有 Pro 功能",
            "私有化部署支持",
            "定制化智能体开发",
            "专属客户成功经理",
            "SLA 99.99% 可用性保障",
            "优先访问新功能"
        ]
    }
    
    return {
        "tier": tier,
        "tierName": tier_names.get(tier, "Devnors 1.0"),
        "privileges": tier_privileges.get(tier, [])
    }
