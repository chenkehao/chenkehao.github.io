"""
Public API Router - 公开接口，无需登录
"""

import json
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
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
    db: AsyncSession = Depends(get_db)
):
    """获取公开职位列表"""
    from sqlalchemy import or_
    
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
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Job.created_at.desc())
    
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
        "match": 85 + (job.id % 15),  # 模拟匹配度
        "tags": [tag.name for tag in job.tags][:3],
        "logo": job.logo or "💼",
        "aiIntro": job.ai_intro or "AI 智能体正在分析职位匹配度",
    } for job in jobs]


# ============ 工作流相关公开接口 ============

@router.get("/flows")
async def get_public_flows(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """获取工作流列表（示例数据）"""
    result = await db.execute(
        select(Flow)
        .options(selectinload(Flow.steps), selectinload(Flow.timeline))
        .order_by(Flow.updated_at.desc())
        .limit(limit)
    )
    flows = result.scalars().all()
    
    # 获取关联的职位和候选人信息
    flow_list = []
    for flow in flows:
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
        
        # 映射状态为前端友好的格式
        status_map = {
            "interviewing": "active",
            "offer": "completed",
            "accepted": "completed",
        }
        frontend_status = status_map.get(flow.status.value, "pending")
        
        flow_list.append({
            "id": flow.id,
            "candidateName": candidate.profile.display_name if candidate and candidate.profile else "未知",
            "role": job.title if job else "未知职位",
            "company": job.company if job else "未知公司",
            "stage": flow.current_stage.value,
            "status": frontend_status,
            "matchScore": flow.match_score or 0,
            "currentStep": flow.current_step,
            "totalSteps": 5,
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
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """获取人才列表"""
    result = await db.execute(
        select(Candidate)
        .options(selectinload(Candidate.profile), selectinload(Candidate.skills))
        .where(Candidate.is_profile_complete == True)
        .limit(limit)
    )
    candidates = result.scalars().all()
    
    return [{
        "id": c.id,
        "name": c.profile.display_name if c.profile else "未知",
        "role": c.profile.current_role if c.profile else "未知职位",
        "experienceYears": c.profile.experience_years if c.profile else 0,
        "skills": [s.name for s in (c.skills or [])][:5],
        "radarData": c.profile.radar_data if c.profile else [],
        "summary": c.profile.summary if c.profile else "",
        "matchScore": 85 + (c.id % 15),  # 模拟匹配度
        "status": "active",
        "targetJobId": 1,  # 模拟目标职位
    } for c in candidates]


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
    "requirement": "需求",
    "benefit": "福利",
}

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
        "content": m.content,
        "date": m.created_at.strftime("%Y-%m"),
        "color": m.color or TYPE_COLOR_MAP.get(m.type.value, "border-slate-300"),
        "importance": m.importance.value if m.importance else "Medium",
        "scope": m.scope.value if m.scope else "candidate",
        "emphasis_count": m.emphasis_count or 1,
        "ai_reasoning": m.ai_reasoning,
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
    """AI 驱动的记忆优化
    
    1. 合并重复同类记忆，合并后保留的记忆得到增强
    2. 删除不重要的无意义的记忆
    3. 检查记忆分类的准确性并修正
    4. 从用户行为中总结新记忆
    5. 为所有保留的记忆生成 Agent 推理逻辑
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
    
    # 准备记忆数据供 AI 分析
    memories_data = [{
        "id": m.id,
        "type": m.type.value,
        "content": m.content,
        "importance": m.importance.value if m.importance else "Medium",
        "emphasis_count": m.emphasis_count or 1,
        "created_at": m.created_at.strftime("%Y-%m-%d")
    } for m in memories]
    
    scope_desc = "人才画像" if memory_scope == MemoryScope.CANDIDATE else "企业画像"
    
    # 构建 AI 分析提示
    analysis_prompt = f"""你是一个智能记忆优化助手。请分析以下用户的{scope_desc}记忆数据，并给出优化建议。

用户记忆类型说明：
- skill: 技能/能力
- experience: 工作经历
- goal: 职业目标
- preference: 求职偏好
- culture: 文化偏好
- tech: 技术要求
- salary: 薪酬期望
- location: 工作地点
- requirement: 招聘需求（企业）
- company: 公司介绍（企业）
- benefit: 福利待遇（企业）

当前记忆数据：
{json_module.dumps(memories_data, ensure_ascii=False, indent=2)}

请分析并返回 JSON 格式的优化建议：
{{
  "merge": [
    {{
      "keep_id": 保留的记忆ID,
      "delete_ids": [要合并删除的记忆ID列表],
      "new_content": "合并后的新内容",
      "reason": "合并原因",
      "ai_reasoning": "合并后这条记忆的 Agent 推理逻辑（说明为什么保留这条记忆、它对用户有什么价值）"
    }}
  ],
  "delete": [
    {{
      "id": 要删除的记忆ID,
      "reason": "删除原因（如：内容无意义、重复、过时等）"
    }}
  ],
  "reclassify": [
    {{
      "id": 记忆ID,
      "old_type": "原分类",
      "new_type": "正确的分类",
      "reason": "重新分类的原因",
      "ai_reasoning": "重新分类后的 Agent 推理逻辑"
    }}
  ],
  "create": [
    {{
      "type": "记忆类型",
      "content": "根据现有记忆推断出的新记忆内容",
      "importance": "High/Medium/Low",
      "reason": "创建原因",
      "ai_reasoning": "创建这条记忆的 Agent 推理逻辑（说明这条记忆是如何从已有信息推断出来的）"
    }}
  ],
  "reasoning_updates": [
    {{
      "id": 记忆ID,
      "ai_reasoning": "为这条记忆生成的 Agent 推理逻辑（解释为什么这条记忆对用户重要、它将如何影响后续的职位/人才匹配）"
    }}
  ]
}}

注意：
1. 只返回 JSON，不要有其他文字
2. 合并相似内容的记忆，保留信息最全面的
3. 删除明显无意义或过于简短的记忆（如只有一两个字）
4. 检查分类是否准确，技能应该在 skill，经历应该在 experience 等
5. 如果能从现有记忆推断出有价值的新信息，可以建议创建新记忆
6. 保守操作，不确定的不要删除
7. **重要**：在 reasoning_updates 中为所有保留的记忆生成 Agent 推理逻辑，解释这条记忆的价值和意义
8. ai_reasoning 应该是一段简短的描述（30-80字），解释 Agent 为什么保留/创建这条记忆，以及它将如何影响后续匹配"""

    # 调用 AI 分析
    try:
        from app.services.ai_service import get_ai_service
        ai_service = get_ai_service()
        ai_response = await ai_service.chat(analysis_prompt)
        
        # 解析 AI 响应
        # 尝试提取 JSON
        response_text = ai_response.strip()
        if response_text.startswith("```"):
            # 移除 markdown 代码块标记
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        
        optimization_plan = json_module.loads(response_text)
    except Exception as e:
        print(f"AI 分析失败: {e}")
        # 如果 AI 分析失败，执行简单的重复检测
        optimization_plan = {"merge": [], "delete": [], "reclassify": [], "create": [], "reasoning_updates": []}
        
        # 按类型分组记忆
        type_groups = {}
        for m in memories:
            type_key = m.type.value if m.type else 'unknown'
            if type_key not in type_groups:
                type_groups[type_key] = []
            type_groups[type_key].append(m)
        
        # 特殊处理：对于 preference 类型，只保留最新的一条（因为求职偏好会更新）
        if 'preference' in type_groups:
            pref_memories = type_groups['preference']
            # 按创建时间降序排序（最新的在前）
            pref_memories.sort(key=lambda x: x.created_at, reverse=True)
            
            if len(pref_memories) > 1:
                # 保留最新的，删除其他的
                keep_memory = pref_memories[0]
                delete_memories = pref_memories[1:]
                
                # 检查是否都是求职偏好信息（以【求职偏好信息】开头）
                job_pref_memories = [m for m in pref_memories if m.content.startswith('【求职偏好信息】')]
                if len(job_pref_memories) > 1:
                    keep_memory = job_pref_memories[0]
                    delete_ids = [m.id for m in job_pref_memories[1:]]
                    
                    optimization_plan["merge"].append({
                        "keep_id": keep_memory.id,
                        "delete_ids": delete_ids,
                        "new_content": None,
                        "reason": f"合并 {len(delete_ids)} 条旧的求职偏好记录，保留最新版本",
                        "ai_reasoning": "保留用户最新的求职偏好信息，删除历史版本以避免冲突。最新偏好将用于智能岗位匹配。"
                    })
        
        # 对于同类型记忆，检查内容相似度
        seen_contents = {}
        processed_ids = set()
        
        # 收集已被合并处理的ID
        for merge in optimization_plan.get("merge", []):
            processed_ids.add(merge.get("keep_id"))
            for del_id in merge.get("delete_ids", []):
                processed_ids.add(del_id)
        
        for m in memories:
            if m.id in processed_ids:
                continue
                
            content_key = m.content.lower().strip()[:50]  # 取前50字符作为键
            if content_key in seen_contents:
                # 发现重复，合并到第一个
                existing_id = seen_contents[content_key]
                optimization_plan["merge"].append({
                    "keep_id": existing_id,
                    "delete_ids": [m.id],
                    "new_content": None,
                    "reason": "内容重复",
                    "ai_reasoning": "合并重复记忆以增强记忆强度"
                })
            else:
                seen_contents[content_key] = m.id
                # 为每条记忆生成默认推理逻辑
                default_reasoning = f"基于用户{'职业履历' if memory_scope == MemoryScope.CANDIDATE else '招聘历史'}自动提取的{TYPE_NAME_MAP.get(m.type.value, m.type.value)}信息，用于优化后续{'职位' if memory_scope == MemoryScope.CANDIDATE else '人才'}匹配。"
                optimization_plan["reasoning_updates"].append({
                    "id": m.id,
                    "ai_reasoning": default_reasoning
                })
    
    # 执行优化操作
    actions = []
    summary = {"merged": 0, "deleted": 0, "reclassified": 0, "created": 0, "reasoning_updated": 0}
    
    # 1. 执行合并
    for merge_action in optimization_plan.get("merge", []):
        keep_id = merge_action.get("keep_id")
        delete_ids = merge_action.get("delete_ids", [])
        new_content = merge_action.get("new_content")
        ai_reasoning = merge_action.get("ai_reasoning")
        
        if keep_id and delete_ids:
            # 获取要保留的记忆
            keep_result = await db.execute(select(Memory).where(Memory.id == keep_id))
            keep_memory = keep_result.scalar_one_or_none()
            
            if keep_memory:
                # 更新内容（如果有新内容）
                if new_content:
                    keep_memory.content = new_content
                
                # 更新 AI 推理逻辑
                if ai_reasoning:
                    keep_memory.ai_reasoning = ai_reasoning
                
                # 增加强调次数
                keep_memory.emphasis_count = (keep_memory.emphasis_count or 1) + len(delete_ids)
                keep_memory.updated_at = datetime.utcnow()
                
                # 删除被合并的记忆
                for del_id in delete_ids:
                    del_result = await db.execute(select(Memory).where(Memory.id == del_id))
                    del_memory = del_result.scalar_one_or_none()
                    if del_memory:
                        await db.delete(del_memory)
                
                actions.append({
                    "action": "merge",
                    "kept_id": keep_id,
                    "deleted_ids": delete_ids,
                    "reason": merge_action.get("reason", "合并重复记忆")
                })
                summary["merged"] += len(delete_ids)
    
    # 2. 执行删除
    for delete_action in optimization_plan.get("delete", []):
        del_id = delete_action.get("id")
        if del_id:
            del_result = await db.execute(select(Memory).where(Memory.id == del_id))
            del_memory = del_result.scalar_one_or_none()
            if del_memory:
                await db.delete(del_memory)
                actions.append({
                    "action": "delete",
                    "id": del_id,
                    "content": del_memory.content[:50],
                    "reason": delete_action.get("reason", "删除无意义记忆")
                })
                summary["deleted"] += 1
    
    # 3. 执行重新分类
    for reclassify_action in optimization_plan.get("reclassify", []):
        mem_id = reclassify_action.get("id")
        new_type = reclassify_action.get("new_type")
        ai_reasoning = reclassify_action.get("ai_reasoning")
        if mem_id and new_type:
            try:
                new_memory_type = MemoryType(new_type.lower())
                recl_result = await db.execute(select(Memory).where(Memory.id == mem_id))
                recl_memory = recl_result.scalar_one_or_none()
                if recl_memory:
                    old_type = recl_memory.type.value
                    recl_memory.type = new_memory_type
                    recl_memory.color = TYPE_COLOR_MAP.get(new_memory_type.value, "border-slate-300")
                    recl_memory.updated_at = datetime.utcnow()
                    if ai_reasoning:
                        recl_memory.ai_reasoning = ai_reasoning
                    actions.append({
                        "action": "reclassify",
                        "id": mem_id,
                        "old_type": old_type,
                        "new_type": new_type,
                        "reason": reclassify_action.get("reason", "修正分类")
                    })
                    summary["reclassified"] += 1
            except ValueError:
                pass  # 无效的类型，跳过
    
    # 4. 创建新记忆
    for create_action in optimization_plan.get("create", []):
        try:
            new_type = MemoryType(create_action.get("type", "skill").lower())
            new_importance = MemoryImportance(create_action.get("importance", "Medium"))
            new_content = create_action.get("content")
            ai_reasoning = create_action.get("ai_reasoning")
            
            if new_content:
                new_memory = Memory(
                    user_id=user_id,
                    type=new_type,
                    content=new_content,
                    importance=new_importance,
                    scope=memory_scope,
                    color=TYPE_COLOR_MAP.get(new_type.value, "border-slate-300"),
                    source="ai",
                    emphasis_count=1,
                    ai_reasoning=ai_reasoning or f"基于用户现有记忆分析推断出的{TYPE_NAME_MAP.get(new_type.value, new_type.value)}信息。"
                )
                db.add(new_memory)
                actions.append({
                    "action": "create",
                    "type": new_type.value,
                    "content": new_content[:50],
                    "reason": create_action.get("reason", "AI 推断的新记忆")
                })
                summary["created"] += 1
        except ValueError:
            pass  # 无效的类型或重要性，跳过
    
    # 5. 更新保留记忆的 AI 推理逻辑
    for reasoning_update in optimization_plan.get("reasoning_updates", []):
        mem_id = reasoning_update.get("id")
        ai_reasoning = reasoning_update.get("ai_reasoning")
        if mem_id and ai_reasoning:
            reason_result = await db.execute(select(Memory).where(Memory.id == mem_id))
            reason_memory = reason_result.scalar_one_or_none()
            if reason_memory:
                reason_memory.ai_reasoning = ai_reasoning
                reason_memory.updated_at = datetime.utcnow()
                summary["reasoning_updated"] += 1
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"记忆优化完成：合并 {summary['merged']} 条，删除 {summary['deleted']} 条，重新分类 {summary['reclassified']} 条，新增 {summary['created']} 条，更新推理 {summary['reasoning_updated']} 条",
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
        "status": t.status.value if t.status else "pending",
        "priority": t.priority.value.capitalize() if t.priority else "Medium",
        "progress": t.progress or 0,
        "source": t.source.value if t.source else "user",
        "icon": t.icon or "Calendar",
        "type": t.todo_type.value if t.todo_type else "system",
        "aiAdvice": t.ai_advice or "",
        "steps": json.loads(t.steps) if isinstance(t.steps, str) else (t.steps or []),
        "dueDate": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
        "createdAt": t.created_at.strftime("%Y-%m-%d") if t.created_at else None,
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
        priority = TodoPriority(todo.priority.lower())
    except ValueError:
        priority = TodoPriority.MEDIUM
    
    # 解析来源
    try:
        source = TodoSource(todo.source.lower())
    except ValueError:
        source = TodoSource.USER
    
    # 解析类型
    try:
        todo_type = TodoType(todo.todo_type.lower())
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


@router.put("/todos/{todo_id}")
async def update_todo(
    todo_id: int,
    status: str = Query(None),
    progress: int = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """更新待办任务"""
    result = await db.execute(select(Todo).where(Todo.id == todo_id))
    todo = result.scalar_one_or_none()
    
    if not todo:
        return {"error": "任务不存在"}
    
    if status:
        try:
            todo.status = TodoStatus(status.lower())
            if status.lower() == "completed":
                todo.completed_at = datetime.utcnow()
                todo.progress = 100
        except ValueError:
            pass
    
    if progress is not None:
        todo.progress = progress
        if progress >= 100:
            todo.status = TodoStatus.COMPLETED
            todo.completed_at = datetime.utcnow()
    
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
        "priority": t.priority.value.capitalize() if t.priority else "Medium",
        "source": t.source.value if t.source else "user",
        "type": t.todo_type.value if t.todo_type else "system",
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
    """获取岗位详情及投递列表"""
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
    
    # 获取该岗位的所有投递流程
    flows_result = await db.execute(
        select(Flow)
        .options(selectinload(Flow.steps), selectinload(Flow.timeline))
        .where(Flow.job_id == job_id)
        .order_by(Flow.created_at.desc())
    )
    flows = flows_result.scalars().all()
    
    # 获取候选人信息
    applications = []
    for flow in flows:
        # 获取候选人
        cand_result = await db.execute(
            select(Candidate).where(Candidate.id == flow.candidate_id)
        )
        candidate = cand_result.scalar_one_or_none()
        
        # 获取候选人 profile
        profile = None
        user_info = None
        if candidate:
            prof_result = await db.execute(
                select(CandidateProfile).where(CandidateProfile.candidate_id == candidate.id)
            )
            profile = prof_result.scalar_one_or_none()
            # 获取用户基本信息
            user_result = await db.execute(
                select(User).where(User.id == candidate.user_id)
            )
            user_info = user_result.scalar_one_or_none()
        
        applications.append({
            "flow_id": flow.id,
            "candidate_id": flow.candidate_id,
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
            "candidate_name": profile.display_name if profile else (user_info.name if user_info else f"候选人#{flow.candidate_id}"),
            "candidate_role": profile.current_role if profile else None,
            "candidate_avatar": user_info.avatar_url if user_info else None,
            "candidate_experience": profile.experience_years if profile else None,
            "candidate_summary": profile.summary if profile else None,
        })
    
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
