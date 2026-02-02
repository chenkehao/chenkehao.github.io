
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Briefcase, Zap, ShieldCheck, 
  BarChart3, Plus, Sparkles, FileText, 
  CheckCircle2, Clock, TrendingUp, Users2, ArrowRight, Search, X,
  BrainCircuit, MessageCircleQuestion, Lightbulb, GraduationCap, ChevronLeft, Calendar,
  Download, Map, Send, Bot, User as UserIcon, Award, Globe, LineChart, Target, BookOpen, Lock, Mail, Github,
  Smartphone, ShieldEllipsis, MessageSquare, ExternalLink, Phone, MapPin, Share2, Loader2, Rocket, Terminal, Play, Square, Activity,
  Cpu, Coins, Fingerprint, Building2, Building, Layers, Eye, Compass, Info, Heart, LayoutDashboard, Settings, PieChart, CheckSquare, ListTodo, PenTool,
  History, Timer, ClipboardCheck, Filter, ChevronRight, ChevronDown, UserCircle2, Database, AlertCircle, Sparkle, Eraser, Milestone, Brain, Pin, Trash2, Edit3, Save, CreditCard, ArrowUpRight, TrendingDown, Wallet, Key, UserPlus, ShieldAlert, Laptop, Bell, Verified, Medal, Trophy, Landmark, CircleDollarSign, Gem, CreditCard as CreditCardIcon, Github as GithubIcon, MessageCircle, Tag, Instagram, Twitter, RotateCcw, GitBranch, ArrowRightCircle, Upload, Code, PlusCircle, Wand2, Link2, Linkedin, Gift, FileCheck
} from 'lucide-react';
import { analyzeResume, chatWithInterviewer } from './services/geminiService';
import { CandidateProfile, Job, SkillGap, AgentFeedback, AccountTier, TeamMember, CustomLLMConfig } from './types';
import RadarChart from './components/RadarChart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimelineItem {
  time: string;
  action: string;
  agent: string;
  tokens: number;
}

interface FlowData {
  id: number;
  candidate: string;
  candidateAvatar?: string;
  job: string;
  company: string;
  salary: string;
  location: string;
  tags: string[];
  description: string;
  status: string;
  matchScore: number;
  lastAction: string;
  nodes: string[];
  currentStep: number;
  tokensConsumed: number;
  stage: string;
  nextAction: string;
  nextSchedule: string;
  agents: string[];
  details: string;
  timeline: TimelineItem[];
}

const MOCK_FLOW_DATA: FlowData[] = [
  { 
    id: 1, 
    candidate: '陈伟', 
    job: '高级 AI 工程师', 
    company: '得若智能科技',
    salary: '¥50k - ¥80k',
    location: '上海 (远程)',
    tags: ['生成式 AI', 'Python', '智能体协同'],
    description: '负责多智能体编排系统的核心研发，构建高效的人机协作工作流。',
    status: '面试中', 
    matchScore: 98, 
    lastAction: 'AI 面试实录生成', 
    nodes: ['解析', '对标', '初试', '复试'], 
    currentStep: 3,
    tokensConsumed: 45200,
    stage: '初试阶段',
    nextAction: '等待面试官反馈',
    nextSchedule: '2024-01-18 14:00',
    agents: ['简历解析智能体', '面试评估智能体'],
    details: '候选人已完成技术初试，AI 面试官生成了详细的面试评估报告，包括技术能力、项目经验、算法思维等多个维度的评分。目前等待企业面试官进行人工复核。',
    timeline: [
      { time: '2024-01-10 09:00', action: '简历解析完成', agent: '简历解析智能体', tokens: 5200 },
      { time: '2024-01-10 09:15', action: '多维画像构建', agent: '画像构建智能体', tokens: 3800 },
      { time: '2024-01-10 10:00', action: '岗位匹配分析', agent: '匹配评估智能体', tokens: 4500 },
      { time: '2024-01-11 14:00', action: 'AI 模拟面试', agent: '面试评估智能体', tokens: 12500 },
      { time: '2024-01-12 16:00', action: '面试实录生成', agent: '面试评估智能体', tokens: 8200 },
      { time: '2024-01-15 10:00', action: '进入初试阶段', agent: '路由调度智能体', tokens: 2100 },
    ]
  },
  { 
    id: 2, 
    candidate: '李芳', 
    job: '产品设计主管', 
    company: 'Nexus 创意实验室',
    salary: '¥40k - ¥65k',
    location: '北京',
    tags: ['Figma', 'UX 策略', '人机交互'],
    description: '塑造未来人机协作界面，引领设计团队创新。',
    status: '待审核', 
    matchScore: 82, 
    lastAction: '画像多维对比完成', 
    nodes: ['解析', '对标'], 
    currentStep: 2,
    tokensConsumed: 32100,
    stage: '对标阶段',
    nextAction: '等待 HR 确认对标结果',
    nextSchedule: '2024-01-17 11:00',
    agents: ['简历解析智能体', '市场分析智能体'],
    details: '候选人简历已解析完成，AI 完成了候选人与目标岗位的多维度对比分析。目前系统正在等待 HR 确认对标结果，以决定是否推进到下一阶段。',
    timeline: [
      { time: '2024-01-12 10:00', action: '简历解析完成', agent: '简历解析智能体', tokens: 4800 },
      { time: '2024-01-12 10:30', action: '市场薪资对标', agent: '市场分析智能体', tokens: 6200 },
      { time: '2024-01-12 14:00', action: '能力画像对比', agent: '画像构建智能体', tokens: 5500 },
      { time: '2024-01-13 09:00', action: '综合评估报告', agent: '匹配评估智能体', tokens: 4100 },
      { time: '2024-01-13 16:00', action: '待 HR 审核', agent: '路由调度智能体', tokens: 1500 },
    ]
  },
  { 
    id: 3, 
    candidate: '张强', 
    job: '后端架构师', 
    company: '得若智能科技',
    salary: '¥55k - ¥85k',
    location: '杭州',
    tags: ['分布式系统', 'Go', '微服务'],
    description: '设计并实现高可用的分布式服务架构。',
    status: '初筛成功', 
    matchScore: 75, 
    lastAction: 'Agent 路由分发成功', 
    nodes: ['解析'], 
    currentStep: 1,
    tokensConsumed: 18500,
    stage: '解析阶段',
    nextAction: '安排技术面试',
    nextSchedule: '2024-01-19 10:00',
    agents: ['简历解析智能体'],
    details: '候选人简历已成功解析并通过初筛。AI 完成了基础的能力评估，目前系统已将任务分配给对应的招聘流程，等待下一步技术面试的安排。',
    timeline: [
      { time: '2024-01-14 08:00', action: '简历上传', agent: '系统', tokens: 0 },
      { time: '2024-01-14 08:10', action: '简历解析完成', agent: '简历解析智能体', tokens: 6500 },
      { time: '2024-01-14 09:00', action: '初筛通过', agent: '筛选评估智能体', tokens: 4200 },
      { time: '2024-01-14 09:30', action: '路由分发成功', agent: '路由调度智能体', tokens: 2800 },
    ]
  },
  { 
    id: 4, 
    candidate: '王敏', 
    job: '算法研究员', 
    company: '得若智能科技',
    salary: '¥70k - ¥120k',
    location: '深圳',
    tags: ['大模型', 'NLP', '深度学习'],
    description: '从事大语言模型的研究与落地应用。',
    status: 'Offer', 
    matchScore: 94, 
    lastAction: '薪资自动对标通过', 
    nodes: ['解析', '对标', '初试', '复试'], 
    currentStep: 4,
    tokensConsumed: 78500,
    stage: '完成阶段',
    nextAction: '发放 Offer 通知',
    nextSchedule: '2024-01-20 09:00',
    agents: ['简历解析智能体', '面试评估智能体', '市场分析智能体', '路由调度智能体'],
    details: '候选人已完成所有面试流程，综合评估结果优秀。AI 自动完成了薪资对标分析，并生成了详细的 Offer 建议。目前等待企业发放正式 Offer。',
    timeline: [
      { time: '2024-01-08 10:00', action: '简历解析完成', agent: '简历解析智能体', tokens: 5800 },
      { time: '2024-01-08 11:00', action: '市场薪资对标', agent: '市场分析智能体', tokens: 7500 },
      { time: '2024-01-09 14:00', action: 'AI 初试完成', agent: '面试评估智能体', tokens: 15200 },
      { time: '2024-01-11 10:00', action: 'AI 复试完成', agent: '面试评估智能体', tokens: 18500 },
      { time: '2024-01-15 16:00', action: '综合评估完成', agent: '匹配评估智能体', tokens: 9500 },
      { time: '2024-01-16 14:00', action: '薪资对标通过', agent: '市场分析智能体', tokens: 6200 },
    ]
  },
  { 
    id: 5, 
    candidate: '赵磊', 
    job: '前端工程主管', 
    company: '极客科技',
    salary: '¥45k - ¥70k',
    location: '上海',
    tags: ['React', 'TypeScript', '工程化'],
    description: '带领前端团队构建下一代 Web 应用。',
    status: '评估中', 
    matchScore: 88, 
    lastAction: '代码逻辑扫描完成', 
    nodes: ['解析', '对标'], 
    currentStep: 2,
    tokensConsumed: 38400,
    stage: '对标阶段',
    nextAction: '完成技术能力评估',
    nextSchedule: '2024-01-18 09:00',
    agents: ['简历解析智能体', '技术评估智能体'],
    details: '候选人简历已解析完成，AI 正在进行深度的技术能力评估。代码逻辑扫描已完成，目前正在进行技术能力综合评估。',
    timeline: [
      { time: '2024-01-13 11:00', action: '简历解析完成', agent: '简历解析智能体', tokens: 5100 },
      { time: '2024-01-13 14:00', action: 'GitHub 项目扫描', agent: '技术评估智能体', tokens: 8900 },
      { time: '2024-01-14 10:00', action: '代码逻辑扫描', agent: '技术评估智能体', tokens: 11200 },
      { time: '2024-01-15 09:00', action: '技术能力画像', agent: '画像构建智能体', tokens: 7200 },
    ]
  },
  { 
    id: 6, 
    candidate: '孙倩', 
    job: '数据科学家', 
    company: '数据智能有限公司',
    salary: '¥35k - ¥60k',
    location: '北京',
    tags: ['Python', '机器学习', '数据分析'],
    description: '利用数据驱动业务增长，构建智能推荐系统。',
    status: '待约面', 
    matchScore: 91, 
    lastAction: '候选人意向确认', 
    nodes: ['解析', '对标', '初试'], 
    currentStep: 3,
    tokensConsumed: 52300,
    stage: '初试阶段',
    nextAction: '确认面试时间',
    nextSchedule: '2024-01-17 15:00',
    agents: ['简历解析智能体', '面试评估智能体', '沟通协调智能体'],
    details: '候选人已完成意向确认，AI 已与候选人沟通确认面试意愿。目前正在协调面试官时间，等待最终面试时间确认。',
    timeline: [
      { time: '2024-01-11 09:00', action: '简历解析完成', agent: '简历解析智能体', tokens: 4900 },
      { time: '2024-01-11 10:30', action: '市场薪资对标', agent: '市场分析智能体', tokens: 5800 },
      { time: '2024-01-12 14:00', action: 'AI 初试预约', agent: '沟通协调智能体', tokens: 4200 },
      { time: '2024-01-13 11:00', action: '候选人意向确认', agent: '沟通协调智能体', tokens: 2800 },
    ]
  },
];

// --- 模拟数据 ---
const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: '高级 AI 工程师',
    company: '得若智能科技',
    location: '上海 (远程)',
    salary: '¥50k - ¥80k',
    matchScore: 98,
    tags: ['生成式 AI', 'Python', '智能体协同'],
    description: '负责多智能体编排系统的核心研发。'
  },
  {
    id: '2',
    title: '产品设计主管',
    company: 'Nexus 创意实验室',
    location: '北京',
    salary: '¥40k - ¥65k',
    matchScore: 82,
    tags: ['Figma', 'UX 策略', '人机交互'],
    description: '塑造未来人机协作界面。'
  },
  {
    id: '3',
    title: '全栈开发专家 (Rust/React)',
    company: '得若智能科技',
    location: '杭州',
    salary: '¥45k - ¥70k',
    matchScore: 92,
    tags: ['Rust', '高性能计算', '前端工程化'],
    description: '打造极速响应的智能体交互终端。'
  },
  {
    id: '4',
    title: '大模型算法科学家',
    company: '得若智能科技',
    location: '深圳',
    salary: '¥70k - ¥120k',
    matchScore: 85,
    tags: ['NLP', 'Transformer', '模型微调'],
    description: '深耕垂域模型性能边界。'
  },
  {
    id: '5',
    title: 'AI 解决方案架构师',
    company: '得若智能科技',
    location: '全球远程',
    salary: '¥55k - ¥90k',
    matchScore: 88,
    tags: ['B端赋能', 'SAAS', '数字化转型'],
    description: '连接技术实现与商业落地。'
  },
  {
    id: '6',
    title: '资深 DevOps 工程师',
    company: '得若智能科技',
    location: '成都',
    salary: '¥35k - ¥55k',
    matchScore: 78,
    tags: ['K8s', '云原生', '智能运维'],
    description: '构建稳定的多智能体云端环境。'
  }
];

const RECOMMENDED_JOBS = [
  {
    id: 1,
    title: '高级前端工程师',
    company: '字节跳动',
    logo: '📱',
    location: '北京',
    salary: '40K-60K·16薪',
    match: 92,
    tags: ['React', 'TypeScript', '大厂'],
    aiIntro: '已为您匹配到 3 位该公司的面试官智能体，可提供模拟面试和内推机会'
  },
  {
    id: 2,
    title: '技术专家（前端方向）',
    company: '阿里巴巴',
    logo: '🛒',
    location: '杭州',
    salary: '45K-70K·15薪',
    match: 88,
    tags: ['Vue', '工程化', '团队管理'],
    aiIntro: '您的技术栈与该岗位高度匹配，AI 面试官可帮助您准备架构设计面试'
  },
  {
    id: 3,
    title: '资深前端开发工程师',
    company: '腾讯科技',
    logo: '💬',
    location: '深圳',
    salary: '35K-55K·14薪',
    match: 85,
    tags: ['React', '小程序', '性能优化'],
    aiIntro: '推荐开启 AI 职业规划模式，为您定制面试准备方案'
  },
  {
    id: 4,
    title: 'Web 前端架构师',
    company: '美团',
    logo: '🍜',
    location: '北京',
    salary: '50K-80K·15薪',
    match: 78,
    tags: ['架构设计', '性能优化', '团队建设'],
    aiIntro: '该岗位对架构能力要求较高，AI 导师可提供专项能力提升方案'
  }
];

const ENTERPRISE_MEMORIES = [
  { id: 1, type: '文化', content: '崇尚极客精神，扁平化管理，每两周一次技术内部分享。', date: '2024-05-10', importance: 'High', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 2, type: '技术', content: '核心架构基于 Go/Rust，前端偏好 React 生态，极其看重代码的可测试性。', date: '2024-05-12', importance: 'Medium', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  { id: 3, type: '要求', content: '寻找具有‘自驱动力’和‘全球化协同经验’的人才，有开源贡献背景者优先。', date: '2024-05-15', importance: 'High', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 4, type: '策略', content: '优先满足 100% 远程办公需求，重点考察候选人的异步沟通能力。', date: '2024-05-18', importance: 'Medium', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

const CANDIDATE_MEMORIES = [
  { id: 1, type: '技能', content: 'React 生态精通，TypeScript 严格模式实践者，追求代码可维护性。', date: '2024-05-10', importance: 'High', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  { id: 2, type: '经验', content: '5 年+ 前端架构经验，主导过多个百万级用户产品重构项目。', date: '2024-05-12', importance: 'Medium', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 3, type: '偏好', content: '倾向于扁平化文化团队，重视技术分享和持续学习氛围。', date: '2024-05-15', importance: 'High', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 4, type: '目标', content: '寻求 AI 方向转型机会，希望在智能体产品领域深耕。', date: '2024-05-18', importance: 'Medium', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
];

const MOCK_QUALIFICATIONS = [
  { id: 1, title: '国家高新技术企业', description: '连续三年获得认证，在 AI 算法领域拥有核心自主知识产权。', icon: Medal, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 2, title: 'ISO 27001 信息安全认证', description: '达到国际顶级数据安全标准，确保人才数据与企业机密万无一失。', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 3, title: '2023 年度最佳 AI 雇主', description: '由行业媒体评选，表彰我们在人机协作办公模式上的卓越创新。', icon: Trophy, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 4, title: '可信云服务认证', description: '我们的智能体部署环境经过严格的云计算合规与性能测试。', icon: Verified, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 5, title: '产学研合作基地', description: '与国内 Top 3 高校建立联合实验室，持续输送前沿 AI 研究成果。', icon: Landmark, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const MOCK_TOKEN_HISTORY = [
  { date: '2024-05-15', tokens: 42500, type: '简历解析', cost: '¥4.25' },
  { date: '2024-05-16', tokens: 89000, type: '多智能体面试', cost: '¥8.90' },
  { date: '2024-05-17', tokens: 12400, type: '画像调优', cost: '¥1.24' },
  { date: '2024-05-18', tokens: 56000, type: '简历解析', cost: '¥5.60' },
  { date: '2024-05-19', tokens: 92000, type: '多智能体面试', cost: '¥9.20' },
  { date: '2024-05-20', tokens: 15000, type: '全局路由', cost: '¥1.50' },
  { date: '2024-05-21', tokens: 34000, type: '简历解析', cost: '¥3.40' },
];

const MOCK_USAGE_CHART = [
  { name: '05-15', value: 42500 },
  { name: '05-16', value: 89000 },
  { name: '05-17', value: 12400 },
  { name: '05-18', value: 56000 },
  { name: '05-19', value: 92000 },
  { name: '05-20', value: 15000 },
  { name: '05-21', value: 34000 },
];

interface TodoItem {
  id: string;
  task: string;
  description: string;
  type: 'candidate' | 'employer' | 'system';
  icon: any;
  priority: 'High' | 'Medium' | 'Low';
  aiAdvice: string;
  source: 'user' | 'agent';
  createdAt?: string;
  dueDate?: string;
  steps?: { name: string; done: boolean }[];
  progress?: number;
}

const MOCK_TODOS: TodoItem[] = [
  { 
    id: 'todo1', 
    task: '设置个人职业画像 (完成度 0%)', 
    description: '通过上传简历并解析，构建您的多维能力雷达图。这是开启 AI 智能推荐的第一步，帮助我们的多智能体系统理解您的核心竞争力。',
    type: 'candidate', 
    icon: UserIcon,
    priority: 'High',
    aiAdvice: '系统检测到您最近在 Github 活跃频繁，建议同步开源项目经历，可提升画像完整度 25%。',
    source: 'agent',
    createdAt: '2024-01-15',
    dueDate: '2024-01-20',
    progress: 0,
    steps: [
      { name: '任务启动与初始化', done: true },
      { name: '核心信息收集', done: false },
      { name: 'AI 分析与建议', done: false },
      { name: '方案优化与确认', done: false },
    ]
  },
  { 
    id: 'todo2', 
    task: '完善企业品牌画像 (完成度 20%)', 
    description: '定义公司的技术栈偏好与团队文化。详尽的企业画像能显著降低 45% 的初期沟通成本，让 AI 猎头更精准地锁定目标。',
    type: 'employer', 
    icon: Building2,
    priority: 'Medium',
    aiAdvice: '增加关于"弹性办公"和"智能协同"的内容能有效吸引 A+ 级别的远程开发者。',
    source: 'user',
    createdAt: '2024-01-10',
    dueDate: '2024-01-25',
    progress: 20,
    steps: [
      { name: '基础信息填写', done: true },
      { name: '技术栈偏好设置', done: true },
      { name: '团队文化描述', done: false },
      { name: '薪资福利配置', done: false },
    ]
  },
  { 
    id: 'todo3', 
    task: '配置 AI 自动约面时间表', 
    description: '设置您的可用时间段。一旦人才与岗位匹配成功，AI 调度智能体将自动完成初步沟通并预定虚拟面试室。',
    type: 'system', 
    icon: Calendar,
    priority: 'Low',
    aiAdvice: '建议至少开放 3 个不同的工作时段，以应对不同时区人才的匹配需求。',
    source: 'agent',
    createdAt: '2024-01-16',
    dueDate: '2024-01-22',
    progress: 0,
    steps: [
      { name: '添加可用时间段', done: false },
      { name: '设置面试时长', done: false },
      { name: '配置面试官', done: false },
      { name: '测试预约流程', done: false },
    ]
  },
];

interface TalentInfo extends CandidateProfile {
  id: string;
  status: string;
  matchScore: number;
  tokensConsumed?: number;
  targetJobId?: string;
  recentActivity?: string;
  certifications?: {
    name: string;
    issuer: string;
    date: string;
    icon: any;
    color: string;
  }[];
  awards?: {
    name: string;
    org: string;
    year: string;
    description: string;
    icon: any;
    color: string;
  }[];
  credentials?: {
    name: string;
    authority: string;
    validUntil?: string;
    icon: any;
    color: string;
  }[];
}

const MOCK_TALENTS: TalentInfo[] = [
  {
    id: 't1',
    name: '陈伟',
    role: '高级全栈工程师',
    status: 'AI 初试中',
    matchScore: 96,
    tokensConsumed: 4250,
    targetJobId: '1',
    experienceYears: 8,
    summary: '资深互联网架构师，擅长分布式系统设计 with Generative AI。拥有深厚的大模型微调及 RAG 架构实操经验。',
    skills: ['React', 'Node.js', 'PyTorch', 'LangChain', 'Docker', 'K8s'],
    recentActivity: '刚刚完成 AI 压力面试，表现评级：A+',
    radarData: [
      { subject: '专业技能', value: 98 },
      { subject: '沟通能力', value: 85 },
      { subject: '问题解决', value: 95 },
      { subject: '领导力', value: 80 },
      { subject: '适应性', value: 90 },
      { subject: '技术深度', value: 97 },
    ],
    idealJobPersona: "倾向于在技术驱动型公司担任核心架构角色。偏好极简主义的工作流程，追求能够大规模落地 AI 智能体的复杂业务场景。",
    interviewQuestions: ["如何解决大规模并发下的模型推理延迟？", "描述一次你处理复杂分布式系统崩溃的经历。", "你对 AI Agent 协同工作的未来怎么看？"],
    optimizationSuggestions: ["增加在特定垂直行业的 LLM 应用案例。", "提升对于新型多模态模型的理解。", "加强对于云原生架构的深入掌握。"],
    certifications: [
      { name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', date: '2024-03', icon: Award, color: 'bg-amber-100 text-amber-600' },
      { name: 'Google Cloud Professional Data Engineer', issuer: 'Google Cloud', date: '2023-11', icon: Trophy, color: 'bg-blue-100 text-blue-600' },
      { name: 'Kubernetes Administrator (CKA)', issuer: 'CNCF', date: '2023-08', icon: ShieldCheck, color: 'bg-indigo-100 text-indigo-600' },
    ],
    awards: [
      { name: '年度最佳架构师奖', org: '中国互联网协会', year: '2024', description: '优秀分布式系统设计能力表彰', icon: Trophy, color: 'bg-amber-100 text-amber-600' },
      { name: '开源杰出贡献者', org: 'Apache Foundation', year: '2023', description: 'Kubernetes 社区核心贡献者', icon: Medal, color: 'bg-red-100 text-red-600' },
    ],
    credentials: [
      { name: '信息系统安全专家 (CISP)', authority: '中国信息安全测评中心', validUntil: '2026-12', icon: Verified, color: 'bg-emerald-100 text-emerald-600' },
      { name: 'PMP 项目管理专业认证', authority: 'PMI', validUntil: '2025-06', icon: Award, color: 'bg-orange-100 text-orange-600' },
    ]
  },
  {
    id: 't2',
    name: '李芳',
    role: '产品设计专家',
    status: '简历筛选',
    matchScore: 89,
    tokensConsumed: 2840,
    targetJobId: '2',
    experienceYears: 6,
    summary: '具备敏锐的用户洞察力与超前的设计美学，擅长复杂 B端产品的交互设计与体验重塑。',
    skills: ['Figma', 'UI/UX', 'Strategy', 'Prototyping', 'User Research'],
    recentActivity: '简历解析完成，匹配分 89%，建议直接进入二面',
    radarData: [
      { subject: '专业技能', value: 90 },
      { subject: '沟通能力', value: 95 },
      { subject: '问题解决', value: 88 },
      { subject: '领导力', value: 75 },
      { subject: '适应性', value: 92 },
      { subject: '技术深度', value: 80 },
    ],
    idealJobPersona: "寻求充满创意激情的跨职能团队，偏好能够深度参与产品生命周期并主导用户体验策略的岗位。理想工作环境应具有高度的设计自由度和跨部门协作文化。",
    interviewQuestions: ["如何平衡设计美感与实际业务需求的冲突？", "分享一个你主导的从 0 到 1 的设计案例。", "你如何看待 AI 在 UI 设计流程中的替代作用？"],
    optimizationSuggestions: ["更多地展示设计决策背后的数据支撑。", "学习基础的前端交互代码实现。", "尝试跨领域的 C端设计尝试。"],
    certifications: [
      { name: 'Google UX Design Professional Certificate', issuer: 'Google', date: '2024-01', icon: Award, color: 'bg-blue-100 text-blue-600' },
      { name: 'Interaction Design Foundation Professional', issuer: 'IDEO', date: '2023-06', icon: Trophy, color: 'bg-pink-100 text-pink-600' },
    ],
    awards: [
      { name: '红点设计大奖', org: 'Design Zentrum Nordrhein Westfalen', year: '2023', description: '企业级 B2B SaaS 产品界面设计', icon: Medal, color: 'bg-red-100 text-red-600' },
    ],
    credentials: []
  }
];

// --- 业务组件 ---

const MockInterviewConsole = ({ questions, profile }: { questions: string[], profile: CandidateProfile }) => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: `你好 ${profile.name}，我是 Devnors AI 面试官。我已经审阅了你的简历。让我们开始吧。第一个问题：${questions[0]}` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);
    try {
      const history = messages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      const aiResponse = await chatWithInterviewer(history, userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-indigo-600 rounded-lg overflow-hidden border border-slate-800 flex flex-col h-[500px] shadow-2xl">
      <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-white font-bold text-sm tracking-wide">AI 模拟面试实录</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                {m.role === 'user' ? <UserIcon size={14} className="text-white" /> : <Bot size={14} className="text-indigo-400" />}
              </div>
              <div className={`px-4 py-3 rounded text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-slate-500 text-xs animate-pulse pl-12 font-mono font-black italic">AGENT IS THINKING...</div>}
      </div>
      <div className="p-4 bg-slate-800/30 border-t border-slate-800 flex gap-2">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-indigo-600 border border-slate-700 rounded px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" 
          placeholder="输入您的回答..."
        />
        <button onClick={handleSend} className="bg-indigo-600 text-white p-2 rounded flex items-center justify-center">
          <Send size={18}/>
        </button>
      </div>
    </div>
  );
};

// --- 基础布局组件 ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200/50 px-6 py-4">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <Link to="/" className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform active:scale-95">
          <Zap className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">Devnors <span className="text-indigo-600 text-sm font-normal">得若</span></span>
      </Link>
      <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
        <Link to="/ai-assistant" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 font-bold"><Bot size={16}/> AI助手</Link>
        <Link to="/workbench" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 font-bold"><LayoutDashboard size={16}/> 工作台</Link>
        <Link to="/candidate" className="hover:text-indigo-600 transition-colors">人才端</Link>
        <Link to="/employer" className="hover:text-indigo-600 transition-colors">企业端</Link>
      </div>
      <div className="flex items-center space-x-3">
        <Link to="/tokens" className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded border border-amber-200 transition-all group" title="Token 资产管理">
          <div className="p-1 bg-white rounded-lg shadow-sm group-hover:rotate-12 transition-transform">
             <CircleDollarSign size={14} className="text-amber-500" />
          </div>
          <span className="text-xs font-black">1.2M</span>
        </Link>
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        <Link to="/settings" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all" title="系统设置"><Settings size={18}/></Link>
        <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded text-sm font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all">登录</Link>
      </div>
    </div>
  </nav>
);

const LandingPage = () => (
  <div className="pt-20">
    <Hero />

    {/* 新增：核心社交证明板块 (Market Presence) */}
    <section className="py-16 px-6 -mt-10 mb-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-md p-10 md:p-16 border border-slate-100 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <Globe size={400} className="text-indigo-600" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
             <div className="text-center md:border-r border-slate-100">
                <div className="inline-flex p-3 bg-indigo-50 rounded text-indigo-600 mb-6"><Users size={32} /></div>
                <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">100万<span className="text-indigo-600">+</span></div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">全球储备人才</div>
             </div>
             <div className="text-center md:border-r border-slate-100">
                <div className="inline-flex p-3 bg-emerald-50 rounded text-emerald-600 mb-6"><Building2 size={32} /></div>
                <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">2万<span className="text-emerald-600">+</span></div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">活跃入驻企业</div>
             </div>
             <div className="text-center">
                <div className="inline-flex p-3 bg-rose-50 rounded text-rose-600 mb-6"><Sparkles size={32} /></div>
                <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">500万<span className="text-rose-600">+</span></div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI 智能成功对接</div>
             </div>
           </div>
        </div>
      </div>
    </section>

    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={Zap}
          title="智能体全流程自治"
          description="首创“智能体原生”模式，简历自投递、岗位自推荐、面试自调度，实现双向自动化。"
        />
        <FeatureCard 
          icon={BarChart3}
          title="多模态人才评估"
          description="融合微表情分析、语音情感与文本逻辑，构建六维动态能力雷达图，一致率高达 90.1%。"
        />
        <FeatureCard 
          icon={ShieldCheck}
          title="抗偏见公平算法"
          description="通过对抗性去偏技术消除潜在歧视，确保招聘回归能力本质，提升 45% 的招聘公平性。"
        />
      </div>
    </section>
    
    <section className="py-24 px-6 bg-indigo-600/5 border-y border-indigo-100/50">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-16 text-slate-900">量化效率标杆</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: '效率跨越式提升', value: '578%' },
            { label: '匹配精度', value: '82%' },
            { label: 'HR 人力成本降低', value: '70%' },
            { label: '招聘周期', value: '< 48h' },
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-white rounded border border-indigo-50/50 card-shadow">
              <div className="text-5xl font-extrabold text-indigo-600 mb-2">{stat.value}</div>
              <div className="text-slate-500 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const Hero = () => (
  <section className="pt-32 pb-20 px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto text-center relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] -z-10 rounded-full"></div>
      <div className="inline-flex items-center space-x-2 bg-indigo-50/80 border border-indigo-100 px-4 py-1.5 rounded-full text-indigo-600 text-sm font-medium mb-8">
        <Sparkles size={14} />
        <span>效率提升 578%：多智能体驱动招聘新纪元</span>
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-slate-900 tracking-tight">
        重塑 <span className="gradient-text">AI 驱动</span> 的 <br />
        人才招聘新范式
      </h1>
      <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
        从“人岗匹配”到“智能体自主协同”。Devnors 部署多智能体系统（MAS），
        实现从简历深度解析、多模态评估到面试自调度的全链路闭环。
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Link to="/candidate" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-indigo-200">
          <span>作为人才加入</span>
          <ArrowRight size={18} />
        </Link>
        <Link to="/employer" className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded font-bold hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 shadow-sm">
          <span>企业开始招聘</span>
          <Briefcase size={18} />
        </Link>
      </div>
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="bg-white p-8 rounded hover:translate-y-[-4px] transition-all border border-slate-100 card-shadow group">
    <div className="w-12 h-12 bg-indigo-50 rounded flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
      <Icon className="text-indigo-600 w-6 h-6 group-hover:text-white transition-colors" />
    </div>
    <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </div>
);

// --- 设置与管理页面 ---
const SettingsManagementView = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'General' | 'Account' | 'AIEngine' | 'API' | 'Team' | 'Audit'>('General');
  const [accountTier, setAccountTier] = useState<AccountTier>('Professional');
  const isEmployer = true; // 模拟当前为企业身份

  const teamMembers: TeamMember[] = [
    { id: 'm1', name: '王经理', email: 'wang@devnors.com', role: 'Admin', status: 'Active' },
    { id: 'm2', name: '李猎头', email: 'li@devnors.com', role: 'Recruiter', status: 'Active' },
    { id: 'm3', name: '陈助理', email: 'chen@devnors.com', role: 'Viewer', status: 'Invited' },
  ];

  const llmConfigs: CustomLLMConfig[] = [
    { task: '简历语义解析', modelName: 'Gemini 3 Pro', provider: 'Google' },
    { task: '多智能体联席面试', modelName: 'GPT-4o', provider: 'OpenAI' },
    { task: '全局机会路由', modelName: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  ];

  const navItems = [
    { id: 'General', label: '基础信息', icon: UserCircle2 },
    { id: 'Account', label: '账户等级', icon: Award },
    { id: 'AIEngine', label: 'AI 引擎配置', icon: Cpu },
    { id: 'API', label: 'API 与集成', icon: Key },
    ...(isEmployer ? [{ id: 'Team', label: '人员与权限', icon: Users2 }] : []),
    { id: 'Audit', label: '安全审计日志', icon: Laptop },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'General':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">基础信息设置</h3>
            <div className="bg-white rounded-lg p-10 border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">显示名称 / 企业全称</label>
                  <input type="text" defaultValue="得若智能科技" className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">管理联系邮箱</label>
                  <input type="email" defaultValue="admin@devnors.com" className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
              <div className="p-6 bg-indigo-50 rounded border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2"><Bell size={16}/> 智能消息推送</h4>
                    <p className="text-xs text-indigo-700/70 mt-1 font-medium">当智能体完成简历初筛或约面成功时，通过邮件即时通知。</p>
                  </div>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button className="bg-indigo-600 text-white px-8 py-3.5 rounded font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-2">
                  <Save size={18} /> 保存更改信息
                </button>
              </div>
            </div>
          </div>
        );
      case 'Account':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">账户等级与特权</h3>
            <div className="bg-white rounded p-10 border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-full md:w-1/3 bg-indigo-600 rounded p-8 text-white relative overflow-hidden">
                  <Zap className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
                  <div className="text-xs font-black uppercase text-indigo-200 mb-4">当前方案</div>
                  <div className="text-4xl font-black mb-2">{accountTier}</div>
                  <p className="text-slate-400 text-xs font-medium mb-8">适用于中型以上规模的 AI 驱动团队</p>
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-black transition-all">续费当前套餐</button>
                </div>
                <div className="flex-1 space-y-6">
                  <h4 className="text-lg font-black">包含的核心特权</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['无限制简历结构化解析', '自定义多 LLM 用户路由策略', 'API 对外调用权限', '团队成员无限制协作', '专属智能体部署通道', '24/7 技术专家支持'].map((p, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" /> {p}
                      </div>
                    ))}
                  </div>
                  <div className="pt-6">
                    <button 
                      onClick={() => navigate('/pricing')}
                      className="bg-indigo-600 text-white px-8 py-4 rounded font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      升级到 Enterprise 旗舰版 <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'AIEngine':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">AI 任务引擎自定义</h3>
            <p className="text-slate-500 font-medium -mt-4">根据不同招聘任务的复杂度和成本，灵活配置底层大语言模型驱动。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {llmConfigs.map((config, i) => (
                <div key={i} className="p-8 bg-white rounded border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{config.task}</div>
                        <div className="text-xl font-black text-slate-900">{config.modelName}</div>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded text-indigo-600"><Bot size={20} /></div>
                   </div>
                   <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <span className="text-xs font-black text-slate-400 uppercase">Provider: <span className="text-indigo-600 ml-1">{config.provider}</span></span>
                      <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                   </div>
                </div>
              ))}
              <button className="border-2 border-dashed border-slate-200 rounded p-8 flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-indigo-200 transition-all group">
                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all"><Plus size={24} /></div>
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">添加自定义任务映射</span>
              </button>
            </div>
          </div>
        );
      case 'API':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-slate-900">API 与 Webhooks 集成</h3>
                <p className="text-slate-500 font-medium mt-1">将 Devnors 智能招聘能力深度嵌入您的业务流程中。</p>
              </div>
              <button className="bg-indigo-600 text-white px-6 py-2.5 rounded font-black text-xs">查看 API 文档</button>
            </div>
            <div className="space-y-6">
              <div className="bg-indigo-600 rounded p-8 text-white shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Key size={140} /></div>
                 <div className="relative z-10">
                    <div className="text-xs font-black uppercase text-white mb-4 tracking-widest flex items-center gap-2">
                       <ShieldCheck size={12} /> Production Environment Key
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                       <div className="flex-1 bg-white/5 border border-white/10 rounded px-6 py-4 font-mono text-lg tracking-tighter text-white truncate w-full">
                          devnors_sk_live_f7a8b9c0d1e2f3g4h5i6j7k8l9m0
                       </div>
                       <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded font-black text-sm transition-all whitespace-nowrap">
                          复制 API Key
                       </button>
                    </div>
                    <p className="mt-6 text-xs text-indigo-200 font-medium">请妥善保管您的密钥。如发生泄露，请立即重新生成。</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-8 border border-slate-100 shadow-sm">
                   <h4 className="text-base font-black text-slate-900 mb-2">事件通知 Webhooks</h4>
                   <p className="text-xs text-slate-500 font-medium mb-6">当系统内发生关键招聘节点变化时（如面试通过），主动向您的服务器发送数据。</p>
                   <button className="w-full py-3 bg-slate-50 border border-slate-200 rounded text-xs font-black text-slate-600 hover:bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all">
                      配置 Webhook 端点
                   </button>
                </div>
                <div className="bg-white rounded-lg p-8 border border-slate-100 shadow-sm">
                   <h4 className="text-base font-black text-slate-900 mb-2">结构化数据导出 API</h4>
                   <p className="text-xs text-slate-500 font-medium mb-6">通过 REST 接口获取已解析的人才画像数据，支持 JSON/PDF 格式流式导出。</p>
                   <button className="w-full py-3 bg-slate-50 border border-slate-200 rounded text-xs font-black text-slate-600 hover:bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all">
                      生成临时访问令牌
                   </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Team':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">团队成员与权限控制</h3>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                <UserPlus size={18} /> 邀请新成员
              </button>
            </div>
            <div className="bg-white rounded border border-slate-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-50 text-xs uppercase font-black tracking-widest text-slate-400">
                           <th className="py-4 pl-10">成员信息</th>
                           <th className="py-4">角色</th>
                           <th className="py-4">最近活跃</th>
                           <th className="py-4 text-right pr-10">管理操作</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {teamMembers.map((member) => (
                          <tr key={member.id} className="group hover:bg-slate-50/30 transition-colors">
                             <td className="py-6 pl-10">
                                <div className="flex items-center gap-4">
                                   <div className="w-11 h-11 rounded bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200">{member.name.charAt(0)}</div>
                                   <div>
                                      <div className="text-sm font-black text-slate-900">{member.name}</div>
                                      <div className="text-xs text-slate-400 font-medium">{member.email}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-6">
                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                                   member.role === 'Admin' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                                }`}>
                                   {member.role}
                                </span>
                             </td>
                             <td className="py-6">
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                   <span className="text-xs font-bold text-slate-600">3 小时前活跃</span>
                                </div>
                             </td>
                             <td className="py-6 text-right pr-10">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ShieldAlert size={18} /></button>
                                   <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        );
      case 'Audit':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">系统操作审计日志</h3>
            <div className="bg-white rounded p-10 border border-slate-100 shadow-sm space-y-6">
               <div className="flex items-center gap-6 p-6 bg-slate-50 rounded border border-slate-100">
                  <div className="w-14 h-14 bg-white rounded flex items-center justify-center shadow-sm text-slate-400"><Laptop size={24} /></div>
                  <div className="flex-1">
                     <h4 className="text-base font-black text-slate-900">安全性监控</h4>
                     <p className="text-sm text-slate-500 font-medium mt-1">您可以查看并监控平台内所有成员、智能体以及 API 的调用足迹，确保招聘过程 100% 合规与可溯源。</p>
                  </div>
               </div>
               <div className="space-y-4">
                  {[
                    { action: 'API Key 被用于导出简历', user: 'System Bot', time: '10分钟前', ip: '192.168.1.1' },
                    { action: '账户设置被修改: 联系邮箱', user: '王经理', time: '2小时前', ip: '172.16.0.42' },
                    { action: '新成员被邀请加入团队', user: '王经理', time: '1天前', ip: '172.16.0.42' },
                  ].map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 px-4 group hover:bg-slate-50 transition-colors rounded">
                       <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                             <div className="text-xs font-black text-slate-900">{log.action}</div>
                             <span className="text-xs font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded">BY {log.user}</span>
                          </div>
                          <div className="flex items-center gap-6 text-xs font-bold text-slate-400">
                             <span>IP: {log.ip}</span>
                             <span>{log.time}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-4 py-3 bg-indigo-600 text-white font-black text-sm rounded active:scale-95 transition-all">
                  下载完整审计历史 (.CSV)
               </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
      <div className="mb-12">
         <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
           <div className="p-3 bg-indigo-600 text-white rounded shadow-xl"><Settings size={32} /></div>
           系统设置
         </h1>
         <p className="text-slate-500 font-medium mt-2">在这里个性化您的智能招聘体验，管理底层引擎与团队权限</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* 左侧导航菜单 */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-2 sticky top-28">
           <div className="bg-white rounded p-4 border border-slate-100 shadow-sm space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded font-black text-sm transition-all group ${
                    activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-2' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <item.icon size={20} className={`${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} transition-colors`} />
                  {item.label}
                  {activeTab === item.id && <ChevronRight size={16} className="ml-auto animate-pulse" />}
                </button>
              ))}
           </div>
           
           <div className="p-8 bg-white rounded-md text-slate-900 relative overflow-hidden mt-6 border border-slate-100 shadow-lg">
              <Sparkle className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-600/5" />
              <div className="text-xs font-black uppercase text-indigo-600 mb-3 tracking-widest">系统状态</div>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-sm font-black uppercase tracking-tighter text-slate-900">MAS Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">“多智能体系统运行良好，所有设置映射已同步至边缘节点。”</p>
           </div>
        </aside>

        {/* 右侧功能内容区 */}
        <main className="flex-1 w-full min-w-0">
           <div className="relative">
              {renderContent()}
           </div>
        </main>
      </div>
    </div>
  );
};

// --- Token 与资金管理页面 ---
const TokenManagementView = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(1245000); // 1.2M tokens
  const [rechargeAmount, setRechargeAmount] = useState<number | null>(null);

  const packages = [
    { name: '入门体验', tokens: '100,000', price: 99, discount: null, accent: 'bg-indigo-50' },
    { name: '精英猎聘', tokens: '1,000,000', price: 799, discount: '性价比最高', accent: 'bg-amber-50' },
    { name: '企业旗舰', tokens: '10,000,000', price: 6999, discount: '-20%', accent: 'bg-rose-50' },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors">
        <ChevronLeft size={20} /> 返回
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-4">
             <div className="p-3 bg-amber-500 text-white rounded shadow-xl"><CircleDollarSign size={28}/></div>
             资金账户
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">管理多智能体协作所需的 Token 燃料与账户资金</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-indigo-600 text-white px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all">
             <Download size={18}/> 下载月度对账单
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg p-10 text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-110 transition-transform"><Gem size={140} /></div>
           <div className="relative z-10">
             <div className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div> 可用 Token 余额
             </div>
             <div className="text-6xl font-black mb-6 tracking-tighter">{(balance/1000000).toFixed(2)}M</div>
             <div className="flex items-center gap-2 text-indigo-100 font-bold text-sm bg-black/10 px-4 py-2 rounded-full w-fit">
                <Clock size={16} /> 预计可续航 <span className="text-amber-400 ml-1">42 天</span>
             </div>
           </div>
        </div>
        
        <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow flex flex-col justify-between group">
           <div>
             <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">今日智能体负载消耗</div>
             <div className="text-4xl font-black text-slate-900 flex items-baseline gap-2">
               42,500 <span className="text-sm font-bold text-slate-300 uppercase tracking-tighter">Tokens</span>
             </div>
           </div>
           <div className="mt-8 flex items-center gap-2 text-rose-500 font-black text-sm bg-rose-50 px-4 py-1.5 rounded-full w-fit">
             <TrendingUp size={16} /> 消耗环比上升 12.5%
           </div>
        </div>

        <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow flex flex-col justify-between">
           <div>
             <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">账户累计充值</div>
             <div className="text-4xl font-black text-slate-900 tracking-tight">¥ 12,450.00</div>
           </div>
           <div className="mt-8">
              <button className="text-indigo-600 font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">
                管理支付方式 <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
           {/* 消耗趋势图 */}
           <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                   <Activity className="text-indigo-600" /> Token 资源消耗分布 (近 7 日)
                 </h3>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg uppercase">峰值: 92k</span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-xs font-black rounded-lg uppercase">均值: 45k</span>
                 </div>
              </div>
              <div className="h-[320px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={MOCK_USAGE_CHART}>
                     <defs>
                       <linearGradient id="colorValue" x1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                     <Tooltip 
                       contentStyle={{backgroundColor: '#0f172a', borderRadius: '20px', border: 'none', color: '#fff', padding: '12px'}}
                       itemStyle={{color: '#818cf8', fontWeight: 900}}
                       cursor={{stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5'}}
                     />
                     <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" animationDuration={2000} />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* 消耗详情 */}
           <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow overflow-hidden">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <History className="text-indigo-600" /> 数字能源消耗流水 (Transaction Logs)
              </h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-50 text-xs uppercase font-black tracking-widest text-slate-400">
                          <th className="pb-4 pl-2">发生时间</th>
                          <th className="pb-4">操作类型</th>
                          <th className="pb-4 text-center">Token 消耗</th>
                          <th className="pb-4 text-right pr-2">费用参考</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {MOCK_TOKEN_HISTORY.map((h, i) => (
                         <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 pl-2 text-sm font-bold text-slate-500">{h.date}</td>
                            <td className="py-5">
                               <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg uppercase tracking-tight">{h.type}</span>
                            </td>
                            <td className="py-5 text-center text-sm font-black text-slate-900">{h.tokens.toLocaleString()}</td>
                            <td className="py-5 text-right text-sm font-black text-slate-900 pr-2">{h.cost}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <button className="w-full mt-6 py-4 text-xs font-black text-slate-400 border border-dashed border-slate-200 rounded hover:bg-slate-50 transition-all uppercase tracking-widest">
                加载更多历史记录
              </button>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           {/* 充值面板 */}
           <div className="bg-indigo-900 rounded-lg p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><CreditCardIcon size={120} /></div>
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                 <Plus size={20} className="text-indigo-400" /> 快速储备能源
              </h3>
              <div className="space-y-4 relative z-10">
                 {packages.map((pkg, i) => (
                    <div 
                      key={i} 
                      onClick={() => setRechargeAmount(pkg.price)}
                      className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${rechargeAmount === pkg.price ? 'bg-indigo-600 border-indigo-400 shadow-xl scale-[1.02]' : 'bg-white/5 border-white/10 hover:border-indigo-500/50 group'}`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <div className={`text-xs font-black uppercase ${rechargeAmount === pkg.price ? 'text-indigo-200' : 'text-slate-500'}`}>{pkg.name}</div>
                          {pkg.discount && <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded uppercase">{pkg.discount}</span>}
                       </div>
                       <div className="text-3xl font-black mb-1">{pkg.tokens} <span className="text-xs font-bold opacity-40">Tokens</span></div>
                       <div className="text-sm font-medium opacity-60">¥ {pkg.price}</div>
                    </div>
                 ))}
              </div>
              <button className="w-full mt-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 group">
                 <CreditCardIcon size={20} className="group-hover:rotate-12 transition-transform" /> 立即确认支付
              </button>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs font-black text-slate-500 uppercase tracking-widest">
                 <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> 安全盾保</span>
                 <span className="flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> 即时充入</span>
              </div>
           </div>

           {/* 智能分析 */}
           <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center"><Bot size={20} className="text-indigo-600" /></div>
                 <h3 className="text-lg font-black text-slate-900 leading-tight">AI 负载预估</h3>
              </div>
              <div className="p-5 bg-slate-50 rounded-lg border border-slate-100 italic text-[11px] leading-relaxed text-slate-600">
                “系统分析显示您的招聘频率正在上升。建议在下一次人才搜索高峰前，升级为‘精英猎聘’套餐，可额外获得 15% 的智能体优先响应权重。”
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 工作台页面 ---
const WorkbenchView = () => {
  const navigate = useNavigate();
  
  // 增强后的匹配流数据
  const matchingData = MOCK_FLOW_DATA;

  const tokenStats = [
    { agent: '简历解析智能体', tokens: '420,500', share: '35%' },
    { agent: '面试评估智能体', tokens: '312,200', share: '26%' },
    { agent: '市场分析智能体', tokens: '288,400', share: '24%' },
    { agent: '路由调度智能体', tokens: '180,900', share: '15%' },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">智能工作台</h1>
          <p className="text-slate-500 font-medium">由 Devnors MAS 多智能体系统驱动的全局招聘概览</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/invite')}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Users2 size={20} className="text-emerald-500" /> 邀请
          </button>
          <button 
            onClick={() => navigate('/tokens')}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <CircleDollarSign size={20} className="text-amber-500" /> 资金账户
          </button>
          <button 
            onClick={() => navigate(`/workbench/todo/${MOCK_TODOS[0].id}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            <Bot size={20} /> AI助手
          </button>
        </div>
      </div>

      <div className="mb-10 bg-white p-8 rounded-lg border border-slate-100 card-shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <ListTodo className="text-indigo-600" /> 任务中心
          </h2>
          <button 
            onClick={() => navigate('/workbench/todos')}
            className="flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            查看全部 <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_TODOS.map((todo) => (
            <div 
              key={todo.id} 
              onClick={() => navigate(`/workbench/todo/${todo.id}`)}
              className="group cursor-pointer p-6 bg-slate-50 rounded border border-slate-100 flex items-center gap-4 hover:bg-white hover:border-indigo-200 transition-all"
            >
              <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-indigo-600 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <todo.icon size={20} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  {todo.priority === 'High' ? '核心任务' : todo.priority === 'Medium' ? '常规任务' : '建议任务'}
                </div>
                <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">{todo.task}</div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-8">
          <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Activity className="text-indigo-600" size={24} /> AI对接队列
              </h2>
              <div className="flex gap-2">
                 <span className="flex items-center gap-1 text-xs font-black text-slate-400 uppercase"><div className="w-2 h-2 rounded-full bg-indigo-600"></div> 已完成</span>
                 <span className="flex items-center gap-1 text-xs font-black text-slate-400 uppercase"><div className="w-2 h-2 rounded-full bg-slate-200"></div> 待执行</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-50 text-xs uppercase font-black tracking-widest text-slate-400">
                    <th className="pb-4 pl-2">候选人与目标岗位</th>
                    <th className="pb-4 text-center">匹配分</th>
                    <th className="pb-4">薪资范围</th>
                    <th className="pb-4">核心节点进度</th>
                    <th className="pb-4">最新 AI 动作</th>
                    <th className="pb-4 text-right pr-2">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {matchingData.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => navigate(`/workbench/flow/${item.id}`)}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-5 pl-2">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-indigo-50">
                             {item.candidate.charAt(0)}
                           </div>
                           <div>
                             <div className="font-black text-slate-900 text-sm">{item.candidate}</div>
                             <div className="text-xs font-bold text-indigo-600 mt-0.5">{item.company}</div>
                             <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                               <Briefcase size={10} /> {item.job}
                             </div>
                           </div>
                        </div>
                      </td>
                      <td className="py-5">
                         <div className="flex flex-col items-center gap-1">
                           <div className={`px-3 py-1 rounded-full text-[11px] font-black shadow-sm ${item.matchScore >= 90 ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                             {item.matchScore}%
                           </div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase">Confidence</div>
                         </div>
                      </td>
                      <td className="py-5">
                        <div className="text-sm font-bold text-slate-700">{item.salary}</div>
                      </td>
                      <td className="py-5">
                         <div className="flex items-center gap-2">
                            {['解析', '对标', '初试', '复试'].map((node, nIdx) => (
                              <div key={nIdx} className="flex items-center">
                                <div 
                                  className={`w-2 h-2 rounded-full transition-all duration-500 ${nIdx < item.currentStep ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                  title={node}
                                ></div>
                                {nIdx < 3 && <div className={`w-4 h-0.5 ${nIdx < item.currentStep - 1 ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>}
                              </div>
                            ))}
                            <span className="ml-2 text-xs font-bold text-slate-500">{item.nodes[item.currentStep - 1]}</span>
                         </div>
                      </td>
                      <td className="py-5">
                         <div className="flex items-center gap-2">
                            <Bot size={12} className="text-indigo-400" />
                            <span className="text-xs text-slate-600 font-medium italic">“{item.lastAction}”</span>
                         </div>
                      </td>
                      <td className="py-5 text-right pr-2">
                         <div className="flex flex-col items-end gap-1">
                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                              item.status === '面试中' ? 'bg-blue-50 text-blue-600' : 
                              item.status === 'Offer' ? 'bg-emerald-50 text-emerald-600' : 
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {item.status}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">实时更新中</span>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><PieChart className="text-amber-500" size={20} /> 智能体资源 Token 消耗全景</h3>
             <button onClick={() => navigate('/tokens')} className="text-xs font-black text-indigo-600 hover:underline">资金账户详情</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {tokenStats.map((item, i) => (
              <div key={i} className="space-y-4 p-6 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">{item.agent}</span>
                  <span className="text-indigo-600 font-black text-sm">{item.share}</span>
                </div>
                <div className="text-xl font-black text-slate-900">{item.tokens}</div>
                <div className="relative h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${i % 2 === 0 ? 'bg-indigo-600' : 'bg-emerald-500'}`} style={{ width: item.share }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 待办事项列表页 ---
const TodoListView = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'user' | 'agent'>('all');
  
  const filteredTodos = useMemo(() => {
    if (filter === 'all') return MOCK_TODOS;
    return MOCK_TODOS.filter(todo => todo.source === filter);
  }, [filter]);

  const stats = useMemo(() => ({
    total: MOCK_TODOS.length,
    userCreated: MOCK_TODOS.filter(t => t.source === 'user').length,
    agentAssigned: MOCK_TODOS.filter(t => t.source === 'agent').length,
    completed: MOCK_TODOS.filter(t => (t.progress || 0) === 100).length,
  }), []);

  return (
    <div className="pt-32 pb-20 px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => navigate('/workbench')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors">
        <ChevronLeft size={20} /> 返回工作台
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">待办事项</h1>
        <p className="text-slate-500 font-medium">管理您所有的任务，包括 Agent 分发和自行创建的任务</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded p-6 border border-slate-100 shadow-lg">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">全部任务</div>
          <div className="text-3xl font-black text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">共 {stats.total} 个任务</div>
        </div>
        <div className="bg-white rounded p-6 border border-slate-100 shadow-lg">
          <div className="text-xs font-black uppercase tracking-widest text-purple-400 mb-2">Agent 分发</div>
          <div className="text-3xl font-black text-purple-600">{stats.agentAssigned}</div>
          <div className="text-xs text-slate-400 mt-1">系统智能推荐</div>
        </div>
        <div className="bg-white rounded p-6 border border-slate-100 shadow-lg">
          <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">我创建的</div>
          <div className="text-3xl font-black text-emerald-600">{stats.userCreated}</div>
          <div className="text-xs text-slate-400 mt-1">手动添加任务</div>
        </div>
        <div className="bg-white rounded p-6 border border-slate-100 shadow-lg">
          <div className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2">已完成</div>
          <div className="text-3xl font-black text-amber-600">{stats.completed}</div>
          <div className="text-xs text-slate-400 mt-1">完成度 100%</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${
            filter === 'all' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          全部
        </button>
        <button 
          onClick={() => setFilter('agent')}
          className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${
            filter === 'agent' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          🤖 Agent 分发
        </button>
        <button 
          onClick={() => setFilter('user')}
          className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${
            filter === 'user' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          👤 我创建的
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredTodos.map((todo) => (
          <div 
            key={todo.id}
            onClick={() => navigate(`/workbench/todo/${todo.id}`)}
            className="group bg-white rounded p-6 border border-slate-100 shadow-lg hover:shadow-xl hover:border-indigo-200 cursor-pointer transition-all animate-in fade-in slide-in-from-bottom-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <todo.icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{todo.task}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
                      todo.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                      todo.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {todo.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
                      todo.source === 'agent' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {todo.source === 'agent' ? 'Agent' : '我创建'}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {todo.type === 'candidate' ? '人才端' : todo.type === 'employer' ? '企业端' : '系统'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-indigo-600">{todo.progress || 0}%</div>
                <div className="text-xs font-bold text-slate-400">完成度</div>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4 line-clamp-2">{todo.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {todo.dueDate ? `截止: ${todo.dueDate}` : todo.createdAt}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-indigo-600 group-hover:translate-x-1 transition-transform">
                查看详情 <ArrowRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTodos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">暂无任务</h3>
          <p className="text-slate-500 font-medium">没有找到符合条件的待办事项</p>
        </div>
      )}
    </div>
  );
};

// --- 待办事项详情页 ---
const TodoDetailView = () => {
  const { todoId } = useParams();
  const navigate = useNavigate();
  const todo = useMemo(() => MOCK_TODOS.find(t => t.id === todoId), [todoId]);
  
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todo) {
      setMessages([
        { role: 'ai', text: `你好！我是 Devnors 任务执行助手。关于“${todo.task}”这项任务，我已经准备好了。${todo.aiAdvice} 你准备好开始了吗？或者有什么具体的执行细节需要我协助？` }
      ]);
    }
  }, [todo]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);
    try {
      // 模拟任务执行智能体的对话
      const history = messages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      const aiResponse = await chatWithInterviewer(history, `当前任务是：${todo?.task}。用户说：${userMsg}`);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!todo) return (
    <div className="pt-40 text-center">
       <AlertCircle className="mx-auto text-slate-300 mb-4" size={64} />
       <p className="text-slate-500 font-black">待办任务不存在或已被移除</p>
       <button onClick={() => navigate('/workbench')} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded font-black">返回工作台</button>
    </div>
  );

  return (
    <div className="pt-32 pb-20 px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => navigate('/ai-assistant')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors">
        <ChevronLeft size={20} /> 返回AI助手
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
             <div className="flex items-center justify-between mb-5">
               <div className="w-14 h-14 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <todo.icon size={28} />
               </div>
               <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                 todo.source === 'agent' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
               }`}>
                 {todo.source === 'agent' ? '🤖 Agent' : '👤 我创建'}
               </div>
             </div>
             <div className="flex items-center gap-2 mb-3">
               <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                 todo.priority === 'High' ? 'bg-rose-50 text-rose-600' : todo.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
               }`}>
                 {todo.priority} Priority
               </span>
               <span className="text-xs font-medium text-slate-400">
                 {todo.type === 'candidate' ? '人才端' : todo.type === 'employer' ? '企业端' : '系统'}
               </span>
             </div>
             <h1 className="text-xl font-black text-slate-900 mb-3 leading-tight">{todo.task}</h1>
             <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4">{todo.description}</p>
             <div className="flex items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-50">
               <div className="flex items-center gap-1">
                 <Calendar size={12} />
                 <span>{todo.dueDate ? `截止: ${todo.dueDate}` : `创建: ${todo.createdAt}`}</span>
               </div>
             </div>
          </div>
          
          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <CheckSquare size={16} className="text-indigo-600" /> 任务进度
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>完成度</span>
                  <span className="font-black text-indigo-600">{todo.progress || 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${todo.progress || 0}%` }}></div>
                </div>
              </div>
              <div className="space-y-3">
                {(todo.steps || [
                  { step: 1, name: '任务启动与初始化', done: true },
                  { step: 2, name: '核心信息收集', done: false },
                  { step: 3, name: 'AI 分析与建议', done: false },
                  { step: 4, name: '方案优化与确认', done: false },
                ]).map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black ${
                      s.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.done ? <CheckCircle2 size={12} /> : idx + 1}
                    </div>
                    <span className={`text-xs font-medium ${s.done ? 'text-slate-900' : 'text-slate-400'}`}>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
           <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex flex-col h-[700px] shadow-2xl relative">
              <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 backdrop-blur-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-black text-sm tracking-wide uppercase">AI 任务执行助手</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">模型: Gemini 3 Pro</span>
                  <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="重置对话">
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
              
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-slate-900">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 shadow-lg ${m.role === 'user' ? 'bg-indigo-600' : 'bg-indigo-800 border border-indigo-700'}`}>
                        {m.role === 'user' ? <UserIcon size={18} className="text-white" /> : <Bot size={18} className="text-indigo-400" />}
                      </div>
                      <div className={`px-5 py-4 rounded-md text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-indigo-700/90 text-white rounded-tl-none border border-indigo-600 backdrop-blur-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-4 animate-in fade-in">
                    <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center border border-slate-600">
                      <Loader2 className="animate-spin text-indigo-400" size={18} />
                    </div>
                    <div className="px-5 py-4 bg-slate-700/50 rounded-md rounded-tl-none border border-slate-600">
                      <span className="text-white font-mono text-xs italic">正在分析任务上下文并执行智能体操作...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-5 bg-slate-800/60 border-t border-slate-700 backdrop-blur-md">
                <div className="flex gap-3 bg-slate-700 rounded-lg p-3 border border-slate-600 shadow-lg">
                  <input 
                    type="text" value={input} onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-transparent border-none rounded-lg px-4 py-3 text-sm text-white focus:outline-none placeholder:text-slate-400/60" 
                    placeholder="输入指令，让 AI 助手帮您完成任务..."
                  />
                  <button 
                    onClick={handleSend} disabled={isTyping}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                  >
                    <Send size={18}/>
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                   {["帮我分析目前的瓶颈", "生成执行计划", "标记此阶段完成", "优化当前方案"].map((suggest, sIdx) => (
                     <button 
                       key={sIdx}
                       onClick={() => { setInput(suggest); }}
                       className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                     >
                       {suggest}
                     </button>
                   ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- AI 对接流程详情页 ---
const FlowDetailView = () => {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const flow = useMemo(() => MOCK_FLOW_DATA.find(f => f.id === parseInt(flowId || '0')), [flowId]);

  if (!flow) return (
    <div className="pt-40 text-center">
      <AlertCircle className="mx-auto text-slate-300 mb-4" size={64} />
      <p className="text-slate-500 font-black">对接任务不存在</p>
      <button onClick={() => navigate('/workbench')} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded font-black">返回工作台</button>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Offer': return 'bg-emerald-50 text-emerald-600';
      case '面试中': return 'bg-blue-50 text-blue-600';
      case '待审核': return 'bg-amber-50 text-amber-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="pt-32 pb-20 px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => navigate('/workbench')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors">
        <ChevronLeft size={20} /> 返回工作台
      </button>

      <div className="bg-white rounded p-6 border border-slate-100 shadow-xl mb-8">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase size={16} className="text-indigo-600" /> 目标岗位信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100">
                <UserIcon size={20} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">{flow.job}</h4>
                <p className="text-sm text-indigo-600 font-medium">{flow.company}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">{flow.description}</p>
            <div className="flex flex-wrap gap-2">
              {flow.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <MapPin size={18} className="text-indigo-600" />
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">工作地点</div>
                <div className="text-sm font-bold text-slate-700">{flow.location}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Coins size={18} className="text-emerald-600" />
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">薪资范围</div>
                <div className="text-sm font-bold text-slate-700">{flow.salary}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
              <Target size={18} className="text-indigo-600" />
              <div>
                <div className="text-xs text-indigo-400 font-bold uppercase">匹配度</div>
                <div className="text-sm font-black text-indigo-600">{flow.matchScore}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">{flow.candidate}</h1>
            <p className="text-xs text-slate-500 font-medium">候选人</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${getStatusColor(flow.status)}`}>
            {flow.status}
          </span>
          <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
            <Clock size={14} /> {flow.stage}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Zap size={16} className="text-indigo-600" /> 对接详情
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">{flow.details}</p>
          </div>

          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" /> 阶段进度
            </h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {flow.nodes.map((node, idx) => (
                <div key={idx} className="flex items-center shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    idx < flow.currentStep ? 'bg-indigo-600 text-white' : 
                    idx === flow.currentStep ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < flow.nodes.length - 1 && (
                    <div className={`w-8 h-1 ${idx < flow.currentStep ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4 overflow-x-auto">
              {flow.nodes.map((node, idx) => (
                <span key={idx} className={`px-3 py-1 rounded text-xs font-bold shrink-0 ${
                  idx < flow.currentStep ? 'bg-indigo-50 text-indigo-600' : 
                  idx === flow.currentStep ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  {node}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <GitBranch size={16} className="text-indigo-600" /> 执行时间线
            </h3>
            <div className="space-y-4">
              {flow.timeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 relative">
                  {idx < flow.timeline.length - 1 && (
                    <div className="absolute left-[7px] top-8 w-0.5 h-full bg-slate-100"></div>
                  )}
                  <div className="w-4 h-4 rounded-full bg-indigo-600 shrink-0 mt-1 relative z-10"></div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{item.action}</span>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-600 font-medium">{item.agent}</span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                        {item.tokens.toLocaleString()} tokens
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-indigo-600" /> 资源消耗
            </h3>
            <div className="text-center py-4">
              <div className="text-4xl font-black text-indigo-600">{flow.tokensConsumed.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Total Tokens</div>
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
              {flow.agents.map((agent, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">{agent}</span>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {Math.round(flow.tokensConsumed / flow.agents.length / 1000 * (Math.random() * 0.5 + 0.5))}K
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <ArrowRightCircle size={16} className="text-indigo-600" /> 下一步安排
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">待执行动作</div>
                <div className="text-sm font-bold text-slate-900">{flow.nextAction}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">计划时间</div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Calendar size={14} />
                  {flow.nextSchedule}
                </div>
              </div>
              <button className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors">
                推进到下一阶段
              </button>
            </div>
          </div>

          <div className="bg-white rounded p-6 border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Bot size={16} className="text-indigo-600" /> 参与智能体
            </h3>
            <div className="space-y-2">
              {flow.agents.map((agent, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600">
                    <Bot size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 关于我们页面 ---
const AboutUsView = () => (
  <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-indigo-100">
        <Info size={16} /> 关于 Devnors 得若
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">我们的使命与愿景</h1>
    </div>

    <div className="bg-slate-50 rounded-lg p-10 md:p-16 border border-slate-100 relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 p-32 opacity-5">
        <Zap size={200} className="text-indigo-600" />
      </div>
      <div className="relative z-10">
        <h2 className="text-3xl font-black text-slate-900 mb-6">全场景AI原生智能招聘平台</h2>
        <p className="text-xl text-slate-600 leading-relaxed font-medium">我们通过高效的 AI 匹配系统，为企业精准推荐全球精英，同时助力人才实现职业梦想。得若，找到你的搭档，让每一次选择匹配都成为机遇。</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded p-8 border border-slate-100 shadow-lg hover:shadow-xl transition-all group">
        <div className="w-14 h-14 bg-indigo-50 rounded flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Brain size={28} className="text-indigo-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3">AI 智能匹配</h3>
        <p className="text-slate-500 font-medium">基于深度学习算法，实现人才与岗位的精准匹配，提升招聘效率。</p>
      </div>
      <div className="bg-white rounded p-8 border border-slate-100 shadow-lg hover:shadow-xl transition-all group">
        <div className="w-14 h-14 bg-emerald-50 rounded flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Globe size={28} className="text-emerald-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3">全球化视野</h3>
        <p className="text-slate-500 font-medium">打破地域限制，让优秀人才与企业实现无国界对接。</p>
      </div>
      <div className="bg-white rounded p-8 border border-slate-100 shadow-lg hover:shadow-xl transition-all group">
        <div className="w-14 h-14 bg-amber-50 rounded flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Users size={28} className="text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3">多智能体协作</h3>
        <p className="text-slate-500 font-medium">多个 AI 智能体协同工作，全方位服务招聘全流程。</p>
      </div>
    </div>

    <div className="bg-white rounded-lg p-10 border border-slate-100 shadow-lg mb-8">
      <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <Award size={24} className="text-amber-500" /> 核心价值观
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex items-start gap-4 p-6 bg-slate-50 rounded">
          <div className="w-12 h-12 bg-indigo-50 rounded flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} className="text-indigo-600" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 mb-2">技术创新</h4>
            <p className="text-slate-500 font-medium text-sm">持续投入 AI 技术研发，保持行业领先地位</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-6 bg-slate-50 rounded">
          <div className="w-12 h-12 bg-emerald-50 rounded flex items-center justify-center flex-shrink-0">
            <Heart size={24} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 mb-2">用户体验</h4>
            <p className="text-slate-500 font-medium text-sm">以用户为中心，打造极致的招聘求职体验</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-6 bg-slate-50 rounded">
          <div className="w-12 h-12 bg-amber-50 rounded flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} className="text-amber-600" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 mb-2">数据安全</h4>
            <p className="text-slate-500 font-medium text-sm">严格保护用户隐私，确保数据安全可靠</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-6 bg-slate-50 rounded">
          <div className="w-12 h-12 bg-rose-50 rounded flex items-center justify-center flex-shrink-0">
            <TrendingUp size={24} className="text-rose-600" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 mb-2">持续成长</h4>
            <p className="text-slate-500 font-medium text-sm">帮助每一位用户在职业道路上不断进步</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg p-10 border border-slate-100 shadow-lg">
      <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <Mail size={24} className="text-indigo-500" /> 联系我们
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a href="mailto:contact@devnors.com" className="flex items-center gap-4 p-6 bg-slate-50 rounded hover:bg-indigo-50 transition-all group">
          <div className="w-12 h-12 bg-indigo-100 rounded flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
            <Mail size={24} className="text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">商务合作</h4>
            <p className="text-xs text-slate-500">contact@devnors.com</p>
          </div>
        </a>
        <a href="tel:+400-123-4567" className="flex items-center gap-4 p-6 bg-slate-50 rounded hover:bg-emerald-50 transition-all group">
          <div className="w-12 h-12 bg-emerald-100 rounded flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
            <Phone size={24} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">客服热线</h4>
            <p className="text-xs text-slate-500">400-123-4567</p>
          </div>
        </a>
        <div className="flex items-center gap-4 p-6 bg-slate-50 rounded hover:bg-amber-50 transition-all group">
          <div className="w-12 h-12 bg-amber-100 rounded flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <MapPin size={24} className="text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">公司地址</h4>
            <p className="text-xs text-slate-500">北京市海淀区中关村</p>
          </div>
        </div>
        <a href="#" className="flex items-center gap-4 p-6 bg-slate-50 rounded hover:bg-rose-50 transition-all group">
          <div className="w-12 h-12 bg-rose-100 rounded flex items-center justify-center group-hover:bg-rose-200 transition-colors">
            <MessageCircle size={24} className="text-rose-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">在线客服</h4>
            <p className="text-xs text-slate-500">7×24 小时服务</p>
          </div>
        </a>
      </div>
    </div>
  </div>
);

// --- 定价方案页面 ---
const PricingView = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Free',
      price: billingCycle === 'annual' ? '¥0' : '¥0',
      period: '/月',
      description: '适合个人探索和小型团队',
      features: [
        { name: '简历解析', limit: '20份/月', included: true },
        { name: 'AI 匹配推荐', limit: '50次/月', included: true },
        { name: '人才库容量', limit: '100人', included: true },
        { name: '基础智能体', limit: '2个', included: true },
        { name: '多语言支持', included: true },
        { name: 'API 访问', included: false },
        { name: '团队协作', included: false },
        { name: '专属部署', included: false },
      ],
      cta: '当前方案',
      current: true,
      color: 'border-slate-200',
      btnColor: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    },
    {
      name: 'Professional',
      price: billingCycle === 'annual' ? '¥999' : '¥1,299',
      period: billingCycle === 'annual' ? '/月' : '/月',
      description: '适合成长型招聘团队',
      popular: true,
      features: [
        { name: '简历解析', limit: '500份/月', included: true },
        { name: 'AI 匹配推荐', limit: '无限', included: true },
        { name: '人才库容量', limit: '5,000人', included: true },
        { name: '高级智能体', limit: '10个', included: true },
        { name: '多语言支持', included: true },
        { name: 'API 访问', limit: '10,000次/月', included: true },
        { name: '团队协作', limit: '5人', included: true },
        { name: '专属部署', included: false },
      ],
      cta: '升级到旗舰版',
      current: false,
      color: 'border-indigo-200 shadow-xl',
      btnColor: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      name: 'Enterprise',
      price: billingCycle === 'annual' ? '¥4,999' : '¥6,499',
      period: billingCycle === 'annual' ? '/月' : '/月',
      description: '适合大型企业和集团',
      features: [
        { name: '简历解析', limit: '无限', included: true },
        { name: 'AI 匹配推荐', limit: '无限', included: true },
        { name: '人才库容量', limit: '无限', included: true },
        { name: '全系列智能体', limit: '无限', included: true },
        { name: '多语言支持', included: true },
        { name: 'API 访问', limit: '无限', included: true },
        { name: '团队协作', limit: '无限制', included: true },
        { name: '专属部署', included: true },
        { name: '24/7 专属支持', included: true },
        { name: '私有化定制', included: true },
      ],
      cta: '联系我们',
      current: false,
      color: 'border-rose-200 shadow-xl',
      btnColor: 'bg-rose-600 text-white hover:bg-rose-700',
    },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors">
        <ChevronLeft size={20} /> 返回
      </button>

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-indigo-100">
          <Sparkle size={16} /> 定价方案
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">选择适合您的方案</h1>
        <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
          无论您是个人用户、成长型团队还是大型企业，我们都有适合的方案助您提升招聘效率
        </p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 p-1.5 rounded-xl inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              billingCycle === 'monthly' 
                ? 'bg-white text-indigo-600 shadow-lg' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            月付
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              billingCycle === 'annual' 
                ? 'bg-white text-indigo-600 shadow-lg' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            年付 <span className="text-xs text-emerald-600 ml-1">省 23%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => (
          <div 
            key={idx}
            className={`relative bg-white rounded-2xl p-8 border-2 ${plan.color} flex flex-col`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                最受欢迎
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{plan.description}</p>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                <span className="text-slate-500 font-medium">{plan.period}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-start gap-3">
                  <CheckCircle2 
                    size={18} 
                    className={feature.included ? 'text-emerald-500 flex-shrink-0 mt-0.5' : 'text-slate-300 flex-shrink-0 mt-0.5'} 
                  />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                      {feature.name}
                    </span>
                    {feature.limit && (
                      <span className="text-xs text-slate-400 ml-1">({feature.limit})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => plan.name === 'Enterprise' ? window.open('mailto:contact@devnors.com', '_blank') : navigate('/settings')}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${plan.btnColor}`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-slate-50 rounded-2xl p-8 border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 mb-6 text-center">常见问题</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { q: '可以随时更换方案吗？', a: '当然可以！您可以随时升级或降级您的方案，费用会按比例调整。' },
            { q: '年付有什么优惠？', a: '选择年付可以享受 23% 的折扣，相当于免费获得近 3 个月的服务。' },
            { q: '支持定制化部署吗？', a: 'Enterprise 方案支持私有化部署和定制化需求，请联系我们的销售团队。' },
            { q: '是否有免费试用？', a: 'Free 方案永久免费使用，Professional 和 Enterprise 方案支持 14 天全额退款保证。' },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
              <p className="text-sm text-slate-600 font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 人才端主工作台 ---
const CandidateView = () => {
  const [resumeText, setResumeText] = useState('');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!resumeText) return;
    setLoading(true);
    setLoadingStep('正在启动多智能体解析引擎...');
    try {
      const result = await analyzeResume(resumeText);
      setProfile(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const MOCK_WORKFLOW = [
    { id: 1, company: '得若智能科技', job: '高级 AI 工程师', stage: '面试中', date: '5月20日', status: 'active', info: '第二轮技术面：5月22日 14:00' },
    { id: 2, company: '字节跳动', job: '大模型研发', stage: '简历筛选', date: '5月18日', status: 'pending', info: '智能体已自动对标，等待HR初审' },
    { id: 3, company: 'Nexus 创意实验室', job: '产品设计主管', stage: 'Offer', date: '5月15日', status: 'completed', info: '薪资对标已完成，待确认意向书' },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">人才方</h1>
          <p className="text-slate-500 font-medium">AI 求职智能体正在为您全天候工作</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/candidate/profile')} 
            className="bg-white border border-slate-200 text-slate-900 px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <UserCircle2 size={20} className="text-indigo-600" /> 人才主页
          </button>
          <button 
            onClick={() => navigate('/candidate/apply')}
            className="bg-emerald-600 text-white px-8 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-200 active:scale-95 transition-all"
          >
            <Rocket size={20}/> 开始求职
          </button>
        </div>
      </div>

      <div className="w-full bg-white p-8 rounded-lg border border-slate-100 card-shadow relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Brain size={120} /></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-black flex items-center gap-3 text-slate-900">
              <Database size={20} className="text-emerald-500" /> 人才画像 Memory
            </h3>
            <button 
              onClick={() => navigate('/candidate/memory')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-black text-emerald-600 flex items-center gap-1.5 transition-all active:scale-95 group"
            >
              <Pin size={12} className="group-hover:rotate-45 transition-transform" /> 记忆管理
            </button>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {CANDIDATE_MEMORIES.map(memory => (
            <div key={memory.id} className={`p-4 rounded-lg border bg-slate-50 ${memory.color}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-black uppercase tracking-wider">{memory.type}</span>
                <span className="text-xs text-slate-400 font-mono">{memory.date}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">"{memory.content}"</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow relative overflow-hidden group">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><BrainCircuit size={20} /></div>
              {profile ? '重新调优您的职业画像' : '上传职业履历 (Resume Paste)'}
            </h2>
            <textarea 
              className="w-full h-48 bg-slate-50 border border-slate-200 rounded p-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mb-6 text-sm font-medium leading-relaxed" 
              placeholder="请粘贴您的简历内容，Devnors 智能体将为您建立多维语义对标画像..." 
              value={resumeText} 
              onChange={(e) => setResumeText(e.target.value)}
            ></textarea>
            <button 
              onClick={() => navigate('/candidate/apply')} disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded flex flex-col items-center shadow-xl shadow-indigo-200 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} 
                <span>{loading ? 'AI 多智能体解析中...' : '生成全方位 AI 职业画像'}</span>
              </div>
            </button>
          </div>

          <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Briefcase size={20} /></div>
              企业岗位库推荐
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-6">基于您的职业画像，AI 智能体为您匹配了以下优质岗位</p>
              
              <div className="space-y-4">
                {RECOMMENDED_JOBS.map((job) => (
                  <div key={job.id} onClick={() => navigate(`/candidate/job/${job.id}`)} className="group p-6 bg-slate-50 hover:bg-emerald-50/50 rounded border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-white rounded flex items-center justify-center shadow-sm border border-slate-100 text-2xl font-bold">
                          {job.logo}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{job.title}</h3>
                          <p className="text-slate-600 font-medium">{job.company} · {job.location}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-slate-600 border border-slate-200">{job.salary}</span>
                            <span className="px-3 py-1 bg-emerald-100 rounded-lg text-xs font-bold text-emerald-700">{job.match}% 匹配度</span>
                            {job.tags.map((tag, i) => (
                              <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); navigate('/candidate/delivery'); }} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-100">
                        <Rocket size={16} /> AI 对接投递
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        AI 智能体对接说明：{job.aiIntro}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 bg-slate-50 hover:bg-slate-100 text-slate-600 py-4 rounded font-black text-sm flex items-center justify-center gap-2 transition-all border border-slate-200 border-dashed">
                <ChevronDown size={18} /> 查看更多
              </button>
            </div>

          {profile && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {/* 画像基本信息 */}
              <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-2xl ring-4 ring-indigo-50">{profile.name.charAt(0)}</div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 mb-1">{profile.name}</h3>
                        <p className="text-indigo-600 font-black tracking-wide">{profile.role} · {profile.experienceYears}年经验</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                     <button onClick={() => navigate('/candidate/home', { state: { profile } })} className="bg-indigo-600 text-white px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                       <UserCircle2 size={18} /> 个人主页预览
                     </button>
                     <button onClick={() => navigate('/candidate/resume', { state: { profile } })} className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                       <FileText size={18} /> 详尽数字简历
                     </button>
                   </div>
                </div>
                
                {/* 求职画像板块 */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-10">
                  <div className="p-8 bg-slate-50 rounded-lg border border-slate-100">
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Eye size={14} className="text-indigo-600" /> 求职意向画像 (Ideal Job Persona)
                     </h4>
                     <p className="text-lg text-slate-700 leading-relaxed font-bold italic">
                        “{profile.idealJobPersona || '智能体正在根据您的背景推导理想岗位画像...'}”
                     </p>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div>
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">当前职业价值对标</h4>
                     <div className="flex items-center gap-4">
                        <div className="flex-1 p-4 bg-slate-50 rounded border border-slate-100">
                           <div className="text-xs font-black text-slate-400 mb-1 uppercase">预期年薪</div>
                           <div className="text-lg font-black text-slate-900">{profile.salaryRange || '¥450k - ¥700k'}</div>
                        </div>
                        <div className="flex-1 p-4 bg-slate-50 rounded border border-slate-100">
                           <div className="text-xs font-black text-slate-400 mb-1 uppercase">市场热度</div>
                           <div className="text-lg font-black text-emerald-600">High Demand</div>
                        </div>
                     </div>
                   </div>
                   <div>
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">核心改进建议</h4>
                     <ul className="space-y-3">
                        {profile.optimizationSuggestions?.slice(0, 2).map((s, i) => (
                          <li key={i} className="text-sm text-slate-600 font-medium flex items-start gap-3">
                             <CheckCircle2 size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" /> {s}
                          </li>
                        ))}
                     </ul>
                   </div>
                </div>
              </div>

              {/* 求职工作流板块 */}
              <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow overflow-hidden">
                 <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                   <Timer className="text-indigo-600" /> 求职流程自动化 (Job Workflow)
                 </h2>
                 <div className="space-y-6">
                    {MOCK_WORKFLOW.map((item, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded-lg border border-slate-100 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                           <div className={`w-12 h-12 rounded flex items-center justify-center flex-shrink-0 transition-transform ${item.status === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-400'}`}>
                              {item.status === 'active' ? <History size={24} /> : item.status === 'completed' ? <Award size={24} /> : <ClipboardCheck size={24} />}
                           </div>
                           <div>
                              <div className="text-sm font-black text-slate-800">{item.company} · {item.job}</div>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="text-xs font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">{item.stage}</span>
                                 <span className="text-xs text-slate-400 font-bold">{item.date}</span>
                              </div>
                           </div>
                        </div>
                        <div className="mt-4 md:mt-0 w-full md:w-auto text-left md:text-right">
                           <p className="text-xs text-slate-500 font-bold mb-2 italic">“{item.info}”</p>
                           <button className="text-xs font-black text-indigo-600 hover:underline">查看详情记录</button>
                        </div>
                      </div>
                    ))}
                 </div>
                 <button className="w-full mt-8 py-4 bg-slate-100/50 text-slate-400 text-xs font-black rounded border border-dashed border-slate-200 hover:bg-slate-100 transition-all uppercase tracking-widest">
                   查看历史求职存档
                 </button>
              </div>

              {/* 模拟面试 */}
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900 px-4 flex items-center gap-3"><Bot className="text-indigo-600" /> AI 压力面试实战演练</h3>
                <MockInterviewConsole questions={profile.interviewQuestions || []} profile={profile} />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-10">
          <div className="mb-12">
            <div className="bg-white rounded-lg border border-slate-100 card-shadow overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-slate-100">
                {[
                  { label: 'AI投递', value: '534次', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'AI沟通', value: '33小时', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: '总 Token 消耗', value: '1.8M', icon: Cpu, color: 'text-amber-500', bg: 'bg-amber-50' }
                ].map((card, i) => (
                  <div key={i} className="p-6 flex items-center gap-6">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                      <card.icon className={card.color} size={20}/>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{card.label}</div>
                      <div className="text-xl font-black text-slate-900">{card.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {profile && (
            <div className="sticky top-28 space-y-10">
              <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900">
                   <BarChart3 size={20} className="text-indigo-600" /> 核心竞争力雷达
                </h3>
                <RadarChart data={profile.radarData} />
              </div>

              <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                   <Target size={20} className="text-indigo-600" /> AI 智能机会对标
                </h3>
                <div className="space-y-6">
                   {MOCK_JOBS.slice(0, 3).map(job => (
                     <div key={job.id} className="group p-5 rounded-lg bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 transition-all shadow-sm hover:shadow-xl cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                           <div className="text-sm font-black text-slate-900">{job.title}</div>
                           <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{job.matchScore}% 匹配</div>
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold mb-3">{job.company} · {job.salary}</div>
                        <div className="flex flex-wrap gap-1.5">
                           {job.tags.slice(0, 2).map((t, i) => (
                             <span key={i} className="px-2 py-0.5 bg-white text-slate-400 text-[9px] font-black rounded-lg border border-slate-100 uppercase tracking-tighter">{t}</span>
                           ))}
                        </div>
                        <button className="w-full mt-4 py-2 text-xs font-black text-indigo-600 border border-indigo-100 rounded group-hover:bg-indigo-600 group-hover:text-white transition-all">一键智能投递</button>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 人才个人主页 (CandidateHomeView) ---
const CandidateHomeView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile as CandidateProfile;

  if (!profile) return (
    <div className="pt-40 text-center animate-in fade-in">
       <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={48} />
       <p className="text-slate-500 font-black">正在加载您的个性化主页...</p>
       <button onClick={() => navigate('/candidate')} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded font-black">返回控制台</button>
    </div>
  );

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-colors">
          <ChevronLeft size={20} /> 返回控制台
        </button>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded font-black flex items-center gap-2 shadow-xl active:scale-95 transition-all">
          <Share2 size={18} /> 分享我的个人主页
        </button>
      </div>

      <div className="mb-8">
        <button onClick={() => navigate('/candidate/memory')} className="group w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-8 py-6 rounded-lg font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 active:scale-98 transition-all">
          <Brain size={28} /> 人才画像 Memory
          <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* 顶栏个人信息 */}
          <div className="bg-white rounded p-12 border border-slate-100 card-shadow flex flex-col md:flex-row gap-10 items-center">
            <div className="w-40 h-40 bg-indigo-600 text-white flex items-center justify-center text-5xl font-black rounded-lg shadow-2xl ring-8 ring-indigo-50">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">{profile.name}</h1>
              <p className="text-2xl text-indigo-600 font-black mb-6">{profile.role} · {profile.experienceYears} 年实战经验</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {profile.skills.map((s, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded border border-slate-100">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 职业概览与理想画像 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-indigo-600 text-white rounded p-10 shadow-2xl">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Sparkles size={20} /> 职业综述</h3>
              <p className="text-lg leading-relaxed text-indigo-50 font-medium italic">“{profile.summary}”</p>
            </div>
            <div className="bg-white rounded p-10 border border-slate-100 card-shadow">
              <h3 className="text-xl font-black text-indigo-600 mb-6 flex items-center gap-2"><Eye size={20} /> 理想工作画像</h3>
              <p className="text-lg leading-relaxed text-slate-700 font-bold italic">“{profile.idealJobPersona}”</p>
            </div>
          </div>

          {/* 详细技能与晋升路径 */}
          <div className="bg-white rounded p-12 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3"><TrendingUp className="text-indigo-600" /> AI 建议的职业晋升路径</h3>
            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
               {profile.careerPath?.map((step, i) => (
                  <div key={i} className="relative pl-12">
                     <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-4 border-indigo-600 flex items-center justify-center text-indigo-600 font-black z-10">{i + 1}</div>
                     <h4 className="text-xl font-black text-slate-900 mb-2">{step.role} <span className="text-sm font-bold text-slate-400 ml-4">{step.timeframe}</span></h4>
                     <p className="text-slate-500 font-medium">{step.requirement}</p>
                  </div>
               ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
           {/* 雷达图 */}
           <div className="bg-white rounded p-10 border border-slate-100 card-shadow">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><BarChart3 className="text-indigo-600" /> 核心竞争力雷达图</h3>
              <RadarChart data={profile.radarData} />
           </div>

           {/* 智能体反馈 */}
           <div className="bg-indigo-600 text-white rounded p-10 shadow-2xl">
              <h3 className="text-xl font-black mb-8 flex items-center gap-2"><Users className="text-indigo-400" /> 多智能体专家评价</h3>
              <div className="space-y-8">
                 {profile.agentFeedbacks?.map((fb, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{fb.agentName}</span>
                          <span className="text-lg font-black">{fb.score}</span>
                       </div>
                       <p className="text-sm text-slate-400 leading-relaxed font-medium italic">“{fb.comment}”</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 企业画像 Memory 详情页 ---
const EnterpriseMemoryView = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredMemories = useMemo(() => {
    if (activeCategory === '全部') return ENTERPRISE_MEMORIES;
    return ENTERPRISE_MEMORIES.filter(m => m.type === activeCategory);
  }, [activeCategory]);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-colors mb-6">
        <ChevronLeft size={20} /> 返回
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
             <div className="p-3 bg-indigo-600 text-white rounded shadow-xl shadow-indigo-100"><Brain size={32} /></div>
             企业画像 Memory 记忆中心
           </h1>
           <p className="text-slate-500 font-medium mt-2">Devnors Agent 持续学习并固化的企业招聘偏好与文化基因</p>
        </div>
        <button onClick={() => navigate('/memory/input')} className="bg-indigo-600 text-white px-8 py-4 rounded font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
           <Plus size={20} /> 手动录入新记忆
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-white p-6 rounded border border-slate-100 card-shadow">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">记忆分类库</h3>
              <div className="space-y-1">
                 {['全部', '文化', '技术', '要求', '策略'].map((cat) => (
                   <button 
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`w-full text-left px-4 py-3 rounded font-bold text-sm transition-all flex justify-between items-center ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}
                   >
                     {cat}
                     <ChevronRight size={14} className={activeCategory === cat ? 'opacity-100' : 'opacity-0'} />
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="bg-indigo-900 p-8 rounded text-white shadow-xl relative overflow-hidden">
              <Sparkle className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-600/5" />
              <h4 className="text-xs font-black uppercase text-indigo-400 mb-2">AI 记忆同步状态</h4>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-sm font-black">Agent 同步中 (100%)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">“系统正在实时分析您与人才沟通的细节，并自动提炼新的招聘偏好记忆。”</p>
           </div>
        </div>

        <div className="lg:col-span-9">
           <div className="grid grid-cols-1 gap-6">
              {filteredMemories.map((memory) => (
                <div key={memory.id} className="bg-white p-8 rounded-lg border border-slate-100 card-shadow group hover:border-indigo-200 transition-all flex flex-col md:flex-row gap-8">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                         <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${memory.color}`}>
                           {memory.type}
                         </span>
                         <span className="text-xs font-bold text-slate-400">{memory.date} 固化</span>
                         <div className={`ml-auto w-2 h-2 rounded-full ${memory.importance === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} title={`重要性: ${memory.importance}`}></div>
                      </div>
                      <p className="text-lg text-slate-800 font-bold leading-relaxed mb-6 group-hover:text-indigo-600 transition-colors">
                        “{memory.content}”
                      </p>
                      <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                         <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><Edit3 size={12} /> 编辑</button>
                         <button className="flex items-center gap-1.5 hover:text-rose-600 transition-colors"><Trash2 size={12} /> 移除记忆</button>
                      </div>
                   </div>
                   <div className="md:w-64 bg-slate-50 rounded-lg p-6 border border-slate-100 flex flex-col justify-center">
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-2">Agent 推理逻辑</h5>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        基于您过去 10 次对候选人的筛选偏好自动总结，建议在后续岗位匹配中增加该维度的权重。
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 人才画像 Memory 详情页 ---
const CandidateMemoryView = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredMemories = useMemo(() => {
    if (activeCategory === '全部') return CANDIDATE_MEMORIES;
    return CANDIDATE_MEMORIES.filter(m => m.type === activeCategory);
  }, [activeCategory]);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-black transition-colors mb-6">
        <ChevronLeft size={20} /> 返回
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
             <div className="p-3 bg-emerald-600 text-white rounded shadow-xl shadow-emerald-100"><Brain size={32} /></div>
             人才画像 Memory 记忆中心
           </h1>
           <p className="text-slate-500 font-medium mt-2">Devnors Agent 持续学习并固化的人才能力、技能偏好与职业发展轨迹</p>
        </div>
        <button onClick={() => navigate('/memory/input')} className="bg-emerald-600 text-white px-8 py-4 rounded font-black flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all active:scale-95">
           <Plus size={20} /> 手动录入新记忆
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-white p-6 rounded border border-slate-100 card-shadow">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">记忆分类库</h3>
              <div className="space-y-1">
                 {['全部', '技能', '经验', '偏好', '目标'].map((cat) => (
                   <button 
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`w-full text-left px-4 py-3 rounded font-bold text-sm transition-all flex justify-between items-center ${activeCategory === cat ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}
                   >
                     {cat}
                     <ChevronRight size={14} className={activeCategory === cat ? 'opacity-100' : 'opacity-0'} />
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="bg-emerald-50 p-8 rounded border border-emerald-200 shadow-sm relative overflow-hidden">
              <Sparkle className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-600/5" />
              <h4 className="text-xs font-black uppercase text-emerald-600 mb-2">AI 记忆同步状态</h4>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-sm font-black text-slate-700">Agent 同步中 (100%)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed italic">"系统正在实时分析您的职业履历，并自动提炼能力画像与职业偏好记忆。"</p>
           </div>
        </div>

        <div className="lg:col-span-9">
           <div className="grid grid-cols-1 gap-6">
              {filteredMemories.map((memory) => (
                <div key={memory.id} className="bg-white p-8 rounded-lg border border-slate-100 card-shadow group hover:border-emerald-200 transition-all flex flex-col md:flex-row gap-8">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                         <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${memory.color}`}>
                           {memory.type}
                         </span>
                         <span className="text-xs font-bold text-slate-400">{memory.date} 固化</span>
                         <div className={`ml-auto w-2 h-2 rounded-full ${memory.importance === 'High' ? 'bg-rose-500' : 'bg-emerald-500'}`} title={`重要性: ${memory.importance}`}></div>
                      </div>
                      <p className="text-lg text-slate-800 font-bold leading-relaxed mb-6 group-hover:text-emerald-600 transition-colors">
                        "{memory.content}"
                      </p>
                      <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                         <button className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"><Edit3 size={12} /> 编辑</button>
                         <button className="flex items-center gap-1.5 hover:text-rose-600 transition-colors"><Trash2 size={12} /> 移除记忆</button>
                      </div>
                   </div>
                   <div className="md:w-64 bg-emerald-50 rounded-lg p-6 border border-emerald-100 flex flex-col justify-center">
                      <h5 className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-2">Agent 推理逻辑</h5>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        基于您的职业履历和面试反馈自动总结，为您推荐最适合的职业发展方向。
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 岗位详情页 ---
const JobDetailView = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const passedJob = location.state?.job as Job | undefined;
  
  const recommendedJob = RECOMMENDED_JOBS.find(j => j.id === Number(jobId));
  const mockJob = MOCK_JOBS.find(j => j.id === jobId);
  
  const isMockJob = !!passedJob || (!recommendedJob && !!mockJob);
  const displayJob = passedJob || mockJob || recommendedJob || RECOMMENDED_JOBS[0];
  
  return (
    <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-black transition-colors mb-8">
        <ChevronLeft size={20} /> 返回
      </button>
      
      <div className="bg-white rounded-lg border border-slate-100 card-shadow overflow-hidden">
        <div className={`p-10 text-white ${isMockJob ? 'bg-indigo-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
          <div className="flex items-start gap-6">
            {isMockJob ? (
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-lg">
                <Building2 size={40} />
              </div>
            ) : (
              <div className="w-20 h-20 bg-white rounded flex items-center justify-center text-4xl shadow-lg">
                {'logo' in displayJob ? displayJob.logo : '💼'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-black mb-2">{displayJob.title}</h1>
              <p className={`${isMockJob ? 'text-indigo-200' : 'text-emerald-100'} text-xl font-medium mb-4`}>
                {('company' in displayJob ? (displayJob as Job).company : (displayJob as any).company)} · {displayJob.location}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded font-bold">{displayJob.salary}</span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded font-bold">
                  {'match' in displayJob ? displayJob.match : ('matchScore' in displayJob ? displayJob.matchScore : 95)}% 匹配度
                </span>
              </div>
            </div>
            <button className={`${isMockJob ? 'bg-white text-indigo-600' : 'bg-white text-emerald-600'} px-8 py-4 rounded font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all`}>
              <Rocket size={20} /> AI 一键投递
            </button>
          </div>
        </div>
        
        <div className="p-10">
          <div className="mb-10">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-emerald-600" /> 职位描述
            </h3>
            <div className="bg-slate-50 rounded p-6 border border-slate-100">
              <p className="text-slate-700 leading-relaxed font-medium">
                {'description' in displayJob && displayJob.description ? displayJob.description : `我们正在寻找一位资深 ${displayJob.title} 加入我们的团队。作为 ${('company' in displayJob ? (displayJob as Job).company : (displayJob as any).company)} 的核心成员，您将参与重要项目的设计与开发，推动技术创新。`}
              </p>
            </div>
          </div>
          
          {'aiIntro' in displayJob && displayJob.aiIntro && (
            <div className="mb-10">
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" /> AI 智能体对接说明
              </h3>
              <div className="bg-amber-50 rounded p-6 border border-amber-100">
                <p className="text-slate-700 leading-relaxed font-medium">{displayJob.aiIntro}</p>
              </div>
            </div>
          )}
          
          <div className="mb-10">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Tag size={20} className="text-indigo-600" /> 技能要求
            </h3>
            <div className="flex flex-wrap gap-3">
              {displayJob.tags.map((tag, i) => (
                <span key={i} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded font-bold">{tag}</span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded p-6 border border-slate-100">
              <h4 className="font-black text-slate-900 mb-2 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" /> 发布时间
              </h4>
              <p className="text-slate-600 font-medium">2024-01-15</p>
            </div>
            <div className="bg-slate-50 rounded p-6 border border-slate-100">
              <h4 className="font-black text-slate-900 mb-2 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-600" /> 工作地点
              </h4>
              <p className="text-slate-600 font-medium">{displayJob.location}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 人才主页详情页 ---
const CandidateProfileView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile as CandidateProfile;

  const mockProfile: CandidateProfile = profile || {
    name: '张明',
    role: '高级前端架构师',
    experienceYears: 8,
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Rust', 'AI/ML'],
    radarData: [
      { subject: '前端架构', value: 95 },
      { subject: '后端开发', value: 75 },
      { subject: 'AI/ML', value: 70 },
      { subject: '系统设计', value: 90 },
      { subject: '团队协作', value: 88 },
      { subject: '代码质量', value: 92 },
    ],
    summary: '8年互联网从业经验，专注于大规模前端系统架构设计与性能优化。曾在头部科技公司主导多个亿级用户产品的核心前端架构升级，具备丰富的微前端架构设计和团队技术管理经验。',
    idealJobPersona: '寻求技术驱动型团队，致力于用技术创造商业价值的资深前端架构师职位。期望参与前沿技术（AI、边缘计算）的产品研发。',
    careerPath: [
      { role: '高级前端架构师', timeframe: '2022-至今', requirement: '主导公司前端架构升级，推进微前端落地' },
      { role: '前端技术专家', timeframe: '2020-2022', requirement: '负责亿级用户产品的性能优化和技术架构' },
      { role: '资深前端工程师', timeframe: '2018-2020', requirement: '主导多个关键项目的前端开发和架构设计' },
    ],
    agentFeedbacks: [
      { agentName: '架构评审 Agent', type: 'Technical', comment: '系统设计能力优秀，代码架构清晰易懂', score: 95 },
      { agentName: '面试官 Agent', type: 'SoftSkills', comment: '沟通表达清晰，技术分享能力突出', score: 90 },
      { agentName: 'HR Agent', type: 'Strategy', comment: '职业规划清晰，稳定性和成长性兼备', score: 88 },
    ],
    awards: [
      { name: '年度最佳架构师奖', org: '中国互联网协会', year: '2024', description: '优秀分布式系统设计能力表彰', icon: Trophy, color: 'bg-amber-100 text-amber-600' },
      { name: '开源杰出贡献者', org: 'Apache Foundation', year: '2023', description: 'Kubernetes 社区核心贡献者', icon: Medal, color: 'bg-red-100 text-red-600' },
    ],
    certifications: [
      { name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', date: '2024-03', icon: Award, color: 'bg-amber-100 text-amber-600' },
      { name: 'Kubernetes Administrator (CKA)', issuer: 'CNCF', date: '2023-08', icon: ShieldCheck, color: 'bg-indigo-100 text-indigo-600' },
    ],
    credentials: [
      { name: '信息系统安全专家 (CISP)', authority: '中国信息安全测评中心', validUntil: '2026-12', icon: Verified, color: 'bg-emerald-100 text-emerald-600' },
      { name: 'PMP 项目管理专业认证', authority: 'PMI', validUntil: '2025-06', icon: Award, color: 'bg-orange-100 text-orange-600' },
    ]
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-colors">
          <ChevronLeft size={20} /> 返回
        </button>
        <div className="flex gap-4">
          <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded font-black text-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Download size={18} /> 下载 PDF
          </button>
          <button className="bg-indigo-600 text-white px-6 py-3 rounded font-black text-sm flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all">
            <Share2 size={18} /> 分享主页
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧边栏 */}
        <div className="lg:col-span-4 space-y-8">
          {/* 头像卡片 */}
          <div className="bg-white rounded p-10 border border-slate-100 card-shadow text-center">
            <div className="w-40 h-40 bg-indigo-600 text-white flex items-center justify-center text-5xl font-black rounded-lg shadow-2xl ring-8 ring-indigo-50 mx-auto mb-8">
              {mockProfile.name.charAt(0)}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{mockProfile.name}</h1>
            <p className="text-xl text-indigo-600 font-black mb-6">{mockProfile.role}</p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {mockProfile.skills.map((skill, i) => (
                <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded">{skill}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded">
                <div className="text-2xl font-black text-slate-900">{mockProfile.experienceYears}+</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">工作经验</div>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <div className="text-2xl font-black text-slate-900">98%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">面试通过率</div>
              </div>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="bg-white rounded p-10 border border-slate-100 card-shadow">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Mail className="text-indigo-600" size={20} /> 联系方式
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded flex items-center justify-center">
                  <Mail size={20} className="text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">邮箱</div>
                  <div className="text-slate-900 font-medium">zhangm***@email.com</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded flex items-center justify-center">
                  <Smartphone size={20} className="text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">手机</div>
                  <div className="text-slate-900 font-medium">138-****-xxxx</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded flex items-center justify-center">
                  <Globe size={20} className="text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">个人网站</div>
                  <div className="text-slate-900 font-medium">zhangm***.dev</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded flex items-center justify-center">
                  <Github size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">GitHub</div>
                  <div className="text-slate-900 font-medium">github.com/zhangm***</div>
                </div>
              </div>
            </div>
          </div>

          {/* 雷达图 */}
          <div className="bg-white rounded p-10 border border-slate-100 card-shadow">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <BarChart3 className="text-indigo-600" size={20} /> 能力雷达
            </h3>
            <RadarChart data={mockProfile.radarData} />
          </div>
        </div>

        {/* 右侧主要内容 */}
        <div className="lg:col-span-8 space-y-10">
          {/* 职业概述 */}
          <div className="bg-indigo-50 rounded p-8 border border-indigo-100">
            <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <Sparkles size={18} className="text-indigo-600" /> 关于我
            </h3>
            <p className="text-base leading-relaxed text-slate-900 font-medium">"{mockProfile.summary}"</p>
          </div>

          {/* 工作经历 */}
          <div className="bg-white rounded p-12 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
              <Briefcase size={24} className="text-indigo-600" /> 工作经历
            </h3>
            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
              {mockProfile.careerPath?.map((step, i) => (
                <div key={i} className="relative pl-12">
                  <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-4 border-indigo-600 flex items-center justify-center text-indigo-600 font-black z-10">{i + 1}</div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">{step.role}</h4>
                  <p className="text-sm font-bold text-indigo-600 mb-2">{step.timeframe}</p>
                  <p className="text-slate-500 font-medium">{step.requirement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 项目经验 */}
          <div className="bg-white rounded p-12 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
              <Rocket size={24} className="text-amber-600" /> 项目经验
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-lg border border-indigo-100">
                <div className="w-14 h-14 bg-indigo-600 rounded flex items-center justify-center mb-6 shadow-lg">
                  <Globe size={28} className="text-white" />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3">亿级用户电商平台</h4>
                <p className="text-sm text-slate-500 font-medium mb-4">主导前端架构升级，性能提升 40%</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg">React</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg">GraphQL</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg">微前端</span>
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-amber-50 to-white rounded-lg border border-amber-100">
                <div className="w-14 h-14 bg-amber-500 rounded flex items-center justify-center mb-6 shadow-lg">
                  <Bot size={28} className="text-white" />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3">AI 智能面试系统</h4>
                <p className="text-sm text-slate-500 font-medium mb-4">基于大语言模型的智能面试助手</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg">TypeScript</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg">Rust</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg">AI/ML</span>
                </div>
              </div>
            </div>
          </div>

          {/* 教育背景 */}
          <div className="bg-white rounded p-10 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <GraduationCap size={24} className="text-indigo-600" /> 教育背景
            </h3>
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-white rounded-lg border border-indigo-100">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-600 rounded flex items-center justify-center shadow-lg">
                  <GraduationCap size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-xl font-black text-slate-900">清华大学</h4>
                    <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-lg shadow-emerald-200">
                      <CheckCircle2 size={12} /> 已认证
                    </span>
                  </div>
                  <p className="text-indigo-600 font-bold mb-1">计算机科学与技术 硕士</p>
                  <p className="text-sm text-slate-400 font-medium">2014-2017</p>
                </div>
              </div>
            </div>
          </div>

          {/* 资历 */}
          <div className="bg-white rounded p-12 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
              <Award size={24} className="text-amber-600" /> 资历
            </h3>
            
            <div className="space-y-10">
              {/* 获奖 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Trophy size={20} className="text-amber-500" /> 获奖
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockProfile.awards?.map((award, i) => (
                    <div key={i} className="p-6 bg-gradient-to-br from-amber-50 to-white rounded border border-amber-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded flex items-center justify-center flex-shrink-0">
                          <award.icon size={24} className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-black text-slate-900 mb-1">{award.name}</h5>
                          <p className="text-sm text-slate-500 font-medium mb-2">{award.org} · {award.year}</p>
                          <p className="text-xs text-slate-400 font-medium">{award.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!mockProfile.awards || mockProfile.awards.length === 0) && (
                    <p className="text-sm text-slate-400 font-medium col-span-2">暂无获奖记录</p>
                  )}
                </div>
              </div>

              {/* 资格认证 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600" /> 资格认证
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockProfile.certifications?.map((cert, i) => (
                    <div key={i} className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded border border-emerald-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
                          <cert.icon size={24} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-black text-slate-900 mb-1">{cert.name}</h5>
                          <p className="text-sm text-slate-500 font-medium mb-2">{cert.issuer} · {cert.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!mockProfile.certifications || mockProfile.certifications.length === 0) && (
                    <p className="text-sm text-slate-400 font-medium col-span-2">暂无资格认证</p>
                  )}
                </div>
              </div>

              {/* 信用 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Verified size={20} className="text-indigo-600" /> 信用
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockProfile.credentials?.map((cred, i) => (
                    <div key={i} className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded border border-indigo-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0">
                          <cred.icon size={24} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-black text-slate-900 mb-1">{cred.name}</h5>
                          <p className="text-sm text-slate-500 font-medium mb-1">{cred.authority}</p>
                          {cred.validUntil && (
                            <p className="text-xs text-slate-400 font-medium">有效期至: {cred.validUntil}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!mockProfile.credentials || mockProfile.credentials.length === 0) && (
                    <p className="text-sm text-slate-400 font-medium col-span-2">暂无信用记录</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 智能体评价 */}
          <div className="bg-indigo-600 rounded-lg p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <Users size={20} className="text-indigo-300" /> AI 智能体评价
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockProfile.agentFeedbacks?.map((fb, i) => (
                <div key={i} className="p-4 bg-white/10 rounded">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{fb.agentName}</span>
                    <span className="text-xl font-black text-white">{fb.score}</span>
                  </div>
                  <p className="text-xs text-indigo-100 leading-relaxed font-medium italic">"{fb.comment}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- 企业工作台 ---
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const collabItems = [
    { id: 'JD-2024-001', title: '高级 AI 工程师 · JD 润色', type: 'Position', members: ['Z', 'L'], status: 'Drafting with MAS', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'JD-2024-002', title: '企业雇主视频 · 内容策划', type: 'Content', members: ['A', 'W', 'K'], status: 'AI Scripting', icon: PenTool, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'JD-2024-003', title: '招聘画像调优 · 策略协同', type: 'Strategy', members: ['C'], status: 'Ready for Review', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">企业方</h1>
          <p className="text-slate-500 font-medium">AI 猎头智能体正在为您全天候工作</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/employer/home')} 
            className="bg-white border border-slate-200 text-slate-900 px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Building2 size={20} className="text-indigo-600" /> 企业主页
          </button>
          <button 
            onClick={() => navigate('/employer/post')}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-200 active:scale-95 transition-all"
          >
            <Plus size={20}/> 开始招聘
          </button>
        </div>
      </div>

      <div className="w-full bg-white p-8 rounded-lg border border-slate-100 card-shadow relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Brain size={120} /></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
           <h3 className="text-xl font-black flex items-center gap-3 text-slate-900">
             <Database size={20} className="text-indigo-500" /> 企业画像 Memory
           </h3>
           <button 
             onClick={() => navigate('/employer/memory')}
             className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-black text-indigo-600 flex items-center gap-1.5 transition-all active:scale-95 group"
           >
             <Pin size={12} className="group-hover:rotate-45 transition-transform" /> 记忆管理
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
           {ENTERPRISE_MEMORIES.map(memory => (
              <div key={memory.id} className={`p-4 rounded-lg border bg-slate-50 ${memory.color}`}>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black uppercase tracking-wider">{memory.type}</span>
                    <span className="text-xs text-slate-400 font-mono">{memory.date}</span>
                 </div>
                 <p className="text-sm text-slate-600 leading-relaxed">"{memory.content}"</p>
              </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          
          {/* 修改：职位列表 */}
          <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow relative overflow-hidden">
             <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <Layers className="text-indigo-600" /> 职位列表
             </h2>
             <div className="grid grid-cols-1 gap-4">
                {collabItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/employer/post/${item.id}`)}
                    className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded-md border border-slate-100 hover:border-indigo-200 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-5 w-full md:w-auto">
                       <div className={`w-12 h-12 ${item.bg} ${item.color} rounded flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <item.icon size={24} />
                       </div>
                       <div>
                          <div className="text-sm font-black text-slate-800 tracking-tight">{item.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs font-black uppercase text-indigo-500/80 bg-indigo-50 px-1.5 py-0.5 rounded">{item.type}</span>
                             <span className="text-xs font-medium text-slate-400 italic">{item.status}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                       <div className="flex -space-x-2">
                          {item.members.map((m, mIdx) => (
                            <div key={mIdx} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-sm">{m}</div>
                          ))}
                          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-black text-slate-400">+</div>
                       </div>
                       <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><MessageSquare size={18} /></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* 修改：人才库功能列表 */}
          <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow overflow-hidden">
             <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
               <Users2 className="text-indigo-600" /> 人才库
             </h2>
             <div className="space-y-4">
                {MOCK_TALENTS.map((talent, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded border border-slate-100 group hover:border-indigo-300 transition-all">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                       <div className="w-14 h-14 bg-indigo-600 text-white flex items-center justify-center text-xl font-black rounded shadow-lg ring-4 ring-indigo-50 group-hover:scale-105 transition-transform">
                          {talent.name.charAt(0)}
                       </div>
                       <div>
                          <div className="text-base font-black text-slate-900 tracking-tight">{talent.name}</div>
                          <div className="text-xs font-bold text-slate-500 mt-0.5">{MOCK_JOBS.find(j => j.id === talent.targetJobId)?.title}</div>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                               <Zap size={10} /> {talent.matchScore}% 匹配
                             </span>
                             <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">
                               <Database size={10} /> {talent.tokensConsumed || 0} Tokens
                             </span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                       <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                             <span className="text-xs font-black text-slate-700">{talent.status}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">评估实时进行中</div>
                       </div>
                       <button 
                         onClick={() => navigate(`/employer/talent/${talent.id}`)}
                         className="p-3 bg-white text-indigo-600 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                       >
                         <ChevronRight size={18} />
                       </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => navigate('/employer/talent-pool')}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    查看全部 <ChevronRight size={14} />
                  </button>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow">
             <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-600" /> 实时招聘情报</h3>
             <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-slate-50 rounded group cursor-pointer hover:bg-slate-100 transition-all">
                   <div className="w-10 h-10 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform"><Sparkles size={18} /></div>
                   <div>
                      <p className="text-xs text-slate-600 leading-relaxed">Agent-Beta 在 Github 发现一名高匹配潜力的开源项目贡献者。</p>
                      <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">5分钟前</span>
                   </div>
                </div>
                <div className="flex gap-4 p-4 bg-slate-50 rounded group cursor-pointer hover:bg-slate-100 transition-all">
                   <div className="w-10 h-10 bg-emerald-100 rounded flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform"><CheckCircle2 size={18} /></div>
                   <div>
                      <p className="text-xs text-slate-600 leading-relaxed">职位 "高级 AI 工程师" 已成功对接 3 名 A+ 级候选人。</p>
                      <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">12分钟前</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white rounded-lg border border-slate-100 card-shadow overflow-hidden">
             <div className="grid grid-cols-1 divide-y divide-slate-100">
               {[
                 { label: '平均招聘周期', value: '42.5 小时', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                 { label: '匹配成功率', value: '91.2%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 { label: '总 Token 消耗', value: '1.2M', icon: Cpu, color: 'text-amber-500', bg: 'bg-amber-50' }
               ].map((card, i) => (
                 <div key={i} className="p-6 flex items-center gap-6">
                   <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.bg}`}>
                     <card.icon className={card.color} size={24}/>
                   </div>
                   <div>
                     <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{card.label}</div>
                     <div className="text-2xl font-black text-slate-900">{card.value}</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 企业主页页面 ---
const EnterpriseHomeView = () => {
  const navigate = useNavigate();
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <button onClick={() => navigate('/employer')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group mb-8">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回管理后台
      </button>

      <div className="bg-white rounded shadow-2xl overflow-hidden border border-slate-100 relative">
        <div className="h-[280px] relative overflow-hidden">
           <div className="absolute inset-0 bg-indigo-600">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-slate-900 to-indigo-900/40 pointer-events-none"></div>
              <div className="grid grid-cols-12 h-full opacity-[0.15]">
                 {[...Array(12)].map((_, i) => <div key={i} className="border-r border-white/10 h-full"></div>)}
              </div>
           </div>
           <div className="absolute bottom-0 left-0 w-full p-12 text-white flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="flex items-center gap-8">
                 <div className="w-32 h-32 bg-white rounded p-8 shadow-2xl border-4 border-indigo-500/20 flex-shrink-0">
                    <Zap className="text-indigo-600 w-full h-full" />
                 </div>
                 <div>
                    <div className="inline-flex items-center gap-2 bg-indigo-500/30 px-3 py-1 rounded-full text-indigo-200 text-xs font-black mb-3 uppercase tracking-widest border border-indigo-400/20 backdrop-blur-sm">
                       <Globe size={12} /> AI 驱动型先锋企业
                    </div>
                    <h1 className="text-5xl font-black mb-1 tracking-tight">得若智能科技</h1>
                    <p className="text-xl text-indigo-100/70 font-medium">Devnors Tech · 重塑数字化时代的生产力纽带</p>
                 </div>
              </div>
              <div className="flex gap-4 mb-2">
                 <button className="bg-white text-slate-900 px-7 py-3.5 rounded font-black hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center gap-2">
                    <Mail size={18} /> 投递简历
                 </button>
                 <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3.5 rounded font-black hover:bg-white/20 transition-all flex items-center gap-2">
                    <Share2 size={18} /> 关注
                 </button>
              </div>
           </div>
        </div>

        <div className="p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
           <div className="lg:col-span-8 space-y-16">
              <section>
                 <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div> 企业使命与愿景
                 </h2>
                 <p className="text-lg text-slate-700 leading-relaxed font-medium mb-10 italic">
                    “我们不只是在招聘员工，我们是在寻找共同定义未来生产力的数字合伙人。在得若，人类智慧与多智能体系统深度耦合，创造前所未有的商业价值。”
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-50 rounded-md border border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group">
                       <Compass className="text-indigo-600 mb-6 group-hover:scale-110 transition-transform" size={28} />
                       <h3 className="text-lg font-bold mb-3">技术哲学</h3>
                       <p className="text-slate-500 text-sm leading-relaxed">坚持‘智能体原生’ (Agent-Native) 理念，将 AI 深度集成到研发、管理与决策的每一个毛细血管中。</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-md border border-slate-100 hover:bg-white hover:shadow-lg hover:border-emerald-100 transition-all group">
                       <Layers className="text-emerald-600 mb-6 group-hover:scale-110 transition-transform" size={28} />
                       <h3 className="text-lg font-bold mb-3">协作生态</h3>
                       <p className="text-slate-500 text-sm leading-relaxed">打造极度透明、数据驱动的扁平化环境。每一位员工都拥有调动全局智能体资源的权限。</p>
                    </div>
                 </div>
              </section>

              {/* 企业资质与荣誉板块 */}
              <section>
                 <div className="flex items-baseline justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div> 企业资质与实力背书
                    </h2>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Trust & Credentials</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {MOCK_QUALIFICATIONS.map((q) => (
                      <div key={q.id} className="p-7 bg-white border border-slate-100 rounded-md card-shadow flex gap-5 group hover:border-indigo-200 transition-all hover:-translate-y-1">
                         <div className={`w-14 h-14 ${q.bg} ${q.color} rounded flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform shadow-sm`}>
                            <q.icon size={28} />
                         </div>
                         <div>
                            <h4 className="text-md font-black text-slate-900 mb-1.5">{q.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{q.description}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              <section>
                 <div className="flex items-baseline justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div> 核心开放职位
                    </h2>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">{MOCK_JOBS.length} POSITIONS OPEN</span>
                 </div>
                 <div className="space-y-4">
                    {MOCK_JOBS.map(job => (
                       <div 
                          key={job.id} 
                          onClick={() => navigate(`/candidate/job/${job.id}`, { state: { job } })}
                          className="p-7 bg-white border border-slate-100 rounded card-shadow flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-300 transition-all cursor-pointer"
                       >
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                                {job.matchScore > 90 && <span className="bg-amber-100 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Hot Pick</span>}
                             </div>
                             <div className="flex flex-wrap gap-4 text-slate-400 text-xs font-bold mb-4">
                                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-indigo-400" /> {job.location}</span>
                                <span className="flex items-center gap-1.5"><CircleDollarSign size={14} className="text-amber-500" /> {job.salary}</span>
                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-300" /> 2小时前发布</span>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {job.tags.map((tag, tIdx) => (
                                  <span key={tIdx} className="bg-slate-50 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-tighter">{tag}</span>
                                ))}
                             </div>
                          </div>
                          <button 
                             onClick={(e) => { e.stopPropagation(); navigate(`/candidate/job/${job.id}`, { state: { job } }); }}
                             className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded font-black shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group-hover:scale-105 group-hover:shadow-indigo-200"
                          >
                             申请 <ArrowRight size={18} />
                          </button>
                       </div>
                    ))}
                    <button className="w-full py-5 bg-slate-50 text-slate-400 text-xs font-black rounded border border-dashed border-slate-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all uppercase tracking-widest">
                       查看所有职位列表
                    </button>
                 </div>
              </section>
           </div>

           <div className="lg:col-span-4 space-y-10">
              <div className="bg-indigo-600 p-10 rounded-lg text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Activity size={120} /></div>
                 <h3 className="text-xl font-black mb-8 border-b border-white/5 pb-4">雇主数据洞察</h3>
                 <div className="space-y-8 relative z-10">
                    <div>
                       <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">文化匹配满意度</div>
                       <div className="text-3xl font-black flex items-baseline gap-1">98.2 <span className="text-xs font-bold text-indigo-300">%</span></div>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">平均晋升周期</div>
                       <div className="text-3xl font-black flex items-baseline gap-1">1.2 <span className="text-xs font-bold text-indigo-300">YEARS</span></div>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">团队规模</div>
                       <div className="text-3xl font-black flex items-baseline gap-1">120+ <span className="text-xs font-bold text-indigo-300">MEMBERS</span></div>
                    </div>
                    <div className="pt-6 border-t border-white/10 text-xs text-slate-500 italic leading-relaxed">
                       “Agent 评估：该企业具有极高的人才留存率与技术向心力。”
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 rounded-lg border border-slate-100">
                 <h3 className="text-lg font-black mb-8 flex items-center gap-2 text-slate-900"><MapPin className="text-indigo-600" /> 总部位置</h3>
                 <div className="bg-slate-200 h-40 rounded-lg mb-6 flex items-center justify-center text-slate-400 font-bold shadow-inner relative group cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-indigo-600/0 transition-colors"></div>
                    [ 高德/Google Map 组件 ]
                 </div>
                 <p className="text-sm font-bold text-slate-700 mb-2">上海 · 张江高科技园区</p>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">得若智能中心 A 座 12-18 层</p>
              </div>
              </div>
           </div>
      </div>
    </div>
  );
};

// --- 真正独立且详细的人才详情页 (TalentDetailView) ---
const TalentDetailView = () => {
  const { talentId } = useParams();
  const navigate = useNavigate();
  const talent = useMemo(() => MOCK_TALENTS.find(t => t.id === talentId), [talentId]);

  if (!talent) {
    return (
      <div className="pt-40 text-center animate-pulse">
        <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold">正在调取多智能体评估档案...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-10 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回工作台
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
           {/* 顶部档案卡片 */}
           <div className="bg-white rounded p-12 border border-slate-100 card-shadow flex flex-col md:flex-row gap-10 items-center">
              <div className="w-40 h-40 bg-indigo-600 text-white flex items-center justify-center text-5xl font-black rounded-lg shadow-2xl ring-8 ring-indigo-50">
                 {talent.name.charAt(0)}
              </div>
              <div className="flex-1 text-center md:text-left">
                 <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">{talent.name}</h1>
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
                       <Zap size={14} /> 匹配分 {talent.matchScore}%
                    </span>
                 </div>
                 <p className="text-xl text-indigo-600 font-black mb-6">{talent.role} · {talent.experienceYears} 年实战经验</p>
                 <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {talent.skills.map((s, i) => (
                       <span key={i} className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded border border-slate-100">{s}</span>
                    ))}
                 </div>
              </div>
           </div>

           {/* AI 智能画像综述 */}
           <div className="bg-indigo-50 rounded-xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden">
              <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-200" />
              <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-3 relative z-10">
                 <Bot size={24} className="text-indigo-600" /> AI 智能画像综述
              </h3>
              <p className="text-base leading-relaxed text-indigo-800 font-medium relative z-10">
                 “{talent.summary}”
              </p>
              <div className="mt-6 pt-4 border-t border-indigo-200 flex flex-wrap gap-6 relative z-10">
                 <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">活跃状态</div>
                    <div className="text-sm font-black text-indigo-700">{talent.status}</div>
                 </div>
                 <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Token 消耗</div>
                    <div className="text-sm font-black text-indigo-700">{talent.tokensConsumed}</div>
                 </div>
              </div>
           </div>

           {/* 人企交互记录 */}
           <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                 <Building2 size={22} className="text-indigo-600" /> 我司交互记录
              </h3>
              <div className="space-y-4">
                 {[
                    { type: '投递', time: '2024-01-02', detail: '主动投递 高级AI工程师', status: '已完成', icon: 'Send', color: 'bg-emerald-100 text-emerald-600' },
                    { type: '查看', time: '2024-01-03', detail: 'HR 查看简历', status: '已完成', icon: 'Eye', color: 'bg-blue-100 text-blue-600' },
                    { type: '面试', time: '2024-01-05', detail: 'AI 模拟面试', status: '已完成', icon: 'Users', color: 'bg-purple-100 text-purple-600' },
                    { type: '背调', time: '2024-01-08', detail: '背景调查', status: '已完成', icon: 'ShieldCheck', color: 'bg-amber-100 text-amber-600' },
                    { type: '入职', time: '2024-01-15', detail: '发放 Offer', status: '待确认', icon: 'FileCheck', color: 'bg-rose-100 text-rose-600' },
                 ].map((record, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${record.color.split(' ')[0]}`}>
                          {record.type === '投递' && <Send size={18} className={record.color.split(' ')[1]} />}
                          {record.type === '查看' && <Eye size={18} className={record.color.split(' ')[1]} />}
                          {record.type === '面试' && <Users size={18} className={record.color.split(' ')[1]} />}
                          {record.type === '背调' && <ShieldCheck size={18} className={record.color.split(' ')[1]} />}
                          {record.type === '入职' && <FileCheck size={18} className={record.color.split(' ')[1]} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-slate-900 text-sm">{record.type}</span>
                             <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                record.status === '已完成' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                             }`}>
                                {record.status}
                             </span>
                          </div>
                          <div className="text-xs text-slate-500">{record.detail}</div>
                       </div>
                       <div className="text-xs text-slate-400 font-medium">{record.time}</div>
                    </div>
                 ))}
              </div>
           </div>

           {/* 面试历史回顾 */}
           <div className="bg-white rounded p-12 border border-slate-100 card-shadow">
              <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                 <History className="text-indigo-600" /> 面试流程实录 (Interview Logs)
              </h3>
              <div className="space-y-8">
                 <div className="p-8 bg-slate-50 rounded border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                       <div className="font-black text-slate-900">AI 压力面试初试</div>
                       <div className="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full">通过 (Pass)</div>
                    </div>
                    <div className="space-y-4">
                       {talent.interviewQuestions?.map((q, i) => (
                          <div key={i} className="flex gap-4">
                             <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">Q{i+1}</div>
                             <p className="text-sm text-slate-600 font-medium">{q}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
           {/* 能力雷达图 */}
           <div className="bg-white rounded p-10 border border-slate-100 card-shadow">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                 <BarChart3 className="text-indigo-600" /> 核心竞争力雷达图
              </h3>
              <RadarChart data={talent.radarData} />
           </div>

           {/* 侧边信息条 - 候选人联系方式 */}
           <div className="bg-emerald-50 rounded-xl p-8 border border-emerald-100 shadow-sm">
              <h3 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-2">
                 <Phone className="text-emerald-600" /> 候选人联系方式
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-emerald-100">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                       <Mail size={18} className="text-emerald-600" />
                    </div>
                    <div>
                       <div className="text-xs text-emerald-600 font-bold uppercase">邮箱</div>
                       <div className="text-sm font-bold text-slate-900">{talent.email || 'chen.wei@email.com'}</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-emerald-100">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                       <Smartphone size={18} className="text-emerald-600" />
                    </div>
                    <div>
                       <div className="text-xs text-emerald-600 font-bold uppercase">手机</div>
                       <div className="text-sm font-bold text-slate-900">{talent.phone || '+86 138-xxxx-xxxx'}</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-emerald-100">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                       <MessageCircle size={18} className="text-emerald-600" />
                    </div>
                    <div>
                       <div className="text-xs text-emerald-600 font-bold uppercase">在线联系方式</div>
                       <div className="text-sm font-bold text-slate-900">WeChat: talent_{talent.name.charAt(0).toLowerCase()}{talent.id}</div>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                 <Send size={16} /> 立即联系
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 职位详情页 (JobPostDetailView) ---
const JobPostDetailView = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  
  const mockCandidates = [
    { id: 1, name: '陈伟', avatar: '陈', role: '高级 AI 工程师', matchScore: 98, status: '面试中', stage: '初试', time: '2024-01-10', tokens: 45200, tags: ['生成式 AI', 'Python', '智能体协同'] },
    { id: 2, name: '李芳', avatar: '李', role: '算法专家', matchScore: 82, status: '待审核', stage: '对标', time: '2024-01-08', tokens: 32100, tags: ['机器学习', '深度学习', 'NLP'] },
    { id: 3, name: '张明', avatar: '张', role: '技术专家', matchScore: 75, status: '已推荐', stage: '解析', time: '2024-01-05', tokens: 18500, tags: ['系统架构', '云原生', '微服务'] },
    { id: 4, name: '王芳', avatar: '王', role: '架构师', matchScore: 68, status: '待联系', stage: '投递', time: '2024-01-03', tokens: 12000, tags: ['分布式系统', 'Kubernetes', '大数据'] },
  ];
  
  const jobInfo = {
    title: '高级 AI 工程师',
    department: '技术研发中心',
    location: '上海 (远程)',
    salary: '¥50k - ¥80k',
    type: '全职',
    applicants: 156,
    hires: 3,
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case '面试中': return 'bg-amber-100 text-amber-700';
      case '待审核': return 'bg-slate-100 text-slate-600';
      case '已推荐': return 'bg-blue-100 text-blue-700';
      case '待联系': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };
  
  const getStageColor = (stage: string) => {
    switch (stage) {
      case '初试': return 'text-indigo-600';
      case '对标': return 'text-purple-600';
      case '解析': return 'text-emerald-600';
      case '投递': return 'text-slate-500';
      default: return 'text-slate-500';
    }
  };
  
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate('/employer')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回职位列表
      </button>
      
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-8">
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">招聘中</span>
                <span className="text-xs text-slate-400">职位 ID: {postId || 'JD-2024-001'}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">{jobInfo.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Building2 size={14} /> {jobInfo.department}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {jobInfo.location}</span>
                <span className="flex items-center gap-1"><CircleDollarSign size={14} /> {jobInfo.salary}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {jobInfo.type}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4">
                <div className="text-2xl font-black text-indigo-600">{jobInfo.applicants}</div>
                <div className="text-xs text-slate-400">投递人数</div>
              </div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="text-center px-4">
                <div className="text-2xl font-black text-emerald-600">{jobInfo.hires}</div>
                <div className="text-xs text-slate-400">已录用</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 p-4 bg-slate-50 border-b border-slate-100">
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
            <Send size={14} /> 分享职位
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Edit3 size={14} /> 编辑职位
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Download size={14} /> 导出报表
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Users size={22} className="text-indigo-600" /> 求职者列表
          </h2>
          <div className="flex items-center gap-3">
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option>全部状态</option>
              <option>面试中</option>
              <option>待审核</option>
              <option>已推荐</option>
            </select>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option>匹配分从高到低</option>
              <option>时间从近到远</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">求职者</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">匹配度</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">当前阶段</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">投递时间</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Token 消耗</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black">
                        {candidate.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{candidate.name}</div>
                        <div className="text-xs text-slate-500">{candidate.role}</div>
                        <div className="flex gap-1 mt-1">
                          {candidate.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 relative">
                        <svg className="transform -rotate-90 w-full h-full">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#6366f1" strokeWidth="4"
                            strokeDasharray={`${candidate.matchScore * 1.26} 126`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-600">{candidate.matchScore}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${getStageColor(candidate.stage)}`}>{candidate.stage}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{candidate.time}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{candidate.tokens.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/employer/talent/${candidate.id}`)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <MessageSquare size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            共 <span className="font-medium text-slate-900">4</span> 位求职者
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded hover:bg-slate-200 transition-colors">上一页</button>
            <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded">1</button>
            <button className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded hover:bg-slate-200 transition-colors">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 记忆录入任务页 (MemoryInputView) ---
const MemoryInputView = () => {
  const navigate = useNavigate();
  const [memoryType, setMemoryType] = useState('culture');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const memoryTypes = [
    { id: 'culture', name: '文化偏好', icon: Heart, color: 'bg-rose-100 text-rose-600', desc: '企业文化、价值观、用人理念' },
    { id: 'tech', name: '技术要求', icon: Cpu, color: 'bg-indigo-100 text-indigo-600', desc: '技术栈、编程语言、框架要求' },
    { id: 'skill', name: '能力模型', icon: Target, color: 'bg-emerald-100 text-emerald-600', desc: '核心能力、软硬技能要求' },
    { id: 'experience', name: '经验偏好', icon: Clock, color: 'bg-amber-100 text-amber-600', desc: '工作年限、行业背景、项目经验' },
    { id: 'salary', name: '薪酬福利', icon: CircleDollarSign, color: 'bg-green-100 text-green-600', desc: '薪资范围、奖金、期权、福利' },
    { id: 'location', name: '工作地点', icon: MapPin, color: 'bg-sky-100 text-sky-600', desc: '城市、远程、办公地址' },
    { id: 'reporting', name: '汇报关系', icon: Users2, color: 'bg-violet-100 text-violet-600', desc: '汇报对象、下属人数' },
    { id: 'team', name: '团队规模', icon: Users, color: 'bg-teal-100 text-teal-600', desc: '团队人数、成员构成' },
  ];
  
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };
  
  const handleReset = () => {
    setContent('');
    setSubmitted(false);
  };
  
  if (submitted) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto animate-in fade-in duration-500">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回
        </button>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkle className="text-emerald-600" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">记忆录入成功</h2>
          <p className="text-slate-500 mb-8">AI Agent 已成功学习并固化此条记忆，将用于后续的招聘决策辅助。</p>
          
          <div className="bg-indigo-50 rounded-lg p-6 mb-8">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">AI 任务执行摘要</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">记忆类型</span>
                <span className="font-medium text-slate-900">{memoryTypes.find(t => t.id === memoryType)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token 消耗</span>
                <span className="font-medium text-slate-900">2,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">影响范围</span>
                <span className="font-medium text-slate-900">全局 (All Candidates)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">处理耗时</span>
                <span className="font-medium text-slate-900">1.2s</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button onClick={handleReset} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors">
              继续录入
            </button>
            <button onClick={() => navigate('/employer/memory')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              查看记忆库
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回
      </button>
      
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Brain size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black">手动录入新记忆</h1>
              <p className="text-indigo-200 text-sm">为企业画像注入新的记忆与偏好</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">选择记忆类型</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {memoryTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMemoryType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    memoryType === type.id 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center mb-3`}>
                    <type.icon size={20} />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{type.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">记忆内容</h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`请输入${memoryTypes.find(t => t.id === memoryType)?.name}相关的内容...`}
              className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-lg font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  AI 处理中...
                </>
              ) : (
                <>
                  <Sparkle size={20} />
                  提交记忆
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            AI Agent 已就绪，等待学习新记忆
          </div>
          <div className="text-xs text-slate-400">
            预计消耗: 约 2,000-5,000 Token
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 修改后的登录视图 (LoginView) ---
const LoginView = () => (
  <div className="pt-40 pb-20 px-6 max-md mx-auto min-h-screen">
    <div className="bg-white rounded-lg p-12 shadow-2xl border border-slate-100 text-center max-w-md mx-auto relative overflow-hidden">
       {/* 品牌装饰 */}
       <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600"></div>
       
       <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100 rotate-6 transition-transform hover:rotate-0">
         <Zap className="text-white" size={40}/>
       </div>
       <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">欢迎回来</h2>
       <p className="text-slate-400 text-sm font-medium mb-10 uppercase tracking-widest">智能招聘空间入口</p>
       
       {/* 手机号登录 */}
       <div className="space-y-4 mb-10">
          <input type="tel" className="w-full bg-slate-50 border border-slate-100 rounded py-4 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:outline-none transition-all" placeholder="请输入手机号" />
          <div className="flex gap-2">
            <input type="text" className="flex-1 bg-slate-50 border border-slate-100 rounded py-4 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:outline-none transition-all" placeholder="验证码" />
            <button className="bg-white border border-slate-200 text-indigo-600 px-4 rounded text-xs font-black whitespace-nowrap hover:bg-slate-50">获取验证码</button>
          </div>
          <button className="w-full bg-indigo-600 text-white font-black py-5 rounded shadow-xl shadow-indigo-200 active:scale-98 transition-all mt-4 hover:bg-indigo-700 hover:shadow-2xl">手机快捷登录</button>
       </div>

       {/* 第三方登录分割线 */}
       <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">其他快捷入口</span>
          <div className="h-px bg-slate-100 flex-1"></div>
       </div>

       {/* 第三方按钮 */}
       <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 py-3.5 border border-slate-100 bg-white rounded hover:bg-slate-50 transition-all group active:scale-95">
             <div className="p-1.5 bg-black text-white rounded-lg"><GithubIcon size={16} /></div>
             <span className="text-xs font-black text-slate-700">GitHub</span>
          </button>
          <button className="flex items-center justify-center gap-3 py-3.5 border border-slate-100 bg-white rounded hover:bg-emerald-50 transition-all group active:scale-95">
             <div className="p-1.5 bg-emerald-500 text-white rounded-lg"><MessageCircle size={16} /></div>
             <span className="text-xs font-black text-slate-700">微信登录</span>
          </button>
       </div>

       <p className="mt-12 text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Devnors Auth Gateway</p>
    </div>
  </div>
);

interface TaskItem {
  id: string;
  title: string;
  status: 'running' | 'completed' | 'pending';
  time: string;
  icon: string;
  priority?: string;
  source?: string;
  type?: string;
}

const MOCK_TASKS: TaskItem[] = [
  { id: 'todo1', title: '解析候选人简历', status: 'running', time: '10:23', icon: 'UserIcon', priority: 'High', source: 'agent', type: 'candidate' },
  { id: 'todo2', title: '生成面试评估报告', status: 'running', time: '10:15', icon: 'Building2', priority: 'Medium', source: 'user', type: 'employer' },
  { id: 'todo3', title: '匹配岗位推荐', status: 'completed', time: '10:00', icon: 'Calendar', priority: 'Low', source: 'agent', type: 'system' },
  { id: 'todo4', title: '薪资对标分析', status: 'completed', time: '09:45', icon: 'Calendar', priority: 'Medium', source: 'agent', type: 'system' },
  { id: 'todo5', title: '技术能力评估', status: 'pending', time: '--:--', icon: 'UserIcon', priority: 'Medium', source: 'user', type: 'candidate' },
  { id: 'todo6', title: '生成人才画像', status: 'pending', time: '--:--', icon: 'UserIcon', priority: 'High', source: 'agent', type: 'candidate' },
];

// --- AI助手页面 (AIAssistantView) ---
const AIAssistantView = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: '您好！我是您的 AI 智能助手。我可以帮助您：\n\n• 解答招聘相关问题\n• 提供求职/招聘建议\n• 帮您分析职位匹配度\n• 优化简历和职位描述\n• 规划职业发展方向\n\n请问有什么可以帮您的？'}
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    setMessages(prev => [...prev, {role: 'user', content: inputMessage}]);
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `收到！我理解您想要了解"${inputMessage}"。让我为您分析一下...\n\n根据您的问题，我建议：\n\n1. 首先明确您的核心需求\n2. 我可以帮您搜索相关的职位或人才信息\n3. 实时为您提供专业的建议\n\n您希望我进一步帮您做什么？`
      }]);
      setIsTyping(false);
    }, 1000);
    setInputMessage('');
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex gap-6 h-[700px]">
        <div className="w-80 flex-shrink-0 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo size={16} className="text-indigo-600" />
                <span className="text-slate-800 font-bold text-sm tracking-wide">任务队列</span>
              </div>
              <button 
                onClick={() => navigate('/workbench/todos')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
              >
                任务中心
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-60px)] scrollbar-hide">
            {MOCK_TASKS.map(task => (
              <div 
                key={task.id} 
                className="group cursor-pointer p-6 bg-slate-50 rounded border border-slate-100 flex items-center gap-4 hover:bg-white hover:border-indigo-200 transition-all"
                onClick={() => {
                  const existingTodo = MOCK_TODOS.find(t => t.id === task.id);
                  if (existingTodo) {
                    navigate(`/workbench/todo/${task.id}`);
                  } else {
                    navigate(`/workbench/todo/new?task=${encodeURIComponent(task.title)}`);
                  }
                }}
              >
                <div className={`w-12 h-12 rounded flex items-center justify-center flex-shrink-0 ${
                  task.status === 'running' ? 'bg-amber-100 text-amber-600' : 
                  task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-slate-200'
                } group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
                  {task.icon === 'UserIcon' ? (
                    <UserIcon size={20} />
                  ) : task.icon === 'Building2' ? (
                    <Building2 size={20} />
                  ) : (
                    <Calendar size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                    {task.status === 'running' ? (
                      <Loader2 size={12} className="animate-spin text-amber-500" />
                    ) : task.status === 'completed' ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <Clock size={12} className="text-slate-400" />
                    )}
                    {task.status === 'running' ? '执行中' : 
                     task.status === 'completed' ? '已完成' : '待执行'}
                  </div>
                  <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors mb-1">{task.title}</div>
                  <div className="flex items-center gap-2">
                    {task.priority && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                    {task.source && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        task.source === 'agent' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {task.source === 'agent' ? 'Agent' : '我创建'}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-2xl relative">
          <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 backdrop-blur-sm flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-white font-black text-sm tracking-wide uppercase">AI 智能助手</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">模型: Gemini 3 Pro</span>
              <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="重置对话">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-slate-900 h-[calc(100%-240px)]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-indigo-800 border border-indigo-700'}`}>
                  {msg.role === 'user' ? <UserIcon size={18} className="text-white" /> : <Bot size={18} className="text-indigo-400" />}
                </div>
                <div className={`px-5 py-4 rounded-md text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-indigo-700/90 text-white rounded-tl-none border border-indigo-600 backdrop-blur-sm'}`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 animate-in fade-in">
              <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center border border-slate-600">
                <Loader2 className="animate-spin text-indigo-400" size={18} />
              </div>
              <div className="px-5 py-4 bg-slate-700/50 rounded-md rounded-tl-none border border-slate-600">
                <span className="text-white font-mono text-xs italic">正在分析任务上下文并执行智能体操作...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-5 bg-slate-800/60 border-t border-slate-700 backdrop-blur-md">
          <div className="flex gap-3 bg-slate-700 rounded-lg p-3 border border-slate-600 shadow-lg">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入指令，让 AI 助手帮您完成任务..."
              className="flex-1 bg-transparent border-none rounded-lg px-4 py-3 text-sm text-white focus:outline-none placeholder:text-slate-400/60"
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-lg"
            >
              <Send size={18} /> 发送
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["帮我分析目前的瓶颈", "生成执行计划", "推荐相关人才", "优化职位描述"].map((suggest, sIdx) => (
              <button 
                key={sIdx}
                onClick={() => { setInputMessage(suggest); }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
      </div>
  );
};

// --- 求职申请任务详情页 (ApplyDetailView) ---
const ApplyDetailView = () => {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState(MOCK_JOBS[0]);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: '您好！我是您的求职智能助手。我可以帮您优化简历、分析职位匹配度，以及准备面试。请问有什么可以帮您的？'}
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    setIsAnalyzing(true);
    setAiMessages(prev => [...prev, {role: 'user', content: `请分析我的简历：${resumeText.substring(0, 100)}...`}]);
    
    setTimeout(() => {
      setAnalysisResult(`简历分析完成！您的背景与"${selectedJob.title}"岗位的匹配度约为 85%。主要优势：${resumeText.includes('React') ? 'React 生态经验' : ''}、${resumeText.includes('TypeScript') ? 'TypeScript 能力' : ''}。建议：可以加强 AI 方向的项目经验描述。`);
      setAiMessages(prev => [...prev, {role: 'assistant', content: '简历分析完成！您的背景与该岗位的匹配度约为 85%。主要优势包括技术栈匹配度高、项目经验丰富。建议您可以在简历中突出 AI 方向的项目经验。'}]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setAiMessages(prev => [...prev, {role: 'user', content: inputMessage}]);
    setInputMessage('');
    
    setTimeout(() => {
      const responses = [
        '我可以帮您优化这个项目的描述，突出技术难点和创新点。',
        '针对这个职位，我建议您准备以下几个面试题：...',
        '您的简历整体结构很好，建议在项目经历部分增加量化成果。',
        '好的，我已经记录了这些偏好，会在后续的职位推荐中为您精准匹配。'
      ];
      setAiMessages(prev => [...prev, {role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)]}]);
    }, 1000);
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate('/candidate')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回控制台
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h1 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Rocket size={20} className="text-emerald-600" /> 求职申请任务
            </h1>
            <p className="text-xs text-slate-500 mb-4">上传简历并与 AI 助手一起优化您的求职材料</p>
            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" /> 上传简历
            </h2>
            <textarea 
              className="w-full h-40 bg-slate-50 border border-slate-200 rounded p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mb-3 text-xs font-medium leading-relaxed resize-none" 
              placeholder="请粘贴您的简历内容，Devnors 智能体将为您分析简历与目标职位的匹配度..." 
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !resumeText.trim()}
                className="bg-emerald-600 text-white px-4 py-2 rounded font-black flex items-center gap-2 shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                {isAnalyzing ? 'AI 生成中...' : 'AI生成简历'}
              </button>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded font-black flex items-center gap-2 hover:bg-slate-50 transition-all text-xs">
                <Upload size={14} /> 上传文件
              </button>
            </div>
          </div>

          {analysisResult && (
            <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 p-6 rounded-lg border border-emerald-100">
              <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                <Sparkle size={18} className="text-amber-500" /> AI 分析结果
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">{analysisResult}</p>
            </div>
          )}

          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Target size={18} className="text-rose-600" /> 目标职位
            </h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Briefcase size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedJob.title}</h3>
                  <p className="text-xs text-indigo-600 font-bold">{selectedJob.company}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedJob.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedJob.description}</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex flex-col h-[600px] shadow-2xl sticky top-8">
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 backdrop-blur-sm flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-white font-black text-sm tracking-wide uppercase">AI 求职助手</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">模型: Gemini 3 Pro</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex justify-${msg.role === 'user' ? 'end' : 'start'}`}>
                  <div className={`flex gap-3 max-w-[85%] flex-row ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-800 border border-emerald-700' : 'bg-indigo-800 border border-indigo-700'}`}>
                      {msg.role === 'user' ? <UserIcon size={14} className="text-emerald-400" /> : <Bot size={14} className="text-indigo-400" />}
                    </div>
                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600/90 text-white rounded-tr-none' : 'bg-indigo-700/90 text-white rounded-tl-none border border-indigo-600'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-800/60 border-t border-slate-700 backdrop-blur-md">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入您的问题..." 
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400/60"
                />
                <button 
                  onClick={handleSendMessage}
                  className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  onClick={() => setInputMessage('帮我优化简历中的项目描述')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  优化简历
                </button>
                <button 
                  onClick={() => setInputMessage('帮我准备面试常见问题')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  面试辅导
                </button>
                <button 
                  onClick={() => setInputMessage('分析我和目标职位的匹配度')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  匹配分析
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 招聘发布任务详情页 (EmployerPostView) ---
const EmployerPostView = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('tech');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: '您好！我是您的招聘智能助手。我可以帮您生成职位描述、优化招聘流程，以及筛选合适的候选人。请问有什么可以帮您的？'}
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    setIsGenerating(true);
    setAiMessages(prev => [...prev, {role: 'user', content: `请帮我生成职位描述：${jobDescription.substring(0, 100)}...`}]);
    
    setTimeout(() => {
      setGeneratedResult(`职位描述生成完成！我们为您生成了一个符合市场标准的 AI 工程师职位描述，包含岗位职责、任职要求和公司福利。预计可吸引 15-20 份高质量简历。`);
      setAiMessages(prev => [...prev, {role: 'assistant', content: '职位描述生成完成！我已根据您的需求生成了一个专业的职位描述。主要亮点包括：1) 突出 AI 技术栈要求 2) 明确岗位职责和发展空间 3) 强调公司福利和团队文化。建议发布后开启智能筛选功能。'}]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setAiMessages(prev => [...prev, {role: 'user', content: inputMessage}]);
    setInputMessage('');
    
    setTimeout(() => {
      const responses = [
        '我可以帮您优化这个职位描述，突出技术要点和团队优势。',
        '针对这个岗位，我建议添加以下筛选条件：...',
        '职位描述整体结构很好，建议增加一些公司文化的描述。',
        '好的，我已经记录了这些偏好，会在后续的候选人推荐中为您精准匹配。'
      ];
      setAiMessages(prev => [...prev, {role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)]}]);
    }, 1000);
  };

  const templates = [
    { id: 'tech', name: '技术岗', icon: Code, desc: '适合研发、算法等技术岗位' },
    { id: 'product', name: '产品岗', icon: Briefcase, desc: '适合产品经理、设计师' },
    { id: 'business', name: '业务岗', icon: TrendingUp, desc: '适合销售、运营等岗位' },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate('/employer')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回控制台
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h1 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <PlusCircle size={20} className="text-indigo-600" /> 招聘发布任务
            </h1>
            <p className="text-xs text-slate-500 mb-4">填写招聘需求并与 AI 助手一起优化职位描述</p>
            
            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" /> 选择模板
            </h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-2 rounded border transition-all ${
                    selectedTemplate === template.id 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <template.icon size={16} className="mx-auto mb-1" />
                  <span className="text-xs font-bold block">{template.name}</span>
                </button>
              ))}
            </div>

            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <PenTool size={16} className="text-indigo-600" /> 招聘需求
            </h2>
            <textarea 
              className="w-full h-40 bg-slate-50 border border-slate-200 rounded p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mb-3 text-xs font-medium leading-relaxed resize-none" 
              placeholder="请描述您的招聘需求，如：招聘高级 AI 工程师，要求有 3 年以上机器学习经验..." 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !jobDescription.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded font-black flex items-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {isGenerating ? 'AI 生成中...' : 'AI生成职位'}
              </button>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded font-black flex items-center gap-2 hover:bg-slate-50 transition-all text-xs">
                <Upload size={14} /> 上传文件
              </button>
            </div>
          </div>

          {generatedResult && (
            <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 p-6 rounded-lg border border-indigo-100">
              <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                <Sparkle size={18} className="text-amber-500" /> AI 生成结果
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">{generatedResult}</p>
            </div>
          )}

          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Target size={18} className="text-rose-600" /> 招聘统计
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-600">预计收到简历</span>
                <span className="text-sm font-black text-indigo-600">15-20 份</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-600">AI 匹配度</span>
                <span className="text-sm font-black text-emerald-600">85%+</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-600">预计招聘周期</span>
                <span className="text-sm font-black text-rose-600">7-14 天</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex flex-col h-[600px] shadow-2xl sticky top-8">
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 backdrop-blur-sm flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-white font-black text-sm tracking-wide uppercase">AI 招聘助手</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">模型: Gemini 3 Pro</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex justify-${msg.role === 'user' ? 'end' : 'start'}`}>
                  <div className={`flex gap-3 max-w-[85%] flex-row ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-800 border border-emerald-700' : 'bg-indigo-800 border border-indigo-700'}`}>
                      {msg.role === 'user' ? <UserIcon size={14} className="text-emerald-400" /> : <Bot size={14} className="text-indigo-400" />}
                    </div>
                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600/90 text-white rounded-tr-none' : 'bg-indigo-700/90 text-white rounded-tl-none border border-indigo-600'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-800/60 border-t border-slate-700 backdrop-blur-md">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入您的问题..." 
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400/60"
                />
                <button 
                  onClick={handleSendMessage}
                  className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  onClick={() => setInputMessage('帮我优化职位描述')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  优化职位
                </button>
                <button 
                  onClick={() => setInputMessage('帮我设置筛选条件')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  筛选条件
                </button>
                <button 
                  onClick={() => setInputMessage('生成面试题')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  面试题
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 邀请好友任务详情页 (InviteFriendView) ---
const InviteFriendView = () => {
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState('https://devnors.ai/register?ref=user123');
  const [copied, setCopied] = useState(false);
  const [inviteCount, setInviteCount] = useState(3);
  const [rewardTokens, setRewardTokens] = useState(1500);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: '您好！我是您的邀请助手。您已用完 Token？别担心！通过邀请好友注册，每成功邀请一位新用户，您将获得 500 Token 奖励。让我来教您如何轻松获取更多 Token！'}
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const messages = {
      twitter: `我正在使用 Devnors AI 招聘平台，帮我获得了 500 Token！快来加入吧：${inviteLink}`,
      linkedin: `发现了超棒的 AI 招聘平台 Devnors，现在注册还能获得 500 Token 奖励！${inviteLink}`,
      email: `我推荐你使用 Devnors AI 招聘平台，注册链接：${inviteLink}`
    };
    alert(`已准备分享到 ${platform}！\n\n${messages[platform as keyof typeof messages]}`);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setAiMessages(prev => [...prev, {role: 'user', content: inputMessage}]);
    setInputMessage('');
    
    setTimeout(() => {
      const responses = [
        '每成功邀请一位新用户注册并完成邮箱验证，您将获得 500 Token。好友也会获得 100 Token 作为欢迎礼物！',
        '您可以分享邀请链接到社交媒体、邮件或直接发送给好友。邀请链接是追踪您邀请的唯一凭证。',
        '目前您已邀请 3 位好友，获得 1500 Token。继续加油！被邀请的好友也能享受平台的高级功能。',
        'Token 可以用于 AI 简历分析、职位匹配、智能面试辅导等功能。邀请越多，奖励越多！'
      ];
      setAiMessages(prev => [...prev, {role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)]}]);
    }, 1000);
  };

  const rewards = [
    { count: 1, tokens: 500, icon: UserPlus, color: 'bg-emerald-500' },
    { count: 5, tokens: 2500, color: 'bg-indigo-500' },
    { count: 10, tokens: 5000, color: 'bg-amber-500' },
    { count: 20, tokens: 10000, color: 'bg-rose-500' },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate('/candidate')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回控制台
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h1 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Users2 size={20} className="text-emerald-600" /> 邀请好友任务
            </h1>
            <p className="text-xs text-slate-500 mb-4">邀请新用户注册，每位获得 500 Token 奖励</p>
            
            <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Coins size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">当前奖励</p>
                  <p className="text-lg font-black text-emerald-600">{rewardTokens} Tokens</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">已邀请</span>
                <span className="text-sm font-black text-slate-900">{inviteCount} 人</span>
              </div>
            </div>

            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <Link2 size={16} className="text-indigo-600" /> 您的邀请链接
            </h2>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                value={inviteLink}
                readOnly
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none"
              />
              <button 
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded font-bold text-xs transition-all ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>

            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <Share2 size={16} className="text-indigo-600" /> 分享到
            </h2>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => handleShare('twitter')}
                className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded flex items-center justify-center gap-1 transition-all"
              >
                <Twitter size={14} />
                <span className="text-xs font-bold">Twitter</span>
              </button>
              <button 
                onClick={() => handleShare('linkedin')}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-1 transition-all"
              >
                <Linkedin size={14} />
                <span className="text-xs font-bold">LinkedIn</span>
              </button>
              <button 
                onClick={() => handleShare('email')}
                className="flex-1 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded flex items-center justify-center gap-1 transition-all"
              >
                <Mail size={14} />
                <span className="text-xs font-bold">邮件</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Gift size={18} className="text-rose-600" /> 奖励阶梯
            </h2>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div 
                  key={reward.count}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    inviteCount >= reward.count ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${reward.color} rounded-full flex items-center justify-center`}>
                      <Users2 size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{reward.count} 人</span>
                  </div>
                  <span className={`text-sm font-black ${inviteCount >= reward.count ? 'text-emerald-600' : 'text-slate-400'}`}>
                    +{reward.tokens} Tokens
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex flex-col h-[600px] shadow-2xl sticky top-8">
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 backdrop-blur-sm flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-white font-black text-sm tracking-wide uppercase">邀请助手</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">模型: Gemini 3 Pro</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex justify-${msg.role === 'user' ? 'end' : 'start'}`}>
                  <div className={`flex gap-3 max-w-[85%] flex-row ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-800 border border-emerald-700' : 'bg-indigo-800 border border-indigo-700'}`}>
                      {msg.role === 'user' ? <UserIcon size={14} className="text-emerald-400" /> : <Bot size={14} className="text-indigo-400" />}
                    </div>
                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600/90 text-white rounded-tr-none' : 'bg-indigo-700/90 text-white rounded-tl-none border border-indigo-600'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-800/60 border-t border-slate-700 backdrop-blur-md">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入您的问题..." 
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400/60"
                />
                <button 
                  onClick={handleSendMessage}
                  className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  onClick={() => setInputMessage('如何获得更多 Token？')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  如何获得 Token
                </button>
                <button 
                  onClick={() => setInputMessage('我的邀请记录')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  邀请记录
                </button>
                <button 
                  onClick={() => setInputMessage('奖励什么时候到账？')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  到账时间
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- AI投递任务详情页 (AIDeliveryView) ---
const AIDeliveryView = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(RECOMMENDED_JOBS[0]);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'preparing' | 'delivering' | 'completed'>('idle');
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: '您好！我是 AI 投递助手。我将帮助您完成简历投递全流程，包括简历优化、求职信生成、投递策略规划等。'}
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleDelivery = async () => {
    setIsDelivering(true);
    setDeliveryStatus('preparing');
    setDeliveryProgress(0);
    
    setAiMessages(prev => [...prev, {role: 'user', content: `我想要投递 ${selectedJob.company} 的 ${selectedJob.title} 职位`}]);
    
    setTimeout(() => {
      setAiMessages(prev => [...prev, {role: 'assistant', content: `好的！我正在为您准备投递材料。首先分析该职位的核心需求...`}]);
    }, 500);

    const steps = [
      { progress: 20, message: '正在分析职位需求...' },
      { progress: 40, message: '正在优化您的简历...' },
      { progress: 60, message: '正在生成求职信...' },
      { progress: 80, message: '正在准备投递材料...' },
      { progress: 100, message: '投递准备完成！即将自动投递...' },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDeliveryProgress(steps[i].progress);
      setDeliveryStatus(i === steps.length - 1 ? 'completed' : 'delivering');
    }

    setIsDelivering(false);
    setAiMessages(prev => [...prev, {role: 'assistant', content: '投递成功！您的简历已发送至 HR 邮箱，预计 3-5 个工作日内收到回复。建议您准备好面试，随时关注平台通知。'}]);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setAiMessages(prev => [...prev, {role: 'user', content: inputMessage}]);
    setInputMessage('');
    
    setTimeout(() => {
      const responses = [
        '我可以帮您优化简历中的这个项目描述，突出您的核心贡献和技术难点。',
        '针对这个职位，我建议您在求职信中强调以下经验：...',
        '投递后您可以准备以下几个常见的面试问题：...',
        '好的，我会帮您跟踪投递状态，并在有新进展时及时通知您。'
      ];
      setAiMessages(prev => [...prev, {role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)]}]);
    }, 1000);
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate('/candidate/home')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h1 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Rocket size={20} className="text-emerald-600" /> AI 对接投递
            </h1>
            <p className="text-xs text-slate-500 mb-4">AI 全程陪伴，助您高效完成简历投递</p>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600" /> 目标职位
              </h2>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center shadow-sm text-xl font-bold border border-slate-100">
                  {selectedJob.logo}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-slate-900">{selectedJob.title}</h3>
                  <p className="text-xs text-indigo-600 font-bold">{selectedJob.company}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedJob.location}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs font-bold text-emerald-700">{selectedJob.match}% 匹配度</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600">{selectedJob.salary}</span>
              </div>
            </div>

            {deliveryStatus !== 'idle' && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600" /> 投递进度
                </h2>
                <div className="space-y-3">
                  {[
                    { step: 1, name: '分析职位需求', done: deliveryProgress >= 20 },
                    { step: 2, name: '优化简历', done: deliveryProgress >= 40 },
                    { step: 3, name: '生成求职信', done: deliveryProgress >= 60 },
                    { step: 4, name: '准备材料', done: deliveryProgress >= 80 },
                    { step: 5, name: '完成投递', done: deliveryProgress >= 100 },
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        s.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {s.done ? <CheckCircle2 size={12} /> : s.step}
                      </div>
                      <span className={`text-xs ${s.done ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleDelivery}
              disabled={isDelivering}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isDelivering ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> 投递中...
                </>
              ) : (
                <>
                  <Rocket size={16} /> 一键投递
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> 投递材料
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-indigo-600" />
                  <span className="text-xs font-medium text-slate-700">优化简历</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">已生成</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-rose-600" />
                  <span className="text-xs font-medium text-slate-700">求职信</span>
                </div>
                <span className={`text-xs font-bold ${deliveryProgress >= 60 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {deliveryProgress >= 60 ? '已生成' : '待生成'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-amber-600" />
                  <span className="text-xs font-medium text-slate-700">作品集</span>
                </div>
                <span className="text-xs font-bold text-slate-400">可选</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex flex-col h-[600px] shadow-2xl sticky top-8">
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 backdrop-blur-sm flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-white font-black text-sm tracking-wide uppercase">AI 投递助手</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">模型: Gemini 3 Pro</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex justify-${msg.role === 'user' ? 'end' : 'start'}`}>
                  <div className={`flex gap-3 max-w-[85%] flex-row ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-800 border border-emerald-700' : 'bg-indigo-800 border border-indigo-700'}`}>
                      {msg.role === 'user' ? <UserIcon size={14} className="text-emerald-400" /> : <Bot size={14} className="text-indigo-400" />}
                    </div>
                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600/90 text-white rounded-tr-none' : 'bg-indigo-700/90 text-white rounded-tl-none border border-indigo-600'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-800/60 border-t border-slate-700 backdrop-blur-md">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入您的问题..." 
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400/60"
                />
                <button 
                  onClick={handleSendMessage}
                  className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  onClick={() => setInputMessage('帮我优化简历')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  优化简历
                </button>
                <button 
                  onClick={() => setInputMessage('生成求职信')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  求职信
                </button>
                <button 
                  onClick={() => setInputMessage('准备面试问题')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-black text-slate-300 border border-slate-600 rounded-lg transition-colors"
                >
                  面试问题
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 人才库列表页 (TalentPoolView) ---
const TalentPoolView = () => {
  const navigate = useNavigate();
  const [selectedTalent, setSelectedTalent] = useState<any>(null);

  const talents = [
    {
      id: '1',
      name: '陈伟',
      initial: '陈',
      title: '高级 AI 工程师',
      match: 96,
      tokens: 4250,
      status: 'interviewing',
      statusText: 'AI 初试中',
      company: '得若智能科技',
      location: '北京',
      salary: '50-80K',
      tags: ['生成式 AI', 'Python', '智能体协同'],
      experience: '8年',
      education: '硕士',
      skills: ['PyTorch', 'LangChain', 'React', 'Rust', '大模型训练'],
      lastActive: '2小时前',
      appliedJobs: ['高级 AI 工程师', '算法科学家'],
      progress: 75,
    },
    {
      id: '2',
      name: '李芳',
      initial: '李',
      title: '产品设计主管',
      match: 89,
      tokens: 2840,
      status: 'screening',
      statusText: '简历筛选',
      company: '创意科技',
      location: '上海',
      salary: '35-55K',
      tags: ['产品设计', '用户体验', 'AI 产品'],
      experience: '6年',
      education: '本科',
      skills: ['Figma', 'AI 辅助设计', '用户研究', '产品规划'],
      lastActive: '5小时前',
      appliedJobs: ['产品设计主管'],
      progress: 30,
    },
    {
      id: '3',
      name: '张明',
      initial: '张',
      title: '全栈开发专家',
      match: 92,
      tokens: 5620,
      status: 'offer',
      statusText: '已发 offer',
      company: 'Devnors',
      location: '深圳',
      salary: '45-70K',
      tags: ['Rust', 'React', 'TypeScript', 'Web3'],
      experience: '7年',
      education: '硕士',
      skills: ['Rust', 'React', 'Web3.js', 'PostgreSQL', 'Docker'],
      lastActive: '1天前',
      appliedJobs: ['全栈开发专家', '技术架构师'],
      progress: 100,
    },
    {
      id: '4',
      name: '王芳',
      initial: '王',
      title: '大模型算法科学家',
      match: 94,
      tokens: 8930,
      status: 'interviewing',
      statusText: 'AI 面试中',
      company: 'AI Lab',
      location: '杭州',
      salary: '60-100K',
      tags: ['大模型', 'NLP', '深度学习'],
      experience: '5年',
      education: '博士',
      skills: ['Transformer', 'BERT', 'GPT', 'PyTorch', 'CUDA'],
      lastActive: '30分钟前',
      appliedJobs: ['大模型算法科学家', 'AI 研发负责人'],
      progress: 60,
    },
    {
      id: '5',
      name: '刘强',
      initial: '刘',
      title: 'AI 解决方案架构师',
      match: 88,
      tokens: 3200,
      status: 'new',
      statusText: '新入库',
      company: '云智科技',
      location: '北京',
      salary: '55-85K',
      tags: ['云计算', 'AI 架构', 'DevOps'],
      experience: '10年',
      education: '硕士',
      skills: ['AWS', 'Kubernetes', 'MLOps', 'AI Pipeline'],
      lastActive: '3小时前',
      appliedJobs: ['AI 解决方案架构师'],
      progress: 10,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interviewing': return 'bg-emerald-500';
      case 'screening': return 'bg-amber-500';
      case 'offer': return 'bg-indigo-500';
      case 'new': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'interviewing': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'screening': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'offer': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'new': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate('/employer')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回控制台
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-3 flex items-center gap-3">
          <Users2 size={28} className="text-indigo-600" /> 人才库
        </h1>
        <p className="text-slate-500 font-medium">管理和追踪所有候选人状态</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">共</span>
              <span className="text-lg font-black text-slate-900">{talents.length}</span>
              <span className="text-sm text-slate-500">位人才</span>
            </div>
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 bg-white border border-slate-200 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>全部状态</option>
                <option>AI 初试中</option>
                <option>简历筛选</option>
                <option>已发 offer</option>
                <option>新入库</option>
              </select>
            </div>
          </div>

          {talents.map((talent) => (
            <div 
              key={talent.id}
              onClick={() => setSelectedTalent(talent)}
              className={`p-6 bg-white rounded-lg border cursor-pointer transition-all ${
                selectedTalent?.id === talent.id 
                  ? 'border-indigo-300 shadow-lg ring-2 ring-indigo-100' 
                  : 'border-slate-100 hover:border-indigo-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 text-white flex items-center justify-center text-xl font-black rounded shadow-lg ring-4 ring-indigo-50 ${
                    selectedTalent?.id === talent.id ? 'bg-indigo-600' : 'bg-indigo-600'
                  }`}>
                    {talent.initial}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{talent.name}</h3>
                    <p className="text-sm font-bold text-slate-500">{talent.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{talent.company} · {talent.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBg(talent.status)}`}>
                    {talent.statusText}
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-50">
                <span className="px-2.5 py-1 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Zap size={12} /> {talent.match}% 匹配
                </span>
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                  {talent.experience}经验
                </span>
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                  {talent.education}
                </span>
                {talent.tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-indigo-50 rounded-lg text-xs font-bold text-indigo-600">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>进度</span>
                  <span className="font-medium">{talent.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      talent.status === 'offer' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${talent.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selectedTalent ? (
            <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-xl sticky top-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-600 text-white flex items-center justify-center text-2xl font-black rounded shadow-lg">
                  {selectedTalent.initial}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedTalent.name}</h3>
                  <p className="text-sm font-bold text-indigo-600">{selectedTalent.title}</p>
                  <p className="text-xs text-slate-500">{selectedTalent.company}</p>
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-6 ${getStatusBg(selectedTalent.status)}`}>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedTalent.status)} ${selectedTalent.status === 'interviewing' ? 'animate-pulse' : ''}`} />
                {selectedTalent.statusText}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">期望薪资</span>
                  <span className="text-sm font-black text-slate-900">{selectedTalent.salary}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">工作地点</span>
                  <span className="text-sm font-medium text-slate-900">{selectedTalent.location}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">工作经验</span>
                  <span className="text-sm font-medium text-slate-900">{selectedTalent.experience}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">学历</span>
                  <span className="text-sm font-medium text-slate-900">{selectedTalent.education}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">最后活跃</span>
                  <span className="text-sm font-medium text-slate-900">{selectedTalent.lastActive}</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-black text-slate-900 mb-3">技能标签</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTalent.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-black text-slate-900 mb-3">申请职位</h4>
                <div className="space-y-2">
                  {selectedTalent.appliedJobs.map((job, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs font-medium text-slate-700">{job}</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded font-bold text-sm transition-all">
                  查看详情
                </button>
                <button className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded font-bold text-sm transition-all">
                  联系
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-8 border border-dashed border-slate-200 text-center">
              <Users2 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">选择一个候选人查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/workbench" element={<WorkbenchView />} />
            <Route path="/workbench/todos" element={<TodoListView />} />
            <Route path="/workbench/todo/:todoId" element={<TodoDetailView />} />
            <Route path="/workbench/flow/:flowId" element={<FlowDetailView />} />
            <Route path="/candidate" element={<CandidateView />} />
            <Route path="/candidate/resume" element={<CandidateResumeDetail />} />
            <Route path="/candidate/home" element={<CandidateHomeView />} />
            <Route path="/candidate/memory" element={<CandidateMemoryView />} />
            <Route path="/candidate/profile" element={<CandidateProfileView />} />
            <Route path="/candidate/apply" element={<ApplyDetailView />} />
            <Route path="/candidate/job/:jobId" element={<JobDetailView />} />
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employer/memory" element={<EnterpriseMemoryView />} />
            <Route path="/memory/input" element={<MemoryInputView />} />
            <Route path="/employer/home" element={<EnterpriseHomeView />} />
            <Route path="/employer/talent/:talentId" element={<TalentDetailView />} />
            <Route path="/employer/post" element={<EmployerPostView />} />
            <Route path="/employer/post/:postId" element={<JobPostDetailView />} />
            <Route path="/invite" element={<InviteFriendView />} />
            <Route path="/candidate/delivery" element={<AIDeliveryView />} />
            <Route path="/employer/talent-pool" element={<TalentPoolView />} />
            <Route path="/tokens" element={<TokenManagementView />} />
            <Route path="/settings" element={<SettingsManagementView />} />
            <Route path="/about" element={<AboutUsView />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/ai-assistant" element={<AIAssistantView />} />
            <Route path="/pricing" element={<PricingView />} />
          </Routes>
        </main>
        
        <footer className="pt-12 pb-6 border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
              <div className="lg:col-span-4">
                <Link to="/" className="flex items-center gap-3 mb-6 group">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                    <Zap className="text-white w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">Devnors <span className="text-indigo-600 text-sm font-normal">得若</span></span>
                </Link>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">AI 原生招聘平台。助力人才实现职业梦想，为企业精准推荐全球精英。</p>
                <div className="flex items-center gap-4">
                  <a href="#" className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-600 hover:bg-emerald-500 hover:text-white transition-all group">
                    <MessageCircle size={20} />
                  </a>
                  <a href="#" className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-600 hover:bg-rose-500 hover:text-white transition-all group">
                    <Heart size={20} />
                  </a>
                  <a href="#" className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-600 hover:bg-indigo-500 hover:text-white transition-all group">
                    <Instagram size={20} />
                  </a>
                  <a href="#" className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-600 hover:bg-sky-500 hover:text-white transition-all group">
                    <Twitter size={20} />
                  </a>
                </div>
              </div>
              <div className="lg:col-span-7 lg:col-start-7">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">产品</h4>
                    <div className="space-y-3">
                      <Link to="/candidate" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">人才端</Link>
                      <Link to="/employer" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">企业端</Link>
                      <Link to="/workbench" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">AI 工作台</Link>
                      <Link to="/pricing" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">定价方案</Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">法律</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">隐私政策</a>
                      <a href="#" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">服务条款</a>
                      <a href="#" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">版权声明</a>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">支持</h4>
                    <div className="space-y-3">
                      <Link to="/about" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">关于我们</Link>
                      <Link to="/tokens" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">资金账户</Link>
                      <a href="#" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">帮助中心</a>
                      <a href="#" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">反馈建议</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400">© 2024 Devnors 得若智能体. All rights reserved.</p>
              <p className="text-xs text-slate-400 uppercase tracking-tighter">Powered by Multi-Agent Synergy</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

// --- 求职简历管理页 (供人才端使用) ---
const CandidateResumeDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile as CandidateProfile;

  if (!profile) return (
    <div className="pt-40 text-center">
       <p className="text-slate-400 font-bold mb-4">未找到简历数据</p>
       <button onClick={() => navigate('/candidate')} className="bg-indigo-600 text-white px-6 py-2 rounded">返回上传</button>
    </div>
  );

  return (
    <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-colors">
          <ChevronLeft size={20} /> 返回
        </button>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold">
            <Download size={16} /> 导出 PDF
          </button>
        </div>
      </div>
      <div className="bg-white rounded border border-slate-100 shadow-2xl overflow-hidden p-16">
        <div className="flex items-center gap-8 mb-12">
           <div className="w-24 h-24 bg-indigo-600 text-white flex items-center justify-center text-4xl font-black rounded-lg">{profile.name.charAt(0)}</div>
           <div>
              <h1 className="text-5xl font-black mb-2">{profile.name}</h1>
              <p className="text-indigo-600 font-black text-xl">{profile.role}</p>
           </div>
        </div>
        <div className="space-y-12">
           <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">个人简述</h3>
              <p className="text-xl text-slate-700 leading-relaxed font-medium">{profile.summary}</p>
           </section>
           <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">专业技能清单</h3>
                 <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s, i) => <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 text-xs font-bold rounded-lg border border-slate-100">{s}</span>)}
                 </div>
              </div>
              <div>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">画像改进方向</h3>
                 <ul className="space-y-2">
                    {profile.optimizationSuggestions?.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 font-medium flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> {s}
                      </li>
                    ))}
                 </ul>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default App;
