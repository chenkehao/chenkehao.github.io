"""
Admin Management Router
管理后台 API — 所有接口强制要求 ADMIN 角色

模块覆盖：
1. 仪表盘统计
2. 用户管理
3. 企业管理 / 认证审核
4. 职位管理 / 标签管理
5. 候选人管理
6. 招聘流程管理
7. Token 与财务管理
8. 邀请管理
9. 工单管理
10. 通知管理
11. AI 智能体监控
12. 内容管理（Changelog）
13. 审计日志
14. 系统设置
"""

from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc, asc, and_, or_, case, distinct, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole, AccountTier, Enterprise, TeamMember
from app.models.job import Job, JobTag, JobLog, JobStatus, JobType, job_tags_association
from app.models.token import TokenUsage, TokenPackage, TokenAction, PackageType
from app.models.invitation import Invitation
from app.models.ticket import Ticket
from app.models.notification import Notification, NotificationType, NotificationImportance
from app.models.changelog import Changelog
from app.models.settings import (
    UserSettings, EnterpriseCertification, PersonalCertification,
    AIEngineConfig, APIKey, Webhook, AuditLog, CertificationStatus,
)
from app.models.todo import Todo, ChatMessage
from app.models.memory import Memory
from app.models.order import Order, OrderType, OrderStatus, PaymentMethod
from app.models.admin_role import AdminRole, PERMISSION_MODULES, ACTION_LABELS, PRESET_ROLES
from app.utils.security import get_current_user, get_password_hash
from app.utils.audit import log_audit

router = APIRouter()


# ─── Admin 权限依赖 ───────────────────────────────────────────────
async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """强制要求当前用户为 ADMIN 角色"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return current_user


def require_permission(module: str, action: str = "view"):
    """权限检查工厂函数：要求管理员拥有指定模块的指定操作权限。
    超级管理员（permissions 含 '*'）自动通过所有检查。"""
    async def _checker(
        current_user: User = Depends(require_admin),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        # 加载角色（如果关系未预加载）
        role = current_user.admin_role
        if role is None and current_user.admin_role_id:
            result = await db.execute(
                select(AdminRole).where(AdminRole.id == current_user.admin_role_id)
            )
            role = result.scalar_one_or_none()
        # 超级管理员 / 未分配角色的管理员 → 放行全部（向后兼容）
        if role is None:
            return current_user
        if role.has_permission(module, action):
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"缺少权限: {PERMISSION_MODULES.get(module, {}).get('label', module)} - {ACTION_LABELS.get(action, action)}",
        )
    return _checker


# ─── Pydantic 请求/响应模型 ────────────────────────────────────────

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    account_tier: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class TokenGrantRequest(BaseModel):
    user_id: int
    amount: int = Field(..., description="正数=赠送，负数=扣减")
    reason: str = "管理员手动操作"

class TicketReplyRequest(BaseModel):
    reply: str
    status: Optional[str] = None

class NotificationSendRequest(BaseModel):
    user_ids: Optional[List[int]] = None
    role: Optional[str] = None
    title: str
    content: str
    type: str = "system"
    importance: str = "normal"
    icon: str = "Bell"
    color: str = "text-indigo-600"
    bg_color: str = "bg-indigo-50"
    link: str = "/notifications"

class ChangelogCreateRequest(BaseModel):
    version: str
    date: str
    tag: str = ""
    tag_color: str = ""
    item_type: str = "新功能"
    item_color: str = "text-emerald-600 bg-emerald-50"
    description: str
    commit_hash: Optional[str] = None
    sort_order: int = 0

class JobTagCreateRequest(BaseModel):
    name: str
    category: Optional[str] = None

class SystemConfigUpdate(BaseModel):
    key: str
    value: str


# ═══════════════════════════════════════════════════════════════════
# 1. 仪表盘统计
# ═══════════════════════════════════════════════════════════════════

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """仪表盘 — 核心指标"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    # 用户统计
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    today_users = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )).scalar() or 0
    active_users = (await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )).scalar() or 0

    # 角色分布
    role_dist_rows = (await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )).all()
    role_distribution = {str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1] for r in role_dist_rows}

    # 职位统计
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar() or 0
    active_jobs = (await db.execute(
        select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE)
    )).scalar() or 0

    # 招聘流程
    try:
        from app.models.flow import Flow
        total_flows = (await db.execute(select(func.count(Flow.id)))).scalar() or 0
    except Exception:
        total_flows = 0

    # 候选人
    try:
        from app.models.candidate import Candidate
        total_candidates = (await db.execute(select(func.count(Candidate.id)))).scalar() or 0
    except Exception:
        total_candidates = 0

    # Token 统计
    total_token_consumed = (await db.execute(
        select(func.sum(TokenUsage.tokens_used)).where(TokenUsage.tokens_used > 0)
    )).scalar() or 0
    total_token_granted = abs((await db.execute(
        select(func.sum(TokenUsage.tokens_used)).where(TokenUsage.tokens_used < 0)
    )).scalar() or 0)
    total_balance = (await db.execute(
        select(func.sum(TokenPackage.remaining_tokens)).where(TokenPackage.is_active == True)
    )).scalar() or 0

    # 收入统计（购买套餐的总金额）
    total_revenue = (await db.execute(
        select(func.sum(TokenPackage.price)).where(TokenPackage.price > 0)
    )).scalar() or 0

    # 工单统计
    open_tickets = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.status.in_(["open", "processing"]))
    )).scalar() or 0

    return {
        "users": {
            "total": total_users,
            "today_new": today_users,
            "active": active_users,
            "role_distribution": role_distribution,
        },
        "business": {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_candidates": total_candidates,
            "total_flows": total_flows,
        },
        "tokens": {
            "total_consumed": total_token_consumed,
            "total_granted": total_token_granted,
            "total_balance": total_balance,
        },
        "revenue": {
            "total": round(total_revenue, 2),
        },
        "tickets": {
            "open": open_tickets,
        },
    }


@router.get("/dashboard/trends")
async def get_dashboard_trends(
    days: int = Query(7, ge=1, le=90),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """仪表盘 — 趋势数据（用户增长、Token 消耗、职位发布）"""
    now = datetime.utcnow()
    start = now - timedelta(days=days)

    # 每日新增用户
    user_rows = (await db.execute(
        select(
            func.date(User.created_at).label("day"),
            func.count(User.id),
        ).where(User.created_at >= start).group_by("day").order_by("day")
    )).all()

    # 每日 Token 消耗
    token_rows = (await db.execute(
        select(
            func.date(TokenUsage.created_at).label("day"),
            func.sum(TokenUsage.tokens_used),
        ).where(
            TokenUsage.created_at >= start,
            TokenUsage.tokens_used > 0,
        ).group_by("day").order_by("day")
    )).all()

    # 每日新职位
    job_rows = (await db.execute(
        select(
            func.date(Job.created_at).label("day"),
            func.count(Job.id),
        ).where(Job.created_at >= start).group_by("day").order_by("day")
    )).all()

    return {
        "user_growth": [{"date": str(r[0]), "count": r[1]} for r in user_rows],
        "token_consumption": [{"date": str(r[0]), "amount": r[1] or 0} for r in token_rows],
        "job_posts": [{"date": str(r[0]), "count": r[1]} for r in job_rows],
    }


@router.get("/analytics/overview")
async def get_analytics_overview(
    days: int = Query(30, ge=7, le=180),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """运营数据 — 全面统计概览"""
    now = datetime.utcnow()
    start = now - timedelta(days=days)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # ── 用户增长趋势 ─────────────────────
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    today_users = (await db.execute(select(func.count(User.id)).where(User.created_at >= today_start))).scalar() or 0
    week_users = (await db.execute(select(func.count(User.id)).where(User.created_at >= week_ago))).scalar() or 0
    month_users = (await db.execute(select(func.count(User.id)).where(User.created_at >= month_start))).scalar() or 0
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar() or 0

    user_trend = (await db.execute(
        select(func.date(User.created_at).label("day"), func.count(User.id))
        .where(User.created_at >= start).group_by("day").order_by("day")
    )).all()

    # 用户角色分布
    role_dist = (await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )).all()

    # 用户等级分布
    tier_dist = (await db.execute(
        select(User.account_tier, func.count(User.id)).group_by(User.account_tier)
    )).all()

    # ── 收入趋势 ─────────────────────
    total_revenue = (await db.execute(
        select(func.sum(Order.amount)).where(Order.amount > 0, Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]))
    )).scalar() or 0
    month_revenue = (await db.execute(
        select(func.sum(Order.amount)).where(Order.amount > 0, Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]), Order.created_at >= month_start)
    )).scalar() or 0
    total_expense = abs((await db.execute(
        select(func.sum(Order.amount)).where(Order.amount < 0, Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.REFUNDED]))
    )).scalar() or 0)

    revenue_trend = (await db.execute(
        select(
            func.date(Order.created_at).label("day"),
            func.sum(case((Order.amount > 0, Order.amount), else_=0)).label("income"),
            func.sum(case((Order.amount < 0, func.abs(Order.amount)), else_=0)).label("expense"),
            func.count(Order.id),
        ).where(Order.created_at >= start)
        .group_by("day").order_by("day")
    )).all()

    # 支付方式分布
    payment_dist = (await db.execute(
        select(Order.payment_method, func.count(Order.id), func.sum(Order.amount))
        .where(Order.payment_method.isnot(None), Order.amount > 0)
        .group_by(Order.payment_method)
    )).all()

    # ── Token 消耗趋势 ─────────────────────
    total_consumed = (await db.execute(
        select(func.sum(TokenUsage.tokens_used)).where(TokenUsage.tokens_used > 0)
    )).scalar() or 0
    total_granted = abs((await db.execute(
        select(func.sum(TokenUsage.tokens_used)).where(TokenUsage.tokens_used < 0)
    )).scalar() or 0)
    total_balance = (await db.execute(
        select(func.sum(TokenPackage.remaining_tokens)).where(TokenPackage.is_active == True)
    )).scalar() or 0

    token_trend = (await db.execute(
        select(
            func.date(TokenUsage.created_at).label("day"),
            func.sum(case((TokenUsage.tokens_used > 0, TokenUsage.tokens_used), else_=0)).label("consumed"),
            func.sum(case((TokenUsage.tokens_used < 0, func.abs(TokenUsage.tokens_used)), else_=0)).label("granted"),
            func.count(TokenUsage.id),
        ).where(TokenUsage.created_at >= start)
        .group_by("day").order_by("day")
    )).all()

    # Token 按操作类型分布
    token_by_action = (await db.execute(
        select(TokenUsage.action, func.sum(TokenUsage.tokens_used), func.count(TokenUsage.id))
        .where(TokenUsage.tokens_used > 0)
        .group_by(TokenUsage.action)
    )).all()

    # 套餐类型分布
    pkg_dist = (await db.execute(
        select(TokenPackage.package_type, func.count(TokenPackage.id), func.sum(TokenPackage.price))
        .group_by(TokenPackage.package_type)
    )).all()

    # ── 职位统计 ─────────────────────
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar() or 0
    active_jobs = (await db.execute(select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE))).scalar() or 0
    total_views = (await db.execute(select(func.sum(Job.view_count)))).scalar() or 0
    total_applies = (await db.execute(select(func.sum(Job.apply_count)))).scalar() or 0

    job_trend = (await db.execute(
        select(func.date(Job.created_at).label("day"), func.count(Job.id))
        .where(Job.created_at >= start).group_by("day").order_by("day")
    )).all()

    job_status_dist = (await db.execute(
        select(Job.status, func.count(Job.id)).group_by(Job.status)
    )).all()

    # ── 招聘流程统计 ─────────────────────
    try:
        from app.models.flow import Flow, FlowStatus
        total_flows = (await db.execute(select(func.count(Flow.id)))).scalar() or 0
        flow_status_dist = (await db.execute(
            select(Flow.status, func.count(Flow.id)).group_by(Flow.status)
        )).all()
        avg_match = (await db.execute(
            select(func.avg(Flow.match_score)).where(Flow.match_score.isnot(None))
        )).scalar() or 0
        flow_trend = (await db.execute(
            select(func.date(Flow.created_at).label("day"), func.count(Flow.id))
            .where(Flow.created_at >= start).group_by("day").order_by("day")
        )).all()
        flow_tokens = (await db.execute(
            select(func.sum(Flow.tokens_consumed)).where(Flow.tokens_consumed.isnot(None))
        )).scalar() or 0
    except Exception:
        total_flows = 0
        flow_status_dist = []
        avg_match = 0
        flow_trend = []
        flow_tokens = 0

    # ── 候选人统计 ─────────────────────
    try:
        from app.models.candidate import Candidate
        total_candidates = (await db.execute(select(func.count(Candidate.id)))).scalar() or 0
        complete_profiles = (await db.execute(
            select(func.count(Candidate.id)).where(Candidate.is_profile_complete == True)
        )).scalar() or 0
    except Exception:
        total_candidates = 0
        complete_profiles = 0

    # ── AI 活动统计 ─────────────────────
    total_chats = (await db.execute(select(func.count(ChatMessage.id)))).scalar() or 0
    user_chats = (await db.execute(
        select(func.count(ChatMessage.id)).where(ChatMessage.role == "user")
    )).scalar() or 0

    chat_trend = (await db.execute(
        select(func.date(ChatMessage.created_at).label("day"), func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= start, ChatMessage.role == "user")
        .group_by("day").order_by("day")
    )).all()

    # ── 工单统计 ─────────────────────
    total_tickets = (await db.execute(select(func.count(Ticket.id)))).scalar() or 0
    open_tickets = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.status.in_(["open", "processing"]))
    )).scalar() or 0
    ticket_type_dist = (await db.execute(
        select(Ticket.type, func.count(Ticket.id)).group_by(Ticket.type)
    )).all()

    # ── 邀请统计 ─────────────────────
    total_invites = (await db.execute(select(func.count(Invitation.id)))).scalar() or 0
    successful_invites = (await db.execute(
        select(func.count(Invitation.id)).where(Invitation.status.in_(["registered", "rewarded"]))
    )).scalar() or 0
    invite_tokens = (await db.execute(
        select(func.sum(Invitation.reward_tokens)).where(Invitation.reward_tokens > 0)
    )).scalar() or 0

    return {
        "period_days": days,
        "users": {
            "total": total_users, "today": today_users, "week": week_users, "month": month_users,
            "active": active_users, "inactive": total_users - active_users,
            "trend": [{"date": str(r[0]), "count": r[1]} for r in user_trend],
            "by_role": {str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1] for r in role_dist},
            "by_tier": {str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1] for r in tier_dist},
        },
        "revenue": {
            "total": round(total_revenue, 2), "month": round(month_revenue, 2),
            "expense": round(total_expense, 2), "net": round(total_revenue - total_expense, 2),
            "trend": [{"date": str(r[0]), "income": round(r[1] or 0, 2), "expense": round(r[2] or 0, 2), "count": r[3]} for r in revenue_trend],
            "by_payment": [{
                "method": str(r[0].value if hasattr(r[0], 'value') else r[0]),
                "count": r[1], "amount": round(r[2] or 0, 2),
            } for r in payment_dist],
        },
        "tokens": {
            "consumed": total_consumed, "granted": total_granted, "balance": total_balance,
            "trend": [{"date": str(r[0]), "consumed": r[1] or 0, "granted": r[2] or 0, "count": r[3]} for r in token_trend],
            "by_action": [{
                "action": str(r[0].value if hasattr(r[0], 'value') else r[0]),
                "total": r[1] or 0, "count": r[2],
            } for r in token_by_action],
            "by_package": [{
                "type": str(r[0].value if hasattr(r[0], 'value') else r[0]),
                "count": r[1], "revenue": round(r[2] or 0, 2),
            } for r in pkg_dist],
        },
        "jobs": {
            "total": total_jobs, "active": active_jobs,
            "total_views": total_views or 0, "total_applies": total_applies or 0,
            "trend": [{"date": str(r[0]), "count": r[1]} for r in job_trend],
            "by_status": {str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1] for r in job_status_dist},
        },
        "flows": {
            "total": total_flows,
            "avg_match": round(avg_match, 1),
            "tokens_consumed": flow_tokens,
            "trend": [{"date": str(r[0]), "count": r[1]} for r in flow_trend],
            "by_status": {str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1] for r in flow_status_dist},
        },
        "candidates": {
            "total": total_candidates, "complete_profiles": complete_profiles,
        },
        "ai": {
            "total_messages": total_chats, "user_messages": user_chats,
            "trend": [{"date": str(r[0]), "count": r[1]} for r in chat_trend],
        },
        "tickets": {
            "total": total_tickets, "open": open_tickets,
            "by_type": {r[0]: r[1] for r in ticket_type_dist},
        },
        "invitations": {
            "total": total_invites, "successful": successful_invites,
            "reward_tokens": invite_tokens or 0,
        },
    }


@router.get("/dashboard/recent")
async def get_dashboard_recent(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """仪表盘 — 最近动态"""
    # 最近注册用户
    recent_users = (await db.execute(
        select(User).order_by(desc(User.created_at)).limit(5)
    )).scalars().all()

    # 最近职位
    recent_jobs = (await db.execute(
        select(Job).order_by(desc(Job.created_at)).limit(5)
    )).scalars().all()

    # 最近工单
    recent_tickets = (await db.execute(
        select(Ticket).order_by(desc(Ticket.created_at)).limit(5)
    )).scalars().all()

    return {
        "recent_users": [
            {"id": u.id, "name": u.name, "email": u.email, "avatar_url": u.avatar_url, "role": u.role.value if hasattr(u.role, 'value') else u.role, "created_at": str(u.created_at)}
            for u in recent_users
        ],
        "recent_jobs": [
            {"id": j.id, "title": j.title, "company": j.company, "status": j.status.value if hasattr(j.status, 'value') else j.status, "created_at": str(j.created_at)}
            for j in recent_jobs
        ],
        "recent_tickets": [
            {"id": t.id, "title": t.title, "type": t.type, "status": t.status, "created_at": str(t.created_at)}
            for t in recent_tickets
        ],
    }


# ═══════════════════════════════════════════════════════════════════
# 2. 用户管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/users")
async def list_users(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    account_tier: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|name|email|last_login)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """用户列表 — 分页、搜索、筛选"""
    q = select(User)

    # 搜索
    if search:
        q = q.where(or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            User.phone.ilike(f"%{search}%"),
        ))

    # 筛选
    if role:
        q = q.where(User.role == role)
    if is_active is not None:
        q = q.where(User.is_active == is_active)
    if account_tier:
        q = q.where(User.account_tier == account_tier)

    # 总数
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # 排序
    sort_col = getattr(User, sort_by, User.created_at)
    q = q.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))
    q = q.offset(page * size).limit(size)

    users = (await db.execute(q)).scalars().all()

    # 批量查询 token 余额
    user_ids = [u.id for u in users]
    token_balances: dict = {}
    if user_ids:
        balance_rows = (await db.execute(
            select(TokenPackage.user_id, func.sum(TokenPackage.remaining_tokens))
            .where(TokenPackage.user_id.in_(user_ids), TokenPackage.is_active == True)
            .group_by(TokenPackage.user_id)
        )).all()
        token_balances = {row[0]: row[1] for row in balance_rows}

    return {
        "items": [
            {
                "id": u.id, "name": u.name, "email": u.email, "phone": u.phone,
                "avatar_url": u.avatar_url,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "account_tier": u.account_tier.value if hasattr(u.account_tier, 'value') else u.account_tier,
                "company_name": u.company_name,
                "is_active": u.is_active, "is_verified": u.is_verified,
                "invite_code": u.invite_code, "invited_by": u.invited_by,
                "token_balance": token_balances.get(u.id, 0),
                "created_at": str(u.created_at), "last_login": str(u.last_login) if u.last_login else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """用户详情"""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # Token 余额
    balance = (await db.execute(
        select(func.sum(TokenPackage.remaining_tokens))
        .where(TokenPackage.user_id == user_id, TokenPackage.is_active == True)
    )).scalar() or 0

    # 邀请的人数
    invite_count = (await db.execute(
        select(func.count(Invitation.id)).where(Invitation.inviter_id == user_id)
    )).scalar() or 0

    return {
        "id": user.id, "name": user.name, "email": user.email, "phone": user.phone,
        "avatar_url": user.avatar_url,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "account_tier": user.account_tier.value if hasattr(user.account_tier, 'value') else user.account_tier,
        "company_name": user.company_name,
        "is_active": user.is_active, "is_verified": user.is_verified,
        "invite_code": user.invite_code, "invited_by": user.invited_by,
        "created_at": str(user.created_at), "last_login": str(user.last_login) if user.last_login else None,
        "token_balance": balance,
        "invite_count": invite_count,
    }


@router.get("/users/{user_id}/profile")
async def get_user_full_profile(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """用户完整画像 — 聚合所有关联数据"""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # ── 基础信息 ─────────────────────
    inviter = None
    if user.invited_by:
        inviter = (await db.execute(select(User).where(User.id == user.invited_by))).scalar_one_or_none()

    # ── Token 统计 ─────────────────────
    token_balance = (await db.execute(
        select(func.sum(TokenPackage.remaining_tokens))
        .where(TokenPackage.user_id == user_id, TokenPackage.is_active == True)
    )).scalar() or 0

    token_total = (await db.execute(
        select(func.sum(TokenPackage.total_tokens))
        .where(TokenPackage.user_id == user_id)
    )).scalar() or 0

    token_consumed = (await db.execute(
        select(func.sum(TokenUsage.tokens_used))
        .where(TokenUsage.user_id == user_id, TokenUsage.tokens_used > 0)
    )).scalar() or 0

    # Token 套餐
    pkg_rows = (await db.execute(
        select(TokenPackage).where(TokenPackage.user_id == user_id)
        .order_by(desc(TokenPackage.purchased_at)).limit(10)
    )).scalars().all()
    packages = [{
        "id": p.id, "package_type": p.package_type.value if hasattr(p.package_type, 'value') else p.package_type,
        "total_tokens": p.total_tokens, "used_tokens": p.used_tokens, "remaining_tokens": p.remaining_tokens,
        "is_active": p.is_active, "price": p.price, "purchased_at": str(p.purchased_at),
        "expires_at": str(p.expires_at) if p.expires_at else None,
    } for p in pkg_rows]

    # Token 使用明细 (最近20条)
    usage_rows = (await db.execute(
        select(TokenUsage).where(TokenUsage.user_id == user_id)
        .order_by(desc(TokenUsage.created_at)).limit(20)
    )).scalars().all()
    token_usage = [{
        "id": u.id, "action": u.action.value if hasattr(u.action, 'value') else u.action,
        "tokens_used": u.tokens_used, "model_name": u.model_name, "description": u.description,
        "created_at": str(u.created_at),
    } for u in usage_rows]

    # Token 使用按类型聚合
    usage_by_action = (await db.execute(
        select(TokenUsage.action, func.sum(TokenUsage.tokens_used), func.count(TokenUsage.id))
        .where(TokenUsage.user_id == user_id, TokenUsage.tokens_used > 0)
        .group_by(TokenUsage.action)
    )).all()
    token_by_action = [
        {"action": r[0].value if hasattr(r[0], 'value') else str(r[0]), "total": r[1], "count": r[2]}
        for r in usage_by_action
    ]

    # ── 订单统计 ─────────────────────
    order_count = (await db.execute(
        select(func.count(Order.id)).where(Order.user_id == user_id)
    )).scalar() or 0

    order_total_paid = (await db.execute(
        select(func.sum(Order.amount)).where(
            Order.user_id == user_id,
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]),
            Order.amount > 0,
        )
    )).scalar() or 0

    order_rows = (await db.execute(
        select(Order).where(Order.user_id == user_id)
        .order_by(desc(Order.created_at)).limit(20)
    )).scalars().all()
    orders = [{
        "id": o.id, "order_no": o.order_no,
        "order_type": o.order_type.value if hasattr(o.order_type, 'value') else o.order_type,
        "status": o.status.value if hasattr(o.status, 'value') else o.status,
        "amount": o.amount, "title": o.title, "created_at": str(o.created_at),
        "payment_method": (o.payment_method.value if hasattr(o.payment_method, 'value') else o.payment_method) if o.payment_method else None,
    } for o in order_rows]

    # ── 邀请统计 ─────────────────────
    invite_count = (await db.execute(
        select(func.count(Invitation.id)).where(Invitation.inviter_id == user_id)
    )).scalar() or 0

    invite_rows = (await db.execute(
        select(Invitation).where(Invitation.inviter_id == user_id)
        .order_by(desc(Invitation.created_at)).limit(20)
    )).scalars().all()
    invitations = []
    for inv in invite_rows:
        invitee = None
        if inv.invitee_id:
            invitee = (await db.execute(select(User).where(User.id == inv.invitee_id))).scalar_one_or_none()
        invitations.append({
            "id": inv.id, "invitee_name": invitee.name if invitee else None,
            "invite_code": inv.invite_code, "status": inv.status,
            "reward_tokens": inv.reward_tokens, "created_at": str(inv.created_at),
        })

    # ── 职位统计（招聘方）─────────────────────
    job_count = (await db.execute(
        select(func.count(Job.id)).where(Job.owner_id == user_id)
    )).scalar() or 0

    job_rows = (await db.execute(
        select(Job).where(Job.owner_id == user_id)
        .order_by(desc(Job.created_at)).limit(10)
    )).scalars().all()
    jobs = [{
        "id": j.id, "title": j.title, "company": j.company, "location": j.location,
        "status": j.status.value if hasattr(j.status, 'value') else j.status,
        "view_count": j.view_count, "apply_count": j.apply_count,
        "salary_min": j.salary_min, "salary_max": j.salary_max,
        "created_at": str(j.created_at),
    } for j in job_rows]

    # ── 招聘流程（招聘方）─────────────────────
    try:
        from app.models.flow import Flow
        flow_count = (await db.execute(
            select(func.count(Flow.id)).where(Flow.recruiter_id == user_id)
        )).scalar() or 0

        flow_rows = (await db.execute(
            select(Flow).where(Flow.recruiter_id == user_id)
            .order_by(desc(Flow.created_at)).limit(10)
        )).scalars().all()
        flows = [{
            "id": f.id, "status": f.status.value if hasattr(f.status, 'value') else f.status,
            "current_stage": f.current_stage.value if hasattr(f.current_stage, 'value') else f.current_stage,
            "match_score": f.match_score, "tokens_consumed": f.tokens_consumed,
            "created_at": str(f.created_at),
        } for f in flow_rows]
    except Exception:
        flow_count = 0
        flows = []

    # ── 候选人资料 ─────────────────────
    try:
        from app.models.candidate import Candidate, CandidateProfile
        candidate = (await db.execute(
            select(Candidate).where(Candidate.user_id == user_id)
        )).scalar_one_or_none()
        candidate_info = None
        if candidate:
            profile = (await db.execute(
                select(CandidateProfile).where(CandidateProfile.candidate_id == candidate.id)
            )).scalar_one_or_none()
            candidate_info = {
                "id": candidate.id,
                "is_profile_complete": candidate.is_profile_complete,
                "has_resume": bool(candidate.resume_file_url),
                "last_analysis_at": str(candidate.last_analysis_at) if candidate.last_analysis_at else None,
                "profile": {
                    "display_name": profile.display_name if profile else None,
                    "current_role": profile.current_role if profile else None,
                    "experience_years": profile.experience_years if profile else None,
                    "summary": profile.summary if profile else None,
                } if profile else None,
            }
    except Exception:
        candidate_info = None

    # ── 工单 ─────────────────────
    ticket_count = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.user_id == user_id)
    )).scalar() or 0

    ticket_rows = (await db.execute(
        select(Ticket).where(Ticket.user_id == user_id)
        .order_by(desc(Ticket.created_at)).limit(10)
    )).scalars().all()
    tickets = [{
        "id": t.id, "type": t.type, "priority": t.priority, "status": t.status,
        "title": t.title, "created_at": str(t.created_at),
    } for t in ticket_rows]

    # ── 通知 ─────────────────────
    notif_count = (await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == user_id)
    )).scalar() or 0
    unread_notif = (await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read == False)
    )).scalar() or 0

    # ── AI 活动 ─────────────────────
    chat_count = (await db.execute(
        select(func.count(ChatMessage.id)).where(ChatMessage.user_id == user_id)
    )).scalar() or 0

    chat_tokens = (await db.execute(
        select(func.sum(ChatMessage.tokens_used))
        .where(ChatMessage.user_id == user_id, ChatMessage.tokens_used.isnot(None))
    )).scalar() or 0

    recent_chats = (await db.execute(
        select(ChatMessage).where(ChatMessage.user_id == user_id, ChatMessage.role == "user")
        .order_by(desc(ChatMessage.created_at)).limit(10)
    )).scalars().all()
    chats = [{"id": c.id, "content": c.content[:100] if c.content else "", "model": c.model, "tokens_used": c.tokens_used, "created_at": str(c.created_at)} for c in recent_chats]

    # ── 认证 ─────────────────────
    ent_cert = (await db.execute(
        select(EnterpriseCertification).where(EnterpriseCertification.user_id == user_id)
    )).scalars().all()
    enterprise_certs = [{
        "id": c.id, "name": c.name, "organization": c.organization,
        "status": c.status.value if hasattr(c.status, 'value') else c.status,
        "credit_code": c.credit_code, "cert_date": str(c.cert_date) if c.cert_date else None,
    } for c in ent_cert]

    per_cert = (await db.execute(
        select(PersonalCertification).where(PersonalCertification.user_id == user_id)
    )).scalars().all()
    personal_certs = [{
        "id": c.id, "name": c.name, "organization": c.organization,
        "status": c.status.value if hasattr(c.status, 'value') else c.status,
        "degree": c.degree, "major": c.major, "cert_date": str(c.cert_date) if c.cert_date else None,
    } for c in per_cert]

    # ── 审计日志 ─────────────────────
    audit_rows = (await db.execute(
        select(AuditLog).where(AuditLog.user_id == user_id)
        .order_by(desc(AuditLog.created_at)).limit(20)
    )).scalars().all()
    audit_logs = [{
        "id": a.id, "action": a.action, "category": a.category,
        "risk_level": a.risk_level, "ip_address": a.ip_address,
        "created_at": str(a.created_at),
    } for a in audit_rows]

    # ── 企业与团队 ─────────────────────
    enterprise = (await db.execute(
        select(Enterprise).where(Enterprise.admin_user_id == user_id)
    )).scalar_one_or_none()
    enterprise_info = None
    if enterprise:
        team_count = (await db.execute(
            select(func.count(TeamMember.id)).where(TeamMember.enterprise_id == enterprise.id)
        )).scalar() or 0
        enterprise_info = {
            "id": enterprise.id, "company_name": enterprise.company_name,
            "credit_code": enterprise.credit_code, "legal_person": enterprise.legal_person,
            "status": enterprise.status, "team_count": team_count,
        }

    return {
        # 基础信息
        "user": {
            "id": user.id, "name": user.name, "email": user.email, "phone": user.phone,
            "avatar_url": user.avatar_url,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "account_tier": user.account_tier.value if hasattr(user.account_tier, 'value') else user.account_tier,
            "company_name": user.company_name, "is_active": user.is_active, "is_verified": user.is_verified,
            "invite_code": user.invite_code,
            "invited_by": user.invited_by,
            "inviter_name": inviter.name if inviter else None,
            "created_at": str(user.created_at),
            "updated_at": str(user.updated_at) if user.updated_at else None,
            "last_login": str(user.last_login) if user.last_login else None,
        },
        # Token 与财务
        "tokens": {
            "balance": token_balance, "total": token_total, "consumed": token_consumed,
            "packages": packages, "usage": token_usage, "by_action": token_by_action,
        },
        # 订单
        "orders": {"count": order_count, "total_paid": round(order_total_paid, 2), "items": orders},
        # 邀请
        "invitations": {"count": invite_count, "items": invitations},
        # 职位
        "jobs": {"count": job_count, "items": jobs},
        # 招聘流程
        "flows": {"count": flow_count, "items": flows},
        # 候选人资料
        "candidate": candidate_info,
        # 工单
        "tickets": {"count": ticket_count, "items": tickets},
        # 通知
        "notifications": {"count": notif_count, "unread": unread_notif},
        # AI 活动
        "ai": {"chat_count": chat_count, "chat_tokens": chat_tokens, "recent_chats": chats},
        # 认证
        "certifications": {"enterprise": enterprise_certs, "personal": personal_certs},
        # 审计日志
        "audit_logs": audit_logs,
        # 企业信息
        "enterprise": enterprise_info,
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: AdminUserUpdate,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """更新用户信息（角色、等级、状态等）"""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    changes = []
    if data.name is not None:
        user.name = data.name
        changes.append(f"姓名→{data.name}")
    if data.role is not None:
        for r in UserRole:
            if r.value == data.role:
                user.role = r
                changes.append(f"角色→{data.role}")
                break
    if data.account_tier is not None:
        for t in AccountTier:
            if t.value == data.account_tier:
                user.account_tier = t
                changes.append(f"账户等级→{data.account_tier}")
                break
    if data.is_active is not None:
        user.is_active = data.is_active
        changes.append(f"状态→{'启用' if data.is_active else '禁用'}")
    if data.is_verified is not None:
        user.is_verified = data.is_verified
        changes.append(f"验证→{'已验证' if data.is_verified else '未验证'}")

    if not changes:
        return {"message": "未做任何修改", "changes": []}

    try:
        await log_audit(
            db, user_id=admin.id,
            action=f"管理员修改用户 {user.email}: {', '.join(changes)}",
            actor=admin.name or admin.email,
            category="data", risk_level="warning",
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")

    return {"message": "更新成功", "changes": changes}


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    new_password: str = Body(..., embed=True),
    request: Request = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """重置用户密码"""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="密码至少6位")

    try:
        user.hashed_password = get_password_hash(new_password)

        await log_audit(
            db, user_id=admin.id,
            action=f"管理员重置用户密码: {user.email}",
            actor=admin.name or admin.email,
            category="auth", risk_level="danger",
            ip_address=request.client.host if request and request.client else None,
        )

        db.add(Notification(
            user_id=user.id,
            type=NotificationType.SYSTEM.value,
            importance=NotificationImportance.CRITICAL.value,
            title="密码已被重置",
            content="管理员已重置您的密码，请使用新密码登录。如有疑问，请联系客服。",
            icon="AlertCircle", color="text-rose-600", bg_color="bg-rose-50",
            sender="系统",
        ))

        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"密码重置失败: {str(e)}")

    return {"message": "密码重置成功"}


@router.post("/users/grant-tokens")
async def grant_tokens(
    data: TokenGrantRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """手动赠送/扣减 Token"""
    user = (await db.execute(select(User).where(User.id == data.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 找到活跃套餐
    pkg = (await db.execute(
        select(TokenPackage)
        .where(TokenPackage.user_id == data.user_id, TokenPackage.is_active == True)
        .order_by(desc(TokenPackage.purchased_at))
        .limit(1)
    )).scalar_one_or_none()

    if pkg:
        pkg.total_tokens += data.amount
        pkg.remaining_tokens += data.amount
        if pkg.remaining_tokens < 0:
            pkg.remaining_tokens = 0
    else:
        db.add(TokenPackage(
            user_id=data.user_id,
            package_type=PackageType.FREE,
            total_tokens=max(data.amount, 0),
            remaining_tokens=max(data.amount, 0),
        ))

    # 记录
    db.add(TokenUsage(
        user_id=data.user_id,
        action=TokenAction.OTHER,
        tokens_used=-data.amount,  # negative = granted
        description=f"管理员操作: {data.reason} ({'+'if data.amount > 0 else ''}{data.amount:,} Token)",
    ))

    try:
        await log_audit(
            db, user_id=admin.id,
            action=f"管理员{'赠送' if data.amount > 0 else '扣减'}Token: 用户{user.email}, {data.amount:,} Token, 原因: {data.reason}",
            actor=admin.name or admin.email,
            category="data", risk_level="warning",
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Token 操作失败: {str(e)}")

    return {"message": f"Token 操作成功: {'+'if data.amount > 0 else ''}{data.amount:,}", "user_id": data.user_id}


# ═══════════════════════════════════════════════════════════════════
# 3. 企业管理 / 认证审核
# ═══════════════════════════════════════════════════════════════════

@router.get("/enterprises")
async def list_enterprises(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """企业列表"""
    # 通过 UserSettings 获取有企业信息的用户
    q = select(UserSettings).where(UserSettings.display_name != "")
    if search:
        q = q.where(or_(
            UserSettings.display_name.ilike(f"%{search}%"),
            UserSettings.industry.ilike(f"%{search}%"),
        ))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    q = q.order_by(desc(UserSettings.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": s.id, "user_id": s.user_id,
                "display_name": s.display_name, "short_name": s.short_name,
                "industry": s.industry, "company_size": s.company_size,
                "city": s.city, "province": s.province,
                "contact_phone": s.contact_phone, "contact_email": s.contact_email,
                "created_at": str(s.created_at) if s.created_at else None,
            }
            for s in rows
        ],
        "total": total,
    }


@router.get("/certifications/enterprise")
async def list_enterprise_certifications(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """企业认证列表"""
    q = select(EnterpriseCertification)
    if status_filter:
        q = q.where(EnterpriseCertification.status == status_filter)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(EnterpriseCertification.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": c.id, "user_id": c.user_id, "name": c.name,
                "organization": c.organization, "category": c.category,
                "status": c.status.value if hasattr(c.status, 'value') else c.status,
                "credit_code": c.credit_code,
                "created_at": str(c.created_at) if c.created_at else None,
            }
            for c in rows
        ],
        "total": total,
    }


@router.get("/certifications/personal")
async def list_personal_certifications(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """个人认证列表"""
    q = select(PersonalCertification)
    if status_filter:
        q = q.where(PersonalCertification.status == status_filter)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(PersonalCertification.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": c.id, "user_id": c.user_id, "name": c.name,
                "organization": c.organization, "category": c.category,
                "degree": c.degree, "major": c.major,
                "status": c.status.value if hasattr(c.status, 'value') else c.status,
                "created_at": str(c.created_at) if c.created_at else None,
            }
            for c in rows
        ],
        "total": total,
    }


@router.put("/certifications/{cert_type}/{cert_id}/review")
async def review_certification(
    cert_type: str,
    cert_id: int,
    new_status: str = Body(..., embed=True),
    request: Request = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """审核认证（通过/拒绝）"""
    if cert_type == "enterprise":
        cert = (await db.execute(
            select(EnterpriseCertification).where(EnterpriseCertification.id == cert_id)
        )).scalar_one_or_none()
    elif cert_type == "personal":
        cert = (await db.execute(
            select(PersonalCertification).where(PersonalCertification.id == cert_id)
        )).scalar_one_or_none()
    else:
        raise HTTPException(status_code=400, detail="无效的认证类型")

    if not cert:
        raise HTTPException(status_code=404, detail="认证不存在")

    # 映射状态
    status_map = {"valid": CertificationStatus.VALID, "expired": CertificationStatus.EXPIRED, "pending": CertificationStatus.PENDING}
    if new_status not in status_map:
        raise HTTPException(status_code=400, detail="无效状态，可选: valid/expired/pending")

    cert.status = status_map[new_status]

    try:
        await log_audit(
            db, user_id=admin.id,
            action=f"管理员审核{cert_type}认证 #{cert_id} → {new_status}",
            actor=admin.name or admin.email,
            category="data", risk_level="warning",
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"审核失败: {str(e)}")

    return {"message": f"认证状态已更新为 {new_status}"}


@router.get("/enterprises/{user_id}/team")
async def get_enterprise_team(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """查看企业团队成员"""
    members = (await db.execute(
        select(TeamMember).where(TeamMember.owner_id == user_id)
    )).scalars().all()

    return {
        "items": [
            {
                "id": m.id, "owner_id": m.owner_id, "member_id": m.member_id,
                "invited_email": m.invited_email, "invited_phone": m.invited_phone,
                "role": m.role.value if hasattr(m.role, 'value') else m.role,
                "status": m.status, "is_admin": m.is_admin,
                "invited_at": str(m.invited_at) if m.invited_at else None,
                "joined_at": str(m.joined_at) if m.joined_at else None,
            }
            for m in members
        ],
    }


# ═══════════════════════════════════════════════════════════════════
# 4. 职位管理 / 标签管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/jobs")
async def list_jobs(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    job_type: Optional[str] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = Query("created_at", regex="^(created_at|view_count|apply_count|title)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """职位列表"""
    q = select(Job)

    if search:
        q = q.where(or_(
            Job.title.ilike(f"%{search}%"),
            Job.company.ilike(f"%{search}%"),
            Job.location.ilike(f"%{search}%"),
        ))
    if status_filter:
        q = q.where(Job.status == status_filter)
    if job_type:
        q = q.where(Job.job_type == job_type)
    if is_featured is not None:
        q = q.where(Job.is_featured == is_featured)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0

    sort_col = getattr(Job, sort_by, Job.created_at)
    q = q.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))
    q = q.offset(page * size).limit(size)

    jobs = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": j.id, "title": j.title, "company": j.company, "location": j.location,
                "salary_display": j.salary_display, "job_type": j.job_type.value if hasattr(j.job_type, 'value') else j.job_type,
                "status": j.status.value if hasattr(j.status, 'value') else j.status,
                "is_featured": j.is_featured, "owner_id": j.owner_id,
                "view_count": j.view_count, "apply_count": j.apply_count,
                "created_at": str(j.created_at),
            }
            for j in jobs
        ],
        "total": total,
    }


@router.put("/jobs/{job_id}")
async def update_job(
    job_id: int,
    status_val: Optional[str] = Body(None, alias="status"),
    is_featured: Optional[bool] = Body(None),
    request: Request = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """更新职位（状态、精选等）"""
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")

    changes = []
    if status_val is not None:
        for s in JobStatus:
            if s.value == status_val:
                job.status = s
                changes.append(f"状态→{status_val}")
                break
    if is_featured is not None:
        job.is_featured = is_featured
        changes.append(f"精选→{'是' if is_featured else '否'}")

    try:
        await log_audit(
            db, user_id=admin.id,
            action=f"管理员修改职位 #{job_id}: {', '.join(changes)}",
            actor=admin.name or admin.email,
            category="data", risk_level="info",
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"职位更新失败: {str(e)}")

    return {"message": "职位更新成功", "changes": changes}


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    request: Request = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """删除职位"""
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="职位不存在")

    try:
        await log_audit(
            db, user_id=admin.id,
            action=f"管理员删除职位 #{job_id}: {job.title}",
            actor=admin.name or admin.email,
            category="data", risk_level="danger",
        )
        await db.delete(job)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")

    return {"message": "职位已删除"}


# 标签管理
@router.get("/job-tags")
async def list_job_tags(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """职位标签列表"""
    tags = (await db.execute(select(JobTag).order_by(JobTag.category, JobTag.name))).scalars().all()
    return {
        "items": [{"id": t.id, "name": t.name, "category": t.category} for t in tags],
    }


@router.post("/job-tags")
async def create_job_tag(
    data: JobTagCreateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """创建职位标签"""
    existing = (await db.execute(select(JobTag).where(JobTag.name == data.name))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="标签已存在")

    tag = JobTag(name=data.name, category=data.category)
    db.add(tag)
    try:
        await db.commit()
        await db.refresh(tag)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"创建标签失败: {str(e)}")
    return {"id": tag.id, "name": tag.name, "category": tag.category}


@router.delete("/job-tags/{tag_id}")
async def delete_job_tag(
    tag_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """删除职位标签"""
    tag = (await db.execute(select(JobTag).where(JobTag.id == tag_id))).scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")

    try:
        await db.delete(tag)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"删除标签失败: {str(e)}")
    return {"message": "标签已删除"}


# ═══════════════════════════════════════════════════════════════════
# 5. 候选人管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/candidates")
async def list_candidates(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    profile_complete: Optional[str] = Query(None, description="true/false 筛选画像完善状态"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """候选人列表"""
    try:
        from app.models.candidate import Candidate, CandidateProfile
    except ImportError:
        return {"items": [], "total": 0}

    q = select(Candidate)

    # 画像完善筛选
    if profile_complete == "true":
        q = q.where(Candidate.is_profile_complete == True)
    elif profile_complete == "false":
        q = q.where(Candidate.is_profile_complete == False)

    # 搜索 — 先查出匹配的 user_ids，再过滤
    if search:
        user_ids_q = select(User.id).where(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )
        matched_user_ids = [row[0] for row in (await db.execute(user_ids_q)).all()]
        if matched_user_ids:
            q = q.where(Candidate.user_id.in_(matched_user_ids))
        else:
            return {"items": [], "total": 0}

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(Candidate.created_at)).offset(page * size).limit(size)
    candidates = (await db.execute(q)).scalars().all()

    items = []
    for c in candidates:
        # 获取关联用户
        user = (await db.execute(select(User).where(User.id == c.user_id))).scalar_one_or_none()
        # 获取画像
        profile = (await db.execute(
            select(CandidateProfile).where(CandidateProfile.candidate_id == c.id)
        )).scalar_one_or_none()

        items.append({
            "id": c.id, "user_id": c.user_id,
            "user_name": user.name if user else None,
            "user_email": user.email if user else None,
            "display_name": profile.display_name if profile else None,
            "current_role": profile.current_role if profile else None,
            "experience_years": profile.experience_years if profile else None,
            "is_profile_complete": c.is_profile_complete,
            "created_at": str(c.created_at),
        })

    return {"items": items, "total": total}


@router.get("/candidates/{candidate_id}")
async def get_candidate_detail(
    candidate_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """候选人详情"""
    try:
        from app.models.candidate import Candidate, CandidateProfile, Skill, CareerPath, SkillGap
    except ImportError:
        raise HTTPException(status_code=404, detail="候选人模块不可用")

    candidate = (await db.execute(select(Candidate).where(Candidate.id == candidate_id))).scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    user = (await db.execute(select(User).where(User.id == candidate.user_id))).scalar_one_or_none()
    profile = (await db.execute(
        select(CandidateProfile).where(CandidateProfile.candidate_id == candidate_id)
    )).scalar_one_or_none()
    skills = (await db.execute(
        select(Skill).where(Skill.candidate_id == candidate_id)
    )).scalars().all()

    return {
        "id": candidate.id, "user_id": candidate.user_id,
        "user_name": user.name if user else None,
        "user_email": user.email if user else None,
        "resume_text": candidate.resume_text[:500] if candidate.resume_text else None,
        "is_profile_complete": candidate.is_profile_complete,
        "profile": {
            "display_name": profile.display_name if profile else None,
            "current_role": profile.current_role if profile else None,
            "experience_years": profile.experience_years if profile else None,
            "summary": profile.summary if profile else None,
            "salary_range": profile.salary_range if profile else None,
        } if profile else None,
        "skills": [{"name": s.name, "level": s.level, "category": s.category} for s in skills],
        "created_at": str(candidate.created_at),
    }


# ═══════════════════════════════════════════════════════════════════
# 6. 招聘流程管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/flows")
async def list_flows(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """招聘流程列表"""
    try:
        from app.models.flow import Flow
    except ImportError:
        return {"items": [], "total": 0}

    q = select(Flow)
    if status_filter:
        q = q.where(Flow.status == status_filter)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(Flow.created_at)).offset(page * size).limit(size)
    flows = (await db.execute(q)).scalars().all()

    items = []
    for f in flows:
        # 获取职位名称
        job_title = None
        if f.job_id:
            job_row = (await db.execute(select(Job).where(Job.id == f.job_id))).scalar_one_or_none()
            if job_row:
                job_title = job_row.title
        # 获取候选人名称
        candidate_name = None
        if f.candidate_id:
            try:
                from app.models.candidate import CandidateProfile
                cp = (await db.execute(select(CandidateProfile).where(CandidateProfile.id == f.candidate_id))).scalar_one_or_none()
                if cp:
                    candidate_name = cp.display_name
                    if not candidate_name and cp.user_id:
                        cu = (await db.execute(select(User).where(User.id == cp.user_id))).scalar_one_or_none()
                        candidate_name = cu.name if cu else None
            except ImportError:
                pass
        items.append({
            "id": f.id,
            "candidate_id": f.candidate_id, "job_id": f.job_id, "recruiter_id": f.recruiter_id,
            "status": f.status.value if hasattr(f.status, 'value') else f.status,
            "current_stage": f.current_stage.value if hasattr(f.current_stage, 'value') else f.current_stage,
            "match_score": f.match_score, "tokens_consumed": f.tokens_consumed,
            "job_title": job_title, "candidate_name": candidate_name,
            "created_at": str(f.created_at),
        })

    return {"items": items, "total": total}


@router.get("/flows/stats")
async def get_flow_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """招聘流程统计 — 阶段转化率"""
    try:
        from app.models.flow import Flow
    except ImportError:
        return {"stages": []}

    # 按状态统计
    rows = (await db.execute(
        select(Flow.status, func.count(Flow.id)).group_by(Flow.status)
    )).all()

    total = sum(r[1] for r in rows)
    stages = [
        {"status": str(r[0].value if hasattr(r[0], 'value') else r[0]), "count": r[1], "percentage": round(r[1] / total * 100, 1) if total > 0 else 0}
        for r in rows
    ]

    return {"stages": stages, "total": total}


# ═══════════════════════════════════════════════════════════════════
# 7. Token 与财务管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/tokens/overview")
async def get_token_overview(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Token 总览"""
    total_consumed = (await db.execute(
        select(func.sum(TokenUsage.tokens_used)).where(TokenUsage.tokens_used > 0)
    )).scalar() or 0
    total_granted = abs((await db.execute(
        select(func.sum(TokenUsage.tokens_used)).where(TokenUsage.tokens_used < 0)
    )).scalar() or 0)
    total_balance = (await db.execute(
        select(func.sum(TokenPackage.remaining_tokens)).where(TokenPackage.is_active == True)
    )).scalar() or 0
    total_revenue = (await db.execute(
        select(func.sum(TokenPackage.price)).where(TokenPackage.price > 0)
    )).scalar() or 0

    # 按智能体消耗
    agent_rows = (await db.execute(
        select(TokenUsage.action, func.sum(TokenUsage.tokens_used), func.count(TokenUsage.id))
        .where(TokenUsage.tokens_used > 0)
        .group_by(TokenUsage.action)
    )).all()

    return {
        "total_consumed": total_consumed,
        "total_granted": total_granted,
        "total_balance": total_balance,
        "total_revenue": round(total_revenue, 2),
        "by_agent": [
            {
                "action": str(r[0].value if hasattr(r[0], 'value') else r[0]),
                "total_tokens": r[1] or 0,
                "count": r[2],
            }
            for r in agent_rows
        ],
    }


@router.get("/tokens/history")
async def get_token_history(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Token 消耗明细"""
    q = select(TokenUsage)
    if user_id:
        q = q.where(TokenUsage.user_id == user_id)
    if action:
        q = q.where(TokenUsage.action == action)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(TokenUsage.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    items = []
    for r in rows:
        user = (await db.execute(select(User).where(User.id == r.user_id))).scalar_one_or_none()
        items.append({
            "id": r.id, "user_id": r.user_id,
            "user_name": user.name if user else None,
            "action": r.action.value if hasattr(r.action, 'value') else r.action,
            "tokens_used": r.tokens_used,
            "model_name": r.model_name, "description": r.description,
            "created_at": str(r.created_at),
        })

    return {"items": items, "total": total}


@router.get("/tokens/packages")
async def list_token_packages(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Token 套餐列表"""
    q = select(TokenPackage)
    if user_id:
        q = q.where(TokenPackage.user_id == user_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(TokenPackage.purchased_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    items = []
    for p in rows:
        user = (await db.execute(select(User).where(User.id == p.user_id))).scalar_one_or_none()
        items.append({
            "id": p.id, "user_id": p.user_id,
            "user_name": user.name if user else None,
            "package_type": p.package_type.value if hasattr(p.package_type, 'value') else p.package_type,
            "total_tokens": p.total_tokens, "used_tokens": p.used_tokens,
            "remaining_tokens": p.remaining_tokens, "is_active": p.is_active,
            "price": p.price,
            "purchased_at": str(p.purchased_at),
            "expires_at": str(p.expires_at) if p.expires_at else None,
        })

    return {
        "items": items,
        "total": total,
    }


# ═══════════════════════════════════════════════════════════════════
# 8. 邀请管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/invitations")
async def list_invitations(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """邀请记录列表"""
    q = select(Invitation)
    if status_filter:
        q = q.where(Invitation.status == status_filter)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(Invitation.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    items = []
    for inv in rows:
        inviter = (await db.execute(select(User).where(User.id == inv.inviter_id))).scalar_one_or_none()
        invitee = (await db.execute(select(User).where(User.id == inv.invitee_id))).scalar_one_or_none()
        items.append({
            "id": inv.id,
            "inviter_id": inv.inviter_id, "inviter_name": inviter.name if inviter else None,
            "invitee_id": inv.invitee_id, "invitee_name": invitee.name if invitee else None,
            "invite_code": inv.invite_code,
            "reward_tokens": inv.reward_tokens, "status": inv.status,
            "created_at": str(inv.created_at),
        })

    return {"items": items, "total": total}


@router.get("/invitations/stats")
async def get_invitation_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """邀请统计"""
    total_invites = (await db.execute(select(func.count(Invitation.id)))).scalar() or 0
    total_rewards = (await db.execute(
        select(func.sum(Invitation.reward_tokens))
    )).scalar() or 0

    # 排行榜
    top_inviters = (await db.execute(
        select(Invitation.inviter_id, func.count(Invitation.id).label("cnt"))
        .group_by(Invitation.inviter_id)
        .order_by(desc("cnt"))
        .limit(10)
    )).all()

    leaderboard = []
    for row in top_inviters:
        user = (await db.execute(select(User).where(User.id == row[0]))).scalar_one_or_none()
        leaderboard.append({
            "user_id": row[0],
            "name": user.name if user else "Unknown",
            "email": user.email if user else "",
            "invite_count": row[1],
        })

    return {
        "total_invitations": total_invites,
        "total_reward_tokens": total_rewards,
        "leaderboard": leaderboard,
    }


# ═══════════════════════════════════════════════════════════════════
# 9. 工单管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/tickets/stats/summary")
async def get_ticket_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """工单统计"""
    # 按状态
    status_rows = (await db.execute(
        select(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status)
    )).all()
    # 按类型
    type_rows = (await db.execute(
        select(Ticket.type, func.count(Ticket.id)).group_by(Ticket.type)
    )).all()
    total = (await db.execute(select(func.count(Ticket.id)))).scalar() or 0

    return {
        "total": total,
        "by_status": {r[0]: r[1] for r in status_rows},
        "by_type": {r[0]: r[1] for r in type_rows},
    }


@router.get("/tickets")
async def list_tickets(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    type_filter: Optional[str] = Query(None, alias="type"),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """工单列表"""
    q = select(Ticket)
    if type_filter:
        q = q.where(Ticket.type == type_filter)
    if status_filter:
        q = q.where(Ticket.status == status_filter)
    if priority:
        q = q.where(Ticket.priority == priority)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(Ticket.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    items = []
    for t in rows:
        user = (await db.execute(select(User).where(User.id == t.user_id))).scalar_one_or_none()
        items.append({
            "id": t.id, "user_id": t.user_id,
            "user_name": user.name if user else None,
            "user_email": user.email if user else None,
            "type": t.type, "priority": t.priority, "status": t.status,
            "title": t.title, "content": t.content, "contact": t.contact,
            "reply": t.reply, "replied_at": str(t.replied_at) if t.replied_at else None,
            "created_at": str(t.created_at), "updated_at": str(t.updated_at),
        })

    return {"items": items, "total": total}


@router.get("/tickets/{ticket_id}")
async def get_ticket_detail(
    ticket_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """工单详情"""
    ticket = (await db.execute(select(Ticket).where(Ticket.id == ticket_id))).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")

    user = (await db.execute(select(User).where(User.id == ticket.user_id))).scalar_one_or_none()

    return {
        "id": ticket.id, "user_id": ticket.user_id,
        "user_name": user.name if user else None,
        "type": ticket.type, "priority": ticket.priority, "status": ticket.status,
        "title": ticket.title, "content": ticket.content, "contact": ticket.contact,
        "reply": ticket.reply, "replied_at": str(ticket.replied_at) if ticket.replied_at else None,
        "created_at": str(ticket.created_at),
    }


@router.put("/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    data: TicketReplyRequest,
    request: Request = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """回复/更新工单"""
    ticket = (await db.execute(select(Ticket).where(Ticket.id == ticket_id))).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="工单不存在")

    ticket.reply = data.reply
    ticket.replied_at = datetime.utcnow()
    if data.status:
        ticket.status = data.status

    # 通知用户
    db.add(Notification(
        user_id=ticket.user_id,
        type=NotificationType.SYSTEM.value,
        importance=NotificationImportance.IMPORTANT.value,
        title=f"工单 #{ticket.id} 已回复",
        content=f"您的反馈「{ticket.title}」已收到回复，请查看详情。",
        icon="MessageSquare", color="text-indigo-600", bg_color="bg-indigo-50",
        link="/feedback",
        sender="客服",
    ))

    try:
        await log_audit(
            db, user_id=admin.id,
            action=f"管理员回复工单 #{ticket_id}",
            actor=admin.name or admin.email,
            category="data", risk_level="info",
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"工单更新失败: {str(e)}")

    return {"message": "工单更新成功"}


# ═══════════════════════════════════════════════════════════════════
# 10. 通知管理
# ═══════════════════════════════════════════════════════════════════

@router.get("/notifications")
async def list_notifications(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    type_filter: Optional[str] = Query(None, alias="type"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """通知列表"""
    q = select(Notification).where(Notification.is_deleted == False)
    if user_id:
        q = q.where(Notification.user_id == user_id)
    if type_filter:
        q = q.where(Notification.type == type_filter)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(Notification.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": n.id, "user_id": n.user_id,
                "type": n.type, "importance": n.importance,
                "title": n.title, "content": n.content,
                "is_read": n.is_read, "sender": n.sender,
                "created_at": str(n.created_at),
            }
            for n in rows
        ],
        "total": total,
    }


@router.post("/notifications/send")
async def send_notification(
    data: NotificationSendRequest,
    request: Request = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """发送通知（单个用户 / 按角色群发 / 全员）"""
    target_user_ids = []

    if data.user_ids:
        target_user_ids = data.user_ids
    elif data.role:
        users = (await db.execute(select(User.id).where(User.role == data.role, User.is_active == True))).scalars().all()
        target_user_ids = list(users)
    else:
        # 全员
        users = (await db.execute(select(User.id).where(User.is_active == True))).scalars().all()
        target_user_ids = list(users)

    count = 0
    for uid in target_user_ids:
        db.add(Notification(
            user_id=uid,
            type=data.type,
            importance=data.importance,
            title=data.title,
            content=data.content,
            icon=data.icon, color=data.color, bg_color=data.bg_color,
            link=data.link,
            sender="管理员",
        ))
        count += 1

    try:
        await log_audit(
            db, user_id=admin.id,
            action=f"管理员发送通知「{data.title}」给 {count} 位用户",
            actor=admin.name or admin.email,
            category="system", risk_level="info",
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"通知发送失败: {str(e)}")

    return {"message": f"通知已发送给 {count} 位用户"}


# ═══════════════════════════════════════════════════════════════════
# 11. AI 智能体监控
# ═══════════════════════════════════════════════════════════════════

@router.get("/ai/stats")
async def get_ai_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """AI 智能体调用统计"""
    rows = (await db.execute(
        select(
            TokenUsage.action,
            func.count(TokenUsage.id),
            func.sum(TokenUsage.tokens_used),
        ).where(TokenUsage.tokens_used > 0)
        .group_by(TokenUsage.action)
    )).all()

    return {
        "agents": [
            {
                "action": str(r[0].value if hasattr(r[0], 'value') else r[0]),
                "call_count": r[1],
                "total_tokens": r[2] or 0,
            }
            for r in rows
        ],
    }


@router.get("/ai/chat-messages")
async def list_chat_messages(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """AI 对话记录"""
    q = select(ChatMessage)
    if user_id:
        q = q.where(ChatMessage.user_id == user_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(ChatMessage.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": m.id, "user_id": m.user_id, "todo_id": m.todo_id,
                "role": m.role,
                "content": m.content[:200] + "..." if m.content and len(m.content) > 200 else m.content,
                "model": m.model, "tokens_used": m.tokens_used,
                "created_at": str(m.created_at),
            }
            for m in rows
        ],
        "total": total,
    }


@router.get("/ai/configs")
async def list_ai_configs(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """AI 引擎配置列表"""
    configs = (await db.execute(select(AIEngineConfig))).scalars().all()
    return {
        "items": [
            {
                "id": c.id, "user_id": c.user_id,
                "task": c.task, "model_name": c.model_name, "provider": c.provider,
            }
            for c in configs
        ],
    }


# ═══════════════════════════════════════════════════════════════════
# 12. 内容管理（Changelog）
# ═══════════════════════════════════════════════════════════════════

@router.get("/changelogs")
async def list_changelogs(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """更新日志列表"""
    rows = (await db.execute(
        select(Changelog).order_by(desc(Changelog.created_at))
    )).scalars().all()

    return {
        "items": [
            {
                "id": c.id, "version": c.version, "date": c.date,
                "tag": c.tag, "tag_color": c.tag_color,
                "item_type": c.item_type, "item_color": c.item_color,
                "description": c.description, "commit_hash": c.commit_hash,
                "sort_order": c.sort_order,
            }
            for c in rows
        ],
    }


@router.post("/changelogs")
async def create_changelog(
    data: ChangelogCreateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """创建更新日志"""
    entry = Changelog(
        version=data.version, date=data.date,
        tag=data.tag, tag_color=data.tag_color,
        item_type=data.item_type, item_color=data.item_color,
        description=data.description, commit_hash=data.commit_hash,
        sort_order=data.sort_order,
    )
    db.add(entry)
    try:
        await db.commit()
        await db.refresh(entry)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")
    return {"id": entry.id, "message": "更新日志已创建"}


@router.put("/changelogs/{changelog_id}")
async def update_changelog(
    changelog_id: int,
    data: ChangelogCreateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """更新日志条目"""
    entry = (await db.execute(select(Changelog).where(Changelog.id == changelog_id))).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="日志不存在")

    entry.version = data.version
    entry.date = data.date
    entry.tag = data.tag
    entry.tag_color = data.tag_color
    entry.item_type = data.item_type
    entry.item_color = data.item_color
    entry.description = data.description
    entry.commit_hash = data.commit_hash
    entry.sort_order = data.sort_order

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"修改失败: {str(e)}")
    return {"message": "更新日志已修改"}


@router.delete("/changelogs/{changelog_id}")
async def delete_changelog(
    changelog_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """删除更新日志"""
    entry = (await db.execute(select(Changelog).where(Changelog.id == changelog_id))).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="日志不存在")

    try:
        await db.delete(entry)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")
    return {"message": "更新日志已删除"}


# ═══════════════════════════════════════════════════════════════════
# 13. 审计日志
# ═══════════════════════════════════════════════════════════════════

@router.get("/audit-logs")
async def list_audit_logs(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    risk_level: Optional[str] = None,
    user_id: Optional[int] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """审计日志列表"""
    q = select(AuditLog)
    if category:
        q = q.where(AuditLog.category == category)
    if risk_level:
        q = q.where(AuditLog.risk_level == risk_level)
    if user_id:
        q = q.where(AuditLog.user_id == user_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(AuditLog.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    return {
        "items": [
            {
                "id": a.id, "user_id": a.user_id,
                "action": a.action, "actor": a.actor,
                "category": a.category, "risk_level": a.risk_level,
                "ip_address": a.ip_address, "user_agent": a.user_agent,
                "created_at": str(a.created_at),
            }
            for a in rows
        ],
        "total": total,
    }


@router.get("/audit-logs/stats")
async def get_audit_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """审计日志统计"""
    by_category = (await db.execute(
        select(AuditLog.category, func.count(AuditLog.id)).group_by(AuditLog.category)
    )).all()
    by_risk = (await db.execute(
        select(AuditLog.risk_level, func.count(AuditLog.id)).group_by(AuditLog.risk_level)
    )).all()

    return {
        "by_category": {r[0]: r[1] for r in by_category},
        "by_risk_level": {r[0]: r[1] for r in by_risk},
    }


@router.get("/api-keys")
async def list_all_api_keys(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """全平台 API 密钥"""
    keys = (await db.execute(select(APIKey))).scalars().all()
    return {
        "items": [
            {
                "id": k.id, "user_id": k.user_id,
                "name": k.name, "key": k.key[:8] + "****",
                "environment": k.environment, "is_active": k.is_active,
                "created_at": str(k.created_at),
                "last_used_at": str(k.last_used_at) if k.last_used_at else None,
            }
            for k in keys
        ],
    }


@router.get("/webhooks")
async def list_all_webhooks(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """全平台 Webhook"""
    hooks = (await db.execute(select(Webhook))).scalars().all()
    return {
        "items": [
            {
                "id": h.id, "user_id": h.user_id,
                "url": h.url, "events": h.events,
                "is_active": h.is_active, "description": h.description,
                "last_triggered_at": str(h.last_triggered_at) if h.last_triggered_at else None,
                "last_status_code": h.last_status_code,
            }
            for h in hooks
        ],
    }


# ═══════════════════════════════════════════════════════════════════
# 14. 系统设置
# ═══════════════════════════════════════════════════════════════════

@router.get("/system/info")
async def get_system_info(
    admin: User = Depends(require_admin),
):
    """系统信息"""
    return {
        "app_name": settings.app_name,
        "api_version": settings.api_version,
        "debug": settings.debug,
        "ai_provider": settings.ai_provider,
        "cors_origins": settings.cors_origins,
        "database_url": settings.database_url.split("///")[0] + "///***",  # 隐藏路径
    }


# ═══════════════════════════════════════════════════════════════════
# 15. 订单与财务管理
# ═══════════════════════════════════════════════════════════════════

class OrderRefundRequest(BaseModel):
    refund_amount: float = Field(..., gt=0, description="退款金额")
    reason: str = "管理员手动退款"

class OrderRemarkRequest(BaseModel):
    admin_remark: str

class ManualOrderRequest(BaseModel):
    """手动创建收支记录"""
    order_type: str = Field(..., description="platform_expense / platform_income / adjustment")
    amount: float = Field(..., description="金额（正数）")
    title: str
    description: Optional[str] = None
    payment_method: Optional[str] = None


@router.get("/orders/stats")
async def get_order_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """订单统计概览"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # 总收入（已支付的正向订单）
    total_income = (await db.execute(
        select(func.sum(Order.amount)).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]),
            Order.amount > 0,
        )
    )).scalar() or 0

    # 总支出（平台支出 + 退款）
    total_expense = abs((await db.execute(
        select(func.sum(Order.amount)).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.REFUNDED]),
            Order.amount < 0,
        )
    )).scalar() or 0)

    total_refund = (await db.execute(
        select(func.sum(Order.refund_amount)).where(Order.refund_amount > 0)
    )).scalar() or 0

    # 本月收入
    month_income = (await db.execute(
        select(func.sum(Order.amount)).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]),
            Order.amount > 0,
            Order.created_at >= month_start,
        )
    )).scalar() or 0

    # 上月收入（计算环比）
    last_month_income = (await db.execute(
        select(func.sum(Order.amount)).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]),
            Order.amount > 0,
            Order.created_at >= last_month_start,
            Order.created_at < month_start,
        )
    )).scalar() or 0

    # 今日收入
    today_income = (await db.execute(
        select(func.sum(Order.amount)).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]),
            Order.amount > 0,
            Order.created_at >= today_start,
        )
    )).scalar() or 0

    # 订单总数
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    paid_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED]))
    )).scalar() or 0
    pending_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING)
    )).scalar() or 0
    refunded_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.status.in_([OrderStatus.REFUNDED, OrderStatus.PARTIAL_REFUND]))
    )).scalar() or 0

    # 按订单类型统计
    type_rows = (await db.execute(
        select(Order.order_type, func.count(Order.id), func.sum(Order.amount))
        .group_by(Order.order_type)
    )).all()
    by_type = [
        {
            "type": str(r[0].value if hasattr(r[0], 'value') else r[0]),
            "count": r[1],
            "amount": round(r[2] or 0, 2),
        }
        for r in type_rows
    ]

    # 按支付方式统计
    method_rows = (await db.execute(
        select(Order.payment_method, func.count(Order.id), func.sum(Order.amount))
        .where(Order.payment_method.isnot(None))
        .group_by(Order.payment_method)
    )).all()
    by_payment = [
        {
            "method": str(r[0].value if hasattr(r[0], 'value') else r[0]),
            "count": r[1],
            "amount": round(r[2] or 0, 2),
        }
        for r in method_rows
    ]

    # 按状态统计
    status_rows = (await db.execute(
        select(Order.status, func.count(Order.id))
        .group_by(Order.status)
    )).all()
    by_status = {
        str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1]
        for r in status_rows
    }

    # 月增长率
    month_growth = 0
    if last_month_income > 0:
        month_growth = round((month_income - last_month_income) / last_month_income * 100, 1)

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "total_refund": round(total_refund, 2),
        "net_income": round(total_income - total_expense, 2),
        "month_income": round(month_income, 2),
        "last_month_income": round(last_month_income, 2),
        "month_growth": month_growth,
        "today_income": round(today_income, 2),
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "refunded_orders": refunded_orders,
        "by_type": by_type,
        "by_payment": by_payment,
        "by_status": by_status,
    }


@router.get("/orders/trends")
async def get_order_trends(
    days: int = Query(30, ge=7, le=90),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """订单趋势数据"""
    now = datetime.utcnow()
    start = now - timedelta(days=days)

    rows = (await db.execute(
        select(
            func.date(Order.created_at).label("day"),
            func.sum(case((Order.amount > 0, Order.amount), else_=0)).label("income"),
            func.sum(case((Order.amount < 0, func.abs(Order.amount)), else_=0)).label("expense"),
            func.count(Order.id).label("count"),
        )
        .where(Order.created_at >= start)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )).all()

    return {
        "days": [
            {
                "date": str(r[0]),
                "income": round(r[1] or 0, 2),
                "expense": round(r[2] or 0, 2),
                "count": r[3] or 0,
            }
            for r in rows
        ],
    }


@router.get("/orders")
async def list_orders(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    order_type: Optional[str] = Query(None, alias="type"),
    status_filter: Optional[str] = Query(None, alias="status"),
    payment_method: Optional[str] = Query(None, alias="payment"),
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """订单列表（支持筛选、搜索、分页）"""
    q = select(Order)

    if order_type:
        q = q.where(Order.order_type == order_type)
    if status_filter:
        q = q.where(Order.status == status_filter)
    if payment_method:
        q = q.where(Order.payment_method == payment_method)
    if user_id:
        q = q.where(Order.user_id == user_id)
    if search:
        q = q.where(or_(
            Order.order_no.contains(search),
            Order.title.contains(search),
            Order.description.contains(search),
        ))
    if start_date:
        try:
            q = q.where(Order.created_at >= datetime.fromisoformat(start_date))
        except ValueError:
            pass
    if end_date:
        try:
            q = q.where(Order.created_at <= datetime.fromisoformat(end_date + "T23:59:59"))
        except ValueError:
            pass

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(desc(Order.created_at)).offset(page * size).limit(size)
    rows = (await db.execute(q)).scalars().all()

    items = []
    for o in rows:
        user = None
        if o.user_id:
            user = (await db.execute(select(User).where(User.id == o.user_id))).scalar_one_or_none()
        items.append({
            "id": o.id,
            "order_no": o.order_no,
            "user_id": o.user_id,
            "user_name": user.name if user else None,
            "user_email": user.email if user else None,
            "order_type": o.order_type.value if hasattr(o.order_type, 'value') else o.order_type,
            "status": o.status.value if hasattr(o.status, 'value') else o.status,
            "amount": o.amount,
            "original_amount": o.original_amount,
            "discount": o.discount,
            "refund_amount": o.refund_amount,
            "payment_method": (o.payment_method.value if hasattr(o.payment_method, 'value') else o.payment_method) if o.payment_method else None,
            "payment_no": o.payment_no,
            "package_type": o.package_type,
            "title": o.title,
            "description": o.description,
            "admin_remark": o.admin_remark,
            "related_order_id": o.related_order_id,
            "created_at": str(o.created_at),
            "paid_at": str(o.paid_at) if o.paid_at else None,
            "refunded_at": str(o.refunded_at) if o.refunded_at else None,
        })

    return {"items": items, "total": total}


@router.get("/orders/{order_id}")
async def get_order_detail(
    order_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """订单详情"""
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    user = None
    if order.user_id:
        user = (await db.execute(select(User).where(User.id == order.user_id))).scalar_one_or_none()

    # 关联退款记录
    refund_orders = []
    if order.order_type != OrderType.REFUND:
        refund_rows = (await db.execute(
            select(Order).where(Order.related_order_id == order.id)
        )).scalars().all()
        refund_orders = [
            {"id": r.id, "order_no": r.order_no, "amount": r.amount, "created_at": str(r.created_at)}
            for r in refund_rows
        ]

    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "user_name": user.name if user else None,
        "user_email": user.email if user else None,
        "order_type": order.order_type.value if hasattr(order.order_type, 'value') else order.order_type,
        "status": order.status.value if hasattr(order.status, 'value') else order.status,
        "amount": order.amount,
        "original_amount": order.original_amount,
        "discount": order.discount,
        "refund_amount": order.refund_amount,
        "payment_method": (order.payment_method.value if hasattr(order.payment_method, 'value') else order.payment_method) if order.payment_method else None,
        "payment_no": order.payment_no,
        "package_id": order.package_id,
        "package_type": order.package_type,
        "title": order.title,
        "description": order.description,
        "admin_remark": order.admin_remark,
        "related_order_id": order.related_order_id,
        "refund_orders": refund_orders,
        "created_at": str(order.created_at),
        "updated_at": str(order.updated_at),
        "paid_at": str(order.paid_at) if order.paid_at else None,
        "refunded_at": str(order.refunded_at) if order.refunded_at else None,
    }


@router.post("/orders/{order_id}/refund")
async def refund_order(
    order_id: int,
    req: OrderRefundRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    """订单退款"""
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status not in (OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.PARTIAL_REFUND):
        raise HTTPException(status_code=400, detail="该订单状态不可退款")
    if req.refund_amount > (order.amount - order.refund_amount):
        raise HTTPException(status_code=400, detail="退款金额超过可退金额")

    import random, string
    refund_no = f"REF-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.digits, k=4))}"

    # 创建退款订单
    refund_order = Order(
        order_no=refund_no,
        user_id=order.user_id,
        order_type=OrderType.REFUND,
        status=OrderStatus.COMPLETED,
        amount=-req.refund_amount,
        original_amount=req.refund_amount,
        payment_method=PaymentMethod.SYSTEM,
        title=f"退款 - {order.title}",
        description=req.reason,
        related_order_id=order.id,
        paid_at=datetime.utcnow(),
        refunded_at=datetime.utcnow(),
    )
    db.add(refund_order)

    # 更新原订单
    order.refund_amount += req.refund_amount
    if order.refund_amount >= order.amount:
        order.status = OrderStatus.REFUNDED
    else:
        order.status = OrderStatus.PARTIAL_REFUND
    order.refunded_at = datetime.utcnow()

    await db.flush()

    await log_audit(db, admin.id, "order_refund", "order", order.id,
                    f"退款 ¥{req.refund_amount}，订单 {order.order_no}",
                    request=request)

    return {"success": True, "refund_order_no": refund_no, "message": f"退款 ¥{req.refund_amount} 已处理"}


@router.put("/orders/{order_id}/remark")
async def update_order_remark(
    order_id: int,
    req: OrderRemarkRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """更新订单管理员备注"""
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    order.admin_remark = req.admin_remark
    await db.flush()
    return {"success": True}


@router.post("/orders/manual")
async def create_manual_order(
    req: ManualOrderRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    """手动创建收支记录（平台支出/收入/调账）"""
    allowed_types = [OrderType.PLATFORM_EXPENSE, OrderType.PLATFORM_INCOME, OrderType.ADJUSTMENT]
    try:
        otype = OrderType(req.order_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"无效的订单类型，可选: {[t.value for t in allowed_types]}")

    if otype not in allowed_types:
        raise HTTPException(status_code=400, detail="只能手动创建平台收支或调账记录")

    import random, string
    prefix = {"platform_expense": "EXP", "platform_income": "INC", "adjustment": "ADJ"}
    order_no = f"{prefix.get(req.order_type, 'ORD')}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.digits, k=4))}"

    amount = req.amount if otype == OrderType.PLATFORM_INCOME else -req.amount
    if otype == OrderType.ADJUSTMENT:
        amount = req.amount  # 调账可正可负

    pm = None
    if req.payment_method:
        try:
            pm = PaymentMethod(req.payment_method)
        except ValueError:
            pm = PaymentMethod.SYSTEM

    order = Order(
        order_no=order_no,
        user_id=None,
        order_type=otype,
        status=OrderStatus.COMPLETED,
        amount=amount,
        original_amount=abs(req.amount),
        payment_method=pm or PaymentMethod.SYSTEM,
        title=req.title,
        description=req.description,
        paid_at=datetime.utcnow(),
    )
    db.add(order)
    await db.flush()

    await log_audit(db, admin.id, "order_create", "order", order.id,
                    f"手动创建{req.order_type}记录: {req.title}, ¥{req.amount}",
                    request=request)

    return {"success": True, "order_no": order_no, "id": order.id}


# ═════════════════════════════════════════════════════════════════════
# 17. 管理员管理 & 角色管理
# ═════════════════════════════════════════════════════════════════════

class AdminCreateRequest(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None

class AdminUpdateRequest(BaseModel):
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class RoleCreateRequest(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None


# ─── 权限模块查询 ──────────────────────────────────────────────────

@router.get("/permissions/modules")
async def get_permission_modules(admin: User = Depends(require_admin)):
    """返回所有可用权限模块及操作列表"""
    result = []
    for module_key, info in PERMISSION_MODULES.items():
        actions = []
        for act in info["actions"]:
            actions.append({"key": act, "label": ACTION_LABELS.get(act, act)})
        result.append({
            "key": module_key,
            "label": info["label"],
            "actions": actions,
        })
    return result


# ─── 角色 CRUD ─────────────────────────────────────────────────────

@router.get("/roles")
async def get_roles(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """角色列表（含关联管理员数量）"""
    result = await db.execute(select(AdminRole).order_by(asc(AdminRole.id)))
    roles = result.scalars().all()

    items = []
    for role in roles:
        # 统计使用该角色的管理员数量
        cnt = (await db.execute(
            select(func.count(User.id)).where(
                User.admin_role_id == role.id,
                User.role == UserRole.ADMIN,
            )
        )).scalar() or 0

        items.append({
            "id": role.id,
            "name": role.name,
            "display_name": role.display_name,
            "description": role.description,
            "permissions": role.permissions,
            "is_system": role.is_system,
            "user_count": cnt,
            "created_at": role.created_at.isoformat() if role.created_at else None,
            "updated_at": role.updated_at.isoformat() if role.updated_at else None,
        })
    return items


@router.post("/roles")
async def create_role(
    req: RoleCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission("admin_mgmt", "manage")),
):
    """新建自定义角色"""
    # 检查 name 唯一性
    existing = (await db.execute(
        select(AdminRole).where(AdminRole.name == req.name)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "角色标识已存在")

    role = AdminRole(
        name=req.name,
        display_name=req.display_name,
        description=req.description,
        is_system=False,
    )
    role.permissions = req.permissions
    db.add(role)
    await db.flush()

    await log_audit(db, admin.id, "role_create", "admin", role.id,
                    f"创建管理员角色: {role.display_name}",
                    request=request)

    return {"success": True, "id": role.id}


@router.put("/roles/{role_id}")
async def update_role(
    role_id: int,
    req: RoleUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission("admin_mgmt", "manage")),
):
    """编辑角色权限"""
    role = (await db.execute(
        select(AdminRole).where(AdminRole.id == role_id)
    )).scalar_one_or_none()
    if not role:
        raise HTTPException(404, "角色不存在")

    if req.display_name is not None:
        role.display_name = req.display_name
    if req.description is not None:
        role.description = req.description
    if req.permissions is not None:
        role.permissions = req.permissions

    await db.flush()

    await log_audit(db, admin.id, "role_update", "admin", role.id,
                    f"更新管理员角色: {role.display_name}",
                    request=request)

    return {"success": True}


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission("admin_mgmt", "manage")),
):
    """删除自定义角色（系统角色不可删）"""
    role = (await db.execute(
        select(AdminRole).where(AdminRole.id == role_id)
    )).scalar_one_or_none()
    if not role:
        raise HTTPException(404, "角色不存在")
    if role.is_system:
        raise HTTPException(400, "系统角色不可删除")

    # 检查是否有管理员在使用
    cnt = (await db.execute(
        select(func.count(User.id)).where(User.admin_role_id == role_id)
    )).scalar() or 0
    if cnt > 0:
        raise HTTPException(400, f"该角色下还有 {cnt} 位管理员，请先移除或更换角色")

    await log_audit(db, admin.id, "role_delete", "admin", role.id,
                    f"删除管理员角色: {role.display_name}",
                    request=request)

    await db.delete(role)
    return {"success": True}


# ─── 管理员 CRUD ──────────────────────────────────────────────────

@router.get("/administrators")
async def get_administrators(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """管理员列表"""
    result = await db.execute(
        select(User).where(User.role == UserRole.ADMIN).order_by(desc(User.created_at))
    )
    admins = result.scalars().all()

    # 加载角色信息
    role_ids = [a.admin_role_id for a in admins if a.admin_role_id]
    roles_map = {}
    if role_ids:
        roles_result = await db.execute(
            select(AdminRole).where(AdminRole.id.in_(role_ids))
        )
        for r in roles_result.scalars().all():
            roles_map[r.id] = r

    items = []
    for a in admins:
        role = roles_map.get(a.admin_role_id) if a.admin_role_id else None
        items.append({
            "id": a.id,
            "name": a.name,
            "email": a.email,
            "avatar_url": a.avatar_url,
            "is_active": a.is_active,
            "admin_role_id": a.admin_role_id,
            "admin_role": {
                "id": role.id,
                "name": role.name,
                "display_name": role.display_name,
            } if role else None,
            "last_login": a.last_login.isoformat() if a.last_login else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    # 统计
    total = len(items)
    active_count = sum(1 for a in items if a["is_active"])
    role_dist = {}
    for a in items:
        rname = a["admin_role"]["display_name"] if a["admin_role"] else "未分配角色"
        role_dist[rname] = role_dist.get(rname, 0) + 1

    return {
        "items": items,
        "total": total,
        "active_count": active_count,
        "role_distribution": role_dist,
    }


@router.post("/administrators")
async def create_administrator(
    req: AdminCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission("admin_mgmt", "manage")),
):
    """添加管理员（提升现有用户或创建新管理员）"""
    user = None

    if req.user_id:
        # 提升现有用户
        user = (await db.execute(
            select(User).where(User.id == req.user_id)
        )).scalar_one_or_none()
        if not user:
            raise HTTPException(404, "用户不存在")
        if user.role == UserRole.ADMIN:
            raise HTTPException(400, "该用户已是管理员")
    elif req.email:
        # 检查邮箱是否已存在
        existing = (await db.execute(
            select(User).where(User.email == req.email)
        )).scalar_one_or_none()
        if existing:
            raise HTTPException(400, "该邮箱已注册，请使用 user_id 提升")
        # 创建新管理员账号
        user = User(
            email=req.email,
            name=req.name or req.email.split("@")[0],
            hashed_password=get_password_hash(req.password or "admin123"),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
    else:
        raise HTTPException(400, "请提供 user_id 或 email")

    user.role = UserRole.ADMIN
    if req.role_id:
        # 验证角色存在
        role = (await db.execute(
            select(AdminRole).where(AdminRole.id == req.role_id)
        )).scalar_one_or_none()
        if not role:
            raise HTTPException(400, "指定角色不存在")
        user.admin_role_id = req.role_id

    await db.flush()

    await log_audit(db, admin.id, "admin_create", "admin", user.id,
                    f"添加管理员: {user.name} ({user.email})",
                    request=request)

    return {"success": True, "id": user.id}


@router.put("/administrators/{user_id}")
async def update_administrator(
    user_id: int,
    req: AdminUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission("admin_mgmt", "manage")),
):
    """编辑管理员（修改角色、状态）"""
    user = (await db.execute(
        select(User).where(User.id == user_id, User.role == UserRole.ADMIN)
    )).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "管理员不存在")

    changes = []
    if req.role_id is not None:
        if req.role_id == 0:
            user.admin_role_id = None
            changes.append("移除角色")
        else:
            role = (await db.execute(
                select(AdminRole).where(AdminRole.id == req.role_id)
            )).scalar_one_or_none()
            if not role:
                raise HTTPException(400, "指定角色不存在")
            user.admin_role_id = req.role_id
            changes.append(f"角色→{role.display_name}")

    if req.is_active is not None:
        if user_id == admin.id:
            raise HTTPException(400, "不能禁用自己的账号")
        user.is_active = req.is_active
        changes.append("启用" if req.is_active else "禁用")

    await db.flush()

    if changes:
        await log_audit(db, admin.id, "admin_update", "admin", user.id,
                        f"修改管理员 {user.name}: {', '.join(changes)}",
                        request=request)

    return {"success": True}


@router.put("/administrators/{user_id}/toggle")
async def toggle_administrator(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission("admin_mgmt", "manage")),
):
    """启用/禁用管理员"""
    user = (await db.execute(
        select(User).where(User.id == user_id, User.role == UserRole.ADMIN)
    )).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "管理员不存在")
    if user_id == admin.id:
        raise HTTPException(400, "不能禁用自己的账号")

    user.is_active = not user.is_active
    await db.flush()

    action_label = "启用" if user.is_active else "禁用"
    await log_audit(db, admin.id, f"admin_{action_label}", "admin", user.id,
                    f"{action_label}管理员: {user.name}",
                    request=request)

    return {"success": True, "is_active": user.is_active}


@router.delete("/administrators/{user_id}")
async def delete_administrator(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_permission("admin_mgmt", "manage")),
):
    """移除管理员权限（降级为普通用户，不删除账号）"""
    user = (await db.execute(
        select(User).where(User.id == user_id, User.role == UserRole.ADMIN)
    )).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "管理员不存在")
    if user_id == admin.id:
        raise HTTPException(400, "不能移除自己的管理员权限")

    old_role_name = "未分配"
    if user.admin_role_id:
        role = (await db.execute(
            select(AdminRole).where(AdminRole.id == user.admin_role_id)
        )).scalar_one_or_none()
        if role:
            old_role_name = role.display_name

    user.role = UserRole.VIEWER
    user.admin_role_id = None
    await db.flush()

    await log_audit(db, admin.id, "admin_remove", "admin", user.id,
                    f"移除管理员权限: {user.name} (原角色: {old_role_name})",
                    request=request)

    return {"success": True}
