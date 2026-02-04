"""
AI Router - AI Agent endpoints
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.security import get_current_user
from app.agents.resume_parser import ResumeParserAgent
from app.agents.interview_agent import InterviewAgent
from app.agents.market_analyst import MarketAnalystAgent
from app.schemas.candidate import ResumeAnalysisRequest, ResumeAnalysisResponse

router = APIRouter()


# --- Chat Schemas ---

class ChatMessage(BaseModel):
    """Chat message schema"""
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    """Chat request schema"""
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    """Chat response schema"""
    response: str
    tokens_used: int = 0


# --- Resume Analysis ---

@router.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    request: ResumeAnalysisRequest,
):
    """
    AI 简历解析（公开接口，无需登录）
    
    使用多智能体分析简历，生成全方位人才画像
    
    - 技术专家评估
    - HRBP 软技能评估
    - 战略顾问职业规划
    """
    agent = ResumeParserAgent()
    result = await agent.analyze(request.resume_text)
    return result


# --- AI Interview ---

@router.post("/interview/chat", response_model=ChatResponse)
async def chat_with_interviewer(
    request: ChatRequest,
):
    """
    AI 面试官对话（公开接口，无需登录）
    
    进行压力面试模拟
    """
    agent = InterviewAgent()
    
    # Convert history to format expected by agent
    history = [
        {"role": msg.role, "parts": [{"text": msg.content}]}
        for msg in request.history
    ]
    
    response = await agent.interview_chat(history, request.message)
    
    return ChatResponse(
        response=response,
        tokens_used=100  # Approximate, would need actual tracking
    )


# --- Job Matching ---

class JobMatchRequest(BaseModel):
    """Job matching request"""
    candidate_id: int
    job_ids: Optional[List[int]] = None


class JobMatchResult(BaseModel):
    """Single job match result"""
    job_id: int
    match_score: float
    match_reasons: List[str]
    gaps: List[str]


class JobMatchResponse(BaseModel):
    """Job matching response"""
    matches: List[JobMatchResult]


@router.post("/match-jobs", response_model=JobMatchResponse)
async def match_jobs(
    request: JobMatchRequest,
):
    """
    AI 职位匹配（公开接口，无需登录）
    
    分析候选人与职位的匹配度
    """
    # TODO: Implement actual job matching logic with AI and database
    # For now, return mock data
    
    return JobMatchResponse(
        matches=[
            JobMatchResult(
                job_id=request.job_ids[0] if request.job_ids else 1,
                match_score=92.5,
                match_reasons=[
                    "技能匹配度高",
                    "经验年限符合要求",
                    "期望薪资在范围内"
                ],
                gaps=["缺少大型团队管理经验"]
            )
        ]
    )


# --- Market Analysis ---

class MarketAnalysisRequest(BaseModel):
    """Market analysis request"""
    role: str
    skills: List[str]
    experience_years: float
    location: Optional[str] = None


class MarketAnalysisResponse(BaseModel):
    """Market analysis response"""
    salary_range: str
    market_demand: str
    competition_level: str
    trending_skills: List[str]
    recommendations: List[str]


@router.post("/market-analysis", response_model=MarketAnalysisResponse)
async def analyze_market(
    request: MarketAnalysisRequest,
):
    """
    市场分析（公开接口，无需登录）
    
    使用 AI 分析职位的市场行情
    """
    agent = MarketAnalystAgent()
    
    # 获取薪资分析
    salary_result = await agent.analyze_salary(
        role=request.role,
        experience_years=request.experience_years,
        skills=request.skills,
        location=request.location
    )
    
    # 获取市场需求分析
    demand_result = await agent.analyze_market_demand(
        role=request.role,
        skills=request.skills
    )
    
    # 组合结果
    salary_min = salary_result.get("salary_min", 30)
    salary_max = salary_result.get("salary_max", 60)
    
    return MarketAnalysisResponse(
        salary_range=f"¥{salary_min}k - ¥{salary_max}k",
        market_demand=demand_result.get("outlook", "市场需求稳定"),
        competition_level=demand_result.get("competition_level", "中等"),
        trending_skills=demand_result.get("hot_skills", ["Python", "AI/ML", "云原生"]),
        recommendations=salary_result.get("improvement_suggestions", [
            "建议补充云平台相关认证",
            "关注 AI 领域的最新进展",
            "积累大型项目管理经验"
        ])
    )


# --- Token Usage ---

class TokenUsageResponse(BaseModel):
    """Token usage response"""
    total_tokens: int
    used_tokens: int
    remaining_tokens: int
    usage_breakdown: dict


@router.get("/token-usage", response_model=TokenUsageResponse)
async def get_token_usage():
    """
    获取 Token 使用情况（公开接口）
    """
    # TODO: Implement actual token tracking with user authentication
    # For now, return mock data
    
    return TokenUsageResponse(
        total_tokens=100000,
        used_tokens=45000,
        remaining_tokens=55000,
        usage_breakdown={
            "resume_parse": 15000,
            "interview": 20000,
            "market_analysis": 5000,
            "chat": 5000
        }
    )
