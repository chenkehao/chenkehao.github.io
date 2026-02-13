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
from app.models.order import Order, OrderType, OrderStatus, PaymentMethod
from app.models.admin_role import AdminRole, PRESET_ROLES
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

        # 1.5 创建管理员角色
        import json as _json
        admin_roles = {}
        for role_name, role_info in PRESET_ROLES.items():
            role = AdminRole(
                name=role_name,
                display_name=role_info["display_name"],
                description=role_info["description"],
                permissions_json=_json.dumps(role_info["permissions"], ensure_ascii=False),
                is_system=True,
            )
            db.add(role)
            admin_roles[role_name] = role
        await db.flush()

        # 将超级管理员角色关联到 admin 用户
        admin_user.admin_role_id = admin_roles["super_admin"].id
        await db.flush()

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
            # 企业用户的真实业务任务（认证、资料完善）会在实际流程中动态创建
            # 不再预置虚假的"筛选简历"、"安排面试"等占位任务
            hr_todos = [
                {
                    "title": "完成企业认证",
                    "description": "上传营业执照等企业资质认证文件",
                    "status": TodoStatus.PENDING,
                    "priority": TodoPriority.HIGH,
                    "source": TodoSource.AGENT,
                    "todo_type": TodoType.EMPLOYER,
                    "progress": 0,
                    "icon": "Shield",
                    "ai_advice": "完成企业认证可提升招聘可信度",
                    "steps": json.dumps([
                        {"name": "上传营业执照", "done": False},
                        {"name": "认证审核", "done": False},
                    ]),
                    "due_date": datetime.utcnow() + timedelta(days=7),
                },
                {
                    "title": "完善企业资料",
                    "description": "补充企业基本信息，提升招聘效果",
                    "status": TodoStatus.PENDING,
                    "priority": TodoPriority.HIGH,
                    "source": TodoSource.AGENT,
                    "todo_type": TodoType.EMPLOYER,
                    "progress": 0,
                    "icon": "Building2",
                    "ai_advice": "完善企业资料后可开始智能招聘",
                    "steps": json.dumps([
                        {"name": "填写企业信息", "done": False},
                        {"name": "设置福利待遇", "done": False},
                    ]),
                    "due_date": datetime.utcnow() + timedelta(days=7),
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
            {"action": "API Key 被用于导出简历", "actor": "System Bot", "ip_address": "192.168.1.1", "category": "api", "risk_level": "info"},
            {"action": "账户设置被修改: 联系邮箱", "actor": "王经理", "ip_address": "172.16.0.42", "category": "data", "risk_level": "info"},
            {"action": "新成员被邀请加入团队", "actor": "王经理", "ip_address": "172.16.0.42", "category": "data", "risk_level": "warning"},
            {"action": "用户登录成功", "actor": "系统管理员", "ip_address": "127.0.0.1", "category": "auth", "risk_level": "info"},
            {"action": "登录失败（密码错误）：admin@test.com", "actor": "未知用户", "ip_address": "203.0.113.42", "category": "auth", "risk_level": "danger"},
            {"action": "移交管理员权限给用户 3", "actor": "管理员", "ip_address": "172.16.0.42", "category": "system", "risk_level": "danger"},
            {"action": "生成新API密钥", "actor": "王经理", "ip_address": "172.16.0.42", "category": "api", "risk_level": "warning"},
            {"action": "AI 对话（消耗 1240 tokens）", "actor": "系统", "ip_address": "127.0.0.1", "category": "ai", "risk_level": "info"},
            {"action": "职位信息更新: 高级AI工程师", "actor": "李招聘", "ip_address": "192.168.1.100", "category": "data", "risk_level": "info"},
            {"action": "AI 对话（消耗 856 tokens）", "actor": "系统", "ip_address": "127.0.0.1", "category": "ai", "risk_level": "info"},
            {"action": "用户登录成功", "actor": "王经理", "ip_address": "172.16.0.42", "category": "auth", "risk_level": "info"},
            {"action": "新用户注册：test@devnors.com", "actor": "test", "ip_address": "10.0.0.5", "category": "auth", "risk_level": "info"},
        ]
        
        for log_data in audit_logs_data:
            log = AuditLog(
                user_id=hr_user_obj.id,
                **log_data
            )
            db.add(log)
        
        await db.commit()

        # 19. 创建版本更新记录（基于真实 git 提交记录）
        from app.models.changelog import Changelog
        NC = 'text-emerald-600 bg-emerald-50'
        OC = 'text-indigo-600 bg-indigo-50'
        FC = 'text-amber-600 bg-amber-50'
        changelog_records = [
            # v1.0.0 - 2026-02-02 - commit aea9a9f
            Changelog(version='v1.0.0', date='2026-02-02', tag='首发', tag_color='bg-indigo-100 text-indigo-700', item_type='新功能', item_color=NC, description='AI 助手底部新增快捷操作提示栏，引导用户快速使用核心功能', commit_hash='aea9a9f', sort_order=1),
            Changelog(version='v1.0.0', date='2026-02-02', tag='首发', tag_color='bg-indigo-100 text-indigo-700', item_type='新功能', item_color=NC, description='定价方案页面上线，展示默认/Pro/Ultra 三档套餐及功能对比', commit_hash='aea9a9f', sort_order=2),
            Changelog(version='v1.0.0', date='2026-02-02', tag='首发', tag_color='bg-indigo-100 text-indigo-700', item_type='新功能', item_color=NC, description='页脚新增定价方案入口链接', commit_hash='aea9a9f', sort_order=3),
            # v1.0.1 - 2026-02-03 - commit 994484b
            Changelog(version='v1.0.1', date='2026-02-03', item_type='优化', item_color=OC, description='定价方案套餐内容和价格调整优化', commit_hash='994484b', sort_order=1),
            Changelog(version='v1.0.1', date='2026-02-03', item_type='优化', item_color=OC, description='全站 UI 样式细节优化', commit_hash='994484b', sort_order=2),
            # v1.0.2 - 2026-02-04 - commit 90051e5
            Changelog(version='v1.0.2', date='2026-02-04', item_type='新功能', item_color=NC, description='完整后端 API 系统搭建（FastAPI + SQLAlchemy + SQLite）', commit_hash='90051e5', sort_order=1),
            Changelog(version='v1.0.2', date='2026-02-04', item_type='新功能', item_color=NC, description='后端模型层：用户、候选人、岗位、Flow 工作流、Token 计费、记忆系统等全部数据模型', commit_hash='90051e5', sort_order=2),
            Changelog(version='v1.0.2', date='2026-02-04', item_type='新功能', item_color=NC, description='AI Agent 体系搭建：简历解析 Agent、面试评估 Agent、市场分析 Agent、路由调度 Agent', commit_hash='90051e5', sort_order=3),
            Changelog(version='v1.0.2', date='2026-02-04', item_type='新功能', item_color=NC, description='简历智能解析功能：上传 PDF/Word 后 AI 自动提取结构化信息并填充个人资料', commit_hash='90051e5', sort_order=4),
            Changelog(version='v1.0.2', date='2026-02-04', item_type='新功能', item_color=NC, description='用户认证系统（注册、登录、JWT Token 鉴权）', commit_hash='90051e5', sort_order=5),
            Changelog(version='v1.0.2', date='2026-02-04', item_type='新功能', item_color=NC, description='种子数据初始化脚本，包含测试用户、岗位、候选人等基础数据', commit_hash='90051e5', sort_order=6),
            # v1.0.3 - 2026-02-05 - commit 0cf7a6d
            Changelog(version='v1.0.3', date='2026-02-05', item_type='新功能', item_color=NC, description='企业认证任务功能上线，支持企业资质认证流程', commit_hash='0cf7a6d', sort_order=1),
            Changelog(version='v1.0.3', date='2026-02-05', item_type='新功能', item_color=NC, description='数据库迁移方案文档和 SQLite → MySQL 迁移脚本', commit_hash='0cf7a6d', sort_order=2),
            Changelog(version='v1.0.3', date='2026-02-05', item_type='新功能', item_color=NC, description='MySQL 索引优化 SQL 脚本，为生产环境部署做准备', commit_hash='0cf7a6d', sort_order=3),
            Changelog(version='v1.0.3', date='2026-02-05', item_type='优化', item_color=OC, description='系统设置页面功能扩展', commit_hash='0cf7a6d', sort_order=4),
            Changelog(version='v1.0.3', date='2026-02-05', item_type='优化', item_color=OC, description='前端 apiService 新增多个后端接口调用方法', commit_hash='0cf7a6d', sort_order=5),
            # v1.0.4 - 2026-02-06 - commits 767687e + e3d0533
            Changelog(version='v1.0.4', date='2026-02-06', item_type='新功能', item_color=NC, description='深色模式支持与优化', commit_hash='767687e', sort_order=1),
            Changelog(version='v1.0.4', date='2026-02-06', item_type='新功能', item_color=NC, description='团队成员管理功能：邀请、角色分配、成员列表', commit_hash='767687e', sort_order=2),
            Changelog(version='v1.0.4', date='2026-02-06', item_type='新功能', item_color=NC, description='登录系统重构：支持手机号验证码登录和密码登录双模式', commit_hash='767687e', sort_order=3),
            Changelog(version='v1.0.4', date='2026-02-06', item_type='新功能', item_color=NC, description='系统设置后端 API 大幅扩展：AI 引擎配置、API Key 管理、审计日志基础功能', commit_hash='767687e', sort_order=4),
            Changelog(version='v1.0.4', date='2026-02-06', item_type='新功能', item_color=NC, description='.gitignore 配置完善，排除敏感文件和编译产物', commit_hash='767687e', sort_order=5),
            Changelog(version='v1.0.4', date='2026-02-06', item_type='修复', item_color=FC, description='修复点击岗位卡片跳转到岗位列表而非岗位详情页的问题', commit_hash='e3d0533', sort_order=6),
            Changelog(version='v1.0.4', date='2026-02-06', item_type='优化', item_color=OC, description='前端大量页面组件优化重构（3500+ 行变更）', commit_hash='e3d0533', sort_order=7),
            # v1.0.5 - 2026-02-07 - commits 3920cc2 + 18162f3
            Changelog(version='v1.0.5', date='2026-02-07', item_type='新功能', item_color=NC, description='账户体系完善：身份切换（求职者/企业方）、角色权限区分', commit_hash='3920cc2', sort_order=1),
            Changelog(version='v1.0.5', date='2026-02-07', item_type='新功能', item_color=NC, description='任务中心筛选功能：支持按来源（Agent 分发/我创建的/已完成）快速过滤', commit_hash='3920cc2', sort_order=2),
            Changelog(version='v1.0.5', date='2026-02-07', item_type='新功能', item_color=NC, description='AI 模型选择功能：用户可在设置中切换 AI 引擎偏好', commit_hash='3920cc2', sort_order=3),
            Changelog(version='v1.0.5', date='2026-02-07', item_type='优化', item_color=OC, description='Todo 数据模型重构优化', commit_hash='3920cc2', sort_order=4),
            Changelog(version='v1.0.5', date='2026-02-07', item_type='优化', item_color=OC, description='Navbar 下拉菜单宽度优化，防止文字换行导致布局错乱', commit_hash='18162f3', sort_order=5),
            # v1.0.6 - 2026-02-08 - commit 8e32887
            Changelog(version='v1.0.6', date='2026-02-08', item_type='新功能', item_color=NC, description='招聘助手快捷操作按钮，支持从 AI 对话中快速触发常用功能', commit_hash='8e32887', sort_order=1),
            Changelog(version='v1.0.6', date='2026-02-08', item_type='新功能', item_color=NC, description='个性化招聘建议功能，AI 基于企业记忆生成定制化招聘策略', commit_hash='8e32887', sort_order=2),
            Changelog(version='v1.0.6', date='2026-02-08', item_type='优化', item_color=OC, description='后端系统设置 API 重构优化（549+ 行变更）', commit_hash='8e32887', sort_order=3),
            Changelog(version='v1.0.6', date='2026-02-08', item_type='优化', item_color=OC, description='种子数据精简，移除冗余测试数据', commit_hash='8e32887', sort_order=4),
            # v1.0.7 - 2026-02-09 - commit 0e5bcef
            Changelog(version='v1.0.7', date='2026-02-09', item_type='新功能', item_color=NC, description='工作台 AI 对接队列动态化，按用户角色展示智能招聘/智能投递数据', commit_hash='0e5bcef', sort_order=1),
            Changelog(version='v1.0.7', date='2026-02-09', item_type='新功能', item_color=NC, description='后端新增 Invitation 邀请模型，支持 AI 智能邀请数据持久化', commit_hash='0e5bcef', sort_order=2),
            Changelog(version='v1.0.7', date='2026-02-09', item_type='新功能', item_color=NC, description='公共 API 大幅扩展（3581 行新增）：智能邀请、智能投递、消息通知、工单系统、帮助中心等', commit_hash='0e5bcef', sort_order=3),
            Changelog(version='v1.0.7', date='2026-02-09', item_type='新功能', item_color=NC, description='Token 计费模型新增动作类型字段，精确记录各 AI 功能消耗', commit_hash='0e5bcef', sort_order=4),
            Changelog(version='v1.0.7', date='2026-02-09', item_type='优化', item_color=OC, description='前端 App.tsx 大规模功能整合（4491 行变更），新增多个页面组件', commit_hash='0e5bcef', sort_order=5),
            Changelog(version='v1.0.7', date='2026-02-09', item_type='优化', item_color=OC, description='用户认证接口优化，新增用户 Schema 字段', commit_hash='0e5bcef', sort_order=6),
            Changelog(version='v1.0.7', date='2026-02-09', item_type='优化', item_color=OC, description='前端 API 服务层新增 349 行接口调用方法', commit_hash='0e5bcef', sort_order=7),
            # v1.0.8 - 2026-02-10
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='反馈建议页面上线，支持用户提交 Bug 反馈、功能建议、问题咨询、投诉工单', sort_order=1),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='帮助中心页面上线，集成 FAQ 列表 + AI 智能问答，支持多分类', sort_order=2),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='版本更新页面上线，支持平台更新日志 + Agent 版本说明双 Tab 展示', sort_order=3),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='法律合规页面矩阵上线：服务条款、隐私政策、个人信息保护、算法说明、版权声明、未成年人保护', sort_order=4),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='Token 余额不足智能提醒弹窗，AI 调用失败时自动触发充值引导', sort_order=5),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='后端新增 Notification、Ticket、Changelog 数据模型及完整 CRUD API', sort_order=6),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='审计日志增强：支持分类筛选、统计概览、CSV 导出', sort_order=7),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='Webhook API 上线：支持创建、更新、删除、测试回调端点', sort_order=8),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='新功能', item_color=NC, description='API 密钥管理增强：支持切换启用/禁用、重新生成密钥、调用统计', sort_order=9),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='优化', item_color=OC, description='6 个法律页面视觉样式统一美化，页头卡片 + 文档容器 + prose 排版优化', sort_order=10),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='优化', item_color=OC, description='Agent 更新内容精简，技术参数从 7 条缩减为 2 条，展示更紧凑', sort_order=11),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='优化', item_color=OC, description='页脚社交图标更换为微信/抖音/小红书/轻识，法律链接改为 React Router 跳转', sort_order=12),
            Changelog(version='v1.0.8', date='2026-02-10', item_type='优化', item_color=OC, description='前端 App.tsx 功能整合（4746 行变更），后端 API 大幅扩展（6367 行新增）', sort_order=13),
            # v1.0.9 - 2026-02-12
            Changelog(version='v1.0.9', date='2026-02-12', item_type='新功能', item_color=NC, description='自定义大模型接入功能上线（Ultra 专属）：支持接入 GPT-4o、GPT-o3、Claude 4 Opus、Gemini 2.5 Pro、DeepSeek R1、Qwen 3、Grok 3 等 7 款顶级大模型', sort_order=1),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='新功能', item_color=NC, description='大模型接入/断开功能：通过 API Key 一键接入自有大模型，已接入模型支持一键断开', sort_order=2),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='新功能', item_color=NC, description='AI 思考过程折叠组件（ThinkingBlock）：参考 ChatGPT thinking 样式，支持展开查看完整深度分析过程', sort_order=3),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='新功能', item_color=NC, description='深色模式切换移至 Navbar 用户菜单，操作更便捷，附带开关动画', sort_order=4),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='新功能', item_color=NC, description='AI 助手快捷提示动态化：底部快捷操作随任务类型及进度状态智能变化', sort_order=5),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='新功能', item_color=NC, description='新增 deleteAIConfig API 接口，支持删除已接入的 AI 引擎配置', sort_order=6),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='优化', item_color=OC, description='深色模式全站彻底优化：参考 Google AI Studio 深色主题，颜色更深更沉，层次分明（791 行 CSS 重写）', sort_order=7),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='优化', item_color=OC, description='深色模式新增 400+ 条 CSS 覆盖规则：透明度变体、渐变端点、Hover/Focus/Disabled 状态全覆盖', sort_order=8),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='优化', item_color=OC, description='Navbar 用户下拉菜单 UI 全面优化：统一间距、分隔线、hover 样式，图标对齐', sort_order=9),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='优化', item_color=OC, description='设置页面结构重组："账户等级 + AI 引擎配置" 合并为 "自定义大模型"，"API 与集成" 独立 Tab', sort_order=10),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='优化', item_color=OC, description='切换身份后统一跳转至 AI 助手页面，提升用户体验一致性', sort_order=11),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='优化', item_color=OC, description='定价方案页面新增自定义大模型接入功能说明，Ultra 方案标记 Token +20% 通道服务费', sort_order=12),
            Changelog(version='v1.0.9', date='2026-02-12', item_type='优化', item_color=OC, description='前端 App.tsx 大规模重构（939 行变更），index.html 深色模式全量重写（791 行变更）', sort_order=13),
            # v1.0.10 - 2026-02-12
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='新功能', item_color=NC, description='法律页面全面重构为 Apple 官网风格：大标题、无卡片边框、渐变分隔线、优化行高与段间距', sort_order=1),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='新功能', item_color=NC, description='Navbar Token 余额数字滚动动画：数据变化时从旧值平滑过渡至新值，easeOutCubic 缓动 + 颜色高亮', sort_order=2),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='新功能', item_color=NC, description='帮助中心布局优化：左侧 FAQ 自然展开、右侧 AI 问答 sticky 固定在视口，聊天区域内部自动滚到最新消息', sort_order=3),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='新功能', item_color=NC, description='Token 管理页邀请区域主色调统一为 indigo-purple 渐变，与邀请页面视觉风格一致', sort_order=4),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='修复', item_color=FC, description='修复全站 UTC+8 时区偏差：新增 parseUTC 辅助函数，16 处时间显示全部修正为本地时间', sort_order=5),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='修复', item_color=FC, description='修复 Token 管理页复制按钮无反馈：增加 Clipboard API + execCommand fallback 双保险，复制成功显示 ✓ 已复制', sort_order=6),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='修复', item_color=FC, description='修复帮助中心进入后自动滚动到底部的问题', sort_order=7),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='优化', item_color=OC, description='全站 mock 数据日期从 2024 统一更新为 2026，版权年份同步更新', sort_order=8),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='优化', item_color=OC, description='招聘流程薪资图标从 Coins 改为 CircleDollarSign 货币符号，语义更准确', sort_order=9),
            Changelog(version='v1.0.10', date='2026-02-12', tag='最新', tag_color='bg-emerald-100 text-emerald-700', item_type='优化', item_color=OC, description='6 个法律页面（隐私政策/服务条款/版权声明/算法说明/个人信息保护/未成年人保护）正文行高、段间距、章节间距全面优化', sort_order=10),
        ]
        for cl in changelog_records:
            db.add(cl)

        # ── 订单/交易记录 ─────────────────────────────────────────────
        import random, string
        now = datetime.utcnow()

        order_templates = [
            # 用户购买套餐
            {"uid": 1000001, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 9.9, "orig": 9.9, "pm": PaymentMethod.WECHAT, "title": "Starter 套餐", "pkg": "starter", "days_ago": 30},
            {"uid": 1000002, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 9.9, "orig": 9.9, "pm": PaymentMethod.ALIPAY, "title": "Starter 套餐", "pkg": "starter", "days_ago": 28},
            {"uid": 1000003, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 29.9, "orig": 29.9, "pm": PaymentMethod.WECHAT, "title": "Pro 套餐", "pkg": "pro", "days_ago": 25},
            {"uid": 1000001, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 29.9, "orig": 39.9, "pm": PaymentMethod.ALIPAY, "title": "Pro 套餐（老用户优惠）", "pkg": "pro", "disc": 10, "days_ago": 20},
            {"uid": 1000004, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 9.9, "orig": 9.9, "pm": PaymentMethod.CREDIT_CARD, "title": "Starter 套餐", "pkg": "starter", "days_ago": 18},
            {"uid": 1000005, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 99.9, "orig": 99.9, "pm": PaymentMethod.BANK_TRANSFER, "title": "Enterprise 套餐", "pkg": "enterprise", "days_ago": 15},
            {"uid": 1000002, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 29.9, "orig": 29.9, "pm": PaymentMethod.WECHAT, "title": "Pro 套餐", "pkg": "pro", "days_ago": 12},
            {"uid": 1000006, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 9.9, "orig": 9.9, "pm": PaymentMethod.ALIPAY, "title": "Starter 套餐", "pkg": "starter", "days_ago": 10},
            {"uid": 1000003, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 99.9, "orig": 129.9, "pm": PaymentMethod.WECHAT, "title": "Enterprise 套餐（促销价）", "pkg": "enterprise", "disc": 30, "days_ago": 8},
            {"uid": 1000007, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 29.9, "orig": 29.9, "pm": PaymentMethod.ALIPAY, "title": "Pro 套餐", "pkg": "pro", "days_ago": 7},
            {"uid": 1000004, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 29.9, "orig": 29.9, "pm": PaymentMethod.WECHAT, "title": "Pro 套餐", "pkg": "pro", "days_ago": 5},
            {"uid": 1000008, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.PENDING, "amount": 9.9, "orig": 9.9, "pm": PaymentMethod.ALIPAY, "title": "Starter 套餐", "pkg": "starter", "days_ago": 3},
            {"uid": 1000005, "type": OrderType.SUBSCRIPTION, "status": OrderStatus.COMPLETED, "amount": 99.9, "orig": 99.9, "pm": PaymentMethod.BANK_TRANSFER, "title": "Enterprise 套餐续费", "pkg": "enterprise", "days_ago": 2},
            {"uid": 1000001, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.COMPLETED, "amount": 99.9, "orig": 99.9, "pm": PaymentMethod.CREDIT_CARD, "title": "Enterprise 套餐", "pkg": "enterprise", "days_ago": 1},
            {"uid": 1000009, "type": OrderType.PACKAGE_PURCHASE, "status": OrderStatus.FAILED, "amount": 29.9, "orig": 29.9, "pm": PaymentMethod.WECHAT, "title": "Pro 套餐（支付失败）", "pkg": "pro", "days_ago": 1},
            # 退款
            {"uid": 1000006, "type": OrderType.REFUND, "status": OrderStatus.COMPLETED, "amount": -9.9, "orig": 9.9, "pm": PaymentMethod.SYSTEM, "title": "退款 - Starter 套餐", "desc": "用户申请全额退款", "days_ago": 6},
            # 平台支出
            {"uid": None, "type": OrderType.PLATFORM_EXPENSE, "status": OrderStatus.COMPLETED, "amount": -156.80, "orig": 156.80, "pm": PaymentMethod.SYSTEM, "title": "MiniMax API 调用费", "desc": "2026年1月 MiniMax 大模型API调用成本", "days_ago": 14},
            {"uid": None, "type": OrderType.PLATFORM_EXPENSE, "status": OrderStatus.COMPLETED, "amount": -89.50, "orig": 89.50, "pm": PaymentMethod.SYSTEM, "title": "Gemini API 调用费", "desc": "2026年1月 Gemini API 调用成本", "days_ago": 14},
            {"uid": None, "type": OrderType.PLATFORM_EXPENSE, "status": OrderStatus.COMPLETED, "amount": -45.00, "orig": 45.00, "pm": PaymentMethod.SYSTEM, "title": "阿里云 OSS 存储费", "desc": "2026年1月对象存储服务费用", "days_ago": 13},
            {"uid": None, "type": OrderType.PLATFORM_EXPENSE, "status": OrderStatus.COMPLETED, "amount": -200.00, "orig": 200.00, "pm": PaymentMethod.BANK_TRANSFER, "title": "服务器托管费", "desc": "2026年2月腾讯云服务器费用", "days_ago": 4},
            {"uid": None, "type": OrderType.PLATFORM_EXPENSE, "status": OrderStatus.COMPLETED, "amount": -68.00, "orig": 68.00, "pm": PaymentMethod.SYSTEM, "title": "域名 & SSL 证书", "desc": "年度域名续费+SSL证书", "days_ago": 2},
            # 平台其他收入
            {"uid": None, "type": OrderType.PLATFORM_INCOME, "status": OrderStatus.COMPLETED, "amount": 500.00, "orig": 500.00, "pm": PaymentMethod.BANK_TRANSFER, "title": "广告位收入", "desc": "首页 Banner 广告位 - 2月", "days_ago": 11},
            {"uid": None, "type": OrderType.PLATFORM_INCOME, "status": OrderStatus.COMPLETED, "amount": 200.00, "orig": 200.00, "pm": PaymentMethod.BANK_TRANSFER, "title": "企业定制服务", "desc": "某企业定制数据分析报告", "days_ago": 9},
            # 调账
            {"uid": None, "type": OrderType.ADJUSTMENT, "status": OrderStatus.COMPLETED, "amount": -15.00, "orig": 15.00, "pm": PaymentMethod.SYSTEM, "title": "手动调账", "desc": "补偿用户重复扣费问题", "days_ago": 16},
        ]

        for i, t in enumerate(order_templates):
            dt = now - timedelta(days=t["days_ago"], hours=random.randint(0, 12), minutes=random.randint(0, 59))
            ono = f"ORD-{dt.strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.digits, k=4))}"
            if t["type"] == OrderType.REFUND:
                ono = f"REF-{dt.strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.digits, k=4))}"
            elif t["type"] == OrderType.PLATFORM_EXPENSE:
                ono = f"EXP-{dt.strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.digits, k=4))}"
            elif t["type"] == OrderType.PLATFORM_INCOME:
                ono = f"INC-{dt.strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.digits, k=4))}"
            elif t["type"] == OrderType.ADJUSTMENT:
                ono = f"ADJ-{dt.strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.digits, k=4))}"

            order = Order(
                order_no=ono,
                user_id=t.get("uid"),
                order_type=t["type"],
                status=t["status"],
                amount=t["amount"],
                original_amount=t.get("orig", abs(t["amount"])),
                discount=t.get("disc", 0),
                payment_method=t.get("pm"),
                title=t["title"],
                description=t.get("desc"),
                package_type=t.get("pkg"),
                created_at=dt,
                updated_at=dt,
                paid_at=dt if t["status"] in (OrderStatus.COMPLETED, OrderStatus.PAID) else None,
                refunded_at=dt if t["type"] == OrderType.REFUND else None,
            )
            db.add(order)

        await db.commit()
        print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
