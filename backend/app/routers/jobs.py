"""
Jobs Router
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job, JobTag, JobStatus
from app.schemas.job import (
    JobCreate, JobUpdate, JobResponse, JobListResponse,
    JobTagCreate, JobTagResponse
)
from app.utils.security import get_current_user

router = APIRouter()


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    status: Optional[JobStatus] = JobStatus.ACTIVE,
    db: AsyncSession = Depends(get_db)
):
    """
    获取职位列表（公开接口）
    
    支持搜索、筛选和分页
    """
    # Base query
    query = select(Job).options(selectinload(Job.tags))
    
    # Filters
    if status:
        query = query.where(Job.status == status)
    
    if search:
        query = query.where(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.company.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%")
            )
        )
    
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    
    if job_type:
        query = query.where(Job.job_type == job_type)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Job.created_at.desc())
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return JobListResponse(
        items=jobs,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/my", response_model=List[JobResponse])
async def list_my_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户发布的职位"""
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.tags))
        .where(Job.owner_id == current_user.id)
        .order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取职位详情"""
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.tags))
        .where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="职位不存在"
        )
    
    # Increment view count
    job.view_count += 1
    await db.commit()
    
    return job


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建新职位
    
    仅企业用户可创建
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECRUITER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有企业用户可以发布职位"
        )
    
    # Create job
    job_data = job_in.model_dump(exclude={"tags"})
    job = Job(**job_data, owner_id=current_user.id)
    
    # Handle tags
    if job_in.tags:
        for tag_name in job_in.tags:
            # Find or create tag
            result = await db.execute(select(JobTag).where(JobTag.name == tag_name))
            tag = result.scalar_one_or_none()
            
            if not tag:
                tag = JobTag(name=tag_name)
                db.add(tag)
            
            job.tags.append(tag)
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    return job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新职位信息"""
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.tags))
        .where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="职位不存在"
        )
    
    if job.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此职位"
        )
    
    # Update fields
    update_data = job_in.model_dump(exclude_unset=True, exclude={"tags"})
    for field, value in update_data.items():
        setattr(job, field, value)
    
    # Handle status change to active
    if job_in.status == JobStatus.ACTIVE and not job.published_at:
        job.published_at = datetime.utcnow()
    
    # Handle tags update
    if job_in.tags is not None:
        job.tags.clear()
        for tag_name in job_in.tags:
            result = await db.execute(select(JobTag).where(JobTag.name == tag_name))
            tag = result.scalar_one_or_none()
            
            if not tag:
                tag = JobTag(name=tag_name)
                db.add(tag)
            
            job.tags.append(tag)
    
    await db.commit()
    await db.refresh(job)
    
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除职位"""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="职位不存在"
        )
    
    if job.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此职位"
        )
    
    await db.delete(job)
    await db.commit()


# --- Tags ---

@router.get("/tags/all", response_model=List[JobTagResponse])
async def list_tags(
    db: AsyncSession = Depends(get_db)
):
    """获取所有标签"""
    result = await db.execute(select(JobTag).order_by(JobTag.name))
    tags = result.scalars().all()
    return tags
