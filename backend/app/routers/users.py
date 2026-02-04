"""
Users Router
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, TeamMember, UserRole
from app.schemas.user import UserResponse, UserUpdate, TeamMemberCreate, TeamMemberResponse
from app.utils.security import get_current_user

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户列表（仅管理员）
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取指定用户信息"""
    # Only admin can view other users
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新用户信息"""
    # Only allow updating own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能修改自己的信息"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # Update fields
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user


# --- Team Members ---

@router.get("/team/members", response_model=List[TeamMemberResponse])
async def list_team_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取团队成员列表"""
    result = await db.execute(
        select(TeamMember).where(TeamMember.owner_id == current_user.id)
    )
    members = result.scalars().all()
    return members


@router.post("/team/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    member_in: TeamMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """邀请团队成员"""
    # Check if recruiter role
    if current_user.role not in [UserRole.ADMIN, UserRole.RECRUITER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有企业用户可以邀请团队成员"
        )
    
    # Check if already invited
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.owner_id == current_user.id,
            TeamMember.invited_email == member_in.email
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该成员已被邀请"
        )
    
    # Create invitation
    member = TeamMember(
        owner_id=current_user.id,
        invited_email=member_in.email,
        role=member_in.role,
    )
    
    db.add(member)
    await db.commit()
    await db.refresh(member)
    
    return member


@router.delete("/team/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """移除团队成员"""
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.id == member_id,
            TeamMember.owner_id == current_user.id
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="成员不存在"
        )
    
    await db.delete(member)
    await db.commit()
