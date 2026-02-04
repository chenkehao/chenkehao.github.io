"""
FastAPI Application Entry Point
Devnors - AI Multi-Agent Recruitment Platform
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_db, init_db
from app.routers import ai, auth, candidates, flows, jobs, users, public
from app.routers import settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"🚀 Starting {settings.app_name}...")
    await init_db()
    print("✅ Database initialized")
    
    # Seed database with initial data
    try:
        from app.seed_data import seed_database
        await seed_database()
    except Exception as e:
        print(f"⚠️ Seed data error: {e}")
    
    yield
    
    # Shutdown
    print("🔄 Shutting down...")
    await close_db()
    print("👋 Goodbye!")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="""
    ## Devnors 得若 - 全场景AI原生智能招聘平台 API
    
    ### 功能模块
    - 🔐 **用户认证**: 登录注册、JWT 认证
    - 👤 **用户管理**: 企业用户、候选人管理
    - 💼 **职位管理**: 岗位发布、职位搜索
    - 📄 **候选人管理**: 简历解析、人才画像
    - 🔄 **工作流管理**: 招聘流程追踪
    - 🤖 **AI 智能体**: 多智能体协同招聘
    """,
    version=settings.api_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/v1/users", tags=["用户"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["职位"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["候选人"])
app.include_router(flows.router, prefix="/api/v1/flows", tags=["工作流"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI 智能体"])
app.include_router(public.router, prefix="/api/v1/public", tags=["公开接口"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["系统设置"])


@app.get("/", tags=["健康检查"])
async def root():
    """API Root - Health Check"""
    return {
        "name": settings.app_name,
        "version": settings.api_version,
        "status": "healthy",
        "message": "Welcome to Devnors API 🚀"
    }


@app.get("/health", tags=["健康检查"])
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
