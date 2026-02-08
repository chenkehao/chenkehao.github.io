"""
Database Seed Data
初始化数据库示例数据
"""

import asyncio
import json
from datetime import datetime, timedelta
from sqlalchemy import select

from app.database import engine, AsyncSessionLocal
from app.models.user import User, UserRole, TeamMember
from app.models.job import Job, JobTag, JobStatus, JobType
from app.models.candidate import Candidate, CandidateProfile, Skill
from app.models.flow import Flow, FlowStep, FlowTimeline, FlowStatus, FlowStage
from app.models.todo import Todo, TodoStatus, TodoPriority, TodoSource, TodoType
from app.models.settings import (
    UserSettings, 
    EnterpriseCertification, 
    PersonalCertification,
    AIEngineConfig,
    APIKey,
    AuditLog,
    CertificationStatus
)
from app.utils.security import get_password_hash


async def seed_database():
    """初始化数据库种子数据"""
    async with AsyncSessionLocal() as db:
        # 检查是否已有数据
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already has data, skipping seed")
            return
        
        print("Seeding database...")
        
        # 1. 创建用户（UID 从 1000000 开始）
        users = [
            User(
                id=1000000,
                email="admin@devnors.com",
                hashed_password=get_password_hash("admin123"),
                name="系统管理员",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            ),
            User(
                id=1000001,
                email="hr@devnors.com",
                hashed_password=get_password_hash("hr123456"),
                name="李招聘",
                role=UserRole.RECRUITER,
                company_name="得若智能科技",
                is_active=True,
                is_verified=True,
            ),
            User(
                id=1000002,
                email="candidate@example.com",
                hashed_password=get_password_hash("candidate123"),
                name="张三",
                role=UserRole.CANDIDATE,
                is_active=True,
                is_verified=True,
            ),
            # 测试账号 - 求职者
            User(
                id=1000003,
                email="test@example.com",
                hashed_password=get_password_hash("test123456"),
                name="测试用户",
                role=UserRole.CANDIDATE,
                is_active=True,
                is_verified=True,
            ),
            # 测试账号 - 新用户（需要选择身份）
            User(
                id=1000004,
                email="new@example.com",
                hashed_password=get_password_hash("new123456"),
                name="新用户",
                role=UserRole.VIEWER,  # VIEWER 角色需要选择身份
                is_active=True,
                is_verified=True,
            ),
        ]
        for user in users:
            db.add(user)
        await db.flush()
        
        admin_user = users[0]
        hr_user = users[1]
        candidate_user = users[2]
        
        # 2. 创建职位标签
        tags_data = ["Python", "React", "TypeScript", "Node.js", "AI/ML", "FastAPI", 
                     "全栈", "远程", "大模型", "云原生", "Kubernetes", "Go", "Rust"]
        tags = {}
        for tag_name in tags_data:
            tag = JobTag(name=tag_name)
            db.add(tag)
            tags[tag_name] = tag
        await db.flush()
        
        # 3. 创建职位
        jobs_data = [
            {
                "title": "高级 AI 工程师",
                "company": "得若智能科技",
                "location": "北京",
                "description": "负责 AI 多智能体系统的核心研发，包括 LLM 应用、RAG 系统、Agent 协作框架等。要求有大模型应用经验，熟悉 LangChain 或类似框架。",
                "salary_min": 400000,
                "salary_max": 700000,
                "job_type": JobType.FULL_TIME,
                "requirements": "5年以上Python开发经验，熟悉深度学习框架，有大模型应用经验",
                "benefits": "股票期权、弹性工作、远程办公",
                "tags": ["Python", "AI/ML", "大模型"],
                "logo": "🤖",
                "ai_intro": "AI 智能体将自动对标您的技能矩阵，并生成定制化的面试准备材料",
            },
            {
                "title": "大模型研发工程师",
                "company": "字节跳动",
                "location": "北京/上海",
                "description": "参与大语言模型的训练、优化和应用研发，探索 AI 创新产品形态。",
                "salary_min": 500000,
                "salary_max": 900000,
                "job_type": JobType.FULL_TIME,
                "requirements": "硕士及以上学历，有 NLP/LLM 相关研究或工程经验",
                "benefits": "免费三餐、班车、健身房",
                "tags": ["Python", "AI/ML", "大模型"],
                "logo": "📱",
                "ai_intro": "多维度技能雷达已生成，系统将自动追踪申请进度",
            },
            {
                "title": "全栈开发工程师",
                "company": "Nexus 创意实验室",
                "location": "深圳",
                "description": "负责创意产品的全栈开发，包括前端 React/Vue 和后端 Node.js/Python。",
                "salary_min": 300000,
                "salary_max": 500000,
                "job_type": JobType.FULL_TIME,
                "requirements": "3年以上全栈开发经验，熟悉 React 和 Node.js",
                "benefits": "弹性工作时间、年度旅游、期权激励",
                "tags": ["React", "Node.js", "TypeScript", "全栈"],
                "logo": "🎨",
                "ai_intro": "创意团队 Culture Fit 评估中，智能体正在分析您的项目经历",
            },
            {
                "title": "云原生架构师",
                "company": "阿里云",
                "location": "杭州",
                "description": "设计和实现大规模云原生架构，推动微服务、容器化和 Kubernetes 落地。",
                "salary_min": 600000,
                "salary_max": 1000000,
                "job_type": JobType.FULL_TIME,
                "requirements": "5年以上架构设计经验，精通 Kubernetes、Docker",
                "benefits": "股票、购房补贴、子女教育",
                "tags": ["云原生", "Kubernetes", "Go"],
                "logo": "☁️",
                "ai_intro": "架构能力评估完成，系统已生成技术深度问答题库",
            },
            {
                "title": "Rust 系统开发工程师",
                "company": "PingCAP",
                "location": "北京/远程",
                "description": "参与分布式数据库 TiDB 的核心开发，使用 Rust 构建高性能存储引擎。",
                "salary_min": 450000,
                "salary_max": 800000,
                "job_type": JobType.FULL_TIME,
                "requirements": "熟练掌握 Rust，了解分布式系统原理",
                "benefits": "全远程办公、开源贡献奖励",
                "tags": ["Rust", "Go", "远程"],
                "logo": "🦀",
                "ai_intro": "开源贡献已自动追踪，GitHub Profile 分析完成",
            },
        ]
        
        jobs = []
        for job_data in jobs_data:
            job_tags = [tags[t] for t in job_data.pop("tags")]
            job = Job(
                **job_data,
                owner_id=hr_user.id,
                status=JobStatus.ACTIVE,
                published_at=datetime.utcnow() - timedelta(days=5),
            )
            job.tags = job_tags
            db.add(job)
            jobs.append(job)
        await db.flush()
        
        # 4. 创建候选人
        candidate = Candidate(
            user_id=candidate_user.id,
            resume_text="张三，5年Python开发经验，精通FastAPI、Django框架，熟悉React前端开发",
            is_profile_complete=True,
            last_analysis_at=datetime.utcnow(),
        )
        db.add(candidate)
        await db.flush()
        
        # 5. 创建候选人画像
        profile = CandidateProfile(
            candidate_id=candidate.id,
            display_name="张三",
            current_role="高级后端工程师",
            experience_years=5.0,
            summary="拥有5年Python开发经验的全栈工程师，擅长后端架构设计和前端交互实现。",
            ideal_job_persona="适合技术驱动型团队，追求代码质量和工程效率，喜欢解决复杂技术挑战。",
            salary_range="¥40k - ¥60k",
            market_demand="市场需求旺盛，全栈工程师持续紧缺",
            radar_data=[
                {"subject": "技术能力", "value": 85},
                {"subject": "项目经验", "value": 80},
                {"subject": "沟通能力", "value": 75},
                {"subject": "学习能力", "value": 90},
                {"subject": "团队协作", "value": 85},
                {"subject": "领导力", "value": 70}
            ],
            interview_questions=[
                "请描述一个你主导的复杂项目，遇到的最大挑战是什么？",
                "如何在保证代码质量的同时提高开发效率？",
                "谈谈你对微服务架构的理解和实践经验。"
            ],
            optimization_suggestions=[
                "建议增加具体的项目成果数据，如性能提升百分比",
                "可以补充开源项目贡献或技术博客链接",
                "建议突出团队协作和跨部门沟通经验"
            ],
            agent_feedbacks=[
                {"agentName": "技术专家", "type": "Technical", "comment": "技术基础扎实，对新技术保持学习热情", "score": 85},
                {"agentName": "HRBP", "type": "SoftSkills", "comment": "沟通表达清晰，团队意识强", "score": 82},
                {"agentName": "战略顾问", "type": "Strategy", "comment": "职业规划清晰，建议加强管理能力培养", "score": 80}
            ],
        )
        db.add(profile)
        
        # 6. 创建技能
        skills = ["Python", "FastAPI", "Django", "React", "PostgreSQL", "Docker"]
        for skill_name in skills:
            skill = Skill(candidate_id=candidate.id, name=skill_name)
            db.add(skill)
        await db.flush()
        
        # 7. 创建招聘流程
        flows_data = [
            {
                "job": jobs[0],
                "status": FlowStatus.INTERVIEWING,
                "stage": FlowStage.FIRST_INTERVIEW,
                "step": 3,
                "match_score": 92,
            },
            {
                "job": jobs[1],
                "status": FlowStatus.BENCHMARKING,
                "stage": FlowStage.BENCHMARK,
                "step": 2,
                "match_score": 85,
            },
            {
                "job": jobs[2],
                "status": FlowStatus.OFFER,
                "stage": FlowStage.FINAL,
                "step": 5,
                "match_score": 88,
            },
        ]
        
        for flow_data in flows_data:
            flow = Flow(
                candidate_id=candidate.id,
                job_id=flow_data["job"].id,
                recruiter_id=hr_user.id,
                status=flow_data["status"],
                current_stage=flow_data["stage"],
                current_step=flow_data["step"],
                match_score=flow_data["match_score"],
                agents_used=["简历解析智能体", "职位对标智能体"],
                tokens_consumed=1500,
            )
            db.add(flow)
            await db.flush()
            
            # 创建流程步骤
            stages = [
                (FlowStage.PARSE, "解析", 1, True),
                (FlowStage.BENCHMARK, "对标", 2, flow_data["step"] > 2),
                (FlowStage.FIRST_INTERVIEW, "初试", 3, flow_data["step"] > 3),
                (FlowStage.SECOND_INTERVIEW, "复试", 4, flow_data["step"] > 4),
                (FlowStage.FINAL, "终审", 5, flow_data["step"] == 5),
            ]
            
            for stage, name, order, is_completed in stages:
                step = FlowStep(
                    flow_id=flow.id,
                    name=name,
                    stage=stage,
                    order=order,
                    is_completed=is_completed,
                    completed_at=datetime.utcnow() if is_completed else None,
                )
                db.add(step)
            
            # 创建时间线
            timeline = FlowTimeline(
                flow_id=flow.id,
                action="流程创建",
                agent_name="系统",
                tokens_used=100,
            )
            db.add(timeline)
        
        # 8. 创建待办任务
        todos_data = [
            {
                "title": "设置个人职业画像",
                "description": "通过上传简历并解析，构建您的多维能力雷达图。这是开启 AI 智能推荐的第一步，帮助我们的多智能体系统理解您的核心竞争力。",
                "status": TodoStatus.PENDING,
                "priority": TodoPriority.HIGH,
                "source": TodoSource.AGENT,
                "todo_type": TodoType.CANDIDATE,
                "progress": 0,
                "icon": "UserIcon",
                "ai_advice": "系统检测到您最近在 Github 活跃频繁，建议同步开源项目经历，可提升画像完整度 25%。",
                "steps": [
                    {"name": "任务启动与初始化", "done": True},
                    {"name": "核心信息收集", "done": False},
                    {"name": "AI 分析与建议", "done": False},
                    {"name": "方案优化与确认", "done": False},
                ],
                "due_date": datetime.utcnow() + timedelta(days=5),
            },
            {
                "title": "优化求职意向设置",
                "description": "完善您的求职意向，包括期望城市、薪资范围和行业偏好。精准的求职意向能帮助 AI 猎头更高效地为您匹配目标岗位。",
                "status": TodoStatus.IN_PROGRESS,
                "priority": TodoPriority.MEDIUM,
                "source": TodoSource.USER,
                "todo_type": TodoType.CANDIDATE,
                "progress": 20,
                "icon": "Building2",
                "ai_advice": "建议补充期望的技术方向和团队规模偏好，可提升职位匹配精准度 30%。",
                "steps": [
                    {"name": "任务启动与初始化", "done": True},
                    {"name": "核心信息收集", "done": True},
                    {"name": "AI 分析与建议", "done": False},
                    {"name": "方案优化与确认", "done": False},
                ],
                "due_date": datetime.utcnow() + timedelta(days=10),
            },
            {
                "title": "完善 AI 简历分析模块",
                "description": "优化多智能体协作流程，提升分析准确性",
                "status": TodoStatus.IN_PROGRESS,
                "priority": TodoPriority.HIGH,
                "source": TodoSource.AGENT,
                "todo_type": TodoType.SYSTEM,
                "progress": 65,
                "icon": "UserIcon",
                "ai_advice": "建议增加更多行业特定的关键词提取规则。",
                "steps": [
                    {"name": "需求分析", "done": True},
                    {"name": "算法优化", "done": True},
                    {"name": "测试验证", "done": False},
                    {"name": "上线部署", "done": False},
                ],
                "due_date": datetime.utcnow() + timedelta(days=2),
            },
            {
                "title": "对接字节跳动职位",
                "description": "完成职位对标和简历投递",
                "status": TodoStatus.PENDING,
                "priority": TodoPriority.MEDIUM,
                "source": TodoSource.USER,
                "todo_type": TodoType.CANDIDATE,
                "progress": 30,
                "icon": "Building2",
                "ai_advice": "该职位竞争激烈，建议突出大模型和 AI 相关经验。",
                "steps": [
                    {"name": "职位分析", "done": True},
                    {"name": "简历定制", "done": False},
                    {"name": "投递申请", "done": False},
                ],
                "due_date": datetime.utcnow() + timedelta(days=5),
            },
            {
                "title": "准备技术面试",
                "description": "AI 智能体已生成针对性面试题库",
                "status": TodoStatus.PENDING,
                "priority": TodoPriority.HIGH,
                "source": TodoSource.AGENT,
                "todo_type": TodoType.CANDIDATE,
                "progress": 0,
                "icon": "Calendar",
                "ai_advice": "建议重点复习分布式系统和大模型应用相关知识。",
                "steps": [
                    {"name": "题库生成", "done": True},
                    {"name": "模拟练习", "done": False},
                    {"name": "反馈优化", "done": False},
                ],
                "due_date": datetime.utcnow() + timedelta(days=3),
            },
            {
                "title": "生成人才画像",
                "description": "AI 智能体将自动分析您的职业背景",
                "status": TodoStatus.RUNNING,
                "priority": TodoPriority.HIGH,
                "source": TodoSource.AGENT,
                "todo_type": TodoType.CANDIDATE,
                "progress": 50,
                "icon": "UserIcon",
                "ai_advice": "正在分析您的技能矩阵和行业经验。",
                "steps": [
                    {"name": "数据收集", "done": True},
                    {"name": "AI 分析", "done": False},
                    {"name": "画像生成", "done": False},
                ],
                "due_date": datetime.utcnow() + timedelta(days=1),
            },
        ]
        
        for todo_data in todos_data:
            todo = Todo(
                user_id=candidate_user.id,
                **todo_data,
            )
            db.add(todo)
        
        # 9. 为测试用户创建任务
        test_user = await db.execute(select(User).where(User.email == "test@example.com"))
        test_user = test_user.scalar_one_or_none()
        
        if test_user:
            test_todos = [
                {
                    "title": "完成职业画像分析",
                    "description": "AI 正在分析您的简历和技能，生成专属职业画像",
                    "status": TodoStatus.IN_PROGRESS,
                    "priority": TodoPriority.HIGH,
                    "source": TodoSource.AGENT,
                    "todo_type": TodoType.CANDIDATE,
                    "progress": 60,
                    "icon": "UserIcon",
                    "ai_advice": "建议补充最近的项目经验，可以提升匹配度",
                    "steps": json.dumps([
                        {"name": "简历解析", "done": True},
                        {"name": "技能提取", "done": True},
                        {"name": "画像生成", "done": False},
                    ]),
                    "due_date": datetime.utcnow() + timedelta(days=1),
                },
                {
                    "title": "智能职位推荐",
                    "description": "基于您的画像，AI 正在匹配最佳职位",
                    "status": TodoStatus.RUNNING,
                    "priority": TodoPriority.HIGH,
                    "source": TodoSource.AGENT,
                    "todo_type": TodoType.CANDIDATE,
                    "progress": 30,
                    "icon": "Building2",
                    "ai_advice": "已找到 5 个高度匹配的职位，点击查看详情",
                    "steps": json.dumps([
                        {"name": "职位搜索", "done": True},
                        {"name": "匹配分析", "done": False},
                        {"name": "推荐排序", "done": False},
                    ]),
                    "due_date": datetime.utcnow() + timedelta(days=2),
                },
                {
                    "title": "面试模拟准备",
                    "description": "AI 面试官将帮您准备面试",
                    "status": TodoStatus.PENDING,
                    "priority": TodoPriority.MEDIUM,
                    "source": TodoSource.AGENT,
                    "todo_type": TodoType.CANDIDATE,
                    "progress": 0,
                    "icon": "Calendar",
                    "ai_advice": "根据目标职位，建议重点准备算法和系统设计",
                    "steps": json.dumps([
                        {"name": "题库生成", "done": False},
                        {"name": "模拟面试", "done": False},
                        {"name": "反馈优化", "done": False},
                    ]),
                    "due_date": datetime.utcnow() + timedelta(days=5),
                },
            ]
            
            for todo_data in test_todos:
                todo = Todo(
                    user_id=test_user.id,
                    **todo_data,
                )
                db.add(todo)
        
        # 10. 为企业测试用户创建任务
        hr_user = await db.execute(select(User).where(User.email == "hr@devnors.com"))
        hr_user = hr_user.scalar_one_or_none()
        
        if hr_user:
            hr_todos = [
                {
                    "title": "筛选候选人简历",
                    "description": "AI 正在分析收到的简历，筛选优质候选人",
                    "status": TodoStatus.IN_PROGRESS,
                    "priority": TodoPriority.HIGH,
                    "source": TodoSource.AGENT,
                    "todo_type": TodoType.EMPLOYER,
                    "progress": 45,
                    "icon": "UserIcon",
                    "ai_advice": "已筛选出 12 份高匹配简历，建议优先查看",
                    "steps": json.dumps([
                        {"name": "简历收集", "done": True},
                        {"name": "初步筛选", "done": True},
                        {"name": "深度分析", "done": False},
                    ]),
                    "due_date": datetime.utcnow() + timedelta(days=1),
                },
                {
                    "title": "安排面试日程",
                    "description": "协调候选人和面试官时间",
                    "status": TodoStatus.PENDING,
                    "priority": TodoPriority.MEDIUM,
                    "source": TodoSource.USER,
                    "todo_type": TodoType.EMPLOYER,
                    "progress": 0,
                    "icon": "Calendar",
                    "ai_advice": "建议在本周内完成首轮面试",
                    "steps": json.dumps([
                        {"name": "确认时间", "done": False},
                        {"name": "发送邀请", "done": False},
                        {"name": "面试准备", "done": False},
                    ]),
                    "due_date": datetime.utcnow() + timedelta(days=3),
                },
                {
                    "title": "生成人才分析报告",
                    "description": "AI 自动生成候选人综合评估报告",
                    "status": TodoStatus.COMPLETED,
                    "priority": TodoPriority.LOW,
                    "source": TodoSource.AGENT,
                    "todo_type": TodoType.EMPLOYER,
                    "progress": 100,
                    "icon": "Building2",
                    "ai_advice": "报告已生成，包含技能评估、文化匹配度等",
                    "steps": json.dumps([
                        {"name": "数据收集", "done": True},
                        {"name": "AI 分析", "done": True},
                        {"name": "报告生成", "done": True},
                    ]),
                    "due_date": datetime.utcnow() - timedelta(days=1),
                },
            ]
            
            for todo_data in hr_todos:
                todo = Todo(
                    user_id=hr_user.id,
                    **todo_data,
                )
                db.add(todo)
        
        # 11. 为管理员用户创建任务
        admin_todos = [
            {
                "title": "系统健康检查",
                "description": "AI 正在进行平台系统健康检查",
                "status": TodoStatus.COMPLETED,
                "priority": TodoPriority.HIGH,
                "source": TodoSource.AGENT,
                "todo_type": TodoType.SYSTEM,
                "progress": 100,
                "icon": "Building2",
                "ai_advice": "所有系统运行正常，无异常",
                "steps": json.dumps([
                    {"name": "数据库检查", "done": True},
                    {"name": "API 检查", "done": True},
                    {"name": "AI 服务检查", "done": True},
                ]),
                "due_date": datetime.utcnow() - timedelta(hours=1),
            },
            {
                "title": "数据分析报告",
                "description": "生成平台使用数据分析报告",
                "status": TodoStatus.IN_PROGRESS,
                "priority": TodoPriority.MEDIUM,
                "source": TodoSource.AGENT,
                "todo_type": TodoType.SYSTEM,
                "progress": 45,
                "icon": "Calendar",
                "ai_advice": "正在统计本周用户活跃度和匹配成功率",
                "steps": json.dumps([
                    {"name": "数据收集", "done": True},
                    {"name": "统计分析", "done": False},
                    {"name": "报告生成", "done": False},
                ]),
                "due_date": datetime.utcnow() + timedelta(days=1),
            },
            {
                "title": "AI 模型优化",
                "description": "持续优化简历解析和职位匹配算法",
                "status": TodoStatus.RUNNING,
                "priority": TodoPriority.HIGH,
                "source": TodoSource.AGENT,
                "todo_type": TodoType.SYSTEM,
                "progress": 30,
                "icon": "UserIcon",
                "ai_advice": "正在训练新的匹配模型，预计提升 15% 准确率",
                "steps": json.dumps([
                    {"name": "数据准备", "done": True},
                    {"name": "模型训练", "done": False},
                    {"name": "效果验证", "done": False},
                ]),
                "due_date": datetime.utcnow() + timedelta(days=7),
            },
        ]
        
        for todo_data in admin_todos:
            todo = Todo(
                user_id=admin_user.id,
                **todo_data,
            )
            db.add(todo)
        
        # 12. 创建用户设置
        hr_user_obj = users[1]  # hr@devnors.com
        settings_data = UserSettings(
            user_id=hr_user_obj.id,
            display_name="得若智能科技",
            contact_email="admin@devnors.com",
            contact_name="陈先生",
            contact_phone="138-0000-8888",
            address="北京市海淀区中关村大街1号",
            website="https://www.devnors.com",
            industry="人工智能",
            company_size="51-200人",
            description="Devnors 得若是一家专注于AI原生招聘平台的创新科技公司，通过多智能体协同技术，为企业提供精准的人才匹配解决方案。",
            notification_enabled=True,
            dark_mode=False
        )
        db.add(settings_data)
        
        # 13. 企业认证信息（不再预置虚假数据，由用户通过认证流程真实上传）
        
        # 14. 创建个人认证信息（为候选人用户）
        personal_certs = [
            # 身份认证
            {
                "name": "实名认证",
                "organization": "公安部身份认证系统",
                "cert_date": "2024-01-15",
                "category": "identity",
                "color": "bg-blue-50 border-blue-200",
                "icon": "IdCard"
            },
            {
                "name": "人脸识别认证",
                "organization": "支付宝人脸核身",
                "cert_date": "2024-01-15",
                "category": "identity",
                "color": "bg-blue-50 border-blue-200",
                "icon": "Scan"
            },
            # 学历认证
            {
                "name": "清华大学",
                "organization": "清华大学",
                "cert_date": "2018-06",
                "category": "education",
                "degree": "硕士",
                "major": "计算机科学与技术",
                "color": "bg-indigo-50 border-indigo-200",
                "icon": "GraduationCap"
            },
            {
                "name": "北京大学",
                "organization": "北京大学",
                "cert_date": "2015-06",
                "category": "education",
                "degree": "学士",
                "major": "软件工程",
                "color": "bg-emerald-50 border-emerald-200",
                "icon": "GraduationCap"
            },
            {
                "name": "PMP 项目管理专业人士",
                "organization": "PMI",
                "cert_date": "2020-03",
                "category": "career",
                "color": "bg-amber-50 border-amber-200",
                "icon": "Briefcase"
            },
            {
                "name": "AWS 认证解决方案架构师",
                "organization": "Amazon",
                "cert_date": "2021-09",
                "category": "career",
                "color": "bg-orange-50 border-orange-200",
                "icon": "Briefcase"
            },
            {
                "name": "国家软件设计师",
                "organization": "工信部",
                "cert_date": "2019-11",
                "category": "career",
                "color": "bg-blue-50 border-blue-200",
                "icon": "Briefcase"
            },
            {
                "name": "个人征信报告",
                "organization": "中国人民银行",
                "cert_date": "2024-01-10",
                "category": "credit",
                "score": 780,
                "color": "bg-emerald-50 border-emerald-200",
                "icon": "FileText"
            },
            {
                "name": "司法记录核查",
                "organization": "公安部",
                "cert_date": "2024-01-10",
                "category": "credit",
                "score": 100,
                "level": "无记录",
                "color": "bg-emerald-50 border-emerald-200",
                "icon": "ShieldCheck"
            },
            {
                "name": "国家科技进步奖",
                "organization": "科技部",
                "cert_date": "2022",
                "category": "award",
                "level": "一等奖",
                "color": "bg-purple-50 border-purple-200",
                "icon": "Medal"
            },
            {
                "name": "中国AI创新人物",
                "organization": "中国人工智能学会",
                "cert_date": "2023",
                "category": "award",
                "level": "年度",
                "color": "bg-amber-50 border-amber-200",
                "icon": "Award"
            },
            {
                "name": "最佳论文奖",
                "organization": "IEEE",
                "cert_date": "2021",
                "category": "award",
                "level": "优秀",
                "color": "bg-rose-50 border-rose-200",
                "icon": "Trophy"
            },
        ]
        
        for cert_data in personal_certs:
            cert = PersonalCertification(
                user_id=candidate_user.id,
                name=cert_data["name"],
                organization=cert_data["organization"],
                cert_date=cert_data["cert_date"],
                category=cert_data["category"],
                degree=cert_data.get("degree"),
                major=cert_data.get("major"),
                score=cert_data.get("score"),
                level=cert_data.get("level"),
                color=cert_data.get("color"),
                icon=cert_data.get("icon"),
                status=CertificationStatus.VALID
            )
            db.add(cert)
        
        # 15. 创建AI引擎配置
        ai_configs = [
            {"task": "基础解析对接", "model_name": "Devnors 1.0", "provider": "Devnors"},
            {"task": "高级智能解析", "model_name": "Devnors 1.0 Pro", "provider": "Devnors"},
            {"task": "顶级智能性能拉满", "model_name": "Devnors 1.0 Ultra", "provider": "Devnors"},
        ]
        
        for config_data in ai_configs:
            config = AIEngineConfig(
                user_id=hr_user_obj.id,
                **config_data
            )
            db.add(config)
        
        # 16. 创建API密钥
        api_key = APIKey(
            user_id=hr_user_obj.id,
            key="devnors_sk_live_f7a8b9c0d1e2f3g4h5i6j7k8l9m0",
            name="Production Key",
            environment="production",
            is_active=True
        )
        db.add(api_key)
        
        # 17. 创建团队成员
        team_members_data = [
            {"invited_email": "wang@devnors.com", "role": UserRole.ADMIN, "status": "active"},
            {"invited_email": "li@devnors.com", "role": UserRole.RECRUITER, "status": "active"},
            {"invited_email": "chen@devnors.com", "role": UserRole.VIEWER, "status": "invited"},
        ]
        
        for member_data in team_members_data:
            member = TeamMember(
                owner_id=hr_user_obj.id,
                **member_data
            )
            db.add(member)
        
        # 18. 创建审计日志
        audit_logs_data = [
            {"action": "API Key 被用于导出简历", "actor": "System Bot", "ip_address": "192.168.1.1"},
            {"action": "账户设置被修改: 联系邮箱", "actor": "王经理", "ip_address": "172.16.0.42"},
            {"action": "新成员被邀请加入团队", "actor": "王经理", "ip_address": "172.16.0.42"},
            {"action": "用户登录成功", "actor": "系统管理员", "ip_address": "127.0.0.1"},
            {"action": "职位信息更新: 高级AI工程师", "actor": "李招聘", "ip_address": "192.168.1.100"},
        ]
        
        for log_data in audit_logs_data:
            log = AuditLog(
                user_id=hr_user_obj.id,
                **log_data
            )
            db.add(log)
        
        await db.commit()
        print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
