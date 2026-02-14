import { useState, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, UserCheck, GitBranch, CircleDollarSign,
  UserPlus, Ticket, Bell, Bot, FileText, Shield, Settings, LogOut,
  ChevronLeft, ChevronRight, Search, RefreshCw, Edit, Trash2, Eye,
  CheckCircle, XCircle, Gift, Send, Plus, X, AlertTriangle,
  TrendingUp, Activity, BarChart3, ArrowUpRight, ArrowDownRight, Star,
  MessageSquare, Key, Webhook, Globe, Clock, Filter, MoreHorizontal,
  Receipt, CreditCard, Wallet, DollarSign, ArrowDown, Download, Hash, Minus,
  ArrowLeft, Mail, Phone, MapPin, Calendar, Award, Zap, Package,
  PieChart, TrendingDown, Percent, Target, ShieldCheck, RotateCcw,
  Sun, Moon, Menu,
} from 'lucide-react';
import * as api from './services/api';

// ═══════════════════════════════════════════════════════════════════
// 通用组件
// ═══════════════════════════════════════════════════════════════════

const Badge = ({ children, color = 'bg-slate-100 text-slate-600' }: { children: ReactNode; color?: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${color}`}>{children}</span>
);

// 中文标签映射
const LABEL_MAP: Record<string, string> = {
  active: '在线', open: '待处理', closed: '已关闭', processing: '处理中',
  resolved: '已解决', draft: '草稿', paused: '已暂停', valid: '已通过',
  pending: '待审核', expired: '已拒绝', rewarded: '已奖励', registered: '已注册',
  free: '免费版', pro: '专业版', ultra: '旗舰版',
  admin: '管理员', recruiter: '招聘方', candidate: '候选人', viewer: '观察者',
  info: '信息', warning: '警告', danger: '危险',
  high: '高', normal: '普通', low: '低', urgent: '紧急', medium: '中',
  bug: 'Bug', feature: '功能', question: '问题', complaint: '投诉',
  chat: 'AI 对话', resume_parse: '简历解析', job_match: '职位匹配',
  interview: '面试评估', market_analysis: '市场分析', route_dispatch: '路由调度',
  invite_reward: '邀请奖励', other: '其他', profile_build: '画像构建',
  system: '系统', match: '匹配', message: '消息',
  auth: '认证', data: '数据', ai: 'AI', api: 'API',
  full_time: '全职', part_time: '兼职', contract: '合同', internship: '实习', remote: '远程',
  PENDING: '待处理', IN_PROGRESS: '进行中', RUNNING: '运行中', COMPLETED: '已完成', CANCELLED: '已取消',
  screening: '筛选中', interviewing: '面试中', offering: '发放Offer', hired: '已录用', rejected: '已淘汰',
  accepted: '已通过', parse: '简历解析', final: '终面', initial: '初筛', phone_screen: '电话筛选',
  applied: '已投递', withdrawn: '已撤回', on_hold: '暂搁',
};

/** 通用头像组件：有 avatar_url 时显示图片，否则显示首字母 */
const Avatar = ({ name, url, size = 'sm' }: { name?: string; url?: string | null; size?: 'xs' | 'sm' | 'md' | 'lg' }) => {
  const sizeMap = { xs: 'w-8 h-8 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-xl' };
  const radiusMap = { xs: 'rounded', sm: 'rounded-md', md: 'rounded-md', lg: 'rounded-md' };
  const cls = sizeMap[size] || sizeMap.sm;
  const radius = radiusMap[size] || 'rounded-md';
  const isLg = size === 'lg';
  if (url) {
    const src = url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`;
    return <img src={src} alt={name || ''} className={`${cls} ${radius} object-cover shrink-0`} />;
  }
  const gradients = [
    'from-indigo-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-blue-500 to-cyan-500',
  ];
  const idx = (name || '').charCodeAt(0) % gradients.length;
  return (
    <div className={`${cls} ${radius} bg-gradient-to-br ${gradients[idx]} text-white flex items-center justify-center font-semibold shrink-0 ${isLg ? 'shadow-lg shadow-indigo-200/50' : ''}`}>
      {(name || '?')[0]}
    </div>
  );
};

const StatusBadge = ({ value }: { value: string }) => {
  const colorMap: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700', open: 'bg-amber-100 text-amber-700',
    closed: 'bg-slate-100 text-slate-500', processing: 'bg-blue-100 text-blue-700',
    resolved: 'bg-emerald-100 text-emerald-700', draft: 'bg-slate-100 text-slate-500',
    paused: 'bg-amber-100 text-amber-700', valid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700', expired: 'bg-rose-100 text-rose-700',
    rewarded: 'bg-emerald-100 text-emerald-700', registered: 'bg-blue-100 text-blue-700',
    free: 'bg-slate-100 text-slate-600', pro: 'bg-indigo-100 text-indigo-700',
    ultra: 'bg-purple-100 text-purple-700',
    admin: 'bg-rose-100 text-rose-700', recruiter: 'bg-blue-100 text-blue-700',
    candidate: 'bg-emerald-100 text-emerald-700', viewer: 'bg-slate-100 text-slate-500',
    info: 'bg-blue-100 text-blue-700', warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    high: 'bg-rose-100 text-rose-700', normal: 'bg-blue-100 text-blue-700',
    low: 'bg-slate-100 text-slate-500', urgent: 'bg-rose-100 text-rose-700',
    bug: 'bg-rose-100 text-rose-700', feature: 'bg-indigo-100 text-indigo-700',
    question: 'bg-blue-100 text-blue-700', complaint: 'bg-amber-100 text-amber-700',
    chat: 'bg-indigo-100 text-indigo-700', resume_parse: 'bg-cyan-100 text-cyan-700',
    job_match: 'bg-emerald-100 text-emerald-700', interview: 'bg-amber-100 text-amber-700',
    market_analysis: 'bg-purple-100 text-purple-700', route_dispatch: 'bg-slate-100 text-slate-600',
    invite_reward: 'bg-pink-100 text-pink-700', other: 'bg-slate-100 text-slate-500',
    profile_build: 'bg-teal-100 text-teal-700',
    system: 'bg-slate-100 text-slate-600', auth: 'bg-indigo-100 text-indigo-700',
    data: 'bg-emerald-100 text-emerald-700', ai: 'bg-purple-100 text-purple-700', api: 'bg-cyan-100 text-cyan-700',
    PENDING: 'bg-amber-100 text-amber-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
    RUNNING: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-slate-100 text-slate-500',
    screening: 'bg-blue-100 text-blue-700', interviewing: 'bg-amber-100 text-amber-700',
    offering: 'bg-purple-100 text-purple-700', hired: 'bg-emerald-100 text-emerald-700', rejected: 'bg-rose-100 text-rose-700',
    accepted: 'bg-emerald-100 text-emerald-700', parse: 'bg-cyan-100 text-cyan-700', final: 'bg-purple-100 text-purple-700',
    initial: 'bg-blue-100 text-blue-700', phone_screen: 'bg-sky-100 text-sky-700',
    applied: 'bg-blue-100 text-blue-700', withdrawn: 'bg-slate-100 text-slate-500', on_hold: 'bg-amber-100 text-amber-700',
  };
  return <Badge color={colorMap[value] || 'bg-slate-50 text-slate-600'}>{LABEL_MAP[value] || value}</Badge>;
};

/** 用户名可点击跳转到用户详情页 */
const UserLink = ({ id, name, className = '' }: { id: number; name?: string; className?: string }) => {
  const navigate = useNavigate();
  return (
    <span className={`cursor-pointer hover:text-indigo-600 transition-colors ${className}`} onClick={(e) => { e.stopPropagation(); navigate(`/users/${id}`); }}>
      {name || `#${id}`}
    </span>
  );
};

const Card = ({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`bg-white rounded-md border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`} onClick={onClick}>{children}</div>
);

const StatCard = ({ label, value, sub, icon: Icon, trend }: { label: string; value: string | number; sub?: string; icon: any; trend?: number }) => (
  <Card className="p-6 card-hover">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[13px] text-slate-500 font-medium mb-2">{label}</p>
        <p className="text-xl font-bold text-slate-900 tracking-tight tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
      </div>
      <div className="p-2.5 rounded-md bg-indigo-50/60">
        <Icon size={20} className="text-indigo-400" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-[13px] font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(trend)}%
      </div>
    )}
  </Card>
);

const PageHeader = ({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">
    <div>
      <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 md:gap-3 flex-wrap">{actions}</div>}
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-28 gap-4 animate-fade-in">
    <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 border-t-indigo-500 spin-smooth" />
    <span className="text-xs text-slate-400 font-medium">加载中...</span>
  </div>
);

const EmptyState = ({ text = '暂无数据' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-14 h-14 rounded-md bg-slate-50 flex items-center justify-center mb-1">
      <FileText size={22} className="text-slate-300" />
    </div>
    <span className="text-xs text-slate-400">{text}</span>
  </div>
);

const Pagination = ({ page, size, total, onChange }: { page: number; size: number; total: number; onChange: (p: number) => void }) => {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 md:mt-6 px-1 gap-2">
      <span className="text-xs text-slate-400 shrink-0">共 {total} 条</span>
      <div className="flex items-center gap-1.5 md:gap-2">
        <button onClick={() => onChange(page - 1)} disabled={page === 0}
          className="px-3 md:px-4 py-1.5 md:py-2 rounded-md border border-slate-200 text-xs md:text-[13px] text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200">
          上一页
        </button>
        <span className="px-2 py-1.5 text-xs md:text-[13px] text-slate-500 font-medium tabular-nums">{page + 1}/{pages}</span>
        <button onClick={() => onChange(page + 1)} disabled={page >= pages - 1}
          className="px-3 md:px-4 py-1.5 md:py-2 rounded-md border border-slate-200 text-xs md:text-[13px] text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200">
          下一页
        </button>
      </div>
    </div>
  );
};

const Modal = ({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] modal-overlay" onClick={onClose}>
      <div className={`bg-white rounded-md shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} mx-3 md:mx-4 max-h-[90vh] md:max-h-[85vh] overflow-auto modal-content border border-slate-200/50`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-md">
          <h3 className="text-sm md:text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600" title="关闭 (Esc)"><X size={18} /></button>
        </div>
        <div className="px-4 md:px-6 py-4 md:py-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};

// ═══════════════════════════════════════════════════════════════════
// 登录页
// ═══════════════════════════════════════════════════════════════════

const LoginPage = () => {
  const [email, setEmail] = useState('admin@devnors.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.login(email, password);
      localStorage.setItem('admin_token', res.access_token);
      const me = await api.getMe();
      if (me.role !== 'admin') {
        localStorage.removeItem('admin_token');
        setError('需要管理员权限');
        return;
      }
      localStorage.setItem('admin_user', JSON.stringify(me));
      navigate('/');
    } catch (e: any) {
      setError(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] relative overflow-hidden">
      {/* 装饰背景 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl -translate-y-1/2" />

      <div className="w-full max-w-[380px] relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-md flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <Shield size={20} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Devnors Admin</h1>
          <p className="text-xs text-slate-400 mt-2">管理后台控制中心</p>
        </div>
        <Card className="p-8">
          {error && <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/60 rounded-md text-sm text-rose-600 font-medium">{error}</div>}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-600 mb-2 block">邮箱</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@devnors.com"
              className="w-full px-4 py-3 rounded-md border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white placeholder:text-slate-300" />
          </div>
          <div className="mb-8">
            <label className="text-sm font-medium text-slate-600 mb-2 block">密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 rounded-md border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white placeholder:text-slate-300" />
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200/50 active:scale-[0.98]">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white spin-smooth" />
                登录中...
              </span>
            ) : '登录'}
          </button>
        </Card>
        <p className="text-center text-xs text-slate-300 mt-6">Devnors &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 布局
// ═══════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/analytics', label: '运营数据', icon: BarChart3 },
  { path: '/users', label: '用户管理', icon: Users },
  { path: '/enterprises', label: '企业管理', icon: Building2 },
  { path: '/jobs', label: '职位管理', icon: Briefcase },
  { path: '/candidates', label: '候选人', icon: UserCheck },
  { path: '/flows', label: '招聘流程', icon: GitBranch },
  { path: '/tokens', label: 'Token管理', icon: CircleDollarSign },
  { path: '/orders', label: '订单管理', icon: Receipt },
  { path: '/invitations', label: '邀请管理', icon: UserPlus },
  { path: '/tickets', label: '工单管理', icon: Ticket },
  { path: '/notifications', label: '通知管理', icon: Bell },
  { path: '/ai', label: 'AI 监控', icon: Bot },
  { path: '/content', label: '内容管理', icon: FileText },
  { path: '/audit', label: '审计安全', icon: Shield },
  { path: '/admins', label: '管理员', icon: ShieldCheck },
  { path: '/settings', label: '系统设置', icon: Settings },
];

const safeParseUser = (): any => {
  try { return JSON.parse(localStorage.getItem('admin_user') || '{}'); } catch { return {}; }
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('admin_dark') === '1');
  const navigate = useNavigate();
  const location = useLocation();
  const user = safeParseUser();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('admin_dark', dark ? '1' : '0');
  }, [dark]);

  // 路由变化时自动关闭移动端侧边栏
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  /* 侧边栏内容（桌面端/移动端共享） */
  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 shrink-0">
        {(isMobile || !collapsed) && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-md flex items-center justify-center shadow-sm shadow-indigo-200">
              <Shield size={15} className="text-white" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-slate-900 tracking-tight">Devnors</span>
              <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">Admin</span>
            </div>
          </div>
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className={`p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 ${collapsed ? 'mx-auto' : 'ml-auto'}`}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button key={item.path} onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium mb-0.5 transition-all duration-150 ${
                active
                  ? 'bg-indigo-50/80 text-indigo-700 shadow-[0_0_0_1px_rgba(79,70,229,0.08)]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
              title={(!isMobile && collapsed) ? item.label : undefined}
            >
              <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} className={`shrink-0 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
              {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-3.5 shrink-0">
        {(isMobile || !collapsed) && (
          <div onClick={() => handleNav('/profile')} className="flex items-center gap-3 mb-3 px-2.5 py-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors group">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
              {(user.name || 'A')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">{user.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user.admin_role?.display_name || '系统管理员'}</p>
            </div>
            <Settings size={14} className="text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <div className={`flex items-center ${(!isMobile && collapsed) ? 'justify-center' : 'justify-between px-2'}`}>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-500 font-medium transition-colors">
            <LogOut size={15} /> {(isMobile || !collapsed) && '退出登录'}
          </button>
          <button onClick={() => setDark(!dark)} className="p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-slate-100 transition-colors" title={dark ? '浅色模式' : '深色模式'}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc]">
      {/* 桌面端侧边栏 */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200/70 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'w-[64px]' : 'w-[240px]'}`}>
        {sidebarContent(false)}
      </aside>

      {/* 移动端侧边栏遮罩 + 抽屉 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-white flex flex-col shadow-2xl animate-slide-in-left">
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 移动端顶部栏 */}
        <header className="md:hidden flex items-center justify-between h-12 px-4 bg-white border-b border-slate-200/70 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 -ml-1 hover:bg-slate-100 rounded-md text-slate-500">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded flex items-center justify-center">
              <Shield size={11} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">Devnors</span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">Admin</span>
          </div>
          <button onClick={() => setDark(!dark)} className="p-1.5 -mr-1 text-slate-400 hover:text-indigo-500">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-[1440px] mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 1. 仪表盘
// ═══════════════════════════════════════════════════════════════════

const DashboardPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [recent, setRecent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTime, setRefreshTime] = useState(new Date());
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getDashboardStats(),
      api.getDashboardTrends(30).catch(() => null),
      api.getDashboardRecent().catch(() => null),
    ])
      .then(([s, t, r]) => { setStats(s); setTrends(t); setRecent(r); setRefreshTime(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <EmptyState text="加载失败" />;

  // 趋势迷你图：SVG sparkline with gradient fill
  const Sparkline = ({ data, color = '#6366f1' }: { data: number[]; color?: string }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const w = 120, h = 36;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ');
    const areaPoints = `0,${h} ${points} ${w},${h}`;
    const id = `sparkline-${color.replace('#', '')}`;
    return (
      <svg width={w} height={h} className="mt-1">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#${id})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const userTrendData = trends?.user_growth?.map((d: any) => d.count) || [];
  const tokenTrendData = trends?.token_consumption?.map((d: any) => d.amount) || [];
  const jobTrendData = trends?.job_posts?.map((d: any) => d.count) || [];

  return (
    <>
      <PageHeader title="仪表盘" sub="平台运营数据概览" actions={
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 tabular-nums">更新于 {refreshTime.toLocaleString('zh-CN')}</span>
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600" title="刷新"><RefreshCw size={16} /></button>
        </div>
      } />

      {/* 核心指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
        <Card className="p-6 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500 font-medium mb-2">总用户</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight tabular-nums">{stats.users.total.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2">今日新增 <span className="font-semibold text-indigo-600">{stats.users.today_new}</span></p>
            </div>
            <Sparkline data={userTrendData} color="#6366f1" />
          </div>
        </Card>
        <Card className="p-6 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500 font-medium mb-2">在线职位</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight tabular-nums">{stats.business.active_jobs}</p>
              <p className="text-xs text-slate-400 mt-2">总计 {stats.business.total_jobs} 个</p>
            </div>
            <Sparkline data={jobTrendData} color="#10b981" />
          </div>
        </Card>
        <Card className="p-6 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500 font-medium mb-2">Token 流通余额</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight tabular-nums">{stats.tokens.total_balance.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2">累计消耗 {stats.tokens.total_consumed.toLocaleString()}</p>
            </div>
            <Sparkline data={tokenTrendData} color="#f59e0b" />
          </div>
        </Card>
        <StatCard label="待处理工单" value={stats.tickets.open} sub="需要及时响应" icon={Ticket} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
        <StatCard label="候选人" value={stats.business.total_candidates} icon={UserCheck} />
        <StatCard label="招聘流程" value={stats.business.total_flows} icon={GitBranch} />
        <StatCard label="Token 发放总量" value={stats.tokens.total_granted.toLocaleString()} icon={Gift} />
        <StatCard label="累计收入" value={`¥${stats.revenue.total}`} icon={TrendingUp} />
      </div>

      {/* 快捷操作 */}
      <Card className="p-6 mb-7">
        <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> 快捷操作</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[
            { label: '用户管理', path: '/users', icon: Users, color: 'bg-blue-50 text-blue-600', desc: `${stats.users.total} 位用户` },
            { label: '订单管理', path: '/orders', icon: Receipt, color: 'bg-teal-50 text-teal-600', desc: `¥${stats.revenue.total} 收入` },
            { label: '工单管理', path: '/tickets', icon: Ticket, color: 'bg-amber-50 text-amber-600', desc: `${stats.tickets.open} 待处理` },
            { label: '企业认证', path: '/enterprises', icon: Building2, color: 'bg-emerald-50 text-emerald-600', desc: '审核管理' },
            { label: 'AI 监控', path: '/ai', icon: Bot, color: 'bg-purple-50 text-purple-600', desc: '对话与调用' },
            { label: '发送通知', path: '/notifications', icon: Bell, color: 'bg-rose-50 text-rose-600', desc: '消息推送' },
            { label: '审计日志', path: '/audit', icon: Shield, color: 'bg-indigo-50 text-indigo-600', desc: '安全审计' },
            { label: '内容管理', path: '/content', icon: FileText, color: 'bg-cyan-50 text-cyan-600', desc: '更新日志' },
            { label: '系统设置', path: '/settings', icon: Settings, color: 'bg-slate-100 text-slate-600', desc: '平台配置' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex items-center gap-3.5 p-4 rounded-md border border-slate-100 hover:border-indigo-200/60 hover:bg-indigo-50/30 hover:shadow-sm transition-all text-left group">
              <div className={`w-10 h-10 rounded-md ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <item.icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* 角色分布 + 最近动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-500" /> 用户角色分布</h3>
          <div className="space-y-5">
            {Object.entries(stats.users.role_distribution || {}).map(([role, count]: any) => {
              const pct = stats.users.total > 0 ? Math.round(count / stats.users.total * 100) : 0;
              const colors: Record<string, string> = { admin: 'bg-rose-500', recruiter: 'bg-blue-500', candidate: 'bg-emerald-500', viewer: 'bg-slate-400' };
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge value={role} />
                    <span className="text-[13px] font-semibold text-slate-600 tabular-nums">{count} <span className="text-slate-300 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2">
                    <div className={`${colors[role] || 'bg-slate-400'} rounded-full h-2 transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2"><Activity size={16} className="text-amber-500" /> 最近动态</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {recent?.recent_users?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 text-[13px] py-1.5">
                <Avatar name={u.name} url={u.avatar_url} size="xs" />
                <div className="flex-1 min-w-0">
                  <span className="text-slate-700 font-medium">{u.name}</span>
                  <span className="text-slate-400"> 注册了账户</span>
                </div>
                <span className="text-slate-300 shrink-0 text-xs">{u.created_at?.slice(5, 10)}</span>
              </div>
            ))}
            {recent?.recent_jobs?.map((j: any) => (
              <div key={`j-${j.id}`} className="flex items-center gap-3 text-[13px] py-1.5">
                <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"><Briefcase size={14} /></div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-700 font-medium">{j.company}</span>
                  <span className="text-slate-400"> 发布了 </span>
                  <span className="text-slate-600">{j.title}</span>
                </div>
                <StatusBadge value={j.status} />
              </div>
            ))}
            {recent?.recent_tickets?.map((t: any) => (
              <div key={`t-${t.id}`} className="flex items-center gap-3 text-[13px] py-1.5">
                <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"><AlertTriangle size={14} /></div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-400">新工单: </span>
                  <span className="text-slate-700 font-medium">{t.title}</span>
                </div>
                <StatusBadge value={t.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 2. 用户管理
// ═══════════════════════════════════════════════════════════════════

const UsersPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<any>(null);
  const [tokenModal, setTokenModal] = useState<any>(null);
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenReason, setTokenReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.getUsers({ page, size: 20, search, role: roleFilter })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUpdateUser = async (id: number, field: string, value: any) => {
    try {
      await api.updateUser(id, { [field]: value });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleGrantTokens = async () => {
    if (!tokenModal || !tokenAmount) return;
    const amount = parseInt(tokenAmount);
    if (isNaN(amount) || amount === 0) { alert('请输入有效的 Token 数量'); return; }
    try {
      await api.grantTokens(tokenModal.id, amount, tokenReason || '管理员操作');
      setTokenModal(null); setTokenAmount(''); setTokenReason('');
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <>
      <PageHeader title="用户管理" sub={`共 ${data?.total || 0} 位用户`} />

      <Card className="mb-5 p-5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="搜索姓名/UID/手机..."
            className="w-full pl-10 pr-3 py-2.5 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 rounded-md border border-slate-200 text-[13px] text-slate-600">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="recruiter">招聘方</option>
          <option value="candidate">候选人</option>
          <option value="viewer">观察者</option>
        </select>
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      </Card>

      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-4 text-xs font-semibold text-slate-400">用户</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400">角色</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400">等级</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400">手机</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400">Token 余额</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400">状态</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400">注册时间</th>
                  <th className="text-right p-4 text-xs font-semibold text-slate-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u: any) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/users/${u.id}`)}>
                        <Avatar name={u.name} url={u.avatar_url} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{u.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">UID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge value={u.role} /></td>
                    <td className="p-4"><StatusBadge value={u.account_tier} /></td>
                    <td className="p-4 text-[13px] text-slate-500">{u.phone || <span className="text-slate-300">-</span>}</td>
                    <td className="p-4 text-[13px] font-semibold text-amber-600 tabular-nums">{u.token_balance != null ? u.token_balance.toLocaleString() : '-'}</td>
                    <td className="p-4">
                      <button onClick={() => handleUpdateUser(u.id, 'is_active', !u.is_active)}
                        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${u.is_active ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {u.is_active ? <><CheckCircle size={14} /> 活跃</> : <><XCircle size={14} /> 禁用</>}
                      </button>
                    </td>
                    <td className="p-4 text-xs text-slate-400">{u.created_at?.slice(0, 10)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => navigate(`/users/${u.id}`)} className="p-2 hover:bg-slate-100 rounded-md" title="详情"><Eye size={15} className="text-slate-400" /></button>
                        <button onClick={() => setEditUser(u)} className="p-2 hover:bg-slate-100 rounded-md" title="编辑"><Edit size={15} className="text-slate-400" /></button>
                        <button onClick={() => setTokenModal(u)} className="p-2 hover:bg-slate-100 rounded-md" title="Token"><CircleDollarSign size={15} className="text-amber-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      {/* 编辑用户 Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`编辑用户 - ${editUser?.name}`}>
        {editUser && (
          <div className="space-y-4">
            {/* 用户概况 */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md">
              <Avatar name={editUser.name} url={editUser.avatar_url} size="md" />
              <div>
                <p className="text-sm font-bold text-slate-800">{editUser.name}</p>
                <p className="text-xs text-slate-400">UID: {editUser.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-2 bg-slate-50 rounded-md"><span className="text-slate-400">手机</span><p className="font-semibold text-slate-700 mt-0.5">{editUser.phone || '-'}</p></div>
              <div className="p-2 bg-slate-50 rounded-md"><span className="text-slate-400">注册时间</span><p className="font-semibold text-slate-700 mt-0.5">{editUser.created_at?.slice(0, 10)}</p></div>
              <div className="p-2 bg-slate-50 rounded-md"><span className="text-slate-400">邀请码</span><p className="font-semibold text-slate-700 mt-0.5">{editUser.invite_code || '-'}</p></div>
              <div className="p-2 bg-slate-50 rounded-md"><span className="text-slate-400">最近登录</span><p className="font-semibold text-slate-700 mt-0.5">{editUser.last_login?.slice(0, 10) || '从未'}</p></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">角色</label>
              <select value={editUser.role} onChange={e => { setEditUser({ ...editUser, role: e.target.value }); }}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px]">
                <option value="admin">管理员</option>
                <option value="recruiter">招聘方</option>
                <option value="candidate">候选人</option>
                <option value="viewer">观察者</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">账户等级</label>
              <select value={editUser.account_tier} onChange={e => { setEditUser({ ...editUser, account_tier: e.target.value }); }}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px]">
                <option value="free">免费版 (Free)</option>
                <option value="pro">专业版 (Pro)</option>
                <option value="ultra">旗舰版 (Ultra)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={async () => {
                try {
                  await api.updateUser(editUser.id, { role: editUser.role, account_tier: editUser.account_tier });
                  setEditUser(null); load();
                } catch (e: any) { alert(e.message); }
              }} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700">保存修改</button>
              <button onClick={async () => {
                const pw = prompt('输入新密码（至少6位）:');
                if (!pw) return;
                if (pw.length < 6) { alert('密码至少需要6位'); return; }
                try { await api.resetPassword(editUser.id, pw); alert('密码已重置'); } catch (e: any) { alert(e.message); }
              }} className="px-4 py-2.5 border border-rose-200 text-rose-600 rounded-md text-sm font-semibold hover:bg-rose-50">重置密码</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Token Modal */}
      <Modal open={!!tokenModal} onClose={() => setTokenModal(null)} title={`Token 操作 - ${tokenModal?.name}`}>
        {tokenModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-md">
              <CircleDollarSign size={20} className="text-amber-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">{tokenModal.name}</p>
                <p className="text-xs text-slate-400">UID: {tokenModal.id} · {LABEL_MAP[tokenModal.account_tier] || tokenModal.account_tier}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">数量（正数赠送，负数扣减）</label>
              <input type="number" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} placeholder="如 50000"
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[5000, 10000, 50000, 100000].map(v => (
                <button key={v} onClick={() => setTokenAmount(String(v))} className="px-3 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600">+{v.toLocaleString()}</button>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">原因</label>
              <input value={tokenReason} onChange={e => setTokenReason(e.target.value)} placeholder="如：活动奖励、Bug 补偿等"
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <button onClick={handleGrantTokens} disabled={!tokenAmount} className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Gift size={14} /> 确认操作
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 2.5 用户详情页
// ═══════════════════════════════════════════════════════════════════

const ROLE_LABELS: Record<string, string> = { admin: '管理员', recruiter: '招聘方', candidate: '候选人', viewer: '观察者' };
const TIER_LABELS: Record<string, string> = { free: '免费版', pro: '专业版', ultra: '旗舰版' };
const ACTION_LABELS: Record<string, string> = {
  resume_parse: '简历解析', profile_build: '画像构建', job_match: '岗位匹配',
  interview: '面试辅导', market_analysis: '市场分析', route_dispatch: '路由调度',
  chat: 'AI 对话', invite_reward: '邀请奖励', other: '其他',
};

const UserDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = parseInt(location.pathname.split('/users/')[1]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = useCallback(() => {
    if (!userId || isNaN(userId)) return;
    setLoading(true);
    api.getUserProfile(userId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState text="用户不存在" />;

  const u = data.user;
  const tabs = [
    { key: 'overview', label: '概览' },
    { key: 'tokens', label: `Token (${data.tokens.balance.toLocaleString()})` },
    { key: 'orders', label: `订单 (${data.orders.count})` },
    { key: 'jobs', label: `职位 (${data.jobs.count})` },
    { key: 'flows', label: `流程 (${data.flows.count})` },
    { key: 'tickets', label: `工单 (${data.tickets.count})` },
    { key: 'invitations', label: `邀请 (${data.invitations.count})` },
    { key: 'ai', label: `AI (${data.ai.chat_count})` },
    { key: 'audit', label: `审计 (${data.audit_logs.length})` },
  ];

  return (
    <>
      {/* 顶部导航 */}
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => navigate('/users')} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">用户详情</h1>
          <p className="text-xs text-slate-400">UID: {u.id}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
        </div>
      </div>

      {/* 用户头卡 */}
      <Card className="p-7 mb-7">
        <div className="flex items-start gap-6">
          <Avatar name={u.name} url={u.avatar_url} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-black text-slate-900">{u.name}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : u.role === 'recruiter' ? 'bg-blue-100 text-blue-700' : u.role === 'candidate' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {ROLE_LABELS[u.role] || u.role}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.account_tier === 'ultra' ? 'bg-amber-100 text-amber-700' : u.account_tier === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {TIER_LABELS[u.account_tier] || u.account_tier}
              </span>
              {u.is_active ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-600 flex items-center gap-1"><CheckCircle size={10} />活跃</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-600 flex items-center gap-1"><XCircle size={10} />禁用</span>
              )}
              {u.is_verified && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600">已认证</span>}
            </div>
            <div className="flex items-center gap-5 mt-3 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5"><Mail size={14} />{u.email}</span>
              {u.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{u.phone}</span>}
              {u.company_name && <span className="flex items-center gap-1.5"><Building2 size={14} />{u.company_name}</span>}
              <span className="flex items-center gap-1.5"><Calendar size={14} />注册于 {u.created_at?.slice(0, 10)}</span>
              {u.last_login && <span className="flex items-center gap-1.5"><Clock size={14} />最近登录 {u.last_login?.slice(0, 10)}</span>}
            </div>
            {u.invite_code && (
              <p className="text-xs text-slate-400 mt-1.5">
                邀请码: <span className="font-mono font-semibold text-indigo-600 text-xs">{u.invite_code}</span>
                {u.inviter_name && <> · 由 <span className="font-semibold text-slate-600">{u.inviter_name}</span> 邀请</>}
              </p>
            )}
          </div>
          {/* 右侧核心指标 */}
          <div className="flex gap-3 shrink-0">
            <div className="text-center p-3 bg-amber-50 rounded-md min-w-[80px]">
              <p className="text-lg font-black text-amber-600">{data.tokens.balance.toLocaleString()}</p>
              <p className="text-xs text-amber-500">Token 余额</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-md min-w-[80px]">
              <p className="text-lg font-black text-emerald-600">¥{data.orders.total_paid}</p>
              <p className="text-xs text-emerald-500">累计消费</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-md min-w-[80px]">
              <p className="text-lg font-black text-indigo-600">{data.invitations.count}</p>
              <p className="text-xs text-indigo-500">邀请人数</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab 导航 */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-7 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 概览 Tab ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* 数据概览卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Token 总量" value={data.tokens.total.toLocaleString()} icon={Package} />
            <StatCard label="Token 已消耗" value={data.tokens.consumed.toLocaleString()} icon={Zap} />
            <StatCard label="订单数" value={data.orders.count} icon={Receipt} />
            <StatCard label="AI 对话" value={data.ai.chat_count} icon={Bot} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="发布职位" value={data.jobs.count} icon={Briefcase} />
            <StatCard label="招聘流程" value={data.flows.count} icon={GitBranch} />
            <StatCard label="工单数" value={data.tickets.count} icon={Ticket} />
            <StatCard label="通知" value={`${data.notifications.unread}/${data.notifications.count}`} icon={Bell} sub="未读/总数" />
          </div>

          {/* 候选人资料（如果有） */}
          {data.candidate && (
            <Card className="p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><UserCheck size={15} className="text-emerald-500" /> 候选人资料</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-xs text-slate-400">简历状态</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{data.candidate.has_resume ? '已上传' : '未上传'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-xs text-slate-400">档案完整度</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{data.candidate.is_profile_complete ? '完整' : '未完善'}</p>
                </div>
                {data.candidate.profile?.current_role && (
                  <div className="p-3 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-400">当前职位</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{data.candidate.profile.current_role}</p>
                  </div>
                )}
                {data.candidate.profile?.experience_years != null && (
                  <div className="p-3 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-400">工作年限</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{data.candidate.profile.experience_years} 年</p>
                  </div>
                )}
              </div>
              {data.candidate.profile?.summary && (
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{data.candidate.profile.summary}</p>
              )}
            </Card>
          )}

          {/* 企业信息（如果有） */}
          {data.enterprise && (
            <Card className="p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><Building2 size={15} className="text-blue-500" /> 企业信息</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-md"><p className="text-xs text-slate-400">企业名称</p><p className="text-sm font-semibold text-slate-700 mt-0.5">{data.enterprise.company_name}</p></div>
                <div className="p-3 bg-slate-50 rounded-md"><p className="text-xs text-slate-400">统一信用代码</p><p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">{data.enterprise.credit_code || '—'}</p></div>
                <div className="p-3 bg-slate-50 rounded-md"><p className="text-xs text-slate-400">法人</p><p className="text-sm font-semibold text-slate-700 mt-0.5">{data.enterprise.legal_person || '—'}</p></div>
                <div className="p-3 bg-slate-50 rounded-md"><p className="text-xs text-slate-400">团队人数</p><p className="text-sm font-semibold text-slate-700 mt-0.5">{data.enterprise.team_count} 人</p></div>
              </div>
            </Card>
          )}

          {/* 认证信息 */}
          {(data.certifications.enterprise.length > 0 || data.certifications.personal.length > 0) && (
            <Card className="p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><Award size={15} className="text-amber-500" /> 认证信息</h3>
              <div className="space-y-2">
                {data.certifications.enterprise.map((c: any) => (
                  <div key={`e-${c.id}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.organization} · 信用代码: {c.credit_code || '—'}</p>
                    </div>
                    <StatusBadge value={c.status} />
                  </div>
                ))}
                {data.certifications.personal.map((c: any) => (
                  <div key={`p-${c.id}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.organization} · {c.degree || ''} {c.major || ''}</p>
                    </div>
                    <StatusBadge value={c.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Token Tab ── */}
      {tab === 'tokens' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center"><Wallet size={18} className="text-amber-600" /></div>
                <div><p className="text-xs text-slate-400">当前余额</p><p className="text-xl font-black text-amber-600">{data.tokens.balance.toLocaleString()}</p></div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center"><Package size={18} className="text-blue-600" /></div>
                <div><p className="text-xs text-slate-400">总获得</p><p className="text-xl font-black text-slate-900">{data.tokens.total.toLocaleString()}</p></div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center"><Zap size={18} className="text-rose-500" /></div>
                <div><p className="text-xs text-slate-400">已消耗</p><p className="text-xl font-black text-slate-900">{data.tokens.consumed.toLocaleString()}</p></div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center"><CircleDollarSign size={18} className="text-emerald-600" /></div>
                <div><p className="text-xs text-slate-400">套餐数</p><p className="text-xl font-black text-slate-900">{data.tokens.packages.length}</p></div>
              </div>
            </Card>
          </div>

          {/* 消耗分布 */}
          {data.tokens.by_action.length > 0 && (
            <Card className="p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><BarChart3 size={15} className="text-indigo-500" /> 消耗分布</h3>
              <div className="space-y-2.5">
                {data.tokens.by_action.map((a: any) => {
                  const total = data.tokens.consumed || 1;
                  const pct = Math.round(a.total / total * 100);
                  return (
                    <div key={a.action}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium text-slate-600">{ACTION_LABELS[a.action] || a.action}</span>
                        <span className="text-[13px] font-bold text-slate-600">{a.total.toLocaleString()} <span className="text-slate-300 font-normal">({a.count}次)</span></span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5"><div className="bg-indigo-500 rounded-full h-1.5" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 套餐列表 */}
          {data.tokens.packages.length > 0 && (
            <Card className="p-5">
              <h3 className="text-[15px] font-bold text-slate-900 mb-3">Token 套餐</h3>
              <div className="space-y-2">
                {data.tokens.packages.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                    <div>
                      <p className="text-sm font-semibold text-slate-700"><StatusBadge value={p.package_type} /> · ¥{p.price}</p>
                      <p className="text-xs text-slate-400 mt-0.5">剩余 {p.remaining_tokens.toLocaleString()} / {p.total_tokens.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{p.is_active ? '有效' : '已过期'}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{p.purchased_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 使用明细 */}
          {data.tokens.usage.length > 0 && (
            <Card>
              <div className="p-4 border-b border-slate-100"><h3 className="text-[15px] font-bold text-slate-900">使用明细</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">操作</th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-400">消耗</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">模型</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">说明</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                  </tr></thead>
                  <tbody>
                    {data.tokens.usage.map((u: any) => (
                      <tr key={u.id} className="border-b border-slate-50">
                        <td className="p-4"><StatusBadge value={u.action} /></td>
                        <td className={`p-3 text-right text-[13px] font-bold ${u.tokens_used > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{u.tokens_used > 0 ? '-' : '+'}{Math.abs(u.tokens_used).toLocaleString()}</td>
                        <td className="p-4 text-[13px] text-slate-500">{u.model_name || '—'}</td>
                        <td className="p-4 text-[13px] text-slate-500 max-w-[200px] truncate">{u.description || '—'}</td>
                        <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{u.created_at?.slice(0, 16).replace('T', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── 订单 Tab ── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="订单数" value={data.orders.count} icon={Receipt} />
            <StatCard label="累计消费" value={`¥${data.orders.total_paid}`} icon={CreditCard} />
          </div>
          {data.orders.items.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">订单号</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">类型</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">标题</th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-400">金额</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                  </tr></thead>
                  <tbody>
                    {data.orders.items.map((o: any) => (
                      <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 text-[13px] text-slate-500 font-mono">{o.order_no}</td>
                        <td className="p-4"><StatusBadge value={o.order_type} /></td>
                        <td className="p-4 text-sm text-slate-700">{o.title}</td>
                        <td className={`p-3 text-right text-[13px] font-bold ${o.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{o.amount >= 0 ? '+' : ''}¥{Math.abs(o.amount).toFixed(2)}</td>
                        <td className="p-4"><StatusBadge value={o.status} /></td>
                        <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{o.created_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : <EmptyState text="暂无订单" />}
        </div>
      )}

      {/* ── 职位 Tab ── */}
      {tab === 'jobs' && (
        <div>
          {data.jobs.items.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">职位</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">公司</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">地点</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">薪资</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-400">浏览/投递</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">发布时间</th>
                  </tr></thead>
                  <tbody>
                    {data.jobs.items.map((j: any) => (
                      <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 text-sm font-semibold text-slate-800">{j.title}</td>
                        <td className="p-4 text-[13px] text-slate-500">{j.company}</td>
                        <td className="p-4 text-[13px] text-slate-500">{j.location}</td>
                        <td className="p-4 text-[13px] text-slate-600">{j.salary_min}k-{j.salary_max}k</td>
                        <td className="p-4"><StatusBadge value={j.status} /></td>
                        <td className="p-3 text-right text-[13px] text-slate-500">{j.view_count} / {j.apply_count}</td>
                        <td className="p-4 text-xs text-slate-400">{j.created_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : <EmptyState text="暂无发布的职位" />}
        </div>
      )}

      {/* ── 流程 Tab ── */}
      {tab === 'flows' && (
        <div>
          {data.flows.items.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">ID</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">当前阶段</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">匹配度</th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-400">Token消耗</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">创建时间</th>
                  </tr></thead>
                  <tbody>
                    {data.flows.items.map((f: any) => (
                      <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 text-xs font-mono text-slate-500">#{f.id}</td>
                        <td className="p-4"><StatusBadge value={f.status} /></td>
                        <td className="p-4"><StatusBadge value={f.current_stage} /></td>
                        <td className="p-4 text-[13px] font-bold text-indigo-600">{f.match_score ? `${f.match_score}%` : '—'}</td>
                        <td className="p-3 text-right text-[13px] text-slate-500">{f.tokens_consumed?.toLocaleString() || 0}</td>
                        <td className="p-4 text-xs text-slate-400">{f.created_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : <EmptyState text="暂无招聘流程" />}
        </div>
      )}

      {/* ── 工单 Tab ── */}
      {tab === 'tickets' && (
        <div>
          {data.tickets.items.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">标题</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">类型</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">优先级</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                  </tr></thead>
                  <tbody>
                    {data.tickets.items.map((t: any) => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 text-sm font-semibold text-slate-800">{t.title}</td>
                        <td className="p-4"><StatusBadge value={t.type} /></td>
                        <td className="p-4"><StatusBadge value={t.priority} /></td>
                        <td className="p-4"><StatusBadge value={t.status} /></td>
                        <td className="p-4 text-xs text-slate-400">{t.created_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : <EmptyState text="暂无工单" />}
        </div>
      )}

      {/* ── 邀请 Tab ── */}
      {tab === 'invitations' && (
        <div>
          {data.invitations.items.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">被邀请人</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">邀请码</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-400">奖励 Token</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                  </tr></thead>
                  <tbody>
                    {data.invitations.items.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 text-sm font-semibold text-slate-700">{inv.invitee_name || '—'}</td>
                        <td className="p-4 text-[13px] text-slate-500 font-mono">{inv.invite_code}</td>
                        <td className="p-4"><StatusBadge value={inv.status} /></td>
                        <td className="p-3 text-right text-[13px] font-bold text-amber-600">+{inv.reward_tokens?.toLocaleString() || 0}</td>
                        <td className="p-4 text-xs text-slate-400">{inv.created_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : <EmptyState text="暂无邀请记录" />}
        </div>
      )}

      {/* ── AI 活动 Tab ── */}
      {tab === 'ai' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="AI 对话数" value={data.ai.chat_count} icon={MessageSquare} />
            <StatCard label="AI Token 消耗" value={data.ai.chat_tokens.toLocaleString()} icon={Zap} />
          </div>
          {data.ai.recent_chats.length > 0 ? (
            <Card>
              <div className="p-4 border-b border-slate-100"><h3 className="text-[15px] font-bold text-slate-900">最近对话</h3></div>
              <div className="divide-y divide-slate-50">
                {data.ai.recent_chats.map((c: any) => (
                  <div key={c.id} className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400">{c.created_at?.slice(0, 16).replace('T', ' ')}</span>
                      <div className="flex items-center gap-2">
                        {c.model && <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">{c.model}</span>}
                        {c.tokens_used > 0 && <span className="text-xs text-slate-400">{c.tokens_used} tokens</span>}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : <EmptyState text="暂无 AI 对话记录" />}
        </div>
      )}

      {/* ── 审计 Tab ── */}
      {tab === 'audit' && (
        <div>
          {data.audit_logs.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">操作</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">分类</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">风险等级</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">IP</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                  </tr></thead>
                  <tbody>
                    {data.audit_logs.map((a: any) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 text-sm text-slate-700">{a.action}</td>
                        <td className="p-4"><StatusBadge value={a.category || 'other'} /></td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.risk_level === 'high' ? 'bg-rose-100 text-rose-700' : a.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            {a.risk_level || 'low'}
                          </span>
                        </td>
                        <td className="p-4 text-[13px] text-slate-500 font-mono">{a.ip_address || '—'}</td>
                        <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{a.created_at?.slice(0, 16).replace('T', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : <EmptyState text="暂无审计记录" />}
        </div>
      )}
    </>
  );
};


// ═══════════════════════════════════════════════════════════════════
// 3. 企业管理
// ═══════════════════════════════════════════════════════════════════

const EnterprisesPage = () => {
  const [tab, setTab] = useState<'list' | 'eCert' | 'pCert'>('list');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [page, setPage] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, size: 20 };
    const fetcher = tab === 'list' ? api.getEnterprises(params) : tab === 'eCert' ? api.getEnterpriseCerts(params) : api.getPersonalCerts(params);
    fetcher.then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (type: string, id: number, status: string) => {
    if (!confirm(status === 'valid' ? '确认通过此认证？' : '确认拒绝此认证？')) return;
    try { await api.reviewCert(type, id, status); load(); } catch (e: any) { alert(e.message); }
  };

  return (
    <>
      <PageHeader title="企业管理" sub="企业信息和认证审核" actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />
      <div className="flex gap-2 mb-4">
        {[['list', '企业列表'], ['eCert', '企业认证'], ['pCert', '个人认证']].map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k as any); setPage(0); }}
            className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${tab === k ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>
      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState text={tab === 'list' ? '暂无企业' : '暂无认证记录'} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {tab === 'list' ? (
                  <><th className="text-left p-3 text-xs font-semibold text-slate-400">企业名称</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">行业</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">规模</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">所在地</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-400">操作</th></>
                ) : (
                  <><th className="text-left p-3 text-xs font-semibold text-slate-400">认证名称</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">类别</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">用户</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">提交时间</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-400">审核</th></>
                )}
              </tr></thead>
              <tbody>
                {data.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    {tab === 'list' ? (
                      <><td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0"><Building2 size={14} /></div>
                          <span className="font-semibold text-slate-800 text-sm">{item.display_name || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[13px] text-slate-500">{item.industry || '-'}</td>
                      <td className="p-4 text-[13px] text-slate-500">{item.company_size || '-'}</td>
                      <td className="p-4 text-[13px] text-slate-500">{[item.province, item.city].filter(Boolean).join(' ') || '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => setDetail(item)} className="p-1.5 hover:bg-slate-100 rounded-md" title="查看"><Eye size={14} className="text-slate-400" /></button>
                      </td></>
                    ) : (
                      <><td className="p-3 font-semibold text-slate-800 text-sm">{item.name}</td>
                      <td className="p-4 text-[13px] text-slate-500">{item.category}</td>
                      <td className="p-4 text-[13px]"><UserLink id={item.user_id} className="text-slate-500" /></td>
                      <td className="p-4"><StatusBadge value={item.status} /></td>
                      <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{item.created_at?.slice(0, 10) || '-'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {item.status === 'pending' && <>
                            <button onClick={() => handleReview(tab === 'eCert' ? 'enterprise' : 'personal', item.id, 'valid')}
                              className="px-2.5 py-1 text-[13px] font-semibold text-emerald-600 hover:bg-emerald-50 rounded-md flex items-center gap-1"><CheckCircle size={12} /> 通过</button>
                            <button onClick={() => handleReview(tab === 'eCert' ? 'enterprise' : 'personal', item.id, 'expired')}
                              className="px-2.5 py-1 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-1"><XCircle size={12} /> 拒绝</button>
                          </>}
                          {item.status !== 'pending' && <StatusBadge value={item.status} />}
                        </div>
                      </td></>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      {/* 企业详情弹窗 */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`企业详情 - ${detail?.display_name || ''}`}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
              <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold"><Building2 size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{detail.display_name || '-'}</p>
                <p className="text-xs text-slate-400">{detail.industry || '-'} · {detail.company_size || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">所在地</span><p className="font-semibold text-slate-700 mt-0.5">{[detail.province, detail.city].filter(Boolean).join(' ') || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">所属用户 ID</span><p className="font-semibold text-slate-700 mt-0.5">#{detail.user_id || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">创建时间</span><p className="font-semibold text-slate-700 mt-0.5">{detail.created_at?.slice(0, 10) || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">更新时间</span><p className="font-semibold text-slate-700 mt-0.5">{detail.updated_at?.slice(0, 10) || '-'}</p></div>
            </div>
            {detail.description && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1">公司简介</span><p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{detail.description}</p></div>}
            {detail.benefits && (
              <div className="p-3 bg-slate-50 rounded-md text-[13px]">
                <span className="text-slate-400 block mb-1.5">福利标签</span>
                <div className="flex flex-wrap gap-1.5">
                  {(typeof detail.benefits === 'string' ? detail.benefits.split(',') : (detail.benefits || [])).map((b: string, i: number) =>
                    <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-xs font-medium">{b.trim()}</span>
                  )}
                </div>
              </div>
            )}
            {detail.website && <div className="p-2.5 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400">官网</span><p className="font-medium text-indigo-600 mt-0.5">{detail.website}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 4. 职位管理
// ═══════════════════════════════════════════════════════════════════

const JobsPage = () => {
  const [tab, setTab] = useState<'list' | 'tags'>('list');
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<any>(null);
  const [newTag, setNewTag] = useState('');
  const [detail, setDetail] = useState<any>(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    api.getJobs({ page, size: 20, search, status: statusFilter })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  const loadTags = useCallback(() => {
    setLoading(true);
    api.getJobTags().then(setTags).catch(() => setTags(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { tab === 'list' ? loadJobs() : loadTags(); }, [tab, loadJobs, loadTags]);

  return (
    <>
      <PageHeader title="职位管理" sub={`共 ${data?.total || 0} 个职位`} actions={
        <button onClick={() => tab === 'list' ? loadJobs() : loadTags()} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('list')} className={`px-4 py-2 rounded-md text-[13px] font-medium ${tab === 'list' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>职位列表</button>
        <button onClick={() => setTab('tags')} className={`px-4 py-2 rounded-md text-[13px] font-medium ${tab === 'tags' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>标签管理</button>
      </div>

      {tab === 'list' ? (
        <>
          <Card className="mb-5 p-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="搜索职位..."
                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
              <option value="">全部状态</option>
              <option value="active">在线</option>
              <option value="draft">草稿</option>
              <option value="paused">暂停</option>
              <option value="closed">已关闭</option>
            </select>
            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(0); }} className="text-[13px] text-indigo-600 hover:underline flex items-center gap-1"><X size={12} /> 清除</button>
            )}
          </Card>
          <Card>
            {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">职位</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">公司</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">精选</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400">浏览/申请</th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-400">操作</th>
                  </tr></thead>
                  <tbody>
                    {data.items.map((j: any) => (
                      <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4">
                          <p className="font-semibold text-slate-800 text-sm">{j.title}</p>
                          <p className="text-xs text-slate-400">{j.salary_display || '-'}</p>
                        </td>
                        <td className="p-4 text-[13px] text-slate-500">{j.company}</td>
                        <td className="p-4"><StatusBadge value={j.status} /></td>
                        <td className="p-4">
                          <button onClick={() => api.updateJob(j.id, { is_featured: !j.is_featured }).then(loadJobs).catch((e: any) => alert(e.message))}
                            className={j.is_featured ? 'text-amber-500' : 'text-slate-300'}>
                            <Star size={15} fill={j.is_featured ? 'currentColor' : 'none'} />
                          </button>
                        </td>
                        <td className="p-4 text-[13px] text-slate-500">{j.view_count} / {j.apply_count}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setDetail(j)} className="p-1.5 hover:bg-slate-100 rounded-md" title="查看"><Eye size={14} className="text-slate-400" /></button>
                            {j.status === 'active' && <button onClick={() => api.updateJob(j.id, { status: 'paused' }).then(loadJobs).catch((e: any) => alert(e.message))} className="px-2 py-1 text-[13px] font-semibold text-amber-600 hover:bg-amber-50 rounded-md">下架</button>}
                            {j.status !== 'active' && <button onClick={() => api.updateJob(j.id, { status: 'active' }).then(loadJobs).catch((e: any) => alert(e.message))} className="px-2 py-1 text-[13px] font-semibold text-emerald-600 hover:bg-emerald-50 rounded-md">上架</button>}
                            <button onClick={() => { if (confirm('确定删除此职位?')) api.deleteJob(j.id).then(loadJobs).catch((e: any) => alert(e.message)); }} className="p-1.5 hover:bg-rose-50 rounded-md"><Trash2 size={14} className="text-rose-400" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
          </Card>
        </>
      ) : (
        <Card className="p-5">
          <div className="flex gap-2 mb-4">
            <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="新标签名称..."
              className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-[13px]" />
            <button onClick={() => { if (newTag.trim()) api.createJobTag(newTag.trim()).then(() => { setNewTag(''); loadTags(); }).catch((e: any) => alert(e.message)); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700">
              <Plus size={14} className="inline mr-1" />添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags?.items?.map((t: any) => (
              <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded text-xs text-slate-600">
                {t.name}
                <button onClick={() => { if (confirm('确定删除此标签?')) api.deleteJobTag(t.id).then(loadTags).catch((e: any) => alert(e.message)); }} className="hover:text-rose-500"><X size={12} /></button>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* 职位详情弹窗 */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`职位详情 - ${detail?.title || ''}`}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-md">
              <div className="w-10 h-10 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600"><Briefcase size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-800">{detail.title}</p>
                <p className="text-xs text-slate-400">{detail.company} · {detail.salary_display || '-'}</p>
              </div>
              <StatusBadge value={detail.status} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">工作地点</span><p className="font-semibold text-slate-700 mt-0.5">{detail.location || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">工作类型</span><p className="font-semibold text-slate-700 mt-0.5">{LABEL_MAP[detail.job_type] || detail.job_type || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">浏览次数</span><p className="font-semibold text-indigo-600 mt-0.5">{detail.view_count || 0}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">申请次数</span><p className="font-semibold text-indigo-600 mt-0.5">{detail.apply_count || 0}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">精选推荐</span><p className="font-semibold mt-0.5">{detail.is_featured ? '⭐ 是' : '否'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">发布时间</span><p className="font-semibold text-slate-700 mt-0.5">{detail.created_at?.slice(0, 10)}</p></div>
            </div>
            {detail.description && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1">职位描述</span><p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{detail.description}</p></div>}
            {detail.requirements && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1">任职要求</span><p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{detail.requirements}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 5. 候选人管理
// ═══════════════════════════════════════════════════════════════════

const CandidatesPage = () => {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.getCandidates({ page, size: 20, search, profile_complete: profileFilter })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, search, profileFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="候选人管理" sub={`共 ${data?.total || 0} 位候选人`} actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />
      <Card className="mb-5 p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="搜索候选人..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <select value={profileFilter} onChange={e => { setProfileFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
          <option value="">全部画像</option>
          <option value="true">已完善</option>
          <option value="false">未完善</option>
        </select>
        {(search || profileFilter) && (
          <button onClick={() => { setSearch(''); setProfileFilter(''); setPage(0); }} className="text-[13px] text-indigo-600 hover:underline flex items-center gap-1"><X size={12} /> 清除</button>
        )}
      </Card>
      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left p-3 text-xs font-semibold text-slate-400">姓名</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">当前职位</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">经验</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">画像完善</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">注册时间</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-400">操作</th>
              </tr></thead>
              <tbody>
                {data.items.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold shrink-0">{(c.display_name || c.user_name || '?')[0]}</div>
                        <UserLink id={c.user_id} name={c.display_name || c.user_name || '-'} className="font-semibold text-slate-800 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-[13px] text-slate-500">{c.current_role || '-'}</td>
                    <td className="p-4 text-[13px] text-slate-500">{c.experience_years ? `${c.experience_years}年` : '-'}</td>
                    <td className="p-4">{c.is_profile_complete ? <Badge color="bg-emerald-100 text-emerald-700">已完善</Badge> : <Badge color="bg-slate-100 text-slate-500">未完善</Badge>}</td>
                    <td className="p-4 text-xs text-slate-400">{c.created_at?.slice(0, 10)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setDetail(c)} className="p-1.5 hover:bg-slate-100 rounded-md" title="查看"><Eye size={14} className="text-slate-400" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      {/* 候选人详情弹窗 */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`候选人详情 - ${detail?.display_name || detail?.user_name || ''}`}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-md">
              <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">{(detail.display_name || detail.user_name || '?')[0]}</div>
              <div>
                <p className="text-sm font-bold text-slate-800">{detail.display_name || detail.user_name || '-'}</p>
                <p className="text-xs text-slate-400">{detail.current_role || '未设置职位'}</p>
              </div>
              {detail.is_profile_complete ? <Badge color="bg-emerald-100 text-emerald-700">画像已完善</Badge> : <Badge color="bg-amber-100 text-amber-700">画像未完善</Badge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">工作经验</span><p className="font-semibold text-slate-700 mt-0.5">{detail.experience_years ? `${detail.experience_years} 年` : '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">最高学历</span><p className="font-semibold text-slate-700 mt-0.5">{detail.education || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">期望薪资</span><p className="font-semibold text-slate-700 mt-0.5">{detail.expected_salary || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">求职状态</span><p className="font-semibold text-slate-700 mt-0.5">{detail.job_status || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">注册时间</span><p className="font-semibold text-slate-700 mt-0.5">{detail.created_at?.slice(0, 10)}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">所属用户 ID</span><p className="font-semibold text-slate-700 mt-0.5">{detail.user_id || '-'}</p></div>
            </div>
            {detail.skills && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1.5">技能标签</span><div className="flex flex-wrap gap-1.5">{(typeof detail.skills === 'string' ? detail.skills.split(',') : (detail.skills || [])).map((s: string, i: number) => <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-xs font-medium">{s.trim()}</span>)}</div></div>}
            {detail.summary && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1">个人简介</span><p className="text-slate-600 whitespace-pre-wrap">{detail.summary}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 6. 招聘流程管理
// ═══════════════════════════════════════════════════════════════════

const FlowsPage = () => {
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getFlows({ page, size: 20, status: statusFilter }),
      api.getFlowStats().catch(() => null),
    ])
      .then(([d, s]) => { setData(d); setStats(s); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="招聘流程" sub={`共 ${data?.total || 0} 个流程`} actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />

      {stats?.stages?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.stages.map((s: any) => {
            const stageColors: Record<string, string> = { screening: 'bg-blue-500', interviewing: 'bg-amber-500', offering: 'bg-purple-500', hired: 'bg-emerald-500', rejected: 'bg-rose-500' };
            return (
              <Card key={s.status} className="p-4 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => { setStatusFilter(s.status === statusFilter ? '' : s.status); setPage(0); }}>
                <div className="flex items-center justify-between">
                  <StatusBadge value={s.status} />
                  <span className="text-lg font-black text-slate-900">{s.count}</span>
                </div>
                <div className="mt-2 bg-slate-100 rounded-full h-1.5">
                  <div className={`${stageColors[s.status] || 'bg-indigo-500'} rounded-full h-1.5`} style={{ width: `${s.percentage}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{s.percentage}%</p>
              </Card>
            );
          })}
        </div>
      )}

      {statusFilter && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-xs text-slate-400">当前筛选:</span>
          <StatusBadge value={statusFilter} />
          <button onClick={() => { setStatusFilter(''); setPage(0); }} className="text-[13px] text-indigo-600 hover:underline">清除</button>
        </div>
      )}

      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState text="暂无招聘流程" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left p-3 text-xs font-semibold text-slate-400">ID</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">职位</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">候选人</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">阶段</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">匹配分</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">Token</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">创建时间</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-400">操作</th>
              </tr></thead>
              <tbody>
                {data.items.map((f: any) => (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-mono text-slate-500">#{f.id}</td>
                    <td className="p-4 text-sm text-slate-700 font-medium">{f.job_title || '-'}</td>
                    <td className="p-4 text-[13px] text-slate-500">{f.candidate_name || '-'}</td>
                    <td className="p-4"><StatusBadge value={f.status} /></td>
                    <td className="p-4"><StatusBadge value={f.current_stage || 'pending'} /></td>
                    <td className="p-4">{f.match_score ? <span className={`text-[13px] font-bold ${f.match_score >= 80 ? 'text-emerald-600' : f.match_score >= 60 ? 'text-amber-600' : 'text-slate-500'}`}>{f.match_score}分</span> : <span className="text-xs text-slate-300">-</span>}</td>
                    <td className="p-4 text-[13px] text-slate-500">{f.tokens_consumed?.toLocaleString() || 0}</td>
                    <td className="p-4 text-xs text-slate-400">{f.created_at?.slice(0, 10)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setDetail(f)} className="p-1.5 hover:bg-slate-100 rounded-md" title="详情"><Eye size={14} className="text-slate-400" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      {/* 流程详情弹窗 */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`流程详情 #${detail?.id || ''}`}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-md">
              <GitBranch size={18} className="text-indigo-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{detail.job_title || `职位 #${detail.job_id}`}</p>
                <p className="text-xs text-slate-400">{detail.candidate_name || `候选人 #${detail.candidate_id}`}</p>
              </div>
              <StatusBadge value={detail.status} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">当前阶段</span><p className="mt-0.5"><StatusBadge value={detail.current_stage || 'pending'} /></p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">匹配分数</span><p className="font-bold text-slate-700 mt-0.5 text-base">{detail.match_score || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">Token 消耗</span><p className="font-semibold text-amber-600 mt-0.5">{detail.tokens_consumed?.toLocaleString() || 0}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">创建时间</span><p className="font-semibold text-slate-700 mt-0.5">{detail.created_at?.slice(0, 10)}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">职位 ID</span><p className="font-mono text-slate-600 text-xs mt-0.5">#{detail.job_id}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">候选人 ID</span><p className="font-mono text-slate-600 text-xs mt-0.5">#{detail.candidate_id}</p></div>
            </div>
            {detail.notes && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1">备注</span><p className="text-slate-600 whitespace-pre-wrap">{detail.notes}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 7. Token 管理
// ═══════════════════════════════════════════════════════════════════

const TokensPage = () => {
  const [tab, setTab] = useState<'overview' | 'history' | 'packages'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [packages, setPackages] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    if (tab === 'overview') api.getTokenOverview().then(setOverview).catch(() => setOverview(null)).finally(() => setLoading(false));
    else if (tab === 'history') api.getTokenHistory({ page, size: 20, action: actionFilter }).then(setHistory).catch(() => setHistory(null)).finally(() => setLoading(false));
    else api.getTokenPackages({ page, size: 20 }).then(setPackages).catch(() => setPackages(null)).finally(() => setLoading(false));
  }, [tab, page, actionFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <>
      <PageHeader title="Token 管理" sub="Token 经济系统管理" actions={
        <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />
      <div className="flex gap-2 mb-4">
        {[['overview', '总览'], ['history', '消耗明细'], ['packages', '套餐记录']].map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k as any); setPage(0); }}
            className={`px-4 py-2 rounded-md text-[13px] font-medium ${tab === k ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : tab === 'overview' && overview ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
            <StatCard label="总消耗" value={overview.total_consumed.toLocaleString()} icon={Activity} />
            <StatCard label="总发放" value={overview.total_granted.toLocaleString()} icon={Gift} />
            <StatCard label="流通余额" value={overview.total_balance.toLocaleString()} icon={CircleDollarSign} />
            <StatCard label="累计收入" value={`¥${overview.total_revenue}`} icon={TrendingUp} />
          </div>
          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-indigo-500" /> 按智能体消耗分布</h3>
            <div className="space-y-3">
              {overview.by_agent?.map((a: any) => {
                const pct = overview.total_consumed > 0 ? Math.round((a.total_tokens || 0) / overview.total_consumed * 100) : 0;
                const barColors: Record<string, string> = {
                  chat: 'bg-indigo-500', resume_parse: 'bg-cyan-500', job_match: 'bg-emerald-500',
                  interview: 'bg-amber-500', market_analysis: 'bg-purple-500', route_dispatch: 'bg-slate-400',
                  other: 'bg-slate-300', profile_build: 'bg-teal-500', invite_reward: 'bg-pink-500',
                };
                return (
                  <div key={a.action}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={a.action} />
                        <span className="text-xs text-slate-400">{a.count} 次</span>
                      </div>
                      <span className="text-[13px] font-bold text-slate-700">{a.total_tokens?.toLocaleString()} <span className="text-slate-300 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-1.5">
                      <div className={`${barColors[a.action] || 'bg-slate-400'} rounded-full h-1.5 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : tab === 'history' && history ? (
        <>
          {/* 动作筛选栏 */}
          <Card className="mb-5 p-4 flex items-center gap-3 flex-wrap">
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
              <option value="">全部类型</option>
              <option value="chat">AI 对话</option>
              <option value="resume_parse">简历解析</option>
              <option value="job_match">职位匹配</option>
              <option value="interview">面试评估</option>
              <option value="market_analysis">市场分析</option>
              <option value="invite_reward">邀请奖励</option>
              <option value="profile_build">画像构建</option>
            </select>
            {actionFilter && <button onClick={() => { setActionFilter(''); setPage(0); }} className="text-[13px] text-indigo-600 hover:underline">清除筛选</button>}
            <span className="text-xs text-slate-400 ml-auto">共 {history.total} 条记录</span>
          </Card>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">用户</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">类型</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">Token</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">描述</th>
                </tr></thead>
                <tbody>
                  {history.items.map((h: any) => (
                    <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{h.created_at?.slice(0, 16)}</td>
                      <td className="p-4 text-[13px] text-slate-600">
                        <UserLink id={h.user_id} name={h.user_name} className="font-medium" />
                      </td>
                      <td className="p-4"><StatusBadge value={h.action} /></td>
                      <td className={`p-3 text-[13px] font-bold ${h.tokens_used < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{h.tokens_used < 0 ? '+' : '-'}{Math.abs(h.tokens_used).toLocaleString()}</td>
                      <td className="p-4 text-[13px] text-slate-500 max-w-xs truncate">{h.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4"><Pagination page={page} size={20} total={history.total} onChange={setPage} /></div>
          </Card>
        </>
      ) : tab === 'packages' && packages ? (
        <>
          {/* 套餐统计 */}
          {packages.items?.length > 0 && (() => {
            const totalTokens = packages.items.reduce((s: number, p: any) => s + (p.total_tokens || 0), 0);
            const totalRemaining = packages.items.reduce((s: number, p: any) => s + (p.remaining_tokens || 0), 0);
            const totalRevenue = packages.items.reduce((s: number, p: any) => s + (p.price || 0), 0);
            const usedPct = totalTokens > 0 ? Math.round((totalTokens - totalRemaining) / totalTokens * 100) : 0;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                <StatCard label="套餐总量" value={totalTokens.toLocaleString()} icon={CircleDollarSign} />
                <StatCard label="剩余总量" value={totalRemaining.toLocaleString()} icon={Activity} />
                <StatCard label="使用率" value={`${usedPct}%`} icon={BarChart3} />
                <StatCard label="套餐收入" value={`¥${totalRevenue}`} icon={TrendingUp} />
              </div>
            );
          })()}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">用户</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">套餐</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">使用进度</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">价格</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">购买时间</th>
                </tr></thead>
                <tbody>
                  {packages.items.map((p: any) => {
                    const used = (p.total_tokens || 0) - (p.remaining_tokens || 0);
                    const pct = p.total_tokens > 0 ? Math.round(used / p.total_tokens * 100) : 0;
                    return (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 text-[13px] text-slate-600">
                          <UserLink id={p.user_id} name={p.user_name} className="font-medium" />
                        </td>
                        <td className="p-4"><StatusBadge value={p.package_type} /></td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 min-w-[160px]">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className={`rounded-full h-1.5 transition-all ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">{used.toLocaleString()}/{p.total_tokens?.toLocaleString()} ({pct}%)</span>
                          </div>
                        </td>
                        <td className="p-4 text-[13px] text-slate-600 font-medium">{p.price ? `¥${p.price}` : <span className="text-emerald-600">免费</span>}</td>
                        <td className="p-4 text-xs text-slate-400">{p.purchased_at?.slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4"><Pagination page={page} size={20} total={packages.total} onChange={setPage} /></div>
          </Card>
        </>
      ) : null}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 8. 邀请管理
// ═══════════════════════════════════════════════════════════════════

const InvitationsPage = () => {
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getInvitations({ page, size: 20, status: statusFilter }),
      api.getInvitationStats().catch(() => null),
    ])
      .then(([d, s]) => { setData(d); setStats(s); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="邀请管理" sub="邀请裂变系统管理" actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-7">
          <StatCard label="总邀请数" value={stats.total_invitations} icon={UserPlus} />
          <StatCard label="奖励 Token 总量" value={stats.total_reward_tokens?.toLocaleString() || 0} icon={Gift} />
          <StatCard label="TOP 邀请者" value={stats.leaderboard?.[0]?.name || '-'} sub={`${stats.leaderboard?.[0]?.invite_count || 0} 次邀请`} icon={Star} />
        </div>
      )}

      {stats?.leaderboard?.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-[15px] font-bold text-slate-900 mb-3">邀请排行榜</h3>
          <div className="space-y-2">
            {stats.leaderboard.map((u: any, i: number) => (
              <div key={u.user_id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                  <UserLink id={u.user_id} name={u.name} className="text-sm font-medium text-slate-700" />
                  <span className="text-xs text-slate-400">UID: {u.user_id}</span>
                </div>
                <span className="text-[13px] font-bold text-indigo-600">{u.invite_count} 次</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-5 p-4 flex items-center gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
          <option value="">全部状态</option>
          <option value="registered">已注册</option>
          <option value="rewarded">已奖励</option>
          <option value="pending">待注册</option>
        </select>
        {statusFilter && <button onClick={() => { setStatusFilter(''); setPage(0); }} className="text-[13px] text-indigo-600 hover:underline">清除筛选</button>}
        <span className="text-xs text-slate-400 ml-auto">共 {data?.total || 0} 条邀请</span>
      </Card>

      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState text="暂无邀请记录" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left p-3 text-xs font-semibold text-slate-400">邀请人</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">被邀请人</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">邀请码</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">奖励Token</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
              </tr></thead>
              <tbody>
                {data.items.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4 text-sm font-semibold"><UserLink id={inv.inviter_id} name={inv.inviter_name} className="text-slate-700" /></td>
                    <td className="p-4 text-[13px]"><UserLink id={inv.invitee_id} name={inv.invitee_name} className="text-slate-500" /></td>
                    <td className="p-4 text-xs font-mono text-slate-400">{inv.invite_code}</td>
                    <td className="p-4 text-[13px] font-bold text-emerald-600">+{inv.reward_tokens?.toLocaleString()}</td>
                    <td className="p-4"><StatusBadge value={inv.status} /></td>
                    <td className="p-4 text-xs text-slate-400">{inv.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 9. 工单管理
// ═══════════════════════════════════════════════════════════════════

const TicketsPage = () => {
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyModal, setReplyModal] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getTickets({ page, size: 20, status: statusFilter, type: typeFilter }),
      api.getTicketStats().catch(() => null),
    ])
      .then(([d, s]) => { setData(d); setStats(s); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async () => {
    if (!replyModal || !replyText) return;
    try {
      await api.replyTicket(replyModal.id, replyText, replyStatus);
      setReplyModal(null); setReplyText(''); load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <>
      <PageHeader title="工单管理" sub={`共 ${data?.total || 0} 个工单`} actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><BarChart3 size={15} className="text-indigo-500" /> 按状态分布</h3>
            <div className="space-y-2.5">
              {Object.entries(stats.by_status || {}).map(([k, v]: any) => {
                const total = stats.total || 1;
                const pct = Math.round(v / total * 100);
                const colors: Record<string, string> = { open: 'bg-amber-500', processing: 'bg-blue-500', resolved: 'bg-emerald-500', closed: 'bg-slate-400' };
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between mb-1"><StatusBadge value={k} /><span className="text-[13px] font-bold text-slate-600">{v} <span className="text-slate-300 font-normal">({pct}%)</span></span></div>
                    <div className="bg-slate-100 rounded-full h-1.5"><div className={`${colors[k] || 'bg-slate-400'} rounded-full h-1.5`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><Filter size={15} className="text-amber-500" /> 按类型分布</h3>
            <div className="space-y-2.5">
              {Object.entries(stats.by_type || {}).map(([k, v]: any) => {
                const total = stats.total || 1;
                const pct = Math.round(v / total * 100);
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between mb-1"><StatusBadge value={k} /><span className="text-[13px] font-bold text-slate-600">{v} <span className="text-slate-300 font-normal">({pct}%)</span></span></div>
                    <div className="bg-slate-100 rounded-full h-1.5"><div className="bg-indigo-500 rounded-full h-1.5" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      <Card className="mb-5 p-4 flex items-center gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
          <option value="">全部状态</option>
          <option value="open">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="closed">已关闭</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
          <option value="">全部类型</option>
          <option value="question">问题</option>
          <option value="feature">功能</option>
          <option value="bug">Bug</option>
          <option value="complaint">投诉</option>
        </select>
        {(statusFilter || typeFilter) && (
          <button onClick={() => { setStatusFilter(''); setTypeFilter(''); setPage(0); }}
            className="text-[13px] text-indigo-600 hover:underline flex items-center gap-1">
            <X size={12} /> 清除筛选
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">共 {data?.total || 0} 条工单</span>
      </Card>

      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left p-3 text-xs font-semibold text-slate-400">工单</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">用户</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">类型</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">优先级</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-400">操作</th>
              </tr></thead>
              <tbody>
                {data.items.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 text-sm">{t.title}</p>
                      <p className="text-[13px] text-slate-400 max-w-xs truncate">{t.content}</p>
                    </td>
                    <td className="p-4 text-[13px]"><UserLink id={t.user_id} name={t.user_name} className="text-slate-500" /></td>
                    <td className="p-4"><StatusBadge value={t.type} /></td>
                    <td className="p-4"><StatusBadge value={t.priority} /></td>
                    <td className="p-4"><StatusBadge value={t.status} /></td>
                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{t.created_at?.slice(0, 10)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setReplyModal(t); setReplyText(t.reply || ''); }}
                        className="px-2 py-1 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md">
                        {t.reply ? '查看回复' : '回复'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title={`工单详情 #${replyModal?.id}`}>
        {replyModal && (
          <div className="space-y-4">
            {/* 工单信息 */}
            <div className="p-3 bg-slate-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge value={replyModal.type} />
                <StatusBadge value={replyModal.priority} />
                <StatusBadge value={replyModal.status} />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">{replyModal.title}</p>
              <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{replyModal.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>提交人: <UserLink id={replyModal.user_id} name={replyModal.user_name} /></span>
                <span>时间: {replyModal.created_at?.slice(0, 16)}</span>
              </div>
            </div>

            {/* 已有回复 */}
            {replyModal.reply && (
              <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100">
                <p className="text-xs text-indigo-400 mb-1 flex items-center gap-1"><MessageSquare size={11} /> 客服回复 · {replyModal.replied_at?.slice(0, 16)}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{replyModal.reply}</p>
              </div>
            )}

            {/* 回复表单 */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{replyModal.reply ? '修改回复' : '回复内容'}</label>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="输入回复内容..."
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">更新状态</label>
              <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px]">
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            <button onClick={handleReply} disabled={!replyText.trim()} className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Send size={14} /> 提交回复
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 10. 通知管理
// ═══════════════════════════════════════════════════════════════════

const NotificationsPage = () => {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ title: '', content: '', role: '', user_ids: '' });
  const [notifDetail, setNotifDetail] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getNotifications({ page, size: 20 })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!sendForm.title.trim() || !sendForm.content.trim()) { alert('请填写标题和内容'); return; }
    try {
      const payload: any = { title: sendForm.title, content: sendForm.content };
      if (sendForm.user_ids) {
        const ids = sendForm.user_ids.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (ids.length === 0) { alert('用户ID格式无效'); return; }
        payload.user_ids = ids;
      } else if (sendForm.role) {
        payload.role = sendForm.role;
      }
      await api.sendNotification(payload);
      setShowSend(false);
      setSendForm({ title: '', content: '', role: '', user_ids: '' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <>
      <PageHeader title="通知管理" sub={`共 ${data?.total || 0} 条通知`} actions={
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
          <button onClick={() => setShowSend(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1">
            <Send size={14} /> 发送通知
          </button>
        </div>
      } />

      {/* 读取统计 */}
      {data?.items?.length > 0 && (() => {
        const readCount = data.items.filter((n: any) => n.is_read).length;
        const unreadCount = data.items.filter((n: any) => !n.is_read).length;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <StatCard label="总通知数" value={data.total} icon={Bell} />
            <StatCard label="当前页已读" value={readCount} icon={CheckCircle} />
            <StatCard label="当前页未读" value={unreadCount} icon={Clock} />
          </div>
        );
      })()}

      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState text="暂无通知" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left p-3 text-xs font-semibold text-slate-400">通知</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">用户ID</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">类型</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">重要性</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">已读</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">发送者</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
              </tr></thead>
              <tbody>
                {data.items.map((n: any) => (
                  <tr key={n.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => setNotifDetail(n)}>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                      <p className="text-[13px] text-slate-400 max-w-xs truncate">{n.content}</p>
                    </td>
                    <td className="p-4 text-[13px]"><UserLink id={n.user_id} className="text-slate-500" /></td>
                    <td className="p-4"><StatusBadge value={n.type} /></td>
                    <td className="p-4"><StatusBadge value={n.importance} /></td>
                    <td className="p-4">{n.is_read ? <Badge color="bg-emerald-100 text-emerald-700">已读</Badge> : <Badge color="bg-slate-100 text-slate-500">未读</Badge>}</td>
                    <td className="p-4 text-[13px] text-slate-500">{n.sender || '-'}</td>
                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{n.created_at?.slice(5, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      <Modal open={showSend} onClose={() => setShowSend(false)} title="发送通知">
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-center gap-2">
            <AlertTriangle size={14} /> 通知将实时发送到用户的通知中心
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">标题 <span className="text-rose-400">*</span></label>
            <input value={sendForm.title} onChange={e => setSendForm({ ...sendForm, title: e.target.value })} placeholder="通知标题"
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">内容 <span className="text-rose-400">*</span></label>
            <textarea value={sendForm.content} onChange={e => setSendForm({ ...sendForm, content: e.target.value })} rows={3} placeholder="通知内容"
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">目标用户ID（逗号分隔，留空则按角色/全员）</label>
            <input value={sendForm.user_ids} onChange={e => setSendForm({ ...sendForm, user_ids: e.target.value })} placeholder="如 1000001,1000002"
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">目标角色（留空为全员）</label>
            <select value={sendForm.role} onChange={e => setSendForm({ ...sendForm, role: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px]">
              <option value="">全员广播</option>
              <option value="candidate">候选人</option>
              <option value="recruiter">招聘方</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <button onClick={handleSend} disabled={!sendForm.title || !sendForm.content}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Send size={14} /> 发送通知
          </button>
        </div>
      </Modal>

      {/* 通知详情弹窗 */}
      <Modal open={!!notifDetail} onClose={() => setNotifDetail(null)} title={`通知详情 #${notifDetail?.id || ''}`}>
        {notifDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-md">
              <Bell size={18} className="text-indigo-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{notifDetail.title}</p>
                <p className="text-xs text-slate-400">{notifDetail.created_at?.slice(0, 19)}</p>
              </div>
              {notifDetail.is_read ? <Badge color="bg-emerald-100 text-emerald-700">已读</Badge> : <Badge color="bg-amber-100 text-amber-700">未读</Badge>}
            </div>
            <div className="p-3 bg-slate-50 rounded-md">
              <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed">{notifDetail.content}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">接收用户</span><p className="font-semibold text-slate-700 mt-0.5"><UserLink id={notifDetail.user_id} /></p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">发送者</span><p className="font-semibold text-slate-700 mt-0.5">{notifDetail.sender || '系统'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">类型</span><p className="mt-0.5"><StatusBadge value={notifDetail.type} /></p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">重要性</span><p className="mt-0.5"><StatusBadge value={notifDetail.importance} /></p></div>
            </div>
            {notifDetail.read_at && <div className="p-2.5 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400">阅读时间</span><p className="font-semibold text-slate-700 mt-0.5">{notifDetail.read_at?.slice(0, 19)}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 11. AI 监控
// ═══════════════════════════════════════════════════════════════════

const AIPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [messages, setMessages] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getAIStats().catch(() => null),
      api.getChatMessages({ page, size: 20 }),
    ])
      .then(([s, m]) => { setStats(s); setMessages(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const ROLE_LABEL: Record<string, string> = { user: '用户', assistant: 'AI 助手', system: '系统' };

  return (
    <>
      <PageHeader title="AI 智能体监控" sub="AI 调用统计与对话记录" actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />

      {stats?.agents?.length > 0 && (() => {
        const totalCalls = stats.agents.reduce((s: number, a: any) => s + a.call_count, 0);
        const totalTokens = stats.agents.reduce((s: number, a: any) => s + (a.total_tokens || 0), 0);
        const avgTokensPerCall = totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0;
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-7">
              <StatCard label="总调用次数" value={totalCalls} icon={Activity} />
              <StatCard label="总 Token 消耗" value={totalTokens.toLocaleString()} icon={CircleDollarSign} />
              <StatCard label="平均单次消耗" value={avgTokensPerCall.toLocaleString()} sub="tokens/次" icon={BarChart3} />
            </div>
            <Card className="p-6 mb-6">
              <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Bot size={15} className="text-purple-500" /> 各智能体调用概况</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.agents.map((a: any) => {
                  const pct = totalCalls > 0 ? Math.round(a.call_count / totalCalls * 100) : 0;
                  const avgTokens = a.call_count > 0 ? Math.round((a.total_tokens || 0) / a.call_count) : 0;
                  const agentColors: Record<string, string> = {
                    chat: 'bg-indigo-500', resume_parse: 'bg-cyan-500', job_match: 'bg-emerald-500',
                    interview: 'bg-amber-500', market_analysis: 'bg-purple-500', route_dispatch: 'bg-slate-400',
                    other: 'bg-slate-300', profile_build: 'bg-teal-500',
                  };
                  return (
                    <div key={a.action} className="p-3 bg-slate-50 rounded-md">
                      <StatusBadge value={a.action} />
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <span className="text-xl font-black text-slate-900">{a.call_count}</span>
                          <span className="text-xs text-slate-400 ml-1">次</span>
                        </div>
                      </div>
                      <div className="mt-1.5 bg-white rounded-full h-1.5">
                        <div className={`${agentColors[a.action] || 'bg-slate-400'} rounded-full h-1.5`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
                        <span>占比 {pct}%</span>
                        <span>均 {avgTokens.toLocaleString()} tok/次</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">总计 {a.total_tokens?.toLocaleString()} tokens</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        );
      })()}

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2"><MessageSquare size={14} className="text-indigo-500" /> 对话记录</h3>
          <span className="text-xs text-slate-400">共 {messages?.total || 0} 条</span>
        </div>
        {loading ? <LoadingSpinner /> : !messages?.items?.length ? <EmptyState text="暂无对话记录" /> : (
          <div className="divide-y divide-slate-50">
            {messages.items.map((m: any) => {
              const isExpanded = expandedMsg === m.id;
              const isLong = m.content && m.content.length > 150;
              return (
                <div key={m.id} className="p-4 hover:bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${
                      m.role === 'user' ? 'bg-blue-100 text-blue-600' : m.role === 'assistant' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                    }`}>{m.role === 'user' ? 'U' : m.role === 'assistant' ? 'A' : 'S'}</div>
                    <Badge color={m.role === 'user' ? 'bg-blue-100 text-blue-700' : m.role === 'assistant' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}>{ROLE_LABEL[m.role] || m.role}</Badge>
                    <span className="text-xs"><UserLink id={m.user_id} className="text-slate-400" /></span>
                    {m.model && <Badge color="bg-slate-100 text-slate-500">{m.model}</Badge>}
                    {m.tokens_used && <span className="text-xs text-amber-500 font-medium">{m.tokens_used} tok</span>}
                    <span className="text-xs text-slate-300 ml-auto">{m.created_at?.slice(0, 16)}</span>
                  </div>
                  <div className="ml-8">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {isLong && !isExpanded ? m.content.slice(0, 150) + '...' : m.content}
                    </p>
                    {isLong && (
                      <button onClick={() => setExpandedMsg(isExpanded ? null : m.id)}
                        className="text-[13px] text-indigo-600 hover:underline mt-1">
                        {isExpanded ? '收起' : '展开全文'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {messages && <div className="p-4"><Pagination page={page} size={20} total={messages.total} onChange={setPage} /></div>}
      </Card>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 12. 内容管理
// ═══════════════════════════════════════════════════════════════════

const ContentPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ version: '', date: new Date().toISOString().slice(0, 10), item_type: '新功能', description: '' });
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.getChangelogs().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.version.trim() || !form.date.trim() || !form.description.trim()) {
      alert('请填写版本号、日期和描述'); return;
    }
    try {
      await api.createChangelog(form);
      setShowCreate(false); setForm({ version: '', date: new Date().toISOString().slice(0, 10), item_type: '新功能', description: '' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  // 按版本分组
  const groupedByVersion = (data?.items || []).reduce((acc: Record<string, any[]>, c: any) => {
    if (typeFilter && c.item_type !== typeFilter) return acc;
    const key = c.version || '未知版本';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, any[]>);

  const typeColorMap: Record<string, string> = {
    '新功能': 'text-emerald-700 bg-emerald-100',
    '优化': 'text-blue-700 bg-blue-100',
    '修复': 'text-amber-700 bg-amber-100',
  };

  return (
    <>
      <PageHeader title="内容管理" sub="更新日志管理" actions={
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1">
            <Plus size={14} /> 新增日志
          </button>
        </div>
      } />

      {/* 统计 + 类型筛选 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
        <StatCard label="总日志条目" value={data?.items?.length || 0} icon={FileText} />
        <StatCard label="版本数" value={[...new Set(data?.items?.map((c: any) => c.version) || [])].length} icon={Activity} />
        <StatCard label="新功能" value={(data?.items || []).filter((c: any) => c.item_type === '新功能').length} icon={Plus} />
        <StatCard label="Bug 修复" value={(data?.items || []).filter((c: any) => c.item_type === '修复').length} icon={AlertTriangle} />
      </div>

      <Card className="mb-5 p-4 flex items-center gap-3">
        <span className="text-xs text-slate-400">类型筛选:</span>
        {['', '新功能', '优化', '修复'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded text-[13px] font-medium transition-colors ${typeFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t || '全部'}
          </button>
        ))}
      </Card>

      {/* 按版本分组展示 */}
      {loading ? <Card><LoadingSpinner /></Card> : Object.keys(groupedByVersion).length === 0 ? <Card><EmptyState text="暂无更新日志" /></Card> : (
        <div className="space-y-4">
          {Object.entries(groupedByVersion).map(([version, items]) => (
            <Card key={version}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge color="bg-indigo-100 text-indigo-700">{version}</Badge>
                  <span className="text-xs text-slate-400">{(items as any[])[0]?.date}</span>
                </div>
                <span className="text-xs text-slate-400">{(items as any[]).length} 条</span>
              </div>
              <div className="divide-y divide-slate-50">
                {(items as any[]).map((c: any) => (
                  <div key={c.id} className="px-4 py-3 hover:bg-slate-50/50 flex items-center justify-between group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${typeColorMap[c.item_type] || 'text-slate-600 bg-slate-100'}`}>{c.item_type}</span>
                      <span className="text-[13px] text-slate-600">{c.description}</span>
                    </div>
                    <button onClick={() => { if (confirm('确定删除此日志？')) api.deleteChangelog(c.id).then(load).catch((e: any) => alert(e.message)); }}
                      className="p-1 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"><Trash2 size={13} className="text-rose-400" /></button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新增更新日志">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">版本号</label>
              <input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="v1.0.0"
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">日期</label>
              <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="2026-02-13"
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">类型</label>
            <select value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px]">
              <option>新功能</option>
              <option>优化</option>
              <option>修复</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] resize-none" />
          </div>
          <button onClick={handleCreate} disabled={!form.version.trim() || !form.description.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50">创建</button>
        </div>
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 13. 审计安全
// ═══════════════════════════════════════════════════════════════════

const AuditPage = () => {
  const [tab, setTab] = useState<'logs' | 'keys' | 'webhooks'>('logs');
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [logDetail, setLogDetail] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    if (tab === 'logs') {
      Promise.all([
        api.getAuditLogs({ page, size: 20, category, risk_level: riskLevel }),
        api.getAuditStats().catch(() => null),
      ])
        .then(([d, s]) => { setData(d); setStats(s); })
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    } else if (tab === 'keys') {
      api.getAPIKeys().then(d => setData(d)).catch(() => setData({ items: [] })).finally(() => setLoading(false));
    } else {
      api.getWebhooks().then(d => setData(d)).catch(() => setData({ items: [] })).finally(() => setLoading(false));
    }
  }, [tab, page, category, riskLevel]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="审计与安全" sub="安全审计日志和 API 管理" actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
      } />
      <div className="flex gap-2 mb-4">
        {[['logs', '审计日志'], ['keys', 'API 密钥'], ['webhooks', 'Webhook']].map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k as any); setPage(0); }}
            className={`px-4 py-2 rounded-md text-[13px] font-medium ${tab === k ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l}</button>
        ))}
      </div>

      {tab === 'logs' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><Shield size={15} className="text-indigo-500" /> 按类别</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_category || {}).map(([k, v]: any) => {
                const total = Object.values(stats.by_category || {}).reduce((s: number, x: any) => s + x, 0) as number;
                const pct = total > 0 ? Math.round(v / total * 100) : 0;
                return (
                  <div key={k} className="cursor-pointer hover:opacity-80" onClick={() => { setCategory(k); setPage(0); }}>
                    <div className="flex items-center justify-between mb-1"><StatusBadge value={k} /><span className="text-[13px] font-bold text-slate-600">{v} <span className="text-slate-300 font-normal">({pct}%)</span></span></div>
                    <div className="bg-slate-100 rounded-full h-1"><div className="bg-indigo-500 rounded-full h-1" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500" /> 按风险等级</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_risk_level || {}).map(([k, v]: any) => {
                const total = Object.values(stats.by_risk_level || {}).reduce((s: number, x: any) => s + x, 0) as number;
                const pct = total > 0 ? Math.round(v / total * 100) : 0;
                const colors: Record<string, string> = { info: 'bg-blue-500', warning: 'bg-amber-500', danger: 'bg-rose-500' };
                return (
                  <div key={k} className="cursor-pointer hover:opacity-80" onClick={() => { setRiskLevel(k); setPage(0); }}>
                    <div className="flex items-center justify-between mb-1"><StatusBadge value={k} /><span className="text-[13px] font-bold text-slate-600">{v} <span className="text-slate-300 font-normal">({pct}%)</span></span></div>
                    <div className="bg-slate-100 rounded-full h-1"><div className={`${colors[k] || 'bg-slate-400'} rounded-full h-1`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'logs' && (
        <Card className="mb-5 p-4 flex items-center gap-3">
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
            <option value="">全部类别</option>
            <option value="auth">认证</option>
            <option value="data">数据</option>
            <option value="ai">AI</option>
            <option value="api">API</option>
            <option value="system">系统</option>
          </select>
          <select value={riskLevel} onChange={e => { setRiskLevel(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
            <option value="">全部风险</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </select>
          {(category || riskLevel) && (
            <button onClick={() => { setCategory(''); setRiskLevel(''); setPage(0); }}
              className="text-[13px] text-indigo-600 hover:underline flex items-center gap-1">
              <X size={12} /> 清除筛选
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">共 {data?.total || 0} 条日志</span>
        </Card>
      )}

      <Card>
        {loading ? <LoadingSpinner /> : !data?.items?.length ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {tab === 'logs' ? (
                  <><th className="text-left p-3 text-xs font-semibold text-slate-400">操作</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">执行者</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">类别</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">风险</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">IP</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th></>
                ) : tab === 'keys' ? (
                  <><th className="text-left p-3 text-xs font-semibold text-slate-400">名称</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">Key</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">环境</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">用户ID</th></>
                ) : (
                  <><th className="text-left p-3 text-xs font-semibold text-slate-400">URL</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">事件</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400">用户ID</th></>
                )}
              </tr></thead>
              <tbody>
                {data.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    {tab === 'logs' ? (
                      <><td className="p-4 text-[13px] text-slate-600 max-w-xs truncate cursor-pointer hover:text-indigo-600" onClick={() => setLogDetail(item)}>{item.action}</td>
                      <td className="p-4 text-[13px] text-slate-500">{item.actor}</td>
                      <td className="p-4"><StatusBadge value={item.category} /></td>
                      <td className="p-4"><StatusBadge value={item.risk_level} /></td>
                      <td className="p-4 text-xs text-slate-400 font-mono">{item.ip_address || '-'}</td>
                      <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{item.created_at?.slice(0, 16)}</td></>
                    ) : tab === 'keys' ? (
                      <><td className="p-4 text-sm font-semibold text-slate-700">{item.name}</td>
                      <td className="p-4 text-xs font-mono text-slate-400">{item.key}</td>
                      <td className="p-4 text-[13px] text-slate-500">{item.environment}</td>
                      <td className="p-4">{item.is_active ? <Badge color="bg-emerald-100 text-emerald-700">活跃</Badge> : <Badge color="bg-slate-100 text-slate-500">禁用</Badge>}</td>
                      <td className="p-4 text-xs"><UserLink id={item.user_id} className="text-slate-400" /></td></>
                    ) : (
                      <><td className="p-4 text-[13px] text-slate-600 max-w-xs truncate">{item.url}</td>
                      <td className="p-4 text-[13px] text-slate-500">{item.events}</td>
                      <td className="p-4">{item.is_active ? <Badge color="bg-emerald-100 text-emerald-700">活跃</Badge> : <Badge color="bg-slate-100 text-slate-500">禁用</Badge>}</td>
                      <td className="p-4 text-xs"><UserLink id={item.user_id} className="text-slate-400" /></td></>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'logs' && data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      {/* 审计日志详情弹窗 */}
      <Modal open={!!logDetail} onClose={() => setLogDetail(null)} title={`审计日志 #${logDetail?.id || ''}`}>
        {logDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
              <Shield size={16} className="text-indigo-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{logDetail.action}</p>
                <p className="text-xs text-slate-400">{logDetail.created_at?.slice(0, 19)}</p>
              </div>
              <StatusBadge value={logDetail.risk_level} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">执行者</span><p className="font-semibold text-slate-700 mt-0.5">{logDetail.actor || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">类别</span><p className="mt-0.5"><StatusBadge value={logDetail.category} /></p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">IP 地址</span><p className="font-mono text-slate-600 text-xs mt-0.5">{logDetail.ip_address || '-'}</p></div>
              <div className="p-2.5 bg-slate-50 rounded-md"><span className="text-slate-400">风险等级</span><p className="mt-0.5"><StatusBadge value={logDetail.risk_level} /></p></div>
            </div>
            {logDetail.details && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1">详细信息</span><pre className="text-slate-600 whitespace-pre-wrap break-all leading-relaxed">{typeof logDetail.details === 'object' ? JSON.stringify(logDetail.details, null, 2) : logDetail.details}</pre></div>}
            {logDetail.user_agent && <div className="p-3 bg-slate-50 rounded-md text-[13px]"><span className="text-slate-400 block mb-1">User Agent</span><p className="text-slate-600 break-all">{logDetail.user_agent}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 14. 系统设置
// ═══════════════════════════════════════════════════════════════════

const SettingsPage = () => {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTime, setRefreshTime] = useState(new Date());

  const loadInfo = useCallback(() => {
    setLoading(true);
    api.getSystemInfo().then(d => { setInfo(d); setRefreshTime(new Date()); }).catch(() => setInfo(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  if (loading) return <LoadingSpinner />;

  const user = safeParseUser();

  return (
    <>
      <PageHeader title="系统设置" sub="平台配置与运行状态" actions={
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">更新于 {refreshTime.toLocaleTimeString('zh-CN')}</span>
          <button onClick={loadInfo} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
        </div>
      } />

      {/* 当前管理员信息 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-md bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xl font-bold">{(user.name || 'A')[0]}</div>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-800">{user.name || 'Admin'}</p>
            <p className="text-xs text-slate-400 mt-0.5">UID: {user.id}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge value={user.role || 'admin'} />
              <StatusBadge value={user.account_tier || 'free'} />
              <Badge color="bg-emerald-100 text-emerald-700">在线</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Settings size={15} className="text-indigo-500" /> 基本信息</h3>
          <div className="space-y-3">
            {[
              ['应用名称', info?.app_name, 'text-indigo-600'],
              ['API 版本', info?.api_version, 'text-indigo-600'],
              ['调试模式', info?.debug ? '开启（生产环境请关闭）' : '关闭', info?.debug ? 'text-amber-600' : 'text-emerald-600'],
              ['环境', info?.debug ? 'Development' : 'Production', info?.debug ? 'text-amber-600' : 'text-emerald-600'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{label}</span>
                <span className={`text-[13px] font-bold ${color || 'text-slate-800'}`}>{String(value || '-')}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI 配置 */}
        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Bot size={15} className="text-purple-500" /> AI 配置</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
              <span className="text-xs text-slate-400">AI 提供商</span>
              <Badge color="bg-purple-100 text-purple-700">{info?.ai_provider || '-'}</Badge>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
              <span className="text-xs text-slate-400">模型状态</span>
              <Badge color="bg-emerald-100 text-emerald-700">正常</Badge>
            </div>
          </div>
        </Card>

        {/* CORS 设置 */}
        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Globe size={15} className="text-emerald-500" /> CORS 来源 ({(info?.cors_origins || []).length})</h3>
          <div className="space-y-2">
            {(info?.cors_origins || []).map((origin: string, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md">
                <Globe size={12} className="text-slate-400 shrink-0" />
                <span className="text-xs font-mono text-slate-600 break-all">{origin}</span>
              </div>
            ))}
            {(info?.cors_origins || []).length === 0 && <p className="text-xs text-slate-400">未配置 CORS 来源</p>}
          </div>
        </Card>

        {/* 数据库 */}
        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Key size={15} className="text-amber-500" /> 数据库</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-md">
              <span className="text-xs font-mono text-slate-600 break-all">{info?.database_url || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-slate-400">连接状态</span>
              <Badge color="bg-emerald-100 text-emerald-700">已连接</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* 系统运行状态 */}
      <Card className="p-6 mt-6">
        <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={15} className="text-emerald-500" /> 运行状态</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="p-3 bg-slate-50 rounded-md text-center">
            <p className="text-xs text-slate-400 mb-1">API 状态</p>
            <Badge color="bg-emerald-100 text-emerald-700">运行中</Badge>
          </div>
          <div className="p-3 bg-slate-50 rounded-md text-center">
            <p className="text-xs text-slate-400 mb-1">数据库</p>
            <Badge color="bg-emerald-100 text-emerald-700">已连接</Badge>
          </div>
          <div className="p-3 bg-slate-50 rounded-md text-center">
            <p className="text-xs text-slate-400 mb-1">AI 服务</p>
            <Badge color={info?.ai_provider ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{info?.ai_provider ? '正常' : '未配置'}</Badge>
          </div>
          <div className="p-3 bg-slate-50 rounded-md text-center">
            <p className="text-xs text-slate-400 mb-1">调试模式</p>
            <Badge color={info?.debug ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>{info?.debug ? '开启' : '关闭'}</Badge>
          </div>
        </div>
      </Card>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 运营数据
// ═══════════════════════════════════════════════════════════════════

/** 简单柱状图（纯 SVG） */
const MiniBarChart = ({ data, color = '#6366f1', height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 ${data.length * 28} ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 20);
        return (
          <g key={i}>
            <rect x={i * 28 + 4} y={height - 20 - h} width={20} height={h} rx={3} fill={color} opacity={0.8}>
              <title>{d.label}: {d.value.toLocaleString()}</title>
            </rect>
            {data.length <= 15 && (
              <text x={i * 28 + 14} y={height - 4} textAnchor="middle" className="text-[8px]" fill="#94a3b8">{d.label.slice(5)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/** 面积趋势图（纯 SVG） */
const AreaChart = ({ data, color = '#6366f1', height = 140 }: { data: number[]; color?: string; height?: number }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 600;
  const pts = data.map((v, i) => ({ x: (i / Math.max(data.length - 1, 1)) * w, y: height - 16 - (v / max) * (height - 32) }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${w},${height - 16} L0,${height - 16} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={data.length <= 15 ? 3 : 0} fill="white" stroke={color} strokeWidth="2">
          <title>{data[i].toLocaleString()}</title>
        </circle>
      ))}
    </svg>
  );
};

/** 环形图（纯 SVG） */
const DonutChart = ({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -90;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const pct = d.value / total;
        const startAngle = angle;
        angle += pct * 360;
        const endAngle = angle;
        const largeArc = pct > 0.5 ? 1 : 0;
        const sr = (startAngle * Math.PI) / 180;
        const er = (endAngle * Math.PI) / 180;
        const x1 = cx + r * Math.cos(sr);
        const y1 = cy + r * Math.sin(sr);
        const x2 = cx + r * Math.cos(er);
        const y2 = cy + r * Math.sin(er);
        if (pct < 0.005) return null;
        return (
          <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={d.color} opacity={0.85}>
            <title>{d.label}: {d.value} ({(pct * 100).toFixed(1)}%)</title>
          </path>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="text-lg font-black" fill="#1e293b">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="text-xs" fill="#94a3b8">总计</text>
    </svg>
  );
};

const DONUT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const AnalyticsPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(() => {
    setLoading(true);
    api.getAnalyticsOverview(days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState text="加载失败" />;

  const roleColorMap: Record<string, string> = { admin: '#ef4444', recruiter: '#3b82f6', candidate: '#10b981', viewer: '#64748b' };
  const tierColorMap: Record<string, string> = { free: '#64748b', pro: '#6366f1', ultra: '#f59e0b' };
  const actionColorMap: Record<string, string> = {
    resume_parse: '#06b6d4', profile_build: '#14b8a6', job_match: '#10b981',
    interview: '#f59e0b', market_analysis: '#8b5cf6', route_dispatch: '#64748b',
    chat: '#6366f1', invite_reward: '#ec4899', other: '#94a3b8',
  };

  return (
    <>
      <PageHeader title="运营数据" sub={`最近 ${days} 天平台运营概览`} actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-md p-0.5">
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-2.5 py-1 text-sm font-semibold rounded transition-all ${days === d ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {d}天
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
        </div>
      } />

      {/* ── 核心指标 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center"><Users size={18} className="text-indigo-600" /></div>
            <div>
              <p className="text-xs text-slate-400">总用户</p>
              <p className="text-xl font-black text-slate-900">{data.users.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-emerald-600 font-semibold">+{data.users.today} 今日</span>
            <span className="text-slate-400">+{data.users.week} 本周</span>
            <span className="text-slate-400">+{data.users.month} 本月</span>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center"><TrendingUp size={18} className="text-emerald-600" /></div>
            <div>
              <p className="text-xs text-slate-400">总收入</p>
              <p className="text-xl font-black text-emerald-600">¥{data.revenue.total.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs mt-2 text-slate-400">本月 ¥{data.revenue.month} · 净利 ¥{data.revenue.net}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center"><Zap size={18} className="text-amber-600" /></div>
            <div>
              <p className="text-xs text-slate-400">Token 消耗</p>
              <p className="text-xl font-black text-slate-900">{data.tokens.consumed.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs mt-2 text-slate-400">余额 {data.tokens.balance.toLocaleString()} · 已发 {data.tokens.granted.toLocaleString()}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center"><Bot size={18} className="text-purple-600" /></div>
            <div>
              <p className="text-xs text-slate-400">AI 对话</p>
              <p className="text-xl font-black text-slate-900">{data.ai.user_messages.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs mt-2 text-slate-400">总消息 {data.ai.total_messages.toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
        <StatCard label="在线职位" value={data.jobs.active} icon={Briefcase} sub={`共 ${data.jobs.total} 个`} />
        <StatCard label="招聘流程" value={data.flows.total} icon={GitBranch} sub={`均匹配 ${data.flows.avg_match}%`} />
        <StatCard label="候选人" value={data.candidates.total} icon={UserCheck} sub={`${data.candidates.complete_profiles} 已完善`} />
        <StatCard label="邀请成功" value={`${data.invitations.successful}/${data.invitations.total}`} icon={UserPlus} sub={`奖励 ${(data.invitations.reward_tokens || 0).toLocaleString()} Token`} />
      </div>

      {/* ── 用户增长趋势 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-indigo-500" /> 用户增长趋势</h3>
          {data.users.trend.length > 0 ? (
            <AreaChart data={data.users.trend.map((d: any) => d.count)} color="#6366f1" height={160} />
          ) : <p className="text-xs text-slate-400 py-8 text-center">暂无数据</p>}
          <div className="flex justify-between mt-2 text-xs text-slate-400 px-1">
            <span>{data.users.trend[0]?.date?.slice(5)}</span>
            <span>{data.users.trend[data.users.trend.length - 1]?.date?.slice(5)}</span>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><PieChart size={15} className="text-indigo-500" /> 用户构成</h3>
          <div className="flex justify-center mb-3">
            <DonutChart data={Object.entries(data.users.by_role).map(([k, v]: any, i) => ({
              label: ROLE_LABELS[k] || k, value: v, color: roleColorMap[k] || DONUT_COLORS[i],
            }))} size={130} />
          </div>
          <div className="space-y-1.5">
            {Object.entries(data.users.by_role).map(([k, v]: any) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: roleColorMap[k] || '#64748b' }} />
                  <span className="text-slate-600">{ROLE_LABELS[k] || k}</span>
                </div>
                <span className="font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-3 pt-3">
            <h4 className="text-xs text-slate-400 mb-2 font-semibold">账户等级</h4>
            {Object.entries(data.users.by_tier).map(([k, v]: any) => (
              <div key={k} className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tierColorMap[k] || '#64748b' }} />
                  <span className="text-slate-600">{TIER_LABELS[k] || k}</span>
                </div>
                <span className="font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── 收入趋势 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Receipt size={15} className="text-emerald-500" /> 收入趋势</h3>
          {data.revenue.trend.length > 0 ? (
            <>
              <AreaChart data={data.revenue.trend.map((d: any) => d.income)} color="#10b981" height={160} />
              <div className="flex justify-between mt-2 text-xs text-slate-400 px-1">
                <span>{data.revenue.trend[0]?.date?.slice(5)}</span>
                <span>{data.revenue.trend[data.revenue.trend.length - 1]?.date?.slice(5)}</span>
              </div>
            </>
          ) : <p className="text-xs text-slate-400 py-8 text-center">暂无数据</p>}
        </Card>
        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard size={15} className="text-amber-500" /> 支付方式</h3>
          {data.revenue.by_payment.length > 0 ? (
            <div className="flex justify-center mb-3">
              <DonutChart data={data.revenue.by_payment.map((p: any, i: number) => ({
                label: PAYMENT_MAP[p.method] || p.method, value: p.count, color: DONUT_COLORS[i],
              }))} size={130} />
            </div>
          ) : null}
          <div className="space-y-2">
            {data.revenue.by_payment.map((p: any, i: number) => (
              <div key={p.method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                  <span className="text-slate-600">{PAYMENT_MAP[p.method] || p.method}</span>
                </div>
                <span className="font-bold text-slate-700">¥{p.amount} <span className="text-slate-300 font-normal">({p.count}笔)</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Token 消耗分析 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Zap size={15} className="text-amber-500" /> Token 消耗趋势</h3>
          {data.tokens.trend.length > 0 ? (
            <>
              <MiniBarChart data={data.tokens.trend.map((d: any) => ({ label: d.date, value: d.consumed }))} color="#f59e0b" height={160} />
            </>
          ) : <p className="text-xs text-slate-400 py-8 text-center">暂无数据</p>}
        </Card>
        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2"><Target size={15} className="text-indigo-500" /> 消耗分布</h3>
          {data.tokens.by_action.length > 0 ? (
            <>
              <div className="flex justify-center mb-3">
                <DonutChart data={data.tokens.by_action.map((a: any, i: number) => ({
                  label: ACTION_LABELS[a.action] || a.action, value: a.total, color: actionColorMap[a.action] || DONUT_COLORS[i],
                }))} size={130} />
              </div>
              <div className="space-y-1.5">
                {data.tokens.by_action.map((a: any, i: number) => (
                  <div key={a.action} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: actionColorMap[a.action] || DONUT_COLORS[i] }} />
                      <span className="text-slate-600">{ACTION_LABELS[a.action] || a.action}</span>
                    </div>
                    <span className="font-bold text-slate-700">{a.total.toLocaleString()} <span className="text-slate-300 font-normal">({a.count})</span></span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-slate-400 py-4 text-center">暂无数据</p>}
        </Card>
      </div>

      {/* ── 套餐分布 ── */}
      {data.tokens.by_package.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
          {data.tokens.by_package.map((p: any) => {
            const names: Record<string, string> = { free: '免费版', starter: '入门版', pro: '专业版', enterprise: '企业版' };
            const colors: Record<string, string> = { free: 'bg-slate-50 text-slate-600', starter: 'bg-blue-50 text-blue-600', pro: 'bg-indigo-50 text-indigo-600', enterprise: 'bg-amber-50 text-amber-600' };
            return (
              <Card key={p.type} className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-md ${colors[p.type] || 'bg-slate-50 text-slate-600'} flex items-center justify-center`}>
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{names[p.type] || p.type}</p>
                    <p className="text-lg font-black text-slate-900">{p.count} <span className="text-xs font-normal text-slate-400">份</span></p>
                  </div>
                </div>
                <p className="text-xs mt-2 text-slate-400">收入 ¥{p.revenue}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 职位 & 流程 & AI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><Briefcase size={15} className="text-blue-500" /> 职位分析</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-slate-900">{data.jobs.total}</p>
              <p className="text-xs text-slate-400">总职位</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-emerald-600">{data.jobs.active}</p>
              <p className="text-xs text-slate-400">在线</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-slate-900">{(data.jobs.total_views || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400">总浏览</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-indigo-600">{(data.jobs.total_applies || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400">总投递</p>
            </div>
          </div>
          <h4 className="text-xs text-slate-400 mb-2 font-semibold">状态分布</h4>
          <div className="space-y-1.5">
            {Object.entries(data.jobs.by_status).map(([k, v]: any) => (
              <div key={k} className="flex items-center justify-between">
                <StatusBadge value={k} />
                <span className="text-[13px] font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><GitBranch size={15} className="text-emerald-500" /> 招聘流程</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-slate-900">{data.flows.total}</p>
              <p className="text-xs text-slate-400">总流程</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-indigo-600">{data.flows.avg_match}%</p>
              <p className="text-xs text-slate-400">平均匹配度</p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-md text-center mb-3">
            <p className="text-sm font-black text-amber-600">{(data.flows.tokens_consumed || 0).toLocaleString()}</p>
            <p className="text-xs text-amber-500">Token 消耗</p>
          </div>
          <h4 className="text-xs text-slate-400 mb-2 font-semibold">状态分布</h4>
          <div className="space-y-1.5">
            {Object.entries(data.flows.by_status).map(([k, v]: any) => (
              <div key={k} className="flex items-center justify-between">
                <StatusBadge value={k} />
                <span className="text-[13px] font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare size={15} className="text-purple-500" /> AI 对话趋势</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-slate-900">{data.ai.user_messages.toLocaleString()}</p>
              <p className="text-xs text-slate-400">用户消息</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-md text-center">
              <p className="text-lg font-black text-slate-900">{data.ai.total_messages.toLocaleString()}</p>
              <p className="text-xs text-slate-400">总消息</p>
            </div>
          </div>
          {data.ai.trend.length > 0 ? (
            <MiniBarChart data={data.ai.trend.map((d: any) => ({ label: d.date, value: d.count }))} color="#8b5cf6" height={100} />
          ) : <p className="text-xs text-slate-400 py-4 text-center">暂无数据</p>}
        </Card>
      </div>

      {/* ── 工单 & 邀请 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><Ticket size={15} className="text-amber-500" /> 工单统计</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-50 rounded-md text-center flex-1">
              <p className="text-lg font-black text-slate-900">{data.tickets.total}</p>
              <p className="text-xs text-slate-400">总工单</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-md text-center flex-1">
              <p className="text-lg font-black text-amber-600">{data.tickets.open}</p>
              <p className="text-xs text-amber-500">待处理</p>
            </div>
          </div>
          <h4 className="text-xs text-slate-400 mb-2 font-semibold">按类型</h4>
          <div className="space-y-1.5">
            {Object.entries(data.tickets.by_type).map(([k, v]: any) => (
              <div key={k} className="flex items-center justify-between">
                <StatusBadge value={k} />
                <span className="text-[13px] font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><UserPlus size={15} className="text-indigo-500" /> 邀请数据</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-50 rounded-md text-center flex-1">
              <p className="text-lg font-black text-slate-900">{data.invitations.total}</p>
              <p className="text-xs text-slate-400">总邀请</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-md text-center flex-1">
              <p className="text-lg font-black text-emerald-600">{data.invitations.successful}</p>
              <p className="text-xs text-emerald-500">已注册</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-md text-center flex-1">
              <p className="text-lg font-black text-amber-600">{(data.invitations.reward_tokens || 0).toLocaleString()}</p>
              <p className="text-xs text-amber-500">奖励 Token</p>
            </div>
          </div>
          {data.invitations.total > 0 && (
            <div className="p-3 bg-indigo-50 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-indigo-600 font-semibold">转化率</span>
                <span className="text-sm font-black text-indigo-700">{data.invitations.total > 0 ? Math.round(data.invitations.successful / data.invitations.total * 100) : 0}%</span>
              </div>
              <div className="bg-indigo-100 rounded-full h-2">
                <div className="bg-indigo-500 rounded-full h-2 transition-all" style={{ width: `${data.invitations.total > 0 ? Math.round(data.invitations.successful / data.invitations.total * 100) : 0}%` }} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};


// ═══════════════════════════════════════════════════════════════════
// 订单管理
// ═══════════════════════════════════════════════════════════════════

const ORDER_TYPE_MAP: Record<string, { label: string; color: string }> = {
  package_purchase: { label: '套餐购买', color: 'bg-blue-100 text-blue-700' },
  subscription: { label: '订阅续费', color: 'bg-indigo-100 text-indigo-700' },
  refund: { label: '退款', color: 'bg-rose-100 text-rose-700' },
  platform_expense: { label: '平台支出', color: 'bg-amber-100 text-amber-700' },
  platform_income: { label: '平台收入', color: 'bg-emerald-100 text-emerald-700' },
  adjustment: { label: '调账', color: 'bg-slate-100 text-slate-700' },
};

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: 'bg-amber-100 text-amber-700' },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  refunded: { label: '已退款', color: 'bg-rose-100 text-rose-700' },
  partial_refund: { label: '部分退款', color: 'bg-orange-100 text-orange-700' },
  cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-600' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700' },
};

const PAYMENT_MAP: Record<string, string> = {
  alipay: '支付宝', wechat: '微信支付', bank_transfer: '银行转账',
  credit_card: '信用卡', balance: '余额', system: '系统',
};

const OrdersPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [refundModal, setRefundModal] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [manualModal, setManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ order_type: 'platform_expense', amount: '', title: '', description: '', payment_method: 'system' });
  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all');

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, size: 20, search };
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (paymentFilter) params.payment = paymentFilter;

    // Tab 过滤
    if (tab === 'income') {
      if (!typeFilter) params.type = ''; // 不额外过滤，前端过滤
    }

    Promise.all([
      api.getOrders(params),
      api.getOrderStats().catch(() => null),
    ])
      .then(([d, s]) => { setData(d); setStats(s); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, typeFilter, statusFilter, paymentFilter, search, tab]);

  useEffect(() => { load(); }, [load]);

  const handleRefund = async () => {
    if (!refundModal || !refundAmount) return;
    try {
      await api.refundOrder(refundModal.id, parseFloat(refundAmount), refundReason || '管理员退款');
      setRefundModal(null); setRefundAmount(''); setRefundReason(''); load();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateManual = async () => {
    if (!manualForm.title || !manualForm.amount) return;
    try {
      await api.createManualOrder({ ...manualForm, amount: parseFloat(manualForm.amount) });
      setManualModal(false);
      setManualForm({ order_type: 'platform_expense', amount: '', title: '', description: '', payment_method: 'system' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const viewDetail = async (id: number) => {
    try {
      const detail = await api.getOrderDetail(id);
      setDetailModal(detail);
    } catch (e: any) { alert(e.message); }
  };

  // 过滤数据按 tab
  const filteredItems = data?.items?.filter((o: any) => {
    if (tab === 'income') return o.amount > 0;
    if (tab === 'expense') return o.amount < 0;
    return true;
  }) || [];

  return (
    <>
      <PageHeader title="订单管理" sub="平台收支与交易明细" actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setManualModal(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 flex items-center gap-1.5">
            <Plus size={14} /> 新建记录
          </button>
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md"><RefreshCw size={16} className="text-slate-400" /></button>
        </div>
      } />

      {/* 财务概览 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center"><TrendingUp size={18} className="text-emerald-600" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">总收入</p>
                <p className="text-xl font-black text-slate-900">¥{stats.total_income.toLocaleString()}</p>
              </div>
            </div>
            {stats.month_growth !== 0 && (
              <p className={`text-xs mt-2 flex items-center gap-1 ${stats.month_growth > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {stats.month_growth > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                环比 {stats.month_growth > 0 ? '+' : ''}{stats.month_growth}%
              </p>
            )}
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center"><ArrowDown size={18} className="text-rose-500" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">总支出</p>
                <p className="text-xl font-black text-slate-900">¥{stats.total_expense.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs mt-2 text-slate-400">退款 ¥{stats.total_refund}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center"><Wallet size={18} className="text-indigo-600" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">净收入</p>
                <p className={`text-xl font-black ${stats.net_income >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>¥{stats.net_income.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs mt-2 text-slate-400">今日 ¥{stats.today_income}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center"><Receipt size={18} className="text-amber-600" /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">订单数</p>
                <p className="text-xl font-black text-slate-900">{stats.total_orders}</p>
              </div>
            </div>
            <p className="text-xs mt-2 text-slate-400">
              <span className="text-emerald-600 font-semibold">{stats.paid_orders}</span> 已支付
              {stats.pending_orders > 0 && <> · <span className="text-amber-600 font-semibold">{stats.pending_orders}</span> 待支付</>}
              {stats.refunded_orders > 0 && <> · <span className="text-rose-500 font-semibold">{stats.refunded_orders}</span> 退款</>}
            </p>
          </Card>
        </div>
      )}

      {/* 分布统计 */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><BarChart3 size={15} className="text-indigo-500" /> 按类型分布</h3>
            <div className="space-y-2.5">
              {stats.by_type?.map((t: any) => {
                const total = stats.total_orders || 1;
                const pct = Math.round(t.count / total * 100);
                const info = ORDER_TYPE_MAP[t.type] || { label: t.type, color: 'bg-slate-100 text-slate-600' };
                return (
                  <div key={t.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>
                      <span className="text-[13px] font-bold text-slate-600">{t.count} 笔 <span className="text-slate-300 font-normal">(¥{t.amount})</span></span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-1.5">
                      <div className="bg-indigo-500 rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3 flex items-center gap-2"><CreditCard size={15} className="text-amber-500" /> 支付方式分布</h3>
            <div className="space-y-2.5">
              {stats.by_payment?.map((p: any) => {
                const total = stats.total_orders || 1;
                const pct = Math.round(p.count / total * 100);
                return (
                  <div key={p.method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-slate-600">{PAYMENT_MAP[p.method] || p.method}</span>
                      <span className="text-[13px] font-bold text-slate-600">{p.count} 笔 <span className="text-slate-300 font-normal">(¥{p.amount})</span></span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-1.5">
                      <div className="bg-amber-500 rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 切换 + 筛选 */}
      <Card className="mb-5 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-md p-0.5">
            {[
              { key: 'all', label: '全部' },
              { key: 'income', label: '收入' },
              { key: 'expense', label: '支出' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key as any); setPage(0); }}
                className={`px-3 py-1.5 text-sm font-semibold rounded transition-all ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
            <option value="">全部类型</option>
            <option value="package_purchase">套餐购买</option>
            <option value="subscription">订阅续费</option>
            <option value="refund">退款</option>
            <option value="platform_expense">平台支出</option>
            <option value="platform_income">平台收入</option>
            <option value="adjustment">调账</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="completed">已完成</option>
            <option value="refunded">已退款</option>
            <option value="cancelled">已取消</option>
            <option value="failed">失败</option>
          </select>
          <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600">
            <option value="">全部支付方式</option>
            <option value="alipay">支付宝</option>
            <option value="wechat">微信支付</option>
            <option value="bank_transfer">银行转账</option>
            <option value="credit_card">信用卡</option>
            <option value="system">系统</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索订单号/标题..."
              className="pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          {(typeFilter || statusFilter || paymentFilter || search) && (
            <button onClick={() => { setTypeFilter(''); setStatusFilter(''); setPaymentFilter(''); setSearch(''); setPage(0); }}
              className="text-[13px] text-indigo-600 hover:underline flex items-center gap-1">
              <X size={12} /> 清除
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">共 {data?.total || 0} 条记录</span>
        </div>
      </Card>

      {/* 订单列表 */}
      <Card>
        {loading ? <LoadingSpinner /> : !filteredItems.length ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left p-3 text-xs font-semibold text-slate-400">订单号</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">用户</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">类型</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">标题</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-400">金额</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">支付方式</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">状态</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-400">时间</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-400">操作</th>
              </tr></thead>
              <tbody>
                {filteredItems.map((o: any) => {
                  const typeInfo = ORDER_TYPE_MAP[o.order_type] || { label: o.order_type, color: 'bg-slate-100 text-slate-600' };
                  const statusInfo = ORDER_STATUS_MAP[o.status] || { label: o.status, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4">
                        <span className="text-xs text-slate-500 font-mono">{o.order_no}</span>
                      </td>
                      <td className="p-4">
                        {o.user_name ? (
                          <div>
                            <UserLink id={o.user_id} name={o.user_name} className="text-sm font-semibold text-slate-700" />
                            <p className="text-xs text-slate-400">UID: {o.user_id}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">UID: {o.user_id || '—'}</span>
                        )}
                      </td>
                      <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span></td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700 max-w-[180px] truncate">{o.title}</p>
                        {o.package_type && <p className="text-xs text-slate-400">{o.package_type} 套餐</p>}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-[13px] font-bold tabular-nums ${o.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {o.amount >= 0 ? '+' : ''}¥{Math.abs(o.amount).toFixed(2)}
                        </span>
                        {o.discount > 0 && <p className="text-xs text-slate-400 line-through">¥{o.original_amount}</p>}
                      </td>
                      <td className="p-4 text-[13px] text-slate-500">{PAYMENT_MAP[o.payment_method] || '—'}</td>
                      <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span></td>
                      <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{o.created_at?.slice(0, 16).replace('T', ' ')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewDetail(o.id)} className="p-1.5 hover:bg-slate-100 rounded-md" title="详情"><Eye size={14} className="text-slate-400" /></button>
                          {['paid', 'completed', 'partial_refund'].includes(o.status) && o.amount > 0 && (
                            <button onClick={() => { setRefundModal(o); setRefundAmount(String(o.amount - (o.refund_amount || 0))); }}
                              className="p-1.5 hover:bg-rose-50 rounded-md" title="退款"><RotateCcw size={14} className="text-rose-400" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="p-4"><Pagination page={page} size={20} total={data.total} onChange={setPage} /></div>}
      </Card>

      {/* 订单详情弹窗 */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`订单详情`} wide>
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400 mb-1">订单号</p>
                <p className="text-xs font-mono font-semibold text-slate-700">{detailModal.order_no}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400 mb-1">金额</p>
                <p className={`text-lg font-black ${detailModal.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {detailModal.amount >= 0 ? '+' : ''}¥{Math.abs(detailModal.amount).toFixed(2)}
                </p>
                {detailModal.discount > 0 && <p className="text-xs text-slate-400">原价 ¥{detailModal.original_amount}，优惠 ¥{detailModal.discount}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400 mb-1">类型</p>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${(ORDER_TYPE_MAP[detailModal.order_type] || {}).color || 'bg-slate-100 text-slate-600'}`}>
                  {(ORDER_TYPE_MAP[detailModal.order_type] || {}).label || detailModal.order_type}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400 mb-1">状态</p>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${(ORDER_STATUS_MAP[detailModal.status] || {}).color || 'bg-slate-100 text-slate-600'}`}>
                  {(ORDER_STATUS_MAP[detailModal.status] || {}).label || detailModal.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400 mb-1">用户</p>
                <p className="text-sm text-slate-700"><UserLink id={detailModal.user_id} name={detailModal.user_name} className="font-semibold" /> <span className="text-xs text-slate-400">UID: {detailModal.user_id}</span></p>
              </div>
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400 mb-1">支付方式</p>
                <p className="text-sm text-slate-700">{PAYMENT_MAP[detailModal.payment_method] || '—'}</p>
                {detailModal.payment_no && <p className="text-xs text-slate-400 font-mono mt-0.5">{detailModal.payment_no}</p>}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-md">
              <p className="text-xs text-slate-400 mb-1">标题</p>
              <p className="text-sm font-semibold text-slate-800">{detailModal.title}</p>
              {detailModal.description && <p className="text-[13px] text-slate-500 mt-1">{detailModal.description}</p>}
            </div>

            {detailModal.refund_amount > 0 && (
              <div className="p-3 bg-rose-50 rounded-md border border-rose-100">
                <p className="text-xs text-rose-400 mb-1">退款信息</p>
                <p className="text-sm font-bold text-rose-600">已退 ¥{detailModal.refund_amount.toFixed(2)}</p>
              </div>
            )}

            {detailModal.refund_orders?.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400 mb-2">关联退款单</p>
                {detailModal.refund_orders.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-1 text-xs">
                    <span className="font-mono text-slate-500 text-xs">{r.order_no}</span>
                    <span className="text-rose-500 font-bold">¥{Math.abs(r.amount).toFixed(2)}</span>
                    <span className="text-slate-400">{r.created_at?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400">创建时间</p>
                <p className="text-xs text-slate-600 mt-0.5">{detailModal.created_at?.slice(0, 16).replace('T', ' ')}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400">支付时间</p>
                <p className="text-xs text-slate-600 mt-0.5">{detailModal.paid_at?.slice(0, 16).replace('T', ' ') || '—'}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-400">退款时间</p>
                <p className="text-xs text-slate-600 mt-0.5">{detailModal.refunded_at?.slice(0, 16).replace('T', ' ') || '—'}</p>
              </div>
            </div>

            {detailModal.admin_remark && (
              <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                <p className="text-xs text-amber-500 mb-1 flex items-center gap-1"><Edit size={10} /> 管理员备注</p>
                <p className="text-sm text-slate-700">{detailModal.admin_remark}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 退款弹窗 */}
      <Modal open={!!refundModal} onClose={() => setRefundModal(null)} title="订单退款">
        {refundModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-md">
              <p className="text-xs text-slate-500">原订单: <span className="font-mono font-semibold text-xs">{refundModal.order_no}</span></p>
              <p className="text-xs text-slate-500 mt-1">金额: <span className="font-bold text-slate-800">¥{refundModal.amount}</span></p>
              {refundModal.refund_amount > 0 && <p className="text-xs text-rose-500 mt-1">已退: ¥{refundModal.refund_amount}</p>}
              <p className="text-xs text-slate-400 mt-1">可退: ¥{(refundModal.amount - (refundModal.refund_amount || 0)).toFixed(2)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">退款金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} step="0.01" min="0.01"
                  max={refundModal.amount - (refundModal.refund_amount || 0)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-md border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">退款原因</label>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={3} placeholder="请输入退款原因..."
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
            </div>
            <button onClick={handleRefund} disabled={!refundAmount || parseFloat(refundAmount) <= 0}
              className="w-full py-2.5 bg-rose-600 text-white rounded-md font-semibold text-sm hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <RotateCcw size={14} /> 确认退款
            </button>
          </div>
        )}
      </Modal>

      {/* 手动创建收支记录 */}
      <Modal open={manualModal} onClose={() => setManualModal(false)} title="新建收支记录">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">类型</label>
            <select value={manualForm.order_type} onChange={e => setManualForm({ ...manualForm, order_type: e.target.value })}
              className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm">
              <option value="platform_expense">平台支出</option>
              <option value="platform_income">平台收入</option>
              <option value="adjustment">手动调账</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">金额</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
              <input type="number" value={manualForm.amount} onChange={e => setManualForm({ ...manualForm, amount: e.target.value })} step="0.01" min="0.01" placeholder="0.00"
                className="w-full pl-8 pr-3 py-2.5 rounded-md border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">标题</label>
            <input value={manualForm.title} onChange={e => setManualForm({ ...manualForm, title: e.target.value })} placeholder="如：服务器费用"
              className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">描述（选填）</label>
            <textarea value={manualForm.description} onChange={e => setManualForm({ ...manualForm, description: e.target.value })} rows={3} placeholder="详细说明..."
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">支付方式</label>
            <select value={manualForm.payment_method} onChange={e => setManualForm({ ...manualForm, payment_method: e.target.value })}
              className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm">
              <option value="system">系统</option>
              <option value="bank_transfer">银行转账</option>
              <option value="alipay">支付宝</option>
              <option value="wechat">微信支付</option>
            </select>
          </div>
          <button onClick={handleCreateManual} disabled={!manualForm.title || !manualForm.amount}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Plus size={14} /> 创建记录
          </button>
        </div>
      </Modal>
    </>
  );
};


// ═══════════════════════════════════════════════════════════════════
// 17. 管理员管理
// ═══════════════════════════════════════════════════════════════════

const AdminManagementPage = () => {
  const [tab, setTab] = useState<'admins' | 'roles' | 'logs'>('admins');
  const [admins, setAdmins] = useState<any>({ items: [], total: 0, active_count: 0, role_distribution: {} });
  const [roles, setRoles] = useState<any[]>([]);
  const [permModules, setPermModules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [editAdmin, setEditAdmin] = useState<any>(null);
  const [addForm, setAddForm] = useState({ email: '', name: '', password: 'admin123', role_id: 0, user_id: '' });
  const [roleForm, setRoleForm] = useState({ name: '', display_name: '', description: '', permissions: [] as string[] });
  const [filterRole, setFilterRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r, p] = await Promise.all([
        api.getAdministrators(),
        api.getRoles(),
        api.getPermissionModules(),
      ]);
      setAdmins(a);
      setRoles(r);
      setPermModules(p);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const data = await api.getAuditLogs({ category: 'admin', limit: 100 });
      setAuditLogs(Array.isArray(data) ? data : data.items || []);
    } catch { setAuditLogs([]); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);

  const handleAddAdmin = async () => {
    try {
      const body: any = { role_id: addForm.role_id || undefined };
      if (addForm.user_id) {
        body.user_id = parseInt(addForm.user_id);
      } else {
        body.email = addForm.email;
        body.name = addForm.name;
        body.password = addForm.password;
      }
      await api.createAdministrator(body);
      setShowAddAdmin(false);
      setAddForm({ email: '', name: '', password: 'admin123', role_id: 0, user_id: '' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggle = async (id: number) => {
    try { await api.toggleAdministrator(id); load(); } catch (e: any) { alert(e.message); }
  };

  const handleRemoveAdmin = async (id: number, name: string) => {
    if (!confirm(`确定移除 ${name} 的管理员权限？该用户将降级为普通用户。`)) return;
    try { await api.deleteAdministrator(id); load(); } catch (e: any) { alert(e.message); }
  };

  const handleUpdateAdmin = async () => {
    if (!editAdmin) return;
    try {
      await api.updateAdministrator(editAdmin.id, {
        role_id: editAdmin.newRoleId ?? undefined,
      });
      setEditAdmin(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleSaveRole = async () => {
    try {
      if (editRole) {
        await api.updateRole(editRole.id, {
          display_name: roleForm.display_name,
          description: roleForm.description,
          permissions: roleForm.permissions,
        });
        setEditRole(null);
      } else {
        await api.createRole(roleForm);
      }
      setShowAddRole(false);
      setRoleForm({ name: '', display_name: '', description: '', permissions: [] });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteRole = async (id: number, name: string) => {
    if (!confirm(`确定删除角色 "${name}"？`)) return;
    try { await api.deleteRole(id); load(); } catch (e: any) { alert(e.message); }
  };

  const togglePerm = (perm: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleAllPerms = () => {
    if (roleForm.permissions.includes('*')) {
      setRoleForm(prev => ({ ...prev, permissions: [] }));
    } else {
      setRoleForm(prev => ({ ...prev, permissions: ['*'] }));
    }
  };

  const openEditRole = (role: any) => {
    setEditRole(role);
    setRoleForm({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setShowAddRole(true);
  };

  const openAddRole = () => {
    setEditRole(null);
    setRoleForm({ name: '', display_name: '', description: '', permissions: [] });
    setShowAddRole(true);
  };

  const filteredAdmins = admins.items.filter((a: any) => {
    if (filterRole && (a.admin_role?.display_name || '未分配角色') !== filterRole) return false;
    if (searchTerm && !a.name.includes(searchTerm) && !String(a.id).includes(searchTerm)) return false;
    return true;
  });

  const ROLE_COLORS: Record<string, string> = {
    '超级管理员': 'bg-rose-100 text-rose-700',
    '运营管理员': 'bg-blue-100 text-blue-700',
    '内容管理员': 'bg-emerald-100 text-emerald-700',
    '客服管理员': 'bg-amber-100 text-amber-700',
  };

  const currentUser = safeParseUser();

  const TABS = [
    { key: 'admins' as const, label: '管理员列表', icon: Users },
    { key: 'roles' as const, label: '角色管理', icon: Shield },
    { key: 'logs' as const, label: '操作日志', icon: Clock },
  ];

  return (
    <>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">管理员管理</h1>
          <p className="text-xs text-slate-400 mt-0.5">管理后台管理员账号、角色和权限</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-md text-slate-400">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {tab === 'admins' && (
            <button onClick={() => setShowAddAdmin(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700">
              <Plus size={14} /> 添加管理员
            </button>
          )}
          {tab === 'roles' && (
            <button onClick={openAddRole}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700">
              <Plus size={14} /> 新建角色
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-slate-400">管理员总数</span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center"><Users size={16} className="text-indigo-600" /></div>
          </div>
          <p className="text-xl font-bold text-slate-900">{admins.total}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-slate-400">活跃管理员</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center"><CheckCircle size={16} className="text-emerald-600" /></div>
          </div>
          <p className="text-xl font-bold text-slate-900">{admins.active_count}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-slate-400">角色数量</span>
            <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center"><Shield size={16} className="text-purple-600" /></div>
          </div>
          <p className="text-xl font-bold text-slate-900">{roles.length}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-slate-400">角色分布</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center"><PieChart size={16} className="text-amber-600" /></div>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(admins.role_distribution || {}).map(([name, count]) => (
              <span key={name} className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[name] || 'bg-slate-100 text-slate-600'}`}>
                {name}: {count as number}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-md p-1 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[13px] font-medium transition-colors ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: 管理员列表 */}
      {tab === 'admins' && (
        <Card>
          {/* 筛选栏 */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索姓名、UID..."
                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value="">全部角色</option>
              {Object.keys(admins.role_distribution || {}).map((r: string) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">管理员</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">UID</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">角色</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">状态</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">最后登录</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">创建时间</th>
                  <th className="text-right p-3 font-semibold text-slate-500 text-xs">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((a: any) => {
                  const isSelf = a.id === currentUser.id;
                  const roleName = a.admin_role?.display_name || '未分配角色';
                  return (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.name} url={a.avatar_url} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{a.name}</p>
                            <p className="text-xs text-slate-400">UID: {a.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-slate-400 font-mono">{a.id}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[roleName] || 'bg-slate-100 text-slate-600'}`}>
                          {roleName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {a.is_active ? '活跃' : '已禁用'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-xs">{a.last_login ? new Date(a.last_login).toLocaleString('zh-CN') : '从未登录'}</td>
                      <td className="p-3 text-slate-500 text-xs">{a.created_at ? new Date(a.created_at).toLocaleDateString('zh-CN') : '-'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditAdmin({ ...a, newRoleId: a.admin_role_id || 0 }); }}
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600" title="编辑角色">
                            <Edit size={14} />
                          </button>
                          {!isSelf && (
                            <>
                              <button onClick={() => handleToggle(a.id)}
                                className={`p-1.5 hover:bg-slate-100 rounded-md ${a.is_active ? 'text-slate-400 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'}`}
                                title={a.is_active ? '禁用' : '启用'}>
                                {a.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                              </button>
                              <button onClick={() => handleRemoveAdmin(a.id, a.name)}
                                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-rose-600" title="移除管理员">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          {isSelf && <span className="text-xs text-slate-400 px-1">当前</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAdmins.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400 text-sm">暂无管理员</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: 角色管理 */}
      {tab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role: any) => {
            const isSuper = role.permissions?.includes('*');
            const permCount = isSuper ? '全部' : (role.permissions?.length || 0);
            return (
              <Card key={role.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      isSuper ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                      role.name === 'ops_admin' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                      role.name === 'content_admin' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                      role.name === 'cs_admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-slate-500 to-slate-600'
                    }`}>
                      <Shield size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{role.display_name}</h3>
                      <p className="text-xs text-slate-400">{role.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {role.is_system && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">系统</span>
                    )}
                    <button onClick={() => openEditRole(role)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600">
                      <Edit size={14} />
                    </button>
                    {!role.is_system && (
                      <button onClick={() => handleDeleteRole(role.id, role.display_name)}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{role.description || '暂无描述'}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users size={13} />
                    <span>{role.user_count} 位管理员</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    isSuper ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {permCount} 项权限
                  </span>
                </div>

                {/* 权限摘要 */}
                {!isSuper && role.permissions?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {role.permissions.slice(0, 8).map((p: string) => {
                      const [mod, act] = p.split(':');
                      const modLabel = permModules.find((m: any) => m.key === mod)?.label || mod;
                      const actLabel = permModules.find((m: any) => m.key === mod)?.actions?.find((a: any) => a.key === act)?.label || act;
                      return (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                          {modLabel}·{actLabel}
                        </span>
                      );
                    })}
                    {role.permissions.length > 8 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-50 text-slate-400">
                        +{role.permissions.length - 8}
                      </span>
                    )}
                  </div>
                )}
                {isSuper && (
                  <div className="mt-3">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100">
                      拥有所有模块的全部权限
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
          {roles.length === 0 && (
            <div className="col-span-2 p-12 text-center text-slate-400 text-sm">暂无角色</div>
          )}
        </div>
      )}

      {/* Tab 3: 操作日志 */}
      {tab === 'logs' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">时间</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">操作人</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">操作内容</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">IP 地址</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs">风险等级</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any, i: number) => (
                  <tr key={log.id || i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500 text-xs whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{log.actor || '-'}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{log.action}</td>
                    <td className="p-3 text-slate-500 text-xs font-mono">{log.ip_address || '-'}</td>
                    <td className="p-4"><StatusBadge value={log.risk_level || 'info'} /></td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400 text-sm">暂无操作日志</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 添加管理员弹窗 */}
      <Modal open={showAddAdmin} onClose={() => setShowAddAdmin(false)} title="添加管理员">
        <div className="space-y-4">
          <div className="flex gap-2 bg-slate-50 rounded-md p-1">
            <button onClick={() => setAddForm(f => ({ ...f, user_id: '' }))}
              className={`flex-1 text-sm py-1.5 rounded font-medium transition-colors ${!addForm.user_id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              创建新账号
            </button>
            <button onClick={() => setAddForm(f => ({ ...f, email: '', name: '' }))}
              className={`flex-1 text-sm py-1.5 rounded font-medium transition-colors ${addForm.user_id !== '' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              提升现有用户
            </button>
          </div>

          {!addForm.user_id && addForm.user_id === '' ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">用户 UID</label>
                <input value={addForm.user_id} onChange={e => setAddForm(f => ({ ...f, user_id: e.target.value }))}
                  placeholder="输入现有用户 UID"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
            </>
          ) : null}

          {addForm.user_id === '' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">邮箱</label>
                <input value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">姓名</label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="管理员姓名"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">密码</label>
                <input value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">分配角色</label>
            <select value={addForm.role_id} onChange={e => setAddForm(f => ({ ...f, role_id: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value={0}>不分配角色</option>
              {roles.map((r: any) => <option key={r.id} value={r.id}>{r.display_name}</option>)}
            </select>
          </div>

          <button onClick={handleAddAdmin}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2">
            <Plus size={14} /> 添加管理员
          </button>
        </div>
      </Modal>

      {/* 编辑管理员角色弹窗 */}
      <Modal open={!!editAdmin} onClose={() => setEditAdmin(null)} title="编辑管理员角色">
        {editAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md">
              <Avatar name={editAdmin.name} url={editAdmin.avatar_url} size="md" />
              <div>
                <p className="font-semibold text-slate-900">{editAdmin.name}</p>
                <p className="text-xs text-slate-400">UID: {editAdmin.id}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">管理员角色</label>
              <select value={editAdmin.newRoleId || 0}
                onChange={e => setEditAdmin((prev: any) => ({ ...prev, newRoleId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value={0}>不分配角色</option>
                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.display_name}</option>)}
              </select>
            </div>

            {editAdmin.newRoleId > 0 && (() => {
              const selectedRole = roles.find((r: any) => r.id === editAdmin.newRoleId);
              if (!selectedRole) return null;
              const isSuper = selectedRole.permissions?.includes('*');
              return (
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-xs font-semibold text-slate-500 mb-2">角色权限预览</p>
                  {isSuper ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-600">拥有所有权限</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(selectedRole.permissions || []).map((p: string) => {
                        const [mod, act] = p.split(':');
                        const modLabel = permModules.find((m: any) => m.key === mod)?.label || mod;
                        const actLabel = permModules.find((m: any) => m.key === mod)?.actions?.find((a: any) => a.key === act)?.label || act;
                        return (
                          <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                            {modLabel}·{actLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            <button onClick={handleUpdateAdmin}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700">
              保存修改
            </button>
          </div>
        )}
      </Modal>

      {/* 新建/编辑角色弹窗 */}
      <Modal open={showAddRole} onClose={() => { setShowAddRole(false); setEditRole(null); }}
        title={editRole ? `编辑角色：${editRole.display_name}` : '新建角色'}>
        <div className="space-y-4">
          {!editRole && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">角色标识</label>
              <input value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))}
                placeholder="如 finance_admin（英文标识，不可修改）"
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">角色名称</label>
            <input value={roleForm.display_name} onChange={e => setRoleForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="如 财务管理员"
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">描述</label>
            <input value={roleForm.description} onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))}
              placeholder="角色职责描述"
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>

          {/* 权限矩阵 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500">权限矩阵</label>
              <button onClick={toggleAllPerms}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                  roleForm.permissions.includes('*')
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {roleForm.permissions.includes('*') ? '已选全部权限' : '选择全部'}
              </button>
            </div>

            {!roleForm.permissions.includes('*') && (
              <div className="border border-slate-200 rounded-md overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="text-left p-2 font-semibold text-slate-500 w-28">模块</th>
                      {['view', 'edit', 'delete', 'manage', 'refund', 'handle', 'send'].map(act => (
                        <th key={act} className="text-center p-2 font-semibold text-slate-500 w-14">
                          {({ view: '查看', edit: '编辑', delete: '删除', manage: '管理', refund: '退款', handle: '处理', send: '发送' } as Record<string, string>)[act]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permModules.map((mod: any) => (
                      <tr key={mod.key} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="p-2 font-medium text-slate-700">{mod.label}</td>
                        {['view', 'edit', 'delete', 'manage', 'refund', 'handle', 'send'].map(act => {
                          const hasAction = mod.actions.some((a: any) => a.key === act);
                          const perm = `${mod.key}:${act}`;
                          const checked = roleForm.permissions.includes(perm);
                          return (
                            <td key={act} className="text-center p-2">
                              {hasAction ? (
                                <input type="checkbox" checked={checked}
                                  onChange={() => togglePerm(perm)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer" />
                              ) : (
                                <span className="text-slate-200">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <button onClick={handleSaveRole}
            disabled={!roleForm.display_name || (!editRole && !roleForm.name)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {editRole ? '保存修改' : <><Plus size={14} /> 创建角色</>}
          </button>
        </div>
      </Modal>
    </>
  );
};


// ═══════════════════════════════════════════════════════════════════
// 个人资料
// ═══════════════════════════════════════════════════════════════════

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.getMe();
      setUser(me);
      setForm({ name: me.name || '', phone: me.phone || '', email: me.email || '' });
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const updated = await api.updateMe({ name: form.name, phone: form.phone || null });
      setUser(updated);
      // 同步更新 localStorage
      const stored = safeParseUser();
      localStorage.setItem('admin_user', JSON.stringify({ ...stored, name: updated.name, phone: updated.phone }));
      setMsg('保存成功');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg(e.message || '保存失败');
    }
    setSaving(false);
  };

  const handleChangePw = async () => {
    setPwSaving(true); setPwMsg('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg('两次密码不一致');
      setPwSaving(false);
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg('新密码至少 6 位');
      setPwSaving(false);
      return;
    }
    try {
      await api.changePassword(pwForm.old_password, pwForm.new_password);
      setPwMsg('密码修改成功');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
      setTimeout(() => setPwMsg(''), 2000);
    } catch (e: any) {
      setPwMsg(e.message || '修改失败');
    }
    setPwSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return <EmptyState text="无法加载用户信息" />;

  return (
    <>
      <PageHeader title="个人资料" sub="管理您的账户信息和安全设置"
        actions={<button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-slate-200 text-[13px] text-slate-600 font-medium hover:bg-slate-50"><ArrowLeft size={14} /> 返回</button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 — 头像卡片 */}
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
            {(user.name || 'A')[0]}
          </div>
          <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{user.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <StatusBadge value={user.role} />
            {user.admin_role?.display_name && <Badge color="bg-indigo-50 text-indigo-600">{user.admin_role.display_name}</Badge>}
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 w-full space-y-3 text-left">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Hash size={13} className="text-slate-300" />
              <span>UID: {user.id}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail size={13} className="text-slate-300" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone size={13} className="text-slate-300" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={13} className="text-slate-300" />
              <span>注册于 {user.created_at?.slice(0, 10) || '—'}</span>
            </div>
            {user.last_login && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={13} className="text-slate-300" />
                <span>上次登录 {user.last_login.slice(0, 16).replace('T', ' ')}</span>
              </div>
            )}
          </div>
        </Card>

        {/* 右侧 — 编辑区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card className="p-6">
            <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2"><Edit size={15} className="text-indigo-500" /> 基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">姓名</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">手机号</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="选填"
                  className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">邮箱</label>
                <input value={form.email} disabled
                  className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white spin-smooth" /> : <CheckCircle size={14} />}
                保存
              </button>
              {msg && <span className={`text-xs font-medium ${msg.includes('成功') ? 'text-emerald-600' : 'text-rose-500'}`}>{msg}</span>}
            </div>
          </Card>

          {/* 修改密码 */}
          <Card className="p-6">
            <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2"><Key size={15} className="text-amber-500" /> 修改密码</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">当前密码</label>
                <input type="password" value={pwForm.old_password} onChange={e => setPwForm({ ...pwForm, old_password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">新密码</label>
                <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">确认新密码</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleChangePw()}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={handleChangePw} disabled={pwSaving || !pwForm.old_password || !pwForm.new_password || !pwForm.confirm}
                className="px-5 py-2.5 bg-amber-500 text-white rounded-md font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2">
                {pwSaving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white spin-smooth" /> : <Key size={14} />}
                修改密码
              </button>
              {pwMsg && <span className={`text-xs font-medium ${pwMsg.includes('成功') ? 'text-emerald-600' : 'text-rose-500'}`}>{pwMsg}</span>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 路由守卫
// ═══════════════════════════════════════════════════════════════════

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ═══════════════════════════════════════════════════════════════════
// 主应用
// ═══════════════════════════════════════════════════════════════════

/** 全局深色模式初始化：确保登录页等不在 AdminLayout 内的页面也能读到 dark 状态 */
const useDarkInit = () => {
  useEffect(() => {
    if (localStorage.getItem('admin_dark') === '1') {
      document.documentElement.classList.add('dark');
    }
  }, []);
};

const App = () => {
  useDarkInit();
  return (
  <HashRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <RequireAuth>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/enterprises" element={<EnterprisesPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/flows" element={<FlowsPage />} />
              <Route path="/tokens" element={<TokensPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/invitations" element={<InvitationsPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/admins" element={<AdminManagementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </AdminLayout>
        </RequireAuth>
      } />
    </Routes>
  </HashRouter>
  );
};

export default App;
