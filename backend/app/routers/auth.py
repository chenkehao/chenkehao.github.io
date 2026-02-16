"""
Authentication Router
"""

import os
import uuid
import string
import random
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.invitation import Invitation
from app.models.token import TokenUsage, TokenPackage, TokenAction, PackageType
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserUpdate, Token
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from app.utils.audit import log_audit


def _generate_invite_code() -> str:
    """Generate a random 6-char uppercase+digit invite code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))

# 头像上传目录
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    注册新用户（支持邀请码）
    
    - **email**: 邮箱地址（唯一）
    - **password**: 密码（至少6位）
    - **name**: 用户名
    - **role**: 用户角色
    - **ref_code**: 可选，邀请人的邀请码
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )
    
    # Generate unique invite code for new user
    invite_code = _generate_invite_code()
    for _ in range(10):
        dup = await db.execute(select(User).where(User.invite_code == invite_code))
        if not dup.scalar_one_or_none():
            break
        invite_code = _generate_invite_code()
    
    # Look up inviter if ref_code provided
    inviter = None
    ref_code = (user_in.ref_code or "").strip().upper()
    if ref_code:
        inviter_result = await db.execute(select(User).where(User.invite_code == ref_code))
        inviter = inviter_result.scalar_one_or_none()
    
    # Create user
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        name=user_in.name,
        phone=user_in.phone,
        role=user_in.role,
        company_name=user_in.company_name,
        invite_code=invite_code,
        invited_by=inviter.id if inviter else None,
    )
    
    db.add(user)
    await db.flush()  # get user.id
    
    # 新用户默认免费额度: 50,000 tokens
    DEFAULT_FREE_TOKENS = 50000
    INVITER_REWARD = 50000   # 邀请人奖励
    INVITEE_BONUS = 20000    # 被邀请人额外奖励
    
    # Process referral rewards
    if inviter:
        # Create invitation record
        invitation = Invitation(
            inviter_id=inviter.id,
            invitee_id=user.id,
            invite_code=ref_code,
            reward_tokens=INVITER_REWARD,
            status="rewarded",
        )
        db.add(invitation)
        
        # Award tokens to inviter — find or create active package
        inviter_pkg_result = await db.execute(
            select(TokenPackage)
            .where(TokenPackage.user_id == inviter.id, TokenPackage.is_active == True)
            .order_by(TokenPackage.purchased_at.desc())
            .limit(1)
        )
        inviter_pkg = inviter_pkg_result.scalar_one_or_none()
        if inviter_pkg:
            inviter_pkg.total_tokens += INVITER_REWARD
            inviter_pkg.remaining_tokens += INVITER_REWARD
        else:
            db.add(TokenPackage(
                user_id=inviter.id,
                package_type=PackageType.FREE,
                total_tokens=INVITER_REWARD,
                remaining_tokens=INVITER_REWARD,
            ))
        
        # Record inviter token usage (positive = earned)
        db.add(TokenUsage(
            user_id=inviter.id,
            action=TokenAction.INVITE_REWARD,
            tokens_used=-INVITER_REWARD,  # negative = earned
            description=f"邀请奖励：用户 {user.name} 通过邀请码注册 (+{INVITER_REWARD:,} Token)",
        ))
        
        # Award bonus tokens to new user (default + bonus)
        db.add(TokenPackage(
            user_id=user.id,
            package_type=PackageType.FREE,
            total_tokens=DEFAULT_FREE_TOKENS + INVITEE_BONUS,
            remaining_tokens=DEFAULT_FREE_TOKENS + INVITEE_BONUS,
        ))
        db.add(TokenUsage(
            user_id=user.id,
            action=TokenAction.INVITE_REWARD,
            tokens_used=-INVITEE_BONUS,
            description=f"新用户邀请奖励：通过邀请码 {ref_code} 注册 (+{INVITEE_BONUS:,} Token)",
        ))
    else:
        # 无邀请码的新用户，给默认免费额度
        db.add(TokenPackage(
            user_id=user.id,
            package_type=PackageType.FREE,
            total_tokens=DEFAULT_FREE_TOKENS,
            remaining_tokens=DEFAULT_FREE_TOKENS,
        ))
    
    # 记录审计日志
    await log_audit(
        db, user_id=user.id, action=f"新用户注册：{user.email}",
        actor=user.name or user.email,
        category="auth", risk_level="info",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # 发送欢迎通知
    from app.models.notification import Notification, NotificationType, NotificationImportance
    db.add(Notification(
        user_id=user.id,
        type=NotificationType.SYSTEM,
        importance=NotificationImportance.NORMAL,
        title="欢迎加入 Devnors！",
        content="感谢注册！您已获得 50,000 免费 Token，可用于 AI 简历分析、智能匹配等功能。开始探索吧！",
        icon="Zap", color="text-amber-600", bg_color="bg-amber-50",
        link="/workbench",
        sender="系统",
    ))

    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录获取 JWT Token
    
    使用 OAuth2 密码模式
    """
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # 登录失败审计
        if user:
            await log_audit(
                db, user_id=user.id, action=f"登录失败（密码错误）：{form_data.username}",
                actor=form_data.username, category="auth", risk_level="danger",
                ip_address=ip, user_agent=ua, auto_commit=True,
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
        )
    
    # 登录成功审计
    await log_audit(
        db, user_id=user.id, action=f"用户登录成功：{user.email}",
        actor=user.name or user.email, category="auth", risk_level="info",
        ip_address=ip, user_agent=ua, auto_commit=True,
    )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/json", response_model=Token)
async def login_json(
    user_in: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录（JSON 格式）
    
    前端友好的登录接口
    """
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    # Find user
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_in.password, user.hashed_password):
        # 登录失败审计
        if user:
            await log_audit(
                db, user_id=user.id, action=f"登录失败（密码错误）：{user_in.email}",
                actor=user_in.email, category="auth", risk_level="danger",
                ip_address=ip, user_agent=ua, auto_commit=True,
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
        )
    
    # 登录成功审计
    await log_audit(
        db, user_id=user.id, action=f"用户登录成功：{user.email}",
        actor=user.name or user.email, category="auth", risk_level="info",
        ip_address=ip, user_agent=ua, auto_commit=True,
    )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """获取当前登录用户信息"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新当前用户信息"""
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.company_name is not None:
        current_user.company_name = user_update.company_name
    if user_update.company_logo is not None:
        current_user.company_logo = user_update.company_logo
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.put("/me/role")
async def update_user_role(
    role: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新用户角色（个人/企业）"""
    from app.models.user import UserRole
    
    # 支持大写枚举名称和小写枚举值
    role_lower = role.lower()
    role_upper = role.upper()
    
    new_role = None
    # 尝试通过枚举值（小写）匹配
    for r in UserRole:
        if r.value == role_lower or r.name == role_upper:
            new_role = r
            break
    
    if new_role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的角色类型，可选值：CANDIDATE, RECRUITER"
        )
    
    current_user.role = new_role
    await db.commit()
    await db.refresh(current_user)
    
    return {"message": "角色更新成功", "role": current_user.role.value}


@router.put("/me/password")
async def change_password(
    old_password: str,
    new_password: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """修改密码"""
    if not verify_password(old_password, current_user.hashed_password):
        await log_audit(
            db, user_id=current_user.id, action="密码修改失败（原密码错误）",
            actor=current_user.name or current_user.email,
            category="auth", risk_level="danger",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            auto_commit=True,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码至少6位"
        )
    
    current_user.hashed_password = get_password_hash(new_password)

    await log_audit(
        db, user_id=current_user.id, action="用户修改密码",
        actor=current_user.name or current_user.email,
        category="auth", risk_level="warning",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # 安全通知：密码已修改（关键）
    from app.models.notification import Notification, NotificationType, NotificationImportance
    db.add(Notification(
        user_id=current_user.id,
        type=NotificationType.SYSTEM,
        importance=NotificationImportance.CRITICAL,
        title="密码已修改",
        content="您的账户密码已成功修改。如非本人操作，请立即联系客服",
        icon="AlertCircle", color="text-rose-600", bg_color="bg-rose-50",
        link="/settings",
        sender="系统",
    ))

    await db.commit()
    
    return {"message": "密码修改成功"}


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(..., description="头像图片 (JPG/PNG/WEBP, 最大 5MB)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """上传/更新用户头像"""
    # 校验文件类型
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持 JPG、PNG、WEBP、GIF 格式的图片"
        )
    
    # 读取文件内容并校验大小
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="图片大小不能超过 5MB"
        )
    
    # 生成唯一文件名
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # 删除旧头像文件
    if current_user.avatar_url and "/uploads/avatars/" in current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/uploads/avatars/")[-1]
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
    
    # 保存新文件
    with open(filepath, "wb") as f:
        f.write(content)
    
    # 更新用户头像 URL
    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


LOGO_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "logos")
os.makedirs(LOGO_UPLOAD_DIR, exist_ok=True)


@router.post("/me/logo", response_model=UserResponse)
async def upload_logo(
    file: UploadFile = File(..., description="企业Logo (JPG/PNG/WEBP/SVG, 最大 5MB)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """上传/更新企业Logo"""
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持 JPG、PNG、WEBP、GIF、SVG 格式的图片"
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="图片大小不能超过 5MB"
        )

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(LOGO_UPLOAD_DIR, filename)

    if current_user.company_logo and "/uploads/logos/" in current_user.company_logo:
        old_filename = current_user.company_logo.split("/uploads/logos/")[-1]
        old_path = os.path.join(LOGO_UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    with open(filepath, "wb") as f:
        f.write(content)

    current_user.company_logo = f"/uploads/logos/{filename}"
    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
):
    """刷新 JWT Token (APP 端使用 - 用旧 Token 换新 Token)"""
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(current_user.id)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")
