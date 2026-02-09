"""
Authentication Router
"""

import os
import uuid
import string
import random
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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
    
    # Process referral rewards
    if inviter:
        inviter_reward = 500
        newuser_bonus = 200
        
        # Create invitation record
        invitation = Invitation(
            inviter_id=inviter.id,
            invitee_id=user.id,
            invite_code=ref_code,
            reward_tokens=inviter_reward,
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
            inviter_pkg.total_tokens += inviter_reward
            inviter_pkg.remaining_tokens += inviter_reward
        else:
            db.add(TokenPackage(
                user_id=inviter.id,
                package_type=PackageType.FREE,
                total_tokens=inviter_reward,
                remaining_tokens=inviter_reward,
            ))
        
        # Record inviter token usage (positive = earned)
        db.add(TokenUsage(
            user_id=inviter.id,
            action=TokenAction.INVITE_REWARD,
            tokens_used=-inviter_reward,  # negative = earned
            description=f"邀请奖励：用户 {user.name} 通过邀请码注册 (+{inviter_reward} Token)",
        ))
        
        # Award bonus tokens to new user
        db.add(TokenPackage(
            user_id=user.id,
            package_type=PackageType.FREE,
            total_tokens=100000 + newuser_bonus,
            remaining_tokens=100000 + newuser_bonus,
        ))
        db.add(TokenUsage(
            user_id=user.id,
            action=TokenAction.INVITE_REWARD,
            tokens_used=-newuser_bonus,
            description=f"新用户邀请奖励：通过邀请码 {ref_code} 注册 (+{newuser_bonus} Token)",
        ))
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录获取 JWT Token
    
    使用 OAuth2 密码模式
    """
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
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
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录（JSON 格式）
    
    前端友好的登录接口
    """
    # Find user
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """修改密码"""
    if not verify_password(old_password, current_user.hashed_password):
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
