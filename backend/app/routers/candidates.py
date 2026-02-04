"""
Candidates Router
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.candidate import Candidate, CandidateProfile, Skill
from app.schemas.candidate import (
    CandidateCreate, CandidateResponse,
    CandidateProfileResponse, ResumeAnalysisRequest, ResumeAnalysisResponse
)
from app.utils.security import get_current_user
from app.agents.resume_parser import ResumeParserAgent

router = APIRouter()


@router.get("/", response_model=List[CandidateResponse])
async def list_candidates(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取候选人列表
    
    仅企业用户可访问
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECRUITER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    result = await db.execute(
        select(Candidate)
        .options(selectinload(Candidate.profile))
        .offset(skip).limit(limit)
    )
    candidates = result.scalars().all()
    return candidates


@router.get("/me", response_model=CandidateResponse)
async def get_my_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户的候选人档案"""
    result = await db.execute(
        select(Candidate)
        .options(
            selectinload(Candidate.profile),
            selectinload(Candidate.skills)
        )
        .where(Candidate.user_id == current_user.id)
    )
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        # Create candidate record if not exists
        candidate = Candidate(user_id=current_user.id)
        db.add(candidate)
        await db.commit()
        await db.refresh(candidate)
    
    return candidate


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取候选人详情"""
    result = await db.execute(
        select(Candidate)
        .options(
            selectinload(Candidate.profile),
            selectinload(Candidate.skills)
        )
        .where(Candidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="候选人不存在"
        )
    
    return candidate


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    request: ResumeAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    AI 简历分析
    
    使用 AI 智能体解析简历并生成人才画像
    """
    # Get or create candidate record
    result = await db.execute(
        select(Candidate).where(Candidate.user_id == current_user.id)
    )
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        candidate = Candidate(user_id=current_user.id)
        db.add(candidate)
        await db.commit()
        await db.refresh(candidate)
    
    # Update resume text
    candidate.resume_text = request.resume_text
    
    # Use AI agent to analyze resume
    agent = ResumeParserAgent()
    analysis_result = await agent.analyze(request.resume_text)
    
    # Save profile to database
    if candidate.profile:
        # Update existing profile
        profile = candidate.profile
        profile.display_name = analysis_result.name
        profile.current_role = analysis_result.role
        profile.experience_years = analysis_result.experienceYears
        profile.summary = analysis_result.summary
        profile.ideal_job_persona = analysis_result.idealJobPersona
        profile.salary_range = analysis_result.salaryRange
        profile.market_demand = analysis_result.marketDemand
        profile.radar_data = [{"subject": r.subject, "value": r.value} for r in analysis_result.radarData]
        profile.interview_questions = analysis_result.interviewQuestions
        profile.optimization_suggestions = analysis_result.optimizationSuggestions
        profile.agent_feedbacks = [f.model_dump() for f in analysis_result.agentFeedbacks] if analysis_result.agentFeedbacks else None
    else:
        # Create new profile
        profile = CandidateProfile(
            candidate_id=candidate.id,
            display_name=analysis_result.name,
            current_role=analysis_result.role,
            experience_years=analysis_result.experienceYears,
            summary=analysis_result.summary,
            ideal_job_persona=analysis_result.idealJobPersona,
            salary_range=analysis_result.salaryRange,
            market_demand=analysis_result.marketDemand,
            radar_data=[{"subject": r.subject, "value": r.value} for r in analysis_result.radarData],
            interview_questions=analysis_result.interviewQuestions,
            optimization_suggestions=analysis_result.optimizationSuggestions,
            agent_feedbacks=[f.model_dump() for f in analysis_result.agentFeedbacks] if analysis_result.agentFeedbacks else None,
        )
        db.add(profile)
    
    # Update skills
    # Clear existing skills
    result = await db.execute(select(Skill).where(Skill.candidate_id == candidate.id))
    existing_skills = result.scalars().all()
    for skill in existing_skills:
        await db.delete(skill)
    
    # Add new skills
    for skill_name in analysis_result.skills:
        skill = Skill(candidate_id=candidate.id, name=skill_name)
        db.add(skill)
    
    candidate.is_profile_complete = True
    from datetime import datetime
    candidate.last_analysis_at = datetime.utcnow()
    
    await db.commit()
    
    return analysis_result


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    上传简历文件
    
    支持 PDF、Word 等格式
    """
    # Validate file type
    allowed_types = ["application/pdf", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "text/plain"]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的文件格式，请上传 PDF、Word 或文本文件"
        )
    
    # Read file content
    content = await file.read()
    
    # TODO: Parse file content based on type
    # For now, just return success message
    
    return {
        "message": "文件上传成功",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content)
    }
