"""
Flows Router - Recruitment workflow management
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.flow import Flow, FlowStep, FlowTimeline, FlowStatus, FlowStage
from app.models.candidate import Candidate
from app.models.job import Job
from app.schemas.flow import (
    FlowCreate, FlowUpdate, FlowResponse, FlowListResponse,
    FlowDetailResponse, FlowTimelineResponse
)
from app.utils.security import get_current_user

router = APIRouter()


@router.get("/", response_model=FlowListResponse)
async def list_flows(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[FlowStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取招聘流程列表
    
    企业用户查看自己管理的流程
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECRUITER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # Base query
    query = select(Flow).options(
        selectinload(Flow.steps),
        selectinload(Flow.timeline)
    ).where(Flow.recruiter_id == current_user.id)
    
    if status:
        query = query.where(Flow.status == status)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Flow.updated_at.desc())
    
    result = await db.execute(query)
    flows = result.scalars().all()
    
    return FlowListResponse(
        items=flows,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(
    flow_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取流程详情"""
    result = await db.execute(
        select(Flow)
        .options(
            selectinload(Flow.steps),
            selectinload(Flow.timeline)
        )
        .where(Flow.id == flow_id)
    )
    flow = result.scalar_one_or_none()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="流程不存在"
        )
    
    # Check permission
    if flow.recruiter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此流程"
        )
    
    return flow


@router.post("/", response_model=FlowResponse, status_code=status.HTTP_201_CREATED)
async def create_flow(
    flow_in: FlowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建招聘流程
    
    将候选人与职位关联，开始招聘流程
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECRUITER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有企业用户可以创建招聘流程"
        )
    
    # Check candidate exists
    result = await db.execute(select(Candidate).where(Candidate.id == flow_in.candidate_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="候选人不存在"
        )
    
    # Check job exists and belongs to user
    result = await db.execute(select(Job).where(Job.id == flow_in.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="职位不存在"
        )
    
    if job.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权为此职位创建流程"
        )
    
    # Check if flow already exists
    result = await db.execute(
        select(Flow).where(
            Flow.candidate_id == flow_in.candidate_id,
            Flow.job_id == flow_in.job_id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该候选人已在此职位的招聘流程中"
        )
    
    # Create flow
    flow = Flow(
        candidate_id=flow_in.candidate_id,
        job_id=flow_in.job_id,
        recruiter_id=current_user.id,
        agents_used=["简历解析智能体"],
    )
    db.add(flow)
    await db.commit()
    await db.refresh(flow)
    
    # Create initial steps
    stages = [
        (FlowStage.PARSE, "解析", 1),
        (FlowStage.BENCHMARK, "对标", 2),
        (FlowStage.FIRST_INTERVIEW, "初试", 3),
        (FlowStage.SECOND_INTERVIEW, "复试", 4),
        (FlowStage.FINAL, "终审", 5),
    ]
    
    for stage, name, order in stages:
        step = FlowStep(
            flow_id=flow.id,
            name=name,
            stage=stage,
            order=order,
        )
        db.add(step)
    
    # Create initial timeline event
    timeline = FlowTimeline(
        flow_id=flow.id,
        action="流程创建",
        agent_name="系统",
        tokens_used=0,
    )
    db.add(timeline)
    
    await db.commit()
    await db.refresh(flow)
    
    return flow


@router.put("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: int,
    flow_in: FlowUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新流程状态"""
    result = await db.execute(
        select(Flow)
        .options(selectinload(Flow.steps), selectinload(Flow.timeline))
        .where(Flow.id == flow_id)
    )
    flow = result.scalar_one_or_none()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="流程不存在"
        )
    
    if flow.recruiter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此流程"
        )
    
    # Update fields
    update_data = flow_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(flow, field, value)
    
    # Add timeline event
    timeline = FlowTimeline(
        flow_id=flow.id,
        action=f"状态更新: {flow_in.status.value if flow_in.status else '信息变更'}",
        agent_name="系统",
        tokens_used=0,
    )
    db.add(timeline)
    
    await db.commit()
    await db.refresh(flow)
    
    return flow


@router.post("/{flow_id}/advance", response_model=FlowResponse)
async def advance_flow(
    flow_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """推进流程到下一阶段"""
    result = await db.execute(
        select(Flow)
        .options(selectinload(Flow.steps), selectinload(Flow.timeline))
        .where(Flow.id == flow_id)
    )
    flow = result.scalar_one_or_none()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="流程不存在"
        )
    
    if flow.recruiter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此流程"
        )
    
    # Stage progression
    stage_order = [
        FlowStage.PARSE,
        FlowStage.BENCHMARK,
        FlowStage.FIRST_INTERVIEW,
        FlowStage.SECOND_INTERVIEW,
        FlowStage.FINAL,
    ]
    
    current_index = stage_order.index(flow.current_stage)
    
    if current_index >= len(stage_order) - 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="流程已在最终阶段"
        )
    
    # Mark current step as completed
    for step in flow.steps:
        if step.stage == flow.current_stage:
            step.is_completed = True
            step.completed_at = datetime.utcnow()
            break
    
    # Advance to next stage
    flow.current_stage = stage_order[current_index + 1]
    flow.current_step = current_index + 2
    
    # Add timeline event
    timeline = FlowTimeline(
        flow_id=flow.id,
        action=f"进入{flow.current_stage.value}阶段",
        agent_name="路由调度智能体",
        tokens_used=500,
    )
    db.add(timeline)
    
    flow.tokens_consumed += 500
    
    await db.commit()
    await db.refresh(flow)
    
    return flow


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow(
    flow_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除流程"""
    result = await db.execute(select(Flow).where(Flow.id == flow_id))
    flow = result.scalar_one_or_none()
    
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="流程不存在"
        )
    
    if flow.recruiter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除此流程"
        )
    
    await db.delete(flow)
    await db.commit()
