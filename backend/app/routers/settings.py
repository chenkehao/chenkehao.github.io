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

def _mask_name(name: str) -> str:
    """姓名打码：三个字及以上打码中间，两个字打码最后一位"""
    if not name:
        return name
    # 从 "实名认证 - 陈柯好" 格式中提取姓名
    import re
    match = re.search(r'实名认证\s*[-–—]\s*([\u4e00-\u9fa5]+)', name)
    if match:
        real_name = match.group(1)
        if len(real_name) == 2:
            masked = real_name[0] + '*'
        elif len(real_name) >= 3:
            masked = real_name[0] + '*' * (len(real_name) - 2) + real_name[-1]
        else:
            masked = real_name
        return f"实名认证 - {masked}"
    # 纯姓名
    if len(name) == 2:
        return name[0] + '*'
    elif len(name) >= 3:
        return name[0] + '*' * (len(name) - 2) + name[-1]
    return name

def _mask_address(address: str) -> str:
    """地址打码：显示省市区县乡镇街道路，打码门牌号等详细地址"""
    if not address:
        return address
    import re
    # 贪婪匹配到最后一个 街/路/巷/弄/道/村/组/号 等位置标识词
    # 如 "湖北省宣恩县晓关乡文源街17号" -> "湖北省宣恩县晓关乡文源街****"
    match = re.match(r'(.*(?:街|路|巷|弄|道|村|组|里|苑|园|小区|大厦|广场))', address)
    if match:
        prefix = match.group(1)
        suffix_len = len(address) - len(prefix)
        if suffix_len > 0:
            return prefix + '****'
        return address
    # 尝试匹配到省市区县乡镇
    match = re.match(r'(.*(?:省|市|区|县|乡|镇|街道))', address)
    if match:
        prefix = match.group(1)
        suffix_len = len(address) - len(prefix)
        if suffix_len > 0:
            return prefix + '****'
    # 如果没有匹配到，显示前一半，后一半打码
    if len(address) > 6:
        return address[:len(address)//2] + '****'
    return address

def _mask_cert_number(cert_number: str) -> str:
    """证书编号打码：显示前4位和后4位，中间打码"""
    if not cert_number:
        return cert_number
    if len(cert_number) > 8:
        return cert_number[:4] + '****' + cert_number[-4:]
    return cert_number

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
    
    masked_certs = []
    for c in certs:
        cert_data = {
            "id": c.id,
            "organization": c.organization,
            "date": c.cert_date,
            "status": c.status.value if c.status else "valid",
            "category": c.category,
            "major": c.major,
            "score": c.score,
            "level": c.level,  # 身份证号已在保存时打码
            "degree": c.degree,  # 学历
            "color": c.color,
            "icon": c.icon
        }
        
        # 根据类别应用不同的打码规则
        if c.category == 'identity':
            cert_data["name"] = _mask_name(c.name)
            cert_data["degree"] = _mask_address(c.degree) if c.degree else None  # 地址打码
            cert_data["cert_number"] = None
        elif c.category == 'education':
            cert_data["name"] = _mask_name(c.name) if c.name else None
            cert_data["degree"] = c.degree
            cert_data["cert_number"] = _mask_cert_number(c.cert_number) if c.cert_number else None
        elif c.category == 'skill':
            # 技能认证：驾驶证、职业证书
            cert_data["name"] = c.name  # 证书名称不打码
            cert_data["organization"] = _mask_name(c.organization) if c.organization else None  # 姓名打码
            cert_data["degree"] = c.degree
            cert_data["cert_number"] = _mask_cert_number(c.cert_number) if c.cert_number else None
        elif c.category == 'work':
            # 工作证明：name 存储公司名称（不打码），organization 存储姓名（打码）
            cert_data["name"] = c.name  # 公司名称不打码
            cert_data["organization"] = _mask_name(c.organization) if c.organization else None  # 姓名打码
            cert_data["degree"] = c.degree  # 职位不打码
            cert_data["cert_number"] = c.cert_number
        elif c.category == 'credit':
            # 征信认证（公积金/社保）：name 存储证明类型（不打码），organization 存储姓名（打码）
            cert_data["name"] = c.name  # 证明类型不打码（公积金证明/社保证明）
            cert_data["organization"] = _mask_name(c.organization) if c.organization else None  # 姓名打码
            cert_data["level"] = c.level  # 缴存基数/参保类型不打码
            cert_data["major"] = c.major  # 缴存状态/缴纳状态不打码
            cert_data["cert_number"] = c.cert_number
        else:
            cert_data["name"] = c.name
            cert_data["degree"] = c.degree
            cert_data["cert_number"] = c.cert_number
        
        masked_certs.append(cert_data)
    
    return masked_certs


@router.post("/personal-certifications")
async def create_personal_certification(
    name: str,
    organization: str,
    cert_date: str,
    category: str = "education",
    degree: str = None,
    major: str = None,
    cert_number: str = None,
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
        cert_number=cert_number,
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


# === 证件 OCR 审核 API ===

class CertOCRRequest(BaseModel):
    image_base64: str  # base64 编码的图片数据
    cert_type: str  # 认证类型: education, skill_driver, skill_cert, work, identity_front, identity_back, credit_fund, credit_social
    user_id: Optional[int] = 1  # 用户ID，用于校验身份一致性


class CertOCRResponse(BaseModel):
    success: bool
    reason: Optional[str] = None
    extracted_info: Optional[dict] = None
    detected_side: Optional[str] = None  # 身份证正反面


@router.post("/cert-ocr-review", response_model=CertOCRResponse)
async def cert_ocr_review(request: CertOCRRequest):
    """
    使用 AI 视觉能力审核证件图片
    
    - 优先使用 MiniMax（国产），失败后尝试 Gemini
    - 分析图片内容，判断是否是有效的证件
    - 提取证件中的关键信息
    - 返回审核结果
    """
    import httpx
    import json
    import re
    from app.config import settings
    
    cert_type = request.cert_type
    image_base64 = request.image_base64
    
    # 移除可能的 data URL 前缀
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    # 构建 prompt
    prompt = _build_cert_ocr_prompt(cert_type)
    
    # 使用阿里云 OCR（专业证件识别）
    if settings.aliyun_access_key_id and settings.aliyun_access_key_secret:
        print("[OCR Review] Using Aliyun OCR API...")
        result = await _call_aliyun_ocr(
            settings.aliyun_access_key_id,
            settings.aliyun_access_key_secret,
            image_base64,
            cert_type,
            request.user_id  # 传递 user_id 用于身份校验
        )
        if result:
            return result
    
    # 阿里云不可用时的提示
    return CertOCRResponse(
        success=False,
        reason='**OCR 服务未配置或调用失败**\n\n请联系管理员检查阿里云 OCR 配置。\n\n您可以输入 "跳过" 跳过当前认证项。'
    )


async def _get_verified_identity_name(user_id: int) -> Optional[str]:
    """从数据库获取用户已认证的身份证姓名"""
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.profile import UserProfile
    from app.models.settings import PersonalCertification
    import json
    import re
    
    try:
        async with AsyncSessionLocal() as session:
            # 方法1: 从 user_profiles 表的 candidate_data 获取身份信息
            stmt = select(UserProfile).where(UserProfile.user_id == user_id)
            result = await session.execute(stmt)
            profile = result.scalar_one_or_none()
            
            if profile and profile.candidate_data:
                candidate_data = profile.candidate_data
                if isinstance(candidate_data, str):
                    candidate_data = json.loads(candidate_data)
                
                identity_info = candidate_data.get('identity_info', {})
                real_name = identity_info.get('real_name')
                
                if real_name:
                    print(f"[Aliyun OCR] Found verified name from profile: {real_name}")
                    return real_name
            
            # 方法2: 从 personal_certifications 表获取（备用）
            # 认证记录的 name 字段格式可能是 "实名认证 - 张三"
            stmt = select(PersonalCertification).where(
                PersonalCertification.user_id == user_id,
                PersonalCertification.category == 'identity'
            )
            result = await session.execute(stmt)
            cert = result.scalar_one_or_none()
            
            if cert and cert.name:
                # 尝试从 "实名认证 - 张三" 格式中提取姓名
                match = re.search(r'实名认证\s*[-–—]\s*([\u4e00-\u9fa5]{2,4})', cert.name)
                if match:
                    name = match.group(1)
                    print(f"[Aliyun OCR] Found verified name from certification: {name}")
                    return name
            
            print(f"[Aliyun OCR] No verified identity name found for user {user_id}")
            return None
    except Exception as e:
        print(f"[Aliyun OCR] Error getting verified identity name: {e}")
        return None


def _build_cert_ocr_prompt(cert_type: str) -> str:
    """根据证件类型构建 prompt"""
    if cert_type == 'education':
        return '''请仔细分析这张图片，判断它是否是一份有效的学历证书（毕业证书、学位证书或学历认证报告）。

请按以下 JSON 格式严格返回结果：
{
  "is_valid_certificate": true或false,
  "confidence": 0.0到1.0之间的数字,
  "reason": "判断原因说明",
  "certificate_type": "毕业证书/学位证书/学历认证报告/非学历证书",
  "extracted_info": {
    "学校": "学校名称",
    "专业": "专业名称",
    "学历": "学历层次",
    "学位": "学位类型",
    "毕业时间": "毕业时间",
    "证书编号": "证书编号"
  }
}

判断标准：
1. 图片中必须能看到学历证书的典型特征：红色印章、学校名称、专业、毕业时间等
2. 图片必须清晰，关键信息可辨认
3. 以下情况应判定为无效（is_valid_certificate=false）：
   - 普通照片（风景、人物、物品等）
   - 其他类型文件（身份证、工作证、名片、营业执照等）
   - 学生证、在读证明、成绩单、录取通知书
   - 图片模糊无法辨认

请只返回JSON，不要包含其他文字。'''

    elif cert_type == 'career':
        return '''请仔细分析这张图片，判断它是否是一份有效的职业资格证书。

请按以下 JSON 格式严格返回结果：
{
  "is_valid_certificate": true或false,
  "confidence": 0.0到1.0之间的数字,
  "reason": "判断原因说明",
  "certificate_type": "职业资格证书/技能等级证书/执业资格证书/非职业证书",
  "extracted_info": {
    "证书名称": "证书名称",
    "发证机构": "发证机构",
    "证书编号": "证书编号",
    "发证日期": "发证日期",
    "等级": "等级"
  }
}

判断标准：
1. 图片中必须能看到职业资格证书的典型特征
2. 以下情况应判定为无效：普通照片、学历证书、身份证、营业执照等

请只返回JSON，不要包含其他文字。'''

    elif cert_type in ['identity_front', 'identity_back']:
        return '''请仔细分析这张图片，判断它是否是一张有效的中国居民身份证。

请按以下 JSON 格式严格返回结果：
{
  "is_valid_certificate": true或false,
  "confidence": 0.0到1.0之间的数字,
  "reason": "判断原因说明",
  "detected_side": "front或back或unknown",
  "extracted_info": {
    "姓名": "姓名（正面）",
    "性别": "性别（正面）",
    "民族": "民族（正面）",
    "出生日期": "出生日期（正面）",
    "住址": "住址（正面，可部分脱敏）",
    "身份证号": "身份证号（正面，只显示前6位和后4位）",
    "签发机关": "签发机关（反面）",
    "有效期限": "有效期限（反面）"
  }
}

说明：detected_side - 正面(front)有照片和个人信息，反面(back)有国徽和签发机关

请只返回JSON，不要包含其他文字。'''

    else:
        return '''请分析这张图片，判断它是否是一份有效的证件或证书。

请按以下 JSON 格式返回结果：
{
  "is_valid_certificate": true或false,
  "confidence": 0.0到1.0之间的数字,
  "reason": "判断原因说明",
  "certificate_type": "证件类型",
  "extracted_info": {}
}

请只返回JSON，不要包含其他文字。'''


async def _call_aliyun_ocr(access_key_id: str, access_key_secret: str, image_base64: str, cert_type: str, user_id: int = 1) -> Optional[CertOCRResponse]:
    """调用阿里云 OCR API 进行证件识别"""
    import base64
    import io
    
    try:
        from alibabacloud_ocr_api20210707.client import Client as OcrClient
        from alibabacloud_ocr_api20210707 import models as ocr_models
        from alibabacloud_tea_openapi import models as open_api_models
        from alibabacloud_darabonba_stream.client import Client as StreamClient
        from alibabacloud_tea_util import models as util_models
        
        # 创建客户端配置
        config = open_api_models.Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint='ocr-api.cn-hangzhou.aliyuncs.com',
            connect_timeout=30000,  # 连接超时 30 秒
            read_timeout=60000      # 读取超时 60 秒
        )
        
        client = OcrClient(config)
        
        # 运行时配置，设置更长的超时
        runtime = util_models.RuntimeOptions(
            connect_timeout=30000,  # 连接超时 30 秒
            read_timeout=60000      # 读取超时 60 秒
        )
        
        print(f"[Aliyun OCR] Processing cert_type: {cert_type}, image size: {len(image_base64)} chars, user_id: {user_id}")
        
        # 将 base64 转为字节流
        image_bytes = base64.b64decode(image_base64)
        image_stream = io.BytesIO(image_bytes)
        
        if cert_type == 'education':
            # 使用通用文字识别来识别学历证书
            request = ocr_models.RecognizeGeneralRequest(
                body=image_stream
            )
            response = client.recognize_general_with_options(request, runtime)
            result = response.body
            
            print(f"[Aliyun OCR] Response: {result}")
            
            if result and result.data:
                import json
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                
                # 提取识别的文字内容
                content = data.get('content', '') if isinstance(data, dict) else str(data)
                
                print(f"[Aliyun OCR] Education content: {content}")
                
                # 检查是否包含学历证书关键词
                education_keywords = ['毕业', '学位', '证书', '大学', '学院', '本科', '硕士', '博士', '学士', '专业', '学历']
                has_education_content = any(kw in content for kw in education_keywords)
                
                # 检查是否是非学历证书（营业执照、身份证等）
                non_education_keywords = ['营业执照', '统一社会信用代码', '注册资本', '经营范围', '法定代表人', '工商', '税务']
                is_non_education = any(kw in content for kw in non_education_keywords)
                
                if is_non_education:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**检测到非学历证书**\n\n识别到的内容为营业执照或其他商业证件，不是学历证书。\n\n请上传：\n• 毕业证书\n• 学位证书\n• 学信网学历认证报告'
                    )
                
                if has_education_content:
                    # 尝试从内容中提取关键信息
                    import re
                    
                    # 提取证书上的姓名
                    cert_name = None
                    # 常见格式: "XXX，男/女" 或 "学生XXX" 或 "XXX同学" 或 证书开头的姓名
                    name_patterns = [
                        r'学生([\u4e00-\u9fa5]{2,4})[，,]',
                        r'([\u4e00-\u9fa5]{2,4})[，,\s]*(?:男|女)[，,\s]*',
                        r'([\u4e00-\u9fa5]{2,4})同学',
                        r'兹证明([\u4e00-\u9fa5]{2,4})',
                        r'姓名[：:]\s*([\u4e00-\u9fa5]{2,4})',
                        r'^([\u4e00-\u9fa5]{2,4})[，,]',  # 证书开头的姓名
                        r'证明\s*([\u4e00-\u9fa5]{2,4})\s*(?:同学|学生|于)',
                        r'授予\s*([\u4e00-\u9fa5]{2,4})',
                        r'([\u4e00-\u9fa5]{2,4})\s*(?:同志|先生|女士)',
                    ]
                    for pattern in name_patterns:
                        name_match = re.search(pattern, content)
                        if name_match:
                            potential_name = name_match.group(1)
                            # 过滤掉常见的非姓名词汇
                            excluded_words = ['毕业', '学位', '证书', '大学', '学院', '本科', '硕士', '博士', 
                                            '普通', '高等', '学校', '教育', '中华', '人民', '共和']
                            if potential_name not in excluded_words:
                                cert_name = potential_name
                                break
                    
                    print(f"[Aliyun OCR] Extracted name from certificate: {cert_name}")
                    
                    # 查询用户已认证的身份证信息
                    verified_name = await _get_verified_identity_name(user_id)
                    print(f"[Aliyun OCR] Verified identity name: {verified_name}")
                    
                    # 如果已有身份认证，进行姓名比对
                    if verified_name:
                        if cert_name:
                            if cert_name != verified_name:
                                return CertOCRResponse(
                                    success=False,
                                    reason=f'**身份信息不匹配**\n\n学历证书上的姓名（{cert_name}）与您已认证的身份证姓名（{verified_name}）不一致。\n\n请确保上传的是本人的学历证书。'
                                )
                            else:
                                print(f"[Aliyun OCR] Name verification passed: {cert_name} == {verified_name}")
                        else:
                            # 有身份认证但无法从证书提取姓名，需要人工核实
                            return CertOCRResponse(
                                success=False,
                                reason=f'**无法验证身份一致性**\n\n未能从学历证书中识别出姓名信息，无法与您的身份证（{verified_name}）进行核实。\n\n请上传清晰的学历证书照片，确保姓名信息可见。'
                            )
                    
                    # 提取学历信息
                    extracted_info = {}
                    
                    # 提取姓名
                    if cert_name:
                        extracted_info['姓名'] = cert_name
                    
                    # 提取学校名称
                    school_match = re.search(r'([\u4e00-\u9fa5]+(?:大学|学院|学校))', content)
                    if school_match:
                        extracted_info['学校'] = school_match.group(1)
                    
                    # 提取专业 - 改进匹配逻辑
                    major_patterns = [
                        r'([\u4e00-\u9fa5a-zA-Z]+)\s*专业(?:完成|学习)',  # 计算机科学与技术 专业完成
                        r'专业[：:]\s*([\u4e00-\u9fa5a-zA-Z]+)',
                        r'([\u4e00-\u9fa5]{4,})\s*专业',  # 至少4个字的专业名
                        r'修完([\u4e00-\u9fa5]+)专业',
                        r'在\s*([\u4e00-\u9fa5]+)\s*专业',
                    ]
                    for pattern in major_patterns:
                        major_match = re.search(pattern, content)
                        if major_match:
                            major = major_match.group(1).strip()
                            # 过滤掉不是专业的内容
                            if major not in ['本', '该', '所学', '全部', '本科', '专科'] and len(major) >= 2:
                                extracted_info['专业'] = major
                                print(f"[Aliyun OCR] Extracted major: {major}")
                                break
                    
                    # 提取学历层次
                    for degree in ['博士研究生', '硕士研究生', '博士', '硕士', '本科', '专科', '学士', '研究生']:
                        if degree in content:
                            extracted_info['学历'] = degree
                            break
                    
                    # 提取毕业时间 - 改进匹配逻辑
                    # 中文数字转换函数
                    def chinese_to_arabic(chinese_str):
                        chinese_nums = {'○': '0', '〇': '0', '零': '0', 'O': '0', 'o': '0',
                                       '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', 
                                       '六': '6', '七': '7', '八': '8', '九': '9'}
                        result = ''
                        for char in chinese_str:
                            if char in chinese_nums:
                                result += chinese_nums[char]
                            elif char.isdigit():
                                result += char
                        return result
                    
                    print(f"[Aliyun OCR] Content for date extraction: {content[-100:]}")
                    
                    # 优先匹配中文数字格式的毕业时间（学位证书常用格式）
                    # 匹配格式如 "二○一四年 六 月 三十日"
                    chinese_date_match = re.search(r'([一二三四五六七八九○〇零]{4})年\s*([一二三四五六七八九十]+)\s*月\s*([一二三四五六七八九十]+)日', content)
                    if chinese_date_match:
                        year = chinese_to_arabic(chinese_date_match.group(1))
                        month_str = chinese_date_match.group(2).strip()
                        # 处理中文月份，如"六"、"十"、"十二"
                        month_map = {'一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6',
                                    '七': '7', '八': '8', '九': '9', '十': '10', '十一': '11', '十二': '12'}
                        month = month_map.get(month_str, chinese_to_arabic(month_str))
                        extracted_info['毕业时间'] = f'{year}年{month}月'
                        print(f"[Aliyun OCR] Extracted graduation (chinese): {year}年{month}月")
                    else:
                        # 其他日期格式，但要排除出生日期（后面有"生"字的）
                        graduation_patterns = [
                            r'毕业时间[：:]\s*(\d{4})[-/年](\d{1,2})',
                            r'(\d{4})年(\d{1,2})月(\d{1,2})日(?!生)',  # 排除出生日期
                            r'(\d{4})年(\d{1,2})月(?!.*?日生)',  # 排除出生日期
                        ]
                        for pattern in graduation_patterns:
                            grad_match = re.search(pattern, content)
                            if grad_match:
                                year = grad_match.group(1)
                                month = grad_match.group(2)
                                extracted_info['毕业时间'] = f'{year}年{month}月'
                                print(f"[Aliyun OCR] Extracted graduation time: {year}年{month}月")
                                break
                    
                    # 提取证书编号
                    cert_no_match = re.search(r'证书编号[：:]\s*(\d+)', content)
                    if cert_no_match:
                        extracted_info['证书编号'] = cert_no_match.group(1)
                        print(f"[Aliyun OCR] Extracted cert number: {cert_no_match.group(1)}")
                    else:
                        print(f"[Aliyun OCR] No cert number found in content")
                    
                    extracted_info['审核状态'] = '已通过'
                    
                    return CertOCRResponse(
                        success=True,
                        extracted_info=extracted_info
                    )
                else:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**未能识别学历证书**\n\n图片中未检测到学历证书相关内容。\n\n识别到的内容：{content[:100]}...\n\n请确保上传的是：\n• 毕业证书原件照片\n• 学位证书原件照片\n• 学信网学历认证报告'
                    )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**OCR 识别失败**\n\n无法识别图片内容，请确保图片清晰可读。'
                )
                
        elif cert_type in ['identity_front', 'identity_back']:
            # 使用身份证识别
            request = ocr_models.RecognizeIdcardRequest(
                body=image_stream
            )
            response = client.recognize_idcard_with_options(request, runtime)
            result = response.body
            
            print(f"[Aliyun OCR] ID Card Response: {result}")
            
            if result and result.data:
                import json
                raw_data = json.loads(result.data) if isinstance(result.data, str) else result.data
                
                # 阿里云返回的数据结构: { "data": { "face": { "data": {...} } } }
                inner_data = raw_data.get('data', raw_data)
                face_obj = inner_data.get('face', {})
                back_obj = inner_data.get('back', {})
                
                # 提取实际的数据字段
                face = face_obj.get('data', face_obj) if face_obj else {}
                back = back_obj.get('data', back_obj) if back_obj else {}
                
                print(f"[Aliyun OCR] Parsed face data: {face}")
                print(f"[Aliyun OCR] Parsed back data: {back}")
                
                if cert_type == 'identity_front' and face:
                    # 正面信息 - 字段名适配阿里云返回格式
                    name = face.get('name', '')
                    sex = face.get('sex', '') or face.get('gender', '')
                    ethnicity = face.get('ethnicity', '')
                    birth_date = face.get('birthDate', '')
                    address = face.get('address', '')
                    id_number = face.get('idNumber', '')
                    
                    if name:  # 至少有姓名才算识别成功
                        # 保存完整数据到数据库，打码在 API 返回时进行
                        # 身份证号出于安全考虑仍在保存时打码
                        extracted_info = {
                            '姓名': name,
                            '性别': sex,
                            '民族': ethnicity,
                            '出生日期': birth_date,
                            '住址': address,  # 完整地址，API返回时打码
                            '身份证号': id_number[:6] + '****' + id_number[-4:] if len(id_number) >= 10 else id_number
                        }
                        return CertOCRResponse(
                            success=True,
                            detected_side='front',
                            extracted_info=extracted_info
                        )
                    else:
                        return CertOCRResponse(
                            success=False,
                            reason='**身份证正面识别失败**\n\n未能从图片中提取姓名信息。\n\n请确保上传的是身份证正面（人像面）照片。'
                        )
                        
                elif cert_type == 'identity_back' and back:
                    # 反面信息
                    issue_authority = back.get('issueAuthority', '')
                    valid_period = back.get('validPeriod', {})
                    
                    if isinstance(valid_period, dict):
                        start_date = valid_period.get('start', '')
                        end_date = valid_period.get('end', '')
                        valid_str = f"{start_date} - {end_date}"
                    else:
                        valid_str = str(valid_period) if valid_period else ''
                    
                    if issue_authority or valid_str:
                        extracted_info = {
                            '签发机关': issue_authority,
                            '有效期限': valid_str
                        }
                        return CertOCRResponse(
                            success=True,
                            detected_side='back',
                            extracted_info=extracted_info
                        )
                    else:
                        return CertOCRResponse(
                            success=False,
                            reason='**身份证反面识别失败**\n\n未能从图片中提取签发信息。\n\n请确保上传的是身份证反面（国徽面）照片。'
                        )
                else:
                    # 可能上传了错误的面
                    if cert_type == 'identity_front' and back:
                        return CertOCRResponse(
                            success=False,
                            reason='**上传的是身份证反面**\n\n请上传身份证正面（人像面）照片。'
                        )
                    elif cert_type == 'identity_back' and face:
                        return CertOCRResponse(
                            success=False,
                            reason='**上传的是身份证正面**\n\n请上传身份证反面（国徽面）照片。'
                        )
                    else:
                        return CertOCRResponse(
                            success=False,
                            reason='**身份证识别失败**\n\n未能识别身份证信息，请确保图片清晰且为身份证照片。'
                        )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**身份证识别失败**\n\n无法识别图片内容。'
                )
                
        elif cert_type == 'career':
            # 使用通用文字识别
            request = ocr_models.RecognizeGeneralRequest(
                body=image_stream
            )
            response = client.recognize_general_with_options(request, runtime)
            result = response.body
            
            if result and result.data:
                import json
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                content = data.get('content', '') if isinstance(data, dict) else str(data)
                
                # 检查职业资格证书关键词
                career_keywords = ['资格', '证书', '职业', '技能', '等级', '工程师', '会计', '律师', '医师', '教师', '建造师']
                has_career_content = any(kw in content for kw in career_keywords)
                
                if has_career_content:
                    extracted_info = {
                        '识别内容': content[:200] + '...' if len(content) > 200 else content,
                        '审核状态': '已通过'
                    }
                    return CertOCRResponse(
                        success=True,
                        extracted_info=extracted_info
                    )
                else:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**未能识别职业资格证书**\n\n图片中未检测到职业资格证书相关内容。\n\n请上传正确的职业资格证书。'
                    )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**OCR 识别失败**\n\n无法识别图片内容。'
                )
        
        elif cert_type == 'skill_driver':
            # 驾驶证识别 - 使用阿里云驾驶证识别 API
            try:
                request = ocr_models.RecognizeDriverLicenseRequest(
                    body=image_stream
                )
                response = client.recognize_driver_license_with_options(request, runtime)
                result = response.body
                
                print(f"[Aliyun OCR] Driver License Response: {result}")
                
                if result and result.data:
                    import json
                    data = json.loads(result.data) if isinstance(result.data, str) else result.data
                    print(f"[Aliyun OCR] Driver License Raw Data: {json.dumps(data, ensure_ascii=False)}")
                    
                    # 阿里云驾驶证 OCR 返回数据结构可能有多种形式，尝试多种解析路径
                    name = ''
                    license_no = ''
                    vehicle_class = ''
                    valid_period = ''
                    issue_date = ''
                    
                    # 路径1: data.face.data (文档示例格式)
                    if 'data' in data and isinstance(data['data'], dict):
                        inner_data = data['data']
                        if 'face' in inner_data:
                            face_obj = inner_data['face']
                            face_data = face_obj.get('data', {}) if isinstance(face_obj, dict) else {}
                            name = name or face_data.get('name', '')
                            license_no = license_no or face_data.get('licenseNumber', '')
                            vehicle_class = vehicle_class or face_data.get('approvedType', '')
                            valid_period = valid_period or face_data.get('validPeriod', '')
                            issue_date = issue_date or face_data.get('initialIssueDate', '')
                            print(f"[Aliyun OCR] Path1 face.data: name={name}, license={license_no}, type={vehicle_class}, period={valid_period}")
                        if 'back' in inner_data:
                            back_obj = inner_data['back']
                            back_data = back_obj.get('data', {}) if isinstance(back_obj, dict) else {}
                            name = name or back_data.get('name', '')
                            license_no = license_no or back_data.get('licenseNumber', '')
                            print(f"[Aliyun OCR] Path1 back.data: name={name}, license={license_no}")
                    
                    # 路径2: face 直接在根级别
                    if 'face' in data:
                        face_obj = data['face']
                        face_data = face_obj.get('data', face_obj) if isinstance(face_obj, dict) else {}
                        name = name or face_data.get('name', '')
                        license_no = license_no or face_data.get('licenseNumber', '')
                        vehicle_class = vehicle_class or face_data.get('approvedType', '')
                        valid_period = valid_period or face_data.get('validPeriod', '')
                        issue_date = issue_date or face_data.get('initialIssueDate', '')
                        print(f"[Aliyun OCR] Path2 root.face: name={name}, license={license_no}, type={vehicle_class}")
                    
                    # 路径3: 字段直接在根级别（某些 API 版本）
                    name = name or data.get('name', '') or data.get('姓名', '')
                    license_no = license_no or data.get('licenseNumber', '') or data.get('证号', '')
                    vehicle_class = vehicle_class or data.get('approvedType', '') or data.get('vehicleType', '') or data.get('准驾车型', '')
                    valid_period = valid_period or data.get('validPeriod', '') or data.get('有效期限', '')
                    
                    print(f"[Aliyun OCR] Final Extracted - name: {name}, vehicle_class: {vehicle_class}, valid_period: {valid_period}, license_no: {license_no}")
                    
                    if name or vehicle_class:
                        extracted_info = {
                            '姓名': name,
                            '准驾车型': vehicle_class,
                            '有效期至': valid_period,
                            '初次领证': issue_date,
                            '证号': license_no  # 不在 OCR 时打码，由后端 API 返回时统一打码
                        }
                        return CertOCRResponse(
                            success=True,
                            extracted_info=extracted_info
                        )
                    else:
                        return CertOCRResponse(
                            success=False,
                            reason='**驾驶证识别失败**\n\n未能从图片中提取驾驶证信息。\n\n请确保上传的是驾驶证正本照片。'
                        )
                else:
                    return CertOCRResponse(
                        success=False,
                        reason='**驾驶证识别失败**\n\n无法识别图片内容。'
                    )
            except Exception as driver_error:
                # 如果驾驶证专用 API 失败，使用通用识别
                print(f"[Aliyun OCR] Driver license API failed, falling back to general: {driver_error}")
                image_stream.seek(0)
                request = ocr_models.RecognizeGeneralRequest(body=image_stream)
                response = client.recognize_general_with_options(request, runtime)
                
                if response.body and response.body.data:
                    import json
                    data = json.loads(response.body.data) if isinstance(response.body.data, str) else response.body.data
                    content = data.get('content', '') if isinstance(data, dict) else str(data)
                    
                    print(f"[Aliyun OCR] General OCR content for driver license: {content[:500]}")
                    
                    # 检查驾驶证关键词
                    driver_keywords = ['驾驶证', '准驾车型', 'C1', 'C2', 'A1', 'A2', 'B1', 'B2', '机动车', '驾驶人', '有效期']
                    if any(kw in content for kw in driver_keywords):
                        # 尝试从内容中提取信息
                        import re
                        
                        # 提取姓名 - 多种格式
                        # 排除常见标签词（性别、国籍等），只匹配中文姓名（2-4个汉字）
                        name_match = re.search(r'姓名[：:\s]*([^\s性国民住地址出生日期,，。\n]{2,4})', content)
                        if not name_match:
                            # 尝试匹配 "姓名" 后紧跟的中文名字（2-4个汉字）
                            name_match = re.search(r'姓名[：:\s]*([\u4e00-\u9fa5]{2,4})(?:性别|国籍|住址|出生|$|\s)', content)
                        if not name_match:
                            name_match = re.search(r'驾驶人[：:\s]*([\u4e00-\u9fa5]{2,4})', content)
                        
                        # 提取准驾车型
                        class_match = re.search(r'准驾车型[：:\s]*([A-Z0-9]+)', content)
                        if not class_match:
                            class_match = re.search(r'([ABCDEF][123]?[ABCDEF]?|D|E|F|M|N|P)', content)
                        
                        # 提取证号
                        license_match = re.search(r'证号[：:\s]*(\d{12,18})', content)
                        if not license_match:
                            # 尝试匹配身份证号格式的证号
                            license_match = re.search(r'(\d{15}|\d{17}[\dXx])', content)
                        
                        # 提取有效期 - 支持多种格式
                        valid_period = ''
                        
                        # 格式1: "有效期限 2019.06.26-2025.06.26" 或 "有效期 2019年6月26日至2025年6月26日"
                        valid_match = re.search(r'有效期限?[：:\s]*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}日?)\s*[-至到–—]\s*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}日?|长期)', content)
                        if valid_match:
                            valid_period = f"{valid_match.group(1)} 至 {valid_match.group(2)}"
                            print(f"[Aliyun OCR] Valid period matched format 1: {valid_period}")
                        
                        # 格式2: "2019.06.26-2025.06.26" 或 "2019.06.26至2025.06.26" (无"有效期"前缀)
                        if not valid_period:
                            valid_match = re.search(r'(\d{4}\.\d{2}\.\d{2})\s*[-至到–—]\s*(\d{4}\.\d{2}\.\d{2}|长期)', content)
                            if valid_match:
                                valid_period = f"{valid_match.group(1)} 至 {valid_match.group(2)}"
                                print(f"[Aliyun OCR] Valid period matched format 2: {valid_period}")
                        
                        # 格式3: "至 2025.06.26" 或 "至 2025年6月26日"
                        if not valid_period:
                            valid_match = re.search(r'至[：:\s]*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}日?)', content)
                            if valid_match:
                                valid_period = f"至 {valid_match.group(1)}"
                                print(f"[Aliyun OCR] Valid period matched format 3: {valid_period}")
                        
                        # 格式4: 查找任意日期范围格式 "YYYY.MM.DD-YYYY.MM.DD"
                        if not valid_period:
                            valid_match = re.search(r'(\d{4}[-./]\d{2}[-./]\d{2})\s*[-至到–—]\s*(\d{4}[-./]\d{2}[-./]\d{2})', content)
                            if valid_match:
                                valid_period = f"{valid_match.group(1)} 至 {valid_match.group(2)}"
                                print(f"[Aliyun OCR] Valid period matched format 4: {valid_period}")
                        
                        # 格式5: "6年" 有效期年限
                        if not valid_period:
                            valid_match = re.search(r'有效期限?\s*[：:\s]*(\d+)\s*年', content)
                            if valid_match:
                                valid_period = f"{valid_match.group(1)}年"
                                print(f"[Aliyun OCR] Valid period matched format 5: {valid_period}")
                        
                        if not valid_period:
                            print(f"[Aliyun OCR] No valid period found in content")
                        
                        # 提取初次领证日期
                        issue_date = ''
                        issue_match = re.search(r'初次领证日期[：:\s]*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}日?)', content)
                        if not issue_match:
                            issue_match = re.search(r'初次领证[：:\s]*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}日?)', content)
                        if not issue_match:
                            # 尝试匹配格式如 "2019-06-26" 在"初次领证"附近
                            issue_match = re.search(r'领证日期[：:\s]*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}日?)', content)
                        if issue_match:
                            issue_date = issue_match.group(1)
                            print(f"[Aliyun OCR] Issue date extracted: {issue_date}")
                        
                        name = name_match.group(1) if name_match else ''
                        vehicle_class = class_match.group(1) if class_match else ''
                        license_no = license_match.group(1) if license_match else ''
                        
                        print(f"[Aliyun OCR] General fallback extracted - name: {name}, class: {vehicle_class}, license: {license_no}, valid: {valid_period}, issue: {issue_date}")
                        
                        extracted_info = {
                            '姓名': name,
                            '准驾车型': vehicle_class,
                            '证号': license_no,
                            '有效期至': valid_period,
                            '初次领证': issue_date
                        }
                        return CertOCRResponse(success=True, extracted_info=extracted_info)
                    
                return CertOCRResponse(
                    success=False,
                    reason='**未能识别驾驶证**\n\n图片中未检测到驾驶证相关内容。\n\n请上传清晰的驾驶证照片。'
                )
        
        elif cert_type == 'skill_cert':
            # 职业资格证书识别 - 使用通用文字识别
            request = ocr_models.RecognizeGeneralRequest(
                body=image_stream
            )
            response = client.recognize_general_with_options(request, runtime)
            result = response.body
            
            if result and result.data:
                import json
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                content = data.get('content', '') if isinstance(data, dict) else str(data)
                
                print(f"[Aliyun OCR] Skill cert OCR content: {content[:500]}...")
                
                # 检查职业资格证书关键词
                skill_keywords = ['资格', '证书', '职业', '技能', '等级', '工程师', '会计', '律师', '医师', 
                                 '教师', '建造师', 'PMP', 'CPA', 'CFA', '护士', '执业', '认证', '合格']
                has_skill_content = any(kw in content for kw in skill_keywords)
                
                if has_skill_content:
                    import re
                    # 尝试提取证书信息 - 增强姓名提取逻辑
                    # 尝试多种姓名格式
                    name_match = re.search(r'姓名[：:]\s*([\u4e00-\u9fa5]{2,4})', content)
                    if not name_match:
                        # 尝试匹配 "持证人：xxx" 格式
                        name_match = re.search(r'持证人[：:]\s*([\u4e00-\u9fa5]{2,4})', content)
                    if not name_match:
                        # 尝试匹配连续的2-4个中文字符作为姓名（通常在证书开头）
                        name_match = re.search(r'^[^\u4e00-\u9fa5]*([\u4e00-\u9fa5]{2,4})\s*(?:同志|先生|女士)?', content)
                    
                    cert_name_match = re.search(r'证书名称[：:]\s*(.+?)(?:\n|$)', content)
                    cert_no_match = re.search(r'(?:证书编号|编号|证号)[：:]\s*(\S+)', content)
                    level_match = re.search(r'(?:等级|级别)[：:]\s*(\S+)', content)
                    org_match = re.search(r'(?:发证机关|颁发单位|发证单位|签发单位)[：:]\s*(.+?)(?:\n|$)', content)
                    
                    # 尝试提取证书类型/种类
                    cert_type_match = re.search(r'([\u4e00-\u9fa5]+(?:资格|证书|执业|等级|技能)[\u4e00-\u9fa5]*)', content)
                    cert_type_name = ''
                    if cert_type_match:
                        cert_type_name = cert_type_match.group(1).strip()
                    elif cert_name_match:
                        cert_type_name = cert_name_match.group(1).strip()
                    
                    # 提取姓名
                    cert_holder_name = name_match.group(1) if name_match else ''
                    print(f"[Aliyun OCR] Skill cert OCR full content: {content}")
                    print(f"[Aliyun OCR] Extracted name from skill cert: '{cert_holder_name}'")
                    
                    # 查询用户已认证的身份证信息，进行姓名比对
                    verified_name = await _get_verified_identity_name(user_id)
                    print(f"[Aliyun OCR] Verified identity name from DB: '{verified_name}'")
                    
                    if verified_name:
                        if cert_holder_name:
                            # 姓名比对
                            if cert_holder_name != verified_name:
                                print(f"[Aliyun OCR] Name mismatch! cert='{cert_holder_name}' vs identity='{verified_name}'")
                                return CertOCRResponse(
                                    success=False,
                                    reason=f'**身份信息不匹配**\n\n职业证书上的姓名（{cert_holder_name}）与您已认证的身份证姓名（{verified_name}）不一致。\n\n请上传本人的职业证书，或输入 **"跳过"** 跳过此项。'
                                )
                            else:
                                print(f"[Aliyun OCR] Skill cert name verification passed: {cert_holder_name} == {verified_name}")
                        else:
                            # 无法从证书提取姓名，返回错误提示用户上传更清晰的证书
                            print(f"[Aliyun OCR] Cannot extract name from skill cert, asking user to re-upload")
                            return CertOCRResponse(
                                success=False,
                                reason=f'**无法验证证书姓名**\n\n未能从职业证书中识别出姓名信息，无法与您的身份证（{verified_name}）进行核实。\n\n请上传清晰的职业证书照片，确保姓名信息可见，或输入 **"跳过"** 跳过此项。'
                            )
                    
                    extracted_info = {
                        '姓名': cert_holder_name,
                        '证书类型': cert_type_name,
                        '证书名称': cert_name_match.group(1).strip() if cert_name_match else '',
                        '证书编号': cert_no_match.group(1) if cert_no_match else '',
                        '等级': level_match.group(1) if level_match else '',
                        '发证机构': org_match.group(1).strip() if org_match else '',
                        '审核状态': '已上传'
                    }
                    # 过滤空值
                    extracted_info = {k: v for k, v in extracted_info.items() if v}
                    extracted_info['审核状态'] = '已上传'
                    
                    return CertOCRResponse(
                        success=True,
                        extracted_info=extracted_info
                    )
                else:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**未能识别职业证书**\n\n图片中未检测到职业资格证书相关内容。\n\n**支持的证书类型：**\n• 国家职业资格证书\n• 专业技术资格证书\n• 技能等级证书\n• 行业认证证书\n\n请上传正确的证书照片。'
                    )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**OCR 识别失败**\n\n无法识别图片内容。'
                )
        
        elif cert_type == 'work':
            # 工作证明识别 - 使用通用文字识别
            request = ocr_models.RecognizeGeneralRequest(
                body=image_stream
            )
            response = client.recognize_general_with_options(request, runtime)
            result = response.body
            
            if result and result.data:
                import json
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                content = data.get('content', '') if isinstance(data, dict) else str(data)
                
                # 检查工作证明关键词
                work_keywords = ['公司', '企业', '集团', '有限', '股份', '科技', '在职', '离职', '证明',
                                '员工', '职员', '工牌', '工号', '部门', '@', '.com', '邮箱', '劳动合同']
                has_work_content = any(kw in content for kw in work_keywords)
                
                if has_work_content:
                    import re
                    print(f"[Aliyun OCR] Work cert OCR content: {content}")
                    
                    # 尝试提取工作信息 - 改进正则表达式
                    # 提取姓名 - 多种格式
                    name_match = re.search(r'(?:姓名|员工|持证人)[：:]\s*([\u4e00-\u9fa5]{2,4})', content)
                    if not name_match:
                        # 尝试匹配开头的中文姓名
                        name_match = re.search(r'^[^a-zA-Z\u4e00-\u9fa5]*([\u4e00-\u9fa5]{2,4})\s', content)
                    
                    # 提取公司名称 - 匹配完整的公司名（包含前面的地名等）
                    company_match = re.search(r'([\u4e00-\u9fa5]+(?:公司|企业|集团|有限责任|股份有限|科技|网络|信息|技术)[\u4e00-\u9fa5]*(?:公司|企业)?)', content)
                    
                    # 提取职位 - 多种格式
                    position_match = re.search(r'(?:职位|岗位|职务|职称)[：:]\s*([\u4e00-\u9fa5a-zA-Z]+)', content)
                    if not position_match:
                        # 尝试匹配常见职位名称
                        position_match = re.search(r'(创始人|CEO|CTO|CFO|COO|总经理|副总|经理|主管|总监|工程师|设计师|产品经理|运营|销售|市场|人事|财务|行政)', content)
                    
                    dept_match = re.search(r'(?:部门)[：:]\s*(\S+)', content)
                    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', content)
                    date_match = re.search(r'(\d{4})[年/-](\d{1,2})[月/-]?\s*[-至到]\s*(\d{4})?[年/-]?(\d{1,2})?[月/-]?|(\d{4})[年/-](\d{1,2})[月/-]', content)
                    
                    # 提取结果
                    extracted_name = name_match.group(1) if name_match else ''
                    extracted_company = company_match.group(1) if company_match else ''
                    extracted_position = position_match.group(1) if position_match else ''
                    
                    print(f"[Aliyun OCR] Extracted - Name: '{extracted_name}', Company: '{extracted_company}', Position: '{extracted_position}'")
                    
                    # 查询用户已认证的身份证信息，进行姓名比对
                    verified_name = await _get_verified_identity_name(user_id)
                    print(f"[Aliyun OCR] Verified identity name from DB: '{verified_name}'")
                    
                    if verified_name:
                        if extracted_name:
                            if extracted_name != verified_name:
                                print(f"[Aliyun OCR] Work cert name mismatch! cert='{extracted_name}' vs identity='{verified_name}'")
                                return CertOCRResponse(
                                    success=False,
                                    reason=f'**身份信息不匹配**\n\n工作证明上的姓名（{extracted_name}）与您已认证的身份证姓名（{verified_name}）不一致。\n\n请上传本人的工作证明，或输入 **"跳过"** 跳过此项。'
                                )
                            else:
                                print(f"[Aliyun OCR] Work cert name verification passed: {extracted_name} == {verified_name}")
                    
                    # 检测证明类型
                    proof_type = '工牌'
                    if '在职' in content and '证明' in content:
                        proof_type = '在职证明'
                    elif '离职' in content and '证明' in content:
                        proof_type = '离职证明'
                    elif email_match:
                        proof_type = '企业邮箱'
                    elif '劳动合同' in content or '合同' in content:
                        proof_type = '劳动合同'
                    
                    work_period = ''
                    if date_match:
                        groups = date_match.groups()
                        if groups[0]:  # 时间范围格式
                            start = f"{groups[0]}年{groups[1]}月"
                            if groups[2]:
                                end = f"{groups[2]}年{groups[3]}月" if groups[3] else f"{groups[2]}年"
                                work_period = f"{start} - {end}"
                            else:
                                work_period = f"{start} - 至今"
                        elif groups[4]:  # 单个日期
                            work_period = f"{groups[4]}年{groups[5]}月"
                    
                    extracted_info = {
                        '姓名': extracted_name,
                        '公司名称': extracted_company,
                        '职位': extracted_position,
                        '部门': dept_match.group(1) if dept_match else '',
                        '企业邮箱': email_match.group(0) if email_match else '',
                        '在职时间': work_period,
                        '认证方式': proof_type,
                        '审核状态': '已上传'
                    }
                    # 过滤空值
                    extracted_info = {k: v for k, v in extracted_info.items() if v}
                    extracted_info['审核状态'] = '已上传'
                    
                    return CertOCRResponse(
                        success=True,
                        extracted_info=extracted_info
                    )
                else:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**未能识别工作证明**\n\n图片中未检测到工作相关内容。\n\n**支持的证明类型：**\n• 工牌照片\n• 企业邮箱截图\n• 在职证明\n• 离职证明\n• 劳动合同\n\n请确保公司名称和您的姓名清晰可见。'
                    )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**OCR 识别失败**\n\n无法识别图片内容。'
                )
        
        elif cert_type == 'credit_fund':
            # 公积金证明识别 - 使用通用文字识别
            request = ocr_models.RecognizeGeneralRequest(
                body=image_stream
            )
            response = client.recognize_general_with_options(request, runtime)
            result = response.body
            
            if result and result.data:
                import json
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                content = data.get('content', '') if isinstance(data, dict) else str(data)
                
                # 检查公积金证明关键词
                fund_keywords = ['公积金', '住房', '缴存', '账户', '月缴存额', '基数', '缴存单位', '管理中心']
                has_fund_content = any(kw in content for kw in fund_keywords)
                
                if has_fund_content:
                    import re
                    # 尝试提取公积金信息
                    name_match = re.search(r'(?:姓名|缴存人)[：:]\s*(\S+)', content)
                    base_match = re.search(r'(?:缴存基数|月缴基数)[：:]\s*([\d,\.]+)', content)
                    status_match = re.search(r'(?:账户状态|缴存状态)[：:]\s*(\S+)', content)
                    date_match = re.search(r'(\d{4})[年/-](\d{1,2})[月/-]?\s*[-至到]\s*(\d{4})?[年/-]?(\d{1,2})?[月/-]?|(\d{4})[年/-](\d{1,2})[月/-]', content)
                    
                    fund_period = ''
                    if date_match:
                        groups = date_match.groups()
                        if groups[0]:
                            start = f"{groups[0]}年{groups[1]}月"
                            if groups[2]:
                                end = f"{groups[2]}年{groups[3]}月" if groups[3] else f"{groups[2]}年"
                                fund_period = f"{start} - {end}"
                            else:
                                fund_period = f"{start} - 至今"
                        elif groups[4]:
                            fund_period = f"{groups[4]}年{groups[5]}月"
                    
                    extracted_info = {
                        '姓名': name_match.group(1) if name_match else '',
                        '缴存基数': (base_match.group(1) + '元') if base_match else '',
                        '缴存状态': status_match.group(1) if status_match else '正常缴存',
                        '缴存时间': fund_period,
                        '审核状态': '已上传'
                    }
                    # 过滤空值
                    extracted_info = {k: v for k, v in extracted_info.items() if v}
                    extracted_info['审核状态'] = '已上传'
                    
                    return CertOCRResponse(
                        success=True,
                        extracted_info=extracted_info
                    )
                else:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**未能识别公积金证明**\n\n图片中未检测到公积金相关内容。\n\n**支持的证明类型：**\n• 公积金缴存证明\n• 公积金账户截图\n• 住房公积金查询结果\n\n请确保姓名和缴存信息清晰可见。'
                    )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**OCR 识别失败**\n\n无法识别图片内容。'
                )
        
        elif cert_type == 'credit_social':
            # 社保证明识别 - 使用通用文字识别
            request = ocr_models.RecognizeGeneralRequest(
                body=image_stream
            )
            response = client.recognize_general_with_options(request, runtime)
            result = response.body
            
            if result and result.data:
                import json
                data = json.loads(result.data) if isinstance(result.data, str) else result.data
                content = data.get('content', '') if isinstance(data, dict) else str(data)
                
                # 检查社保证明关键词
                social_keywords = ['社保', '社会保险', '医保', '养老', '失业', '工伤', '生育', '缴费基数', '参保', '保险']
                has_social_content = any(kw in content for kw in social_keywords)
                
                if has_social_content:
                    import re
                    # 尝试提取社保信息
                    name_match = re.search(r'(?:姓名|参保人)[：:]\s*(\S+)', content)
                    type_match = re.search(r'(?:参保类型|险种)[：:]\s*(\S+)', content)
                    status_match = re.search(r'(?:缴费状态|参保状态)[：:]\s*(\S+)', content)
                    date_match = re.search(r'(\d{4})[年/-](\d{1,2})[月/-]?\s*[-至到]\s*(\d{4})?[年/-]?(\d{1,2})?[月/-]?|(\d{4})[年/-](\d{1,2})[月/-]', content)
                    
                    social_period = ''
                    if date_match:
                        groups = date_match.groups()
                        if groups[0]:
                            start = f"{groups[0]}年{groups[1]}月"
                            if groups[2]:
                                end = f"{groups[2]}年{groups[3]}月" if groups[3] else f"{groups[2]}年"
                                social_period = f"{start} - {end}"
                            else:
                                social_period = f"{start} - 至今"
                        elif groups[4]:
                            social_period = f"{groups[4]}年{groups[5]}月"
                    
                    # 检测参保类型
                    insurance_type = ''
                    if '五险一金' in content or ('养老' in content and '医保' in content):
                        insurance_type = '五险一金'
                    elif '养老' in content:
                        insurance_type = '养老保险'
                    elif '医保' in content or '医疗' in content:
                        insurance_type = '医疗保险'
                    
                    extracted_info = {
                        '姓名': name_match.group(1) if name_match else '',
                        '参保类型': type_match.group(1) if type_match else insurance_type,
                        '缴纳状态': status_match.group(1) if status_match else '正常缴纳',
                        '缴纳时间': social_period,
                        '审核状态': '已上传'
                    }
                    # 过滤空值
                    extracted_info = {k: v for k, v in extracted_info.items() if v}
                    extracted_info['审核状态'] = '已上传'
                    
                    return CertOCRResponse(
                        success=True,
                        extracted_info=extracted_info
                    )
                else:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**未能识别社保证明**\n\n图片中未检测到社保相关内容。\n\n**支持的证明类型：**\n• 社保缴纳证明\n• 社保账户截图\n• 社保查询结果\n\n请确保姓名和缴纳信息清晰可见。'
                    )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**OCR 识别失败**\n\n无法识别图片内容。'
                )
        
        else:
            # 其他类型使用通用识别
            request = ocr_models.RecognizeGeneralRequest(
                body=image_stream
            )
            response = client.recognize_general_with_options(request, runtime)
            
            if response.body and response.body.data:
                return CertOCRResponse(
                    success=True,
                    extracted_info={'审核状态': '已通过'}
                )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**OCR 识别失败**'
                )
                
    except Exception as e:
        error_str = str(e)
        print(f"[Aliyun OCR] Exception: {type(e).__name__}: {error_str}")
        
        # 解析阿里云错误
        if 'InvalidAccessKeyId' in error_str:
            return CertOCRResponse(
                success=False,
                reason='**阿里云 AccessKey 无效**\n\n请检查 AccessKey ID 是否正确。'
            )
        elif 'SignatureDoesNotMatch' in error_str:
            return CertOCRResponse(
                success=False,
                reason='**阿里云签名错误**\n\n请检查 AccessKey Secret 是否正确。'
            )
        elif 'Forbidden' in error_str or 'NoPermission' in error_str or 'noPermission' in error_str:
            return CertOCRResponse(
                success=False,
                reason='**阿里云权限不足**\n\n请确保已开通 OCR 服务并授予相应权限。'
            )
        elif 'unmatchedImageType' in error_str:
            # 图片类型不匹配 - 不是有效的身份证图片
            if cert_type in ['identity_front', 'identity_back']:
                return CertOCRResponse(
                    success=False,
                    reason='**未检测到有效身份证**\n\n上传的图片不是有效的身份证照片。\n\n请确保：\n• 上传的是身份证原件照片（非复印件）\n• 图片清晰，四角完整可见\n• 如是正面：人像和文字清晰可辨\n• 如是反面：国徽和有效期清晰可辨\n\n请重新拍摄后上传。'
                )
            else:
                return CertOCRResponse(
                    success=False,
                    reason='**图片格式不支持**\n\n请上传清晰的证件照片。'
                )
        elif 'ocrServiceNotOpen' in error_str:
            return CertOCRResponse(
                success=False,
                reason='**OCR 服务未开通**\n\n请在阿里云控制台开通 OCR 服务后重试。'
            )
        else:
            return CertOCRResponse(
                success=False,
                reason=f'**阿里云 OCR 调用失败**\n\n错误: {error_str[:200]}'
            )


async def _call_minimax_vision(api_key: str, image_base64: str, prompt: str) -> Optional[CertOCRResponse]:
    """调用 MiniMax 多模态 API"""
    import httpx
    import json
    import re
    
    try:
        # MiniMax 多模态 API 端点
        url = "https://api.minimax.chat/v1/text/chatcompletion_v2"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # MiniMax 多模态请求格式 - 使用 abab6.5s-chat 支持图像
        # 图像需要以 base64 data URL 格式传递
        payload = {
            "model": "abab6.5s-chat",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "max_tokens": 2000,
            "temperature": 0.1
        }
        
        print(f"[MiniMax OCR] Calling API, image size: {len(image_base64)} chars")
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            print(f"[MiniMax OCR] Response status: {response.status_code}")
            
            if response.status_code != 200:
                error_text = response.text[:500]
                print(f"[MiniMax OCR] Error response: {error_text}")
                
                # 解析错误信息
                try:
                    error_json = response.json()
                    error_msg = error_json.get("base_resp", {}).get("status_msg", error_text)
                    return CertOCRResponse(
                        success=False,
                        reason=f'**MiniMax API 错误**\n\n{error_msg}'
                    )
                except:
                    return CertOCRResponse(
                        success=False,
                        reason=f'**MiniMax API 错误**\n\nHTTP {response.status_code}: {error_text}'
                    )
            
            result = response.json()
            print(f"[MiniMax OCR] Response keys: {result.keys()}")
            
            # 检查 API 返回的错误
            if "base_resp" in result:
                status_code = result["base_resp"].get("status_code", 0)
                if status_code != 0:
                    error_msg = result["base_resp"].get("status_msg", "未知错误")
                    print(f"[MiniMax OCR] API Error: {error_msg}")
                    return CertOCRResponse(
                        success=False,
                        reason=f'**MiniMax API 错误**\n\n{error_msg}'
                    )
            
            if "choices" not in result or len(result["choices"]) == 0:
                print(f"[MiniMax OCR] No choices in response: {result}")
                return CertOCRResponse(
                    success=False,
                    reason='**MiniMax API 返回为空**\n\n请稍后再试。'
                )
            
            response_text = result["choices"][0]["message"]["content"]
            print(f"[MiniMax OCR] Response text: {response_text[:300]}...")
            
            return _parse_ocr_response(response_text)
            
    except httpx.TimeoutException:
        print("[MiniMax OCR] Request timeout")
        return CertOCRResponse(
            success=False,
            reason='**请求超时**\n\n图片处理时间过长，请尝试上传更小的图片或稍后再试。'
        )
    except Exception as e:
        print(f"[MiniMax OCR] Exception: {type(e).__name__}: {str(e)}")
        return CertOCRResponse(
            success=False,
            reason=f'**MiniMax API 调用失败**\n\n错误: {str(e)}'
        )


def _parse_ocr_response(response_text: str) -> Optional[CertOCRResponse]:
    """解析 AI 响应"""
    import json
    import re
    
    try:
        # 尝试提取 JSON
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            print("[OCR] No JSON found in response")
            return None
        
        result = json.loads(json_match.group())
        
        is_valid = result.get("is_valid_certificate", False)
        confidence = result.get("confidence", 0)
        
        # 处理布尔值可能是字符串的情况
        if isinstance(is_valid, str):
            is_valid = is_valid.lower() == "true"
        
        # 置信度低于 0.6 也视为无效
        if isinstance(confidence, (int, float)) and confidence < 0.6:
            is_valid = False
        
        if is_valid:
            return CertOCRResponse(
                success=True,
                extracted_info=result.get("extracted_info", {}),
                detected_side=result.get("detected_side")
            )
        else:
            return CertOCRResponse(
                success=False,
                reason=result.get("reason", "无法识别为有效证件")
            )
            
    except json.JSONDecodeError as e:
        print(f"[OCR] JSON parse error: {str(e)}")
        return None
    except Exception as e:
        print(f"[OCR] Parse error: {str(e)}")
        return None
