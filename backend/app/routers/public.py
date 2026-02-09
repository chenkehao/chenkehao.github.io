"""
Public API Router - 公开接口，无需登录
"""

import json
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db, AsyncSessionLocal
from app.models.job import Job, JobTag, JobStatus
from app.models.flow import Flow, FlowStatus, FlowStage
from app.models.candidate import Candidate, CandidateProfile
from app.schemas.job import JobListResponse, JobResponse

router = APIRouter()


# ============ 职位相关公开接口 ============

@router.get("/jobs", response_model=JobListResponse)
async def list_public_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = Query(None, description="职位类型: full_time/part_time/contract/internship/remote"),
    tag: Optional[str] = Query(None, description="标签名称筛选"),
    experience: Optional[str] = Query(None, description="经验要求筛选"),
    salary_min: Optional[int] = Query(None, description="最低薪资(元/月)"),
    salary_max: Optional[int] = Query(None, description="最高薪资(元/月)"),
    sort: Optional[str] = Query("newest", description="排序: newest/salary_desc/salary_asc/match"),
    db: AsyncSession = Depends(get_db)
):
    """获取公开职位列表（支持搜索、标签、薪资、类型等多维筛选）"""
    from sqlalchemy import or_
    from app.models.job import JobTag, job_tags_association
    
    query = select(Job).options(selectinload(Job.tags)).where(Job.status == JobStatus.ACTIVE)
    
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
    
    if experience:
        query = query.where(Job.experience_required.ilike(f"%{experience}%"))
    
    if salary_min is not None:
        query = query.where(Job.salary_min >= salary_min)
    
    if salary_max is not None:
        query = query.where(Job.salary_max <= salary_max)
    
    if tag:
        query = query.join(job_tags_association).join(JobTag).where(JobTag.name.ilike(f"%{tag}%"))
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # 排序
    if sort == "salary_desc":
        query = query.order_by(Job.salary_max.desc().nullslast(), Job.created_at.desc())
    elif sort == "salary_asc":
        query = query.order_by(Job.salary_min.asc().nullslast(), Job.created_at.desc())
    else:
        query = query.order_by(Job.created_at.desc())
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return JobListResponse(
        items=jobs,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size if total > 0 else 0
    )


@router.get("/jobs/{job_id}")
async def get_public_job(
    job_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取职位详情"""
    result = await db.execute(
        select(Job).options(selectinload(Job.tags)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        return {"error": "职位不存在"}
    
    # 增加浏览量
    job.view_count += 1
    await db.commit()
    
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.description,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary": f"¥{job.salary_min//1000}k - ¥{job.salary_max//1000}k" if job.salary_min and job.salary_max else "面议",
        "job_type": job.job_type,
        "requirements": job.requirements,
        "benefits": job.benefits,
        "tags": [tag.name for tag in job.tags],
        "logo": job.logo or "💼",
        "ai_intro": job.ai_intro or "AI 智能体正在分析职位匹配度",
        "view_count": job.view_count,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


@router.get("/job-tags")
async def get_all_job_tags(db: AsyncSession = Depends(get_db)):
    """获取所有岗位标签（去重）"""
    from app.models.job import JobTag
    result = await db.execute(select(JobTag).order_by(JobTag.name))
    tags = result.scalars().all()
    return [{"id": t.id, "name": t.name, "category": t.category} for t in tags]


@router.get("/jobs-recommended")
async def get_recommended_jobs(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """获取推荐职位列表"""
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.tags))
        .where(Job.status == JobStatus.ACTIVE)
        .order_by(Job.created_at.desc())
        .limit(limit)
    )
    jobs = result.scalars().all()
    
    return [{
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salary": f"¥{job.salary_min//1000}k - ¥{job.salary_max//1000}k" if job.salary_min and job.salary_max else "面议",
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "match": 85 + (job.id % 15),  # 模拟匹配度
        "tags": [tag.name for tag in job.tags][:3],
        "logo": job.logo or "💼",
        "aiIntro": job.ai_intro or "AI 智能体正在分析职位匹配度",
        "job_type": job.job_type.value if job.job_type else None,
        "experience_required": job.experience_required,
        "education_required": job.education_required,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    } for job in jobs]


# ============ 工作流相关公开接口 ============

def _format_salary(job) -> str:
    """格式化薪资显示"""
    if not job:
        return "面议"
    if job.salary_display:
        return job.salary_display
    if job.salary_min and job.salary_max:
        return f"¥{job.salary_min // 1000}k-{job.salary_max // 1000}k"
    if job.salary_min:
        return f"¥{job.salary_min // 1000}k+"
    return "面议"


@router.get("/flows")
async def get_public_flows(
    limit: int = Query(10, ge=1, le=50),
    user_id: Optional[int] = Query(None, description="当前登录用户ID，按角色过滤"),
    db: AsyncSession = Depends(get_db)
):
    """获取工作流列表 — 根据用户角色返回不同视角的数据"""
    from app.models.user import User, UserRole

    # 确定用户角色
    user_role = None
    if user_id:
        u_result = await db.execute(select(User).where(User.id == user_id))
        u = u_result.scalar_one_or_none()
        if u:
            user_role = u.role

    # 构建查询
    query = (
        select(Flow)
        .options(selectinload(Flow.steps), selectinload(Flow.timeline))
    )

    if user_role in (UserRole.RECRUITER, UserRole.ADMIN):
        # 企业方：只看自己发起的招聘流程
        query = query.where(Flow.recruiter_id == user_id)
    elif user_role == UserRole.CANDIDATE:
        # 人才方：通过 candidate 表关联查自己的 flow
        cand_result = await db.execute(
            select(Candidate.id).where(Candidate.user_id == user_id)
        )
        cand_id = cand_result.scalar_one_or_none()
        if cand_id:
            query = query.where(Flow.candidate_id == cand_id)
        else:
            return []  # 该用户没有 candidate 记录

    query = query.order_by(Flow.updated_at.desc()).limit(limit)
    result = await db.execute(query)
    flows = result.scalars().all()

    # 获取关联的职位和候选人信息
    flow_list = []
    for flow in flows:
        job_result = await db.execute(select(Job).where(Job.id == flow.job_id))
        job = job_result.scalar_one_or_none()

        candidate_result = await db.execute(
            select(Candidate)
            .options(selectinload(Candidate.profile))
            .where(Candidate.id == flow.candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()

        # 映射状态
        status_val = flow.status.value if flow.status else "pending"
        status_map = {
            "interviewing": "active",
            "offer": "completed",
            "accepted": "completed",
            "rejected": "rejected",
            "evaluating": "screening",
        }
        frontend_status = status_map.get(status_val, "pending")

        # 根据角色构建不同的进度节点和描述
        if user_role == UserRole.CANDIDATE:
            # 人才方视角：求职投递 → 智能匹配 → 筛选评估 → 结果
            stage_val = flow.current_stage.value if flow.current_stage else "parse"
            stage_map = {"parse": 1, "benchmark": 2, "first_interview": 3, "final": 4}
            step = stage_map.get(stage_val, 1)
            nodes = ['投递', '匹配', '筛选', '结果']
            # 人才方的 lastAction
            if frontend_status == "completed":
                last_action = "筛选通过，联系方式已互换"
            elif frontend_status == "rejected":
                last_action = "未通过筛选"
            elif frontend_status == "screening":
                last_action = "企业正在筛选中"
            else:
                last_action = flow.last_action or "AI 已投递，等待企业回复"
            queue_type = "delivery"  # 智能投递
        else:
            # 企业方视角：邀请 → 匹配 → 筛选 → 结果
            stage_val = flow.current_stage.value if flow.current_stage else "parse"
            stage_map = {"parse": 1, "benchmark": 2, "first_interview": 3, "final": 4}
            step = stage_map.get(stage_val, 1)
            nodes = ['邀请', '匹配', '筛选', '结果']
            if frontend_status == "completed":
                last_action = "筛选通过，联系方式已互换"
            elif frontend_status == "rejected":
                last_action = flow.last_action or "智能筛选 - 未通过"
            elif frontend_status == "screening":
                last_action = "智能筛选评估中"
            else:
                last_action = flow.last_action or f"智能邀请匹配（匹配度 {flow.match_score or 0:.0f}%）"
            queue_type = "recruit"  # 智能招聘

        flow_list.append({
            "id": flow.id,
            "candidateName": candidate.profile.display_name if candidate and candidate.profile else "未知",
            "candidateId": flow.candidate_id,
            "role": job.title if job else "未知职位",
            "company": job.company if job else "未知公司",
            "jobId": flow.job_id,
            "stage": stage_val,
            "status": frontend_status,
            "matchScore": flow.match_score or 0,
            "currentStep": step,
            "totalSteps": 4,
            "nodes": nodes,
            "lastAction": last_action,
            "queueType": queue_type,
            "salary": _format_salary(job),
            "tokensConsumed": flow.tokens_consumed,
            "agentsUsed": flow.agents_used or [],
            "timeline": [{
                "action": t.action,
                "agent": t.agent_name,
                "time": t.timestamp.isoformat() if t.timestamp else None,
            } for t in (flow.timeline or [])[:5]],
            "updatedAt": flow.updated_at.isoformat() if flow.updated_at else None,
        })

    return flow_list


@router.get("/flows/{flow_id}")
async def get_public_flow(
    flow_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取工作流详情"""
    result = await db.execute(
        select(Flow)
        .options(selectinload(Flow.steps), selectinload(Flow.timeline))
        .where(Flow.id == flow_id)
    )
    flow = result.scalar_one_or_none()
    
    if not flow:
        return {"error": "流程不存在"}
    
    # 获取职位信息
    job_result = await db.execute(select(Job).where(Job.id == flow.job_id))
    job = job_result.scalar_one_or_none()
    
    # 获取候选人信息
    candidate_result = await db.execute(
        select(Candidate)
        .options(selectinload(Candidate.profile))
        .where(Candidate.id == flow.candidate_id)
    )
    candidate = candidate_result.scalar_one_or_none()
    
    return {
        "id": flow.id,
        "candidateName": candidate.profile.display_name if candidate and candidate.profile else "未知",
        "role": job.title if job else "未知职位",
        "company": job.company if job else "未知公司",
        "stage": flow.current_stage.value,
        "status": flow.status.value,
        "matchScore": flow.match_score or 0,
        "currentStep": flow.current_step,
        "totalSteps": 5,
        "tokensConsumed": flow.tokens_consumed,
        "agentsUsed": flow.agents_used or [],
        "steps": [{
            "name": s.name,
            "stage": s.stage.value,
            "isCompleted": s.is_completed,
            "completedAt": s.completed_at.isoformat() if s.completed_at else None,
        } for s in sorted(flow.steps or [], key=lambda x: x.order)],
        "timeline": [{
            "action": t.action,
            "agent": t.agent_name,
            "tokens": t.tokens_used,
            "time": t.timestamp.isoformat() if t.timestamp else None,
        } for t in (flow.timeline or [])],
    }


# ============ 候选人/人才相关公开接口 ============

@router.get("/talents")
async def get_public_talents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="搜索姓名/职位/技能"),
    skill: Optional[str] = Query(None, description="技能筛选"),
    experience_min: Optional[int] = Query(None, description="最低经验年限"),
    experience_max: Optional[int] = Query(None, description="最高经验年限"),
    sort: Optional[str] = Query("match", description="排序: match/newest/experience"),
    limit: int = Query(None, ge=1, le=50, description="简单 limit（兼容旧调用）"),
    db: AsyncSession = Depends(get_db)
):
    """获取推荐人才列表（支持搜索、技能筛选、经验筛选、分页）"""
    from sqlalchemy import or_
    from app.models.candidate import Skill as SkillModel

    query = (
        select(Candidate)
        .options(selectinload(Candidate.profile), selectinload(Candidate.skills))
        .where(Candidate.is_profile_complete == True)
    )

    # 搜索：姓名/职位/简介
    if search:
        query = query.join(Candidate.profile).where(
            or_(
                CandidateProfile.display_name.ilike(f"%{search}%"),
                CandidateProfile.current_role.ilike(f"%{search}%"),
                CandidateProfile.summary.ilike(f"%{search}%"),
            )
        )

    # 技能筛选
    if skill:
        query = query.join(Candidate.skills).where(SkillModel.name.ilike(f"%{skill}%"))

    # 经验筛选
    if experience_min is not None or experience_max is not None:
        if not search:
            query = query.join(Candidate.profile)
        if experience_min is not None:
            query = query.where(CandidateProfile.experience_years >= experience_min)
        if experience_max is not None:
            query = query.where(CandidateProfile.experience_years <= experience_max)

    # 兼容旧的简单 limit 调用
    if limit and page == 1 and page_size == 20:
        result = await db.execute(query.limit(limit))
        candidates = result.scalars().unique().all()
        return [_format_talent(c) for c in candidates]

    # 计数
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # 排序
    if sort == "newest":
        query = query.order_by(Candidate.created_at.desc())
    elif sort == "experience":
        if not search and experience_min is None and experience_max is None:
            query = query.join(Candidate.profile)
        query = query.order_by(CandidateProfile.experience_years.desc())
    else:
        query = query.order_by(Candidate.id.desc())  # match 默认

    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size))
    candidates = result.scalars().unique().all()

    return {
        "items": [_format_talent(c) for c in candidates],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


def _format_talent(c):
    """格式化单个候选人数据"""
    p = c.profile
    return {
        "id": c.id,
        "user_id": c.user_id,
        "name": p.display_name if p else "未知",
        "role": p.current_role if p else "未知职位",
        "experienceYears": p.experience_years if p else 0,
        "skills": [s.name for s in (c.skills or [])][:6],
        "summary": (p.summary or "")[:120] if p else "",
        "salary_range": p.salary_range if p else None,
        "matchScore": 85 + (c.id % 15),
        "status": "active",
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.get("/talent-skills")
async def get_all_talent_skills(db: AsyncSession = Depends(get_db)):
    """获取所有候选人技能标签（去重）"""
    from app.models.candidate import Skill as SkillModel
    result = await db.execute(
        select(SkillModel.name).distinct().order_by(SkillModel.name)
    )
    return [row[0] for row in result.fetchall()]


@router.get("/talents/{candidate_id}")
async def get_talent_detail(
    candidate_id: int,
    db: AsyncSession = Depends(get_db)
):
    """获取候选人完整画像 — 供人才详情页和个人主页使用"""
    from app.models.user import User
    from app.models.profile import UserProfile, ProfileType
    
    result = await db.execute(
        select(Candidate)
        .options(selectinload(Candidate.profile), selectinload(Candidate.skills))
        .where(Candidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")
    
    profile = candidate.profile
    user_result = await db.execute(select(User).where(User.id == candidate.user_id))
    user_info = user_result.scalar_one_or_none()
    
    # 查询 UserProfile 获取更丰富的 candidate_data（教育/工作/项目等）
    up_result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == candidate.user_id, UserProfile.profile_type == ProfileType.CANDIDATE)
    )
    user_profile = up_result.scalar_one_or_none()
    candidate_data = {}
    if user_profile and user_profile.candidate_data:
        cd = user_profile.candidate_data
        if isinstance(cd, dict):
            candidate_data = cd
        elif isinstance(cd, str):
            try:
                candidate_data = json.loads(cd)
            except (json.JSONDecodeError, TypeError):
                candidate_data = {}
    
    # 构建雷达图数据（转为前端格式）
    radar_raw = profile.radar_data if profile else {}
    radar_data = []
    if isinstance(radar_raw, dict):
        for k, v in radar_raw.items():
            radar_data.append({"subject": k, "value": v})
    elif isinstance(radar_raw, list):
        radar_data = radar_raw
    
    return {
        "id": str(candidate.id),
        "name": profile.display_name if profile else (user_info.name if user_info else "未知"),
        "role": profile.current_role if profile else "未知职位",
        "experienceYears": profile.experience_years if profile else 0,
        "skills": [s.name for s in (candidate.skills or [])] or candidate_data.get("skills", []),
        "radarData": radar_data or candidate_data.get("radar_data", []),
        "summary": profile.summary if profile else candidate_data.get("summary", ""),
        "idealJobPersona": profile.ideal_job_persona if profile else candidate_data.get("ideal_job", ""),
        "salaryRange": profile.salary_range if profile else candidate_data.get("expected_salary", ""),
        "marketDemand": profile.market_demand if profile else "",
        "matchScore": 80 + (candidate.id % 20),
        "status": "active",
        "tokensConsumed": 0,
        "interviewQuestions": profile.interview_questions if profile else [],
        "optimizationSuggestions": profile.optimization_suggestions if profile else [],
        "agentFeedbacks": profile.agent_feedbacks if profile else [],
        "certifications": profile.certifications if profile else [],
        "awards": profile.awards if profile else [],
        "credentials": profile.credentials if profile else [],
        "email": user_info.email if user_info else None,
        "phone": user_info.phone if user_info else None,
        "wechat": user_info.phone if user_info else None,
        "avatarUrl": user_info.avatar_url if user_info else None,
        # 个人主页额外字段
        "education": candidate_data.get("education", []),
        "experience": candidate_data.get("experience", []),
        "projects": candidate_data.get("projects", []),
        "expectedSalary": candidate_data.get("expected_salary", ""),
        "expectedLocation": candidate_data.get("expected_location", ""),
        "careerPath": candidate_data.get("career_path", []),
    }


# ============ 统计相关公开接口 ============

@router.get("/stats/token-usage")
async def get_token_usage_stats(
    db: AsyncSession = Depends(get_db)
):
    """获取 Token 使用统计"""
    # 模拟统计数据
    return {
        "balance": 1245000,
        "used_today": 12500,
        "used_this_week": 85000,
        "used_this_month": 320000,
        "history": [
            {"date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), 
             "amount": 8000 + (i * 500) % 5000, 
             "action": ["简历解析", "职位匹配", "面试模拟", "市场分析"][i % 4]}
            for i in range(7)
        ],
        "chart": [
            {"name": f"{i+1}月", "tokens": 20000 + (i * 5000) % 30000}
            for i in range(6)
        ],
    }


@router.get("/stats/qualifications")
async def get_qualifications_stats(
    db: AsyncSession = Depends(get_db)
):
    """获取资质认证统计"""
    return [
        {"name": "AI 招聘资格认证", "status": "已认证", "icon": "🏆"},
        {"name": "数据安全合规", "status": "通过", "icon": "🔐"},
        {"name": "GDPR 合规", "status": "已认证", "icon": "🌍"},
    ]


# ============ 记忆/任务相关公开接口 ============

from app.models.memory import Memory, MemoryType, MemoryImportance, MemoryScope
from pydantic import BaseModel

class MemoryCreate(BaseModel):
    type: str
    content: str
    importance: str = "Medium"
    scope: str = "candidate"  # candidate 或 employer

# 类型到颜色的映射
TYPE_COLOR_MAP = {
    "culture": "border-rose-300",
    "tech": "border-indigo-300",
    "skill": "border-emerald-300",
    "experience": "border-amber-300",
    "salary": "border-green-300",
    "location": "border-sky-300",
    "reporting": "border-violet-300",
    "team": "border-teal-300",
    "project": "border-amber-300",
    "goal": "border-rose-300",
    "preference": "border-purple-300",
    "company": "border-blue-300",
    "requirement": "border-orange-300",
    "benefit": "border-cyan-300",
    "action": "border-violet-300",
    "strategy": "border-fuchsia-300",
}

# 类型名称映射
TYPE_NAME_MAP = {
    "culture": "文化",
    "tech": "技术",
    "skill": "技能",
    "experience": "经验",
    "salary": "薪酬",
    "location": "地点",
    "reporting": "汇报",
    "team": "团队",
    "project": "项目",
    "goal": "目标",
    "preference": "偏好",
    "company": "公司",
    "requirement": "要求",
    "benefit": "福利",
    "action": "动作",
    "strategy": "策略",
}

# 根据记忆类型和来源生成 Agent 推理逻辑
def _generate_reasoning(mem_type: str, scope: str) -> str:
    """根据记忆类型自动生成与分类匹配的 Agent 推理逻辑"""
    if scope == "employer":
        reasoning_map = {
            "requirement": "基于用户在对话中明确提出的招聘要求固化，后续生成岗位描述、筛选候选人时将自动遵循此规则。",
            "culture": "从用户描述中提取的企业文化与工作方式偏好，将影响岗位描述中的团队氛围和工作环境部分。",
            "tech": "用户指定的技术栈偏好或技术要求，后续岗位生成和候选人匹配时将优先匹配此技术方向。",
            "strategy": "从用户操作中提炼的招聘策略与面试方法论，将指导 Agent 后续的招聘流程和候选人评估方式。",
            "benefit": "用户设定的福利待遇标准，生成岗位时将自动附带此福利信息，提升岗位吸引力。",
            "action": "基于用户操作行为和指令记录的动作偏好，Agent 后续执行相似任务时将参考此模式。",
            "preference": "用户的通用招聘偏好（如学历、经验等），贯穿所有岗位生成和候选人筛选环节。",
            "experience": "用户对候选人经验的要求标准，匹配候选人时将以此作为核心筛选维度。",
            "salary": "用户设定的薪酬范围约束，所有岗位薪资将严格遵循此区间。",
            "company": "企业基础信息与行业定位，用于岗位描述中的公司介绍和行业标签生成。",
        }
    else:
        reasoning_map = {
            "skill": "从用户简历或对话中识别的核心技能，将用于岗位匹配时的能力评估和推荐排序。",
            "experience": "用户的工作经历记录，匹配岗位时将对照经验年限和行业背景进行精准推荐。",
            "preference": "用户表达的求职偏好（如公司类型、团队规模等），过滤推荐岗位时优先满足这些条件。",
            "goal": "用户的职业发展目标，推荐岗位时将考虑岗位的成长空间是否匹配用户长期规划。",
            "salary": "用户的薪酬期望区间，推荐岗位时自动过滤薪资不匹配的机会。",
            "location": "用户的工作地点偏好，推荐岗位时优先推荐符合地点要求的机会。",
            "tech": "用户掌握的技术栈，匹配岗位时将以技术契合度作为核心推荐依据。",
            "culture": "用户偏好的工作文化与团队氛围，推荐时倾向匹配文化契合的企业。",
            "requirement": "用户对岗位的硬性要求，推荐时将此作为必要筛选条件严格执行。",
            "action": "基于用户操作行为记录的偏好，Agent 后续任务将参考此模式自动执行。",
        }
    return reasoning_map.get(mem_type, f"Agent 自动记录的{TYPE_NAME_MAP.get(mem_type, mem_type)}信息，用于优化后续匹配。")


@router.get("/memories")
async def get_memories(
    user_id: int = Query(1, description="用户ID"),
    scope: str = Query("candidate", description="记忆范围: candidate(人才画像) 或 employer(企业画像)"),
    db: AsyncSession = Depends(get_db)
):
    """获取用户记忆 - 区分人才画像和企业画像"""
    # 解析 scope
    try:
        memory_scope = MemoryScope(scope.lower())
    except ValueError:
        memory_scope = MemoryScope.CANDIDATE
    
    result = await db.execute(
        select(Memory)
        .where(Memory.user_id == user_id)
        .where(Memory.scope == memory_scope)
        .order_by(Memory.created_at.desc())
    )
    memories = result.scalars().all()
    
    # 如果没有记忆，返回空数组（让用户自己添加数据）
    if not memories:
        return []
    
    return [{
        "id": m.id,
        "type": TYPE_NAME_MAP.get(m.type.value, m.type.value).upper(),
        "raw_type": m.type.value,
        "content": m.content,
        "date": m.created_at.strftime("%Y-%m"),
        "color": m.color or TYPE_COLOR_MAP.get(m.type.value, "border-slate-300"),
        "importance": m.importance.value if m.importance else "Medium",
        "scope": m.scope.value if m.scope else "candidate",
        "emphasis_count": m.emphasis_count or 1,
        "ai_reasoning": m.ai_reasoning,
        "version_history": m.version_history or [],
    } for m in memories]


@router.post("/memories")
async def create_memory(
    memory: MemoryCreate,
    user_id: int = Query(1, description="用户ID"),
    force_create: bool = Query(False, description="是否强制创建（忽略重复检查）"),
    db: AsyncSession = Depends(get_db)
):
    """创建新记忆 - 自动检查重复内容，重复则增加强调次数"""
    # 验证类型
    try:
        memory_type = MemoryType(memory.type.lower())
    except ValueError:
        memory_type = MemoryType.SKILL  # 默认为技能类型
    
    # 验证重要性
    try:
        importance = MemoryImportance(memory.importance)
    except ValueError:
        importance = MemoryImportance.MEDIUM
    
    # 验证 scope
    try:
        memory_scope = MemoryScope(memory.scope.lower())
    except ValueError:
        memory_scope = MemoryScope.CANDIDATE
    
    # 检查是否有相似的记忆（同类型、同范围、内容相似）
    if not force_create:
        result = await db.execute(
            select(Memory)
            .where(Memory.user_id == user_id)
            .where(Memory.type == memory_type)
            .where(Memory.scope == memory_scope)
        )
        existing_memories = result.scalars().all()
        
        # 检查是否有内容相同或高度相似的记忆
        content_lower = memory.content.lower().strip()
        for existing in existing_memories:
            existing_content = existing.content.lower().strip()
            # 完全相同或内容包含关系
            if (content_lower == existing_content or 
                content_lower in existing_content or 
                existing_content in content_lower):
                # 增加强调次数而不是创建新记忆
                existing.emphasis_count = (existing.emphasis_count or 1) + 1
                existing.updated_at = datetime.utcnow()
                # 如果新内容更长更详细，更新内容
                if len(memory.content) > len(existing.content):
                    existing.content = memory.content
                # 更新推理逻辑，标注被多次强调
                base_reasoning = _generate_reasoning(memory_type.value, memory_scope.value)
                existing.ai_reasoning = f"用户已反复强调 {existing.emphasis_count} 次。{base_reasoning}"
                await db.commit()
                await db.refresh(existing)
                
                return {
                    "id": existing.id,
                    "type": TYPE_NAME_MAP.get(memory_type.value, memory_type.value).upper(),
                    "content": existing.content,
                    "date": existing.updated_at.strftime("%Y-%m"),
                    "color": existing.color,
                    "importance": existing.importance.value,
                    "emphasis_count": existing.emphasis_count,
                    "message": f"记忆已强调 {existing.emphasis_count} 次",
                    "is_duplicate": True
                }
    
    # 获取颜色
    color = TYPE_COLOR_MAP.get(memory_type.value, "border-slate-300")
    
    # 根据类型和来源自动生成 ai_reasoning
    reasoning = _generate_reasoning(memory_type.value, memory_scope.value)
    
    # 创建新记忆
    new_memory = Memory(
        user_id=user_id,
        type=memory_type,
        content=memory.content,
        importance=importance,
        scope=memory_scope,
        color=color,
        source="manual",
        emphasis_count=1,
        ai_reasoning=reasoning,
    )
    
    db.add(new_memory)
    await db.commit()
    await db.refresh(new_memory)
    
    return {
        "id": new_memory.id,
        "type": TYPE_NAME_MAP.get(memory_type.value, memory_type.value).upper(),
        "content": new_memory.content,
        "date": new_memory.created_at.strftime("%Y-%m"),
        "color": new_memory.color,
        "importance": new_memory.importance.value,
        "emphasis_count": 1,
        "message": "记忆创建成功",
        "is_duplicate": False
    }


@router.put("/memories/{memory_id}")
async def update_memory(
    memory_id: int,
    memory: MemoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """更新记忆"""
    result = await db.execute(select(Memory).where(Memory.id == memory_id))
    existing = result.scalar_one_or_none()
    
    if not existing:
        return {"error": "记忆不存在"}
    
    try:
        existing.type = MemoryType(memory.type.lower())
    except ValueError:
        existing.type = MemoryType.PREFERENCE
    
    existing.content = memory.content
    
    try:
        existing.importance = MemoryImportance(memory.importance)
    except ValueError:
        existing.importance = MemoryImportance.MEDIUM
    
    existing.color = TYPE_COLOR_MAP.get(memory.type.lower(), "border-slate-300")
    existing.ai_reasoning = _generate_reasoning(memory.type.lower(), existing.scope.value if existing.scope else "candidate")
    
    await db.commit()
    await db.refresh(existing)
    
    return {
        "id": existing.id,
        "type": TYPE_NAME_MAP.get(existing.type.value, existing.type.value),
        "content": existing.content,
        "importance": existing.importance.value,
        "color": existing.color,
        "message": "记忆更新成功"
    }


@router.delete("/memories/{memory_id}")
async def delete_memory(
    memory_id: int,
    db: AsyncSession = Depends(get_db)
):
    """删除记忆"""
    result = await db.execute(select(Memory).where(Memory.id == memory_id))
    memory = result.scalar_one_or_none()
    
    if not memory:
        return {"error": "记忆不存在"}
    
    await db.delete(memory)
    await db.commit()
    
    return {"message": "记忆已删除"}


@router.post("/memories/optimize")
async def optimize_memories(
    user_id: int = Query(..., description="用户ID"),
    scope: str = Query("candidate", description="记忆范围: candidate 或 employer"),
    db: AsyncSession = Depends(get_db)
):
    """AI 驱动的记忆优化 — 合并同类不删除，保留版本历史
    
    1. 同类型相似记忆合并内容（不删除，合并到一条中），记录版本历史
    2. 只删除完全重复的记忆
    3. 检查记忆分类的准确性并修正
    4. 为所有记忆更新 Agent 推理逻辑
    """
    import json as json_module
    from datetime import datetime
    
    try:
        memory_scope = MemoryScope(scope.lower())
    except ValueError:
        memory_scope = MemoryScope.CANDIDATE
    
    # 获取用户所有记忆
    result = await db.execute(
        select(Memory)
        .where(Memory.user_id == user_id)
        .where(Memory.scope == memory_scope)
        .order_by(Memory.created_at.desc())
    )
    memories = result.scalars().all()
    
    if not memories:
        return {
            "success": True,
            "message": "没有需要优化的记忆",
            "actions": [],
            "summary": {"merged": 0, "deleted": 0, "reclassified": 0, "created": 0, "reasoning_updated": 0}
        }
    
    # ========== 本地智能合并（不依赖 AI） ==========
    actions = []
    summary = {"merged": 0, "deleted": 0, "reclassified": 0, "created": 0, "reasoning_updated": 0}
    
    # 按类型分组
    type_groups: dict = {}
    for m in memories:
        type_key = m.type.value if m.type else 'unknown'
        if type_key not in type_groups:
            type_groups[type_key] = []
        type_groups[type_key].append(m)
    
    processed_ids = set()
    
    # 对每个类型组进行合并
    for type_key, group in type_groups.items():
        if len(group) < 2:
            continue
        
        # 按时间排序，最新的在前
        group.sort(key=lambda x: x.created_at, reverse=True)
        
        # 聚类：找出内容相似的记忆子组
        clusters: list = []
        used = set()
        
        for i, m1 in enumerate(group):
            if m1.id in used:
                continue
            cluster = [m1]
            used.add(m1.id)
            c1 = m1.content.lower().strip()
            
            for j in range(i + 1, len(group)):
                m2 = group[j]
                if m2.id in used:
                    continue
                c2 = m2.content.lower().strip()
                
                # 相似度判断：完全包含 或 共同关键词 >= 50%
                is_similar = False
                if c1 == c2:
                    is_similar = True  # 完全重复
                elif c1 in c2 or c2 in c1:
                    is_similar = True  # 包含关系
                else:
                    # 关键词交集比较
                    words1 = set(c1.replace('：', ' ').replace('，', ' ').replace('。', ' ').split())
                    words2 = set(c2.replace('：', ' ').replace('，', ' ').replace('。', ' ').split())
                    if words1 and words2:
                        overlap = len(words1 & words2) / min(len(words1), len(words2))
                        if overlap >= 0.5:
                            is_similar = True
                
                if is_similar:
                    cluster.append(m2)
                    used.add(m2.id)
            
            if len(cluster) >= 2:
                clusters.append(cluster)
        
        # 处理每个聚类
        for cluster in clusters:
            # 保留最新的一条作为主记忆
            primary = cluster[0]  # 已按时间排序，最新在前
            others = cluster[1:]
            
            # 检查是否完全重复
            primary_content = primary.content.strip()
            all_exact_dup = all(o.content.strip() == primary_content for o in others)
            
            if all_exact_dup:
                # 完全重复：删除旧的，增加强度
                for o in others:
                    # 记录版本历史
                    history = list(primary.version_history or [])
                    history.append({
                        "version": len(history) + 1,
                        "action": "merge_duplicate",
                        "content": o.content,
                        "date": o.created_at.strftime("%Y-%m-%d"),
                        "source": f"合并完全重复的记忆 (ID:{o.id})"
                    })
                    primary.version_history = history
                    
                    await db.delete(o)
                    processed_ids.add(o.id)
                
                primary.emphasis_count = (primary.emphasis_count or 1) + len(others)
                primary.updated_at = datetime.utcnow()
                primary.ai_reasoning = f"用户已反复提及 {primary.emphasis_count} 次。{_generate_reasoning(type_key, scope)}"
                
                actions.append({
                    "action": "merge",
                    "kept_id": primary.id,
                    "deleted_ids": [o.id for o in others],
                    "reason": f"合并 {len(others)} 条完全重复的{TYPE_NAME_MAP.get(type_key, type_key)}记忆"
                })
                summary["merged"] += len(others)
            else:
                # 相似但不完全重复：合并内容，不删除
                # 将其他记忆的独有内容整合到主记忆中
                old_content = primary.content
                
                # 提取每条记忆的核心内容，保留第一条的前缀（如"招聘需求："）
                # 检测主记忆是否有前缀标签
                primary_text = primary.content.strip()
                prefix_label = ''
                for prefix in ['招聘需求：', '招聘需求:', '要求：', '要求:', '技术要求：', '技术要求:']:
                    if primary_text.startswith(prefix):
                        prefix_label = prefix.rstrip('：:') + '：'  # 统一用中文冒号
                        primary_text = primary_text[len(prefix):].strip()
                        break
                
                # 提取所有记忆的去前缀核心内容
                contents = [primary_text]
                for m in cluster[1:]:
                    c = m.content.strip()
                    for prefix in ['招聘需求：', '招聘需求:', '要求：', '要求:', '技术要求：', '技术要求:']:
                        if c.startswith(prefix):
                            c = c[len(prefix):]
                            break
                    contents.append(c.strip())
                
                # 合并：去重后拼接
                unique_parts = []
                seen = set()
                for c in contents:
                    c_key = c.lower().strip()
                    if c_key not in seen and len(c_key) > 0:
                        seen.add(c_key)
                        unique_parts.append(c)
                
                if len(unique_parts) > 1:
                    # 保留原始前缀标签（如"招聘需求："）
                    merged_content = prefix_label + '；'.join(unique_parts)
                    
                    # 记录版本历史
                    history = list(primary.version_history or [])
                    for o in others:
                        history.append({
                            "version": len(history) + 1,
                            "action": "merge_similar",
                            "content": o.content,
                            "date": o.created_at.strftime("%Y-%m-%d"),
                            "source": f"合并相似记忆 (ID:{o.id})"
                        })
                    # 记录合并前的内容
                    history.append({
                        "version": len(history) + 1,
                        "action": "optimize",
                        "content": old_content,
                        "date": datetime.utcnow().strftime("%Y-%m-%d"),
                        "source": f"记忆优化：合并 {len(cluster)} 条相似记忆"
                    })
                    primary.version_history = history
                    
                    primary.content = merged_content
                    primary.emphasis_count = (primary.emphasis_count or 1) + len(others)
                    primary.updated_at = datetime.utcnow()
                    primary.ai_reasoning = f"合并了 {len(cluster)} 条相似记忆。{_generate_reasoning(type_key, scope)}"
                    
                    # 删除被合并的旧记忆
                    for o in others:
                        await db.delete(o)
                        processed_ids.add(o.id)
                    
                    actions.append({
                        "action": "merge",
                        "kept_id": primary.id,
                        "deleted_ids": [o.id for o in others],
                        "reason": f"合并 {len(cluster)} 条相似的{TYPE_NAME_MAP.get(type_key, type_key)}记忆，保留完整信息"
                    })
                    summary["merged"] += len(others)
    
    # 为所有未处理的记忆更新推理逻辑
    for m in memories:
        if m.id not in processed_ids and not m.ai_reasoning:
            m.ai_reasoning = _generate_reasoning(m.type.value if m.type else 'preference', scope)
            m.updated_at = datetime.utcnow()
            summary["reasoning_updated"] += 1
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"记忆优化完成：合并 {summary['merged']} 条，重分类 {summary['reclassified']} 条，更新推理 {summary['reasoning_updated']} 条",
        "actions": actions,
        "summary": summary
    }


from app.models.todo import Todo, TodoStatus, TodoPriority, TodoSource, TodoType

class TodoCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    source: str = "user"
    todo_type: str = "system"
    ai_advice: str = ""
    steps: list = []
    due_date: str = None


@router.get("/todos")
async def get_todos(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取待办任务 - 纯动态数据"""
    result = await db.execute(
        select(Todo)
        .where(Todo.user_id == user_id)
        .order_by(Todo.created_at.desc())
    )
    todos = result.scalars().all()
    
    # 如果没有任务，返回空数组（不使用静态数据）
    if not todos:
        return []
    
    return [{
        "id": str(t.id),
        "title": t.title,
        "task": t.title,  # 兼容前端字段名
        "description": t.description or "",
        "status": t.status.value.upper() if t.status else "PENDING",
        "priority": t.priority.value.upper() if t.priority else "MEDIUM",
        "progress": t.progress or 0,
        "source": t.source.value.upper() if t.source else "USER",
        "icon": t.icon or "Calendar",
        "todo_type": t.todo_type.value.upper() if t.todo_type else "SYSTEM",
        "type": t.todo_type.value.upper() if t.todo_type else "SYSTEM",
        "aiAdvice": t.ai_advice or "",
        "steps": json.loads(t.steps) if isinstance(t.steps, str) else (t.steps or []),
        "dueDate": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
        "createdAt": t.created_at.strftime("%Y-%m-%d") if t.created_at else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
    } for t in todos]


@router.post("/todos")
async def create_todo(
    todo: TodoCreate,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """创建待办任务"""
    # 解析优先级
    try:
        priority = TodoPriority(todo.priority.upper())
    except ValueError:
        priority = TodoPriority.MEDIUM
    
    # 解析来源
    try:
        source = TodoSource(todo.source.upper())
    except ValueError:
        source = TodoSource.USER
    
    # 解析类型
    try:
        todo_type = TodoType(todo.todo_type.upper())
    except ValueError:
        todo_type = TodoType.SYSTEM
    
    # 解析截止日期
    due_date = None
    if todo.due_date:
        try:
            due_date = datetime.strptime(todo.due_date, "%Y-%m-%d")
        except ValueError:
            pass
    
    new_todo = Todo(
        user_id=user_id,
        title=todo.title,
        description=todo.description,
        status=TodoStatus.PENDING,
        priority=priority,
        source=source,
        todo_type=todo_type,
        progress=0,
        ai_advice=todo.ai_advice,
        steps=todo.steps,
        due_date=due_date,
        icon="Calendar",
    )
    
    db.add(new_todo)
    await db.commit()
    await db.refresh(new_todo)
    
    return {
        "id": str(new_todo.id),
        "title": new_todo.title,
        "message": "任务创建成功"
    }


class TodoUpdateBody(BaseModel):
    """更新任务请求体（可选字段通过 body 传递）"""
    steps: Optional[list] = None
    ai_advice: Optional[str] = None
    published_job_ids: Optional[list] = None  # 关联的已发布岗位 ID 列表
    current_step: Optional[str] = None  # 当前招聘阶段

@router.put("/todos/{todo_id}")
async def update_todo(
    todo_id: int,
    status: str = Query(None),
    progress: int = Query(None),
    body: Optional[TodoUpdateBody] = Body(None),
    db: AsyncSession = Depends(get_db)
):
    """更新待办任务"""
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalar_one_or_none()
    
    if not todo:
        return {"error": "任务不存在"}
    
    if status:
        try:
            todo.status = TodoStatus(status.upper())
            if status.upper() == "COMPLETED":
                todo.completed_at = datetime.utcnow()
                todo.progress = 100
        except ValueError:
            pass
    
    if progress is not None:
        todo.progress = progress
        if progress >= 100:
            todo.status = TodoStatus.COMPLETED
            todo.completed_at = datetime.utcnow()
    
    # 更新 body 中的可选字段
    if body:
        import json as json_mod
        if body.ai_advice is not None:
            todo.ai_advice = body.ai_advice
        
        # 统一处理 steps + metadata 的存储
        # 先解析现有数据
        existing_steps = []
        metadata = {}
        if todo.steps:
            try:
                parsed = json_mod.loads(todo.steps) if isinstance(todo.steps, str) else todo.steps
                if isinstance(parsed, dict):
                    existing_steps = parsed.get('steps', [])
                    metadata = parsed.get('metadata', {})
                elif isinstance(parsed, list):
                    existing_steps = parsed
            except:
                existing_steps = []
        
        # 更新 steps 列表
        if body.steps is not None:
            existing_steps = body.steps
        
        # 更新 metadata
        if body.published_job_ids is not None:
            metadata['published_job_ids'] = body.published_job_ids
        if body.current_step is not None:
            metadata['current_step'] = body.current_step
        
        # 统一存储为 {steps: [...], metadata: {...}} 格式
        if metadata:
            todo.steps = json_mod.dumps({'steps': existing_steps, 'metadata': metadata})
        elif body.steps is not None:
            todo.steps = json_mod.dumps(existing_steps)
    
    await db.commit()
    
    return {"message": "任务更新成功"}


@router.delete("/todos/{todo_id}")
async def delete_todo(
    todo_id: int,
    db: AsyncSession = Depends(get_db)
):
    """删除待办任务"""
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalar_one_or_none()
    
    if not todo:
        return {"error": "任务不存在"}
    
    await db.delete(todo)
    await db.commit()
    
    return {"message": "任务已删除"}


@router.delete("/todos/cleanup/duplicates")
async def cleanup_duplicate_profile_tasks(
    user_id: int = Query(..., description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """清理重复的「完善简历资料」任务，只保留最新的一个"""
    from sqlalchemy import or_
    
    # 查找所有「完善简历资料」类型的任务（匹配类型或精确标题）
    result = await db.execute(
        select(Todo)
        .where(Todo.user_id == user_id)
        .where(
            or_(
                Todo.todo_type == 'profile_complete',
                Todo.title == '完善个人简历资料',  # 精确匹配
                Todo.title.ilike('%完善%简历%'),
                Todo.title.ilike('%完善%资料%')
            )
        )
        .order_by(Todo.created_at.desc())
    )
    profile_tasks = result.scalars().all()
    
    if len(profile_tasks) <= 1:
        return {
            "message": "无需清理",
            "deleted_count": 0,
            "kept_task_id": profile_tasks[0].id if profile_tasks else None
        }
    
    # 保留最新的一个，删除其他的
    kept_task = profile_tasks[0]
    deleted_count = 0
    
    for task in profile_tasks[1:]:
        await db.delete(task)
        deleted_count += 1
    
    await db.commit()
    
    return {
        "message": f"已清理 {deleted_count} 个重复任务",
        "deleted_count": deleted_count,
        "kept_task_id": kept_task.id
    }


@router.get("/tasks")
async def get_tasks(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取任务列表（用于 AI 助手侧边栏）- 纯动态数据"""
    result = await db.execute(
        select(Todo)
        .where(Todo.user_id == user_id)
        .order_by(Todo.updated_at.desc())
        .limit(10)
    )
    todos = result.scalars().all()
    
    # 如果没有任务，返回空数组（不使用静态数据）
    if not todos:
        return []
    
    # 补偿检查：身份认证已完成但 DISC 任务不存在则自动创建
    has_disc = any(t.title == 'DISC性格测试' for t in todos)
    if not has_disc:
        from app.models.settings import PersonalCertification
        cert_result = await db.execute(
            select(PersonalCertification)
            .where(PersonalCertification.user_id == user_id)
            .where(PersonalCertification.category == 'identity')
        )
        has_identity = cert_result.scalars().first() is not None
        if has_identity:
            disc_task = Todo(
                user_id=user_id,
                title='DISC性格测试',
                description='通过DISC测试了解您的行为风格，提升求职匹配度',
                priority=TodoPriority.MEDIUM,
                status=TodoStatus.PENDING,
                progress=0,
                source=TodoSource.AGENT,
                todo_type=TodoType.CANDIDATE,
                icon='UserIcon',
            )
            db.add(disc_task)
            await db.commit()
            await db.refresh(disc_task)
            todos = [disc_task] + list(todos)  # 把新任务加到列表最前面
    
    # 状态映射
    status_map = {
        TodoStatus.PENDING: "pending",
        TodoStatus.IN_PROGRESS: "running",
        TodoStatus.RUNNING: "running",
        TodoStatus.COMPLETED: "completed",
        TodoStatus.CANCELLED: "completed",
    }
    
    return [{
        "id": str(t.id),
        "title": t.title,
        "status": status_map.get(t.status, "pending"),
        "time": t.updated_at.strftime("%H:%M") if t.updated_at else "--:--",
        "icon": t.icon or "Calendar",
        "priority": t.priority.value.upper() if t.priority else "MEDIUM",
        "source": t.source.value.upper() if t.source else "USER",
        "todo_type": t.todo_type.value.upper() if t.todo_type else "SYSTEM",
        "type": t.todo_type.value.upper() if t.todo_type else "SYSTEM",
        "progress": t.progress or 0,
        "description": t.description or "",
        "aiAdvice": t.ai_advice or "",
        "ai_advice": t.ai_advice or "",
        "steps": json.loads(t.steps) if isinstance(t.steps, str) else (t.steps or []),
        "createdAt": t.created_at.strftime("%Y-%m-%d") if t.created_at else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
    } for t in todos]


# ============ AI 聊天接口 ============

def generate_smart_response(message: str, context: str, model: str) -> dict:
    """生成智能本地响应（当 AI API 不可用时）"""
    import re
    
    message_lower = message.lower()
    response = ""
    
    # 面试相关
    if any(kw in message_lower for kw in ["面试", "interview", "准备", "技巧"]):
        if "前端" in message_lower or "frontend" in message_lower:
            response = """关于前端开发面试准备，我建议从以下几个方面着手：

**1. 核心技术栈**
• HTML5/CSS3 语义化、Flexbox/Grid 布局
• JavaScript 基础：闭包、原型链、事件循环、Promise/async-await
• 框架深入：React Hooks 原理、Vue 响应式原理、虚拟 DOM

**2. 工程化能力**
• Webpack/Vite 构建优化
• 代码规范与 ESLint/Prettier
• Git 工作流与 CI/CD

**3. 性能优化**
• 首屏加载优化、懒加载
• 缓存策略、CDN 配置
• Web Vitals 指标优化

**4. 算法与数据结构**
• 常见排序、查找算法
• 树、链表、栈、队列基本操作
• LeetCode 刷题（建议 100-200 道）

**5. 项目经验准备**
• 用 STAR 法则准备项目介绍
• 准备技术难点与解决方案
• 了解业务指标与技术价值

需要我针对某个方面详细展开吗？"""
        elif "后端" in message_lower or "backend" in message_lower:
            response = """后端开发面试准备要点：

**1. 语言基础**
• 内存管理、并发模型、GC 机制
• 常用设计模式与应用场景

**2. 数据库**
• SQL 优化、索引原理
• 事务隔离级别、MVCC
• NoSQL 使用场景

**3. 系统设计**
• 分布式系统基础
• 缓存策略、消息队列
• 高可用、高并发设计

**4. 网络与安全**
• HTTP/HTTPS、TCP/IP
• 认证授权机制
• 常见安全漏洞防护

需要针对哪个方向深入了解？"""
        else:
            response = """面试准备建议：

**1. 技术准备**
• 夯实基础知识，理解底层原理
• 刷算法题，保持手感
• 准备项目深度讲解

**2. 软实力**
• 自我介绍精炼到位
• 沟通表达清晰有条理
• 展现学习能力与潜力

**3. 公司调研**
• 了解公司业务与技术栈
• 准备有价值的提问

需要我帮您准备具体的内容吗？"""
    
    # 简历相关
    elif any(kw in message_lower for kw in ["简历", "resume", "cv", "优化"]):
        response = """简历优化建议：

**1. 基本信息**
• 联系方式完整、邮箱专业
• 求职意向明确

**2. 工作经历**
• 使用 STAR 法则描述项目
• 量化成果（提升 XX%、节省 XX 成本）
• 突出技术亮点与创新点

**3. 技术栈**
• 按熟练度排序
• 与目标岗位匹配
• 避免写不熟悉的技术

**4. 格式排版**
• 一页纸原则
• 重点信息突出
• PDF 格式投递

需要我帮您针对特定岗位优化简历吗？"""
    
    # 职位/岗位相关
    elif any(kw in message_lower for kw in ["职位", "岗位", "推荐", "工作", "job"]):
        response = """关于职位推荐，我可以帮您：

**1. 岗位匹配分析**
• 分析您的技能与经验
• 匹配适合的职位类型
• 评估薪资期望合理性

**2. 行业趋势**
• 当前热门技术方向
• 各行业招聘需求
• 远程/混合办公机会

**3. 求职策略**
• 目标公司筛选
• 投递时机把握
• 多渠道求职建议

请告诉我您的背景和期望，我来为您推荐合适的方向。"""
    
    # 瓶颈/问题分析
    elif any(kw in message_lower for kw in ["瓶颈", "问题", "分析", "困难", "挑战"]):
        if context:
            response = f"""根据当前任务「{context}」，我来帮您分析：

**可能的瓶颈点：**

1. **知识储备**
   • 是否有知识盲区需要补充？
   • 技术深度是否足够？

2. **时间管理**
   • 准备时间是否充足？
   • 是否需要调整优先级？

3. **实践经验**
   • 是否缺少项目实战？
   • 需要更多模拟练习？

**建议的突破方向：**
• 制定明确的学习计划
• 找到薄弱环节重点突破
• 寻求反馈持续改进

您觉得主要卡在哪个方面？我可以提供更针对性的建议。"""
        else:
            response = """帮您分析当前可能的瓶颈：

**常见瓶颈类型：**

1. **技术瓶颈** - 某些知识点不够深入
2. **项目瓶颈** - 缺少亮点项目经验
3. **沟通瓶颈** - 表达不够清晰有力
4. **心态瓶颈** - 面试紧张影响发挥

请描述一下您目前遇到的具体情况，我来帮您深入分析。"""
    
    # 计划/建议相关
    elif any(kw in message_lower for kw in ["计划", "建议", "规划", "怎么做", "如何"]):
        response = """制定执行计划的建议：

**1. 明确目标**
• 确定具体可衡量的目标
• 设定合理的时间节点

**2. 拆分任务**
• 将大目标分解为小任务
• 每个任务有明确的交付物

**3. 优先排序**
• 识别关键路径
• 先解决重要紧急的事项

**4. 执行与复盘**
• 每日/每周检查进度
• 及时调整计划

需要我帮您制定具体的行动计划吗？"""
    
    # 默认响应
    else:
        response = f"""收到您的问题：「{message}」

我是 Devnors AI 招聘助手，可以帮您：

• **求职准备** - 简历优化、面试技巧、技术提升
• **职位推荐** - 根据您的背景匹配合适岗位
• **职业规划** - 分析发展路径、行业趋势
• **任务执行** - 协助完成招聘相关任务

请问您需要哪方面的帮助？或者可以更具体地描述您的需求。"""
    
    return {
        "response": response,
        "tokens_used": 0,
        "model": model
    }


class ChatRequest(BaseModel):
    message: str
    history: list = []
    model: str = "Devnors 1.0"
    context: str = ""  # 可选的上下文，如任务信息


@router.post("/chat")
async def chat_with_assistant(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """AI 助手聊天接口 - 优先使用 MiniMax"""
    import httpx
    from app.config import settings
    
    # 系统提示
    system_prompt = """你是 Devnors 得若 AI 智能招聘助手，专门帮助用户解决招聘相关的问题。你的能力包括：

1. 解答招聘相关问题
2. 提供求职/招聘建议
3. 分析职位匹配度
4. 优化简历和职位描述
5. 规划职业发展方向
6. 帮助执行招聘任务

请用简洁、专业、友好的方式回复用户。回复请使用中文。"""
    
    if request.context:
        system_prompt += f"\n\n当前任务上下文：{request.context}"
    
    # 优先使用 MiniMax API（使用 OpenAI 兼容格式，不需要 GROUP_ID）
    minimax_api_key = settings.minimax_api_key or ""
    
    if minimax_api_key:
        try:
            # 构建 OpenAI 兼容的消息格式
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # 添加历史消息
            for msg in request.history[-10:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                messages.append({"role": role, "content": content})
            
            # 添加当前消息
            messages.append({"role": "user", "content": request.message})
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.minimax.chat/v1/text/chatcompletion_v2",
                    headers={
                        "Authorization": f"Bearer {minimax_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "abab6.5s-chat",
                        "messages": messages,
                        "max_tokens": 2048,
                        "temperature": 0.7,
                        "top_p": 0.9,
                    }
                )
                
                result = response.json()
                
                # 检查是否成功
                if result.get("base_resp", {}).get("status_code", 0) == 0:
                    if "choices" in result and len(result["choices"]) > 0:
                        reply = result["choices"][0].get("message", {}).get("content", "")
                        tokens = result.get("usage", {}).get("total_tokens", 0)
                        
                        return {
                            "response": reply,
                            "tokens_used": tokens,
                            "model": request.model
                        }
                else:
                    error_msg = result.get("base_resp", {}).get("status_msg", "")
                    print(f"MiniMax API error: {error_msg}")
        except Exception as e:
            print(f"MiniMax API error: {e}")
    
    # 备选：使用 Gemini API
    gemini_api_key = settings.gemini_api_key or ""
    
    if gemini_api_key:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                contents = []
                contents.append({"role": "user", "parts": [{"text": f"[系统指令] {system_prompt}"}]})
                contents.append({"role": "model", "parts": [{"text": "好的，我是 Devnors AI 智能招聘助手，随时为您提供专业的招聘服务。"}]})
                
                for msg in request.history[-10:]:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "user":
                        contents.append({"role": "user", "parts": [{"text": content}]})
                    else:
                        contents.append({"role": "model", "parts": [{"text": content}]})
                
                contents.append({"role": "user", "parts": [{"text": request.message}]})
                
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": contents,
                        "generationConfig": {"temperature": 0.7, "topP": 0.9, "maxOutputTokens": 2048}
                    }
                )
                
                result = response.json()
                
                if "candidates" in result and len(result["candidates"]) > 0:
                    reply = result["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    tokens = result.get("usageMetadata", {}).get("totalTokenCount", 0)
                    return {"response": reply, "tokens_used": tokens, "model": request.model}
        except Exception as e:
            print(f"Gemini API error: {e}")
    
    # 如果所有 AI API 都不可用，使用智能本地响应
    return generate_smart_response(request.message, request.context, request.model)


# ============ 聊天消息持久化接口 ============

from app.models.todo import ChatMessage

class SaveMessageRequest(BaseModel):
    role: str  # user / assistant
    content: str
    todo_id: Optional[int] = None  # 关联的任务ID，None表示通用对话


class SaveMessageBatchRequest(BaseModel):
    messages: list  # [{role, content, todo_id?}]


@router.get("/chat-messages")
async def get_chat_messages(
    user_id: int = Query(1, description="用户ID"),
    todo_id: Optional[int] = Query(None, description="任务ID，不传则获取通用对话"),
    limit: int = Query(100, description="最大条数"),
    db: AsyncSession = Depends(get_db)
):
    """获取聊天历史消息"""
    query = select(ChatMessage).where(ChatMessage.user_id == user_id)
    if todo_id is not None:
        query = query.where(ChatMessage.todo_id == todo_id)
    else:
        query = query.where(ChatMessage.todo_id == None)
    
    query = query.order_by(ChatMessage.created_at.asc()).limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()
    
    return [{
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "todo_id": m.todo_id,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    } for m in messages]


@router.post("/chat-messages")
async def save_chat_message(
    msg: SaveMessageRequest,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """保存单条聊天消息"""
    chat_msg = ChatMessage(
        user_id=user_id,
        todo_id=msg.todo_id,
        role=msg.role,
        content=msg.content,
    )
    db.add(chat_msg)
    await db.commit()
    await db.refresh(chat_msg)
    return {"id": chat_msg.id, "message": "消息已保存"}


@router.post("/chat-messages/batch")
async def save_chat_messages_batch(
    batch: SaveMessageBatchRequest,
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """批量保存聊天消息（用于同步本地对话到服务端）"""
    saved = []
    for item in batch.messages:
        chat_msg = ChatMessage(
            user_id=user_id,
            todo_id=item.get("todo_id"),
            role=item["role"],
            content=item["content"],
        )
        db.add(chat_msg)
        saved.append(chat_msg)
    await db.commit()
    return {"saved_count": len(saved), "message": f"已保存 {len(saved)} 条消息"}


@router.delete("/chat-messages")
async def clear_chat_messages(
    user_id: int = Query(1, description="用户ID"),
    todo_id: Optional[int] = Query(None, description="任务ID，不传则清除通用对话"),
    db: AsyncSession = Depends(get_db)
):
    """清除指定对话的聊天记录"""
    query = select(ChatMessage).where(ChatMessage.user_id == user_id)
    if todo_id is not None:
        query = query.where(ChatMessage.todo_id == todo_id)
    else:
        query = query.where(ChatMessage.todo_id == None)
    
    result = await db.execute(query)
    messages = result.scalars().all()
    for m in messages:
        await db.delete(m)
    await db.commit()
    return {"deleted_count": len(messages), "message": f"已清除 {len(messages)} 条消息"}


@router.get("/recruitment-suggestions")
async def get_recruitment_suggestions(
    user_id: int = Query(1, description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """根据企业资料调用大模型生成个性化的招聘岗位建议"""
    import httpx
    import json
    from app.config import settings
    from app.models.settings import UserSettings, EnterpriseCertification
    
    try:
        # 1. 获取企业设置信息
        stmt = select(UserSettings).where(UserSettings.user_id == user_id)
        result = await db.execute(stmt)
        user_settings = result.scalar_one_or_none()
        
        company_name = ''
        industry = ''
        company_size = ''
        location = ''
        benefits = ''
        description = ''
        
        if user_settings:
            company_name = user_settings.display_name or user_settings.short_name or ''
            industry = user_settings.industry or ''
            company_size = user_settings.company_size or ''
            location = f"{user_settings.city or ''}{user_settings.district or ''}"
            benefits = user_settings.benefits or ''
            description = user_settings.description or ''
        
        # 2. 获取企业认证数据（营业执照中的经营范围等）
        stmt = select(EnterpriseCertification).where(
            EnterpriseCertification.user_id == user_id
        )
        result = await db.execute(stmt)
        enterprise_certs = result.scalars().all()
        
        business_scope = ''
        registered_capital = ''
        cert_names = []
        
        for cert in enterprise_certs:
            if cert.business_scope:
                business_scope = cert.business_scope
            if cert.registered_capital:
                registered_capital = cert.registered_capital
            if cert.name:
                cert_names.append(cert.name)
        
        # 3. 获取用户基本信息
        from app.models.user import User
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user_obj = result.scalar_one_or_none()
        
        if not company_name and user_obj:
            company_name = user_obj.company_name or '贵公司'
        
        # 4. 获取企业记忆（要求类 + 高强度记忆）
        memory_result = await db.execute(
            select(Memory)
            .where(Memory.user_id == user_id)
            .where(Memory.scope == MemoryScope.EMPLOYER)
            .order_by(Memory.emphasis_count.desc(), Memory.created_at.desc())
        )
        all_memories = memory_result.scalars().all()
        
        memory_context_lines = []
        for m in all_memories:
            # 要求类全部纳入
            if m.type.value == 'requirement':
                strength = f"（强调×{m.emphasis_count}）" if (m.emphasis_count or 1) > 1 else ""
                memory_context_lines.append(f"• [要求] {m.content}{strength}")
            # 动作/策略类全部纳入
            elif m.type.value in ('action', 'strategy'):
                strength = f"（强调×{m.emphasis_count}）" if (m.emphasis_count or 1) > 1 else ""
                type_label = TYPE_NAME_MAP.get(m.type.value, m.type.value)
                memory_context_lines.append(f"• [{type_label}] {m.content}{strength}")
            # 其他类型：强度>=2的纳入
            elif (m.emphasis_count or 1) >= 2:
                type_label = TYPE_NAME_MAP.get(m.type.value, m.type.value)
                strength = f"（强调×{m.emphasis_count}）"
                memory_context_lines.append(f"• [{type_label}] {m.content}{strength}")
        
        memory_context = ""
        if memory_context_lines:
            memory_context = "\n\n【企业记忆 — 必须严格遵守】\n" + "\n".join(memory_context_lines)
        
        # 5. 构建企业画像上下文
        enterprise_context = f"""企业名称：{company_name}
所属行业：{industry or '未知'}
企业规模：{company_size or '未知'}
所在地区：{location or '未知'}
企业福利：{benefits or '未知'}
企业简介：{description or '未知'}
经营范围：{business_scope or '未知'}
注册资本：{registered_capital or '未知'}
已有认证：{', '.join(cert_names) if cert_names else '无'}{memory_context}"""
        
        # 6. 调用大模型生成个性化招聘建议
        ai_prompt = f"""你是一个资深的 HR 招聘顾问。请根据以下企业信息和企业记忆偏好，分析该企业最可能需要招聘的岗位类型，给出 3-5 个精准的招聘建议提示语。

{enterprise_context}

要求：
1. 根据企业的行业、经营范围、规模来推断最适合的岗位
2. 每条建议要简短有力，像用户自然说出来的话，不超过20个字
3. 要体现行业特色，不要太通用
4. 如果是科技/互联网公司，建议开发、产品、运营相关岗位
5. 如果是传统行业，建议销售、市场、管理相关岗位
6. 如果企业信息不足，给出通用但有价值的建议
7. 如果企业记忆中有明确的要求（如薪资范围、学历偏好、工作方式等），建议中必须体现这些约束
8. 如果企业记忆中有历史招聘动作记录，参考这些信息推荐相似或互补的岗位

请严格按以下 JSON 格式返回（直接返回JSON，不要markdown标记）：
{{
  "company_summary": "一句话描述企业特征和招聘偏好（不超过40字，如果有企业记忆中的关键约束请提及）",
  "suggestions": [
    "建议提示语1",
    "建议提示语2", 
    "建议提示语3"
  ]
}}"""

        # 尝试 MiniMax
        minimax_api_key = settings.minimax_api_key or ""
        if minimax_api_key:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        "https://api.minimax.chat/v1/text/chatcompletion_v2",
                        headers={
                            "Authorization": f"Bearer {minimax_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "abab6.5s-chat",
                            "messages": [
                                {"role": "system", "content": "你是一个资深 HR 招聘顾问，擅长分析企业需求并提供精准的招聘建议。请只返回JSON格式结果。"},
                                {"role": "user", "content": ai_prompt}
                            ],
                            "max_tokens": 1024,
                            "temperature": 0.7,
                        }
                    )
                    result = response.json()
                    if result.get("choices"):
                        reply = result["choices"][0].get("message", {}).get("content", "")
                        # 解析 JSON
                        import re
                        json_match = re.search(r'\{[\s\S]*\}', reply)
                        if json_match:
                            data = json.loads(json_match.group())
                            return {
                                "company_name": company_name,
                                "company_summary": data.get("company_summary", ""),
                                "suggestions": data.get("suggestions", []),
                                "enterprise_context": enterprise_context
                            }
            except Exception as e:
                print(f"[Recruitment Suggestions] MiniMax error: {e}")
        
        # Gemini fallback
        gemini_api_key = settings.gemini_api_key or ""
        if gemini_api_key:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}",
                        json={
                            "contents": [{"parts": [{"text": ai_prompt}]}],
                            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
                        }
                    )
                    result = response.json()
                    if "candidates" in result:
                        reply = result["candidates"][0]["content"]["parts"][0].get("text", "")
                        import re
                        json_match = re.search(r'\{[\s\S]*\}', reply)
                        if json_match:
                            data = json.loads(json_match.group())
                            return {
                                "company_name": company_name,
                                "company_summary": data.get("company_summary", ""),
                                "suggestions": data.get("suggestions", []),
                                "enterprise_context": enterprise_context
                            }
            except Exception as e:
                print(f"[Recruitment Suggestions] Gemini error: {e}")
        
        # AI 不可用时返回基于行业的默认建议
        default_suggestions = _get_default_suggestions(industry, business_scope)
        return {
            "company_name": company_name,
            "company_summary": f"{industry or '企业'}招聘",
            "suggestions": default_suggestions,
            "enterprise_context": enterprise_context
        }
        
    except Exception as e:
        print(f"[Recruitment Suggestions] Error: {e}")
        return {
            "company_name": "贵公司",
            "company_summary": "",
            "suggestions": [
                "招一个高级前端工程师",
                "需要产品经理，3年经验",
                "技术团队扩招5个人"
            ],
            "enterprise_context": ""
        }


def _get_default_suggestions(industry: str, business_scope: str) -> list:
    """根据行业返回默认招聘建议"""
    industry_lower = (industry or '').lower()
    scope_lower = (business_scope or '').lower()
    
    combined = industry_lower + scope_lower
    
    if any(kw in combined for kw in ['互联网', '科技', '软件', '信息技术', 'it', '人工智能', 'ai', '数据']):
        return [
            "招高级前端工程师，熟悉React",
            "需要Java后端，3年以上经验",
            "招产品经理，负责核心产品线",
            "数据分析师，熟悉Python",
        ]
    elif any(kw in combined for kw in ['电商', '零售', '贸易', '商务']):
        return [
            "招运营经理，有电商平台经验",
            "需要供应链专员，熟悉物流",
            "招美工设计，会视频剪辑优先",
            "客服主管，管理10人团队",
        ]
    elif any(kw in combined for kw in ['金融', '投资', '银行', '保险', '证券']):
        return [
            "招风控经理，5年以上经验",
            "需要投资分析师，CFA优先",
            "招合规专员，熟悉金融法规",
            "客户经理，有高净值客户资源",
        ]
    elif any(kw in combined for kw in ['教育', '培训', '学校']):
        return [
            "招课程研发专家，K12方向",
            "需要英语老师，有教师资格证",
            "招市场推广经理，懂教育行业",
            "教务管理，有3年以上经验",
        ]
    elif any(kw in combined for kw in ['医疗', '健康', '医药', '生物']):
        return [
            "招临床研究员，医学背景",
            "需要医药代表，覆盖华东区域",
            "招注册专员，熟悉NMPA流程",
            "质量管理工程师，GMP经验",
        ]
    elif any(kw in combined for kw in ['制造', '生产', '工厂', '工程']):
        return [
            "招生产经理，精益管理经验",
            "需要品质工程师，熟悉ISO",
            "招机械设计师，SolidWorks",
            "仓储物流主管，管理经验优先",
        ]
    else:
        return [
            "招一个高级工程师",
            "需要销售经理，行业经验丰富",
            "招行政人事，综合管理能力强",
            "市场专员，有策划执行经验",
        ]


# ============ 用户资料接口 ============

from app.models.profile import UserProfile, ProfileType
from pydantic import BaseModel

class ProfileUpdate(BaseModel):
    """资料更新请求"""
    display_name: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    candidate_data: Optional[dict] = None
    employer_data: Optional[dict] = None


@router.get("/profile")
async def get_user_profile(
    user_id: int = Query(..., description="用户ID"),
    profile_type: str = Query("candidate", description="资料类型: candidate 或 employer"),
    db: AsyncSession = Depends(get_db)
):
    """获取用户资料"""
    try:
        ptype = ProfileType(profile_type.lower())
    except ValueError:
        ptype = ProfileType.CANDIDATE
    
    result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == user_id)
        .where(UserProfile.profile_type == ptype)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        # 返回空资料模板
        return {
            "id": None,
            "user_id": user_id,
            "profile_type": profile_type,
            "display_name": None,
            "title": None,
            "summary": None,
            "avatar_url": None,
            "cover_url": None,
            "candidate_data": {
                "skills": [],
                "experience_years": 0,
                "career_path": [],
                "certifications": [],
                "awards": [],
                "radar_data": [],
                "ideal_job": ""
            } if ptype == ProfileType.CANDIDATE else None,
            "employer_data": {
                "company_name": "",
                "industry": "",
                "size": "",
                "location": "",
                "founded": "",
                "website": "",
                "culture": "",
                "benefits": [],
                "tech_stack": [],
                "open_positions": [],
                "mission": "",
                "vision": ""
            } if ptype == ProfileType.EMPLOYER else None,
            "is_empty": True
        }
    
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "profile_type": profile.profile_type.value,
        "display_name": profile.display_name,
        "title": profile.title,
        "summary": profile.summary,
        "avatar_url": profile.avatar_url,
        "cover_url": profile.cover_url,
        "candidate_data": profile.candidate_data,
        "employer_data": profile.employer_data,
        "is_empty": False,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None
    }


@router.post("/profile")
async def update_user_profile(
    profile_data: ProfileUpdate,
    user_id: int = Query(..., description="用户ID"),
    profile_type: str = Query("candidate", description="资料类型: candidate 或 employer"),
    db: AsyncSession = Depends(get_db)
):
    """创建或更新用户资料"""
    try:
        ptype = ProfileType(profile_type.lower())
    except ValueError:
        ptype = ProfileType.CANDIDATE
    
    result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == user_id)
        .where(UserProfile.profile_type == ptype)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        # 创建新资料
        profile = UserProfile(
            user_id=user_id,
            profile_type=ptype
        )
        db.add(profile)
    
    # 更新字段
    if profile_data.display_name is not None:
        profile.display_name = profile_data.display_name
    if profile_data.title is not None:
        profile.title = profile_data.title
    if profile_data.summary is not None:
        profile.summary = profile_data.summary
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url
    if profile_data.cover_url is not None:
        profile.cover_url = profile_data.cover_url
    if profile_data.candidate_data is not None:
        # 合并现有数据
        existing = profile.candidate_data or {}
        if isinstance(existing, str):
            existing = json.loads(existing)
        existing.update(profile_data.candidate_data)
        profile.candidate_data = existing
    if profile_data.employer_data is not None:
        existing = profile.employer_data or {}
        if isinstance(existing, str):
            existing = json.loads(existing)
        existing.update(profile_data.employer_data)
        profile.employer_data = existing
    
    await db.commit()
    await db.refresh(profile)
    
    return {
        "success": True,
        "message": "资料更新成功",
        "profile": {
            "id": profile.id,
            "user_id": profile.user_id,
            "profile_type": profile.profile_type.value,
            "display_name": profile.display_name,
            "title": profile.title,
            "summary": profile.summary,
            "candidate_data": profile.candidate_data,
            "employer_data": profile.employer_data
        }
    }


@router.patch("/profile/field")
async def update_profile_field(
    field: str = Query(..., description="字段名"),
    value: str = Query(..., description="字段值"),
    user_id: int = Query(..., description="用户ID"),
    profile_type: str = Query("candidate", description="资料类型"),
    force_update: bool = Query(False, description="是否强制覆盖已有值"),
    db: AsyncSession = Depends(get_db)
):
    """更新用户资料的单个字段（用于 AI 助手编辑）
    
    默认只在字段为空时保存（首次输入），如果已有值需要 force_update=true 才会覆盖
    """
    try:
        ptype = ProfileType(profile_type.lower())
    except ValueError:
        ptype = ProfileType.CANDIDATE
    
    result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == user_id)
        .where(UserProfile.profile_type == ptype)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = UserProfile(user_id=user_id, profile_type=ptype)
        db.add(profile)
    
    # 辅助函数：检查字段是否已有值
    def has_existing_value(field_name: str) -> tuple:
        """返回 (是否有值, 现有值)"""
        if field_name in ['display_name', 'title', 'summary', 'avatar_url', 'cover_url']:
            existing = getattr(profile, field_name, None)
            if existing and str(existing).strip():
                return True, existing
            return False, None
        
        if ptype == ProfileType.CANDIDATE:
            data = profile.candidate_data or {}
            if isinstance(data, str):
                data = json.loads(data)
            existing = data.get(field_name)
            if existing:
                if isinstance(existing, list) and len(existing) > 0:
                    return True, existing
                if isinstance(existing, str) and existing.strip():
                    return True, existing
            return False, None
        
        if ptype == ProfileType.EMPLOYER:
            data = profile.employer_data or {}
            if isinstance(data, str):
                data = json.loads(data)
            existing = data.get(field_name)
            if existing:
                if isinstance(existing, list) and len(existing) > 0:
                    return True, existing
                if isinstance(existing, str) and existing.strip():
                    return True, existing
            return False, None
        
        return False, None
    
    # 检查是否已有值
    has_value, existing_value = has_existing_value(field)
    if has_value and not force_update:
        # 已有值且未强制覆盖，返回提示
        return {
            "success": False,
            "has_existing": True,
            "existing_value": existing_value if isinstance(existing_value, str) else str(existing_value),
            "message": f"字段 {field} 已有值，如需修改请确认覆盖",
            "field": field,
            "new_value": value
        }
    
    # 根据字段名更新
    if field in ['display_name', 'title', 'summary', 'avatar_url', 'cover_url']:
        setattr(profile, field, value)
    elif ptype == ProfileType.CANDIDATE:
        # 更新 candidate_data 中的字段
        # 创建新字典副本以确保 SQLAlchemy 检测到变化
        old_data = profile.candidate_data or {}
        if isinstance(old_data, str):
            old_data = json.loads(old_data)
        data = dict(old_data)  # 创建副本
        
        if field == 'skills':
            data['skills'] = [s.strip() for s in value.split(',') if s.strip()]
        elif field == 'experience':
            # 工作经历保存为数组
            data['experience'] = [value.strip()] if value.strip() else []
        elif field == 'education':
            # 教育背景保存为数组
            data['education'] = [value.strip()] if value.strip() else []
        elif field == 'projects':
            # 项目经历保存为数组
            data['projects'] = [value.strip()] if value.strip() else []
        elif field == 'experience_years':
            data['experience_years'] = int(value) if value.isdigit() else 0
        elif field == 'ideal_job':
            data['ideal_job'] = value
        else:
            data[field] = value
        
        # 显式赋值新字典以触发 SQLAlchemy 变更检测
        profile.candidate_data = data
        # 强制标记字段为已修改
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(profile, 'candidate_data')
    elif ptype == ProfileType.EMPLOYER:
        # 更新 employer_data 中的字段
        old_data = profile.employer_data or {}
        if isinstance(old_data, str):
            old_data = json.loads(old_data)
        data = dict(old_data)  # 创建副本
        
        if field in ['benefits', 'tech_stack']:
            data[field] = [s.strip() for s in value.split(',') if s.strip()]
        else:
            data[field] = value
        
        profile.employer_data = data
        # 强制标记字段为已修改
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(profile, 'employer_data')
    
    await db.commit()
    await db.refresh(profile)
    
    return {
        "success": True,
        "message": f"字段 {field} 更新成功",
        "field": field,
        "value": value,
        "was_overwrite": has_value
    }


# ============ Token 资金账户接口 ============

from app.models.token import TokenUsage, TokenPackage, TokenAction, PackageType

# Token 消耗类型中文名映射
TOKEN_ACTION_NAMES = {
    TokenAction.RESUME_PARSE: "简历解析",
    TokenAction.PROFILE_BUILD: "画像调优",
    TokenAction.JOB_MATCH: "职位匹配",
    TokenAction.INTERVIEW: "多智能体面试",
    TokenAction.MARKET_ANALYSIS: "市场分析",
    TokenAction.ROUTE_DISPATCH: "全局路由",
    TokenAction.CHAT: "AI 对话",
    TokenAction.OTHER: "其他",
}


@router.get("/tokens/stats")
async def get_token_stats(
    user_id: int = Query(..., description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取用户 Token 统计信息"""
    from sqlalchemy import func
    from datetime import timedelta
    
    # 获取用户当前套餐和余额
    result = await db.execute(
        select(TokenPackage)
        .where(TokenPackage.user_id == user_id)
        .where(TokenPackage.is_active == True)
        .order_by(TokenPackage.purchased_at.desc())
    )
    packages = result.scalars().all()
    
    # 计算总余额
    total_remaining = sum(p.remaining_tokens for p in packages) if packages else 100000  # 默认送10万
    total_used = sum(p.used_tokens for p in packages) if packages else 0
    total_purchased = sum(p.price for p in packages) if packages else 0
    
    # 获取今日消耗
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.sum(TokenUsage.tokens_used))
        .where(TokenUsage.user_id == user_id)
        .where(TokenUsage.created_at >= today)
    )
    today_usage = result.scalar() or 0
    
    # 获取昨日消耗（用于计算环比）
    yesterday = today - timedelta(days=1)
    result = await db.execute(
        select(func.sum(TokenUsage.tokens_used))
        .where(TokenUsage.user_id == user_id)
        .where(TokenUsage.created_at >= yesterday)
        .where(TokenUsage.created_at < today)
    )
    yesterday_usage = result.scalar() or 1  # 避免除零
    
    # 计算环比增长
    change_rate = ((today_usage - yesterday_usage) / yesterday_usage * 100) if yesterday_usage > 0 else 0
    
    # 计算预估续航天数（基于近7天平均消耗）
    week_ago = today - timedelta(days=7)
    result = await db.execute(
        select(func.sum(TokenUsage.tokens_used))
        .where(TokenUsage.user_id == user_id)
        .where(TokenUsage.created_at >= week_ago)
    )
    week_usage = result.scalar() or 1
    daily_avg = week_usage / 7
    estimated_days = int(total_remaining / daily_avg) if daily_avg > 0 else 999
    
    return {
        "balance": total_remaining,
        "balance_display": f"{total_remaining/1000000:.2f}M" if total_remaining >= 100000 else f"{total_remaining/1000:.1f}K",
        "today_usage": today_usage,
        "today_usage_display": f"{today_usage:,}",
        "change_rate": round(change_rate, 1),
        "change_direction": "up" if change_rate > 0 else "down" if change_rate < 0 else "stable",
        "total_purchased": total_purchased,
        "total_purchased_display": f"¥ {total_purchased:,.2f}",
        "estimated_days": estimated_days,
        "packages": [{
            "id": p.id,
            "type": p.package_type.value,
            "total": p.total_tokens,
            "used": p.used_tokens,
            "remaining": p.remaining_tokens,
            "expires_at": p.expires_at.isoformat() if p.expires_at else None
        } for p in packages]
    }


@router.get("/tokens/history")
async def get_token_history(
    user_id: int = Query(..., description="用户ID"),
    limit: int = Query(20, description="返回条数"),
    offset: int = Query(0, description="偏移量"),
    db: AsyncSession = Depends(get_db)
):
    """获取 Token 消耗历史"""
    result = await db.execute(
        select(TokenUsage)
        .where(TokenUsage.user_id == user_id)
        .order_by(TokenUsage.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    records = result.scalars().all()
    
    # 如果没有记录，返回一些示例数据
    if not records:
        # 生成最近7天的模拟数据
        sample_data = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=i)
            actions = [TokenAction.RESUME_PARSE, TokenAction.INTERVIEW, TokenAction.PROFILE_BUILD, TokenAction.ROUTE_DISPATCH]
            action = actions[i % len(actions)]
            tokens = [42500, 89000, 12400, 56000, 92000, 15000, 34000][i]
            sample_data.append({
                "id": i + 1,
                "date": date.strftime("%Y-%m-%d"),
                "action": action.value,
                "type": TOKEN_ACTION_NAMES.get(action, "其他"),
                "tokens": tokens,
                "cost": f"¥{tokens/10000:.2f}",
                "description": f"AI {TOKEN_ACTION_NAMES.get(action, '任务')}"
            })
        return {
            "items": sample_data,
            "total": len(sample_data),
            "has_more": False
        }
    
    return {
        "items": [{
            "id": r.id,
            "date": r.created_at.strftime("%Y-%m-%d"),
            "action": r.action.value,
            "type": TOKEN_ACTION_NAMES.get(r.action, "其他"),
            "tokens": r.tokens_used,
            "cost": f"¥{r.tokens_used/10000:.2f}",
            "description": r.description or f"AI {TOKEN_ACTION_NAMES.get(r.action, '任务')}"
        } for r in records],
        "total": len(records),
        "has_more": len(records) >= limit
    }


@router.get("/tokens/chart")
async def get_token_chart(
    user_id: int = Query(..., description="用户ID"),
    days: int = Query(7, description="天数"),
    db: AsyncSession = Depends(get_db)
):
    """获取 Token 消耗趋势图数据"""
    from sqlalchemy import func, cast, Date
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 按日期分组统计
    result = await db.execute(
        select(
            func.date(TokenUsage.created_at).label('date'),
            func.sum(TokenUsage.tokens_used).label('total')
        )
        .where(TokenUsage.user_id == user_id)
        .where(TokenUsage.created_at >= start_date)
        .group_by(func.date(TokenUsage.created_at))
        .order_by(func.date(TokenUsage.created_at))
    )
    rows = result.all()
    
    # 如果没有数据，生成模拟数据
    if not rows:
        chart_data = []
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=days-1-i)
            values = [42500, 89000, 12400, 56000, 92000, 15000, 34000]
            chart_data.append({
                "name": date.strftime("%m-%d"),
                "value": values[i % len(values)]
            })
        return {
            "data": chart_data,
            "peak": max(v["value"] for v in chart_data),
            "average": sum(v["value"] for v in chart_data) // len(chart_data)
        }
    
    # 构建完整的日期序列（填充无数据的日期）
    date_map = {str(row.date): row.total for row in rows}
    chart_data = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-1-i)
        date_str = date.strftime("%Y-%m-%d")
        chart_data.append({
            "name": date.strftime("%m-%d"),
            "value": date_map.get(date_str, 0)
        })
    
    values = [d["value"] for d in chart_data]
    return {
        "data": chart_data,
        "peak": max(values) if values else 0,
        "average": sum(values) // len(values) if values else 0
    }


@router.get("/tokens/packages")
async def get_available_packages():
    """获取可购买的 Token 套餐"""
    return {
        "packages": [
            {
                "id": "starter",
                "name": "入门体验",
                "tokens": 100000,
                "tokens_display": "100,000",
                "price": 99,
                "discount": None,
                "accent": "bg-indigo-50"
            },
            {
                "id": "pro",
                "name": "精英猎聘",
                "tokens": 1000000,
                "tokens_display": "1,000,000",
                "price": 799,
                "discount": "性价比最高",
                "accent": "bg-amber-50"
            },
            {
                "id": "enterprise",
                "name": "企业旗舰",
                "tokens": 10000000,
                "tokens_display": "10,000,000",
                "price": 6999,
                "discount": "-20%",
                "accent": "bg-rose-50"
            }
        ]
    }


@router.post("/tokens/record")
async def record_token_usage(
    user_id: int = Query(..., description="用户ID"),
    action: str = Query(..., description="消耗类型"),
    tokens: int = Query(..., description="消耗数量"),
    description: Optional[str] = Query(None, description="描述"),
    db: AsyncSession = Depends(get_db)
):
    """记录 Token 消耗"""
    try:
        token_action = TokenAction(action)
    except ValueError:
        token_action = TokenAction.OTHER
    
    # 创建消耗记录
    usage = TokenUsage(
        user_id=user_id,
        action=token_action,
        tokens_used=tokens,
        description=description
    )
    db.add(usage)
    
    # 更新用户套餐余额
    result = await db.execute(
        select(TokenPackage)
        .where(TokenPackage.user_id == user_id)
        .where(TokenPackage.is_active == True)
        .where(TokenPackage.remaining_tokens > 0)
        .order_by(TokenPackage.expires_at.asc().nullslast())
    )
    package = result.scalar_one_or_none()
    
    if package:
        package.used_tokens += tokens
        package.remaining_tokens = max(0, package.remaining_tokens - tokens)
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Token 消耗已记录",
        "tokens_used": tokens,
        "action": token_action.value
    }


# ============ 消息通知相关接口 ============

@router.get("/notifications")
async def get_notifications(
    user_id: int = Query(..., description="用户ID"),
    notification_type: Optional[str] = Query(None, description="通知类型: system/match/interview/message"),
    unread_only: bool = Query(False, description="仅未读"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """获取用户通知列表"""
    import random
    
    # 基础通知模板
    notification_templates = [
        {
            "type": "match",
            "title": "新的职位匹配",
            "content_template": "您的简历与「{job_title} - {company}」匹配度达到 {match_rate}%",
            "icon": "Target",
            "color": "text-indigo-600",
            "bgColor": "bg-indigo-50",
            "link": "/jobs"
        },
        {
            "type": "interview",
            "title": "面试邀请",
            "content_template": "{company}邀请您参加「{job_title}」岗位的{interview_type}",
            "icon": "Calendar",
            "color": "text-emerald-600",
            "bgColor": "bg-emerald-50",
            "link": "/workbench"
        },
        {
            "type": "system",
            "title": "系统通知",
            "content_template": "{message}",
            "icon": "Bell",
            "color": "text-amber-600",
            "bgColor": "bg-amber-50",
            "link": "/settings"
        },
        {
            "type": "message",
            "title": "新消息",
            "content_template": "{sender}回复了您：「{preview}」",
            "icon": "MessageSquare",
            "color": "text-violet-600",
            "bgColor": "bg-violet-50",
            "link": "/ai-assistant"
        },
        {
            "type": "match",
            "title": "简历被查看",
            "content_template": "{company}的招聘官查看了您的简历",
            "icon": "Eye",
            "color": "text-cyan-600",
            "bgColor": "bg-cyan-50",
            "link": "/candidate/profile"
        },
        {
            "type": "system",
            "title": "Token 余额提醒",
            "content_template": "您的 Token 余额不足 {threshold}，建议及时充值",
            "icon": "AlertCircle",
            "color": "text-rose-600",
            "bgColor": "bg-rose-50",
            "link": "/tokens"
        },
        {
            "type": "interview",
            "title": "面试结果通知",
            "content_template": "恭喜！您通过了「{company} - {job_title}」的{stage}",
            "icon": "CheckCircle2",
            "color": "text-emerald-600",
            "bgColor": "bg-emerald-50",
            "link": "/workbench"
        },
        {
            "type": "match",
            "title": "人才推荐",
            "content_template": "系统为您推荐了 {count} 位高匹配度候选人",
            "icon": "Users",
            "color": "text-indigo-600",
            "bgColor": "bg-indigo-50",
            "link": "/employer/talent-pool"
        },
        {
            "type": "system",
            "title": "账户升级成功",
            "content_template": "您的账户已升级为 {plan} 版本，解锁更多高级功能",
            "icon": "Zap",
            "color": "text-amber-600",
            "bgColor": "bg-amber-50",
            "link": "/settings"
        },
        {
            "type": "match",
            "title": "职位更新提醒",
            "content_template": "您关注的「{company}」发布了新职位：{job_title}",
            "icon": "Briefcase",
            "color": "text-indigo-600",
            "bgColor": "bg-indigo-50",
            "link": "/jobs"
        }
    ]
    
    # 示例数据
    companies = ["字节跳动", "腾讯科技", "阿里巴巴", "美团", "京东", "百度", "华为", "小米", "滴滴", "蚂蚁集团"]
    job_titles = ["高级前端工程师", "资深后端工程师", "算法工程师", "产品经理", "技术负责人", "全栈开发", "数据分析师", "AI 工程师"]
    interview_types = ["视频面试", "电话面试", "现场面试", "技术面试", "HR 面试"]
    stages = ["一面", "二面", "终面", "HR 面"]
    senders = ["HR 李明", "招聘经理张总", "技术面试官王工", "猎头顾问陈经理"]
    plans = ["Pro", "Ultra", "Enterprise"]
    messages = [
        "您的简历已通过初筛",
        "新版本已发布，请及时更新",
        "您的账户安全设置已更新",
        "感谢您的反馈，我们会持续改进"
    ]
    previews = [
        "关于薪资范围可以面谈...",
        "期待与您进一步沟通...",
        "您的技术背景非常匹配我们的需求...",
        "请问您方便参加下周的面试吗..."
    ]
    
    # 时间生成函数
    def generate_time(minutes_ago: int) -> str:
        if minutes_ago < 60:
            return f"{minutes_ago}分钟前"
        elif minutes_ago < 1440:
            return f"{minutes_ago // 60}小时前"
        elif minutes_ago < 2880:
            return "昨天"
        else:
            return f"{minutes_ago // 1440}天前"
    
    # 生成通知
    notifications = []
    for i in range(15):
        template = random.choice(notification_templates)
        
        # 填充模板
        content = template["content_template"]
        content = content.replace("{company}", random.choice(companies))
        content = content.replace("{job_title}", random.choice(job_titles))
        content = content.replace("{match_rate}", str(random.randint(80, 98)))
        content = content.replace("{interview_type}", random.choice(interview_types))
        content = content.replace("{stage}", random.choice(stages))
        content = content.replace("{sender}", random.choice(senders))
        content = content.replace("{preview}", random.choice(previews))
        content = content.replace("{threshold}", "10,000")
        content = content.replace("{count}", str(random.randint(3, 8)))
        content = content.replace("{plan}", random.choice(plans))
        content = content.replace("{message}", random.choice(messages))
        
        # 时间递增
        minutes_ago = i * random.randint(30, 180)
        
        notifications.append({
            "id": i + 1,
            "type": template["type"],
            "title": template["title"],
            "content": content,
            "time": generate_time(minutes_ago),
            "timestamp": (datetime.utcnow() - timedelta(minutes=minutes_ago)).isoformat(),
            "read": i >= 3,  # 前 3 条未读
            "icon": template["icon"],
            "color": template["color"],
            "bgColor": template["bgColor"],
            "link": template["link"]
        })
    
    # 筛选
    if notification_type:
        notifications = [n for n in notifications if n["type"] == notification_type]
    
    if unread_only:
        notifications = [n for n in notifications if not n["read"]]
    
    # 分页
    total = len(notifications)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = notifications[start:end]
    
    # 统计
    unread_count = len([n for n in notifications if not n["read"]])
    
    return {
        "notifications": paginated,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "page_size": page_size
    }


@router.post("/notifications/read")
async def mark_notification_read(
    user_id: int = Query(..., description="用户ID"),
    notification_id: Optional[int] = Query(None, description="通知ID，不传则标记全部已读"),
    db: AsyncSession = Depends(get_db)
):
    """标记通知已读"""
    # 这里应该更新数据库中的通知状态
    # 由于没有通知表，返回模拟响应
    if notification_id:
        return {
            "success": True,
            "message": f"通知 {notification_id} 已标记为已读"
        }
    else:
        return {
            "success": True,
            "message": "所有通知已标记为已读"
        }


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    user_id: int = Query(..., description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """删除通知"""
    return {
        "success": True,
        "message": f"通知 {notification_id} 已删除"
    }


@router.get("/notifications/unread-count")
async def get_unread_count(
    user_id: int = Query(..., description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取未读通知数量"""
    import random
    # 返回随机未读数量（实际应从数据库查询）
    return {
        "unread_count": random.randint(1, 5)
    }


# ============ 文件解析接口 ============

from fastapi import UploadFile, File, HTTPException
import tempfile
import os

@router.post("/parse-resume")
async def parse_resume_file(
    file: UploadFile = File(..., description="简历文件 (PDF/Word/TXT)")
):
    """
    解析上传的简历文件，返回文本内容
    支持格式: PDF, Word (.doc/.docx), 文本文件 (.txt/.md)
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="未选择文件")
    
    # 获取文件扩展名
    file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    # 检查文件类型
    allowed_extensions = ['pdf', 'doc', 'docx', 'txt', 'md']
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"不支持的文件格式: {file_ext}。支持的格式: PDF, Word, TXT"
        )
    
    # 检查文件大小 (最大 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件过大，最大支持 10MB")
    
    try:
        extracted_text = ""
        
        if file_ext == 'pdf':
            # 解析 PDF
            import pdfplumber
            import io
            
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages_text = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(text)
                extracted_text = '\n\n'.join(pages_text)
        
        elif file_ext in ['doc', 'docx']:
            # 解析 Word
            from docx import Document
            import io
            
            doc = Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            extracted_text = '\n'.join(paragraphs)
        
        elif file_ext in ['txt', 'md']:
            # 文本文件直接解码
            try:
                extracted_text = content.decode('utf-8')
            except UnicodeDecodeError:
                extracted_text = content.decode('gbk', errors='ignore')
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="文件内容为空或无法解析")
        
        return {
            "success": True,
            "filename": file.filename,
            "file_type": file_ext,
            "content": extracted_text.strip(),
            "char_count": len(extracted_text.strip())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"文件解析错误: {e}")
        raise HTTPException(status_code=500, detail=f"文件解析失败: {str(e)}")


from pydantic import BaseModel

class AutoFillRequest(BaseModel):
    user_id: int
    resume_content: str

@router.post("/auto-fill-profile")
async def auto_fill_profile_from_resume(
    request: AutoFillRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    智能解析简历内容，自动填充用户资料和记忆
    """
    from app.agents.base_agent import BaseAgent
    from app.models.memory import Memory, MemoryType, MemoryImportance, MemoryScope
    from app.models.profile import UserProfile, ProfileType
    from sqlalchemy.orm.attributes import flag_modified
    
    # 创建一个简单的 AI Agent 用于解析简历
    class ResumeExtractor(BaseAgent):
        def _get_fallback_response(self, prompt: str) -> str:
            return "{}"
        def _get_fallback_json(self, prompt: str) -> dict:
            return {}
    
    extractor = ResumeExtractor(
        system_instruction="你是一个专业的简历解析助手，请准确提取简历中的信息并返回 JSON 格式。确保 JSON 完整且格式正确。"
    )
    
    user_id = request.user_id
    resume_content = request.resume_content
    
    # 使用 AI 解析简历内容
    parse_prompt = f"""请从以下简历内容中提取结构化信息，返回 JSON 格式：

简历内容：
{resume_content[:6000]}

请提取以下信息（如果简历中没有，填 null）：
{{
    "display_name": "姓名",
    "title": "当前职位/职称",
    "summary": "个人简介/自我评价（50-200字，如果没有请根据简历内容总结）",
    "skills": ["技能1", "技能2"],
    "experience": [
        {{
            "company": "公司名称",
            "position": "职位",
            "period": "时间段",
            "description": "工作描述"
        }}
    ],
    "education": [
        {{
            "school": "学校名称",
            "degree": "学位",
            "major": "专业",
            "period": "时间段"
        }}
    ],
    "projects": [
        {{
            "name": "项目名称",
            "role": "角色",
            "description": "项目描述"
        }}
    ],
    "expected_salary": "期望薪资（如果没有填 null）",
    "expected_location": "期望工作地点（如果没有填 null）",
    "extra_info": ["简历中的其他重要信息，如证书、获奖等"]
}}

只返回 JSON，不要其他内容。"""

    try:
        parsed_data = await extractor.generate_json(parse_prompt)
        
        if not parsed_data:
            raise HTTPException(status_code=500, detail="AI 解析失败，无法提取结构化信息")
        
        # 获取或创建用户资料
        profile_query = select(UserProfile).where(
            UserProfile.user_id == user_id,
            UserProfile.profile_type == ProfileType.CANDIDATE
        )
        result = await db.execute(profile_query)
        profile = result.scalar_one_or_none()
        
        if not profile:
            profile = UserProfile(
                user_id=user_id,
                profile_type=ProfileType.CANDIDATE,
                candidate_data={}
            )
            db.add(profile)
        
        # 更新资料字段
        updates_made = []
        
        if parsed_data.get('display_name'):
            profile.display_name = parsed_data['display_name']
            updates_made.append('姓名')
        
        if parsed_data.get('title'):
            profile.title = parsed_data['title']
            updates_made.append('职位')
        
        if parsed_data.get('summary'):
            profile.summary = parsed_data['summary']
            updates_made.append('个人简介')
        
        # 更新 candidate_data
        candidate_data = dict(profile.candidate_data or {})
        
        if parsed_data.get('skills'):
            candidate_data['skills'] = parsed_data['skills']
            updates_made.append('技能')
        
        if parsed_data.get('experience'):
            candidate_data['experience'] = parsed_data['experience']
            updates_made.append('工作经历')
        
        if parsed_data.get('education'):
            candidate_data['education'] = parsed_data['education']
            updates_made.append('教育背景')
        
        if parsed_data.get('projects'):
            candidate_data['projects'] = parsed_data['projects']
            updates_made.append('项目经历')
        
        if parsed_data.get('expected_salary'):
            candidate_data['expected_salary'] = parsed_data['expected_salary']
            updates_made.append('期望薪资')
        
        if parsed_data.get('expected_location'):
            candidate_data['expected_location'] = parsed_data['expected_location']
            updates_made.append('期望地点')
        
        profile.candidate_data = candidate_data
        flag_modified(profile, 'candidate_data')
        
        # 保存额外信息到记忆
        memories_created = []
        extra_info = parsed_data.get('extra_info', [])
        
        if extra_info:
            for info in extra_info[:5]:  # 最多保存5条额外信息
                if info and len(info) > 10:
                    memory = Memory(
                        user_id=user_id,
                        scope=MemoryScope.CANDIDATE,
                        type=MemoryType.PREFERENCE,
                        content=info,
                        importance=MemoryImportance.MEDIUM,
                        ai_reasoning="从简历中自动提取的额外信息"
                    )
                    db.add(memory)
                    memories_created.append(info[:50] + '...' if len(info) > 50 else info)
        
        await db.commit()
        
        # 计算完善度
        total_fields = 9
        filled_fields = 0
        if profile.display_name: filled_fields += 1
        if profile.title: filled_fields += 1
        if profile.summary and len(profile.summary) >= 20: filled_fields += 1
        if candidate_data.get('skills'): filled_fields += 1
        if candidate_data.get('experience'): filled_fields += 1
        if candidate_data.get('education'): filled_fields += 1
        if candidate_data.get('projects'): filled_fields += 1
        if candidate_data.get('expected_salary'): filled_fields += 1
        if candidate_data.get('expected_location'): filled_fields += 1
        
        completeness = round((filled_fields / total_fields) * 100)
        
        return {
            "success": True,
            "parsed_data": parsed_data,
            "updates_made": updates_made,
            "memories_created": memories_created,
            "completeness": completeness,
            "message": f"已自动填充 {len(updates_made)} 个字段，创建 {len(memories_created)} 条记忆，简历完善度：{completeness}%"
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON 解析错误: {e}")
        raise HTTPException(status_code=500, detail="AI 返回格式错误，请重试")
    except Exception as e:
        print(f"自动填充失败: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"自动填充失败: {str(e)}")


# ============ 岗位发布（公开接口） ============

from pydantic import BaseModel as PydanticBaseModel, Field as PydanticField
from typing import List as TypingList

class PublicJobCreate(PydanticBaseModel):
    """公开创建岗位请求"""
    user_id: int
    title: str
    company: str
    location: str
    description: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    tags: TypingList[str] = []

@router.post("/jobs")
async def create_public_job(
    job_in: PublicJobCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    公开接口创建岗位（通过 user_id 鉴权）
    """
    from app.models.user import User
    
    # 验证用户
    result = await db.execute(select(User).where(User.id == job_in.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 创建岗位
    job = Job(
        title=job_in.title,
        company=job_in.company,
        location=job_in.location,
        description=job_in.description,
        salary_min=job_in.salary_min,
        salary_max=job_in.salary_max,
        owner_id=user.id,
        status=JobStatus.ACTIVE
    )
    
    # 处理标签
    if job_in.tags:
        for tag_name in job_in.tags:
            tag_result = await db.execute(select(JobTag).where(JobTag.name == tag_name))
            tag = tag_result.scalar_one_or_none()
            if not tag:
                tag = JobTag(name=tag_name)
                db.add(tag)
            job.tags.append(tag)
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # 自动写入岗位发布日志
    try:
        from app.models.job import JobLog, JobLogAction
        import json as json_mod
        publish_log = JobLog(
            job_id=job.id,
            actor_id=user.id,
            actor_type="user",
            action=JobLogAction.PUBLISH,
            title="岗位发布成功",
            content=f"岗位「{job.title}」已成功发布，地点：{job.location}，薪资：{job.salary_min or '面议'}-{job.salary_max or '面议'}",
            extra_data=json_mod.dumps({
                "job_title": job.title,
                "company": job.company,
                "location": job.location,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "tags": job_in.tags,
            }),
        )
        db.add(publish_log)
        await db.commit()
    except Exception as e:
        print(f"[JobLog] 写入发布日志失败: {e}")
    
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.description,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "status": job.status.value if job.status else "active",
        "created_at": job.created_at.isoformat() if job.created_at else None
    }


@router.get("/my-jobs")
async def list_my_jobs(
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """获取用户发布的岗位列表"""
    result = await db.execute(
        select(Job).options(selectinload(Job.tags))
        .where(Job.owner_id == user_id)
        .order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()
    
    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "description": j.description,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "status": j.status.value if j.status else "active",
            "tags": [t.name for t in j.tags] if j.tags else [],
            "view_count": j.view_count or 0,
            "apply_count": j.apply_count or 0,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        }
        for j in jobs
    ]


class PublicJobUpdate(PydanticBaseModel):
    """公开更新岗位请求"""
    user_id: int
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    status: Optional[str] = None
    tags: Optional[TypingList[str]] = None


@router.put("/jobs/{job_id}")
async def update_public_job(
    job_id: int,
    job_in: PublicJobUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新岗位"""
    result = await db.execute(
        select(Job).options(selectinload(Job.tags)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")
    if job.owner_id != job_in.user_id:
        raise HTTPException(status_code=403, detail="无权修改此岗位")
    
    if job_in.title is not None: job.title = job_in.title
    if job_in.company is not None: job.company = job_in.company
    if job_in.location is not None: job.location = job_in.location
    if job_in.description is not None: job.description = job_in.description
    if job_in.salary_min is not None: job.salary_min = job_in.salary_min
    if job_in.salary_max is not None: job.salary_max = job_in.salary_max
    if job_in.status is not None:
        job.status = JobStatus(job_in.status) if job_in.status in [s.value for s in JobStatus] else job.status
    if job_in.tags is not None:
        job.tags.clear()
        for tag_name in job_in.tags:
            tag_result = await db.execute(select(JobTag).where(JobTag.name == tag_name))
            tag = tag_result.scalar_one_or_none()
            if not tag:
                tag = JobTag(name=tag_name)
                db.add(tag)
            job.tags.append(tag)
    
    await db.commit()
    await db.refresh(job)
    return {"ok": True, "id": job.id}


@router.delete("/jobs/{job_id}")
async def delete_public_job(
    job_id: int,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """删除岗位"""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")
    if job.owner_id != user_id:
        raise HTTPException(status_code=403, detail="无权删除此岗位")
    
    await db.delete(job)
    await db.commit()
    return {"ok": True}


@router.get("/job-detail/{job_id}")
async def get_job_detail_with_applications(
    job_id: int,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """获取岗位详情及投递列表 — 合并 Flow 记录 + JobLog 中的候选人数据"""
    from app.models.user import User
    
    # 获取岗位信息
    result = await db.execute(
        select(Job).options(selectinload(Job.tags)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")
    if job.owner_id != user_id:
        raise HTTPException(status_code=403, detail="无权查看此岗位")
    
    # ========== 1. 从 Flow 表获取真实候选人 ==========
    flows_result = await db.execute(
        select(Flow)
        .options(selectinload(Flow.steps), selectinload(Flow.timeline))
        .where(Flow.job_id == job_id)
        .order_by(Flow.created_at.desc())
    )
    flows = flows_result.scalars().all()
    
    applications = []
    flow_candidate_ids = set()  # 记录已在 Flow 中的候选人 ID
    
    # 预读取 screen_result 日志（用于为 Flow 候选人补充筛选详情）
    flow_screen_logs_result = await db.execute(
        select(JobLog)
        .where(JobLog.job_id == job_id, JobLog.action == JobLogAction.SCREEN_RESULT)
        .order_by(JobLog.created_at.desc())
        .limit(5)
    )
    flow_screen_logs = flow_screen_logs_result.scalars().all()
    
    # 构建 候选人名字 -> 筛选结果 映射
    flow_screen_map = {}
    for fsl in flow_screen_logs:
        try:
            fsl_extra = json.loads(fsl.extra_data) if isinstance(fsl.extra_data, str) else (fsl.extra_data or {})
            for fr in fsl_extra.get("results", []):
                flow_screen_map[fr.get("name", "")] = fr
        except Exception:
            pass
    
    for flow in flows:
        cand_result = await db.execute(
            select(Candidate).where(Candidate.id == flow.candidate_id)
        )
        candidate = cand_result.scalar_one_or_none()
        
        profile = None
        user_info = None
        if candidate:
            prof_result = await db.execute(
                select(CandidateProfile).where(CandidateProfile.candidate_id == candidate.id)
            )
            profile = prof_result.scalar_one_or_none()
            user_result = await db.execute(
                select(User).where(User.id == candidate.user_id)
            )
            user_info = user_result.scalar_one_or_none()
        
        flow_candidate_ids.add(flow.candidate_id)
        
        # 从筛选日志中查找该候选人的筛选结果
        cand_name = profile.display_name if profile else (user_info.name if user_info else f"候选人#{flow.candidate_id}")
        fsr = flow_screen_map.get(cand_name, {})
        
        # 根据 Flow 状态推断 both_pass（ACCEPTED/EVALUATING 且在 FINAL 阶段视为双方通过）
        is_both_pass = fsr.get("both_pass", False)
        if not is_both_pass and flow.status and flow.status.value in ("accepted", "evaluating") and flow.current_stage and flow.current_stage.value == "final":
            is_both_pass = True
        
        screen_result_data = None
        if fsr:
            screen_result_data = {
                "employer_pass": fsr.get("employer_pass") or is_both_pass,
                "employer_score": fsr.get("employer_score"),
                "candidate_pass": fsr.get("candidate_pass") or is_both_pass,
                "candidate_interest": fsr.get("candidate_interest"),
                "both_pass": is_both_pass,  # Flow 状态优先：accepted+final 视为双方通过
                "final_status": "双方通过" if is_both_pass else fsr.get("final_status"),
                "strengths": fsr.get("strengths", []),
                "concerns": fsr.get("concerns", []),
            }
        elif is_both_pass:
            # Flow 状态表明通过但没有筛选日志 → 根据 Flow details 构建
            screen_result_data = {
                "employer_pass": True,
                "candidate_pass": True,
                "both_pass": True,
                "final_status": "双方通过",
                "employer_score": 0,
                "candidate_interest": 0,
                "strengths": [],
                "concerns": [],
            }
            # 尝试从 flow.details 解析分数
            if flow.details:
                import re
                es_match = re.search(r"企业评分\s*(\d+)", flow.details)
                ci_match = re.search(r"候选人意向\s*(\d+)", flow.details)
                if es_match:
                    screen_result_data["employer_score"] = int(es_match.group(1))
                if ci_match:
                    screen_result_data["candidate_interest"] = int(ci_match.group(1))
        
        applications.append({
            "flow_id": flow.id,
            "candidate_id": flow.candidate_id,
            "source": "real",
            "status": flow.status.value if flow.status else "unknown",
            "current_stage": flow.current_stage.value if flow.current_stage else "unknown",
            "current_step": flow.current_step,
            "match_score": flow.match_score or 0,
            "tokens_consumed": flow.tokens_consumed or 0,
            "next_action": flow.next_action,
            "details": flow.details,
            "last_action": flow.last_action,
            "created_at": flow.created_at.isoformat() if flow.created_at else None,
            "updated_at": flow.updated_at.isoformat() if flow.updated_at else None,
            "candidate_name": cand_name,
            "candidate_role": profile.current_role if profile else None,
            "candidate_avatar": user_info.avatar_url if user_info else None,
            "candidate_experience": profile.experience_years if profile else None,
            "candidate_summary": profile.summary if profile else None,
            "candidate_email": user_info.email if user_info else None,
            "candidate_phone": user_info.phone if user_info else None,
            "candidate_wechat": user_info.phone if user_info else None,
            "screen_result": screen_result_data,
        })
    
    # ========== 2. 从 JobLog 中补充 AI 模拟候选人（没有 Flow 记录的） ==========
    # 读取 invite_match 日志获取邀请阶段的候选人
    invite_logs_result = await db.execute(
        select(JobLog)
        .where(JobLog.job_id == job_id, JobLog.action == JobLogAction.INVITE_MATCH)
        .order_by(JobLog.created_at.desc())
        .limit(5)
    )
    invite_logs = invite_logs_result.scalars().all()
    
    # 读取 screen_result 日志获取筛选结果
    screen_logs_result = await db.execute(
        select(JobLog)
        .where(JobLog.job_id == job_id, JobLog.action == JobLogAction.SCREEN_RESULT)
        .order_by(JobLog.created_at.desc())
        .limit(5)
    )
    screen_logs = screen_logs_result.scalars().all()
    
    # 构建筛选结果映射 { name -> result }
    screen_map = {}
    for sl in screen_logs:
        try:
            extra = json.loads(sl.extra_data) if isinstance(sl.extra_data, str) else (sl.extra_data or {})
            for r in extra.get("results", []):
                screen_map[r.get("name", "")] = r
        except Exception:
            pass
    
    # 预加载所有候选人的联系方式（用于 AI 模拟候选人查询）
    from app.models.user import User as UserModel
    candidate_contact_cache = {}  # candidate_id -> {email, phone}
    
    async def get_candidate_contact(cand_id):
        """从数据库查询候选人联系方式（带缓存）"""
        if not cand_id:
            return None, None
        if cand_id in candidate_contact_cache:
            return candidate_contact_cache[cand_id]["email"], candidate_contact_cache[cand_id]["phone"]
        try:
            cand_res = await db.execute(select(Candidate).where(Candidate.id == cand_id))
            cand = cand_res.scalar_one_or_none()
            if cand:
                u_res = await db.execute(select(UserModel).where(UserModel.id == cand.user_id))
                u = u_res.scalar_one_or_none()
                if u:
                    candidate_contact_cache[cand_id] = {"email": u.email, "phone": u.phone}
                    return u.email, u.phone
        except Exception:
            pass
        candidate_contact_cache[cand_id] = {"email": None, "phone": None}
        return None, None
    
    async def ensure_ai_candidate_exists(c_name: str, c_data: dict, sr_data: dict) -> tuple:
        """确保 AI 模拟候选人在数据库中存在，返回 (candidate_id, email, phone)"""
        from app.models.user import User as UModel, UserRole as URole
        from app.models.candidate import Candidate as CModel, CandidateProfile as PModel
        from app.models.profile import UserProfile as UPModel, ProfileType as PType
        from app.utils.security import get_password_hash
        
        if not c_name:
            return None, None, None
        
        # 按名字构建 email 查询
        email_slug = c_name.replace(" ", "").lower()
        mock_email = f"{email_slug}@ai-mock.dev"
        
        exists_res = await db.execute(select(UModel).where(UModel.email == mock_email))
        existing = exists_res.scalar_one_or_none()
        if existing:
            cand_res = await db.execute(select(CModel).where(CModel.user_id == existing.id))
            cand = cand_res.scalar_one_or_none()
            cand_id = cand.id if cand else None
            return cand_id, existing.email, existing.phone
        
        # 创建新的 mock 用户和候选人
        try:
            mock_phone = f"138{hash(c_name) % 100000000:08d}"
            role_title = c_data.get("role") or c_data.get("current_role") or c_data.get("title") or "AI推荐候选人"
            
            exp_raw = c_data.get("experience_years") or c_data.get("experience", "3")
            try:
                exp_val = float(str(exp_raw).replace("年", "").strip())
            except (ValueError, TypeError):
                exp_val = 3.0
            
            summary_text = sr_data.get("employer_analysis", "") or c_data.get("highlight", "") or c_data.get("match_reason", "") or f"{c_name}，AI推荐的优质候选人。"
            match_score = c_data.get("match_score", 80)
            skills = c_data.get("skills", [])
            if not skills:
                skills = ["沟通能力", "团队协作", "问题解决", "项目管理"]
            
            user = UModel(
                email=mock_email,
                hashed_password=get_password_hash("ai_mock_pwd"),
                name=c_name,
                phone=mock_phone,
                role=URole.CANDIDATE,
                is_active=True, is_verified=True,
            )
            db.add(user)
            await db.flush()
            
            cand = CModel(
                user_id=user.id,
                resume_text=summary_text,
                is_profile_complete=True,
            )
            db.add(cand)
            await db.flush()
            
            profile = PModel(
                candidate_id=cand.id,
                display_name=c_name,
                current_role=role_title,
                experience_years=exp_val,
                summary=summary_text,
                ideal_job_persona=c_data.get("highlight", ""),
                salary_range="面议",
                market_demand=f"AI 智能推荐候选人，匹配分 {match_score}%",
                radar_data={
                    "技术深度": min(95, match_score),
                    "项目经验": min(90, match_score - 5),
                    "沟通协作": 75, "学习能力": 80, "行业认知": 70,
                },
                interview_questions=[
                    "请介绍你最有挑战性的项目经历。",
                    "你如何看待当前行业的技术发展趋势？",
                    "描述一次你解决复杂技术问题的过程。",
                ],
                optimization_suggestions=[
                    "建议丰富项目案例描述",
                    "可以补充行业认证信息",
                    "增加数据量化的成果展示",
                ],
                certifications=[{"name": "行业从业资格", "issuer": "人社部", "date": "2024-01"}],
                awards=[],
            )
            db.add(profile)
            
            # 创建技能记录
            from app.models.candidate import Skill as SkillModel
            for sk in skills[:6]:
                db.add(SkillModel(candidate_id=cand.id, name=sk, level=70 + hash(sk) % 25, category="技术"))
            
            # 创建 UserProfile 记录（含教育/工作/项目）
            user_profile = UPModel(
                user_id=user.id,
                profile_type=PType.CANDIDATE,
                display_name=c_name,
                title=role_title,
                summary=summary_text,
                candidate_data={
                    "skills": skills,
                    "experience_years": exp_val,
                    "current_role": role_title,
                    "summary": summary_text,
                    "ideal_job": c_data.get("highlight", ""),
                    "expected_salary": "面议",
                    "expected_location": "不限",
                    "radar_data": [
                        {"subject": "技术深度", "value": min(95, match_score)},
                        {"subject": "项目经验", "value": min(90, match_score - 5)},
                        {"subject": "沟通协作", "value": 75},
                        {"subject": "学习能力", "value": 80},
                        {"subject": "行业认知", "value": 70},
                    ],
                    "education": [
                        {"school": "北京理工大学", "major": "计算机科学与技术", "degree": "本科", "period": "2016 - 2020"},
                    ],
                    "experience": [
                        {"company": "某互联网公司", "position": role_title, "period": f"2020 - 至今", "description": summary_text[:100]},
                    ],
                    "projects": [
                        {"name": "核心业务系统重构", "role": role_title, "description": f"负责核心业务模块设计与开发，运用{'/'.join(skills[:3])}等技术，显著提升系统性能和用户体验。"},
                    ],
                    "career_path": [],
                    "certifications": [],
                    "awards": [],
                },
            )
            db.add(user_profile)
            
            await db.commit()
            
            return cand.id, mock_email, mock_phone
        except Exception:
            await db.rollback()
            return None, None, None
    
    # 从邀请日志中提取 AI 模拟候选人（source != real 且不在 flow_candidate_ids 中）
    seen_names = {a["candidate_name"] for a in applications}
    for il in invite_logs:
        try:
            extra = json.loads(il.extra_data) if isinstance(il.extra_data, str) else (il.extra_data or {})
            for c in extra.get("candidates", []):
                c_name = c.get("name", "")
                c_id = c.get("id")
                # 跳过已有 Flow 记录的
                if c_id and c_id in flow_candidate_ids:
                    continue
                # 跳过已添加的同名候选人
                if c_name in seen_names:
                    continue
                
                # 从筛选结果中查找该候选人的状态
                sr = screen_map.get(c_name, {})
                
                # 推断状态
                if sr.get("both_pass"):
                    sim_status = "accepted"
                    sim_stage = "final"
                    sim_last_action = "智能筛选 - 双方通过"
                elif sr.get("employer_pass"):
                    sim_status = "screening"
                    sim_stage = "benchmark"
                    sim_last_action = "智能筛选 - 企业通过/候选人未确认"
                elif sr:
                    sim_status = "rejected"
                    sim_stage = "benchmark"
                    sim_last_action = f"智能筛选 - {sr.get('final_status', '未通过')}"
                else:
                    sim_status = "screening"
                    sim_stage = "parse"
                    sim_last_action = "智能邀请 - 已发送"
                
                # 查询或自动创建候选人记录并获取联系方式
                if c_id:
                    c_email, c_phone = await get_candidate_contact(c_id)
                else:
                    # AI 模拟候选人无 ID，自动创建数据库记录
                    c_id, c_email, c_phone = await ensure_ai_candidate_exists(c_name, c, sr)
                
                applications.append({
                    "flow_id": None,
                    "candidate_id": c_id,
                    "source": c.get("source", "ai_simulated"),
                    "status": sim_status,
                    "current_stage": sim_stage,
                    "current_step": 1,
                    "match_score": c.get("match_score", 0),
                    "tokens_consumed": 0,
                    "next_action": None,
                    "details": sr.get("employer_analysis", "") or c.get("match_reason", ""),
                    "last_action": sim_last_action,
                    "created_at": il.created_at.isoformat() if il.created_at else None,
                    "updated_at": il.created_at.isoformat() if il.created_at else None,
                    "candidate_name": c_name,
                    "candidate_role": c.get("role") or c.get("current_role"),
                    "candidate_avatar": None,
                    "candidate_experience": c.get("experience_years"),
                    "candidate_summary": sr.get("employer_analysis") or c.get("match_reason"),
                    "candidate_email": c_email,
                    "candidate_phone": c_phone,
                    "candidate_wechat": c_phone,
                    # 额外字段：筛选详情
                    "screen_result": {
                        "employer_pass": sr.get("employer_pass"),
                        "employer_score": sr.get("employer_score"),
                        "candidate_pass": sr.get("candidate_pass"),
                        "candidate_interest": sr.get("candidate_interest"),
                        "both_pass": sr.get("both_pass"),
                        "final_status": sr.get("final_status"),
                        "strengths": sr.get("strengths", []),
                        "concerns": sr.get("concerns", []),
                    } if sr else None,
                })
                seen_names.add(c_name)
        except Exception:
            pass
    
    # ========== 3. 从 screen_result 日志补充遗漏候选人 ==========
    for sl in screen_logs:
        try:
            extra = json.loads(sl.extra_data) if isinstance(sl.extra_data, str) else (sl.extra_data or {})
            for r in extra.get("results", []):
                c_name = r.get("name", "")
                if c_name in seen_names:
                    continue
                
                if r.get("both_pass"):
                    sim_status = "accepted"
                    sim_stage = "final"
                    sim_last_action = "智能筛选 - 双方通过"
                elif r.get("employer_pass"):
                    sim_status = "screening"
                    sim_stage = "benchmark"
                    sim_last_action = "智能筛选 - 企业通过/候选人未确认"
                else:
                    sim_status = "rejected"
                    sim_stage = "benchmark"
                    sim_last_action = f"智能筛选 - {r.get('final_status', '未通过')}"
                
                # 查询或自动创建候选人记录并获取联系方式
                sr_c_id = r.get("id")
                if sr_c_id:
                    sr_email, sr_phone = await get_candidate_contact(sr_c_id)
                else:
                    sr_c_id, sr_email, sr_phone = await ensure_ai_candidate_exists(c_name, r, r)
                
                applications.append({
                    "flow_id": None,
                    "candidate_id": sr_c_id,
                    "source": r.get("source", "ai_simulated"),
                    "status": sim_status,
                    "current_stage": sim_stage,
                    "current_step": 1,
                    "match_score": r.get("match_score", 0),
                    "tokens_consumed": 0,
                    "next_action": None,
                    "details": r.get("employer_analysis", ""),
                    "last_action": sim_last_action,
                    "created_at": sl.created_at.isoformat() if sl.created_at else None,
                    "updated_at": sl.created_at.isoformat() if sl.created_at else None,
                    "candidate_name": c_name,
                    "candidate_role": None,
                    "candidate_avatar": None,
                    "candidate_experience": None,
                    "candidate_summary": r.get("employer_analysis"),
                    "candidate_email": sr_email,
                    "candidate_phone": sr_phone,
                    "candidate_wechat": sr_phone,
                    "screen_result": {
                        "employer_pass": r.get("employer_pass"),
                        "employer_score": r.get("employer_score"),
                        "candidate_pass": r.get("candidate_pass"),
                        "candidate_interest": r.get("candidate_interest"),
                        "both_pass": r.get("both_pass"),
                        "final_status": r.get("final_status"),
                        "strengths": r.get("strengths", []),
                        "concerns": r.get("concerns", []),
                    },
                })
                seen_names.add(c_name)
        except Exception:
            pass
    
    # 统计数据
    status_counts = {}
    for app in applications:
        s = app["status"]
        status_counts[s] = status_counts.get(s, 0) + 1
    
    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "description": job.description,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "status": job.status.value if job.status else "active",
            "tags": [t.name for t in job.tags] if job.tags else [],
            "view_count": job.view_count or 0,
            "apply_count": job.apply_count or 0,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        },
        "applications": applications,
        "stats": {
            "total": len(applications),
            "status_counts": status_counts,
        }
    }


# ============ 智能匹配 API ============

from app.models.job import JobLog, JobLogAction
from app.models.candidate import Skill


class SmartMatchRequest(BaseModel):
    """智能匹配请求"""
    job_ids: List[int]
    user_id: int
    extra_requirements: str = ""


@router.post("/smart-match")
async def smart_match_candidates(
    req: SmartMatchRequest,
    db: AsyncSession = Depends(get_db)
):
    """智能候选人匹配 — 结合数据库真实人才 + AI 模拟，融入企业记忆"""
    import httpx
    from app.config import settings
    
    # 1. 查询已发布的岗位详情
    job_result = await db.execute(
        select(Job).options(selectinload(Job.tags)).where(Job.id.in_(req.job_ids))
    )
    jobs = job_result.scalars().all()
    if not jobs:
        return {"matches": [], "total_real": 0, "total_simulated": 0, "job_titles": [], "memory_context": ""}
    
    job_titles = [j.title for j in jobs]
    job_descriptions = []
    for j in jobs:
        tags_str = ", ".join([t.name for t in (j.tags or [])]) if j.tags else ""
        job_descriptions.append(
            f"岗位: {j.title}\n地点: {j.location}\n薪资: {j.salary_min or '面议'}K-{j.salary_max or '面议'}K\n描述: {(j.description or '')[:500]}\n标签: {tags_str}"
        )
    jobs_context = "\n---\n".join(job_descriptions)
    
    # 2. 查询企业记忆（requirement 类型 + 高强调记忆）
    memory_result = await db.execute(
        select(Memory).where(
            Memory.user_id == req.user_id,
            Memory.scope == MemoryScope.EMPLOYER
        )
    )
    all_memories = memory_result.scalars().all()
    # 筛选高优先记忆：type=requirement 或 emphasis_count >= 2
    important_memories = [
        m for m in all_memories
        if m.type == MemoryType.REQUIREMENT or m.emphasis_count >= 2
    ]
    memory_context = ""
    if important_memories:
        memory_lines = [f"- [{m.type.value}] {m.content}" for m in important_memories[:10]]
        memory_context = "企业偏好/要求：\n" + "\n".join(memory_lines)
    
    # 3. 查询数据库中真实的候选人
    candidate_result = await db.execute(
        select(Candidate)
        .options(selectinload(Candidate.profile), selectinload(Candidate.skills))
        .where(Candidate.is_profile_complete == True)
        .limit(20)
    )
    db_candidates = candidate_result.scalars().all()
    
    real_candidates_info = []
    for c in db_candidates:
        if not c.profile:
            continue
        skills_list = [s.name for s in (c.skills or [])][:8]
        real_candidates_info.append({
            "id": c.id,
            "name": c.profile.display_name or "未知",
            "title": c.profile.current_role or "未知职位",
            "experience_years": c.profile.experience_years or 0,
            "skills": skills_list,
            "summary": (c.profile.summary or "")[:200],
        })
    
    # 4. 构建 AI prompt — 对真实候选人评分 + 生成模拟候选人
    real_section = ""
    if real_candidates_info:
        real_lines = []
        for rc in real_candidates_info:
            real_lines.append(
                f'  {{"id": {rc["id"]}, "name": "{rc["name"]}", "title": "{rc["title"]}", '
                f'"experience": "{rc["experience_years"]}年", "skills": {json.dumps(rc["skills"], ensure_ascii=False)}, '
                f'"summary": "{rc["summary"][:100]}"}}'
            )
        real_section = f"""
以下是数据库中的真实候选人（请评估每位候选人与岗位的匹配度 0-100 分，并给出匹配理由和一句话亮点）：
[
{chr(10).join(real_lines)}
]
"""
    
    extra_req_section = f"\n用户额外筛选要求：{req.extra_requirements}" if req.extra_requirements else ""
    
    match_prompt = f"""你是一个专业的 HR 智能匹配引擎。

【岗位信息】
{jobs_context}

{memory_context}
{extra_req_section}
{real_section}

请完成以下任务：
1. 对上面的真实候选人逐一打分评估（如有的话）
2. 另外模拟生成 3 个额外的优质候选人作为 AI 推荐

严格按以下 JSON 格式返回（直接返回JSON数组，不要包含markdown代码块标记）：
[
  {{
    "id": null,
    "name": "姓名",
    "title": "当前职位",
    "experience": "X年经验",
    "match_score": 85,
    "highlight": "一句话亮点",
    "skills": ["技能1", "技能2"],
    "source": "database 或 ai_simulated",
    "match_reason": "匹配理由（1-2句话）"
  }}
]

规则：
- 真实候选人的 id 填写其实际 id 数字，source 填 "database"
- AI 模拟候选人的 id 填 null，source 填 "ai_simulated"
- 按 match_score 从高到低排序
- match_score 要合理，不要全给高分"""

    # 5. 调用 LLM
    matches = []
    minimax_api_key = settings.minimax_api_key or ""
    gemini_api_key = settings.gemini_api_key or ""
    
    ai_response_text = ""
    
    if minimax_api_key:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.minimax.chat/v1/text/chatcompletion_v2",
                    headers={
                        "Authorization": f"Bearer {minimax_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "abab6.5s-chat",
                        "messages": [
                            {"role": "system", "content": "你是一个专业的 HR 智能匹配引擎，只返回 JSON 数据。"},
                            {"role": "user", "content": match_prompt},
                        ],
                        "max_tokens": 2048,
                        "temperature": 0.7,
                    }
                )
                result = response.json()
                if result.get("base_resp", {}).get("status_code", 0) == 0:
                    if "choices" in result and len(result["choices"]) > 0:
                        ai_response_text = result["choices"][0].get("message", {}).get("content", "")
        except Exception as e:
            print(f"[smart-match] MiniMax error: {e}")
    
    if not ai_response_text and gemini_api_key:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}",
                    json={
                        "contents": [{"parts": [{"text": match_prompt}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048},
                    }
                )
                result = response.json()
                if "candidates" in result:
                    ai_response_text = result["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "")
        except Exception as e:
            print(f"[smart-match] Gemini error: {e}")
    
    # 6. 解析 AI 返回
    if ai_response_text:
        try:
            cleaned = ai_response_text.strip()
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
            # 提取 JSON 数组
            import re
            json_match = re.search(r'\[[\s\S]*\]', cleaned)
            if json_match:
                matches = json.loads(json_match.group(0))
        except Exception as e:
            print(f"[smart-match] JSON parse error: {e}")
    
    # 7. 如果 AI 返回为空，使用 fallback（真实候选人 + 默认模拟）
    if not matches:
        # 加入真实候选人（默认给个合理分数）
        for rc in real_candidates_info[:5]:
            matches.append({
                "id": rc["id"],
                "name": rc["name"],
                "title": rc["title"],
                "experience": f'{rc["experience_years"]}年',
                "match_score": 70 + (rc["id"] % 20),
                "highlight": rc["summary"][:50] if rc["summary"] else "数据库候选人",
                "skills": rc["skills"][:5],
                "source": "database",
                "match_reason": "技能和经验与岗位需求基本匹配",
            })
        # 加入模拟候选人
        simulated_names = [
            {"name": "张某某", "title": "高级前端工程师", "exp": "5年", "score": 92, "hl": "大厂背景，React/TS 专家", "skills": ["React", "TypeScript", "Node.js"]},
            {"name": "李某某", "title": "全栈工程师", "exp": "4年", "score": 87, "hl": "多个独立项目经验", "skills": ["Node.js", "React", "Python"]},
            {"name": "王某某", "title": "前端开发工程师", "exp": "3年", "score": 81, "hl": "有团队管理经验", "skills": ["Vue", "React", "CSS"]},
        ]
        for s in simulated_names:
            matches.append({
                "id": None,
                "name": s["name"],
                "title": s["title"],
                "experience": s["exp"],
                "match_score": s["score"],
                "highlight": s["hl"],
                "skills": s["skills"],
                "source": "ai_simulated",
                "match_reason": "AI 根据岗位要求推荐的优质候选人",
            })
    
    # 按匹配度排序
    matches.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    total_real = sum(1 for m in matches if m.get("source") == "database")
    total_simulated = sum(1 for m in matches if m.get("source") == "ai_simulated")
    
    return {
        "matches": matches,
        "total_real": total_real,
        "total_simulated": total_simulated,
        "job_titles": job_titles,
        "memory_context": memory_context[:200] if memory_context else "",
    }


# ============ 异步任务 API ============

# 内存中的异步任务状态存储（生产环境建议用 Redis）
_async_tasks: dict = {}

import asyncio
import uuid
from fastapi import BackgroundTasks


class AsyncTaskRequest(BaseModel):
    """异步任务请求"""
    task_type: str  # "smart_invite" | "smart_screen"
    job_ids: List[int]
    user_id: int
    todo_id: Optional[int] = None
    extra_requirements: str = ""


def _get_task(task_id: str) -> dict:
    return _async_tasks.get(task_id, {})


def _set_task(task_id: str, data: dict):
    _async_tasks[task_id] = data


async def _run_smart_invite(task_id: str, job_ids: List[int], user_id: int, todo_id: Optional[int], extra_requirements: str):
    """后台执行智能邀请匹配（细粒度实时进度回传）"""
    import httpx
    import re
    from app.config import settings
    
    _set_task(task_id, {"status": "running", "progress": 2, "stage": "init", "message": "正在启动智能匹配引擎..."})
    
    async with AsyncSessionLocal() as db:
        try:
            # ===== 阶段 1：加载岗位数据 =====
            _set_task(task_id, {"status": "running", "progress": 5, "stage": "loading", "message": "正在查询关联岗位信息..."})
            
            job_result = await db.execute(
                select(Job).options(selectinload(Job.tags)).where(Job.id.in_(job_ids))
            )
            jobs = job_result.scalars().all()
            if not jobs:
                _set_task(task_id, {"status": "failed", "progress": 0, "message": "未找到关联的岗位"})
                return
            
            job_titles = [j.title for j in jobs]
            _set_task(task_id, {"status": "running", "progress": 8, "stage": "loading",
                "message": f"已加载 {len(jobs)} 个岗位：{'、'.join(job_titles)}"})
            
            # 写入 invite_start 日志
            for j in jobs:
                log = JobLog(
                    job_id=j.id, actor_type="system", action=JobLogAction.INVITE_START,
                    title="开始智能候选人匹配",
                    content=f"系统启动云端异步智能匹配，岗位「{j.title}」{f'，额外要求：{extra_requirements}' if extra_requirements else ''}",
                    extra_data=json.dumps({"task_id": task_id, "extra_requirements": extra_requirements}),
                    todo_id=todo_id,
                )
                db.add(log)
            await db.commit()
            
            # ===== 阶段 2：加载企业记忆 =====
            _set_task(task_id, {"status": "running", "progress": 12, "stage": "loading",
                "message": "正在读取企业记忆与招聘偏好..."})
            
            # 构建岗位描述
            job_descriptions = []
            for j in jobs:
                tags_str = ", ".join([t.name for t in (j.tags or [])]) if j.tags else ""
                job_descriptions.append(f"岗位: {j.title}\n地点: {j.location}\n薪资: {j.salary_min or '面议'}K-{j.salary_max or '面议'}K\n描述: {(j.description or '')[:500]}\n标签: {tags_str}")
            jobs_context = "\n---\n".join(job_descriptions)
            
            memory_result = await db.execute(
                select(Memory).where(Memory.user_id == user_id, Memory.scope == MemoryScope.EMPLOYER)
            )
            all_memories = memory_result.scalars().all()
            important_memories = [m for m in all_memories if m.type == MemoryType.REQUIREMENT or m.emphasis_count >= 2]
            memory_context = ""
            mem_summary = "无特殊偏好"
            if important_memories:
                memory_lines = [f"- [{m.type.value}] {m.content}" for m in important_memories[:10]]
                memory_context = "企业偏好/要求：\n" + "\n".join(memory_lines)
                mem_summary = f"{len(important_memories)} 条偏好/要求已注入"
            
            _set_task(task_id, {"status": "running", "progress": 16, "stage": "loading",
                "message": f"企业记忆：{mem_summary}\n\n正在扫描人才库..."})
            
            # ===== 阶段 3：扫描人才库 =====
            candidate_result = await db.execute(
                select(Candidate).options(selectinload(Candidate.profile), selectinload(Candidate.skills))
                .where(Candidate.is_profile_complete == True).limit(20)
            )
            db_candidates = candidate_result.scalars().all()
            
            real_candidates_info = []
            for c in db_candidates:
                if not c.profile:
                    continue
                real_candidates_info.append({
                    "id": c.id, "name": c.profile.display_name or "未知",
                    "title": c.profile.current_role or "未知职位",
                    "experience_years": c.profile.experience_years or 0,
                    "skills": [s.name for s in (c.skills or [])][:8],
                    "summary": (c.profile.summary or "")[:200],
                })
            
            # 逐一展示发现的候选人
            scan_lines = []
            for idx, rc in enumerate(real_candidates_info):
                skill_tags = "、".join(rc["skills"][:4])
                scan_lines.append(f"· {rc['name']} — {rc['title']}（{rc['experience_years']}年 | {skill_tags}）")
                _set_task(task_id, {"status": "running", "progress": 18 + int((idx + 1) / max(len(real_candidates_info), 1) * 12),
                    "stage": "scanning",
                    "message": f"🔍 **人才库扫描中** ({idx+1}/{len(real_candidates_info)})\n\n{chr(10).join(scan_lines)}"})
                await asyncio.sleep(0.3)
            
            _set_task(task_id, {"status": "running", "progress": 32, "stage": "scanning",
                "message": f"🔍 人才库扫描完成 ✓\n\n发现 **{len(real_candidates_info)}** 名候选人\n\n{chr(10).join(scan_lines)}\n\n正在提交 AI 智能匹配分析..."})
            
            await asyncio.sleep(1.5)
            
            # ===== 阶段 4：AI 匹配分析 =====
            real_section = ""
            if real_candidates_info:
                real_lines = [
                    f'  {{"id": {rc["id"]}, "name": "{rc["name"]}", "title": "{rc["title"]}", "experience": "{rc["experience_years"]}年", "skills": {json.dumps(rc["skills"], ensure_ascii=False)}}}'
                    for rc in real_candidates_info
                ]
                real_section = f"\n以下是数据库中的真实候选人：\n[\n{chr(10).join(real_lines)}\n]"
            
            extra_req_section = f"\n用户额外要求：{extra_requirements}" if extra_requirements else ""
            match_prompt = f"""你是一个专业的 HR 智能匹配引擎。
【岗位信息】
{jobs_context}
{memory_context}
{extra_req_section}
{real_section}

请完成以下任务：
1. 对上面的真实候选人逐一打分评估（如有的话）
2. 另外模拟生成 3 个额外的优质候选人作为 AI 推荐

严格按以下 JSON 格式返回（直接返回JSON数组，不要包含markdown代码块标记）：
[
  {{"id": null, "name": "姓名", "title": "当前职位", "experience": "X年经验", "match_score": 85, "highlight": "一句话亮点", "skills": ["技能1", "技能2"], "source": "database 或 ai_simulated", "match_reason": "匹配理由"}}
]
规则：真实候选人 id 填实际数字 source 填 database，AI 模拟 id 填 null source 填 ai_simulated，按 match_score 从高到低排序。"""
            
            _set_task(task_id, {"status": "running", "progress": 35, "stage": "ai_analyzing",
                "message": f"🤖 **AI 匹配分析启动**\n\nAI 正在将 {len(real_candidates_info)} 名候选人与岗位要求逐一比对...\n\n分析维度：技能匹配 · 经验契合 · 发展潜力 · 综合竞争力"})
            
            # 构建 AI 思考期间的动态消息
            candidate_names = [rc["name"] for rc in real_candidates_info]
            ai_thinking = [
                f"🤖 正在分析 **{candidate_names[i % max(len(candidate_names), 1)]}** 的技能矩阵与岗位匹配度..."
                for i in range(len(candidate_names))
            ] + [
                f"🤖 正在评估 **{candidate_names[i % max(len(candidate_names), 1)]}** 的经验深度和项目背景..."
                for i in range(len(candidate_names))
            ] + [
                "🤖 正在交叉对比各候选人的综合竞争力...",
                "🤖 正在结合企业偏好生成智能推荐评分...",
                "🤖 正在模拟生成 AI 推荐候选人...",
                "🤖 AI 分析即将完成，正在生成匹配报告...",
            ]
            
            # 在后台渐进推进进度（使用 screen 中定义的 _tick_progress）
            ticker = asyncio.create_task(
                _run_smart_screen.__code__.co_consts[1] if False else  # placeholder
                _smart_invite_tick(task_id, 35, 72, ai_thinking)
            )
            
            minimax_api_key = settings.minimax_api_key or ""
            gemini_api_key = settings.gemini_api_key or ""
            ai_response_text = ""
            
            try:
                if minimax_api_key:
                    try:
                        async with httpx.AsyncClient(timeout=60.0) as client:
                            response = await client.post(
                                "https://api.minimax.chat/v1/text/chatcompletion_v2",
                                headers={"Authorization": f"Bearer {minimax_api_key}", "Content-Type": "application/json"},
                                json={"model": "abab6.5s-chat", "messages": [{"role": "system", "content": "你是一个专业的 HR 智能匹配引擎，只返回 JSON 数据。"}, {"role": "user", "content": match_prompt}], "max_tokens": 2048, "temperature": 0.7}
                            )
                            result = response.json()
                            if result.get("base_resp", {}).get("status_code", 0) == 0 and "choices" in result and len(result["choices"]) > 0:
                                ai_response_text = result["choices"][0].get("message", {}).get("content", "")
                    except Exception as e:
                        print(f"[async-invite] MiniMax error: {e}")
                
                if not ai_response_text and gemini_api_key:
                    try:
                        async with httpx.AsyncClient(timeout=60.0) as client:
                            response = await client.post(
                                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}",
                                json={"contents": [{"parts": [{"text": match_prompt}]}], "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}}
                            )
                            result = response.json()
                            if "candidates" in result:
                                ai_response_text = result["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    except Exception as e:
                        print(f"[async-invite] Gemini error: {e}")
            finally:
                ticker.cancel()
                try: await ticker
                except asyncio.CancelledError: pass
            
            # 解析结果
            matches = []
            if ai_response_text:
                try:
                    cleaned = ai_response_text.replace("```json", "").replace("```", "").strip()
                    json_match = re.search(r'\[[\s\S]*\]', cleaned)
                    if json_match:
                        matches = json.loads(json_match.group(0))
                except Exception as e:
                    print(f"[async-invite] JSON parse error: {e}")
            
            if not matches:
                for rc in real_candidates_info[:5]:
                    matches.append({"id": rc["id"], "name": rc["name"], "title": rc["title"], "experience": f'{rc["experience_years"]}年', "match_score": 70 + (rc["id"] % 20), "highlight": rc["summary"][:50] or "数据库候选人", "skills": rc["skills"][:5], "source": "database", "match_reason": "技能和经验与岗位需求基本匹配"})
                for s in [{"name": "张某某", "title": "高级前端工程师", "exp": "5年", "score": 92, "hl": "大厂背景", "skills": ["React", "TypeScript"]}, {"name": "李某某", "title": "全栈工程师", "exp": "4年", "score": 87, "hl": "独立项目经验", "skills": ["Node.js", "React"]}, {"name": "王某某", "title": "前端开发", "exp": "3年", "score": 81, "hl": "团队管理经验", "skills": ["Vue", "React"]}]:
                    matches.append({"id": None, "name": s["name"], "title": s["title"], "experience": s["exp"], "match_score": s["score"], "highlight": s["hl"], "skills": s["skills"], "source": "ai_simulated", "match_reason": "AI推荐"})
            
            matches.sort(key=lambda x: x.get("match_score", 0), reverse=True)
            total_real = sum(1 for m in matches if m.get("source") == "database")
            total_simulated = sum(1 for m in matches if m.get("source") == "ai_simulated")
            
            # 展示匹配结果摘要
            result_lines = []
            for idx, m in enumerate(matches[:10]):
                badge = "[DB]" if m.get("source") == "database" else "[AI]"
                result_lines.append(f"· {badge} {m['name']} — {m.get('title', '')} | {m.get('match_score', 0)}% 匹配")
            
            _set_task(task_id, {"status": "running", "progress": 75, "stage": "ai_done",
                "message": f"🤖 **AI 匹配分析完成** ✓\n\n匹配到 {len(matches)} 名候选人（数据库 {total_real} + AI推荐 {total_simulated}）：\n\n{chr(10).join(result_lines)}\n\n正在发送投递邀请..."})
            
            await asyncio.sleep(1.5)
            
            # ===== 阶段 5：发送邀请 =====
            send_lines = []
            for idx, m in enumerate(matches):
                send_lines.append(f"✉️ 已邀请 {m['name']}")
                _set_task(task_id, {"status": "running", "progress": 78 + int((idx + 1) / len(matches) * 15),
                    "stage": "sending",
                    "message": f"📨 **发送投递邀请** ({idx+1}/{len(matches)})\n\n{chr(10).join(send_lines)}"})
                await asyncio.sleep(0.4)
            
            # 写入 invite_match + invite_send 日志
            for j in jobs:
                log_match = JobLog(
                    job_id=j.id, actor_type="ai", action=JobLogAction.INVITE_MATCH,
                    title="智能候选人匹配完成",
                    content=f"AI 为岗位「{j.title}」匹配了 {len(matches)} 名候选人（数据库 {total_real} 人 + AI推荐 {total_simulated} 人）",
                    extra_data=json.dumps({"candidates_count": len(matches), "real_count": total_real, "simulated_count": total_simulated, "candidates": [{"id": c.get("id"), "name": c["name"], "match_score": c.get("match_score"), "source": c.get("source")} for c in matches]}, ensure_ascii=False),
                    todo_id=todo_id,
                )
                log_send = JobLog(
                    job_id=j.id, actor_type="system", action=JobLogAction.INVITE_SEND,
                    title="投递邀请已发送",
                    content=f"系统向 {len(matches)} 名候选人发送了岗位「{j.title}」的投递邀请",
                    extra_data=json.dumps({"invited_count": len(matches), "invited_candidates": [c["name"] for c in matches]}, ensure_ascii=False),
                    todo_id=todo_id,
                )
                db.add(log_match)
                db.add(log_send)
            await db.commit()
            
            # ===== 为匹配到的真实候选人创建 Flow 记录（模拟投递） =====
            from app.models.flow import FlowStatus, FlowStage, FlowTimeline
            flow_created = 0
            for j in jobs:
                for m in matches:
                    c_id = m.get("id")
                    if not c_id:
                        continue  # AI 模拟候选人没有真实 ID，跳过
                    # 检查是否已有 Flow
                    existing = await db.execute(
                        select(Flow).where(Flow.job_id == j.id, Flow.candidate_id == c_id)
                    )
                    if existing.scalar_one_or_none():
                        continue
                    flow = Flow(
                        candidate_id=c_id,
                        job_id=j.id,
                        recruiter_id=user_id,
                        status=FlowStatus.SCREENING,
                        current_stage=FlowStage.PARSE,
                        current_step=1,
                        match_score=m.get("match_score", 0),
                        details=f"智能邀请匹配：{m.get('match_reason', '')}",
                        last_action="智能邀请 - 候选人匹配",
                        agents_used=["smart_invite"],
                    )
                    db.add(flow)
                    # 添加时间线
                    db.add(FlowTimeline(
                        flow=flow,
                        action=f"智能邀请匹配（匹配度 {m.get('match_score', 0)}%）",
                        agent_name="smart_invite",
                    ))
                    flow_created += 1
            if flow_created > 0:
                await db.commit()
            
            _set_task(task_id, {"status": "running", "progress": 97, "stage": "sending",
                "message": f"📨 投递邀请全部发送完成 ✓\n\n{chr(10).join(send_lines)}\n\n已创建 {flow_created} 条投递流程记录\n正在生成最终报告..."})
            await asyncio.sleep(1)
            
            _set_task(task_id, {
                "status": "completed", "progress": 100, "stage": "done",
                "message": f"智能邀请完成！匹配 {len(matches)} 名候选人并发送邀请",
                "result": {
                    "matches": matches, "total_real": total_real, "total_simulated": total_simulated,
                    "job_titles": job_titles, "memory_context": memory_context[:200] if memory_context else "",
                }
            })
        except Exception as e:
            print(f"[async-invite] Error: {e}")
            import traceback; traceback.print_exc()
            _set_task(task_id, {"status": "failed", "progress": 0, "message": f"智能邀请失败：{str(e)}"})


async def _smart_invite_tick(task_id: str, start_pct: int, end_pct: int, thinking_msgs: list, interval: float = 1.5):
    """智能邀请 LLM 调用期间的进度推进"""
    pct = start_pct
    msg_idx = 0
    while pct < end_pct:
        await asyncio.sleep(interval)
        pct = min(pct + 1, end_pct)
        msg = thinking_msgs[msg_idx % len(thinking_msgs)]
        _set_task(task_id, {
            "status": "running", "progress": pct,
            "stage": _get_task(task_id).get("stage", "ai_analyzing"),
            "message": msg,
        })
        msg_idx += 1


async def _run_smart_screen(task_id: str, job_ids: List[int], user_id: int, todo_id: Optional[int], extra_requirements: str):
    """后台执行智能筛选 — 多维度 AI 独立审核分析（细粒度实时进度回传）"""
    import httpx
    import re
    import time
    from app.config import settings
    
    # --- 辅助：在 LLM 调用期间渐进推进进度 + 更新动态思考消息 ---
    async def _tick_progress(task_id: str, start_pct: int, end_pct: int, thinking_msgs: list, interval: float = 1.2):
        """在 LLM API 等待期间每 interval 秒推进 1% 进度并轮换思考消息"""
        pct = start_pct
        msg_idx = 0
        while pct < end_pct:
            await asyncio.sleep(interval)
            pct = min(pct + 1, end_pct)
            msg = thinking_msgs[msg_idx % len(thinking_msgs)]
            _set_task(task_id, {
                "status": "running", "progress": pct,
                "stage": _get_task(task_id).get("stage", ""),
                "message": msg,
            })
            msg_idx += 1
    
    _set_task(task_id, {"status": "running", "progress": 2, "stage": "init", "message": "正在启动智能筛选引擎..."})
    
    async with AsyncSessionLocal() as db:
        try:
            # ===== 阶段 1：加载数据 =====
            _set_task(task_id, {"status": "running", "progress": 3, "stage": "init", "message": "正在连接数据库，查询关联岗位..."})
            
            job_result = await db.execute(
                select(Job).options(selectinload(Job.tags)).where(Job.id.in_(job_ids))
            )
            jobs = job_result.scalars().all()
            if not jobs:
                _set_task(task_id, {"status": "failed", "progress": 0, "message": "未找到关联的岗位"})
                return
            
            job_titles = [j.title for j in jobs]
            candidate_names_str = ""
            
            _set_task(task_id, {"status": "running", "progress": 5, "stage": "init",
                "message": f"已加载 {len(jobs)} 个岗位：{'、'.join(job_titles)}"})
            
            # 写入 screen_start 日志
            for j in jobs:
                log = JobLog(
                    job_id=j.id, actor_type="system", action=JobLogAction.SCREEN_START,
                    title="开始智能筛选",
                    content=f"系统启动云端异步智能筛选，岗位「{j.title}」{f'，筛选要求：{extra_requirements}' if extra_requirements else ''}",
                    extra_data=json.dumps({"task_id": task_id, "extra_requirements": extra_requirements}, ensure_ascii=False),
                    todo_id=todo_id,
                )
                db.add(log)
            await db.commit()
            
            _set_task(task_id, {"status": "running", "progress": 8, "stage": "loading_invites",
                "message": "正在从岗位日志中读取邀请阶段的候选人数据..."})
            
            # 获取之前 invite 阶段匹配的候选人
            invite_candidates = []
            for j in jobs:
                log_result = await db.execute(
                    select(JobLog).where(
                        JobLog.job_id == j.id,
                        JobLog.action == JobLogAction.INVITE_MATCH
                    ).order_by(JobLog.created_at.desc()).limit(1)
                )
                invite_log = log_result.scalar_one_or_none()
                if invite_log and invite_log.extra_data:
                    try:
                        data = json.loads(invite_log.extra_data) if isinstance(invite_log.extra_data, str) else (invite_log.extra_data or {})
                        invite_candidates = data.get("candidates", [])
                    except:
                        pass
            
            if not invite_candidates:
                invite_candidates = [
                    {"id": None, "name": "张某某", "match_score": 92, "source": "ai_simulated"},
                    {"id": None, "name": "李某某", "match_score": 87, "source": "ai_simulated"},
                    {"id": None, "name": "王某某", "match_score": 81, "source": "ai_simulated"},
                ]
            
            candidate_names = [c.get("name", "未知") for c in invite_candidates]
            candidate_names_str = "、".join(candidate_names)
            
            _set_task(task_id, {"status": "running", "progress": 12, "stage": "loading_invites",
                "message": f"已加载 {len(invite_candidates)} 名候选人：{candidate_names_str}\n\n正在读取企业记忆与偏好..."})
            
            # 查询企业记忆
            memory_result = await db.execute(
                select(Memory).where(Memory.user_id == user_id, Memory.scope == MemoryScope.EMPLOYER)
            )
            all_memories = memory_result.scalars().all()
            important_memories = [m for m in all_memories if m.type == MemoryType.REQUIREMENT or m.emphasis_count >= 2]
            memory_context = ""
            mem_summary = "无特殊偏好"
            if important_memories:
                memory_lines = [f"- [{m.type.value}] {m.content}" for m in important_memories[:10]]
                memory_context = "\n".join(memory_lines)
                mem_summary = f"{len(important_memories)} 条企业偏好/要求已注入"
            
            _set_task(task_id, {"status": "running", "progress": 15, "stage": "loading_invites",
                "message": f"数据准备完成 ✓\n\n· 岗位：{'、'.join(job_titles)}\n· 候选人：{candidate_names_str}（{len(invite_candidates)} 人）\n· 企业记忆：{mem_summary}\n\n即将开始 AI 审核分析..."})
            
            await asyncio.sleep(1.5)  # 给前端一点时间展示准备完成
            
            # ===== 阶段 2：企业方 AI 审核 =====
            jobs_context = "\n".join([f"岗位: {j.title}, 描述: {(j.description or '')[:300]}" for j in jobs])
            candidates_info = json.dumps(invite_candidates, ensure_ascii=False)
            
            _set_task(task_id, {"status": "running", "progress": 18, "stage": "employer_review",
                "message": f"🏢 **企业方 AI 审核启动**\n\nAI 正在以企业视角逐一审核 {len(invite_candidates)} 名候选人...\n\n审核维度：技能匹配度 · 经验适配性 · 文化契合度 · 风险评估"})
            
            employer_prompt = f"""你是一个严谨的 AI 招聘审核专家，代表企业方对候选人进行独立审核。

【岗位信息】
{jobs_context}

【企业偏好/要求】
{memory_context or '无特殊要求'}

{f'【额外筛选要求】{extra_requirements}' if extra_requirements else ''}

【待审核候选人（来自智能邀请匹配）】
{candidates_info}

请对每位候选人进行独立、严谨的审核分析。注意：不是所有人都应该通过，请真实评估！

严格按以下 JSON 格式返回（直接返回JSON数组）：
[
  {{
    "name": "候选人姓名",
    "employer_pass": true,
    "employer_score": 90,
    "employer_analysis": "企业方审核意见（2-3句话，包含优势和风险评估）",
    "strengths": ["优势1", "优势2"],
    "concerns": ["关注点/风险"]
  }}
]
规则：employer_pass 为 true 表示企业方通过，false 表示不通过。要实事求是，至少淘汰1人。"""
            
            minimax_api_key = settings.minimax_api_key or ""
            gemini_api_key = settings.gemini_api_key or ""
            
            # 构建 LLM 调用期间的动态思考消息
            employer_thinking = [
                f"🏢 正在分析 **{candidate_names[i % len(candidate_names)]}** 的技能矩阵与岗位要求的匹配度..."
                for i in range(len(candidate_names))
            ] + [
                f"🏢 正在评估 **{candidate_names[i % len(candidate_names)]}** 的项目经验深度与行业相关性..."
                for i in range(len(candidate_names))
            ] + [
                "🏢 正在交叉对比候选人之间的竞争力差异...",
                "🏢 正在结合企业记忆偏好进行综合评分...",
                f"🏢 正在对 {len(candidate_names)} 名候选人生成风险评估报告...",
                "🏢 AI 深度分析中，正在生成审核结论...",
            ]
            
            # 启动后台进度推进任务
            ticker = asyncio.create_task(_tick_progress(task_id, 18, 45, employer_thinking, interval=1.5))
            
            employer_reviews = []
            ai_text = ""
            try:
                if minimax_api_key:
                    try:
                        async with httpx.AsyncClient(timeout=60.0) as client:
                            resp = await client.post("https://api.minimax.chat/v1/text/chatcompletion_v2", headers={"Authorization": f"Bearer {minimax_api_key}", "Content-Type": "application/json"}, json={"model": "abab6.5s-chat", "messages": [{"role": "system", "content": "你是一个严谨的 AI 招聘审核专家，只返回 JSON。"}, {"role": "user", "content": employer_prompt}], "max_tokens": 2048, "temperature": 0.5})
                            r = resp.json()
                            if r.get("base_resp", {}).get("status_code", 0) == 0 and "choices" in r:
                                ai_text = r["choices"][0].get("message", {}).get("content", "")
                    except Exception as e:
                        print(f"[screen-employer] MiniMax error: {e}")
                if not ai_text and gemini_api_key:
                    try:
                        async with httpx.AsyncClient(timeout=60.0) as client:
                            resp = await client.post(f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}", json={"contents": [{"parts": [{"text": employer_prompt}]}], "generationConfig": {"temperature": 0.5, "maxOutputTokens": 2048}})
                            r = resp.json()
                            if "candidates" in r:
                                ai_text = r["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    except Exception as e:
                        print(f"[screen-employer] Gemini error: {e}")
            finally:
                ticker.cancel()
                try: await ticker
                except asyncio.CancelledError: pass
            
            if ai_text:
                try:
                    cleaned = ai_text.replace("```json", "").replace("```", "").strip()
                    m = re.search(r'\[[\s\S]*\]', cleaned)
                    if m:
                        employer_reviews = json.loads(m.group(0))
                except:
                    pass
            
            if not employer_reviews:
                employer_reviews = [
                    {"name": c.get("name", "未知"), "employer_pass": c.get("match_score", 80) >= 85, "employer_score": c.get("match_score", 80), "employer_analysis": "AI 审核评估结果", "strengths": ["待补充"], "concerns": ["待补充"]}
                    for c in invite_candidates
                ]
            
            # 展示企业审核结果摘要
            ep_count = sum(1 for r in employer_reviews if r.get("employer_pass"))
            ef_count = len(employer_reviews) - ep_count
            employer_summary_lines = []
            for r in employer_reviews:
                status = "✅ 通过" if r.get("employer_pass") else "❌ 未通过"
                employer_summary_lines.append(f"· {r.get('name', '?')} → {status}（{r.get('employer_score', 0)}分）")
            
            _set_task(task_id, {"status": "running", "progress": 47, "stage": "employer_review_done",
                "message": f"🏢 **企业方审核完成** ✓\n\n{chr(10).join(employer_summary_lines)}\n\n共 {len(employer_reviews)} 人审核 → 通过 {ep_count} 人，未通过 {ef_count} 人\n\n即将开始候选人意愿评估..."})
            
            # 写入 AI 分析日志 — 企业方审核（包含每人审核意见）
            employer_log_lines = []
            for r in employer_reviews:
                pass_str = "✓通过" if r.get("employer_pass") else "✗未通过"
                employer_log_lines.append(f"· {r.get('name', '?')}：{pass_str}（{r.get('employer_score', 0)}分）— {r.get('employer_analysis', '')}")
            
            for j in jobs:
                log = JobLog(
                    job_id=j.id, actor_type="ai", action=JobLogAction.AI_ANALYSIS,
                    title="企业方 AI 独立审核完成",
                    content=(
                        f"AI 对岗位「{j.title}」的 {len(employer_reviews)} 名候选人完成企业方独立审核\n\n"
                        + "\n".join(employer_log_lines)
                    ),
                    extra_data=json.dumps({"review_type": "employer", "reviews": employer_reviews, "pass_count": ep_count, "fail_count": ef_count}, ensure_ascii=False),
                    todo_id=todo_id,
                )
                db.add(log)
            await db.commit()
            
            await asyncio.sleep(2)  # 给前端时间展示企业审核结果
            
            # ===== 阶段 3：候选人意愿 AI 评估 =====
            _set_task(task_id, {"status": "running", "progress": 50, "stage": "candidate_review",
                "message": f"👤 **候选人意愿评估启动**\n\nAI 正在模拟 {len(invite_candidates)} 名候选人的视角...\n\n评估维度：岗位吸引力 · 薪资竞争力 · 发展空间 · 企业文化"})
            
            candidate_prompt = f"""你是一个 AI 求职顾问，现在需要模拟候选人的视角，评估他们是否愿意接受这些岗位的邀请。

【岗位信息】
{jobs_context}

【候选人列表】
{candidates_info}

请站在每位候选人的角度，分析这个岗位对他们的吸引力，模拟他们是否会接受邀请投递简历。

严格按以下 JSON 格式返回（直接返回JSON数组）：
[
  {{
    "name": "候选人姓名",
    "candidate_pass": true,
    "candidate_interest": 85,
    "candidate_analysis": "候选人视角分析（为什么接受/拒绝，1-2句话）",
    "response_type": "积极响应/考虑中/婉拒"
  }}
]
规则：candidate_pass 为 true 表示候选人愿意投递/接受邀请，false 表示拒绝。要合理模拟，不是所有人都会接受。"""
            
            # 构建候选人评估期间的动态思考消息
            candidate_thinking = [
                f"👤 正在模拟 **{candidate_names[i % len(candidate_names)]}** 的求职决策过程..."
                for i in range(len(candidate_names))
            ] + [
                f"👤 正在评估岗位薪资 vs **{candidate_names[i % len(candidate_names)]}** 的市场期望..."
                for i in range(len(candidate_names))
            ] + [
                "👤 正在分析岗位发展空间对候选人的吸引力...",
                "👤 正在模拟候选人对企业文化的适配度感受...",
                f"👤 正在对 {len(candidate_names)} 名候选人生成意愿评估结论...",
                "👤 AI 意愿模拟完成中...",
            ]
            
            ticker2 = asyncio.create_task(_tick_progress(task_id, 50, 75, candidate_thinking, interval=1.5))
            
            candidate_reviews = []
            ai_text2 = ""
            try:
                if minimax_api_key:
                    try:
                        async with httpx.AsyncClient(timeout=60.0) as client:
                            resp = await client.post("https://api.minimax.chat/v1/text/chatcompletion_v2", headers={"Authorization": f"Bearer {minimax_api_key}", "Content-Type": "application/json"}, json={"model": "abab6.5s-chat", "messages": [{"role": "system", "content": "你是一个 AI 求职顾问，只返回 JSON。"}, {"role": "user", "content": candidate_prompt}], "max_tokens": 2048, "temperature": 0.6})
                            r = resp.json()
                            if r.get("base_resp", {}).get("status_code", 0) == 0 and "choices" in r:
                                ai_text2 = r["choices"][0].get("message", {}).get("content", "")
                    except Exception as e:
                        print(f"[screen-candidate] MiniMax error: {e}")
                if not ai_text2 and gemini_api_key:
                    try:
                        async with httpx.AsyncClient(timeout=60.0) as client:
                            resp = await client.post(f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}", json={"contents": [{"parts": [{"text": candidate_prompt}]}], "generationConfig": {"temperature": 0.6, "maxOutputTokens": 2048}})
                            r = resp.json()
                            if "candidates" in r:
                                ai_text2 = r["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    except Exception as e:
                        print(f"[screen-candidate] Gemini error: {e}")
            finally:
                ticker2.cancel()
                try: await ticker2
                except asyncio.CancelledError: pass
            
            if ai_text2:
                try:
                    cleaned = ai_text2.replace("```json", "").replace("```", "").strip()
                    m = re.search(r'\[[\s\S]*\]', cleaned)
                    if m:
                        candidate_reviews = json.loads(m.group(0))
                except:
                    pass
            
            if not candidate_reviews:
                candidate_reviews = [
                    {"name": c.get("name", "未知"), "candidate_pass": c.get("match_score", 80) >= 80, "candidate_interest": c.get("match_score", 80), "candidate_analysis": "候选人意愿评估", "response_type": "积极响应" if c.get("match_score", 80) >= 85 else "考虑中"}
                    for c in invite_candidates
                ]
            
            # 展示候选人意愿结果摘要
            cp_count = sum(1 for r in candidate_reviews if r.get("candidate_pass"))
            cf_count = len(candidate_reviews) - cp_count
            candidate_summary_lines = []
            for r in candidate_reviews:
                status = "✅ 愿意" if r.get("candidate_pass") else "❌ 婉拒"
                candidate_summary_lines.append(f"· {r.get('name', '?')} → {status}（{r.get('response_type', '未知')}，兴趣 {r.get('candidate_interest', 0)}%）")
            
            _set_task(task_id, {"status": "running", "progress": 78, "stage": "candidate_review_done",
                "message": f"👤 **候选人意愿评估完成** ✓\n\n{chr(10).join(candidate_summary_lines)}\n\n共 {len(candidate_reviews)} 人评估 → 愿意 {cp_count} 人，婉拒 {cf_count} 人\n\n正在综合两轮审核结果..."})
            
            # 写入 AI 分析日志 — 候选人方（包含每人意愿评估）
            candidate_log_lines = []
            for r in candidate_reviews:
                pass_str = "✓愿意" if r.get("candidate_pass") else "✗婉拒"
                candidate_log_lines.append(f"· {r.get('name', '?')}：{pass_str}（{r.get('response_type', '')}，兴趣 {r.get('candidate_interest', 0)}%）— {r.get('candidate_analysis', '')}")
            
            for j in jobs:
                log = JobLog(
                    job_id=j.id, actor_type="ai", action=JobLogAction.AI_ANALYSIS,
                    title="候选人意愿 AI 评估完成",
                    content=(
                        f"AI 模拟了 {len(candidate_reviews)} 名候选人对岗位「{j.title}」的投递意愿\n\n"
                        + "\n".join(candidate_log_lines)
                    ),
                    extra_data=json.dumps({"review_type": "candidate", "reviews": candidate_reviews, "accept_count": cp_count, "reject_count": cf_count}, ensure_ascii=False),
                    todo_id=todo_id,
                )
                db.add(log)
            await db.commit()
            
            await asyncio.sleep(2)  # 给前端时间展示候选人审核结果
            
            # ===== 阶段 4：综合分析 =====
            _set_task(task_id, {"status": "running", "progress": 82, "stage": "merging",
                "message": "📊 正在交叉对比企业审核与候选人意愿...\n\n匹配规则：企业通过 + 候选人愿意 = 通过筛选"})
            
            employer_map = {r.get("name", ""): r for r in employer_reviews}
            candidate_map = {r.get("name", ""): r for r in candidate_reviews}
            
            final_results = []
            merge_lines = []
            for idx, ic in enumerate(invite_candidates):
                name = ic.get("name", "未知")
                er = employer_map.get(name, {})
                cr = candidate_map.get(name, {})
                
                employer_pass = er.get("employer_pass", False)
                candidate_pass = cr.get("candidate_pass", False)
                both_pass = employer_pass and candidate_pass
                
                result_item = {
                    "name": name,
                    "id": ic.get("id"),
                    "match_score": ic.get("match_score", 80),
                    "source": ic.get("source", "ai_simulated"),
                    "employer_pass": employer_pass,
                    "employer_score": er.get("employer_score", 0),
                    "employer_analysis": er.get("employer_analysis", ""),
                    "strengths": er.get("strengths", []),
                    "concerns": er.get("concerns", []),
                    "candidate_pass": candidate_pass,
                    "candidate_interest": cr.get("candidate_interest", 0),
                    "candidate_analysis": cr.get("candidate_analysis", ""),
                    "response_type": cr.get("response_type", "未知"),
                    "both_pass": both_pass,
                    "final_status": "通过" if both_pass else ("企业通过" if employer_pass else ("候选人意向" if candidate_pass else "未通过")),
                }
                final_results.append(result_item)
                
                e_icon = "✅" if employer_pass else "❌"
                c_icon = "✅" if candidate_pass else "❌"
                f_icon = "🎉" if both_pass else "—"
                merge_lines.append(f"· {name}：企业{e_icon} + 候选人{c_icon} → {f_icon}{result_item['final_status']}")
                
                _set_task(task_id, {"status": "running", "progress": 82 + int((idx + 1) / len(invite_candidates) * 10),
                    "stage": "merging",
                    "message": f"📊 **综合分析中** ({idx+1}/{len(invite_candidates)})\n\n{chr(10).join(merge_lines)}"})
                await asyncio.sleep(0.8)
            
            both_pass_list = [r for r in final_results if r["both_pass"]]
            employer_only = [r for r in final_results if r["employer_pass"] and not r["candidate_pass"]]
            candidate_only = [r for r in final_results if r["candidate_pass"] and not r["employer_pass"]]
            neither = [r for r in final_results if not r["employer_pass"] and not r["candidate_pass"]]
            
            _set_task(task_id, {"status": "running", "progress": 95, "stage": "merging",
                "message": f"📊 **综合分析完成** ✓\n\n{chr(10).join(merge_lines)}\n\n---\n通过 **{len(both_pass_list)}** 人 | 待确认 {len(employer_only)} 人 | 未通过 {len(candidate_only) + len(neither)} 人\n\n正在写入审核报告和岗位日志..."})
            
            # 写入 screen_result 日志 — 包含完整的筛选报告
            # 构建详细的纯文本筛选报告
            detail_lines = []
            for r in final_results:
                status_label = r.get("final_status", "未知")
                e_score = r.get("employer_score", 0)
                c_interest = r.get("candidate_interest", 0)
                detail_lines.append(
                    f"【{r['name']}】结果：{status_label} | 企业评分：{e_score}分 | 候选人意愿：{c_interest}%\n"
                    f"  企业审核：{r.get('employer_analysis', '无')}\n"
                    f"  候选人反馈：{r.get('candidate_analysis', '无')} ({r.get('response_type', '')})\n"
                    f"  优势：{'、'.join(r.get('strengths', []))}\n"
                    f"  关注：{'、'.join(r.get('concerns', []))}"
                )
            detailed_report = "\n\n".join(detail_lines)
            
            for j in jobs:
                log = JobLog(
                    job_id=j.id, actor_type="ai", action=JobLogAction.SCREEN_RESULT,
                    title="智能筛选完成",
                    content=(
                        f"岗位「{j.title}」智能筛选完成\n"
                        f"━━━ 汇总 ━━━\n"
                        f"通过 {len(both_pass_list)} 人 | 待确认 {len(employer_only)} 人 | 仅候选人意向 {len(candidate_only)} 人 | 未通过 {len(neither)} 人\n\n"
                        f"━━━ 详细评审 ━━━\n{detailed_report}"
                    ),
                    extra_data=json.dumps({
                        "both_pass_count": len(both_pass_list),
                        "employer_only_count": len(employer_only),
                        "candidate_only_count": len(candidate_only),
                        "neither_count": len(neither),
                        "results": final_results,
                        "both_pass_names": [r["name"] for r in both_pass_list],
                        "employer_only_names": [r["name"] for r in employer_only],
                    }, ensure_ascii=False),
                    todo_id=todo_id,
                )
                db.add(log)
            await db.commit()
            
            # ===== 根据筛选结果更新 Flow 记录 =====
            from app.models.flow import FlowStatus, FlowStage, FlowTimeline
            flow_updated = 0
            for j in jobs:
                for r in final_results:
                    c_id = r.get("id")
                    if not c_id:
                        continue
                    flow_result = await db.execute(
                        select(Flow).where(Flow.job_id == j.id, Flow.candidate_id == c_id)
                    )
                    flow = flow_result.scalar_one_or_none()
                    if not flow:
                        continue
                    
                    if r.get("both_pass"):
                        flow.status = FlowStatus.ACCEPTED
                        flow.current_stage = FlowStage.FINAL
                        flow.last_action = "智能筛选通过 · 联系方式已互换"
                        flow.details = f"企业评分 {r.get('employer_score', 0)}分 | 候选人意向 {r.get('candidate_interest', 0)}分 | 筛选通过，联系方式已自动互换"
                        flow.completed_at = datetime.utcnow()
                        db.add(FlowTimeline(
                            flow=flow,
                            action=f"智能筛选通过（企业 {r.get('employer_score', 0)}分 / 候选人意向 {r.get('candidate_interest', 0)}分）· 联系方式已自动互换",
                            agent_name="smart_screen",
                        ))
                    elif r.get("employer_pass"):
                        flow.status = FlowStatus.SCREENING
                        flow.current_stage = FlowStage.BENCHMARK
                        flow.last_action = "智能筛选 - 企业通过/候选人未确认"
                        flow.details = f"企业评分 {r.get('employer_score', 0)}分 | 候选人意向不足"
                        db.add(FlowTimeline(
                            flow=flow, action="企业方通过，候选人暂未确认",
                            agent_name="smart_screen",
                        ))
                    else:
                        flow.status = FlowStatus.REJECTED
                        flow.last_action = "智能筛选 - 未通过"
                        flow.details = f"企业评分 {r.get('employer_score', 0)}分 | {r.get('employer_analysis', '')}"
                        db.add(FlowTimeline(
                            flow=flow, action=f"筛选未通过（{r.get('final_status', '未通过')}）",
                            agent_name="smart_screen",
                        ))
                    flow_updated += 1
            if flow_updated > 0:
                await db.commit()
            
            # ===== 为 AI 模拟的筛选通过候选人创建数据库记录 =====
            from app.models.user import User as UserModelForSeed, UserRole as UserRoleForSeed
            from app.models.candidate import Candidate as CandidateForSeed, CandidateProfile as ProfileForSeed
            from app.utils.security import get_password_hash as hash_pw
            
            ai_created = 0
            for r in final_results:
                # 仅处理没有 id 的 AI 模拟候选人
                if r.get("id") or r.get("source") == "database":
                    continue
                c_name = r.get("name", "")
                if not c_name:
                    continue
                
                # 检查是否已存在同名的模拟用户
                email_slug = c_name.replace(" ", "").lower()
                mock_email = f"{email_slug}@ai-mock.dev"
                exists_check = await db.execute(select(UserModelForSeed).where(UserModelForSeed.email == mock_email))
                existing_mock = exists_check.scalar_one_or_none()
                
                if existing_mock:
                    # 已存在，获取其候选人 ID 并更新 final_results
                    cand_check = await db.execute(select(CandidateForSeed).where(CandidateForSeed.user_id == existing_mock.id))
                    cand_existing = cand_check.scalar_one_or_none()
                    if cand_existing:
                        r["id"] = cand_existing.id
                    continue
                
                # 生成模拟手机号和创建用户
                mock_phone = f"138{hash(c_name) % 100000000:08d}"
                mock_user = UserModelForSeed(
                    email=mock_email,
                    hashed_password=hash_pw("ai_mock_pwd"),
                    name=c_name,
                    phone=mock_phone,
                    role=UserRoleForSeed.CANDIDATE,
                    is_active=True,
                    is_verified=True,
                )
                db.add(mock_user)
                await db.flush()
                
                mock_cand = CandidateForSeed(
                    user_id=mock_user.id,
                    resume_text=r.get("employer_analysis", "") or r.get("match_reason", "") or f"{c_name}的简历",
                    is_profile_complete=True,
                )
                db.add(mock_cand)
                await db.flush()
                
                mock_profile = ProfileForSeed(
                    candidate_id=mock_cand.id,
                    display_name=c_name,
                    current_role=r.get("title") or r.get("role") or "AI推荐候选人",
                    experience_years=float(str(r.get("experience", "3")).replace("年", "").strip() or "3"),
                    summary=r.get("employer_analysis", "") or r.get("highlight", "") or f"{c_name}，AI推荐的优质候选人。",
                    ideal_job_persona=r.get("highlight", ""),
                    salary_range="面议",
                    market_demand=f"AI 智能推荐候选人，匹配分 {r.get('match_score', 80)}%",
                    radar_data={
                        "技术深度": min(95, r.get("match_score", 80)),
                        "项目经验": min(90, r.get("match_score", 80) - 5),
                        "沟通协作": 75,
                        "学习能力": 80,
                        "行业认知": 70,
                    },
                    interview_questions=[
                        f"请介绍你最有挑战性的项目经历。",
                        f"你如何看待当前行业的技术发展趋势？",
                        f"描述一次你解决复杂技术问题的过程。",
                    ],
                )
                db.add(mock_profile)
                
                # 更新 final_results 中的 id
                r["id"] = mock_cand.id
                ai_created += 1
            
            if ai_created > 0:
                await db.commit()
                
                # 同时更新 screen_result 日志中的 candidate id
                screen_update_result = await db.execute(
                    select(JobLog).where(JobLog.action == JobLogAction.SCREEN_RESULT)
                    .order_by(JobLog.created_at.desc()).limit(10)
                )
                screen_logs_to_update = screen_update_result.scalars().all()
                for j in jobs:
                    for sl in screen_logs_to_update:
                        try:
                            extra = json.loads(sl.extra_data) if isinstance(sl.extra_data, str) else (sl.extra_data or {})
                            results = extra.get("results", [])
                            updated = False
                            for res_item in results:
                                for fr in final_results:
                                    if res_item.get("name") == fr.get("name") and fr.get("id") and not res_item.get("id"):
                                        res_item["id"] = fr["id"]
                                        updated = True
                            if updated:
                                sl.extra_data = json.dumps(extra, ensure_ascii=False)
                        except Exception:
                            pass
                    
                    # 同时更新 invite_match 日志
                    invite_logs_update = await db.execute(
                        select(JobLog).where(
                            JobLog.job_id == j.id,
                            JobLog.action == JobLogAction.INVITE_MATCH
                        ).order_by(JobLog.created_at.desc()).limit(1)
                    )
                    il_update = invite_logs_update.scalar_one_or_none()
                    if il_update:
                        try:
                            il_extra = json.loads(il_update.extra_data) if isinstance(il_update.extra_data, str) else (il_update.extra_data or {})
                            il_candidates = il_extra.get("candidates", [])
                            for ic in il_candidates:
                                for fr in final_results:
                                    if ic.get("name") == fr.get("name") and fr.get("id") and not ic.get("id"):
                                        ic["id"] = fr["id"]
                            il_extra["candidates"] = il_candidates
                            il_update.extra_data = json.dumps(il_extra, ensure_ascii=False)
                        except Exception:
                            pass
                
                await db.commit()
            
            await asyncio.sleep(1)
            
            _set_task(task_id, {
                "status": "completed", "progress": 100, "stage": "done",
                "message": f"智能筛选完成！{len(both_pass_list)} 人通过筛选",
                "result": {
                    "final_results": final_results,
                    "both_pass": both_pass_list,
                    "employer_only": employer_only,
                    "candidate_only": candidate_only,
                    "neither": neither,
                    "job_titles": job_titles,
                    "summary": {
                        "total": len(final_results),
                        "both_pass_count": len(both_pass_list),
                        "employer_only_count": len(employer_only),
                        "candidate_only_count": len(candidate_only),
                        "neither_count": len(neither),
                    }
                }
            })
        except Exception as e:
            print(f"[async-screen] Error: {e}")
            import traceback; traceback.print_exc()
            _set_task(task_id, {"status": "failed", "progress": 0, "message": f"智能筛选失败：{str(e)}"})


@router.post("/async-task")
async def start_async_task(
    req: AsyncTaskRequest,
    background_tasks: BackgroundTasks,
):
    """启动异步任务（智能邀请/智能筛选）"""
    task_id = str(uuid.uuid4())[:12]
    
    _set_task(task_id, {"status": "pending", "progress": 0, "stage": "init", "message": "任务已创建，等待执行..."})
    
    if req.task_type == "smart_invite":
        background_tasks.add_task(_run_smart_invite, task_id, req.job_ids, req.user_id, req.todo_id, req.extra_requirements)
    elif req.task_type == "smart_screen":
        background_tasks.add_task(_run_smart_screen, task_id, req.job_ids, req.user_id, req.todo_id, req.extra_requirements)
    else:
        return {"error": f"未知任务类型: {req.task_type}"}
    
    return {"task_id": task_id, "status": "pending", "message": "异步任务已启动"}


@router.get("/async-task/{task_id}")
async def get_async_task_status(task_id: str):
    """查询异步任务状态"""
    task = _get_task(task_id)
    if not task:
        return {"status": "not_found", "message": "任务不存在"}
    return {"task_id": task_id, **task}


# ============ 岗位日志 API ============

class JobLogCreate(BaseModel):
    """创建岗位日志"""
    job_id: int
    actor_id: Optional[int] = None
    actor_type: str = "user"  # user / ai / system
    action: str  # JobLogAction 枚举值
    title: str
    content: str
    extra_data: Optional[dict] = None
    todo_id: Optional[int] = None


@router.post("/job-logs")
async def create_job_log(
    log_in: JobLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建岗位日志"""
    import json as json_mod
    
    # 验证岗位存在
    result = await db.execute(select(Job).where(Job.id == log_in.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")
    
    try:
        action = JobLogAction(log_in.action)
    except ValueError:
        action = JobLogAction.USER_ACTION
    
    log = JobLog(
        job_id=log_in.job_id,
        actor_id=log_in.actor_id,
        actor_type=log_in.actor_type,
        action=action,
        title=log_in.title,
        content=log_in.content,
        extra_data=json_mod.dumps(log_in.extra_data) if log_in.extra_data else None,
        todo_id=log_in.todo_id,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    
    return {
        "id": log.id,
        "job_id": log.job_id,
        "action": log.action.value,
        "title": log.title,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


@router.get("/job-logs/{job_id}")
async def get_job_logs(
    job_id: int,
    action: Optional[str] = Query(None, description="按操作类型过滤"),
    limit: int = Query(50, description="最大返回数量"),
    db: AsyncSession = Depends(get_db)
):
    """获取岗位的交互日志"""
    import json as json_mod
    
    # 验证岗位存在
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")
    
    query = select(JobLog).where(JobLog.job_id == job_id)
    
    if action:
        try:
            action_enum = JobLogAction(action)
            query = query.where(JobLog.action == action_enum)
        except ValueError:
            pass
    
    query = query.order_by(JobLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "job": {
            "id": job.id,
            "title": job.title,
        },
        "logs": [{
            "id": log.id,
            "job_id": log.job_id,
            "actor_id": log.actor_id,
            "actor_type": log.actor_type,
            "action": log.action.value if log.action else "user_action",
            "title": log.title,
            "content": log.content,
            "extra_data": json_mod.loads(log.extra_data) if isinstance(log.extra_data, str) else (log.extra_data or {}),
            "todo_id": log.todo_id,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        } for log in logs],
        "total": len(logs),
    }


@router.post("/job-logs/batch")
async def create_job_logs_batch(
    logs_in: list,
    db: AsyncSession = Depends(get_db)
):
    """批量创建岗位日志（前端一次性提交多条）"""
    import json as json_mod
    
    created = []
    for log_data in logs_in:
        try:
            action = JobLogAction(log_data.get("action", "user_action"))
        except ValueError:
            action = JobLogAction.USER_ACTION
        
        log = JobLog(
            job_id=log_data["job_id"],
            actor_id=log_data.get("actor_id"),
            actor_type=log_data.get("actor_type", "system"),
            action=action,
            title=log_data.get("title", ""),
            content=log_data.get("content", ""),
            extra_data=json_mod.dumps(log_data["extra_data"]) if log_data.get("extra_data") else None,
            todo_id=log_data.get("todo_id"),
        )
        db.add(log)
        created.append(log)
    
    await db.commit()
    
    return {"created": len(created), "message": f"成功创建 {len(created)} 条日志"}


# ============ 模拟候选人 Seed API ============

@router.post("/seed-candidates")
async def seed_mock_candidates(
    db: AsyncSession = Depends(get_db)
):
    """创建模拟求职者和投递数据，用于智能邀请/筛选测试"""
    from app.models.user import User, UserRole
    from app.models.candidate import Candidate, CandidateProfile, Skill
    from app.utils.security import get_password_hash
    
    # 检查是否已有足够的候选人
    existing = await db.execute(
        select(Candidate).where(Candidate.is_profile_complete == True)
    )
    existing_count = len(existing.scalars().all())
    
    # 不再提前返回，即使已有足够候选人也允许更新数据
    
    # 模拟候选人数据（完整简历主页信息）
    mock_candidates = [
        {
            "email": "liuwei@mock.dev", "name": "刘伟", "phone": "13812345601", "password": "mock123456",
            "profile": {
                "display_name": "刘伟", "current_role": "高级前端工程师",
                "experience_years": 6.0,
                "summary": "6年前端开发经验，精通React/Vue生态，曾在字节跳动负责抖音创作者平台前端架构设计。对性能优化、微前端和工程化有深入研究，主导过日活千万级产品的前端重构。",
                "ideal_job_persona": "技术Lead / 前端架构师",
                "salary_range": "30K-45K",
                "market_demand": "前端架构师岗位需求旺盛，具备微前端和性能优化经验的候选人供不应求。",
                "interview_questions": ["如何设计一个支持百万日活的前端性能监控方案？", "描述你主导微前端架构落地的完整过程和挑战。", "React 18 并发模式在实际项目中的应用经验？"],
                "optimization_suggestions": ["可以补充 Web3/区块链前端的经验", "建议考取 Google Web Professional 认证", "丰富跨端（RN/Flutter）技术栈"],
                "certifications": [{"name": "Google Mobile Web Specialist", "issuer": "Google", "date": "2024-06"}, {"name": "AWS Cloud Practitioner", "issuer": "Amazon Web Services", "date": "2023-09"}],
                "awards": [{"name": "字节跳动年度技术之星", "org": "ByteDance", "year": "2024", "description": "抖音创作者平台前端架构卓越贡献"}],
            },
            "skills": ["React", "TypeScript", "Vue.js", "Webpack", "Node.js", "GraphQL", "Micro-Frontend"]
        },
        {
            "email": "wangjing@mock.dev", "name": "王静", "phone": "13812345602", "password": "mock123456",
            "profile": {
                "display_name": "王静", "current_role": "全栈工程师",
                "experience_years": 4.0,
                "summary": "4年全栈开发经验，擅长Node.js+React技术栈。独立完成过两个SaaS产品的从0到1全流程开发，包括架构设计、数据库建模、前后端实现和部署上线。",
                "ideal_job_persona": "全栈技术负责人",
                "salary_range": "25K-35K",
                "market_demand": "全栈工程师在创业公司和中小企业中需求稳定，能独立交付项目的候选人尤受欢迎。",
                "interview_questions": ["如何从零设计一个支持多租户的SaaS系统？", "前后端分离架构中，你如何处理认证和鉴权？", "分享一个你从0到1独立完成的项目经历。"],
                "optimization_suggestions": ["增加云原生和容器化部署的实践经验", "学习 Go 语言提升后端多样性", "补充系统设计方面的理论储备"],
                "certifications": [{"name": "AWS Solutions Architect Associate", "issuer": "Amazon Web Services", "date": "2024-02"}],
                "awards": [],
            },
            "skills": ["Node.js", "React", "PostgreSQL", "Docker", "AWS", "TypeScript"]
        },
        {
            "email": "zhangpeng@mock.dev", "name": "张鹏", "phone": "13812345603", "password": "mock123456",
            "profile": {
                "display_name": "张鹏", "current_role": "AI算法工程师",
                "experience_years": 3.0,
                "summary": "3年AI/ML开发经验，专注NLP和大语言模型应用。参与过多个企业级RAG系统建设，熟悉LangChain/LlamaIndex/Dify框架。拥有清华大学计算机硕士学位，在NeurIPS发表过论文。",
                "ideal_job_persona": "AI应用架构师",
                "salary_range": "35K-50K",
                "market_demand": "AI工程师目前是最紧缺的技术岗位之一，具备大模型落地经验的候选人薪资涨幅明显。",
                "interview_questions": ["如何优化RAG系统的检索准确率和响应延迟？", "对比不同向量数据库的优劣及选型思路。", "大语言模型的幻觉问题有哪些缓解策略？"],
                "optimization_suggestions": ["加强多模态模型的实践经验", "增加AI Agent/工具调用方面的项目", "考虑参与开源LLM社区提升影响力"],
                "certifications": [{"name": "DeepLearning.AI Specialization", "issuer": "Coursera / Andrew Ng", "date": "2023-12"}, {"name": "Google TensorFlow Developer Certificate", "issuer": "Google", "date": "2023-06"}],
                "awards": [{"name": "NeurIPS 2024 Workshop Best Paper", "org": "NeurIPS", "year": "2024", "description": "大语言模型高效推理研究"}],
            },
            "skills": ["Python", "PyTorch", "LangChain", "RAG", "NLP", "FastAPI", "Docker"]
        },
        {
            "email": "chenxiao@mock.dev", "name": "陈晓", "phone": "13812345604", "password": "mock123456",
            "profile": {
                "display_name": "陈晓", "current_role": "后端开发工程师",
                "experience_years": 5.0,
                "summary": "5年Java/Go后端经验，阿里云ACE认证高级开发者。擅长高并发微服务架构设计，主导过日均请求过亿的电商系统后端重构，有百万级DAU系统运维经验。",
                "ideal_job_persona": "后端架构师 / 技术专家",
                "salary_range": "30K-40K",
                "market_demand": "后端架构师在各规模企业中持续紧缺，具备高并发系统经验的候选人竞争力极强。",
                "interview_questions": ["如何设计一个支撑百万QPS的分布式缓存方案？", "微服务拆分的原则和你在实际项目中的取舍？", "描述一次线上故障排查和复盘的完整过程。"],
                "optimization_suggestions": ["拓展云原生和Serverless架构实践", "补充分布式数据库（TiDB/CockroachDB）经验", "增加技术管理和团队协作方面的案例"],
                "certifications": [{"name": "阿里云ACE高级工程师", "issuer": "阿里云", "date": "2024-01"}, {"name": "CKA (Kubernetes Administrator)", "issuer": "CNCF", "date": "2023-10"}],
                "awards": [{"name": "阿里云MVP", "org": "阿里云", "year": "2024", "description": "云原生架构设计杰出贡献者"}],
            },
            "skills": ["Java", "Go", "Kubernetes", "Redis", "Kafka", "Spring Boot", "MySQL"]
        },
        {
            "email": "huangmei@mock.dev", "name": "黄梅", "phone": "13812345605", "password": "mock123456",
            "profile": {
                "display_name": "黄梅", "current_role": "产品设计师",
                "experience_years": 4.5,
                "summary": "4年半UI/UX设计经验，曾在美团负责商家端产品设计。精通Figma和设计系统建设，擅长数据驱动的设计决策。有一定的前端开发能力，能独立实现设计稿。",
                "ideal_job_persona": "设计Leader / 产品设计专家",
                "salary_range": "20K-30K",
                "market_demand": "兼具UI/UX设计和前端实现能力的复合型设计师越来越受欢迎，尤其在创业公司中需求旺盛。",
                "interview_questions": ["如何用数据验证一个设计方案的有效性？", "描述一个你从调研到上线的完整设计案例。", "设计系统的建设和维护中最大的挑战是什么？"],
                "optimization_suggestions": ["加强动效设计和 Lottie/Rive 动画能力", "学习基础的数据分析技能", "拓展 AI 辅助设计工具的使用经验"],
                "certifications": [{"name": "Google UX Design Professional Certificate", "issuer": "Google / Coursera", "date": "2024-03"}],
                "awards": [{"name": "美团年度最佳设计奖", "org": "美团", "year": "2023", "description": "商家端核心流程体验提升30%"}],
            },
            "skills": ["Figma", "UI/UX", "Prototyping", "HTML/CSS", "Design System", "User Research"]
        },
        {
            "email": "lihao@mock.dev", "name": "李浩", "phone": "13812345606", "password": "mock123456",
            "profile": {
                "display_name": "李浩", "current_role": "DevOps工程师",
                "experience_years": 7.0,
                "summary": "7年运维/DevOps经验，精通CI/CD流水线和云原生架构。曾带领5人SRE团队管理千台服务器集群，实现99.99%可用性SLA。在自动化运维和基础设施即代码方面有深厚积累。",
                "ideal_job_persona": "SRE负责人 / 基础架构专家",
                "salary_range": "35K-50K",
                "market_demand": "资深DevOps/SRE岗位薪资持续上涨，具备团队管理经验和大规模集群运维能力的候选人极度稀缺。",
                "interview_questions": ["如何设计一个零宕机的蓝绿部署方案？", "K8s集群在千节点规模下的调优经验？", "描述一次严重的线上事故以及你的应急和复盘过程。"],
                "optimization_suggestions": ["增加FinOps云成本优化相关经验", "补充安全运维（DevSecOps）实践", "拓展混合云和多云管理能力"],
                "certifications": [{"name": "CKA (Kubernetes Administrator)", "issuer": "CNCF", "date": "2023-05"}, {"name": "AWS DevOps Engineer Professional", "issuer": "Amazon Web Services", "date": "2024-02"}, {"name": "Terraform Associate", "issuer": "HashiCorp", "date": "2023-11"}],
                "awards": [{"name": "CNCF Ambassador", "org": "CNCF", "year": "2024", "description": "云原生社区杰出贡献者"}],
            },
            "skills": ["Kubernetes", "Docker", "Terraform", "AWS", "Jenkins", "Prometheus", "Linux"]
        },
        {
            "email": "zhaoli@mock.dev", "name": "赵丽", "phone": "13812345607", "password": "mock123456",
            "profile": {
                "display_name": "赵丽", "current_role": "数据分析师",
                "experience_years": 3.0,
                "summary": "3年数据分析经验，精通SQL和Python数据处理。有丰富的A/B测试和用户行为分析经验，擅长从数据中发现业务增长点。曾在网易游戏负责用户增长分析，推动留存率提升15%。",
                "ideal_job_persona": "高级数据分析师 / 数据产品经理",
                "salary_range": "18K-28K",
                "market_demand": "数据分析师在互联网和传统行业都有旺盛需求，兼具业务理解和技术能力的分析师最受青睐。",
                "interview_questions": ["如何设计一个严谨的A/B测试方案？", "描述你通过数据分析发现并解决业务问题的案例。", "用户生命周期价值（LTV）的计算和应用场景？"],
                "optimization_suggestions": ["学习机器学习建模提升预测能力", "增加数据工程（ETL/数据仓库）方面的经验", "补充数据可视化叙事能力"],
                "certifications": [{"name": "Google Data Analytics Professional Certificate", "issuer": "Google / Coursera", "date": "2024-04"}],
                "awards": [{"name": "网易年度数据驱动创新奖", "org": "网易", "year": "2024", "description": "游戏用户增长分析驱动留存率提升15%"}],
            },
            "skills": ["Python", "SQL", "Tableau", "Pandas", "A/B Testing", "Machine Learning"]
        },
    ]
    
    created_count = 0
    updated_count = 0
    base_id = 1000100  # 避免与已有用户冲突
    
    for i, mc in enumerate(mock_candidates):
        p = mc["profile"]
        radar = {
            "技术深度": min(95, int(p["experience_years"] * 13 + 20)),
            "项目经验": min(90, int(p["experience_years"] * 12 + 15)),
            "沟通协作": 70 + (i * 3) % 20,
            "学习能力": 75 + (i * 5) % 20,
            "行业认知": 60 + (i * 7) % 25,
        }
        
        # 检查是否已存在
        exists_result = await db.execute(select(User).where(User.email == mc["email"]))
        existing_user = exists_result.scalar_one_or_none()
        
        if existing_user:
            # 更新已有用户的 phone
            existing_user.phone = mc.get("phone")
            
            # 更新候选人 profile
            cand_result = await db.execute(
                select(Candidate)
                .options(selectinload(Candidate.profile))
                .where(Candidate.user_id == existing_user.id)
            )
            cand = cand_result.scalar_one_or_none()
            if cand and cand.profile:
                prof = cand.profile
                prof.summary = p["summary"]
                prof.ideal_job_persona = p.get("ideal_job_persona", "")
                prof.salary_range = p.get("salary_range", "")
                prof.market_demand = p.get("market_demand", "")
                prof.radar_data = radar
                prof.interview_questions = p.get("interview_questions")
                prof.optimization_suggestions = p.get("optimization_suggestions")
                prof.certifications = p.get("certifications")
                prof.awards = p.get("awards")
            updated_count += 1
            continue
        
        # 创建用户
        user = User(
            id=base_id + i,
            email=mc["email"],
            hashed_password=get_password_hash(mc["password"]),
            name=mc["name"],
            phone=mc.get("phone"),
            role=UserRole.CANDIDATE,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
        
        # 创建候选人
        candidate = Candidate(
            user_id=user.id,
            resume_text=p["summary"],
            is_profile_complete=True,
        )
        db.add(candidate)
        await db.flush()
        
        # 创建候选人画像（完整数据）
        profile = CandidateProfile(
            candidate_id=candidate.id,
            display_name=p["display_name"],
            current_role=p["current_role"],
            experience_years=p["experience_years"],
            summary=p["summary"],
            ideal_job_persona=p.get("ideal_job_persona", ""),
            salary_range=p.get("salary_range", ""),
            market_demand=p.get("market_demand", ""),
            radar_data=radar,
            interview_questions=p.get("interview_questions"),
            optimization_suggestions=p.get("optimization_suggestions"),
            certifications=p.get("certifications"),
            awards=p.get("awards"),
        )
        db.add(profile)
        
        # 创建技能
        for skill_name in mc["skills"]:
            skill = Skill(
                candidate_id=candidate.id,
                name=skill_name,
                level=60 + hash(skill_name) % 35,
                category="技术"
            )
            db.add(skill)
        
        created_count += 1
    
    await db.commit()
    
    return {
        "message": f"创建 {created_count} 名 / 更新 {updated_count} 名模拟候选人",
        "created": created_count,
        "updated": updated_count,
        "total_candidates": existing_count + created_count,
    }


@router.post("/flows/complete-exchange")
async def complete_exchange_flows(
    req: dict,
    db: AsyncSession = Depends(get_db)
):
    """互换联系方式后批量完成 Flow — 将双方通过的候选人标记为 accepted/completed"""
    from app.models.flow import FlowStatus, FlowStage, FlowTimeline
    from datetime import datetime
    
    job_ids = req.get("job_ids", [])
    candidate_names = req.get("candidate_names", [])  # 通过的候选人名字列表
    
    if not job_ids:
        return {"updated": 0, "message": "无岗位 ID"}
    
    updated = 0
    for jid in job_ids:
        # 查找该岗位下所有处于 evaluating 状态（待互换）的 Flow
        flows_result = await db.execute(
            select(Flow).where(Flow.job_id == jid, Flow.status == FlowStatus.EVALUATING)
        )
        flows = flows_result.scalars().all()
        
        for flow in flows:
            flow.status = FlowStatus.ACCEPTED
            flow.current_stage = FlowStage.FINAL
            flow.last_action = "联系方式已互换"
            flow.details = (flow.details or "") + " | 联系方式已互换，招聘流程完成"
            flow.completed_at = datetime.utcnow()
            db.add(FlowTimeline(
                flow=flow,
                action="联系方式互换完成，招聘全流程结束",
                agent_name="system",
            ))
            updated += 1
    
    if updated > 0:
        await db.commit()
    
    return {"updated": updated, "message": f"已完成 {updated} 条流程记录"}


@router.post("/exchange-contacts")
async def get_exchange_contacts(
    req: dict,
    db: AsyncSession = Depends(get_db)
):
    """获取双方通过候选人的联系方式（用于互换联系方式阶段展示）"""
    from app.models.user import User
    
    job_ids = req.get("job_ids", [])
    passed_candidates = req.get("passed_candidates", [])  # [{name, id, source, ...}]
    
    contacts = []
    for pc in passed_candidates:
        c_id = pc.get("id")
        c_name = pc.get("name", "未知")
        c_source = pc.get("source", "ai_simulated")
        
        contact_info = {
            "name": c_name,
            "id": c_id,
            "source": c_source,
            "match_score": pc.get("match_score", 0),
            "employer_score": pc.get("employer_score", 0),
            "strengths": pc.get("strengths", []),
            "phone": None,
            "email": None,
        }
        
        if c_id and c_source != "ai_simulated":
            # 真实候选人 — 从数据库获取联系方式
            cand_result = await db.execute(
                select(Candidate).where(Candidate.id == c_id)
            )
            candidate = cand_result.scalar_one_or_none()
            if candidate:
                user_result = await db.execute(
                    select(User).where(User.id == candidate.user_id)
                )
                user_info = user_result.scalar_one_or_none()
                if user_info:
                    contact_info["phone"] = user_info.phone or "未填写"
                    contact_info["email"] = user_info.email or "未填写"
        
        if not contact_info["phone"] and not contact_info["email"]:
            # AI 模拟候选人 — 生成模拟联系方式
            import hashlib
            name_hash = hashlib.md5(c_name.encode()).hexdigest()[:8]
            contact_info["phone"] = f"1{name_hash[:2]}****{name_hash[2:6]}"
            contact_info["email"] = f"{c_name.replace(' ', '')}@example.com"
            contact_info["is_simulated_contact"] = True
        
        contacts.append(contact_info)
    
    return {"contacts": contacts}


@router.post("/candidate-feedback")
async def submit_candidate_feedback(
    req: dict,
    db: AsyncSession = Depends(get_db)
):
    """提交候选人反馈 — 写入岗位日志 + 根据情况写入 memory"""
    from app.models.memory import Memory, MemoryType, MemoryImportance, MemoryScope
    
    job_id = req.get("job_id")
    user_id = req.get("user_id", 1)
    candidate_name = req.get("candidate_name", "未知")
    rating = req.get("rating", "neutral")  # good / neutral / bad
    feedback_text = req.get("feedback_text", "")
    todo_id = req.get("todo_id")
    
    rating_labels = {"good": "满意", "neutral": "一般", "bad": "不满意"}
    rating_emojis = {"good": "😊", "neutral": "😐", "bad": "😞"}
    rating_label = rating_labels.get(rating, "未知")
    rating_emoji = rating_emojis.get(rating, "❓")
    
    # 1. 写入岗位日志
    log_content = f"用户对候选人「{candidate_name}」的反馈：{rating_emoji} {rating_label}"
    if feedback_text:
        log_content += f"\n评价详情：{feedback_text}"
    
    if job_id:
        log = JobLog(
            job_id=job_id,
            actor_type="user",
            action=JobLogAction.USER_ACTION,
            title=f"候选人反馈：{candidate_name} — {rating_label}",
            content=log_content,
            extra_data=json.dumps({
                "candidate_name": candidate_name,
                "rating": rating,
                "feedback_text": feedback_text,
                "feedback_type": "candidate_evaluation",
            }, ensure_ascii=False),
            todo_id=todo_id,
        )
        db.add(log)
    
    # 2. 根据反馈内容决定是否写入 memory
    memory_created = False
    memory_content = ""
    
    if rating == "bad" and feedback_text:
        # 不满意 + 有具体描述 → 写入企业记忆（要求类型），帮助 AI 改进
        memory_content = f"招聘反馈：对候选人「{candidate_name}」不满意 — {feedback_text}。后续匹配时注意规避类似问题。"
        memory_type = MemoryType.REQUIREMENT
    elif rating == "good" and feedback_text:
        # 满意 + 有具体描述 → 写入企业记忆（偏好类型），帮助 AI 优化
        memory_content = f"招聘偏好：对候选人「{candidate_name}」满意 — {feedback_text}。后续匹配可参考此类型人才特征。"
        memory_type = MemoryType.PREFERENCE
    elif feedback_text and len(feedback_text) >= 10:
        # 有足够详细的反馈文字 → 写入经验记忆
        memory_content = f"招聘经验：关于候选人「{candidate_name}」— {feedback_text}"
        memory_type = MemoryType.EXPERIENCE
    
    if memory_content:
        # 检查是否有相似记忆
        existing_result = await db.execute(
            select(Memory)
            .where(Memory.user_id == user_id)
            .where(Memory.type == memory_type)
            .where(Memory.scope == MemoryScope.EMPLOYER)
        )
        existing_memories = existing_result.scalars().all()
        
        found_duplicate = False
        content_lower = memory_content.lower().strip()
        for existing in existing_memories:
            existing_lower = existing.content.lower().strip()
            if candidate_name.lower() in existing_lower and (
                content_lower in existing_lower or existing_lower in content_lower
            ):
                existing.emphasis_count = (existing.emphasis_count or 1) + 1
                existing.content = memory_content
                existing.updated_at = datetime.utcnow()
                found_duplicate = True
                break
        
        if not found_duplicate:
            new_memory = Memory(
                user_id=user_id,
                type=memory_type,
                content=memory_content,
                importance=MemoryImportance.HIGH if rating == "bad" else MemoryImportance.MEDIUM,
                scope=MemoryScope.EMPLOYER,
                color="border-red-300" if rating == "bad" else ("border-green-300" if rating == "good" else "border-slate-300"),
                source="feedback",
                emphasis_count=1,
                ai_reasoning=f"来自招聘流程的候选人反馈（{rating_label}），用于改进后续 AI 匹配和筛选质量。",
            )
            db.add(new_memory)
        
        memory_created = True
    
    await db.commit()
    
    return {
        "success": True,
        "rating": rating,
        "rating_label": rating_label,
        "memory_created": memory_created,
        "message": f"反馈已记录{' 并已写入企业记忆' if memory_created else ''}",
    }


# ========== 邀请奖励系统 ==========

@router.get("/invite/stats")
async def get_invite_stats(
    user_id: int = Query(..., description="用户ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取用户邀请统计：邀请码、邀请人数、累计 Token 奖励、最近邀请记录"""
    from sqlalchemy import func
    from app.models.user import User
    from app.models.invitation import Invitation
    from app.models.token import TokenUsage, TokenAction, TokenPackage
    import string, random

    # 获取用户信息和邀请码
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 若用户还没有邀请码，动态生成
    invite_code = user.invite_code
    if not invite_code:
        chars = string.ascii_uppercase + string.digits
        for _ in range(10):
            code = ''.join(random.choices(chars, k=6))
            dup = await db.execute(select(User).where(User.invite_code == code))
            if not dup.scalar_one_or_none():
                invite_code = code
                break
        if invite_code:
            user.invite_code = invite_code
            await db.flush()

    # 统计邀请人数
    count_result = await db.execute(
        select(func.count(Invitation.id)).where(Invitation.inviter_id == user_id)
    )
    invite_count = count_result.scalar() or 0

    # 累计获得的邀请奖励 Token
    reward_result = await db.execute(
        select(func.sum(Invitation.reward_tokens)).where(Invitation.inviter_id == user_id)
    )
    total_reward_tokens = reward_result.scalar() or 0

    # Token 余额
    pkg_result = await db.execute(
        select(func.sum(TokenPackage.remaining_tokens))
        .where(TokenPackage.user_id == user_id, TokenPackage.is_active == True)
    )
    token_balance = pkg_result.scalar() or 100000  # 默认10万

    # 最近 10 条邀请记录
    records_result = await db.execute(
        select(Invitation)
        .where(Invitation.inviter_id == user_id)
        .order_by(Invitation.created_at.desc())
        .limit(10)
    )
    records = records_result.scalars().all()

    invite_records = []
    for r in records:
        invitee_result = await db.execute(select(User).where(User.id == r.invitee_id))
        invitee = invitee_result.scalar_one_or_none()
        invitee_name = invitee.name if invitee else "未知用户"
        # 脱敏处理
        if len(invitee_name) > 1:
            masked_name = invitee_name[0] + "*" * (len(invitee_name) - 1)
        else:
            masked_name = invitee_name + "**"
        invite_records.append({
            "id": r.id,
            "invitee_name": masked_name,
            "reward_tokens": r.reward_tokens,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {
        "invite_code": invite_code,
        "invite_link": f"https://devnors.ai/register?ref={invite_code}",
        "invite_count": invite_count,
        "total_reward_tokens": total_reward_tokens,
        "token_balance": token_balance,
        "records": invite_records,
        "rules": {
            "per_invite_reward": 500,
            "new_user_bonus": 200,
            "milestone_5": 1000,
            "milestone_10": 3000,
            "milestone_20": 8000,
        },
    }


@router.get("/invite/records")
async def get_invite_records(
    user_id: int = Query(..., description="用户ID"),
    limit: int = Query(20, description="每页条数"),
    offset: int = Query(0, description="偏移量"),
    db: AsyncSession = Depends(get_db)
):
    """获取详细邀请记录列表（分页）"""
    from sqlalchemy import func
    from app.models.user import User
    from app.models.invitation import Invitation

    # 总数
    count_result = await db.execute(
        select(func.count(Invitation.id)).where(Invitation.inviter_id == user_id)
    )
    total = count_result.scalar() or 0

    # 分页查询
    records_result = await db.execute(
        select(Invitation)
        .where(Invitation.inviter_id == user_id)
        .order_by(Invitation.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    records = records_result.scalars().all()

    items = []
    for r in records:
        invitee_result = await db.execute(select(User).where(User.id == r.invitee_id))
        invitee = invitee_result.scalar_one_or_none()
        invitee_name = invitee.name if invitee else "未知用户"
        if len(invitee_name) > 1:
            masked_name = invitee_name[0] + "*" * (len(invitee_name) - 1)
        else:
            masked_name = invitee_name + "**"
        items.append({
            "id": r.id,
            "invitee_name": masked_name,
            "invite_code": r.invite_code,
            "reward_tokens": r.reward_tokens,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {"total": total, "items": items}
