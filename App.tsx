
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Users, Briefcase, Zap, ShieldCheck, 
  BarChart3, Plus, Sparkles, FileText, 
  CheckCircle2, Clock, TrendingUp, Users2, ArrowRight, Search, X,
  BrainCircuit, MessageCircleQuestion, Lightbulb, GraduationCap, ChevronLeft, Calendar,
  Download, Map, Send, Bot, User as UserIcon, Award, Globe, LineChart, Target, BookOpen, Lock, Mail, Github,
  Smartphone, ShieldEllipsis, MessageSquare, ExternalLink, Phone, MapPin, Share2, Loader2, Rocket, Terminal, Play, Square, Activity,
  Cpu, Coins, Fingerprint, Building2, Building, Layers, Eye, Compass, Info, Heart, LayoutDashboard, Settings, PieChart, CheckSquare, ListTodo, PenTool,
  History, Timer, ClipboardCheck, Filter, ChevronRight, ChevronDown, UserCircle2, Database, AlertCircle, Sparkle, Eraser, Milestone, Brain, Pin, Trash2, Edit3, Save, CreditCard, ArrowUpRight, TrendingDown, Wallet, Key, UserPlus, ShieldAlert, Laptop, Bell, Verified, Medal, Trophy, Landmark, CircleDollarSign, Gem, CreditCard as CreditCardIcon, Github as GithubIcon, MessageCircle, Tag, Instagram, Twitter, RotateCcw, GitBranch, ArrowRightCircle, Upload, Code, PlusCircle, Wand2, Link2, Linkedin, Gift, FileCheck, Moon, Sun, Inbox, AlertTriangle, Paperclip, Scan, IdCard, Camera, ImageIcon, CheckCircle, XCircle, Car, BadgeCheck,
  Settings2, Check, Shield
} from 'lucide-react';
import { analyzeResume, chatWithInterviewer } from './services/geminiService';
import { CandidateProfile, Job, SkillGap, AgentFeedback, AccountTier, TeamMember, CustomLLMConfig } from './types';
import RadarChart from './components/RadarChart';
import { 
  useRecommendedJobs, usePublicJobs, useFlows, useFlow, useTalents, 
  useTokenStats, useQualifications, useMemories, useTodos, useTasks, useProfile 
} from './hooks/useApiData';
import { 
  createMemory, 
  chatWithAI, 
  updateUser, 
  changePassword,
  uploadAvatar,
  getSettings,
  updateSettings,
  getEnterpriseCertifications,
  getPersonalCertifications,
  getTeamMembers,
  inviteTeamMember,
  deleteTeamMember,
  transferAdmin,
  approveMember,
  getAIConfigs,
  getAPIKeys,
  getAuditLogs,
  getAccountTier,
  getMyJobs,
  deleteJob,
  updateJob,
  getJobDetail
} from './services/apiService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

// MOCK_TODOS 已删除 - 使用动态 API 数据

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

const Navbar = ({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn, userRole, logout, setUserRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // 获取未读通知数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isLoggedIn || !user?.id) return;
      try {
        const { getUnreadNotificationCount } = await import('./services/apiService');
        const response = await getUnreadNotificationCount(user.id);
        setUnreadNotifications(response.unread_count || 0);
      } catch (error) {
        console.error('获取未读通知数量失败:', error);
      }
    };
    fetchUnreadCount();
    // 每 30 秒刷新一次
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, user?.id]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 transition-transform active:scale-95">
            <Zap className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Devnors <span className="text-indigo-600 text-sm font-normal">得若</span></span>
        </Link>
        
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-500">
          {isLoggedIn && (
            <>
              <Link to="/ai-assistant" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 font-semibold"><Bot size={16}/> AI助手</Link>
              <Link to="/workbench" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 font-semibold"><LayoutDashboard size={16}/> 工作台</Link>
            </>
          )}
          {/* 根据用户身份显示不同入口 */}
          {userRole === 'candidate' && (
            <Link to="/candidate" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <UserIcon size={16} /> 人才中心
            </Link>
          )}
          {userRole === 'employer' && (
            <Link to="/employer" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <Building2 size={16} /> 企业中心
            </Link>
          )}
          {!isLoggedIn && (
            <>
              <Link to="/products" className="hover:text-indigo-600 transition-colors">产品</Link>
              <Link to="/solutions" className="hover:text-indigo-600 transition-colors">解决方案</Link>
              <Link to="/models" className="hover:text-indigo-600 transition-colors">Agent</Link>
              <Link to="/pricing" className="hover:text-indigo-600 transition-colors">定价</Link>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {isLoggedIn && (
            <>
              <Link to="/tokens" className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded border border-slate-200 transition-all group" title="Token 资产管理">
                <div className="p-1 bg-white rounded shadow-sm group-hover:rotate-12 transition-transform">
                  <CircleDollarSign size={14} className="text-amber-500" />
                </div>
                <span className="text-xs font-bold text-slate-700">1.2M</span>
              </Link>
              <div className="w-px h-5 bg-slate-200 mx-1"></div>
              <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="消息中心">
                <Bell size={18}/>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
              <Link to="/settings" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all" title="系统设置">
                <Settings size={18}/>
              </Link>
            </>
          )}
          
          {isLoggedIn ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : (user?.name?.charAt(0) || 'U')}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-bold text-slate-900 truncate max-w-[100px]">{user?.name || '用户'}</div>
                  <div className="text-xs text-slate-500">
                    {userRole === 'candidate' ? '求职者' : userRole === 'employer' ? '招聘方' : ''}
                  </div>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{user?.name}</div>
                    <div className="text-xs text-slate-500">UID: {user?.id}</div>
                  </div>
                  <Link 
                    to="/settings" 
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={16} /> 系统设置
                  </Link>
                  {userRole === 'candidate' && (
                    <Link 
                      to="/candidate/profile" 
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserIcon size={16} /> 个人主页
                    </Link>
                  )}
                  {userRole === 'employer' && (
                    <Link 
                      to="/employer/home" 
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Building2 size={16} /> 企业主页
                    </Link>
                  )}
                  {/* 切换身份 */}
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button 
                      disabled={isSwitching}
                      onClick={async () => {
                        setIsSwitching(true);
                        const newRole = userRole === 'candidate' ? 'employer' : 'candidate';
                        await setUserRole(newRole);
                        setIsSwitching(false);
                        setShowUserMenu(false);
                        navigate(newRole === 'candidate' ? '/candidate' : '/employer');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      {isSwitching ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RotateCcw size={16} />
                      )}
                      {isSwitching ? '切换中...' : `切换为${userRole === 'candidate' ? '企业方' : '求职者'}`}
                    </button>
                  </div>
                  <div className="border-t border-slate-100">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <ArrowRight size={16} /> 退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95">
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

// 数字滚动动画组件
const AnimatedCounter = ({ end, suffix = '', duration = 2000, color = 'text-indigo-600' }: { end: number; suffix?: string; duration?: number; color?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [isVisible]);
  
  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // 使用 easeOutExpo 缓动函数
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOutExpo * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);
  
  return (
    <div ref={ref} className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">
      {count}{suffix}<span className={color}>+</span>
    </div>
  );
};

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
                <div className="inline-flex p-3 bg-indigo-50 rounded text-indigo-600 mb-6 animate-in zoom-in duration-500">
                  <Users size={32} />
                </div>
                <AnimatedCounter end={100} suffix="万" color="text-indigo-600" />
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">全球储备人才</div>
             </div>
             <div className="text-center md:border-r border-slate-100">
                <div className="inline-flex p-3 bg-emerald-50 rounded text-emerald-600 mb-6 animate-in zoom-in duration-500 delay-150">
                  <Building2 size={32} />
                </div>
                <AnimatedCounter end={2} suffix="万" color="text-emerald-600" duration={1500} />
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">活跃入驻企业</div>
             </div>
             <div className="text-center">
                <div className="inline-flex p-3 bg-rose-50 rounded text-rose-600 mb-6 animate-in zoom-in duration-500 delay-300">
                  <Sparkles size={32} />
                </div>
                <AnimatedCounter end={500} suffix="万" color="text-rose-600" duration={2500} />
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
          <StatCard value={578} suffix="%" label="效率跨越式提升" delay={0} />
          <StatCard value={82} suffix="%" label="匹配精度" delay={100} />
          <StatCard value={70} suffix="%" label="HR 人力成本降低" delay={200} />
          <StatCard value={48} prefix="< " suffix="h" label="招聘周期" delay={300} />
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
      <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed ">
        从“人岗匹配”到“智能体自主协同”。Devnors 部署多智能体系统（MAS），
        实现从简历深度解析、多模态评估到面试自调度的全链路闭环。
      </p>
      <HeroButtons />
    </div>
  </section>
);

// Hero 按钮组件（需要 hooks）
const HeroButtons = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuth();

  const handleAuthAction = (targetPath: string, defaultRole: 'candidate' | 'employer') => {
    if (isLoggedIn) {
      navigate(targetPath);
    } else {
      navigate(`/login?role=${defaultRole}`, { state: { from: targetPath } });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
      <button 
        onClick={() => handleAuthAction('/candidate', 'candidate')}
        className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-indigo-200"
      >
        <span>{isLoggedIn && (userRole === 'candidate' || !userRole) ? '开始求职' : '作为人才加入'}</span>
        <ArrowRight size={18} />
      </button>
      <button 
        onClick={() => handleAuthAction('/employer', 'employer')}
        className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded font-bold hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
      >
        <span>{isLoggedIn && (userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin') ? '开始招聘' : '企业开始招聘'}</span>
        <Briefcase size={18} />
      </button>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="bg-white p-8 rounded hover:translate-y-[-4px] transition-all border border-slate-100 card-shadow group">
    <div className="w-12 h-12 bg-indigo-50 rounded flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
      <Icon className="text-indigo-600 w-6 h-6 group-hover:text-white transition-colors" />
    </div>
    <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </div>
);

// 统计卡片组件（带数字滚动动画）
const StatCard = ({ value, suffix = '', prefix = '', label, delay = 0 }: { value: number; suffix?: string; prefix?: string; label: string; delay?: number }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.3 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [isVisible, delay]);
  
  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    let animationFrame: number;
    const duration = 1800;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutExpo 缓动
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOutExpo * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, value]);
  
  return (
    <div 
      ref={ref} 
      className={`p-8 bg-white rounded border border-indigo-50/50 card-shadow transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="text-5xl font-extrabold text-indigo-600 mb-2">
        {prefix}{count}{suffix}
      </div>
      <div className="text-slate-500 font-semibold">{label}</div>
    </div>
  );
};

// 通用动画统计项组件（用于各页面的数据展示）
const AnimatedStatItem = ({ 
  value, 
  label, 
  icon: Icon, 
  color = 'text-indigo-600', 
  bg = 'bg-indigo-50',
  delay = 0,
  size = 'normal'
}: { 
  value: string; 
  label: string; 
  icon?: any; 
  color?: string; 
  bg?: string;
  delay?: number;
  size?: 'small' | 'normal' | 'large';
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [isVisible, delay]);
  
  useEffect(() => {
    if (!isVisible) return;
    
    // 解析数值
    const numMatch = value.match(/[\d.]+/);
    if (!numMatch) {
      setDisplayValue(value);
      return;
    }
    
    const targetNum = parseFloat(numMatch[0]);
    const prefix = value.slice(0, value.indexOf(numMatch[0]));
    const suffix = value.slice(value.indexOf(numMatch[0]) + numMatch[0].length);
    
    let startTime: number;
    const duration = 1500;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentNum = targetNum * easeOut;
      const formatted = numMatch[0].includes('.') 
        ? currentNum.toFixed(1) 
        : Math.floor(currentNum).toString();
      
      setDisplayValue(`${prefix}${formatted}${suffix}`);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isVisible, value]);
  
  const sizeClasses = {
    small: { value: 'text-xl', label: 'text-xs', icon: 16, iconBox: 'w-8 h-8' },
    normal: { value: 'text-2xl', label: 'text-xs', icon: 20, iconBox: 'w-10 h-10' },
    large: { value: 'text-3xl', label: 'text-sm', icon: 24, iconBox: 'w-12 h-12' },
  };
  
  const s = sizeClasses[size];
  
  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
    >
      {Icon ? (
        <div className="flex items-center gap-4">
          <div className={`${s.iconBox} rounded-lg flex items-center justify-center ${bg}`}>
            <Icon className={color} size={s.icon} />
          </div>
          <div>
            <div className={`text-slate-400 ${s.label} font-bold uppercase tracking-wider`}>{label}</div>
            <div className={`${s.value} font-black text-slate-900`}>{displayValue}</div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className={`${s.value} font-black ${color}`}>{displayValue}</div>
          <div className={`${s.label} text-slate-500 mt-1`}>{label}</div>
        </div>
      )}
    </div>
  );
};

// --- 设置与管理页面 ---
const SettingsManagementView = ({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, refreshUser } = useAuth();
  const userId = user?.id || 0;
  const isEmployer = userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin';
  
  const [activeTab, setActiveTab] = useState<'General' | 'AccountInfo' | 'Verification' | 'PersonalVerification' | 'Account' | 'AIEngine' | 'API' | 'Team' | 'Audit'>('AccountInfo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 账号信息状态
  const [accountInfo, setAccountInfo] = useState({
    name: '',
    phone: '',
    email: '',
    avatar_url: '',
  });
  const [accountEditing, setAccountEditing] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  // 密码修改
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  // 头像上传
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // 二次验证弹窗状态（手机/邮箱修改）
  const [verifyModal, setVerifyModal] = useState<{show: boolean; type: 'phone' | 'email'; newValue: string; step: 'old' | 'new'}>({show: false, type: 'phone', newValue: '', step: 'old'});
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [newEmailValue, setNewEmailValue] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySending, setVerifySending] = useState(false);
  const [verifyCountdown, setVerifyCountdown] = useState(0);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  
  // 从 URL 参数读取 tab
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['General', 'AccountInfo', 'Verification', 'PersonalVerification', 'Account', 'AIEngine', 'API', 'Team', 'Audit'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [location.search]);
  
  // 动态数据状态
  const [settings, setSettings] = useState<any>({});
  const [enterpriseCerts, setEnterpriseCerts] = useState<any[]>([]);
  const [personalCerts, setPersonalCerts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamInfo, setTeamInfo] = useState<{is_admin: boolean; enterprise_id: number | null; enterprise_name: string | null}>({is_admin: false, enterprise_id: null, enterprise_name: null});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({phone: '', email: '', role: 'viewer', inviteType: 'phone' as 'phone' | 'email'});
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<number | null>(null);
  const [llmConfigs, setLlmConfigs] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [accountTierInfo, setAccountTierInfo] = useState<any>({ tier: 'free', tierName: 'Devnors 1.0', privileges: [] });

  // 加载所有设置数据
  useEffect(() => {
    const loadAllSettings = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const [
          settingsData,
          enterpriseCertsData,
          personalCertsData,
          teamMembersData,
          aiConfigsData,
          apiKeysData,
          auditLogsData,
          accountTierData
        ] = await Promise.all([
          getSettings(userId).catch(() => ({})),
          getEnterpriseCertifications(userId).catch(() => []),
          getPersonalCertifications(userId).catch(() => []),
          getTeamMembers(userId).catch(() => []),
          getAIConfigs(userId).catch(() => []),
          getAPIKeys(userId).catch(() => []),
          getAuditLogs(userId).catch(() => []),
          getAccountTier(userId).catch(() => ({ tier: 'free', tierName: 'Devnors 1.0', privileges: [] }))
        ]);
        
        setSettings(settingsData);
        setEnterpriseCerts(enterpriseCertsData);
        setPersonalCerts(personalCertsData);
        // 处理团队成员数据
        if (teamMembersData && teamMembersData.members) {
          setTeamMembers(teamMembersData.members);
          setTeamInfo({
            is_admin: teamMembersData.is_admin,
            enterprise_id: teamMembersData.enterprise_id,
            enterprise_name: teamMembersData.enterprise_name
          });
        } else if (Array.isArray(teamMembersData)) {
          setTeamMembers(teamMembersData);
        }
        setLlmConfigs(aiConfigsData);
        setApiKeys(apiKeysData);
        setAuditLogs(auditLogsData);
        setAccountTierInfo(accountTierData);
        // 初始化账号信息
        setAccountInfo({
          name: user?.name || '',
          phone: user?.phone || '',
          email: user?.email || '',
          avatar_url: user?.avatar_url || '',
        });
      } catch (error) {
        console.error('加载设置失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllSettings();
  }, [userId]);

  // Toast 提示
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success' | 'error' | 'warning'}>({show: false, message: '', type: 'success'});
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({show: true, message, type});
    setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
  };

  // 校验错误
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 字段校验
  const validateField = (key: string, value: any): string => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return '';
    const v = typeof value === 'string' ? value.trim() : value;
    
    switch(key) {
      case 'hr_phone':
      case 'contact_phone': {
        const phone = v.replace(/[\s\-]/g, '');
        if (!/^1[3-9]\d{9}$/.test(phone) && !/^0\d{2,3}\d{7,8}$/.test(phone)) {
          return '请输入正确的手机号（如 13812345678）或固话（如 02112345678）';
        }
        return '';
      }
      case 'contact_email':
      case 'hr_email': {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          return '请输入正确的邮箱格式（如 example@company.com）';
        }
        return '';
      }
      case 'website': {
        if (v && !/^https?:\/\/.+\..+/.test(v) && !/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(v)) {
          return '请输入正确的网址（如 https://www.example.com）';
        }
        return '';
      }
      case 'display_name': {
        if (v.length < 2) return '企业全称不能少于2个字';
        if (v.length > 100) return '企业全称不能超过100个字';
        return '';
      }
      case 'short_name': {
        if (v.length > 20) return '企业简称不能超过20个字';
        return '';
      }
      case 'description': {
        if (v.length > 1000) return '企业简介不能超过1000字';
        return '';
      }
      case 'contact_name': {
        if (v.length > 20) return '姓名不能超过20个字';
        return '';
      }
      case 'detail_address': {
        if (v.length > 200) return '地址不能超过200个字';
        return '';
      }
      default:
        return '';
    }
  };

  // 带校验的 setSettings
  const updateField = (key: string, value: any) => {
    setSettings((prev: any) => ({...prev, [key]: value}));
    const error = validateField(key, value);
    setFieldErrors(prev => ({...prev, [key]: error}));
  };

  // 保存设置
  const handleSaveSettings = async () => {
    // 保存前全量校验
    const fieldsToValidate = ['display_name', 'short_name', 'hr_phone', 'contact_phone', 'contact_email', 'hr_email', 'website', 'description', 'contact_name', 'detail_address'];
    const errors: Record<string, string> = {};
    let hasError = false;
    for (const key of fieldsToValidate) {
      if (settings[key]) {
        const err = validateField(key, settings[key]);
        if (err) { errors[key] = err; hasError = true; }
      }
    }
    setFieldErrors(errors);
    if (hasError) {
      showToast('请修正标红的错误字段后再保存', 'error');
      return;
    }

    setSaving(true);
    try {
      // 只发送后端接受的字段
      const allowedKeys = [
        'display_name', 'short_name', 'enterprise_type', 'industry', 'company_size',
        'founding_year', 'funding_stage', 'province', 'city', 'district',
        'detail_address', 'address', 'contact_phone', 'contact_email', 'website',
        'contact_name', 'hr_position', 'hr_phone', 'hr_email', 'slogan',
        'description', 'work_time', 'rest_type', 'benefits', 'company_photos',
        'notification_enabled', 'dark_mode'
      ];
      const cleanData: any = {};
      for (const key of allowedKeys) {
        if (settings[key] !== undefined && settings[key] !== null) {
          cleanData[key] = settings[key];
        }
      }
      await updateSettings(cleanData, userId);
      showToast('设置已保存成功', 'success');
    } catch (error) {
      console.error('保存设置失败:', error);
      showToast('保存失败，请稍后重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 复制API Key
  const handleCopyAPIKey = (key: string) => {
    navigator.clipboard.writeText(key);
    showToast('API Key 已复制到剪贴板', 'success');
  };

  const isCandidate = userRole === 'candidate';
  const navItems = [
    { id: 'AccountInfo', label: '账号信息', icon: IdCard },
    ...(isEmployer ? [{ id: 'General', label: '企业基础信息', icon: UserCircle2 }] : []),
    ...(isEmployer ? [{ id: 'Verification', label: '企业认证信息', icon: ShieldCheck }] : []),
    ...(isCandidate ? [{ id: 'PersonalVerification', label: '个人认证信息', icon: Fingerprint }] : []),
    { id: 'Account', label: '账户等级', icon: Award },
    { id: 'AIEngine', label: 'AI 引擎配置', icon: Cpu },
    { id: 'API', label: 'API 与集成', icon: Key },
    ...(isEmployer ? [{ id: 'Team', label: '人员与权限', icon: Users2 }] : []),
    { id: 'Audit', label: '系统安全日志', icon: Laptop },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <span className="ml-3 text-slate-500 font-bold">加载设置中...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'General':
        // 福利标签选项
        const benefitOptions = [
          '五险一金', '年终奖', '带薪年假', '弹性工作', '餐补', '交通补贴', '员工培训', '节日福利'
        ];
        // 当前选中的福利
        const selectedBenefits = (() => {
          try {
            return JSON.parse(settings.benefits || '[]');
          } catch {
            return [];
          }
        })();
        // 切换福利标签
        const toggleBenefit = (benefit: string) => {
          const newBenefits = selectedBenefits.includes(benefit)
            ? selectedBenefits.filter((b: string) => b !== benefit)
            : [...selectedBenefits, benefit];
          setSettings({...settings, benefits: JSON.stringify(newBenefits)});
        };
        
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900">基础信息设置</h3>
            
            {/* 企业信息 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">企业全称</label>
                  <input 
                    type="text" 
                    value={settings.display_name || ''} 
                    onChange={(e) => updateField('display_name', e.target.value)}
                    placeholder="与营业执照一致的企业名称"
                    className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${fieldErrors.display_name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`} 
                  />
                  {fieldErrors.display_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.display_name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">企业简称</label>
                  <input 
                    type="text" 
                    value={settings.short_name || ''} 
                    onChange={(e) => updateField('short_name', e.target.value)}
                    placeholder="如：字节、阿里"
                    className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${fieldErrors.short_name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`} 
                  />
                  {fieldErrors.short_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.short_name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">所属行业</label>
                  <select 
                    value={settings.industry || ''}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  >
                    <option value="">请选择</option>
                    <option value="互联网/IT">互联网/IT</option>
                    <option value="人工智能">人工智能</option>
                    <option value="金融/投资">金融/投资</option>
                    <option value="教育培训">教育培训</option>
                    <option value="医疗健康">医疗健康</option>
                    <option value="制造业">制造业</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">企业规模</label>
                  <select 
                    value={settings.company_size || ''}
                    onChange={(e) => updateField('company_size', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  >
                    <option value="">请选择</option>
                    <option value="0-20人">0-20人</option>
                    <option value="20-99人">20-99人</option>
                    <option value="100-499人">100-499人</option>
                    <option value="500-999人">500-999人</option>
                    <option value="1000人以上">1000人以上</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">融资阶段</label>
                  <select 
                    value={settings.funding_stage || ''}
                    onChange={(e) => updateField('funding_stage', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  >
                    <option value="">请选择</option>
                    <option value="未融资">未融资</option>
                    <option value="天使轮">天使轮</option>
                    <option value="A轮">A轮</option>
                    <option value="B轮">B轮</option>
                    <option value="C轮及以上">C轮及以上</option>
                    <option value="已上市">已上市</option>
                    <option value="不需要融资">不需要融资</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 联系方式 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">联系方式</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">公司地址</label>
                  <input 
                    type="text" 
                    value={settings.detail_address || ''} 
                    onChange={(e) => updateField('detail_address', e.target.value)}
                    placeholder="如：浙江省杭州市西湖区文三路XXX号"
                    className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${fieldErrors.detail_address ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`} 
                  />
                  {fieldErrors.detail_address && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.detail_address}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">HR姓名</label>
                  <input 
                    type="text" 
                    value={settings.contact_name || ''} 
                    onChange={(e) => updateField('contact_name', e.target.value)}
                    placeholder="联系人姓名"
                    className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${fieldErrors.contact_name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`} 
                  />
                  {fieldErrors.contact_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.contact_name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">联系电话</label>
                  <input 
                    type="tel" 
                    value={settings.hr_phone || ''} 
                    onChange={(e) => updateField('hr_phone', e.target.value)}
                    placeholder="手机号或座机"
                    className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${fieldErrors.hr_phone ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`} 
                  />
                  {fieldErrors.hr_phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.hr_phone}</p>}
                </div>
              </div>
            </div>

            {/* 企业简介 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">企业简介</h4>
              <textarea 
                rows={3} 
                value={settings.description || ''} 
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="简要介绍企业业务、文化等"
                className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${fieldErrors.description ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`} 
              />
              <div className="flex justify-between mt-1">
                {fieldErrors.description ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.description}</p> : <span></span>}
                <span className="text-xs text-slate-400">{(settings.description || '').length}/1000</span>
              </div>
            </div>

            {/* 福利标签 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">企业福利</h4>
              <div className="flex flex-wrap gap-2">
                {benefitOptions.map(benefit => (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() => toggleBenefit(benefit)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedBenefits.includes(benefit)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {selectedBenefits.includes(benefit) && <Check size={12} className="inline mr-1" />}
                    {benefit}
                  </button>
                ))}
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end">
              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        );
      case 'Verification': {
        const qualificationCerts = enterpriseCerts.filter((c: any) => c.category === 'qualification');
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">企业认证信息</h3>
            
            <div className="bg-white rounded-lg p-10 border border-slate-100 shadow-sm space-y-8">
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Award size={20} className="text-amber-500" /> 资质认证
                </h4>
                {qualificationCerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Medal size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无资质认证信息</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qualificationCerts.map((cert: any, idx: number) => {
                      const isBusinessLicense = cert.name?.includes('营业执照');
                      const isLegalPersonId = cert.name?.includes('法人身份证') && !cert.name?.includes('正面') && !cert.name?.includes('背面');
                      const isFullWidth = isBusinessLicense;
                      
                      return (
                        <div key={idx} className={`p-5 rounded-lg border ${cert.color || 'bg-amber-50 border-amber-200'} flex items-start gap-4 ${isFullWidth ? 'col-span-2' : ''} relative`}>
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            {isBusinessLicense ? <Building2 size={24} className="text-indigo-600" /> : 
                             isLegalPersonId ? <Fingerprint size={24} className="text-blue-600" /> :
                             <Medal size={24} className="text-amber-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-black text-slate-900 text-base">{isLegalPersonId ? '法人身份证' : cert.name}</h5>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex-shrink-0">
                                {cert.status === 'valid' ? '已认证' : cert.status}
                              </span>
                            </div>
                            {isBusinessLicense && !isLegalPersonId && (
                              <p className="text-xs text-slate-500 mt-1">法定代表人：{cert.organization}</p>
                            )}
                            {isBusinessLicense && (
                              <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                                {cert.credit_code && (
                                  <p><span className="font-bold">统一社会信用代码：</span>{cert.credit_code}</p>
                                )}
                                {cert.valid_period && (
                                  <p><span className="font-bold">有效期：</span>{cert.valid_period}</p>
                                )}
                                {cert.business_address && (
                                  <p><span className="font-bold">住所：</span>{cert.business_address}</p>
                                )}
                                {cert.registered_capital && (
                                  <p><span className="font-bold">注册资本：</span>{cert.registered_capital}</p>
                                )}
                                {cert.business_scope && (
                                  <p className="line-clamp-2"><span className="font-bold">经营范围：</span>{cert.business_scope}</p>
                                )}
                              </div>
                            )}
                            {isLegalPersonId && cert.id_card_name && (
                              <p className="text-sm text-slate-600 mt-1">姓名: {cert.id_card_name}</p>
                            )}
                            {isLegalPersonId && cert.id_card_number && (
                              <p className="text-xs text-slate-500 mt-1 font-mono">{cert.id_card_number.replace(/^(.{6})(.*)(.{4})$/, '$1****$3')}</p>
                            )}
                            {isLegalPersonId && cert.id_card_authority && (
                              <p className="text-xs text-slate-500 mt-1">发证机关: {cert.id_card_authority}</p>
                            )}
                            {isLegalPersonId && cert.id_card_valid_period && (
                              <p className="text-xs text-slate-400 mt-1">有效期: {cert.id_card_valid_period}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <span className="text-xs text-slate-400">认证日期: {cert.date}</span>
                              {isBusinessLicense && cert.image_data && (
                                <button 
                                  onClick={() => {
                                    const win = window.open('', '_blank');
                                    if (win) {
                                      win.document.write(`<html><head><title>营业执照原件</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f1f5f9;"><img src="data:image/jpeg;base64,${cert.image_data}" style="max-width:100%;max-height:100vh;box-shadow:0 4px 12px rgba(0,0,0,0.1);"/></body></html>`);
                                      win.document.close();
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-200 transition-colors"
                                >
                                  查看原件
                                </button>
                              )}

                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      }
      case 'PersonalVerification': {
        // 按类别分组认证数据
        const identityCerts = personalCerts.filter(c => c.category === 'identity');
        const educationCerts = personalCerts.filter(c => c.category === 'education');
        const skillCerts = personalCerts.filter(c => c.category === 'skill');  // 技能认证：驾驶证、职业证书
        const workCerts = personalCerts.filter(c => c.category === 'work');    // 工作证明：过往工作经历认证
        const creditCerts = personalCerts.filter(c => c.category === 'credit');
        const awardCerts = personalCerts.filter(c => c.category === 'award');
        
        // 状态显示映射
        const getStatusDisplay = (status: string) => {
          const statusMap: Record<string, string> = {
            'valid': '已认证',
            'expired': '已过期',
            'pending': '待审核',
            'verified': '已认证'
          };
          return statusMap[status] || status;
        };
        
        // 颜色样式映射
        const getColorClass = (color: string | undefined, defaultColor: string) => {
          // 颜色名称到 CSS 类名的映射
          const colorMap: Record<string, string> = {
            'blue': 'bg-blue-50 border-blue-200',
            'green': 'bg-green-50 border-green-200',
            'indigo': 'bg-indigo-50 border-indigo-200',
            'purple': 'bg-purple-50 border-purple-200',
            'amber': 'bg-amber-50 border-amber-200',
            'orange': 'bg-orange-50 border-orange-200',
            'red': 'bg-red-50 border-red-200',
            'gray': 'bg-gray-50 border-gray-200'
          };
          return color ? (colorMap[color] || defaultColor) : defaultColor;
        };
        
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">个人认证信息</h3>
            
            <div className="bg-white rounded-lg p-10 border border-slate-100 shadow-sm space-y-8">
              {/* 身份认证 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Fingerprint size={20} className="text-blue-500" /> 身份认证
                </h4>
                {identityCerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {identityCerts.map((identity, idx) => {
                      // 从 "实名认证 - 陈柯好" 中提取姓名
                      const displayName = identity.name?.replace(/^实名认证\s*[-–—]\s*/, '') || '已认证';
                      return (
                        <div key={identity.id || idx} className={`p-5 rounded-lg border ${getColorClass(identity.color, 'bg-blue-50 border-blue-200')} flex items-start gap-4`}>
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            {identity.icon === 'Scan' ? <Scan size={24} className="text-blue-600" /> : <Fingerprint size={24} className="text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h5 className="font-black text-slate-900 text-base">{displayName}</h5>
                                {identity.major && (
                                  <span className="text-xs text-slate-500">{identity.major}</span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex-shrink-0">{getStatusDisplay(identity.status)}</span>
                            </div>
                            {identity.level && (
                              <p className="text-sm text-slate-600 mt-2 font-mono">{identity.level}</p>
                            )}
                            {identity.degree && (
                              <p className="text-xs text-slate-500 mt-1">{identity.degree}</p>
                            )}
                            {identity.organization && (
                              <p className="text-xs text-slate-400 mt-2">{identity.organization}</p>
                            )}
                            {identity.date && (
                              <p className="text-xs text-slate-400 mt-1">有效期: {identity.date}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Fingerprint size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无身份认证信息</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                      立即认证
                    </button>
                  </div>
                )}
              </div>

              {/* 学历认证 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-indigo-500" /> 学历认证
                </h4>
                {educationCerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {educationCerts.map((edu, idx) => (
                      <div key={edu.id || idx} className={`p-5 rounded-lg border ${getColorClass(edu.color, 'bg-indigo-50 border-indigo-200')} flex items-start gap-4`}>
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <GraduationCap size={24} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-black text-slate-900 text-base">{edu.name || '学历认证'}</h5>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex-shrink-0">{getStatusDisplay(edu.status)}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{edu.organization}</p>
                          <p className="text-xs text-slate-500 mt-1">{edu.degree} · {edu.major}</p>
                          <p className="text-xs text-slate-400 mt-2">毕业时间: {edu.date}</p>
                          {edu.cert_number && <p className="text-xs text-slate-400 font-mono mt-1">证书编号: {edu.cert_number}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无学历认证信息</p>
                  </div>
                )}
              </div>

              {/* 技能认证 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Award size={20} className="text-purple-500" /> 技能认证
                </h4>
                {skillCerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillCerts.map((cert, idx) => (
                      <div key={cert.id || idx} className={`p-5 rounded-lg border ${getColorClass(cert.color, 'bg-purple-50 border-purple-200')} flex items-start gap-4`}>
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          {cert.icon === 'Car' ? <Car size={24} className="text-purple-600" /> : <Award size={24} className="text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-black text-slate-900 text-base">{cert.name}</h5>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${cert.name === '驾驶证' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {cert.name === '驾驶证' ? getStatusDisplay(cert.status) : '已上传'}
                            </span>
                          </div>
                          {cert.name === '驾驶证' ? (
                            <>
                              {cert.organization && <p className="text-sm text-slate-600 mt-1">姓名: {cert.organization}</p>}
                              {cert.level && <p className="text-xs text-slate-500 mt-1">准驾车型: {cert.level}</p>}
                              {cert.cert_number && <p className="text-xs text-slate-400 font-mono mt-1">证书编号: {cert.cert_number}</p>}
                              <p className="text-xs text-slate-400 mt-1">有效期: {cert.date || '长期有效'}</p>
                            </>
                          ) : (
                            <>
                              {cert.major && <p className="text-sm text-slate-600 mt-1">姓名: {cert.major}</p>}
                              {cert.cert_number && <p className="text-xs text-slate-400 font-mono mt-1">证书编号: {cert.cert_number}</p>}
                              {cert.organization && <p className="text-xs text-slate-500 mt-1">发证机构: {cert.organization}</p>}
                              {cert.level && <p className="text-xs text-slate-500 mt-1">等级: {cert.level}</p>}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Award size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无技能认证信息</p>
                    <p className="text-xs mt-1">支持驾驶证、职业资格证书等</p>
                  </div>
                )}
              </div>

              {/* 工作证明 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-amber-500" /> 工作证明
                </h4>
                {workCerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workCerts.map((work, idx) => (
                      <div key={work.id || idx} className={`p-5 rounded-lg border ${getColorClass(work.color, 'bg-amber-50 border-amber-200')} flex items-start gap-4`}>
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Briefcase size={24} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-black text-slate-900 text-base truncate">{work.name}</h5>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold flex-shrink-0 ml-2">已上传</span>
                          </div>
                          <p className="text-sm text-amber-700 font-medium">
                            {work.organization}{work.degree && ` · ${work.degree}`}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            {work.major && <span>认证方式: {work.major}</span>}
                            {work.date && <span>在职时间: {work.date}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Briefcase size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无工作证明</p>
                    <p className="text-xs mt-1">支持工牌、企业邮箱、在职/离职证明等</p>
                  </div>
                )}
              </div>

              {/* 征信认证 */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <FileCheck size={20} className="text-orange-500" /> 征信认证
                </h4>
                {creditCerts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {creditCerts.map((credit, idx) => (
                      <div key={credit.id || idx} className={`p-5 rounded-lg border ${getColorClass(credit.color, 'bg-orange-50 border-orange-200')} flex items-start gap-4`}>
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          {credit.name === '公积金证明' ? <Building size={24} className="text-orange-600" /> : <ShieldCheck size={24} className="text-orange-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-black text-slate-900 text-base">{credit.name}</h5>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold flex-shrink-0">已上传</span>
                          </div>
                          {credit.organization && <p className="text-sm text-slate-600 mt-1">姓名: {credit.organization}</p>}
                          {credit.level && <p className="text-xs text-slate-500 mt-1">{credit.name === '公积金证明' ? '缴存基数' : '参保类型'}: {credit.level}</p>}
                          {credit.major && <p className="text-xs text-slate-500">{credit.name === '公积金证明' ? '缴存状态' : '缴纳状态'}: {credit.major}</p>}
                          {credit.date && <p className="text-xs text-slate-400 mt-2">{credit.name === '公积金证明' ? '缴存时间' : '缴纳时间'}: {credit.date}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FileCheck size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无征信认证信息</p>
                    <p className="text-xs mt-1">支持公积金证明、社保证明</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      }
      case 'AccountInfo': {
        // 账号信息校验
        const validateAccountField = (key: string, value: string): string => {
          if (key === 'name') {
            if (!value.trim()) return '姓名不能为空';
            if (value.trim().length < 2) return '姓名至少 2 个字符';
            if (value.trim().length > 20) return '姓名不能超过 20 个字符';
          }
          if (key === 'phone' && value) {
            const mobileReg = /^1[3-9]\d{9}$/;
            const landlineReg = /^0\d{2,3}\d{7,8}$/;
            if (!mobileReg.test(value) && !landlineReg.test(value)) return '请输入正确的手机号码';
          }
          if (key === 'email') {
            if (!value.trim()) return '邮箱不能为空';
            const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailReg.test(value)) return '请输入正确的邮箱地址';
          }
          return '';
        };

        const handleAccountSave = async () => {
          const errors: Record<string, string> = {};
          const err = validateAccountField('name', accountInfo.name);
          if (err) errors['name'] = err;
          setAccountErrors(errors);
          if (Object.keys(errors).length > 0) {
            showToast('请修正标红的字段后再保存', 'error');
            return;
          }
          setAccountSaving(true);
          try {
            await updateUser({ name: accountInfo.name });
            await refreshUser();
            showToast('姓名已更新', 'success');
            setAccountEditing(false);
          } catch (error: any) {
            showToast(error.message || '保存失败，请稍后重试', 'error');
          } finally {
            setAccountSaving(false);
          }
        };

        // 发送验证码
        const handleSendVerifyCode = async () => {
          setVerifySending(true);
          try {
            await new Promise(r => setTimeout(r, 800));
            const targetEmail = verifyModal.type === 'email' && verifyModal.step === 'old' ? user?.email : verifyModal.newValue;
            showToast(`验证码已发送至 ${targetEmail}`, 'success');
            setVerifyCountdown(60);
            const timer = setInterval(() => {
              setVerifyCountdown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
              });
            }, 1000);
          } catch (e: any) {
            showToast('验证码发送失败，请稍后重试', 'error');
          } finally {
            setVerifySending(false);
          }
        };

        // 提交验证
        const handleVerifySubmit = async () => {
          if (!verifyCode || verifyCode.length !== 6) {
            showToast('请输入 6 位验证码', 'error');
            return;
          }
          setVerifySubmitting(true);
          try {
            await new Promise(r => setTimeout(r, 600));
            
            // 邮箱双重验证：先验证原邮箱，再验证新邮箱
            if (verifyModal.type === 'email' && verifyModal.step === 'old') {
              // 原邮箱验证通过，进入新邮箱验证
              setVerifyModal(prev => ({ ...prev, step: 'new' }));
              setVerifyCode('');
              setVerifyCountdown(0);
              setVerifySubmitting(false);
              showToast('原邮箱验证通过，请继续验证新邮箱', 'success');
              return;
            }
            
            if (verifyModal.type === 'phone') {
              await updateUser({ phone: verifyModal.newValue });
            }
            // 邮箱修改成功（实际需要后端支持）
            await refreshUser();
            showToast(`${verifyModal.type === 'phone' ? '手机号' : '邮箱'}修改成功`, 'success');
            setVerifyModal({show: false, type: 'phone', newValue: '', step: 'old'});
            setVerifyCode('');
            setVerifyCountdown(0);
          } catch (e: any) {
            showToast(e.message || '验证失败，请重试', 'error');
          } finally {
            setVerifySubmitting(false);
          }
        };

        const openPhoneVerify = () => {
          const phone = accountInfo.phone || '';
          const phoneErr = validateAccountField('phone', phone);
          if (!phone) { showToast('请先输入新手机号', 'error'); return; }
          if (phoneErr) { showToast(phoneErr, 'error'); return; }
          if (phone === (user?.phone || '')) { showToast('新手机号与当前手机号相同', 'warning'); return; }
          setVerifyModal({show: true, type: 'phone', newValue: phone, step: 'old'});
          setVerifyCode(''); setVerifyCountdown(0);
        };

        const openEmailVerify = () => {
          const email = accountInfo.email || '';
          const emailErr = validateAccountField('email', email);
          if (!email) { showToast('请先输入新邮箱', 'error'); return; }
          if (emailErr) { showToast(emailErr, 'error'); return; }
          if (email === (user?.email || '')) { showToast('新邮箱与当前邮箱相同', 'warning'); return; }
          setVerifyModal({show: true, type: 'email', newValue: email, step: 'old'});
          setVerifyCode(''); setVerifyCountdown(0);
        };

        const handlePasswordChange = async () => {
          if (!passwordForm.oldPassword) { showToast('请输入当前密码', 'error'); return; }
          if (!passwordForm.newPassword) { showToast('请输入新密码', 'error'); return; }
          if (passwordForm.newPassword.length < 6) { showToast('新密码至少 6 位', 'error'); return; }
          if (passwordForm.newPassword !== passwordForm.confirmPassword) { showToast('两次密码输入不一致', 'error'); return; }
          setPasswordChanging(true);
          try {
            await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
            showToast('密码修改成功', 'success');
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
          } catch (error: any) {
            showToast(error.message || '密码修改失败，请检查当前密码是否正确', 'error');
          } finally {
            setPasswordChanging(false);
          }
        };

        const thirdPartyLogins = [
          { key: 'wechat', name: '微信', icon: MessageCircle, color: 'text-green-500', bgColor: 'bg-green-50', connected: false },
          { key: 'github', name: 'GitHub', icon: GithubIcon, color: 'text-slate-800', bgColor: 'bg-slate-50', connected: false },

          { key: 'google', name: 'Google', icon: Globe, color: 'text-red-500', bgColor: 'bg-red-50', connected: false },
        ];

        const maskPhone = (phone: string) => phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '';
        const maskEmail = (email: string) => {
          if (!email) return '';
          const [local, domain] = email.split('@');
          if (local.length <= 2) return `${local[0]}***@${domain}`;
          return `${local[0]}${local[1]}***@${domain}`;
        };
        const formatUID = (id: number) => `UID: ${id}`;

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">账号信息</h3>
              {!accountEditing ? (
                <button
                  onClick={() => { setAccountEditing(true); setAccountInfo({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', avatar_url: user?.avatar_url || '' }); }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  <Edit3 size={14} /> 编辑
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setAccountEditing(false); setAccountErrors({}); setAccountInfo({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', avatar_url: user?.avatar_url || '' }); }} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">取消</button>
                  <button onClick={handleAccountSave} disabled={accountSaving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {accountSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存
                  </button>
                </div>
              )}
            </div>

            {/* 个人信息 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">个人信息</h4>
              <div className="flex items-center gap-5 mb-5 pb-5 border-b border-slate-100">
                <div className="relative group flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-black overflow-hidden">
                    {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : (user?.name?.charAt(0)?.toUpperCase() || 'U')}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        showToast('图片大小不能超过 5MB', 'error');
                        return;
                      }
                      setAvatarUploading(true);
                      try {
                        await uploadAvatar(file);
                        await refreshUser();
                        showToast('头像更新成功', 'success');
                      } catch (err: any) {
                        showToast(err.message || '头像上传失败', 'error');
                      } finally {
                        setAvatarUploading(false);
                        if (avatarInputRef.current) avatarInputRef.current.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
                  >
                    {avatarUploading ? <Loader2 size={14} className="text-white animate-spin" /> : <Camera size={14} className="text-white" />}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-black text-slate-900">{user?.name || '未设置姓名'}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                    <span className="font-mono select-all bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{formatUID(user?.id || 0)}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1.5">
                      {(() => {
                        const hasPersonalCert = personalCerts.some((c: any) => c.category === 'identity' && c.status === 'valid');
                        const hasEnterpriseCert = enterpriseCerts.some((c: any) => c.status === 'valid');
                        const roles: string[] = [];
                        if (hasPersonalCert) roles.push('求职者');
                        if (hasEnterpriseCert) roles.push('招聘方');
                        if (roles.length === 0) roles.push(userRole === 'employer' ? '招聘方' : '求职者');
                        return roles.map((r, i) => (
                          <span key={r} className="flex items-center gap-1">
                            {i > 0 && <span className="text-slate-300">/</span>}
                            <span className={`inline-flex items-center gap-0.5 ${roles.length > 1 ? 'bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded' : ''}`}>
                              {r}
                              {((r === '求职者' && hasPersonalCert) || (r === '招聘方' && hasEnterpriseCert)) && (
                                <Verified size={12} className="text-indigo-500" />
                              )}
                            </span>
                          </span>
                        ));
                      })()}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>{user?.account_tier === 'ULTRA' ? 'Ultra 旗舰版' : user?.account_tier === 'PRO' ? 'Pro 专业版' : '免费版'}</span>
                    <span className="text-slate-300">·</span>
                    <span>注册于 {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '未知'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">姓名 / 昵称</label>
                  {accountEditing ? (
                    <div>
                      <input type="text" value={accountInfo.name} onChange={e => { setAccountInfo(p => ({ ...p, name: e.target.value })); setAccountErrors(p => ({ ...p, name: validateAccountField('name', e.target.value) })); }}
                        className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${accountErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`}
                        placeholder="请输入姓名或昵称" />
                      {accountErrors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {accountErrors.name}</p>}
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">{user?.name || '未设置'}</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-500">手机号码</label>
                    <span className="text-xs text-amber-600 flex items-center gap-1"><ShieldCheck size={10} /> 修改需验证</span>
                  </div>
                  {accountEditing ? (
                    <div>
                      <div className="flex gap-2">
                        <input type="tel" value={accountInfo.phone} onChange={e => { setAccountInfo(p => ({ ...p, phone: e.target.value })); setAccountErrors(p => ({ ...p, phone: validateAccountField('phone', e.target.value) })); }}
                          className={`flex-1 bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${accountErrors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-300'}`}
                          placeholder="请输入手机号" />
                        <button onClick={openPhoneVerify} className="flex-shrink-0 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2.5 rounded-lg border border-indigo-200 transition-all">验证绑定</button>
                      </div>
                      {accountErrors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {accountErrors.phone}</p>}
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 flex items-center justify-between">
                      <span>{user?.phone ? maskPhone(user.phone) : <span className="text-slate-400">未绑定</span>}</span>
                      {user?.phone && <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={11} /> 已绑定</span>}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 安全设置 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">安全设置</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h5 className="text-sm font-medium text-slate-800">登录密码</h5>
                    <p className="text-xs text-slate-500">定期修改密码有助于保护账号安全</p>
                  </div>
                  <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">{showPasswordForm ? '收起' : '修改密码'}</button>
                </div>
                {showPasswordForm && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 animate-in fade-in duration-300">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">当前密码</label>
                      <input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" placeholder="请输入当前密码" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">新密码</label>
                      <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" placeholder="至少 6 位字符" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">确认新密码</label>
                      <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" placeholder="再次输入新密码" />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => { setShowPasswordForm(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-4 py-2 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all">取消</button>
                      <button onClick={handlePasswordChange} disabled={passwordChanging} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                        {passwordChanging ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} 确认修改
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h5 className="text-sm font-medium text-slate-800">安全邮箱</h5>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> 已绑定</span>
                    <button 
                      onClick={() => {
                        setShowEmailInput(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      修改
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 第三方账号绑定 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-1">第三方账号绑定</h4>
              <p className="text-xs text-slate-400 mb-4">绑定后可使用第三方账号快速登录</p>
              <div className="space-y-3">
                {thirdPartyLogins.map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                        <item.icon size={16} className={item.color} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.connected ? '已绑定' : '未绑定'}</div>
                      </div>
                    </div>
                    <button onClick={() => showToast(`${item.name} 第三方登录功能即将上线`, 'warning')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700">{item.connected ? '解绑' : '绑定'}</button>
                  </div>
                ))}
              </div>
            </div>

            {/* 偏好设置 */}
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">偏好设置</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h5 className="text-sm font-medium text-slate-800">深色模式</h5>
                    <p className="text-xs text-slate-500">切换深色主题减少眼睛疲劳</p>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    className={`w-11 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* 邮箱输入弹窗 */}
            {showEmailInput && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => { setShowEmailInput(false); setNewEmailValue(''); }}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
                  <h4 className="text-lg font-black text-slate-900 mb-1">修改安全邮箱</h4>
                  <p className="text-xs text-slate-500 mb-5">请输入新的邮箱地址</p>
                  
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">当前邮箱</label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-500">{user?.email}</div>
                  </div>
                  
                  <div className="mb-5">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">新邮箱地址</label>
                    <input 
                      type="email" 
                      value={newEmailValue}
                      onChange={e => setNewEmailValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                      placeholder="请输入新的邮箱地址"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setShowEmailInput(false); setNewEmailValue(''); }} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">取消</button>
                    <button 
                      onClick={() => {
                        if (!newEmailValue) {
                          showToast('请输入新邮箱地址', 'error');
                          return;
                        }
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailValue)) {
                          showToast('请输入有效的邮箱地址', 'error');
                          return;
                        }
                        if (newEmailValue === user?.email) {
                          showToast('新邮箱与当前邮箱相同', 'warning');
                          return;
                        }
                        setShowEmailInput(false);
                        setVerifyModal({ show: true, type: 'email', newValue: newEmailValue, step: 'old' });
                        setNewEmailValue('');
                      }} 
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
                    >
                      下一步
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 二次验证弹窗 */}
            {verifyModal.show && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => { setVerifyModal({show: false, type: 'phone', newValue: '', step: 'old'}); setVerifyCode(''); }}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
                  <h4 className="text-lg font-black text-slate-900 mb-1">安全验证</h4>
                  <p className="text-xs text-slate-500 mb-5">
                    {verifyModal.type === 'email' 
                      ? (verifyModal.step === 'old' ? '请先验证当前绑定的邮箱' : '请验证新邮箱地址')
                      : '修改手机号需要验证身份'}
                  </p>

                  {/* 邮箱修改进度指示 */}
                  {verifyModal.type === 'email' && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${verifyModal.step === 'old' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px]">1</span>
                        验证原邮箱
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${verifyModal.step === 'new' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                        <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px]">2</span>
                        验证新邮箱
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">
                      {verifyModal.type === 'phone' ? '新手机号' : (verifyModal.step === 'old' ? '当前邮箱' : '新邮箱')}
                    </label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800">
                      {verifyModal.type === 'email' && verifyModal.step === 'old' ? user?.email : verifyModal.newValue}
                    </div>
                  </div>

                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg mb-4 flex items-start gap-2">
                    <Info size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    <span>
                      {verifyModal.type === 'email' 
                        ? (verifyModal.step === 'old' 
                            ? `验证码将发送至当前邮箱 ${user?.email}` 
                            : `验证码将发送至新邮箱 ${verifyModal.newValue}`)
                        : `验证码将发送至新手机号 ${verifyModal.newValue}`}
                    </span>
                  </div>

                  <div className="mb-5">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">验证码</label>
                    <div className="flex gap-2">
                      <input type="text" maxLength={6} value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        placeholder="6 位验证码" />
                      <button onClick={handleSendVerifyCode} disabled={verifySending || verifyCountdown > 0}
                        className="flex-shrink-0 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 min-w-[90px]">
                        {verifySending ? <Loader2 size={14} className="animate-spin mx-auto" /> : verifyCountdown > 0 ? `${verifyCountdown}s` : '发送'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setVerifyModal({show: false, type: 'phone', newValue: '', step: 'old'}); setVerifyCode(''); }} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">取消</button>
                    <button onClick={handleVerifySubmit} disabled={verifySubmitting || verifyCode.length !== 6} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                      {verifySubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : '确认'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'Account':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">账户等级与特权</h3>
            <div className="bg-white rounded p-10 border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-full md:w-1/3 bg-indigo-600 rounded p-8 text-white relative overflow-hidden">
                  <Zap className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
                  <div className="text-xs font-black uppercase text-indigo-200 mb-4">当前方案</div>
                  <div className="text-4xl font-black mb-2">{accountTierInfo.tierName}</div>
                  <p className="text-slate-400 text-xs font-medium mb-8">
                    {accountTierInfo.tier === 'ultra' ? '企业旗舰版，尊享所有高级功能' : 
                     accountTierInfo.tier === 'pro' ? '适用于中型以上规模的 AI 驱动团队' : 
                     '基础版，可升级解锁更多功能'}
                  </p>
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-black transition-all">续费当前套餐</button>
                </div>
                <div className="flex-1 space-y-6">
                  <h4 className="text-lg font-black text-slate-900">包含的核心特权</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(accountTierInfo.privileges || []).map((p: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" /> {p}
                      </div>
                    ))}
                  </div>
                  {accountTierInfo.tier !== 'ultra' && (
                    <div className="pt-6">
                      <button 
                        onClick={() => navigate('/pricing')}
                        className="bg-indigo-600 text-white px-8 py-4 rounded font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                        升级到 Devnors 1.0 Ultra 旗舰版 <ArrowUpRight size={18} />
                      </button>
                    </div>
                  )}
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
              {llmConfigs.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400">
                  <Bot size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无 AI 引擎配置</p>
                </div>
              ) : llmConfigs.map((config: any, i: number) => (
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
        const currentKey = apiKeys.length > 0 ? apiKeys[0] : null;
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
                       <ShieldCheck size={12} /> {currentKey ? currentKey.name : 'Production Environment Key'}
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                       <div className="flex-1 bg-white/5 border border-white/10 rounded px-6 py-4 font-mono text-lg tracking-tighter text-white truncate w-full">
                          {currentKey ? currentKey.key : '暂无 API Key，请点击生成'}
                       </div>
                       <button 
                         onClick={() => currentKey && handleCopyAPIKey(currentKey.key)}
                         className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded font-black text-sm transition-all whitespace-nowrap"
                       >
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
        const handleInviteMember = async () => {
          if (!inviteForm.phone) {
            alert('请输入手机号');
            return;
          }
          if (!/^1\d{10}$/.test(inviteForm.phone)) {
            alert('请输入正确的手机号');
            return;
          }
          
          setInviteLoading(true);
          try {
            await inviteTeamMember({
              phone: inviteForm.phone,
              role: inviteForm.role
            }, userId);
            
            // 重新加载团队成员
            const teamData = await getTeamMembers(userId);
            if (teamData && teamData.members) {
              setTeamMembers(teamData.members);
              setTeamInfo({
                is_admin: teamData.is_admin,
                enterprise_id: teamData.enterprise_id,
                enterprise_name: teamData.enterprise_name
              });
            }
            
            setShowInviteModal(false);
            setInviteForm({phone: '', email: '', role: 'viewer', inviteType: 'phone'});
          } catch (err: any) {
            alert(err.message || '添加失败');
          } finally {
            setInviteLoading(false);
          }
        };
        
        const handleDeleteMember = async (memberId: number) => {
          if (!confirm('确定要移除该成员吗？')) return;
          try {
            await deleteTeamMember(memberId, userId);
            setTeamMembers(prev => prev.filter(m => m.id !== String(memberId)));
          } catch (err: any) {
            alert(err.message || '移除失败');
          }
        };
        
        const handleTransferAdmin = async () => {
          if (!transferTargetId) return;
          if (!confirm('确定要将管理员权限移交给该成员吗？此操作不可撤销。')) return;
          try {
            await transferAdmin(transferTargetId, userId);
            // 重新加载
            const teamData = await getTeamMembers(userId);
            if (teamData && teamData.members) {
              setTeamMembers(teamData.members);
              setTeamInfo({
                is_admin: teamData.is_admin,
                enterprise_id: teamData.enterprise_id,
                enterprise_name: teamData.enterprise_name
              });
            }
            setShowTransferModal(false);
            setTransferTargetId(null);
          } catch (err: any) {
            alert(err.message || '移交失败');
          }
        };
        
        const handleApproveMember = async (memberId: number, approve: boolean) => {
          try {
            await approveMember(memberId, approve, userId);
            // 重新加载
            const teamData = await getTeamMembers(userId);
            if (teamData && teamData.members) {
              setTeamMembers(teamData.members);
            }
          } catch (err: any) {
            alert(err.message || '操作失败');
          }
        };
        
        const pendingMembers = teamMembers.filter(m => m.status?.toLowerCase() === 'pending_approval');
        const activeMembers = teamMembers.filter(m => m.status?.toLowerCase() !== 'pending_approval');
        
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 头部 */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">团队成员与权限控制</h3>
                {teamInfo.enterprise_name && (
                  <p className="text-sm text-slate-500 mt-1">
                    企业：{teamInfo.enterprise_name}
                    {teamInfo.is_admin && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">主管理员</span>}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {teamInfo.is_admin && (
                  <button 
                    onClick={() => setShowTransferModal(true)}
                    className="bg-white text-slate-700 px-5 py-2.5 rounded border border-slate-200 font-bold text-sm flex items-center gap-2 hover:border-amber-400 hover:text-amber-600 transition-all"
                  >
                    <ShieldAlert size={16} /> 移交管理员
                  </button>
                )}
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                >
                  <UserPlus size={16} /> 添加成员
                </button>
              </div>
            </div>
            
            {/* 待审批申请 */}
            {pendingMembers.length > 0 && teamInfo.is_admin && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h4 className="text-base font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <Clock size={18} /> 待审批的加入申请 ({pendingMembers.length})
                </h4>
                <div className="space-y-3">
                  {pendingMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600">
                          {member.name?.charAt(0) || member.phone?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{member.name || member.phone || member.email}</div>
                          <div className="text-xs text-slate-500">{member.phone || member.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveMember(Number(member.id), false)}
                          className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                        >
                          拒绝
                        </button>
                        <button 
                          onClick={() => handleApproveMember(Number(member.id), true)}
                          className="px-4 py-2 text-sm font-bold text-white bg-emerald-500 rounded hover:bg-emerald-600 transition-colors"
                        >
                          批准
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 成员列表 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
               {activeMembers.length === 0 ? (
                 <div className="text-center py-16 text-slate-400">
                   <Users2 size={48} className="mx-auto mb-4 opacity-50" />
                   <p className="text-base font-bold">暂无团队成员</p>
                   <p className="text-sm mt-2">点击上方按钮添加新成员加入</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-black tracking-wider text-slate-500">
                             <th className="py-4 pl-8">成员信息</th>
                             <th className="py-4">角色</th>
                             <th className="py-4">状态</th>
                             <th className="py-4 text-right pr-8">操作</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {activeMembers.map((member: any) => (
                            <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                               <td className="py-5 pl-8">
                                  <div className="flex items-center gap-4">
                                     <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center font-bold text-indigo-600 border-2 border-white shadow">
                                       {member.name?.charAt(0) || member.phone?.charAt(0) || member.email?.charAt(0) || '?'}
                                     </div>
                                     <div>
                                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                          {member.name || member.phone || member.email?.split('@')[0]}
                                          {member.is_admin && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">管理员</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                          {member.phone && <span className="mr-3">{member.phone}</span>}
                                          {member.email && <span>{member.email}</span>}
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td className="py-5">
                                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                     member.role?.toLowerCase() === 'admin' ? 'bg-rose-50 text-rose-600' : 
                                     member.role?.toLowerCase() === 'recruiter' ? 'bg-blue-50 text-blue-600' :
                                     'bg-slate-100 text-slate-600'
                                  }`}>
                                     {member.role === 'admin' ? '管理员' : member.role === 'recruiter' ? '招聘官' : '查看者'}
                                  </span>
                               </td>
                               <td className="py-5">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${
                                       member.status?.toLowerCase() === 'active' ? 'bg-emerald-500' : 
                                       member.status?.toLowerCase() === 'invited' ? 'bg-amber-400' : 'bg-slate-300'
                                     }`}></div>
                                     <span className="text-xs font-bold text-slate-600">
                                       {member.status?.toLowerCase() === 'active' ? '已加入' : 
                                        member.status?.toLowerCase() === 'invited' ? '待接受' : member.status}
                                     </span>
                                  </div>
                               </td>
                               <td className="py-5 text-right pr-8">
                                  {teamInfo.is_admin && !member.is_admin && (
                                    <div className="flex justify-end gap-1">
                                       <button 
                                         onClick={() => {
                                           setTransferTargetId(member.member_id);
                                           setShowTransferModal(true);
                                         }}
                                         className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                                         title="设为管理员"
                                       >
                                         <ShieldAlert size={18} />
                                       </button>
                                       <button 
                                         onClick={() => handleDeleteMember(Number(member.id))}
                                         className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                         title="移除成员"
                                       >
                                         <Trash2 size={18} />
                                       </button>
                                    </div>
                                  )}
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </div>
            
            {/* 邀请成员弹窗 */}
            {showInviteModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-black text-slate-900 mb-6">添加团队成员</h3>
                  
                  {/* 手机号输入 */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">手机号</label>
                    <div className="flex">
                      <span className="px-4 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-500">+86</span>
                      <input
                        type="tel"
                        value={inviteForm.phone}
                        onChange={(e) => setInviteForm(prev => ({...prev, phone: e.target.value}))}
                        placeholder="请输入手机号"
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  {/* 角色选择 */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">成员角色</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm(prev => ({...prev, role: e.target.value}))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="viewer">查看者 - 只能查看信息</option>
                      <option value="recruiter">招聘官 - 可以管理招聘流程</option>
                      <option value="admin">管理员 - 拥有全部权限</option>
                    </select>
                  </div>
                  
                  {/* 提示信息 */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <p className="text-xs text-blue-700">
                      如果该手机号已注册账号，将直接加入团队；否则将创建邀请记录，待对方注册后自动加入。
                    </p>
                  </div>
                  
                  {/* 按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteForm({phone: '', email: '', role: 'viewer', inviteType: 'phone'});
                      }}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleInviteMember}
                      disabled={inviteLoading}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {inviteLoading ? '添加中...' : '确认添加'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 移交管理员弹窗 */}
            {showTransferModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-black text-slate-900 mb-2">移交管理员权限</h3>
                  <p className="text-sm text-slate-500 mb-6">将主管理员权限移交给其他成员后，您将失去管理员权限。</p>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                      <AlertTriangle size={16} />
                      此操作不可撤销，请谨慎操作
                    </p>
                  </div>
                  
                  {/* 选择新管理员 */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">选择新管理员</label>
                    <select
                      value={transferTargetId || ''}
                      onChange={(e) => setTransferTargetId(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">请选择成员</option>
                      {activeMembers.filter(m => !m.is_admin && m.member_id).map((member: any) => (
                        <option key={member.id} value={member.member_id}>
                          {member.name || member.phone || member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowTransferModal(false);
                        setTransferTargetId(null);
                      }}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleTransferAdmin}
                      disabled={!transferTargetId}
                      className="flex-1 py-3 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      确认移交
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'Audit':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">系统安全日志</h3>
            <div className="bg-white rounded p-10 border border-slate-100 shadow-sm space-y-6">
               <div className="flex items-center gap-6 p-6 bg-slate-50 rounded border border-slate-100">
                  <div className="w-14 h-14 bg-white rounded flex items-center justify-center shadow-sm text-slate-400"><Laptop size={24} /></div>
                  <div className="flex-1">
                     <h4 className="text-base font-black text-slate-900">安全性监控</h4>
                     <p className="text-sm text-slate-500 font-medium mt-1">您可以查看并监控平台内所有成员、智能体以及 API 的调用足迹，确保招聘过程 100% 合规与可溯源。</p>
                  </div>
               </div>
               <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Laptop size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无安全日志</p>
                    </div>
                  ) : auditLogs.map((log: any, idx: number) => (
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
                  下载完整安全日志 (.CSV)
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
      {/* Toast 提示 */}
      {toast.show && (
        <div className={`fixed top-24 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-in slide-in-from-right duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 
          toast.type === 'error' ? 'bg-red-500 text-white' : 
          'bg-amber-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
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
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic ">“多智能体系统运行良好，所有设置映射已同步至边缘节点。”</p>
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

// 图标映射（移到组件外部避免重复创建）
const notificationIconMap: Record<string, any> = {
  'Target': Target,
  'Calendar': Calendar,
  'Bell': Bell,
  'MessageSquare': MessageSquare,
  'Eye': Eye,
  'AlertCircle': AlertCircle,
  'CheckCircle2': CheckCircle2,
  'Users': Users,
  'Zap': Zap,
  'Briefcase': Briefcase,
};

// --- 消息中心页面 ---
const NotificationCenterView = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const userId = user?.id || 0;
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'match' | 'interview' | 'message'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingRead, setMarkingRead] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // 加载通知推送设置
  useEffect(() => {
    const loadNotificationSetting = async () => {
      if (!userId) return;
      try {
        const { getSettings } = await import('./services/apiService');
        const data = await getSettings(userId);
        setNotificationEnabled(data.notification_enabled ?? true);
      } catch (e) { /* ignore */ }
    };
    loadNotificationSetting();
  }, [userId]);

  const toggleNotificationEnabled = async () => {
    const newVal = !notificationEnabled;
    setNotificationEnabled(newVal);
    try {
      const { updateSettings } = await import('./services/apiService');
      await updateSettings({ user_id: userId, notification_enabled: newVal });
    } catch (e) {
      setNotificationEnabled(!newVal); // rollback
    }
  };

  // 加载通知数据
  const loadNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { getNotifications } = await import('./services/apiService');
      const response = await getNotifications(userId, {
        type: activeTab === 'all' ? undefined : activeTab,
      });
      
      // 处理返回的数据，将 icon 字符串映射为组件
      const processedNotifications = (response.notifications || []).map((n: any) => ({
        ...n,
        icon: notificationIconMap[n.icon] || Bell,
      }));
      
      setNotifications(processedNotifications);
      setTotal(response.total || 0);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('加载通知失败:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId, activeTab]);

  // 标记全部已读 - 使用新数组确保 React 检测到变化
  const markAllAsRead = async () => {
    if (markingRead || notifications.length === 0) return;
    setMarkingRead(true);
    try {
      const { markNotificationRead } = await import('./services/apiService');
      await markNotificationRead(userId);
      // 创建全新的数组和对象，确保 React 检测到状态变化
      const updatedNotifications = notifications.map(n => {
        return { ...n, read: true };
      });
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('标记已读失败:', error);
    } finally {
      setMarkingRead(false);
    }
  };

  // 标记单条已读
  const markAsRead = async (id: number) => {
    try {
      const { markNotificationRead } = await import('./services/apiService');
      await markNotificationRead(userId, id);
      const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 删除通知
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const { deleteNotification } = await import('./services/apiService');
      await deleteNotification(userId, id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  const tabs = [
    { id: 'all', label: '全部', count: total },
    { id: 'system', label: '系统通知', icon: Bell },
    { id: 'match', label: '匹配动态', icon: Target },
    { id: 'interview', label: '面试相关', icon: Calendar },
    { id: 'message', label: '消息互动', icon: MessageSquare },
  ];

  if (!isLoggedIn) {
    return (
      <div className="pt-40 text-center">
        <Bell className="mx-auto text-slate-300 mb-4" size={64} />
        <p className="text-slate-500 font-bold mb-4">请先登录查看消息</p>
        <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-8 py-3 rounded font-black">
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">消息中心</h1>
          <p className="text-slate-500">
            {unreadCount > 0 ? `您有 ${unreadCount} 条未读消息` : '暂无未读消息'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              disabled={markingRead}
              className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markingRead ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {markingRead ? '处理中...' : '全部已读'}
            </button>
          )}
          <button 
            onClick={loadNotifications}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
            title="刷新"
          >
            <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
            {tab.id === 'all' && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Inbox className="mx-auto text-slate-300 mb-4" size={64} />
          <p className="text-slate-500 font-bold">暂无相关消息</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <div
              key={`notification-${notification.id}-${notification.read}`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
                navigate(notification.link);
              }}
              className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-lg group ${
                notification.read === true ? 'border-slate-100' : 'border-indigo-200 bg-indigo-50/30'
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 ${notification.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {notification.icon && <notification.icon size={24} className={notification.color} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${notification.read === true ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      {notification.read !== true && (
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 whitespace-nowrap">{notification.time}</span>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="删除"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${notification.read === true ? 'text-slate-500' : 'text-slate-600'}`}>
                    {notification.content}
                  </p>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 通知设置 */}
      <div className="mt-8 bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">智能消息推送</h4>
            <p className="text-xs text-slate-500 mt-0.5">简历初筛或约面成功时通过邮件通知</p>
          </div>
          <button 
            onClick={toggleNotificationEnabled}
            className={`w-11 h-6 rounded-full relative transition-colors ${notificationEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationEnabled ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Token 与资金管理页面 ---
const TokenManagementView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || 0;
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  
  // 动态数据状态
  const [tokenStats, setTokenStats] = useState<any>(null);
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { getTokenStats, getTokenHistory, getTokenPackages } = await import('./services/apiService');
        
        const [statsRes, historyRes, packagesRes] = await Promise.all([
          getTokenStats(userId),
          getTokenHistory(userId, 5),
          getTokenPackages()
        ]);
        
        setTokenStats(statsRes);
        setTokenHistory(historyRes.items || []);
        setPackages(packagesRes.packages || []);
      } catch (error) {
        console.error('加载 Token 数据失败:', error);
        setTokenStats({
          balance: 100000,
          balance_display: '0.10M',
          today_usage: 0,
          today_usage_display: '0',
          estimated_days: 999
        });
        setPackages([
          { id: 'starter', name: '入门版', tokens_display: '100K', price: 99 },
          { id: 'pro', name: '专业版', tokens_display: '1M', price: 799, popular: true },
          { id: 'enterprise', name: '企业版', tokens_display: '10M', price: 6999 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);
  
  if (loading) {
    return (
      <div className="pt-40 text-center">
        <Loader2 className="mx-auto text-indigo-600 animate-spin mb-4" size={40} />
        <p className="text-slate-400 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 px-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* 顶部导航 */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 mb-6 text-sm font-medium transition-colors">
        <ChevronLeft size={18} /> 返回
      </button>

      {/* 页面标题 */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">资金账户</h1>
        <p className="text-slate-400 text-sm">管理 Token 余额与充值</p>
      </div>

      {/* 余额卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Gem size={160} />
          </div>
          <div className="relative">
            <p className="text-indigo-200 text-xs font-medium mb-2">可用余额</p>
            <div className="text-5xl font-bold mb-4">{tokenStats?.balance_display || '0'}</div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-indigo-200">
                <Clock size={14} /> 预计可用 {tokenStats?.estimated_days || 0} 天
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-medium mb-2">今日消耗</p>
          <div className="text-3xl font-bold text-slate-900 mb-1">{tokenStats?.today_usage_display || '0'}</div>
          <p className="text-xs text-slate-400">Tokens</p>
        </div>
      </div>

      {/* 充值 */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">账户充值</h2>
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          {/* 金额输入 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-600 mb-2">充值金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">¥</span>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 text-3xl font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          
          {/* 快捷金额 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[100, 500, 1000, 2000, 5000].map((amount) => (
              <button
                key={amount}
                onClick={() => setRechargeAmount(String(amount))}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  rechargeAmount === String(amount)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ¥{amount}
              </button>
            ))}
          </div>
          
          {/* Token 换算提示 */}
          {rechargeAmount && Number(rechargeAmount) > 0 && (
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-indigo-700">
                充值 <span className="font-bold">¥{rechargeAmount}</span> 可获得约 <span className="font-bold">{(Number(rechargeAmount) * 10000).toLocaleString()}</span> Tokens
              </p>
            </div>
          )}
          
          <button 
            disabled={!rechargeAmount || Number(rechargeAmount) <= 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CreditCard size={18} /> 立即充值
          </button>
        </div>
      </div>

      {/* 消费记录 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">消费记录</h2>
          <button className="text-sm text-indigo-600 font-medium hover:underline">查看全部</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {(tokenHistory.length > 0 ? tokenHistory : [
            { date: '今天 14:30', type: '简历解析', tokens: 1200, cost: '¥0.12' },
            { date: '今天 11:20', type: '面试评估', tokens: 3500, cost: '¥0.35' },
            { date: '昨天 16:45', type: '市场分析', tokens: 2800, cost: '¥0.28' },
          ]).map((h: any, i: number) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{h.type}</p>
                  <p className="text-xs text-slate-400">{h.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">-{h.tokens.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{h.cost}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 工作台页面 ---
const WorkbenchView = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  // 使用当前登录用户的 ID 获取数据（纯动态数据）
  const userId = user?.id || 0;
  const { data: flowsData, loading: flowsLoading } = useFlows(10);
  const { data: todosData, loading: todosLoading } = useTodos(userId);

  // 转换 flows 数据为前端需要的格式
  const matchingData = flowsData.map((flow: any) => ({
    id: flow.id,
    candidate: flow.candidateName || '未知候选人',
    job: flow.role || '未知职位',
    company: flow.company || '未知公司',
    salary: '面议',
    matchScore: flow.matchScore || 0,
    currentStep: flow.currentStep || 1,
    nodes: ['解析', '对标', '初试', '复试', '终审'],
    lastAction: flow.timeline?.[0]?.action || '流程进行中',
    status: flow.status === 'active' ? '面试中' : flow.status === 'completed' ? 'Offer' : '进行中',
  }));

  const tokenStats = [
    { agent: '简历解析智能体', tokens: '420,500', share: '35%' },
    { agent: '面试评估智能体', tokens: '312,200', share: '26%' },
    { agent: '市场分析智能体', tokens: '288,400', share: '24%' },
    { agent: '路由调度智能体', tokens: '180,900', share: '15%' },
  ];
  
  // 转换 todos 数据 - 根据字符串 icon 映射到组件
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'UserIcon': return UserIcon;
      case 'Building2': return Building2;
      case 'Calendar': return Calendar;
      case 'Zap': return Zap;
      default: return Calendar;
    }
  };
  
  const todosWithIcons = todosData.map((todo: any) => {
    const priorityLower = (todo.priority || '').toLowerCase();
    return {
      ...todo,
      task: todo.title || todo.task,
      icon: getIconComponent(todo.icon),
      priority: priorityLower === 'high' ? 'High' : priorityLower === 'medium' ? 'Medium' : 'Low',
    };
  });

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 ">智能工作台</h1>
          <p className="text-slate-500 font-medium ">由 Devnors MAS 多智能体系统驱动的全局招聘概览</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/invite')}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95    "
          >
            <Users2 size={20} className="text-emerald-500" /> 邀请
          </button>
          <button 
            onClick={() => navigate('/tokens')}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95    "
          >
            <CircleDollarSign size={20} className="text-amber-500" /> 资金账户
          </button>
          <button 
            onClick={() => navigate(`/workbench/todo/${todosWithIcons[0]?.id || '1'}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95 "
          >
            <Bot size={20} /> AI助手
          </button>
        </div>
      </div>

      <div className="mb-10 bg-white p-8 rounded-lg border border-slate-100 card-shadow  ">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 ">
            <ListTodo className="text-indigo-600" /> 任务中心
          </h2>
          <button 
            onClick={() => navigate('/workbench/todos')}
            className="flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-700 transition-colors  "
          >
            查看全部 <ArrowRight size={16} />
          </button>
        </div>
        {todosLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : !isLoggedIn ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserIcon size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 text-sm font-medium mb-2">请先登录</p>
            <p className="text-slate-300 text-xs mb-4">登录后可查看您的任务</p>
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
            >
              立即登录
            </button>
          </div>
        ) : todosWithIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ListTodo size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 text-sm font-medium mb-2">暂无任务</p>
            <p className="text-slate-300 text-xs">AI 助手会自动为您生成任务</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {todosWithIcons.slice(0, 3).map((todo: any) => {
            const TodoIconComp = todo.icon;
            return (
            <div 
              key={todo.id} 
              onClick={() => navigate(`/workbench/todo/${todo.id}`)}
              className="group cursor-pointer p-6 bg-slate-50 rounded border border-slate-100 flex items-center gap-4 hover:bg-white hover:border-indigo-200 transition-all   "
            >
              <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-indigo-600 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <TodoIconComp size={20} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ">
                  {todo.priority === 'High' ? '核心任务' : todo.priority === 'Medium' ? '常规任务' : '建议任务'}
                </div>
                <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 ">{todo.task}</div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600" />
            </div>
          )})}
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-8">
          <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow overflow-hidden  ">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 ">
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
                  <tr className="border-b border-slate-50 text-xs uppercase font-black tracking-widest text-slate-400 ">
                    <th className="pb-4 pl-2">候选人与目标岗位</th>
                    <th className="pb-4 text-center">匹配分</th>
                    <th className="pb-4">薪资范围</th>
                    <th className="pb-4">核心节点进度</th>
                    <th className="pb-4">最新 AI 动作</th>
                    <th className="pb-4 text-right pr-2">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 ">
                  {matchingData.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => navigate(`/workbench/flow/${item.id}`)}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer /50"
                    >
                      <td className="py-5 pl-2">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-indigo-50 ">
                             {item.candidate.charAt(0)}
                           </div>
                           <div>
                             <div className="font-black text-slate-900 text-sm ">{item.candidate}</div>
                             <div className="text-xs font-bold text-indigo-600 mt-0.5">{item.company}</div>
                             <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 ">
                               <Briefcase size={10} /> {item.job}
                             </div>
                           </div>
                        </div>
                      </td>
                      <td className="py-5">
                         <div className="flex flex-col items-center gap-1">
                           <div className={`px-3 py-1 rounded-full text-[11px] font-black shadow-sm ${item.matchScore >= 90 ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600  '}`}>
                             {item.matchScore}%
                           </div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase">Confidence</div>
                         </div>
                      </td>
                      <td className="py-5">
                        <div className="text-sm font-bold text-slate-700 ">{item.salary}</div>
                      </td>
                      <td className="py-5">
                         <div className="flex items-center gap-2">
                            {['解析', '对标', '初试', '复试'].map((node, nIdx) => (
                              <div key={nIdx} className="flex items-center">
                                <div 
                                  className={`w-2 h-2 rounded-full transition-all duration-500 ${nIdx < item.currentStep ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                  title={node}
                                ></div>
                                {nIdx < 3 && <div className={`w-4 h-0.5 ${nIdx < item.currentStep - 1 ? 'bg-indigo-600' : 'bg-slate-100 '}`}></div>}
                              </div>
                            ))}
                            <span className="ml-2 text-xs font-bold text-slate-500 ">{item.nodes[item.currentStep - 1]}</span>
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
  
  const { user, isLoggedIn } = useAuth();
  const userId = user?.id || 0;
  
  // 使用 API 获取待办事项数据（纯动态数据）
  const { data: todosData, loading: todosLoading } = useTodos(userId);
  const allTodos = todosData;
  
  const filteredTodos = useMemo(() => {
    if (filter === 'all') return allTodos;
    return allTodos.filter((todo: any) => todo.source === filter);
  }, [filter, allTodos]);

  const stats = useMemo(() => ({
    total: allTodos.length,
    userCreated: allTodos.filter((t: any) => t.source === 'user').length,
    agentAssigned: allTodos.filter((t: any) => t.source === 'agent').length,
    completed: allTodos.filter((t: any) => (t.progress || 0) === 100).length,
  }), [allTodos]);

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
        {todosLoading ? (
          <div className="col-span-2 flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredTodos.map((todo: any) => {
          // 获取图标组件
          const IconComponent = todo.icon === 'UserIcon' ? UserIcon : 
                               todo.icon === 'Building2' ? Building2 : Calendar;
          // 兼容静态数据的 task 字段和动态数据的 title 字段
          const todoTitle = todo.title || todo.task;
          const priority = (todo.priority || 'medium').toLowerCase();
          const priorityDisplay = priority.charAt(0).toUpperCase() + priority.slice(1);
          
          return (
          <div 
            key={todo.id}
            onClick={() => navigate(`/workbench/todo/${todo.id}`)}
            className="group bg-white rounded p-6 border border-slate-100 shadow-lg hover:shadow-xl hover:border-indigo-200 cursor-pointer transition-all animate-in fade-in slide-in-from-bottom-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {typeof todo.icon === 'function' ? <todo.icon size={24} /> : <IconComponent size={24} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{todoTitle}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
                      priority === 'high' ? 'bg-rose-50 text-rose-600' : 
                      priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {priorityDisplay}
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
        )})}
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

// --- 待办详情页（重定向到 AI 助手） ---
const TodoDetailView = () => {
  const { todoId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // 重定向到 AI 助手页面并带上任务 ID 参数
    navigate(`/ai-assistant?taskId=${todoId}`, { replace: true });
  }, [todoId, navigate]);
  
  return (
    <div className="pt-40 text-center">
      <Loader2 className="mx-auto text-indigo-600 animate-spin mb-4" size={48} />
      <p className="text-slate-500">正在跳转到 AI 助手...</p>
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

// ============ 非登录状态展示页面 ============

// --- 产品页面 (Hire Agent 核心产品) ---
const ProductsPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuth();

  // 处理需要登录的操作
  const handleAuthAction = (targetPath: string, defaultRole?: 'candidate' | 'employer') => {
    if (isLoggedIn) {
      // 已登录，根据角色跳转到对应页面
      if (targetPath === '/ai-assistant') {
        navigate('/ai-assistant');
      } else if (userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin') {
        navigate('/employer');
      } else {
        navigate('/candidate');
      }
    } else {
      // 未登录，跳转到登录页面并记录目标
      const roleParam = defaultRole ? `?role=${defaultRole}` : '';
      navigate(`/login${roleParam}`, { state: { from: targetPath } });
    }
  };

  const coreFeatures = [
    {
      category: 'Hire',
      title: '智能招聘',
      description: '从职位发布到人才获取，AI 全程赋能',
      icon: Briefcase,
      color: 'from-indigo-500 to-violet-500',
      features: [
        { icon: FileText, name: 'JD 智能生成', desc: '输入招聘需求，AI 秒级生成专业职位描述' },
        { icon: Target, name: '人才精准匹配', desc: '语义级匹配算法，找到最契合的人才' },
        { icon: Search, name: '主动人才触达', desc: '智能筛选并主动联系匹配候选人' },
        { icon: Users, name: '人才库沉淀', desc: '构建企业专属人才池，持续复用' },
      ]
    },
    {
      category: 'Interview',
      title: '智能面试',
      description: '从面试准备到评估反馈，提升每一场面试效率',
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-500',
      features: [
        { icon: Bot, name: 'AI 模拟面试', desc: '针对岗位进行全真模拟训练' },
        { icon: ClipboardCheck, name: '面试评估报告', desc: '多维度评估，生成结构化报告' },
        { icon: Brain, name: '智能问题推荐', desc: '根据岗位智能推荐面试问题' },
        { icon: TrendingUp, name: '面试数据洞察', desc: '分析通过率，优化面试流程' },
      ]
    }
  ];

  const upcomingProducts = [
    { name: 'Onboard Agent', desc: '入职流程自动化', icon: ArrowRightCircle, status: '规划中' },
    { name: 'Grow Agent', desc: '人才发展与培训', icon: TrendingUp, status: '规划中' },
    { name: 'Engage Agent', desc: '员工敬业度管理', icon: Heart, status: '规划中' },
  ];

  const stats = [
    { value: '-60%', label: '招聘周期' },
    { value: '10x', label: '筛选效率' },
    { value: '95%+', label: '匹配准确率' },
    { value: '98%', label: '用户满意度' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-8">
            <Bot size={16} /> AI 原生招聘产品
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            <span className="text-indigo-600">Hire Agent</span>
            <br />覆盖招聘全流程
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12">
            Hire Agent 是 Devnors 的核心产品，集成智能招聘（Hire）和智能面试（Interview）
            两大核心能力，端到端覆盖招聘全流程。未来将持续推出更多 Agent 产品。
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <AnimatedStatItem value={stat.value} label={stat.label} color="text-indigo-600" delay={i * 100} size="large" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 mb-4">核心能力</h2>
          <p className="text-slate-500">Hire Agent 的两大核心模块</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {coreFeatures.map((module, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all">
              <div className={`bg-gradient-to-r ${module.color} px-8 py-6`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <module.icon size={28} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white/70 text-sm font-bold">{module.category}</div>
                    <h3 className="text-2xl font-black text-white">{module.title}</h3>
                  </div>
                </div>
                <p className="text-white/80 mt-3">{module.description}</p>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  {module.features.map((feature, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <feature.icon size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{feature.name}</h4>
                        <p className="text-sm text-slate-500">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">招聘全流程覆盖</h2>
            <p className="text-slate-500">从需求到入职，一站式完成</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {[
              { step: '需求分析', icon: FileText },
              { step: '职位发布', icon: Send },
              { step: '人才匹配', icon: Target },
              { step: '简历筛选', icon: Filter },
              { step: '面试安排', icon: Calendar },
              { step: '面试评估', icon: ClipboardCheck },
              { step: 'Offer 发放', icon: CheckCircle2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-slate-100 flex items-center gap-3">
                  <item.icon size={18} className="text-indigo-600" />
                  <span className="font-bold text-slate-700">{item.step}</span>
                </div>
                {i < 6 && <ArrowRight size={18} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Products */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4">更多 Agent 即将推出</h2>
          <p className="text-slate-500">我们正在构建完整的人才管理 Agent 生态</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingProducts.map((product, i) => (
            <div key={i} className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center opacity-60">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <product.icon size={24} className="text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-700 mb-1">{product.name}</h4>
              <p className="text-sm text-slate-400 mb-3">{product.desc}</p>
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                {product.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl p-12 text-white text-center">
          <h2 className="text-3xl font-black mb-4">体验 Hire Agent</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            {isLoggedIn ? '立即进入控制台，开始 AI 驱动的智能招聘之旅' : '注册即可获得免费 Token，开始 AI 驱动的智能招聘之旅'}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleAuthAction('/ai-assistant')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-black hover:bg-indigo-50 transition-all"
            >
              {isLoggedIn ? '进入控制台' : '免费开始'}
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-indigo-400 text-white px-8 py-4 rounded-xl font-black hover:bg-indigo-300 transition-all"
            >
              查看定价
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 解决方案页面 (浅色版) ---
const SolutionsPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuth();

  // 处理需要登录的操作
  const handleAuthAction = (targetPath: string, defaultRole?: 'candidate' | 'employer') => {
    if (isLoggedIn) {
      // 已登录，根据角色跳转到对应页面
      if (userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin') {
        navigate('/employer');
      } else {
        navigate('/candidate');
      }
    } else {
      // 未登录，跳转到登录页面
      const roleParam = defaultRole ? `?role=${defaultRole}` : '';
      navigate(`/login${roleParam}`, { state: { from: targetPath } });
    }
  };

  const solutions = [
    {
      id: 'talent',
      title: '人才求职解决方案',
      subtitle: 'For Job Seekers',
      description: '从简历优化到面试准备，AI 全程陪伴您的求职之旅',
      icon: UserIcon,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      features: [
        { icon: FileText, name: 'AI 简历优化', desc: '智能分析简历，给出针对性优化建议' },
        { icon: Target, name: '职位精准匹配', desc: '基于技能图谱，秒级推荐最匹配机会' },
        { icon: MessageSquare, name: '面试模拟训练', desc: 'AI 面试官进行全真模拟训练' },
        { icon: TrendingUp, name: '薪资谈判指导', desc: '市场数据支撑，谈判更有底气' },
        { icon: BookOpen, name: '职业发展规划', desc: '分析技能优势，规划成长路径' },
        { icon: Bell, name: '职位动态提醒', desc: '心仪公司新职位第一时间推送' },
      ],
      stats: [
        { value: '85%', label: '简历通过率提升' },
        { value: '3x', label: '面试邀约增加' },
        { value: '28天', label: '平均求职周期' },
      ],
      cta: '开始求职',
      link: '/register?role=candidate'
    },
    {
      id: 'enterprise',
      title: '企业招聘解决方案',
      subtitle: 'For Enterprises',
      description: '从需求发布到 Offer 发放，打造高效招聘闭环',
      icon: Building2,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      features: [
        { icon: PenTool, name: 'JD 智能生成', desc: 'AI 秒级生成专业职位描述' },
        { icon: Search, name: '人才主动触达', desc: '主动联系匹配人才，变被动为主动' },
        { icon: Brain, name: '多维度评估', desc: '技能、文化、潜力多维度综合评分' },
        { icon: BarChart3, name: '招聘数据分析', desc: '实时追踪招聘漏斗，优化策略' },
        { icon: Users, name: '协作招聘', desc: '多角色协作，信息同步高效' },
        { icon: Database, name: '人才库沉淀', desc: '构建专属人才池，二次激活复用' },
      ],
      stats: [
        { value: '-60%', label: '招聘周期缩短' },
        { value: '10x', label: '筛选效率提升' },
        { value: '-50%', label: '招聘成本降低' },
      ],
      cta: '开始招聘',
      link: '/register?role=employer'
    }
  ];

  const industries = [
    { name: '互联网科技', icon: Code, desc: '技术人才快速扩张', color: 'bg-blue-100', textColor: 'text-blue-600' },
    { name: '金融服务', icon: Landmark, desc: '高端人才精准猎聘', color: 'bg-amber-100', textColor: 'text-amber-600' },
    { name: '医疗健康', icon: Heart, desc: '专业人才合规招聘', color: 'bg-rose-100', textColor: 'text-rose-600' },
    { name: '教育培训', icon: GraduationCap, desc: '师资人才高效匹配', color: 'bg-emerald-100', textColor: 'text-emerald-600' },
    { name: '电商零售', icon: Tag, desc: '运营人才规模招聘', color: 'bg-orange-100', textColor: 'text-orange-600' },
    { name: '制造业', icon: Settings, desc: '技术工人批量招聘', color: 'bg-slate-100', textColor: 'text-slate-600' },
    { name: '游戏娱乐', icon: Play, desc: '创意人才精准匹配', color: 'bg-purple-100', textColor: 'text-purple-600' },
    { name: '咨询服务', icon: Lightbulb, desc: '专业顾问快速组建', color: 'bg-cyan-100', textColor: 'text-cyan-600' },
  ];

  const scenarios = [
    { title: '校园招聘', desc: '批量处理海量简历，高效完成秋招春招', icon: GraduationCap },
    { title: '社会招聘', desc: '精准匹配有经验的专业人才', icon: Users },
    { title: '高管猎聘', desc: 'AI 辅助高端人才搜索与背调', icon: Award },
    { title: '外包派遣', desc: '快速响应批量需求，灵活用工', icon: ArrowRightCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-8">
            <Rocket size={16} /> 全场景解决方案
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            面向未来的<br /><span className="text-indigo-600">智能招聘解决方案</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            无论您是寻找梦想工作的人才，还是寻觅优秀人才的企业，
            我们都有专属的 AI 解决方案
          </p>
        </div>
      </div>

      {/* Solutions Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {solutions.map((solution) => (
            <div key={solution.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className={`${solution.lightColor} px-8 py-8 border-b border-slate-100`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 ${solution.color} rounded-2xl flex items-center justify-center`}>
                    <solution.icon size={28} className="text-white" />
                  </div>
                  <div>
                    <p className={`${solution.textColor} text-sm font-bold`}>{solution.subtitle}</p>
                    <h3 className="text-2xl font-black text-slate-900">{solution.title}</h3>
                  </div>
                </div>
                <p className="text-slate-600">{solution.description}</p>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {solution.stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <AnimatedStatItem value={stat.value} label={stat.label} color={solution.textColor} delay={i * 100} size="normal" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Features */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {solution.features.map((feature, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <feature.icon size={16} className={solution.textColor} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{feature.name}</h4>
                        <p className="text-xs text-slate-500">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleAuthAction(solution.id === 'talent' ? '/candidate' : '/employer', solution.id === 'talent' ? 'candidate' : 'employer')}
                  className={`w-full ${solution.color} text-white py-4 rounded-xl font-black hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                >
                  {isLoggedIn ? '进入控制台' : solution.cta} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruitment Scenarios */}
      <div className="bg-slate-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">招聘场景全覆盖</h2>
            <p className="text-slate-500">无论何种招聘需求，我们都有专业解决方案</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {scenarios.map((item, i) => (
              <div key={i} className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <item.icon size={28} className="text-indigo-600" />
                </div>
                <h4 className="font-black text-slate-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industries */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">覆盖多个行业</h2>
            <p className="text-slate-500">深耕垂直领域，提供专业化的招聘解决方案</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {industries.map((item, i) => (
              <div key={i} className={`${item.color} rounded-xl p-6 hover:shadow-md transition-all group`}>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <item.icon size={24} className={item.textColor} />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{item.name}</h4>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-black text-white mb-4">{isLoggedIn ? '立即进入控制台' : '找到适合您的解决方案'}</h2>
          <p className="text-indigo-100 mb-8">{isLoggedIn ? '开始使用 AI 驱动的智能招聘服务' : '立即开始，体验 AI 驱动的智能招聘'}</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => handleAuthAction('/candidate', 'candidate')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-black hover:bg-indigo-50 transition-all"
            >
              {isLoggedIn && (userRole === 'candidate' || !userRole) ? '进入求职控制台' : '我是求职者'}
            </button>
            <button
              onClick={() => handleAuthAction('/employer', 'employer')}
              className="bg-indigo-400 text-white px-8 py-4 rounded-xl font-black hover:bg-indigo-300 transition-all"
            >
              {isLoggedIn && (userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin') ? '进入招聘控制台' : '我是招聘方'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Agent 页面 (浅色版 - 纯技术介绍) ---
const ModelsPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuth();

  // 处理需要登录的操作
  const handleAuthAction = () => {
    if (isLoggedIn) {
      // 已登录，根据角色跳转到对应页面
      if (userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin') {
        navigate('/employer');
      } else {
        navigate('/candidate');
      }
    } else {
      // 未登录，跳转到登录页面
      navigate('/login', { state: { from: '/ai-assistant' } });
    }
  };

  const agents = [
    {
      name: '对话理解 Agent',
      desc: '自然语言理解与多轮对话能力，精准识别用户意图',
      icon: Bot,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      capabilities: ['意图识别', '多轮对话', '上下文记忆', '情感分析'],
    },
    {
      name: '简历解析 Agent',
      desc: '深度解析简历内容，提取技能、经验、项目等关键信息',
      icon: FileText,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      capabilities: ['结构化提取', '技能识别', '经验分析', '教育背景'],
    },
    {
      name: '人才匹配 Agent',
      desc: '语义级智能匹配，找到技能与文化都契合的最佳候选人',
      icon: Target,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-600',
      capabilities: ['语义匹配', '文化契合度', '技能图谱', '双向推荐'],
    },
    {
      name: '面试评估 Agent',
      desc: '多维度评估候选人表现，生成结构化的面试评估报告',
      icon: ClipboardCheck,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      capabilities: ['表现评估', '能力雷达图', '风险预警', '录用建议'],
    },
    {
      name: '薪资分析 Agent',
      desc: '基于市场大数据进行薪资分析，给出合理的薪资建议',
      icon: TrendingUp,
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      capabilities: ['市场数据', '薪资预测', '谈判策略', '竞争力分析'],
    },
    {
      name: '路由调度 Agent',
      desc: '智能协调多个 Agent 的协作，确保任务最优分配',
      icon: GitBranch,
      color: 'bg-cyan-500',
      lightColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      capabilities: ['任务分解', '负载均衡', '优先级调度', '结果聚合'],
    },
  ];

  const techStack = [
    { name: 'LLM 大语言模型', desc: '基于 GPT-4、Claude 3.5 等顶级大模型', icon: Brain },
    { name: 'RAG 检索增强', desc: '结合知识库实现精准、可靠的回答', icon: Search },
    { name: 'Multi-Agent 架构', desc: '多智能体协作，各司其职高效协同', icon: Users },
    { name: 'Vector Search', desc: '向量检索技术，毫秒级语义匹配', icon: Database },
  ];

  const advantages = [
    { title: '毫秒级响应', value: '<100ms', desc: '实时响应用户请求' },
    { title: '高准确率', value: '95%+', desc: '人才匹配准确率' },
    { title: '高可用性', value: '99.9%', desc: '系统稳定运行' },
    { title: '持续学习', value: '24/7', desc: '模型持续优化' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-8">
            <Bot size={16} /> Multi-Agent System
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            <span className="text-indigo-600">多智能体协作</span>
            <br />驱动下一代招聘
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            我们构建了专业的招聘领域 AI Agent 集群，
            每个 Agent 专注于特定任务，协同工作以提供最佳服务
          </p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {advantages.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <AnimatedStatItem value={item.value} label={item.title} color="text-indigo-600" delay={i * 100} size="large" />
              <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Agent 能力矩阵</h2>
          <p className="text-slate-500">每个 Agent 专注于特定任务，协同工作提供最佳服务</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 ${agent.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <agent.icon size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{agent.name}</h3>
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-4">{agent.desc}</p>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap, j) => (
                  <span key={j} className={`px-3 py-1 ${agent.lightColor} ${agent.textColor} text-xs font-bold rounded-full`}>
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Architecture */}
      <div className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">底层技术架构</h2>
            <p className="text-slate-500">基于最前沿的 AI 技术构建招聘基础设施</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {techStack.map((tech, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <tech.icon size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{tech.name}</h4>
                  <p className="text-sm text-slate-500">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Agent 协作流程</h2>
            <p className="text-slate-500">多智能体协同工作，完成复杂招聘任务</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {[
              { step: '用户输入', icon: MessageSquare },
              { step: '意图识别', icon: Bot },
              { step: '任务分发', icon: GitBranch },
              { step: 'Agent 执行', icon: Zap },
              { step: '结果聚合', icon: Layers },
              { step: '输出响应', icon: CheckCircle2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-slate-100 flex items-center gap-3">
                  <item.icon size={18} className="text-indigo-600" />
                  <span className="font-bold text-slate-700">{item.step}</span>
                </div>
                {i < 5 && <ArrowRight size={18} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-black text-white mb-4">体验 AI Agent 的强大能力</h2>
          <p className="text-indigo-100 mb-8">{isLoggedIn ? '进入控制台，开始智能招聘之旅' : '立即注册，开始智能招聘之旅'}</p>
          <button
            onClick={handleAuthAction}
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-black hover:bg-indigo-50 transition-all"
          >
            {isLoggedIn ? '进入控制台' : '免费开始'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 定价方案页面 ---
const PricingView = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuth();

  // 处理需要登录的操作
  const handleAuthAction = (plan: string) => {
    if (isLoggedIn) {
      // 已登录，跳转到 tokens 页面购买
      navigate('/tokens');
    } else {
      // 未登录，跳转到登录页面
      navigate('/login', { state: { from: '/tokens', plan } });
    }
  };
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Devnors 1.0',
      price: billingCycle === 'annual' ? '¥0' : '¥0',
      period: '/月',
      description: '基础版 · 入门体验',
      features: [
        { name: '上下文长度', value: '32K tokens', included: true },
        { name: '日免费度 Token 额度', value: '1K', included: true },
        { name: '请求频率限制', value: '10 RPM', included: true },
        { name: '并发请求数', value: '1', included: true },
        { name: '基础模型能力', value: '✓', included: true },
        { name: '高级推理能力', value: '-', included: false },
        { name: '专属技术支持', value: '-', included: false },
        { name: '高阶对接算法', value: '-', included: false },
      ],
      cta: '免费使用',
      current: true,
      color: 'border-slate-200',
      btnColor: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    },
    {
      name: 'Devnors 1.0 Pro',
      price: billingCycle === 'annual' ? '¥350' : '¥450',
      period: billingCycle === 'annual' ? '/月' : '/月',
      description: '专业版 · 性能平衡',
      popular: true,
      features: [
        { name: '上下文长度', value: '128K tokens', included: true },
        { name: '日免费度 Token 额度', value: '200K', included: true },
        { name: '请求频率限制', value: '100 RPM', included: true },
        { name: '并发请求数', value: '10', included: true },
        { name: '基础模型能力', value: '✓', included: true },
        { name: '高级推理能力', value: '✓', included: true },
        { name: '专属技术支持', value: '工单', included: true },
        { name: '高阶对接算法', value: '-', included: false },
      ],
      cta: '立即升级',
      current: false,
      color: 'border-indigo-200 shadow-xl',
      btnColor: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      name: 'Devnors 1.0 Ultra',
      price: billingCycle === 'annual' ? '¥2,000' : '¥2,500',
      period: billingCycle === 'annual' ? '/月' : '/月',
      description: '旗舰版 · 无限可能',
      features: [
        { name: '上下文长度', value: '1M+ tokens', included: true },
        { name: '日免费度 Token 额度', value: '5M', included: true },
        { name: '请求频率限制', value: '800 RPM', included: true },
        { name: '并发请求数', value: '100', included: true },
        { name: '基础模型能力', value: '✓', included: true },
        { name: '高级推理能力', value: '✓', included: true },
        { name: '专属技术支持', value: '工单', included: true },
        { name: '高阶对接算法', value: '✓', included: true },
        { name: '定制化微调', value: '✓', included: true },
      ],
      cta: '立即升级',
      current: false,
      color: 'border-rose-200 shadow-xl',
      btnColor: 'bg-rose-600 text-white hover:bg-rose-700',
    },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-indigo-100">
          <Sparkle size={16} /> 模型定价
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">选择您的算力方案</h1>
        <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
          从入门到企业级，满足不同规模的 AI 推理需求
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
                最具性价比
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
                    {feature.value && (
                      <span className={`text-xs ml-1 ${feature.included ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
                        {feature.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAuthAction(plan.name)}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${plan.btnColor}`}
            >
              {isLoggedIn ? (plan.current ? '当前方案' : '立即升级') : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-slate-50 rounded-2xl p-8 border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 mb-6 text-center">常见问题</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { q: '如何计算 Token 用量？', a: 'Token 按照输入和输出的总字符数计算，约 4 个字符等于 1 个 Token。中文消耗更多 Token。' },
            { q: '超出限额怎么办？', a: '超出限额后可以单独购买 token 使用' },
            { q: '支持私有化部署吗？', a: '不支持私有部署，Ultra 版本支持模型定制化微调' },
            { q: '是否有免费试用？', a: 'Devnors 1.0 方案每月提供 100K 免费 Token。' },
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  // 使用 API 获取数据
  const { data: recommendedJobs, loading: jobsLoading } = useRecommendedJobs(5);
  const { data: memories, loading: memoriesLoading } = useMemories(userId, 'candidate');


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
          {memoriesLoading ? (
            <div className="col-span-4 flex justify-center py-4"><Loader2 className="animate-spin text-emerald-600" size={24} /></div>
          ) : memories.length === 0 ? (
            <div className="col-span-4 text-center py-8 text-slate-400">
              <Database size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">暂无人才画像记忆</p>
              <button 
                onClick={() => navigate('/candidate/memory')}
                className="mt-2 text-emerald-600 text-xs font-bold hover:underline"
              >
                点击添加第一条记忆
              </button>
            </div>
          ) : memories.map((memory: any) => (
            <div key={memory.id} className={`p-4 rounded-lg border bg-slate-50 ${memory.color || 'border-slate-200'}`}>
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
          <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Briefcase size={20} /></div>
              企业岗位库推荐
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-6">基于您的职业画像，AI 智能体为您匹配了以下优质岗位</p>
              
              <div className="space-y-4">
                {jobsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
                ) : recommendedJobs.map((job: any) => (
                  <div key={job.id} onClick={() => navigate(`/candidate/job/${job.id}`)} className="group p-6 bg-slate-50 hover:bg-emerald-50/50 rounded border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-white rounded flex items-center justify-center shadow-sm border border-slate-100 text-2xl font-bold">
                          {job.logo || '💼'}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{job.title}</h3>
                          <p className="text-slate-600 font-medium">{job.company} · {job.location || '全国'}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-slate-600 border border-slate-200">{job.salary || '面议'}</span>
                            <span className="px-3 py-1 bg-emerald-100 rounded-lg text-xs font-bold text-emerald-700">{job.match || 85}% 匹配度</span>
                            {(job.tags || []).map((tag: string, i: number) => (
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
                        AI 智能体对接说明：{job.aiIntro || 'AI 智能体正在分析职位匹配度'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 bg-slate-50 hover:bg-slate-100 text-slate-600 py-4 rounded font-black text-sm flex items-center justify-center gap-2 transition-all border border-slate-200 border-dashed">
                <ChevronDown size={18} /> 查看更多
              </button>
            </div>

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
                  <div key={i} className="p-6">
                    <AnimatedStatItem 
                      value={card.value} 
                      label={card.label} 
                      icon={card.icon} 
                      color={card.color} 
                      bg={card.bg} 
                      delay={i * 150} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
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
  const { user, isLoggedIn, userRole } = useAuth();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; memoryId: number | null; content: string}>({show: false, memoryId: null, content: ''});
  const [deleting, setDeleting] = useState(false);
  
  // 使用 API 获取企业画像记忆数据 (scope = 'employer')
  const userId = user?.id || 1;
  const { data: memoriesData, loading: memoriesLoading, refetch: refetchMemories } = useMemories(userId, 'employer');

  // 如果未登录或不是企业方，显示提示
  useEffect(() => {
    if (isLoggedIn && userRole !== 'employer') {
      // 非企业用户访问企业画像，可选择跳转
    }
  }, [isLoggedIn, userRole]);

  const filteredMemories = useMemo(() => {
    if (activeCategory === '全部') return memoriesData;
    return memoriesData.filter((m: any) => m.type === activeCategory || m.type?.toUpperCase() === activeCategory.toUpperCase());
  }, [activeCategory, memoriesData]);
  
  // 删除记忆
  const handleDeleteMemory = async () => {
    if (!deleteConfirm.memoryId) return;
    setDeleting(true);
    try {
      const { deleteMemory } = await import('./services/apiService');
      await deleteMemory(deleteConfirm.memoryId);
      refetchMemories();
      setDeleteConfirm({show: false, memoryId: null, content: ''});
    } catch (e) {
      console.error('删除记忆失败:', e);
    } finally {
      setDeleting(false);
    }
  };
  
  // 记忆优化
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<{show: boolean; message: string; actions: any[]; summary: any} | null>(null);
  
  const handleOptimizeMemories = async () => {
    setOptimizing(true);
    try {
      const { optimizeMemories } = await import('./services/apiService');
      const result = await optimizeMemories(userId, 'employer');
      setOptimizeResult({
        show: true,
        message: result.message,
        actions: result.actions || [],
        summary: result.summary || {}
      });
      refetchMemories();
    } catch (e) {
      console.error('记忆优化失败:', e);
      setOptimizeResult({
        show: true,
        message: '记忆优化失败，请稍后重试',
        actions: [],
        summary: {}
      });
    } finally {
      setOptimizing(false);
    }
  };

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
        <div className="flex gap-3">
          <button 
            onClick={handleOptimizeMemories}
            disabled={optimizing || memoriesLoading}
            className="bg-amber-500 text-white px-6 py-4 rounded font-black flex items-center gap-2 shadow-xl hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {optimizing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
            {optimizing ? 'AI 优化中...' : '记忆优化'}
          </button>
          <button onClick={() => navigate('/ai-assistant?editType=employer&editField=company')} className="bg-indigo-600 text-white px-6 py-4 rounded font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
             <Plus size={20} /> 添加新记忆
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      {memoriesLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <span className="ml-3 text-slate-500 font-medium">加载企业记忆中...</span>
        </div>
      )}

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
                         {/* 记忆强度显示 - 始终显示 */}
                         <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${(memory.emphasis_count || 1) > 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`} title="记忆强度：提及次数越多，记忆越深刻">
                           <Zap size={10} /> 强度 ×{memory.emphasis_count || 1}
                         </span>
                         <div className={`ml-auto w-2 h-2 rounded-full ${memory.importance === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} title={`重要性: ${memory.importance}`}></div>
                      </div>
                      <p className="text-lg text-slate-800 font-bold leading-relaxed mb-6 group-hover:text-indigo-600 transition-colors">
                        “{memory.content}”
                      </p>
                      <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                         <button 
                           onClick={() => navigate(`/ai-assistant?editType=employer&editField=${memory.type?.toLowerCase() || 'company'}&editId=${memory.id}`)}
                           className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                         >
                           <Edit3 size={12} /> 编辑
                         </button>
                         <button 
                           onClick={() => setDeleteConfirm({show: true, memoryId: memory.id, content: memory.content})}
                           className="flex items-center gap-1.5 hover:text-rose-600 transition-colors"
                         >
                           <Trash2 size={12} /> 删除
                         </button>
                      </div>
                   </div>
                   <div className="md:w-64 bg-slate-50 rounded-lg p-6 border border-slate-100 flex flex-col justify-center">
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-2">Agent 推理逻辑</h5>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        {memory.ai_reasoning || "基于您过去的招聘偏好和候选人筛选历史自动提取，用于优化后续人才匹配。点击「记忆优化」生成详细推理。"}
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      {/* 删除确认弹窗 */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-rose-600" size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">确认删除记忆</h3>
            </div>
            <p className="text-slate-600 mb-2">您确定要删除以下记忆吗？此操作不可撤销。</p>
            <div className="bg-slate-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-slate-700 italic">"{deleteConfirm.content?.substring(0, 100)}{(deleteConfirm.content?.length || 0) > 100 ? '...' : ''}"</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm({show: false, memoryId: null, content: ''})}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                disabled={deleting}
              >
                取消
              </button>
              <button 
                onClick={handleDeleteMemory}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 记忆优化结果弹窗 */}
      {optimizeResult?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Wand2 className="text-amber-600" size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">记忆优化完成</h3>
            </div>
            <p className="text-slate-600 mb-4">{optimizeResult.message}</p>
            
            {optimizeResult.summary && (
              <div className="grid grid-cols-5 gap-2 mb-4">
                <div className="bg-indigo-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-indigo-600">{optimizeResult.summary.merged || 0}</div>
                  <div className="text-[10px] text-indigo-500 font-medium">合并</div>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-rose-600">{optimizeResult.summary.deleted || 0}</div>
                  <div className="text-[10px] text-rose-500 font-medium">删除</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-emerald-600">{optimizeResult.summary.reclassified || 0}</div>
                  <div className="text-[10px] text-emerald-500 font-medium">重分类</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-amber-600">{optimizeResult.summary.created || 0}</div>
                  <div className="text-[10px] text-amber-500 font-medium">新增</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-purple-600">{optimizeResult.summary.reasoning_updated || 0}</div>
                  <div className="text-[10px] text-purple-500 font-medium">推理</div>
                </div>
              </div>
            )}
            
            {optimizeResult.actions && optimizeResult.actions.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-black text-slate-400 uppercase mb-2">优化详情</h4>
                <div className="space-y-2">
                  {optimizeResult.actions.map((action: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold ${
                        action.action === 'merge' ? 'bg-indigo-500' :
                        action.action === 'delete' ? 'bg-rose-500' :
                        action.action === 'reclassify' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}>
                        {action.action === 'merge' ? '合并' :
                         action.action === 'delete' ? '删除' :
                         action.action === 'reclassify' ? '重分类' : '新增'}
                      </span>
                      <span className="flex-1">{action.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setOptimizeResult(null)}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 人才画像 Memory 详情页 ---
const CandidateMemoryView = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, userRole } = useAuth();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; memoryId: number | null; content: string}>({show: false, memoryId: null, content: ''});
  const [deleting, setDeleting] = useState(false);

  // 使用 API 获取人才画像记忆数据 (scope = 'candidate')
  const userId = user?.id || 1;
  const { data: memoriesData, loading: memoriesLoading, refetch: refetchMemories } = useMemories(userId, 'candidate');
  
  // 删除记忆
  const handleDeleteMemory = async () => {
    if (!deleteConfirm.memoryId) return;
    setDeleting(true);
    try {
      const { deleteMemory } = await import('./services/apiService');
      await deleteMemory(deleteConfirm.memoryId);
      refetchMemories();
      setDeleteConfirm({show: false, memoryId: null, content: ''});
    } catch (e) {
      console.error('删除记忆失败:', e);
    } finally {
      setDeleting(false);
    }
  };
  
  // 记忆优化
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<{show: boolean; message: string; actions: any[]; summary: any} | null>(null);
  
  const handleOptimizeMemories = async () => {
    setOptimizing(true);
    try {
      const { optimizeMemories } = await import('./services/apiService');
      const result = await optimizeMemories(userId, 'candidate');
      setOptimizeResult({
        show: true,
        message: result.message,
        actions: result.actions || [],
        summary: result.summary || {}
      });
      refetchMemories();
    } catch (e) {
      console.error('记忆优化失败:', e);
      setOptimizeResult({
        show: true,
        message: '记忆优化失败，请稍后重试',
        actions: [],
        summary: {}
      });
    } finally {
      setOptimizing(false);
    }
  };

  const filteredMemories = useMemo(() => {
    if (activeCategory === '全部') return memoriesData;
    return memoriesData.filter((m: any) => m.type === activeCategory || m.type?.toUpperCase() === activeCategory.toUpperCase());
  }, [activeCategory, memoriesData]);

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
        <div className="flex gap-3">
          <button 
            onClick={handleOptimizeMemories}
            disabled={optimizing || memoriesLoading}
            className="bg-amber-500 text-white px-6 py-4 rounded font-black flex items-center gap-2 shadow-xl hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {optimizing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
            {optimizing ? 'AI 优化中...' : '记忆优化'}
          </button>
          <button onClick={() => navigate('/ai-assistant?editType=candidate&editField=skill')} className="bg-emerald-600 text-white px-6 py-4 rounded font-black flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all active:scale-95">
             <Plus size={20} /> 添加新记忆
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      {memoriesLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
          <span className="ml-3 text-slate-500 font-medium">加载人才记忆中...</span>
        </div>
      )}

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
                         {/* 记忆强度显示 - 始终显示 */}
                         <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${(memory.emphasis_count || 1) > 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`} title="记忆强度：提及次数越多，记忆越深刻">
                           <Zap size={10} /> 强度 ×{memory.emphasis_count || 1}
                         </span>
                         <div className={`ml-auto w-2 h-2 rounded-full ${memory.importance === 'High' ? 'bg-rose-500' : 'bg-emerald-500'}`} title={`重要性: ${memory.importance}`}></div>
                      </div>
                      <p className="text-lg text-slate-800 font-bold leading-relaxed mb-6 group-hover:text-emerald-600 transition-colors">
                        "{memory.content}"
                      </p>
                      <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                         <button 
                           onClick={() => navigate(`/ai-assistant?editType=candidate&editField=${memory.type?.toLowerCase() || 'skill'}&editId=${memory.id}`)}
                           className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                         >
                           <Edit3 size={12} /> 编辑
                         </button>
                         <button 
                           onClick={() => setDeleteConfirm({show: true, memoryId: memory.id, content: memory.content})}
                           className="flex items-center gap-1.5 hover:text-rose-600 transition-colors"
                         >
                           <Trash2 size={12} /> 删除
                         </button>
                      </div>
                   </div>
                   <div className="md:w-64 bg-emerald-50 rounded-lg p-6 border border-emerald-100 flex flex-col justify-center">
                      <h5 className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-2">Agent 推理逻辑</h5>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        {memory.ai_reasoning || "基于您的职业履历和求职偏好自动提取，用于优化后续职位匹配。点击「记忆优化」生成详细推理。"}
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      {/* 删除确认弹窗 */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-rose-600" size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">确认删除记忆</h3>
            </div>
            <p className="text-slate-600 mb-2">您确定要删除以下记忆吗？此操作不可撤销。</p>
            <div className="bg-slate-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-slate-700 italic">"{deleteConfirm.content?.substring(0, 100)}{(deleteConfirm.content?.length || 0) > 100 ? '...' : ''}"</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm({show: false, memoryId: null, content: ''})}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                disabled={deleting}
              >
                取消
              </button>
              <button 
                onClick={handleDeleteMemory}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 记忆优化结果弹窗 */}
      {optimizeResult?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Wand2 className="text-amber-600" size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">记忆优化完成</h3>
            </div>
            <p className="text-slate-600 mb-4">{optimizeResult.message}</p>
            
            {optimizeResult.summary && (
              <div className="grid grid-cols-5 gap-2 mb-4">
                <div className="bg-indigo-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-indigo-600">{optimizeResult.summary.merged || 0}</div>
                  <div className="text-[10px] text-indigo-500 font-medium">合并</div>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-rose-600">{optimizeResult.summary.deleted || 0}</div>
                  <div className="text-[10px] text-rose-500 font-medium">删除</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-emerald-600">{optimizeResult.summary.reclassified || 0}</div>
                  <div className="text-[10px] text-emerald-500 font-medium">重分类</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-amber-600">{optimizeResult.summary.created || 0}</div>
                  <div className="text-[10px] text-amber-500 font-medium">新增</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-purple-600">{optimizeResult.summary.reasoning_updated || 0}</div>
                  <div className="text-[10px] text-purple-500 font-medium">推理</div>
                </div>
              </div>
            )}
            
            {optimizeResult.actions && optimizeResult.actions.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-black text-slate-400 uppercase mb-2">优化详情</h4>
                <div className="space-y-2">
                  {optimizeResult.actions.map((action: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold ${
                        action.action === 'merge' ? 'bg-indigo-500' :
                        action.action === 'delete' ? 'bg-rose-500' :
                        action.action === 'reclassify' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}>
                        {action.action === 'merge' ? '合并' :
                         action.action === 'delete' ? '删除' :
                         action.action === 'reclassify' ? '重分类' : '新增'}
                      </span>
                      <span className="flex-1">{action.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setOptimizeResult(null)}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      )}
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
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  // 使用动态数据
  const { data: profileData, loading: profileLoading, refetch: refetchProfile } = useProfile(userId, 'candidate');
  
  // 获取 memories 数据来补充技能等信息
  const { data: memoriesData } = useMemories(userId, 'candidate');
  
  // 获取认证数据（技能认证、学历认证、工作证明）
  const [skillCertifications, setSkillCertifications] = useState<any[]>([]);
  const [educationCertifications, setEducationCertifications] = useState<any[]>([]);
  const [workCertifications, setWorkCertifications] = useState<any[]>([]);
  useEffect(() => {
    if (userId) {
      getPersonalCertifications(userId).then((certs: any[]) => {
        const skillCerts = certs.filter(c => c.category === 'skill');
        const eduCerts = certs.filter(c => c.category === 'education');
        const workCerts = certs.filter(c => c.category === 'work');
        setSkillCertifications(skillCerts);
        setEducationCertifications(eduCerts);
        setWorkCertifications(workCerts);
      }).catch(() => {
        setSkillCertifications([]);
        setEducationCertifications([]);
        setWorkCertifications([]);
      });
    }
  }, [userId]);
  
  // 从 memories 中提取技能
  const skillsFromMemory = useMemo(() => {
    if (!memoriesData) return [];
    return memoriesData
      .filter((m: any) => m.type?.toUpperCase() === 'SKILL' || m.type === '技能')
      .map((m: any) => m.content);
  }, [memoriesData]);
  
  // 合并数据
  const candidateData = profileData?.candidate_data || {};
  const displayProfile = {
    name: profileData?.display_name || user?.name || '未设置姓名',
    role: profileData?.title || candidateData?.current_role || '未设置职位',
    experienceYears: candidateData?.experience_years || 0,
    skills: candidateData?.skills?.length > 0 ? candidateData.skills : skillsFromMemory,
    radarData: candidateData?.radar_data || [],
    summary: profileData?.summary || candidateData?.summary || '',
    idealJobPersona: candidateData?.ideal_job || '',
    careerPath: candidateData?.career_path || [],
    // 从 AI 助手保存的数据
    experience: candidateData?.experience || [],  // 工作经历
    projects: candidateData?.projects || [],      // 项目经历
    education: candidateData?.education || [],    // 教育背景
    expectedSalary: candidateData?.expected_salary || '',
    expectedLocation: candidateData?.expected_location || '',
    agentFeedbacks: candidateData?.agent_feedbacks || [],
    awards: candidateData?.awards || [],
    certifications: candidateData?.certifications || [],
    credentials: candidateData?.credentials || [],
  };
  
  // 判断资料是否为空
  const isProfileEmpty = profileData?.is_empty || (!displayProfile.summary && displayProfile.skills.length === 0);
  
  // 跳转到 AI 助手编辑资料
  const handleEditProfile = (field: string) => {
    navigate(`/ai-assistant?editType=candidate&editField=${field}`);
  };

  // 加载状态
  if (profileLoading) {
    return (
      <div className="pt-40 text-center">
        <Loader2 className="mx-auto text-indigo-600 animate-spin mb-4" size={48} />
        <p className="text-slate-500">加载资料中...</p>
      </div>
    );
  }

  // 空状态引导
  if (isProfileEmpty) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto animate-in fade-in duration-500">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-colors mb-8">
          <ChevronLeft size={20} /> 返回
        </button>
        <div className="bg-white rounded-lg p-12 border border-slate-100 shadow-xl text-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon size={48} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">完善您的职业画像</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            您还没有设置职业画像信息。通过 AI 助手快速完善您的资料，让更多招聘方发现您的才能。
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
            <button 
              onClick={() => handleEditProfile('skill')}
              className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-all group"
            >
              <Zap className="text-indigo-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">添加技能</div>
              <div className="text-xs text-slate-500">描述您的专业技能</div>
            </button>
            <button 
              onClick={() => handleEditProfile('experience')}
              className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-all group"
            >
              <Briefcase className="text-emerald-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">工作经历</div>
              <div className="text-xs text-slate-500">添加您的工作经验</div>
            </button>
            <button 
              onClick={() => handleEditProfile('goal')}
              className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg text-left transition-all group"
            >
              <Target className="text-amber-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">职业目标</div>
              <div className="text-xs text-slate-500">设定您的求职目标</div>
            </button>
            <button 
              onClick={() => navigate('/ai-assistant?taskType=apply')}
              className="p-4 bg-rose-50 hover:bg-rose-100 rounded-lg text-left transition-all group"
            >
              <FileText className="text-rose-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">上传简历</div>
              <div className="text-xs text-slate-500">AI 自动解析简历</div>
            </button>
          </div>
          <button 
            onClick={() => navigate('/ai-assistant?taskType=apply')}
            className="bg-indigo-600 text-white px-8 py-4 rounded font-black shadow-xl hover:bg-indigo-700 transition-all"
          >
            开始完善资料
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-medium text-sm transition-colors">
          <ChevronLeft size={18} /> 返回
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/ai-assistant?taskType=apply')}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Edit3 size={16} /> 编辑
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all">
            <Share2 size={16} /> 分享
          </button>
        </div>
      </div>

      {/* 个人信息头部 */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-white/20 backdrop-blur text-white flex items-center justify-center text-4xl font-black rounded-xl">
            {displayProfile.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black mb-1">{displayProfile.name}</h1>
            <p className="text-indigo-200 font-medium mb-3">{displayProfile.role || '暂未设置职位'}</p>
            <div className="flex flex-wrap gap-2">
              {displayProfile.skills.slice(0, 5).map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-medium rounded-full">{skill}</span>
              ))}
              {displayProfile.skills.length === 0 && (
                <span className="text-indigo-200 text-sm">点击编辑添加技能标签</span>
              )}
            </div>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-4xl font-black">{displayProfile.experienceYears || 0}<span className="text-lg">年</span></div>
            <div className="text-indigo-200 text-sm">工作经验</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧边栏 */}
        <div className="space-y-6">
          {/* 关于我 */}
          {displayProfile.summary && (
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">关于我</h3>
              <p className="text-slate-700 text-sm leading-relaxed">{displayProfile.summary}</p>
            </div>
          )}

          {/* 技能认证 */}
          {skillCertifications.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">技能认证</h3>
              <div className="space-y-3">
                {skillCertifications.map((cert, i) => (
                  <div key={cert.id || i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {cert.name === '驾驶证' ? <Car size={18} className="text-purple-600" /> : <Award size={18} className="text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{cert.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${cert.name === '驾驶证' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          {cert.name === '驾驶证' ? '已认证' : '已上传'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {cert.name === '驾驶证' ? `准驾车型: ${cert.level || '-'}` : cert.organization || '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 教育背景 */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <GraduationCap size={18} className="text-emerald-600" /> 教育背景
              </h3>
              <button onClick={() => handleEditProfile('education')} className="text-sm text-emerald-600 hover:underline font-medium">+ 添加</button>
            </div>
            
            <div className="space-y-3">
              {/* 已认证的学历 */}
              {educationCertifications.map((cert, i) => (
                <div key={cert.id || i} className="flex gap-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <div className="w-11 h-11 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 text-base">{cert.organization || '学校名称'}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-bold rounded flex items-center gap-1">
                        <BadgeCheck size={12} /> 已认证
                      </span>
                    </div>
                    <p className="text-sm text-emerald-600 font-medium">
                      {cert.major}{(cert.degree || cert.level) && ` · ${cert.degree || cert.level}`}
                    </p>
                    {cert.date && <p className="text-sm text-slate-500 mt-1">毕业时间: {cert.date}</p>}
                  </div>
                </div>
              ))}
              
              {/* 用户填写的教育背景 */}
              {displayProfile.education?.map((edu: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-11 h-11 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {typeof edu === 'string' ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{edu}</p>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-900 text-base mb-1">{edu.school || '学校名称'}</h4>
                        <p className="text-sm text-indigo-600 font-medium">
                          {edu.major}{edu.degree && ` · ${edu.degree}`}
                        </p>
                        {edu.period && <p className="text-sm text-slate-500 mt-1">{edu.period}</p>}
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {educationCertifications.length === 0 && (!displayProfile.education || displayProfile.education.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <GraduationCap size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">暂无教育背景</p>
                </div>
              )}
            </div>
          </div>

          {/* 工作经历 */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Briefcase size={18} className="text-indigo-600" /> 工作经历
              </h3>
              <button onClick={() => handleEditProfile('experience')} className="text-sm text-indigo-600 hover:underline font-medium">+ 添加</button>
            </div>
            
            <div className="space-y-3">
              {/* 已上传的工作证明 */}
              {workCertifications.map((cert, i) => (
                <div key={cert.id || i} className="flex gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="w-11 h-11 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 text-base">{cert.degree || '在职员工'}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded">已上传</span>
                    </div>
                    <p className="text-sm text-blue-600 font-medium">{cert.name || '公司名称'}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      {cert.date && <span>{cert.date}</span>}
                      {cert.major && <span>· {cert.major}</span>}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 用户填写的工作经历 */}
              {displayProfile.experience?.map((exp: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-11 h-11 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {typeof exp === 'string' ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{exp}</p>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-900 text-base mb-1">{exp.position || exp.role || '职位'}</h4>
                        <p className="text-sm text-indigo-600 font-medium">{exp.company}</p>
                        {exp.period && <p className="text-sm text-slate-500 mt-1">{exp.period}</p>}
                        {exp.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{exp.description}</p>}
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {workCertifications.length === 0 && (!displayProfile.experience || displayProfile.experience.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <Briefcase size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">暂无工作经历</p>
                </div>
              )}
            </div>
          </div>

          {/* 项目经验 */}
          {(displayProfile.projects?.length > 0) && (
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Rocket size={18} className="text-amber-500" /> 项目经验
                </h3>
                <button onClick={() => handleEditProfile('projects')} className="text-sm text-amber-600 hover:underline font-medium">+ 添加</button>
              </div>
              <div className="space-y-3">
                {displayProfile.projects.map((proj: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 bg-amber-50/50 rounded-lg">
                    <div className="w-11 h-11 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Rocket size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {typeof proj === 'string' ? (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{proj}</p>
                      ) : (
                        <>
                          <h4 className="font-bold text-slate-900 text-base mb-1">{proj.name || '项目名称'}</h4>
                          {proj.role && <p className="text-sm text-amber-600 font-medium">{proj.role}</p>}
                          {proj.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{proj.description}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 企业工作台 ---
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  // 使用 API 获取动态数据
  const { data: memories, loading: memoriesLoading } = useMemories(userId, 'employer');
  
  // 招聘前置检查状态
  const [recruitCheckModal, setRecruitCheckModal] = useState<{
    show: boolean;
    checking: boolean;
    certCompleted: boolean;
    profileCompleted: boolean;
    missingFields: string[];
  }>({ show: false, checking: false, certCompleted: false, profileCompleted: false, missingFields: [] });

  // 检查招聘前置条件
  const handleStartRecruit = async () => {
    setRecruitCheckModal({ show: true, checking: true, certCompleted: false, profileCompleted: false, missingFields: [] });
    
    try {
      const { getEnterpriseCertifications, getSettings, getTasks } = await import('./services/apiService');
      
      // 并行检查认证和资料
      const [certifications, settingsData, tasks] = await Promise.all([
        getEnterpriseCertifications(userId).catch(() => []),
        getSettings(userId).catch(() => ({})),
        getTasks(userId).catch(() => []),
      ]);
      
      // 检查企业认证 - 需要有营业执照认证
      const hasBusinessLicense = certifications.some((c: any) => 
        c.category === 'qualification' && c.name?.includes('营业执照')
      );
      // 或者检查认证任务是否已完成
      const certTask = tasks.find((t: any) => 
        t.title === '完成企业认证' || (t.title?.includes('企业') && t.title?.includes('认证'))
      );
      const certCompleted = hasBusinessLicense || certTask?.status?.toLowerCase() === 'completed';
      
      // 检查企业资料完善度 - 检查关键字段
      const requiredFields = [
        { key: 'display_name', label: '企业全称' },
        { key: 'industry', label: '所属行业' },
        { key: 'company_size', label: '企业规模' },
        { key: 'detail_address', label: '公司地址' },
        { key: 'description', label: '企业简介' },
      ];
      
      const hasValue = (val: any) => {
        if (!val) return false;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed !== '' && trimmed !== '[]' && trimmed !== '{}';
        }
        return true;
      };
      
      const missingFields = requiredFields.filter(f => !hasValue(settingsData[f.key])).map(f => f.label);
      const profileCompleted = missingFields.length === 0;
      
      setRecruitCheckModal({ show: true, checking: false, certCompleted, profileCompleted, missingFields });
      
      // 如果全部通过，创建招聘任务并跳转到 AI 招聘助手
      if (certCompleted && profileCompleted) {
        try {
          const { createTodo } = await import('./services/apiService');
          
          // 检查是否已有进行中的招聘任务
          const existingRecruitTask = tasks.find((t: any) => 
            (t.todo_type?.toUpperCase() === 'RECRUIT' || t.title?.includes('智能招聘')) &&
            (t.status?.toUpperCase() === 'PENDING' || t.status?.toUpperCase() === 'RUNNING' || t.status?.toUpperCase() === 'IN_PROGRESS')
          );
          
          if (!existingRecruitTask) {
            // 创建新的招聘任务
            const taskShortId = `RC${Date.now().toString().slice(-6)}`;
            await createTodo({
              title: `智能招聘 #${taskShortId}`,
              description: 'AI 智能招聘助手 — 描述您的招聘需求，AI 自动生成岗位并发布',
              priority: 'HIGH',
              source: 'AGENT',
              todo_type: 'RECRUIT',
              ai_advice: '告诉 AI 助手您的招聘需求，如岗位名称、技能要求、薪资范围等，AI 将为您自动生成专业岗位描述并一键发布。',
              steps: [
                { step: 1, title: '描述招聘需求', status: 'pending' },
                { step: 2, title: 'AI 生成岗位', status: 'pending' },
                { step: 3, title: '确认并发布', status: 'pending' },
              ],
            }, userId);
          }
        } catch (e) {
          console.error('创建招聘任务失败:', e);
        }
        
        setTimeout(() => {
          setRecruitCheckModal(prev => ({ ...prev, show: false }));
          navigate('/ai-assistant?task=post');
        }, 1200);
      }
    } catch (error) {
      console.error('检查招聘前置条件失败:', error);
      setRecruitCheckModal(prev => ({ ...prev, checking: false }));
    }
  };

  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [myJobsLoading, setMyJobsLoading] = useState(true);
  useEffect(() => {
    if (userId) {
      setMyJobsLoading(true);
      getMyJobs(userId).then(data => setMyJobs(data || [])).catch(() => setMyJobs([])).finally(() => setMyJobsLoading(false));
    }
  }, [userId]);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* 招聘前置检查弹窗 */}
      {recruitCheckModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => !recruitCheckModal.checking && setRecruitCheckModal(prev => ({ ...prev, show: false }))}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {recruitCheckModal.checking ? (
              <div className="text-center py-8">
                <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-900">正在检查招聘资质...</h3>
                <p className="text-sm text-slate-500 mt-1">确认企业认证和资料完善状态</p>
              </div>
            ) : recruitCheckModal.certCompleted && recruitCheckModal.profileCompleted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">资质检查通过！</h3>
                <p className="text-sm text-slate-500 mt-1">正在跳转到 AI 招聘助手...</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-1">招聘资质检查</h3>
                <p className="text-sm text-slate-500 mb-5">开始招聘前需要完成以下准备工作</p>
                
                <div className="space-y-3">
                  {/* 企业认证状态 */}
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${recruitCheckModal.certCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${recruitCheckModal.certCompleted ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {recruitCheckModal.certCompleted ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800">企业认证</h4>
                      <p className="text-xs text-slate-500">{recruitCheckModal.certCompleted ? '已完成企业认证' : '请先完成企业认证（营业执照等）'}</p>
                    </div>
                    {!recruitCheckModal.certCompleted && (
                      <button 
                        onClick={() => { setRecruitCheckModal(prev => ({ ...prev, show: false })); navigate('/settings?tab=Verification'); }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                      >
                        去认证 →
                      </button>
                    )}
                  </div>
                  
                  {/* 企业资料完善状态 */}
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${recruitCheckModal.profileCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${recruitCheckModal.profileCompleted ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {recruitCheckModal.profileCompleted ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800">企业资料</h4>
                      {recruitCheckModal.profileCompleted ? (
                        <p className="text-xs text-slate-500">企业资料已完善</p>
                      ) : (
                        <p className="text-xs text-slate-500">以下信息未填写：{recruitCheckModal.missingFields.join('、')}</p>
                      )}
                    </div>
                    {!recruitCheckModal.profileCompleted && (
                      <button 
                        onClick={() => { setRecruitCheckModal(prev => ({ ...prev, show: false })); navigate('/ai-assistant?task=enterprise_profile'); }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                      >
                        去完善 →
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-5 flex justify-end">
                  <button 
                    onClick={() => setRecruitCheckModal(prev => ({ ...prev, show: false }))}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800"
                  >
                    我知道了
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            onClick={handleStartRecruit}
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
           {memoriesLoading ? (
              <div className="col-span-4 flex justify-center py-4"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>
           ) : memories.length === 0 ? (
              <div className="col-span-4 text-center py-8 text-slate-400">
                <Database size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">暂无企业画像记忆</p>
                <button 
                  onClick={() => navigate('/memory/input', { state: { scope: 'employer' } })}
                  className="mt-2 text-indigo-600 text-xs font-bold hover:underline"
                >
                  点击添加第一条记忆
                </button>
              </div>
           ) : memories.map((memory: any) => (
              <div key={memory.id} className={`p-4 rounded-lg border bg-slate-50 ${memory.color || 'border-slate-200'}`}>
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
          
          {/* 修改：职位管理 */}
          <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                 <Briefcase className="text-indigo-600" /> 职位管理
               </h2>
               <button onClick={() => navigate("/employer/post")} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                 全部 <ArrowRight size={14} />
               </button>
             </div>
             {myJobsLoading ? (
               <div className="text-center py-8"><Loader2 className="mx-auto animate-spin text-indigo-400" size={24} /></div>
             ) : myJobs.length === 0 ? (
               <div className="text-center py-8">
                 <Briefcase className="mx-auto text-slate-300 mb-3" size={36} />
                 <p className="text-sm text-slate-400 mb-4">还没有发布过岗位</p>
                 <button onClick={() => navigate('/ai-assistant?taskType=post')} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                   <Sparkles size={14} /> 发布岗位
                 </button>
               </div>
             ) : (
               <div className="space-y-4">
                  {myJobs.slice(0, 5).map((job) => (
                    <div 
                      key={job.id} 
                      onClick={() => navigate(`/employer/post/${job.id}`)}
                      className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded border border-slate-100 group hover:border-indigo-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-5 w-full md:w-auto">
                         <div className={`w-14 h-14 flex items-center justify-center text-xl font-black rounded shadow-lg ring-4 transition-transform group-hover:scale-105 flex-shrink-0 ${
                           job.status === 'active' ? 'bg-indigo-600 text-white ring-indigo-50' : 'bg-slate-400 text-white ring-slate-100'
                         }`}>
                            <Briefcase size={24} />
                         </div>
                         <div>
                            <div className="text-base font-semibold text-slate-900">{job.title}</div>
                            <div className="text-sm text-slate-500 mt-0.5">{job.location}</div>
                            <div className="flex items-center gap-2 mt-2">
                               <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                 {job.salary_min && job.salary_max ? `${(job.salary_min/1000).toFixed(0)}k-${(job.salary_max/1000).toFixed(0)}k` : '面议'}
                               </span>
                               <span className={`text-xs font-medium px-2 py-0.5 rounded ${job.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                                 {job.status === 'active' ? '招聘中' : '已关闭'}
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                         <div className="flex items-center gap-3">
                           <div className="text-center px-3 py-2 bg-white rounded-lg border border-slate-100 min-w-[60px]">
                             <div className="text-xl font-bold text-indigo-600">{job.view_count || 0}</div>
                             <div className="text-xs text-slate-400">浏览</div>
                           </div>
                           <div className="text-center px-3 py-2 bg-white rounded-lg border border-slate-100 min-w-[60px]">
                             <div className="text-xl font-bold text-emerald-600">{job.apply_count || 0}</div>
                             <div className="text-xs text-slate-400">投递</div>
                           </div>
                         </div>
                         <div className="p-3 bg-white text-indigo-600 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">
                           <ChevronRight size={18} />
                         </div>
                      </div>
                    </div>
                  ))}
                  {myJobs.length > 5 && (
                    <button onClick={() => navigate("/employer/post")} className="text-center py-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      查看全部 {myJobs.length} 个岗位 →
                    </button>
                  )}
               </div>
             )}
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
                 { label: '平均招聘周期', value: '42.5小时', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                 { label: '匹配成功率', value: '91.2%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 { label: '总 Token 消耗', value: '1.2M', icon: Cpu, color: 'text-amber-500', bg: 'bg-amber-50' }
               ].map((card, i) => (
                 <div key={i} className="p-6">
                   <AnimatedStatItem 
                     value={card.value} 
                     label={card.label} 
                     icon={card.icon} 
                     color={card.color} 
                     bg={card.bg} 
                     delay={i * 150}
                     size="large"
                   />
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
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  const { data: profileData, loading: profileLoading } = useProfile(userId, 'employer');
  const { data: memoriesData } = useMemories(userId, 'employer');
  
  // 从 user_settings 获取企业基础信息
  const [settingsData, setSettingsData] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [jobList, setJobList] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  
  useEffect(() => {
    if (userId) {
      import('./services/apiService').then(m => {
        m.getSettings(userId)
          .then(data => { setSettingsData(data); setSettingsLoading(false); })
          .catch(() => setSettingsLoading(false));
        // 获取认证信息
        m.getEnterpriseCertifications(userId)
          .then(data => setCertData(data))
          .catch(() => {});
      });
      // 获取岗位列表
      getMyJobs(userId)
        .then(data => setJobList(data || []))
        .catch(() => setJobList([]))
        .finally(() => setJobsLoading(false));
    }
  }, [userId]);
  
  // 解析福利数据
  const parseBenefits = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  };
  
  // 合并数据
  const employerData = profileData?.employer_data || {};
  const dc = {
    name: settingsData?.display_name || employerData?.company_name || user?.company_name || '未设置公司名称',
    shortName: settingsData?.short_name || '',
    slogan: settingsData?.slogan || profileData?.title || employerData?.slogan || '',
    description: settingsData?.description || profileData?.summary || '',
    benefits: parseBenefits(settingsData?.benefits),
    industry: settingsData?.industry || employerData?.industry || '',
    size: settingsData?.company_size || employerData?.size || '',
    fundingStage: settingsData?.funding_stage || '',
    location: settingsData?.detail_address || settingsData?.address || employerData?.location || '',
    contactName: settingsData?.contact_name || '',
    hrPhone: settingsData?.hr_phone || '',
    contactEmail: settingsData?.contact_email || user?.email || '',
    website: settingsData?.website || '',
    isCertified: certData && certData.length > 0 && certData.some((c: any) => c.status === 'approved'),
    certInfo: certData?.[0] || null,
  };
  
  // 资料完善度
  const profileCompleteness = useMemo(() => {
    const fields = [dc.name, dc.description, dc.industry, dc.size, dc.fundingStage, dc.location, dc.contactName, dc.hrPhone, dc.contactEmail];
    const filled = fields.filter(f => f && f !== '未设置公司名称').length;
    return Math.round((filled / fields.length) * 100);
  }, [dc]);

  const isProfileEmpty = !settingsData?.display_name && !settingsData?.description;
  
  if (profileLoading || settingsLoading) {
    return (
      <div className="pt-40 text-center">
        <Loader2 className="mx-auto text-indigo-600 animate-spin mb-4" size={48} />
        <p className="text-slate-500 font-medium">加载企业资料中...</p>
      </div>
    );
  }
  
  // 空状态引导
  if (isProfileEmpty) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto animate-in fade-in duration-500">
        <button onClick={() => navigate('/employer')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group mb-8">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回管理后台
        </button>
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xl text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Building2 size={48} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">完善您的企业主页</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
            您还没有设置企业主页信息。完善企业资料可以展示企业实力，吸引更多优秀人才。
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/settings?tab=General')} className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl flex items-center gap-2">
              <Edit3 size={18} /> 完善基础信息
            </button>
            <button onClick={() => navigate('/settings?tab=Verification')} className="bg-white text-indigo-600 border-2 border-indigo-200 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2">
              <Shield size={18} /> 企业认证
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <button onClick={() => navigate('/employer')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group mb-6">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回管理后台
      </button>

      {/* 顶部 Banner */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 relative mb-8">
        <div className="h-[240px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-20 w-60 h-60 bg-violet-300/20 rounded-full blur-3xl"></div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 text-white flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-2xl p-5 shadow-2xl flex-shrink-0 border-2 border-white/50">
                <Building2 className="text-indigo-600 w-full h-full" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {dc.industry && (
                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-white/90 text-xs font-bold border border-white/10">
                      <Briefcase size={12} /> {dc.industry}
                    </span>
                  )}
                  {dc.isCertified && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-emerald-200 text-xs font-bold border border-emerald-400/20">
                      <CheckCircle size={12} /> 已认证
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{dc.name}</h1>
                {dc.shortName && <p className="text-indigo-200 font-medium mt-1">{dc.shortName}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/settings?tab=General')} className="bg-white text-slate-800 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg active:scale-95 flex items-center gap-2 text-sm">
                <Edit3 size={16} /> 编辑资料
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧主内容 */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 企业简介 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><FileText size={20} className="text-indigo-600" /></div>
              企业简介
            </h2>
            {dc.description ? (
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-[15px]">{dc.description}</p>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 italic mb-4">暂未填写企业简介</p>
                <button onClick={() => navigate('/settings?tab=General')} className="text-indigo-600 font-bold text-sm hover:underline">去完善</button>
              </div>
            )}
          </div>

          {/* 企业标签 */}
          {(dc.industry || dc.size || dc.fundingStage) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dc.industry && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all hover:border-indigo-200 group">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Briefcase size={20} className="text-amber-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">所属行业</p>
                  <p className="text-lg font-black text-slate-900">{dc.industry}</p>
                </div>
              )}
              {dc.size && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all hover:border-indigo-200 group">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Users size={20} className="text-indigo-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">企业规模</p>
                  <p className="text-lg font-black text-slate-900">{dc.size}</p>
                </div>
              )}
              {dc.fundingStage && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all hover:border-indigo-200 group">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp size={20} className="text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">融资阶段</p>
                  <p className="text-lg font-black text-slate-900">{dc.fundingStage}</p>
                </div>
              )}
            </div>
          )}

          {/* 企业福利 */}
          {dc.benefits.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><Gift size={20} className="text-amber-600" /></div>
                企业福利
              </h2>
              <div className="flex flex-wrap gap-3">
                {dc.benefits.map((b: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold border border-indigo-100/50 hover:shadow-sm transition-all">
                    <CheckCircle size={14} className="text-indigo-400" /> {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 招聘中的岗位 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Briefcase size={20} className="text-indigo-600" /></div>
                招聘中的岗位
                {jobList.filter(job => job.status === 'active').length > 0 && (
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{jobList.filter(job => job.status === 'active').length}</span>
                )}
              </h2>
              <button onClick={() => navigate('/employer/post')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                全部 <ChevronRight size={16} />
              </button>
            </div>
            {jobsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin mx-auto text-indigo-600 mb-2" size={24} />
                <p className="text-sm text-slate-400">加载中...</p>
              </div>
            ) : jobList.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={28} className="text-slate-400" />
                </div>
                <p className="text-slate-400 mb-4">暂无发布的岗位</p>
                <button onClick={() => navigate('/employer/post')} className="text-indigo-600 font-bold text-sm hover:underline">
                  发布第一个岗位
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobList.filter(job => job.status === 'active').slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/employer/post/${job.id}`)}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                        <Briefcase size={20} className="text-indigo-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{job.title}</div>
                        <div className="text-sm text-slate-500 mt-1 truncate">{job.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="text-base font-bold text-indigo-600">
                        {job.salary_min && job.salary_max ? `${(job.salary_min/1000).toFixed(0)}k-${(job.salary_max/1000).toFixed(0)}k` : '面议'}
                      </span>
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-colors">
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!jobsLoading && jobList.filter(job => job.status === 'active').length > 5 && (
              <button onClick={() => navigate('/employer/post')} className="w-full mt-5 py-3 text-sm text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
                查看全部 {jobList.filter(job => job.status === 'active').length} 个岗位 →
              </button>
            )}
          </div>

          {/* 认证信息 */}
          {dc.isCertified && dc.certInfo && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-8">
              <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><Shield size={20} className="text-emerald-600" /></div>
                企业认证
                <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-bold">已认证</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dc.certInfo.company_name && (
                  <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-emerald-100/50">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">注册企业名称</p>
                    <p className="text-sm font-bold text-slate-800">{dc.certInfo.company_name}</p>
                  </div>
                )}
                {dc.certInfo.credit_code && (
                  <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-emerald-100/50">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">统一社会信用代码</p>
                    <p className="text-sm font-bold text-slate-800">{dc.certInfo.credit_code}</p>
                  </div>
                )}
                {dc.certInfo.legal_person && (
                  <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-emerald-100/50">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">法定代表人</p>
                    <p className="text-sm font-bold text-slate-800">{dc.certInfo.legal_person}</p>
                  </div>
                )}
                {dc.certInfo.registered_capital && (
                  <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-emerald-100/50">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">注册资本</p>
                    <p className="text-sm font-bold text-slate-800">{dc.certInfo.registered_capital}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧信息栏 */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 资料完善度 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" /> 资料完善度
            </h3>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500 font-medium">完善进度</span>
                <span className="font-black text-indigo-600">{profileCompleteness}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700" style={{width: `${profileCompleteness}%`}}></div>
              </div>
            </div>
            {profileCompleteness < 100 && (
              <button onClick={() => navigate('/settings?tab=General')} className="w-full mt-3 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center justify-center gap-2">
                <Edit3 size={14} /> 继续完善
              </button>
            )}
          </div>
          
          {/* 联系信息 */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            <h3 className="text-base font-black mb-5 flex items-center gap-2 relative z-10">
              <Phone size={18} /> 联系信息
            </h3>
            <div className="space-y-4 relative z-10">
              {dc.contactName && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><UserIcon size={14} /></div>
                  <div>
                    <p className="text-xs text-indigo-200 font-medium">联系人</p>
                    <p className="font-bold">{dc.contactName}</p>
                  </div>
                </div>
              )}
              {dc.hrPhone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><Phone size={14} /></div>
                  <div>
                    <p className="text-xs text-indigo-200 font-medium">电话</p>
                    <p className="font-bold">{dc.hrPhone}</p>
                  </div>
                </div>
              )}
              {dc.contactEmail && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><Mail size={14} /></div>
                  <div>
                    <p className="text-xs text-indigo-200 font-medium">邮箱</p>
                    <p className="font-bold text-sm break-all">{dc.contactEmail}</p>
                  </div>
                </div>
              )}
              {dc.website && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><Globe size={14} /></div>
                  <div>
                    <p className="text-xs text-indigo-200 font-medium">官网</p>
                    <p className="font-bold text-sm break-all">{dc.website}</p>
                  </div>
                </div>
              )}
              {!dc.contactName && !dc.hrPhone && !dc.contactEmail && (
                <p className="text-indigo-200/70 text-sm italic text-center py-2">暂未设置联系信息</p>
              )}
            </div>
          </div>

          {/* 公司地址 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" /> 公司地址
            </h3>
            {dc.location ? (
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{dc.location}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">暂未设置公司地址</p>
            )}
          </div>

          {/* 快捷操作 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-900 mb-4">快捷操作</h3>
            <div className="space-y-2.5">
              <button onClick={() => navigate('/settings?tab=General')} className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-700 font-bold text-sm transition-all flex items-center gap-2.5">
                <Edit3 size={16} /> 编辑基础信息
              </button>
              <button onClick={() => navigate('/settings?tab=Verification')} className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold text-sm transition-all flex items-center gap-2.5">
                <Shield size={16} /> 企业认证管理
              </button>
              <button onClick={() => navigate('/ai-assistant')} className="w-full py-3 px-4 bg-violet-50 hover:bg-violet-100 rounded-xl text-violet-700 font-bold text-sm transition-all flex items-center gap-2.5">
                <Zap size={16} /> AI 助手
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


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
  const { user } = useAuth();
  const userId = user?.id || 0;

  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'time'>('time');
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postId]);

  useEffect(() => {
    if (postId && userId) {
      setLoading(true);
      getJobDetail(Number(postId), userId)
        .then(data => {
          setJobData(data.job);
          setApplications(data.applications || []);
          setStats(data.stats || {});
        })
        .catch(e => {
          console.error('加载岗位详情失败:', e);
        })
        .finally(() => setLoading(false));
    }
  }, [postId, userId]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return '面议';
    if (min && max) return `${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`;
    if (min) return `${(min / 1000).toFixed(0)}k 起`;
    return `最高 ${((max || 0) / 1000).toFixed(0)}k`;
  };

  const statusLabelMap: Record<string, { text: string; color: string }> = {
    parsing: { text: '简历解析中', color: 'bg-blue-100 text-blue-700' },
    benchmarking: { text: '对标分析中', color: 'bg-purple-100 text-purple-700' },
    screening: { text: '初筛中', color: 'bg-amber-100 text-amber-700' },
    interviewing: { text: '面试中', color: 'bg-orange-100 text-orange-700' },
    evaluating: { text: '评估中', color: 'bg-indigo-100 text-indigo-700' },
    offer: { text: 'Offer阶段', color: 'bg-emerald-100 text-emerald-700' },
    accepted: { text: '已录用', color: 'bg-green-100 text-green-700' },
    rejected: { text: '已拒绝', color: 'bg-red-100 text-red-600' },
    withdrawn: { text: '已撤回', color: 'bg-slate-100 text-slate-500' },
  };

  const stageLabelMap: Record<string, { text: string; color: string }> = {
    parse: { text: '解析', color: 'text-blue-600' },
    benchmark: { text: '对标', color: 'text-purple-600' },
    first_interview: { text: '初试', color: 'text-indigo-600' },
    second_interview: { text: '复试', color: 'text-orange-600' },
    final: { text: '终审', color: 'text-emerald-600' },
  };

  const getStatusLabel = (s: string) => statusLabelMap[s] || { text: s, color: 'bg-slate-100 text-slate-600' };
  const getStageLabel = (s: string) => stageLabelMap[s] || { text: s, color: 'text-slate-500' };

  // 过滤和排序
  const filteredApps = applications
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'score') return (b.match_score || 0) - (a.match_score || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const acceptedCount = applications.filter(a => a.status === 'accepted').length;

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <Loader2 className="mx-auto animate-spin text-indigo-600 mb-3" size={24} />
          <p className="text-sm text-slate-400">加载岗位详情...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-900 font-black mb-2">岗位不存在或无权访问</p>
          <button onClick={() => navigate("/employer/post")} className="bg-indigo-600 text-white px-6 py-3 rounded font-black text-sm mt-4 shadow-xl shadow-indigo-200">
            返回职位管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* 页面头部 */}
      <button onClick={() => navigate("/employer/post")} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors group text-sm">
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回职位管理
      </button>

      <div className="bg-white rounded-lg p-8 border border-slate-100 card-shadow mb-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded text-xs font-black uppercase ${
                jobData.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {jobData.status === 'active' ? '招聘中' : '已关闭'}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {postId}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">{jobData.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
              <span className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400" /> {jobData.company}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {jobData.location}</span>
              <span className="font-black text-indigo-600">{formatSalary(jobData.salary_min, jobData.salary_max)}</span>
              <span className="flex items-center gap-1.5 text-slate-400"><Calendar size={14} /> {jobData.created_at ? new Date(jobData.created_at).toLocaleDateString('zh-CN') : '-'}</span>
            </div>
            {jobData.tags && jobData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {jobData.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-500/80 rounded text-xs font-black uppercase">{tag}</span>
                ))}
              </div>
            )}
            {jobData.description && (
              <div className="mt-4 p-5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-3 text-slate-700">
                  <FileText size={16} className="text-indigo-600" />
                  <span className="font-semibold">岗位描述</span>
                </div>
                <div className={`text-sm text-slate-600 leading-relaxed whitespace-pre-wrap ${!showDesc && jobData.description.length > 300 ? 'line-clamp-4' : ''}`}>
                  {jobData.description}
                </div>
                {jobData.description.length > 300 && (
                  <button onClick={() => setShowDesc(!showDesc)} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors">
                    {showDesc ? '收起' : '展开全文'}
                    {showDesc ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
              </div>
            )}
          </div>
          {/* 统计 */}
          <div className="flex gap-3">
            <div className="bg-white rounded-lg px-4 py-3 text-center min-w-[80px] border border-slate-100">
              <div className="text-xl font-bold text-indigo-600">{stats.total || 0}</div>
              <div className="text-xs text-slate-400">投递</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 text-center min-w-[80px] border border-slate-100">
              <div className="text-xl font-bold text-emerald-600">{acceptedCount}</div>
              <div className="text-xs text-slate-400">录用</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 text-center min-w-[80px] border border-slate-100">
              <div className="text-xl font-bold text-slate-900">{jobData.view_count || 0}</div>
              <div className="text-xs text-slate-400">浏览</div>
            </div>
          </div>
        </div>
      </div>

      {/* 投递列表 */}
      <div className="bg-white rounded-lg border border-slate-100 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Users size={22} className="text-indigo-600" /> 求职者列表
            {applications.length > 0 && <span className="text-sm font-medium text-slate-400">({applications.length})</span>}
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">全部状态</option>
              <option value="parsing">简历解析中</option>
              <option value="screening">初筛中</option>
              <option value="interviewing">面试中</option>
              <option value="evaluating">评估中</option>
              <option value="offer">Offer阶段</option>
              <option value="accepted">已录用</option>
              <option value="rejected">已拒绝</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="time">最新投递</option>
              <option value="score">匹配分最高</option>
            </select>
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className="text-center py-20">
            <Inbox className="mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-slate-900 font-black mb-1">
              {applications.length === 0 ? '暂无候选人投递' : '没有符合条件的投递'}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              {applications.length === 0 ? '岗位发布后，系统会自动为您匹配合适的候选人' : '尝试更换筛选条件'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {filteredApps.map((app) => {
              const stLabel = getStatusLabel(app.status);
              const sgLabel = getStageLabel(app.current_stage);
              const avatarChar = (app.candidate_name || '?').charAt(0);
              return (
                <div key={app.flow_id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded border border-slate-100 group hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    {/* 头像 */}
                    {app.candidate_avatar ? (
                      <img src={app.candidate_avatar} alt="" className="w-14 h-14 rounded shadow-lg ring-4 ring-indigo-50 object-cover flex-shrink-0 group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-14 h-14 bg-indigo-600 text-white flex items-center justify-center text-xl font-black rounded shadow-lg ring-4 ring-indigo-50 group-hover:scale-105 transition-transform flex-shrink-0">
                        {avatarChar}
                      </div>
                    )}
                    <div>
                      <div className="text-base font-black text-slate-900 tracking-tight">{app.candidate_name}</div>
                      {app.candidate_role && <div className="text-xs font-bold text-slate-500 mt-0.5">{app.candidate_role}{app.candidate_experience ? ` · ${app.candidate_experience}年经验` : ''}</div>}
                      <div className="flex items-center gap-2 mt-2">
                        {app.match_score > 0 && (
                          <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Zap size={10} /> {app.match_score}% 匹配
                          </span>
                        )}
                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-lg ${stLabel.color}`}>{stLabel.text}</span>
                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-lg bg-white border border-slate-100 ${sgLabel.color}`}>{sgLabel.text}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-bold">{app.created_at ? new Date(app.created_at).toLocaleDateString('zh-CN') : '-'}</div>
                      {app.last_action && <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{app.last_action}</div>}
                    </div>
                    <button onClick={() => navigate(`/employer/talent/${app.candidate_id}`)} className="p-3 bg-white text-indigo-600 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部 */}
        {filteredApps.length > 0 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              共 <span className="font-black text-slate-900">{filteredApps.length}</span> 位求职者
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 记忆录入任务页 (MemoryInputView) ---
const MemoryInputView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // 从路由 state 获取 scope，默认为 candidate
  const scope = (location.state as any)?.scope || 'candidate';
  const isEmployerMemory = scope === 'employer';
  
  const [memoryType, setMemoryType] = useState(isEmployerMemory ? 'culture' : 'skill');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // 根据 scope 显示不同的记忆类型
  const employerMemoryTypes = [
    { id: 'culture', name: '企业文化', icon: Heart, color: 'bg-rose-100 text-rose-600', desc: '企业文化、价值观、用人理念' },
    { id: 'tech', name: '技术要求', icon: Cpu, color: 'bg-indigo-100 text-indigo-600', desc: '技术栈、编程语言、框架要求' },
    { id: 'team', name: '团队规模', icon: Users, color: 'bg-teal-100 text-teal-600', desc: '团队人数、成员构成' },
    { id: 'salary', name: '薪酬福利', icon: CircleDollarSign, color: 'bg-green-100 text-green-600', desc: '薪资范围、奖金、期权、福利' },
    { id: 'location', name: '工作地点', icon: MapPin, color: 'bg-sky-100 text-sky-600', desc: '城市、远程、办公地址' },
    { id: 'goal', name: '招聘目标', icon: Target, color: 'bg-amber-100 text-amber-600', desc: '招聘计划、人数、周期' },
  ];
  
  const candidateMemoryTypes = [
    { id: 'skill', name: '技能专长', icon: Cpu, color: 'bg-indigo-100 text-indigo-600', desc: '编程语言、技术栈、专业技能' },
    { id: 'experience', name: '工作经验', icon: Clock, color: 'bg-amber-100 text-amber-600', desc: '工作年限、行业背景、项目经验' },
    { id: 'culture', name: '文化偏好', icon: Heart, color: 'bg-rose-100 text-rose-600', desc: '理想的公司文化、团队氛围' },
    { id: 'goal', name: '职业目标', icon: Target, color: 'bg-emerald-100 text-emerald-600', desc: '期望薪资、职位、发展方向' },
    { id: 'location', name: '工作地点', icon: MapPin, color: 'bg-sky-100 text-sky-600', desc: '期望城市、远程偏好' },
    { id: 'salary', name: '期望薪资', icon: CircleDollarSign, color: 'bg-green-100 text-green-600', desc: '薪资范围、福利期望' },
  ];
  
  const memoryTypes = isEmployerMemory ? employerMemoryTypes : candidateMemoryTypes;
  
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    
    try {
      // 调用后端 API 保存记忆，传递 scope 参数
      await createMemory({
        type: memoryType,
        content: content.trim(),
        importance: 'Medium',
        scope: scope,
      }, user?.id || 1);
      
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('保存记忆失败:', error);
      alert('保存记忆失败，请重试');
      setIsSubmitting(false);
    }
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
            <button 
              onClick={() => navigate(isEmployerMemory ? '/employer/memory' : '/candidate/memory')} 
              className={`px-6 py-3 ${isEmployerMemory ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg font-bold transition-colors`}
            >
              查看{isEmployerMemory ? '企业' : '人才'}记忆库
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
        <div className={`bg-gradient-to-r ${isEmployerMemory ? 'from-indigo-600 to-purple-600' : 'from-emerald-600 to-teal-600'} p-8 text-white`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Brain size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black">手动录入新记忆</h1>
              <p className={`${isEmployerMemory ? 'text-indigo-200' : 'text-emerald-200'} text-sm`}>
                {isEmployerMemory ? '为企业画像注入新的记忆与偏好' : '为人才画像添加技能、经验与职业目标'}
              </p>
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

// --- 登录/注册视图 (LoginView) ---
const LoginView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoggedIn, needsRoleSelection, userRole } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // 获取来源页面（如果有）
  const from = (location.state as any)?.from || null;
  
  // 表单数据
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  
  // 已登录则跳转（除非需要设置密码）
  useEffect(() => {
    if (isLoggedIn && !showSetPassword) {
      if (needsRoleSelection) {
        navigate('/select-role', { state: { from } });
      } else if (from) {
        navigate(from);
      } else {
        if (userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin') {
          navigate('/employer');
        } else {
          navigate('/candidate');
        }
      }
    }
  }, [isLoggedIn, needsRoleSelection, navigate, from, userRole, showSetPassword]);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 检查手机号是否已注册
  const checkPhoneRegistered = async (phoneNum: string): Promise<boolean> => {
    try {
      const emailFormat = `${phoneNum}@phone.devnors.com`;
      // 尝试用一个错误密码登录来检查用户是否存在
      const result = await login(emailFormat, '__check_only__');
      // 如果返回"邮箱或密码错误"说明用户存在
      return result.error?.includes('邮箱或密码错误') || false;
    } catch {
      return false;
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setError('');
    
    // 检查是否是新用户
    const registered = await checkPhoneRegistered(phone);
    setIsNewUser(!registered);
    
    if (!registered) {
      // 新用户只能验证码登录
      setLoginMethod('code');
    }
    
    setCountdown(60);
    // TODO: 调用后端发送验证码API
    // 目前模拟发送成功
  };

  // 手机号变化时重置状态
  const handlePhoneChange = (value: string) => {
    const newPhone = value.replace(/\D/g, '').slice(0, 11);
    setPhone(newPhone);
    setIsNewUser(false);
    setError('');
  };

  // 设置密码
  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('密码至少需要6位');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('两次密码输入不一致');
      return;
    }
    
    setIsLoading(true);
    try {
      // 调用修改密码API
      const { changePassword } = await import('./services/apiService');
      await changePassword('code_' + verifyCode, newPassword);
      setShowSetPassword(false);
      // 跳转
      if (needsRoleSelection) {
        navigate('/select-role', { state: { from } });
      } else if (from) {
        navigate(from);
      } else {
        navigate('/candidate');
      }
    } catch (err: any) {
      setError(err.message || '设置密码失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 跳过设置密码
  const handleSkipSetPassword = () => {
    setShowSetPassword(false);
    if (needsRoleSelection) {
      navigate('/select-role', { state: { from } });
    } else if (from) {
      navigate(from);
    } else {
      navigate('/candidate');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 验证手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (loginMethod === 'password') {
      if (!password || password.length < 6) {
        setError('密码至少需要6位');
        return;
      }
    } else {
      if (!verifyCode || verifyCode.length !== 6) {
        setError('请输入6位验证码');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const emailFormat = `${phone}@phone.devnors.com`;
      
      if (loginMethod === 'code') {
        // 验证码登录
        const result = await login(emailFormat, 'code_' + verifyCode);
        if (!result.success) {
          // 尝试注册（新用户）
          const regResult = await register({ email: emailFormat, password: 'code_' + verifyCode, name: phone, role: 'VIEWER' });
          if (!regResult.success) {
            setError('验证码错误或已过期');
          } else {
            // 注册成功后自动登录
            const loginResult = await login(emailFormat, 'code_' + verifyCode);
            if (loginResult.success) {
              // 首次登录，提示设置密码
              setShowSetPassword(true);
            }
          }
        }
      } else {
        // 密码登录
        const result = await login(emailFormat, password);
        if (!result.success) {
          if (result.error?.includes('邮箱或密码错误')) {
            // 检查是否是新用户
            setError('手机号未注册或密码错误，请使用验证码登录');
            setLoginMethod('code');
          } else {
            setError(result.error || '登录失败');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 测试账号快速登录
  const handleTestLogin = async (type: 'candidate' | 'employer') => {
    setIsLoading(true);
    setError('');
    const testAccounts = {
      candidate: { email: 'test@example.com', password: 'test123456' },
      employer: { email: 'hr@devnors.com', password: 'hr123456' },
    };
    const account = testAccounts[type];
    const result = await login(account.email, account.password);
    if (!result.success) {
      setError(result.error || '登录失败');
    }
    setIsLoading(false);
  };

  // 设置密码界面
  if (showSetPassword) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="bg-white rounded-2xl p-10 shadow-2xl border border-slate-100 max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
              <Lock className="text-white" size={32}/>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">设置登录密码</h2>
            <p className="text-slate-400 text-sm font-medium">设置密码后可使用密码快速登录</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">设置密码</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-300 focus:outline-none transition-all" 
                placeholder="请设置密码（至少6位）"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">确认密码</label>
              <input 
                type="password" 
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-300 focus:outline-none transition-all" 
                placeholder="请再次输入密码"
              />
            </div>
            
            <button 
              onClick={handleSetPassword}
              disabled={isLoading}
              className="w-full bg-emerald-500 text-white font-black py-4 rounded-lg shadow-xl shadow-emerald-200 hover:bg-emerald-600 hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  处理中...
                </>
              ) : (
                '确认设置'
              )}
            </button>
            
            <button 
              onClick={handleSkipSetPassword}
              className="w-full py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
            >
              暂时跳过，稍后设置
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-white rounded-2xl p-10 shadow-2xl border border-slate-100 max-w-md mx-auto relative overflow-hidden">
        {/* 品牌装饰 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 rotate-6 hover:rotate-0 transition-transform">
            <Zap className="text-white" size={32}/>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">登录 / 注册</h2>
          <p className="text-slate-400 text-sm font-medium">未注册的手机号将自动创建账号</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* 新用户提示 */}
        {isNewUser && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            该手机号未注册，请使用验证码完成首次登录
          </div>
        )}

        {/* 登录方式切换 */}
        {!isNewUser && (
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMethod('password'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
                loginMethod === 'password' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              密码登录
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('code'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
                loginMethod === 'code' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              验证码登录
            </button>
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">手机号</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+86</span>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 pl-14 pr-4 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 focus:outline-none transition-all" 
                placeholder="请输入手机号"
                maxLength={11}
                required
              />
            </div>
          </div>
          
          {(loginMethod === 'password' && !isNewUser) ? (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">密码</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 focus:outline-none transition-all" 
                placeholder="请输入密码"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">验证码</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 focus:outline-none transition-all" 
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className={`px-4 py-3.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    countdown > 0 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                处理中...
              </>
            ) : (
              isNewUser ? '注册并登录' : '登录'
            )}
          </button>
        </form>

        {/* 分割线 */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">测试账号</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        {/* 测试账号快捷入口 */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleTestLogin('candidate')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <UserIcon size={16} />
            <span className="text-xs font-black">求职者测试</span>
          </button>
          <button 
            onClick={() => handleTestLogin('employer')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <Building2 size={16} />
            <span className="text-xs font-black">企业方测试</span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs font-bold text-slate-300 uppercase tracking-[0.15em]">Devnors Auth Gateway</p>
      </div>
    </div>
  );
};

// --- 身份选择视图 (RoleSelectionView) ---
const RoleSelectionView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUserRole, isLoggedIn, needsRoleSelection } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'employer' | null>(null);

  // 获取来源页面（如果有）
  const from = (location.state as any)?.from || null;

  // 未登录跳转到登录页
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (!needsRoleSelection) {
      // 已选择身份，跳转到对应页面
      if (from) {
        navigate(from);
      } else {
        navigate('/workbench');
      }
    }
  }, [isLoggedIn, needsRoleSelection, navigate, from]);

  const handleSelectRole = async (role: 'candidate' | 'employer') => {
    setSelectedRole(role);
    setIsLoading(true);
    await setUserRole(role);
    setIsLoading(false);
    // 如果有来源页面，跳转到来源页面，否则跳转到默认控制台
    if (from) {
      navigate(from);
    } else {
      navigate(role === 'candidate' ? '/candidate' : '/employer');
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
          <Zap className="text-white" size={40}/>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4">
          欢迎，{user?.name || '用户'}！
        </h1>
        <p className="text-slate-500 font-medium mb-12">
          请选择您的身份，我们将为您提供个性化的服务
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 求职者 */}
          <button
            onClick={() => handleSelectRole('candidate')}
            disabled={isLoading}
            className={`group p-8 bg-white rounded-2xl border-2 transition-all hover:shadow-xl hover:border-emerald-300 active:scale-[0.98] disabled:opacity-50 ${
              selectedRole === 'candidate' ? 'border-emerald-500 shadow-xl' : 'border-slate-100'
            }`}
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <UserIcon size={32} className="text-emerald-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">我是求职者</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              寻找理想职位，获取 AI 职业规划，智能简历优化
            </p>
            <ul className="text-left text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                AI 智能简历分析
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                精准职位匹配推荐
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                AI 面试模拟训练
              </li>
            </ul>
          </button>

          {/* 企业方 */}
          <button
            onClick={() => handleSelectRole('employer')}
            disabled={isLoading}
            className={`group p-8 bg-white rounded-2xl border-2 transition-all hover:shadow-xl hover:border-indigo-300 active:scale-[0.98] disabled:opacity-50 ${
              selectedRole === 'employer' ? 'border-indigo-500 shadow-xl' : 'border-slate-100'
            }`}
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Building2 size={32} className="text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">我是招聘方</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              发布职位，智能筛选人才，AI 辅助面试评估
            </p>
            <ul className="text-left text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" />
                AI 智能人才筛选
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" />
                自动化招聘流程
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" />
                智能面试评估报告
              </li>
            </ul>
          </button>
        </div>

        {isLoading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-indigo-600">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-medium">正在设置您的身份...</span>
          </div>
        )}
      </div>
    </div>
  );
};

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

// 编辑字段配置
const EDIT_FIELD_CONFIG: Record<string, {
  label: string;
  prompt: string;
  validate: (value: string) => { valid: boolean; message: string };
  examples?: string[];
}> = {
  // 求职者画像字段
  'candidate_skill': {
    label: '技能专长',
    prompt: '请告诉我您的技能专长，包括：\n• 编程语言/技术栈\n• 工具/框架\n• 专业技能\n\n例如："精通 Python、React，熟悉机器学习"',
    validate: (v) => v.length >= 5 ? { valid: true, message: '' } : { valid: false, message: '请输入至少5个字符，详细描述您的技能' },
    examples: ['精通 Python 和 React', '5年 Java 后端开发经验', '熟悉云原生和 K8s']
  },
  'candidate_experience': {
    label: '工作经历',
    prompt: '请描述您的工作经历，包括：\n• 公司名称\n• 职位\n• 工作年限\n• 主要职责\n\n例如："在字节跳动担任高级工程师3年，负责推荐系统开发"',
    validate: (v) => v.length >= 10 ? { valid: true, message: '' } : { valid: false, message: '请详细描述您的工作经历，至少10个字符' },
    examples: ['阿里巴巴 高级工程师 3年', '腾讯 产品经理 2年']
  },
  'candidate_goal': {
    label: '职业目标',
    prompt: '请告诉我您的职业目标：\n• 期望职位\n• 期望薪资范围\n• 期望工作地点\n• 职业发展方向\n\n例如："目标技术总监，期望年薪80-120万，北京"',
    validate: (v) => v.length >= 5 ? { valid: true, message: '' } : { valid: false, message: '请描述您的职业目标' },
    examples: ['期望技术总监岗位', '目标年薪 50-80 万']
  },
  'candidate_preference': {
    label: '求职偏好',
    prompt: '请告诉我您的求职偏好：\n• 期望的公司类型（大厂/创业公司/外企）\n• 工作方式（远程/混合/现场）\n• 团队文化偏好\n\n例如："偏好远程办公的技术驱动型公司"',
    validate: (v) => v.length >= 5 ? { valid: true, message: '' } : { valid: false, message: '请描述您的求职偏好' },
    examples: ['偏好远程办公', '喜欢技术氛围浓厚的团队']
  },
  // 企业画像字段
  'employer_company': {
    label: '公司介绍',
    prompt: '请介绍您的公司：\n• 公司名称和行业\n• 主营业务\n• 公司规模\n• 发展阶段\n\n例如："XX科技，专注AI领域，B轮融资，200人规模"',
    validate: (v) => v.length >= 10 ? { valid: true, message: '' } : { valid: false, message: '请详细介绍公司信息，至少10个字符' },
    examples: ['专注 AI 领域的 B 轮创业公司']
  },
  'employer_culture': {
    label: '企业文化',
    prompt: '请描述您公司的企业文化：\n• 核心价值观\n• 工作氛围\n• 团队特点\n\n例如："扁平化管理，技术驱动，鼓励创新"',
    validate: (v) => v.length >= 5 ? { valid: true, message: '' } : { valid: false, message: '请描述企业文化' },
    examples: ['扁平化管理', '技术驱动，鼓励创新']
  },
  'employer_requirement': {
    label: '招聘需求',
    prompt: '请描述您的招聘需求：\n• 招聘岗位\n• 人数\n• 技能要求\n• 经验要求\n\n例如："招聘3名高级前端工程师，要求3年以上React经验"',
    validate: (v) => v.length >= 10 ? { valid: true, message: '' } : { valid: false, message: '请详细描述招聘需求' },
    examples: ['招聘高级前端工程师 3 名', '需要 3 年以上经验']
  },
  'employer_benefit': {
    label: '福利待遇',
    prompt: '请描述公司提供的福利待遇：\n• 薪资范围\n• 奖金/期权\n• 假期福利\n• 其他福利\n\n例如："月薪30-50K，年终奖3-6个月，弹性工作，免费三餐"',
    validate: (v) => v.length >= 5 ? { valid: true, message: '' } : { valid: false, message: '请描述福利待遇' },
    examples: ['年终奖 3-6 个月', '弹性工作时间']
  },
  // 个人资料字段
  'candidate_name': {
    label: '姓名',
    prompt: '请输入您的姓名（中英文皆可）',
    validate: (v) => v.length >= 2 ? { valid: true, message: '' } : { valid: false, message: '请输入有效的姓名' },
    examples: ['张三', 'John Doe']
  },
  'candidate_title': {
    label: '职位头衔',
    prompt: '请输入您当前或期望的职位头衔\n\n例如："高级前端工程师"、"产品经理"',
    validate: (v) => v.length >= 2 ? { valid: true, message: '' } : { valid: false, message: '请输入有效的职位头衔' },
    examples: ['高级前端工程师', '资深产品经理', 'AI算法工程师']
  },
  'candidate_summary': {
    label: '个人简介',
    prompt: '请简要介绍自己（100-300字）：\n• 专业背景\n• 核心能力\n• 职业亮点\n\n例如："8年互联网从业经验，专注于前端架构设计..."',
    validate: (v) => v.length >= 20 ? { valid: true, message: '' } : { valid: false, message: '个人简介至少20个字符' },
    examples: ['8年互联网经验，专注前端架构', '多年 AI 算法研发经验']
  },
  // 企业资料字段
  'employer_name': {
    label: '公司名称',
    prompt: '请输入公司全称',
    validate: (v) => v.length >= 2 ? { valid: true, message: '' } : { valid: false, message: '请输入有效的公司名称' },
    examples: ['得若智能科技', 'Devnors Tech']
  },
  'employer_mission': {
    label: '企业使命',
    prompt: '请描述公司的使命和愿景：\n• 公司追求的目标\n• 想要创造的价值\n• 对行业的愿景',
    validate: (v) => v.length >= 10 ? { valid: true, message: '' } : { valid: false, message: '请描述企业使命' },
    examples: ['用 AI 重塑生产力', '让招聘更智能']
  },
  'employer_tech': {
    label: '技术栈',
    prompt: '请描述公司使用的技术栈：\n• 开发语言\n• 框架工具\n• 技术理念',
    validate: (v) => v.length >= 5 ? { valid: true, message: '' } : { valid: false, message: '请描述技术栈' },
    examples: ['Go + Kubernetes 云原生架构', 'Python + TensorFlow AI 技术栈']
  }
};

// --- AI助手页面 (AIAssistantView) - 整合任务详情与个性化提示 ---
const AIAssistantView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, userRole } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certImageInputRef = useRef<HTMLInputElement>(null);
  
  // 获取用户ID和资料数据（用于检测是否为新用户）
  // 开发环境默认使用 user_id=4（测试用户），生产环境应为 1 或要求登录
  const userId = user?.id || 4;
  const profileType = userRole === 'employer' ? 'employer' : 'candidate';
  const { data: userProfileData, loading: profileLoading } = useProfile(userId, profileType);
  
  // 文件上传状态
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCertImage, setUploadingCertImage] = useState(false);
  
  // 从 URL 获取参数
  const searchParams = new URLSearchParams(location.search);
  const taskIdFromUrl = searchParams.get('taskId');
  const editTypeFromUrl = searchParams.get('editType');  // 编辑类型: memory, profile, job
  const editFieldFromUrl = searchParams.get('editField'); // 字段名
  const editIdFromUrl = searchParams.get('editId');       // 记录ID
  const taskTypeFromUrl = searchParams.get('taskType');   // 特殊任务类型: apply
  
  // 编辑模式状态
  const [editMode, setEditMode] = useState<{
    active: boolean;
    type: string;
    field: string;
    id?: string;
    awaitingInput: boolean;
    validationError?: string;
  }>({ active: false, type: '', field: '', awaitingInput: false });
  
  // 求职申请模式状态
  const [applyMode, setApplyMode] = useState<{
    active: boolean;
    step: 'resume' | 'analyze' | 'match' | 'complete';
    resumeText: string;
    analysisResult: string | null;
  }>({ active: false, step: 'resume', resumeText: '', analysisResult: null });
  
  // 招聘发布模式状态
  const [postMode, setPostMode] = useState<{
    active: boolean;
    step: 'requirement' | 'generate' | 'optimize' | 'complete';
    jobDescription: string;
    generatedResult: string | null;
  }>({ active: false, step: 'requirement', jobDescription: '', generatedResult: null });
  
  // 邀请好友模式状态
  const [inviteMode, setInviteMode] = useState<{
    active: boolean;
    step: 'intro' | 'share' | 'track';
    inviteLink: string;
    inviteCount: number;
  }>({ active: false, step: 'intro', inviteLink: '', inviteCount: 0 });
  
  // 完善简历模式状态
  const [profileCompleteMode, setProfileCompleteMode] = useState<{
    active: boolean;
    missingFields: {key: string; label: string; editUrl: string}[];
    currentFieldIndex: number;
  }>({ active: false, missingFields: [], currentFieldIndex: -1 });
  
  // 完善企业资料模式状态
  const [enterpriseProfileMode, setEnterpriseProfileMode] = useState<{
    active: boolean;
    missingFields: {key: string; label: string; type: 'text' | 'select' | 'textarea'; options?: string[]}[];
    currentFieldIndex: number;
  }>({ active: false, missingFields: [], currentFieldIndex: -1 });
  
  // DISC测试模式状态
  const [discTestMode, setDiscTestMode] = useState<{
    active: boolean;
    currentQuestion: number;
    answers: {question: number; answer: string; dimension: string}[];
    completed: boolean;
  }>({ active: false, currentQuestion: 0, answers: [], completed: false });
  
  // DISC测试题目（根据用户简历动态生成场景）
  const discQuestions = [
    {
      id: 1,
      question: "当团队项目遇到紧急问题时，您通常会？",
      options: [
        { label: "A", text: "立即主动承担责任，快速制定解决方案", dimension: "D" },
        { label: "B", text: "召集团队讨论，激励大家共同解决", dimension: "I" },
        { label: "C", text: "先安抚团队情绪，有条不紊地处理", dimension: "S" },
        { label: "D", text: "仔细分析问题原因，确保找到根本解决方案", dimension: "C" }
      ]
    },
    {
      id: 2,
      question: "在工作会议中，您更倾向于？",
      options: [
        { label: "A", text: "直接表达观点，推动会议高效进行", dimension: "D" },
        { label: "B", text: "积极发言，营造轻松的讨论氛围", dimension: "I" },
        { label: "C", text: "倾听他人意见，寻求共识", dimension: "S" },
        { label: "D", text: "准备充分的数据，提出有据可依的建议", dimension: "C" }
      ]
    },
    {
      id: 3,
      question: "面对新的挑战性任务，您会？",
      options: [
        { label: "A", text: "迎难而上，把它当作证明能力的机会", dimension: "D" },
        { label: "B", text: "感到兴奋，期待与团队一起攻克", dimension: "I" },
        { label: "C", text: "稳步推进，确保每一步都扎实可靠", dimension: "S" },
        { label: "D", text: "详细规划，确保万无一失再开始", dimension: "C" }
      ]
    },
    {
      id: 4,
      question: "与同事产生意见分歧时，您通常？",
      options: [
        { label: "A", text: "坚持自己的观点，用事实说服对方", dimension: "D" },
        { label: "B", text: "用幽默和热情化解矛盾，寻求双赢", dimension: "I" },
        { label: "C", text: "尊重对方意见，寻找折中方案", dimension: "S" },
        { label: "D", text: "冷静分析双方观点的利弊，理性讨论", dimension: "C" }
      ]
    },
    {
      id: 5,
      question: "您理想的工作环境是？",
      options: [
        { label: "A", text: "快节奏、有挑战、能够独立决策", dimension: "D" },
        { label: "B", text: "开放自由、团队协作、充满活力", dimension: "I" },
        { label: "C", text: "稳定和谐、团队支持、有安全感", dimension: "S" },
        { label: "D", text: "有规范、重质量、能够专注细节", dimension: "C" }
      ]
    },
    {
      id: 6,
      question: "当需要做重要决定时，您会？",
      options: [
        { label: "A", text: "快速决策，相信自己的判断力", dimension: "D" },
        { label: "B", text: "征求朋友同事的意见，听取多方建议", dimension: "I" },
        { label: "C", text: "仔细权衡各种因素，确保考虑周全", dimension: "S" },
        { label: "D", text: "收集数据和证据，进行系统分析", dimension: "C" }
      ]
    },
    {
      id: 7,
      question: "在项目合作中，您更擅长的角色是？",
      options: [
        { label: "A", text: "领导者 - 带领团队向目标前进", dimension: "D" },
        { label: "B", text: "沟通者 - 协调各方，凝聚团队", dimension: "I" },
        { label: "C", text: "执行者 - 稳定可靠地完成任务", dimension: "S" },
        { label: "D", text: "分析师 - 确保方案的完善和可行", dimension: "C" }
      ]
    },
    {
      id: 8,
      question: "面对失败或挫折，您通常会？",
      options: [
        { label: "A", text: "总结教训，立即调整策略再战", dimension: "D" },
        { label: "B", text: "保持乐观，用积极态度影响团队", dimension: "I" },
        { label: "C", text: "给自己时间消化，然后稳步恢复", dimension: "S" },
        { label: "D", text: "深入复盘，找出每个可改进的细节", dimension: "C" }
      ]
    },
    {
      id: 9,
      question: "您更看重工作中的？",
      options: [
        { label: "A", text: "成就感和突破 - 不断挑战自我", dimension: "D" },
        { label: "B", text: "人际关系和认可 - 获得他人肯定", dimension: "I" },
        { label: "C", text: "稳定和安全 - 可预期的发展", dimension: "S" },
        { label: "D", text: "专业和精确 - 做到行业标准", dimension: "C" }
      ]
    },
    {
      id: 10,
      question: "当别人向您寻求帮助时，您通常？",
      options: [
        { label: "A", text: "直接给出建议和解决方案", dimension: "D" },
        { label: "B", text: "热情回应，并鼓励对方", dimension: "I" },
        { label: "C", text: "耐心倾听，给予支持和安慰", dimension: "S" },
        { label: "D", text: "帮助分析问题，提供详细指导", dimension: "C" }
      ]
    }
  ];
  
  // 求职偏好模式状态
  const [jobSearchMode, setJobSearchMode] = useState<{
    active: boolean;
    currentQuestion: number;
    answers: {question: string; answer: string; key: string}[];
    completed: boolean;
    tokenUsed: number;
    isSearching: boolean;
  }>({ active: false, currentQuestion: 0, answers: [], completed: false, tokenUsed: 0, isSearching: false });
  
  // 求职偏好问题清单
  const jobSearchQuestions = [
    {
      id: 1,
      key: 'job_type',
      question: "您期望的工作类型是？",
      options: [
        { label: "A", text: "全职 - 稳定的长期工作" },
        { label: "B", text: "兼职 - 灵活的兼职工作" },
        { label: "C", text: "实习 - 实习或培训机会" },
        { label: "D", text: "自由职业 - 项目制/远程工作" }
      ]
    },
    {
      id: 2,
      key: 'salary_expectation',
      question: "您的期望薪资范围是？（月薪）",
      options: [
        { label: "A", text: "3K-8K" },
        { label: "B", text: "8K-15K" },
        { label: "C", text: "15K-25K" },
        { label: "D", text: "25K以上 / 面议" }
      ]
    },
    {
      id: 3,
      key: 'work_location',
      question: "您期望的工作地点是？",
      options: [
        { label: "A", text: "一线城市（北上广深）" },
        { label: "B", text: "新一线城市（杭州、成都、武汉等）" },
        { label: "C", text: "二三线城市 / 家乡" },
        { label: "D", text: "不限 / 可接受远程" }
      ]
    },
    {
      id: 4,
      key: 'company_size',
      question: "您偏好的公司规模是？",
      options: [
        { label: "A", text: "大厂/上市公司（1000人以上）" },
        { label: "B", text: "中型企业（100-1000人）" },
        { label: "C", text: "初创公司/小团队（100人以下）" },
        { label: "D", text: "不限，看岗位和发展" }
      ]
    },
    {
      id: 5,
      key: 'industry_preference',
      question: "您偏好的行业领域是？",
      options: [
        { label: "A", text: "互联网/科技" },
        { label: "B", text: "金融/咨询" },
        { label: "C", text: "教育/医疗/消费" },
        { label: "D", text: "不限，看具体岗位" }
      ]
    },
    {
      id: 6,
      key: 'remote_preference',
      question: "您对远程办公的态度是？",
      options: [
        { label: "A", text: "必须支持远程/混合办公" },
        { label: "B", text: "优先考虑支持远程的" },
        { label: "C", text: "更喜欢现场办公" },
        { label: "D", text: "无所谓，都可以接受" }
      ]
    },
    {
      id: 7,
      key: 'start_time',
      question: "您期望的入职时间是？",
      options: [
        { label: "A", text: "随时可以入职" },
        { label: "B", text: "1-2周内" },
        { label: "C", text: "1个月内" },
        { label: "D", text: "需要较长时间交接（1个月以上）" }
      ]
    },
    {
      id: 8,
      key: 'overtime_attitude',
      question: "您对加班的态度是？",
      options: [
        { label: "A", text: "接受适度加班（偶尔）" },
        { label: "B", text: "不接受加班，注重工作生活平衡" },
        { label: "C", text: "可以接受高强度工作（有加班费）" },
        { label: "D", text: "根据项目情况灵活处理" }
      ]
    },
    {
      id: 9,
      key: 'travel_requirement',
      question: "您对出差的接受程度是？",
      options: [
        { label: "A", text: "不接受出差" },
        { label: "B", text: "接受偶尔出差（每月1-2次）" },
        { label: "C", text: "接受频繁出差" },
        { label: "D", text: "无所谓，看工作需要" }
      ]
    },
    {
      id: 10,
      key: 'career_focus',
      question: "您目前最看重的职业发展因素是？",
      options: [
        { label: "A", text: "薪资待遇 - 收入是首要考虑" },
        { label: "B", text: "成长空间 - 学习和晋升机会" },
        { label: "C", text: "工作稳定 - 稳定压倒一切" },
        { label: "D", text: "团队氛围 - 开心最重要" }
      ]
    }
  ];
  
  // 完善认证模式状态
  const [verificationMode, setVerificationMode] = useState<{
    active: boolean;
    items: {key: string; label: string; icon: string; description: string; needsImage: boolean}[];
    currentIndex: number;
    completedItems: string[];
    identityName?: string;  // 身份证上的姓名，用于后续认证校验
  }>({ active: false, items: [], currentIndex: -1, completedItems: [] });
  
  // 企业认证模式状态
  const [enterpriseVerificationMode, setEnterpriseVerificationMode] = useState<{
    active: boolean;
    items: {key: string; label: string; icon: string; description: string; needsImage: boolean; required?: boolean}[];
    currentIndex: number;
    completedItems: string[];
    companyName?: string;  // 营业执照上的企业名称
    legalRepresentative?: string;  // 营业执照上的法定代表人姓名（用于校验身份证）
    // 法人身份证临时存储（正面审核后保存，背面审核后合并创建记录）
    legalPersonIdFront?: {
      name: string;
      idNumber: string;
      imageData: string;
    };
  }>({ active: false, items: [], currentIndex: -1, completedItems: [] });
  
  // 认证项目定义
  const verificationItems = [
    { key: 'identity_front', label: '身份认证（正面）', icon: '🆔', description: '请上传您的**身份证正面照片**（人像面）\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n⚠️ 要求：\n• 图片清晰，姓名、身份证号可辨认\n• 支持 JPG/PNG 格式\n• 大小不超过 10MB\n\n⚠️ **身份认证是必填项**，不能跳过', needsImage: true },
    { key: 'identity_back', label: '身份认证（反面）', icon: '🆔', description: '请上传您的**身份证反面照片**（国徽面）\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n⚠️ 要求：\n• 图片清晰，有效期可辨认\n• 支持 JPG/PNG 格式\n• 大小不超过 10MB\n\n⚠️ **身份认证是必填项**，不能跳过', needsImage: true },
    { key: 'education', label: '学历认证', icon: '🎓', description: '请上传您的**学历证书/学位证书照片**\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n⚠️ 要求：\n• 图片清晰，学校和专业可辨认\n• 支持 JPG/PNG 格式\n• 大小不超过 10MB\n\n💡 输入 "跳过" 可以跳过当前项', needsImage: true },
    { key: 'skill_driver', label: '技能认证 - 驾驶证', icon: '🚗', description: '请上传您的**驾驶证照片**\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n⚠️ 要求：\n• 图片清晰，准驾车型和有效期可辨认\n• 支持 JPG/PNG 格式\n• 大小不超过 10MB\n\n💡 输入 "跳过" 可以跳过当前项', needsImage: true },
    { key: 'skill_cert', label: '技能认证 - 职业证书', icon: '🏆', description: '请上传您的**职业资格证书照片**\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n**支持的证书类型：**\n• 国家职业资格证书\n• 专业技术资格证书\n• 技能等级证书\n• 行业认证证书（PMP、CPA等）\n\n💡 输入 "跳过" 可以跳过当前项', needsImage: true },
    { key: 'work', label: '工作证明', icon: '💼', description: '请上传您的**工作证明材料**\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n**支持的证明类型：**\n• 工牌照片\n• 企业邮箱截图\n• 在职证明\n• 离职证明\n• 劳动合同（可打码敏感信息）\n\n⚠️ 请确保公司名称和您的姓名清晰可见\n\n💡 输入 "跳过" 可以跳过当前项', needsImage: true },
    { key: 'credit_fund', label: '征信认证 - 公积金证明', icon: '🏠', description: '请上传您的**公积金缴存证明**\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n**支持的证明类型：**\n• 公积金缴存证明\n• 公积金账户截图\n• 住房公积金查询结果\n\n⚠️ 请确保姓名和缴存信息清晰可见\n\n💡 输入 "跳过" 可以跳过当前项', needsImage: true },
    { key: 'credit_social', label: '征信认证 - 社保证明', icon: '🏥', description: '请上传您的**社保缴纳证明**\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n**支持的证明类型：**\n• 社保缴纳证明\n• 社保账户截图\n• 社保查询结果\n\n⚠️ 请确保姓名和缴纳信息清晰可见\n\n💡 输入 "跳过" 可以跳过当前项', needsImage: true }
  ];
  
  // 企业认证项目定义
  const enterpriseVerificationItems = [
    { key: 'business_license', label: '营业执照', icon: '🏢', description: '请上传您的**营业执照照片**\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n⚠️ 要求：\n• 图片清晰，企业名称、统一社会信用代码可辨认\n• 支持 JPG/PNG 格式\n• 大小不超过 10MB\n\n⚠️ **营业执照是必填项**，不能跳过', needsImage: true, required: true },
    { key: 'legal_person_id_front', label: '法人身份证（正面）', icon: '🆔', description: '请上传**企业法人的身份证正面照片**（人像面）\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n⚠️ 要求：\n• 图片清晰，姓名、身份证号可辨认\n• 法人姓名需与营业执照一致\n\n⚠️ **法人身份证是必填项**，不能跳过', needsImage: true, required: true },
    { key: 'legal_person_id_back', label: '法人身份证（背面）', icon: '🆔', description: '请上传**企业法人的身份证背面照片**（国徽面）\n\n📷 点击下方 **「上传证件」** 按钮选择图片\n\n⚠️ 要求：\n• 图片清晰，签发机关、有效期可辨认\n\n⚠️ **法人身份证是必填项**，不能跳过', needsImage: true, required: true }
  ];
  
  // 身份证上传状态
  const [idCardInfo, setIdCardInfo] = useState<{
    frontUploaded: boolean;
    backUploaded: boolean;
    frontInfo: Record<string, string> | null;
    backInfo: Record<string, string> | null;
  }>({ frontUploaded: false, backUploaded: false, frontInfo: null, backInfo: null });
  
  // 获取用户画像 memories 来判断完善程度
  const memoryScope = userRole === 'employer' ? 'employer' : 'candidate';
  const { data: memoriesData, refetch: refetchMemories } = useMemories(userId, memoryScope);
  
  // 计算画像完善程度
  const profileCompleteness = useMemo(() => {
    if (!memoriesData || memoriesData.length === 0) return 0;
    const types = new Set(memoriesData.map((m: any) => m.type));
    const requiredTypes = userRole === 'employer' 
      ? ['COMPANY', 'CULTURE', 'REQUIREMENT', 'BENEFIT']
      : ['SKILL', 'EXPERIENCE', 'GOAL', 'PREFERENCE'];
    const completedTypes = requiredTypes.filter(t => types.has(t)).length;
    return Math.round((completedTypes / requiredTypes.length) * 100);
  }, [memoriesData, userRole]);
  
  // 选中的任务
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [initialTaskLoaded, setInitialTaskLoaded] = useState(false);
  
  // 任务筛选状态：'pending' | 'completed'
  const [taskFilter, setTaskFilter] = useState<'pending' | 'completed'>('pending');
  
  // 检测用户资料是否为空（新用户）
  const isNewUser = useMemo(() => {
    if (!userProfileData) return true;
    // 检查关键字段是否为空
    const hasDisplayName = userProfileData.display_name && userProfileData.display_name.trim() !== '';
    const hasTitle = userProfileData.title && userProfileData.title.trim() !== '';
    const hasSummary = userProfileData.summary && userProfileData.summary.trim() !== '';
    const hasProfileJson = userProfileData.profile_json && Object.keys(userProfileData.profile_json).length > 0;
    // 如果所有关键字段都为空，则认为是新用户
    return !hasDisplayName && !hasTitle && !hasSummary && !hasProfileJson;
  }, [userProfileData]);
  
  // 生成欢迎消息
  const getWelcomeMessage = (currentTasks?: any[]) => {
    if (!isLoggedIn) {
      return '您好！我是 Devnors AI 智能助手。\n\n请先登录以获得个性化的服务体验。';
    }
    const userName = user?.name || user?.email?.split('@')[0] || '用户';
    
    // 安全获取任务列表（可能在初始化阶段tasks还未声明）
    let taskList: any[] = [];
    try {
      taskList = currentTasks || tasks || [];
    } catch {
      taskList = [];
    }
    
    if (userRole === 'employer' || userRole === 'recruiter') {
      // 企业/招聘方：根据任务完成状态动态引导
      const certTask = taskList.find((t: any) => {
        const title = t.title || t.task || '';
        const type = (t.todo_type || t.type || '').toLowerCase();
        return type === 'enterprise_verification' || title === '完成企业认证' || 
          (title.includes('企业') && title.includes('认证'));
      });
      const profileTask = taskList.find((t: any) => {
        const title = t.title || t.task || '';
        const type = (t.todo_type || t.type || '').toLowerCase();
        return type === 'enterprise_profile' || title === '完善企业资料' || 
          (title.includes('企业') && title.includes('资料'));
      });
      
      const certCompleted = certTask?.status?.toLowerCase() === 'completed';
      const profileCompleted = profileTask?.status?.toLowerCase() === 'completed';
      
      // 收集未完成的任务引导卡片
      const pendingGuides: string[] = [];
      if (!certCompleted) {
        pendingGuides.push('[[TASK:完成企业认证:enterprise_verification:🏢]]');
      }
      if (!profileCompleted && profileTask) {
        pendingGuides.push('[[TASK:完善企业资料:enterprise_profile:📋]]');
      }
      
      if (pendingGuides.length > 0) {
        return `👋 **${userName}，欢迎使用 Devnors！**\n\n我是您的 AI 招聘助手，建议您先完成以下任务：\n\n${pendingGuides.join('\n\n')}\n\n或直接告诉我您的招聘需求~`;
      }
      
      return `${userName}您好！我是您的 AI 招聘助手 🏢\n\n我可以帮您：\n• 搜索筛选候选人\n• 分析人才市场\n• 优化职位描述\n• 制定招聘策略\n\n有什么招聘需求？`;
    } else {
      // 求职者：根据任务完成状态动态引导
      const resumeTask = taskList.find((t: any) => {
        const title = t.title || t.task || '';
        const type = (t.todo_type || t.type || '').toLowerCase();
        return type === 'profile_complete' || title === '完善简历资料' || 
          (title.includes('简历') && title.includes('资料'));
      });
      const personalCertTask = taskList.find((t: any) => {
        const title = t.title || t.task || '';
        const type = (t.todo_type || t.type || '').toLowerCase();
        return type === 'personal_verification' || title === '完善个人认证信息' || 
          (title.includes('个人') && title.includes('认证'));
      });
      
      const resumeCompleted = resumeTask?.status?.toLowerCase() === 'completed';
      const certCompleted = personalCertTask?.status?.toLowerCase() === 'completed';
      
      const pendingGuides: string[] = [];
      if (!resumeCompleted && (resumeTask || isNewUser)) {
        pendingGuides.push('[[TASK:完善简历资料:profile_complete:📝]]');
      }
      if (!certCompleted && personalCertTask) {
        pendingGuides.push('[[TASK:完善个人认证信息:personal_verification:🔐]]');
      }
      
      if (pendingGuides.length > 0) {
        return `👋 **${userName}，欢迎使用 Devnors！**\n\n我是您的 AI 求职助手，建议您先完成以下任务：\n\n${pendingGuides.join('\n\n')}\n\n或直接告诉我您的目标职位和核心技能~`;
      }
      
      return `${userName}您好！我是您的 AI 求职助手 💼\n\n我可以帮您：\n• 匹配合适职位\n• 优化简历内容\n• 准备面试问题\n• 职业发展规划\n\n今天想了解什么？`;
    }
  };
  
  // 对话持久化的 localStorage keys
  const GENERAL_MESSAGES_KEY = `devnors_general_messages_${userId || 'guest'}`;
  const TASK_MESSAGES_KEY = `devnors_task_messages_${userId || 'guest'}`;
  
  // 从 localStorage 加载对话
  const loadSavedMessages = () => {
    try {
      const savedGeneral = localStorage.getItem(GENERAL_MESSAGES_KEY);
      if (savedGeneral) {
        return JSON.parse(savedGeneral);
      }
    } catch (e) {
      console.error('加载对话历史失败:', e);
    }
    return [{role: 'assistant' as const, content: getWelcomeMessage()}];
  };
  
  const loadSavedTaskMessages = () => {
    try {
      const savedTasks = localStorage.getItem(TASK_MESSAGES_KEY);
      if (savedTasks) {
        return JSON.parse(savedTasks);
      }
    } catch (e) {
      console.error('加载任务对话历史失败:', e);
    }
    return {};
  };
  
  // 通用对话消息
  const [generalMessages, setGeneralMessages] = useState<{role: 'user' | 'assistant', content: string}[]>(loadSavedMessages);
  
  // 任务专属对话消息（按任务ID存储）
  const [taskMessages, setTaskMessages] = useState<Record<number, {role: 'user' | 'assistant', content: string}[]>>(loadSavedTaskMessages);
  
  // 保存对话到 localStorage
  useEffect(() => {
    if (userId) {
      try {
        localStorage.setItem(GENERAL_MESSAGES_KEY, JSON.stringify(generalMessages));
      } catch (e) {
        console.error('保存对话失败:', e);
      }
    }
  }, [generalMessages, userId, GENERAL_MESSAGES_KEY]);
  
  useEffect(() => {
    if (userId) {
      try {
        localStorage.setItem(TASK_MESSAGES_KEY, JSON.stringify(taskMessages));
      } catch (e) {
        console.error('保存任务对话失败:', e);
      }
    }
  }, [taskMessages, userId, TASK_MESSAGES_KEY]);
  
  // 当用户身份变化时，重新加载对话或显示欢迎消息
  useEffect(() => {
    const savedMessages = loadSavedMessages();
    // 如果没有保存的对话（只有一条默认欢迎消息），则显示新的欢迎消息
    if (savedMessages.length <= 1) {
      setGeneralMessages([{role: 'assistant', content: getWelcomeMessage()}]);
    } else {
      setGeneralMessages(savedMessages);
    }
    setTaskMessages(loadSavedTaskMessages());
  }, [userId, isLoggedIn, userRole]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Devnors 1.0');
  
  // 使用当前登录用户的 ID 获取任务数据
  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useTasks(userId || 0);
  const tasks = userId ? tasksData : [];

  // 当用户资料或任务数据加载完成后，动态更新欢迎消息（第一条消息）
  useEffect(() => {
    if (!profileLoading && isLoggedIn && !tasksLoading && tasks) {
      const newWelcome = getWelcomeMessage(tasks);
      setGeneralMessages(prev => {
        if (prev.length === 0) {
          return [{role: 'assistant', content: newWelcome}];
        }
        // 始终更新第一条消息（欢迎消息）为最新的动态内容
        if (prev[0]?.role === 'assistant' && prev[0].content !== newWelcome) {
          const updated = [...prev];
          updated[0] = {role: 'assistant', content: newWelcome};
          return updated;
        }
        return prev;
      });
    }
  }, [profileLoading, isNewUser, isLoggedIn, tasksLoading, tasks]);
  
  // 按角色过滤的任务列表（用于统计）
  const roleFilteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return tasks.filter((task: any) => {
      const taskType = (task.todo_type || task.type || '').toUpperCase();
      
      // 按用户角色过滤任务类型
      if (userRole === 'employer' || userRole === 'recruiter') {
        // 企业/招聘者只看EMPLOYER类型和SYSTEM类型任务
        if (taskType === 'CANDIDATE') return false;
      } else if (userRole === 'candidate') {
        // 求职者只看CANDIDATE类型和SYSTEM类型任务
        if (taskType === 'EMPLOYER') return false;
      }
      return true;
    });
  }, [tasks, userRole]);
  
  // 进行中和已完成任务计数（按角色过滤后统计）
  const pendingTasksCount = useMemo(() => 
    roleFilteredTasks.filter((t: any) => t.status?.toLowerCase() !== 'completed').length
  , [roleFilteredTasks]);
  
  const completedTasksCount = useMemo(() => 
    roleFilteredTasks.filter((t: any) => t.status?.toLowerCase() === 'completed').length
  , [roleFilteredTasks]);
  
  // 过滤后的任务列表（按角色和状态过滤）
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'completed') {
      return roleFilteredTasks.filter((t: any) => t.status?.toLowerCase() === 'completed');
    } else {
      return roleFilteredTasks.filter((t: any) => t.status?.toLowerCase() !== 'completed');
    }
  }, [roleFilteredTasks, taskFilter]);
  
  const modelOptions = ['Devnors 1.0', 'Devnors 1.0 Pro', 'Devnors 1.0 Ultra'];
  
  // 处理 URL 参数中的任务 ID
  useEffect(() => {
    if (taskIdFromUrl && tasks.length > 0 && !initialTaskLoaded) {
      const task = tasks.find((t: any) => String(t.id) === taskIdFromUrl);
      if (task) {
        setSelectedTask(task);
        setInitialTaskLoaded(true);
        navigate('/ai-assistant', { replace: true });
      }
    }
  }, [taskIdFromUrl, tasks, initialTaskLoaded, navigate]);
  
  // 当 tasks 更新时，同步更新 selectedTask（确保进度条显示最新数据）
  useEffect(() => {
    if (selectedTask && tasks.length > 0) {
      const updatedTask = tasks.find((t: any) => t.id === selectedTask.id);
      if (updatedTask && (updatedTask.progress !== selectedTask.progress || updatedTask.status !== selectedTask.status)) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);
  
  // 处理编辑模式 URL 参数
  useEffect(() => {
    if (editTypeFromUrl && editFieldFromUrl) {
      const fieldKey = `${editTypeFromUrl}_${editFieldFromUrl}`;
      const config = EDIT_FIELD_CONFIG[fieldKey];
      
      if (config) {
        setEditMode({
          active: true,
          type: editTypeFromUrl,
          field: editFieldFromUrl,
          id: editIdFromUrl || undefined,
          awaitingInput: true
        });
        
        // 添加编辑引导消息
        const editMessage = `📝 **编辑${config.label}**\n\n${config.prompt}${config.examples ? `\n\n💡 示例：\n${config.examples.map(e => `• ${e}`).join('\n')}` : ''}`;
        setGeneralMessages([{role: 'assistant', content: editMessage}]);
        
        // 清除 URL 参数
        navigate('/ai-assistant', { replace: true });
      }
    }
  }, [editTypeFromUrl, editFieldFromUrl, editIdFromUrl, navigate]);
  
  // 检查用户简历完善度的状态
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileCheckTask, setProfileCheckTask] = useState<any>(null);
  
  // 检查用户简历完善度并创建任务
  const checkProfileCompleteness = async () => {
    if (!isLoggedIn || !userId || userRole !== 'candidate' || profileChecked) return;
    
    // 等待任务列表加载完成
    if (tasksLoading) return;
    
    setProfileChecked(true);
    
    try {
      // 先从 API 获取最新的任务列表，确保检查准确
      const { getTasks, getUserProfile } = await import('./services/apiService');
      const latestTasks = await getTasks(userId);
      
      // 检查是否已存在「完善简历资料」任务
      const existingTask = latestTasks.find((t: any) => 
        t.todo_type === 'profile_complete' || 
        t.title === '完善简历资料' ||
        (t.title && t.title.includes('完善') && (t.title.includes('简历') || t.title.includes('资料')))
      );
      
      if (existingTask) {
        // 已存在任务，不再检查和创建
        setProfileCheckTask(existingTask);
        return false;
      }
      
      // 获取用户资料
      const profile = await getUserProfile(userId, 'candidate');
      
      // 检查必填字段
      const missingFields: string[] = [];
      const fieldLabels: Record<string, string> = {
        display_name: '姓名',
        title: '职位头衔',
        summary: '个人简介',
        skills: '技能特长',
        experience: '工作经历',
        projects: '项目经历',
        education: '教育背景',
        expected_salary: '期望薪资',
        expected_location: '期望工作地点',
      };
      
      // 基础字段检查
      if (!profile?.display_name || profile.display_name.trim() === '') {
        missingFields.push('display_name');
      }
      if (!profile?.title || profile.title.trim() === '') {
        missingFields.push('title');
      }
      if (!profile?.summary || profile.summary.trim() === '' || profile.summary.length < 20) {
        missingFields.push('summary');
      }
      
      // 检查 candidate_data 中的字段
      const candidateData = profile?.candidate_data || {};
      if (!candidateData.skills || (Array.isArray(candidateData.skills) && candidateData.skills.length === 0)) {
        missingFields.push('skills');
      }
      if (!candidateData.experience || (Array.isArray(candidateData.experience) && candidateData.experience.length === 0)) {
        missingFields.push('experience');
      }
      if (!candidateData.projects || (Array.isArray(candidateData.projects) && candidateData.projects.length === 0)) {
        missingFields.push('projects');
      }
      if (!candidateData.education || (Array.isArray(candidateData.education) && candidateData.education.length === 0)) {
        missingFields.push('education');
      }
      if (!candidateData.expected_salary) {
        missingFields.push('expected_salary');
      }
      if (!candidateData.expected_location) {
        missingFields.push('expected_location');
      }
      
      // 如果有缺失字段，创建任务并提示
      if (missingFields.length > 0) {
        const missingLabels = missingFields.map(f => fieldLabels[f] || f);
        const completenessPercent = Math.round(((9 - missingFields.length) / 9) * 100);
        
        // 创建新任务（前面已确认不存在重复任务）
        const { createTodo } = await import('./services/apiService');
        const taskData = {
          title: '完善简历资料',
          description: `您的简历还需完善以下信息：${missingLabels.join('、')}`,
          priority: 'high',
          source: 'agent',  // Agent 创建的任务
          todo_type: 'profile_complete',
          ai_advice: `完善简历信息可以大幅提升您的求职匹配度。建议您尽快补充：${missingLabels.join('、')}。`,
          steps: missingFields.map((field, index) => ({
            order: index + 1,
            title: `填写${fieldLabels[field] || field}`,
            status: 'pending'
          }))
        };
        
        const newTask = await createTodo(taskData, userId);
        setProfileCheckTask(newTask);
        
        // 如果是新用户，欢迎消息已经包含任务卡片，不再重复发送提示
        // 只有非新用户（已有部分资料但不完整）才发送提示消息
        if (!isNewUser) {
          const promptMessage = `⚠️ **简历待完善** (${completenessPercent}%)\n\n缺失信息：${missingLabels.join('、')}\n\n[[TASK:完善简历资料:profile_complete:📝]]`;
          
          setGeneralMessages(prev => [...prev, {role: 'assistant', content: promptMessage}]);
        }
        
        // 刷新任务列表
        if (typeof refetchTasks === 'function') {
          refetchTasks();
        }
        
        return true; // 返回 true 表示有未完善的字段
      }
      
      return false;
    } catch (error) {
      console.error('检查简历完善度失败:', error);
      return false;
    }
  };
  
  // 处理求职申请模式 URL 参数
  useEffect(() => {
    if (taskTypeFromUrl === 'apply') {
      setApplyMode({
        active: true,
        step: 'resume',
        resumeText: '',
        analysisResult: null
      });
      
      // 先检查简历完善度
      checkProfileCompleteness().then((hasIncomplete) => {
        if (!hasIncomplete) {
          // 如果简历已完善，显示正常的求职申请引导消息
          const applyMessage = `🚀 **开始求职申请**\n\n欢迎使用 AI 智能求职助手！我将帮您完成以下任务：\n\n**第一步：上传简历**\n\n📎 **方式一：点击左下角 📎 按钮上传简历文件**\n支持 PDF、Word (.doc/.docx)、文本文件 (.txt/.md)\n\n📝 **方式二：直接粘贴简历内容**\n将简历文本粘贴到输入框中\n\n💡 提示：\n• 上传后 AI 将自动解析并提取关键信息\n• 或者描述您的核心技能和工作经历\n• AI 将智能优化展示效果`;
          setGeneralMessages([{role: 'assistant', content: applyMessage}]);
        }
      });
      
      // 清除 URL 参数
      navigate('/ai-assistant', { replace: true });
    }
  }, [taskTypeFromUrl, navigate]);
  
  // 求职者进入 AI 助手页面时自动检查简历完善度
  useEffect(() => {
    if (isLoggedIn && userRole === 'candidate' && !taskTypeFromUrl && !profileChecked && !tasksLoading) {
      // 延迟检查，确保任务列表已加载
      const timer = setTimeout(() => {
        checkProfileCompleteness();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, userRole, taskTypeFromUrl, profileChecked, tasksLoading]);
  
  // 招聘方检查企业认证状态
  const [enterpriseChecked, setEnterpriseChecked] = useState(false);
  useEffect(() => {
    const checkEnterpriseVerification = async () => {
      if (!isLoggedIn || !userId || userRole !== 'employer' || enterpriseChecked || tasksLoading) return;
      
      setEnterpriseChecked(true);
      
      try {
        const { getTasks, createTodo, getEnterpriseCertifications } = await import('./services/apiService');
        const latestTasks = await getTasks(userId);
        
        // 检查是否已存在「完成企业认证」任务
        const existingTask = latestTasks.find((t: any) => 
          t.todo_type?.toUpperCase() === 'EMPLOYER' && t.title?.includes('企业认证') ||
          t.title === '完成企业认证'
        );
        
        if (existingTask) {
          console.log('[Enterprise] 已存在企业认证任务');
          return;
        }
        
        // 检查企业认证状态
        const certifications = await getEnterpriseCertifications(userId);
        const hasBusinessLicense = certifications.some((c: any) => 
          c.category === 'qualification' && c.name?.includes('营业执照')
        );
        
        // 如果没有营业执照认证，创建企业认证任务
        if (!hasBusinessLicense) {
          const taskData = {
            title: '完成企业认证',
            description: '完成营业执照、资质认证等企业认证，提升招聘效果和可信度',
            priority: 'HIGH',
            source: 'AGENT',
            todo_type: 'EMPLOYER',
            icon: 'Building2',
            user_id: userId,
          };
          
          const newTask = await createTodo(taskData, userId);
          console.log('[Enterprise] 创建企业认证任务:', newTask);
          
          if (typeof refetchTasks === 'function') {
            refetchTasks();
          }
        }
      } catch (error) {
        console.error('检查企业认证状态失败:', error);
      }
    };
    
    if (isLoggedIn && userRole === 'employer' && !enterpriseChecked && !tasksLoading) {
      const timer = setTimeout(checkEnterpriseVerification, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, userRole, userId, enterpriseChecked, tasksLoading]);
  
  // 组件加载时清理重复的「完善简历资料」任务
  const [duplicatesCleanedUp, setDuplicatesCleanedUp] = useState(false);
  useEffect(() => {
    const cleanupDuplicates = async () => {
      if (!isLoggedIn || !userId || duplicatesCleanedUp) return;
      
      try {
        const { cleanupDuplicateProfileTasks } = await import('./services/apiService');
        const result = await cleanupDuplicateProfileTasks(userId);
        if (result.deleted_count > 0) {
          console.log(`已清理 ${result.deleted_count} 个重复的「完善简历资料」任务`);
        }
        setDuplicatesCleanedUp(true);
      } catch (error) {
        console.error('清理重复任务失败:', error);
      }
    };
    
    // 延迟执行，确保任务列表已加载
    const timer = setTimeout(cleanupDuplicates, 500);
    return () => clearTimeout(timer);
  }, [isLoggedIn, userId, duplicatesCleanedUp]);
  
  // 处理求职申请流程
  const handleApplyProcess = async (userInput: string) => {
    if (applyMode.step === 'resume') {
      // 用户提交了简历
      setApplyMode(prev => ({ ...prev, resumeText: userInput, step: 'analyze' }));
      setGeneralMessages(prev => [...prev, {role: 'user', content: userInput}]);
      setIsTyping(true);
      
      // 模拟 AI 分析简历
      setTimeout(async () => {
        const analysisResult = `📊 **简历分析完成！**\n\n**核心技能识别：**\n${userInput.includes('React') || userInput.includes('前端') ? '• 前端开发 (React/Vue)' : '• 软件开发'}\n${userInput.includes('Python') || userInput.includes('后端') ? '• 后端开发 (Python/Java)' : ''}\n${userInput.includes('AI') || userInput.includes('机器学习') ? '• AI/机器学习' : ''}\n\n**职业画像生成中...**\n\n我已将您的简历信息保存到职业画像中。接下来，您想要：\n\n1️⃣ 查看推荐职位\n2️⃣ 优化简历内容\n3️⃣ 准备面试问题\n\n请输入数字或直接描述您的需求。`;
        
        // 保存到 Memory
        try {
          await createMemory({
            type: 'experience',
            content: userInput.substring(0, 500),
            importance: 'High',
            scope: 'candidate'
          }, userId);
          refetchMemories();
        } catch (e) {
          console.error('保存简历记忆失败', e);
        }
        
        setGeneralMessages(prev => [...prev, {role: 'assistant', content: analysisResult}]);
        setApplyMode(prev => ({ ...prev, step: 'match', analysisResult }));
        setIsTyping(false);
      }, 2000);
      
      return true;
    }
    
    if (applyMode.step === 'match') {
      // 用户选择后续操作
      setGeneralMessages(prev => [...prev, {role: 'user', content: userInput}]);
      setIsTyping(true);
      
      setTimeout(() => {
        let response = '';
        if (userInput.includes('1') || userInput.includes('推荐') || userInput.includes('职位')) {
          response = `🎯 **为您推荐以下职位：**\n\n**1. 高级前端工程师 - 字节跳动**\n• 匹配度：92%\n• 薪资：40-60K\n• 技能契合：React, TypeScript, 性能优化\n\n**2. 全栈工程师 - 阿里巴巴**\n• 匹配度：88%\n• 薪资：45-70K\n• 技能契合：Node.js, React, 微服务\n\n**3. AI 应用开发工程师 - 商汤科技**\n• 匹配度：85%\n• 薪资：50-80K\n• 技能契合：Python, 深度学习, Web开发\n\n💡 点击职位名称可查看详情，或告诉我您想了解哪个职位。`;
        } else if (userInput.includes('2') || userInput.includes('优化') || userInput.includes('简历')) {
          response = `✨ **简历优化建议：**\n\n**1. 项目经历优化**\n• 使用 STAR 法则描述项目\n• 量化成果（提升 XX%、节省 XX 时间）\n\n**2. 技能展示优化**\n• 按熟练度分级展示技能\n• 突出与目标职位匹配的技能\n\n**3. 个人亮点**\n• 添加技术博客或开源项目链接\n• 展示持续学习能力\n\n需要我帮您重写某个部分吗？`;
        } else if (userInput.includes('3') || userInput.includes('面试')) {
          response = `📝 **面试准备清单：**\n\n**技术面试常见问题：**\n1. 请介绍一个你最有挑战性的项目\n2. 如何进行前端性能优化？\n3. 描述一次你解决复杂问题的经历\n\n**行为面试常见问题：**\n1. 为什么选择我们公司？\n2. 你的职业规划是什么？\n3. 如何处理工作中的冲突？\n\n需要我为您进行模拟面试吗？输入"开始模拟"即可开始。`;
        } else {
          response = `好的，我来帮您处理：${userInput}\n\n请稍等，正在为您分析...`;
        }
        
        setGeneralMessages(prev => [...prev, {role: 'assistant', content: response}]);
        setIsTyping(false);
      }, 1500);
      
      return true;
    }
    
    return false;
  };
  
  // 处理招聘发布模式 URL 参数
  useEffect(() => {
    if (taskTypeFromUrl === 'post') {
      // 先做前置检查
      const checkAndStartPost = async () => {
        try {
          const { getEnterpriseCertifications, getSettings, getTasks } = await import('./services/apiService');
          const [certifications, settingsData, tasks] = await Promise.all([
            getEnterpriseCertifications(userId).catch(() => []),
            getSettings(userId).catch(() => ({})),
            getTasks(userId).catch(() => []),
          ]);
          
          const hasBusinessLicense = certifications.some((c: any) => c.category === 'qualification' && c.name?.includes('营业执照'));
          const certTask = tasks.find((t: any) => t.title === '完成企业认证' || (t.title?.includes('企业') && t.title?.includes('认证')));
          const certCompleted = hasBusinessLicense || certTask?.status?.toLowerCase() === 'completed';
          
          const requiredFields = ['display_name', 'industry', 'company_size', 'detail_address', 'description'];
          const hasValue = (val: any) => val && typeof val === 'string' ? val.trim() !== '' && val.trim() !== '[]' && val.trim() !== '{}' : !!val;
          const missingFields = requiredFields.filter(k => !hasValue(settingsData[k]));
          const profileCompleted = missingFields.length === 0;
          
          if (!certCompleted || !profileCompleted) {
            // 未满足前置条件，给出引导
            const issues: string[] = [];
            if (!certCompleted) issues.push('• **企业认证未完成** — 请先前往 [企业认证信息](/settings?tab=Verification) 完成认证');
            if (!profileCompleted) issues.push('• **企业资料未完善** — 请先前往 [完善企业资料](/ai-assistant?task=enterprise_profile) 补充信息');
            
            setGeneralMessages([{role: 'assistant', content: `⚠️ **暂时无法开启招聘**\n\n为了保障招聘质量和企业可信度，开启招聘前需要完成以下准备：\n\n${issues.join('\n\n')}\n\n完成后再来找我，即可开始智能招聘！`}]);
            navigate('/ai-assistant', { replace: true });
            return;
          }
          
          // 前置条件满足，创建招聘任务并开启引导
          // 创建招聘任务（如果不存在）
          try {
            const { createTodo } = await import('./services/apiService');
            const existingRecruitTask = tasks.find((t: any) => 
              (t.todo_type?.toUpperCase() === 'RECRUIT' || t.title?.includes('智能招聘')) &&
              (t.status?.toUpperCase() === 'PENDING' || t.status?.toUpperCase() === 'RUNNING' || t.status?.toUpperCase() === 'IN_PROGRESS')
            );
            if (!existingRecruitTask) {
              const taskShortId = `RC${Date.now().toString().slice(-6)}`;
              await createTodo({
                title: `智能招聘 #${taskShortId}`,
                description: 'AI 智能招聘助手 — 描述您的招聘需求，AI 自动生成岗位并发布',
                priority: 'HIGH',
                source: 'AGENT',
                todo_type: 'RECRUIT',
                ai_advice: '告诉 AI 助手您的招聘需求，AI 将为您自动生成专业岗位描述并一键发布。',
                steps: [
                  { step: 1, title: '描述招聘需求', status: 'pending' },
                  { step: 2, title: 'AI 生成岗位', status: 'pending' },
                  { step: 3, title: '确认并发布', status: 'pending' },
                ],
              }, userId);
            }
          } catch (e) {
            console.error('创建招聘任务失败:', e);
          }
          
          setPostMode({
            active: true,
            step: 'requirement',
            jobDescription: '',
            generatedResult: null
          });
          
          const companyName = settingsData.display_name || settingsData.short_name || user?.company_name || '贵公司';
          const postMessage = `🏢 **${companyName}，欢迎使用 AI 智能招聘助手！**\n\n✅ 企业认证已通过 · ✅ 企业资料已完善\n📋 已创建「智能招聘」任务，可在任务中心查看进度\n\n---\n\n**第一步：描述您的招聘需求**\n\n请告诉我您想招什么人，支持以下方式：\n\n**简单描述**\n> "招3个前端，2个后端，薪资20-40K"\n\n**详细描述**\n> "招聘高级前端工程师，需要3年以上React经验，负责核心产品开发"\n\n**批量描述**\n> "技术团队扩招，需要前端、后端、产品经理各1人"\n\n**第二步：** AI 自动生成专业岗位描述\n**第三步：** 确认后一键发布，开始智能匹配\n\n💡 描述越详细，生成的岗位越精准！`;
          setGeneralMessages([{role: 'assistant', content: postMessage}]);
        } catch (e) {
          console.error('检查招聘前置条件失败:', e);
          setGeneralMessages([{role: 'assistant', content: '⚠️ 检查招聘资质时出现异常，请稍后重试。'}]);
        }
        navigate('/ai-assistant', { replace: true });
      };
      
      checkAndStartPost();
    }
  }, [taskTypeFromUrl, navigate]);
  
  // 招聘流程消息辅助函数
  const addPostMsg = (content: string, role: 'user' | 'assistant' = 'assistant') => {
    if (selectedTask) {
      setTaskMessages(prev => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] || []), { role, content }]
      }));
    } else {
      setGeneralMessages(prev => [...prev, { role, content }]);
    }
  };

  // 处理招聘发布流程
  const handlePostProcess = async (userInput: string) => {
    if (postMode.step === 'requirement') {
      // 用户提交了招聘需求
      setPostMode(prev => ({ ...prev, jobDescription: userInput, step: 'generate' }));
      addPostMsg(userInput, 'user');
      setIsTyping(true);
      
      addPostMsg('🤖 正在分析您的招聘需求，根据企业信息智能生成岗位计划...');
      
      try {
        // 获取企业信息用于 AI 上下文
        const { getSettings } = await import('./services/apiService');
        const settingsData = await getSettings(userId).catch(() => ({}));
        const companyName = settingsData.display_name || settingsData.short_name || user?.company_name || '';
        const industry = settingsData.industry || '';
        const companySize = settingsData.company_size || '';
        const location = settingsData.detail_address || '';
        const benefits = settingsData.benefits || '';
        
        // 用 AI 生成职位描述
        const aiPrompt = `你是一个专业的HR招聘助手。用户只是简单描述了招聘需求，你需要根据企业信息和行业特点，"脑补"完善，生成完整专业的岗位信息。

企业信息：
- 企业名称：${companyName}
- 所属行业：${industry}
- 企业规模：${companySize}
- 工作地点：${location}
- 企业福利：${benefits}

用户的大致需求：${userInput}

请严格按照以下JSON格式返回（直接返回JSON数组，不要包含markdown代码块标记）：
[
  {
    "title": "职位名称（专业、有吸引力）",
    "location": "工作地点",
    "description": "完整的岗位描述，包含【岗位职责】和【任职要求】和【加分项】三个部分，每个部分3-5条，用markdown格式",
    "salary_min": 最低薪资（单位：千元/月，数字类型，根据行业和岗位合理估算），
    "salary_max": 最高薪资（单位：千元/月，数字类型），
    "tags": ["标签1", "标签2", "标签3", "标签4"]
  }
]

要求：
1. 用户只简单说"招前端"，你要脑补成完整的岗位描述，包含合理的技术栈、经验要求、学历要求等
2. 如果用户提到多个岗位，生成多个对象
3. 薪资根据行业和岗位级别合理估算
4. description要专业、完整、有吸引力，体现企业特色
5. tags包含技术栈、经验要求、学历、工作方式等关键标签
6. 直接返回JSON，不要有其他文字`;
        
        const aiResult = await chatWithAI({
          message: aiPrompt,
          context: 'job_generation',
        });
        
        // 解析 AI 返回的职位数据
        let jobs: any[] = [];
        try {
          let responseText = aiResult.response || '';
          responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          jobs = JSON.parse(responseText);
          if (!Array.isArray(jobs)) jobs = [jobs];
        } catch (parseErr) {
          console.error('AI 返回解析失败:', parseErr);
          const titleGuess = userInput.includes('前端') ? '前端工程师' : 
                             userInput.includes('后端') ? '后端工程师' : 
                             userInput.includes('产品') ? '产品经理' :
                             userInput.includes('设计') ? 'UI/UX 设计师' :
                             userInput.includes('运营') ? '运营经理' : 'AI 应用工程师';
          jobs = [{
            title: titleGuess,
            location: location || '不限',
            description: `**岗位职责：**\n• 负责核心产品功能开发与优化\n• 参与技术方案设计与评审\n• 推动项目落地并持续迭代\n\n**任职要求：**\n• 本科及以上学历\n• 3年以上相关开发经验\n• 良好的沟通能力和团队协作精神`,
            salary_min: 15, salary_max: 35,
            tags: ['3年以上经验', '本科', titleGuess]
          }];
        }
        
        // 保存到 Memory
        try {
          await createMemory({ type: 'requirement', content: `招聘需求：${userInput.substring(0, 500)}`, importance: 'High', scope: 'employer' }, userId);
          refetchMemories();
        } catch (e) { console.error('保存招聘需求记忆失败', e); }
        
        // 生成岗位摘要给用户确认
        const jobsSummary = jobs.map((job: any, i: number) => {
          return `### 岗位 ${i + 1}：${job.title}\n\n📍 **地点：** ${job.location || '不限'} · 💰 **薪资：** ${job.salary_min || '面议'}K-${job.salary_max || '面议'}K/月\n\n${job.description}\n\n🏷️ ${(job.tags || []).join(' · ')}`;
        }).join('\n\n---\n\n');
        
        const generatedResult = `📋 **根据您的需求，我为您拟定了以下 ${jobs.length} 个岗位招聘计划：**\n\n${jobsSummary}\n\n---\n\n⬆️ 以上是我根据您的需求和企业信息生成的岗位描述，请您确认：\n\n✅ **没问题，直接发布** — 输入"发布"或"确认"\n✏️ **需要修改** — 直接告诉我要改什么，例如"薪资改高一点"、"加上远程办公"、"删掉第二个岗位"\n➕ **还要加岗位** — 继续描述新的招聘需求`;
        
        // 移除之前的"正在分析"消息，替换为结果
        if (selectedTask) {
          setTaskMessages(prev => {
            const msgs = prev[selectedTask.id] || [];
            const filtered = msgs.filter(m => !m.content.includes('正在分析您的招聘需求'));
            return { ...prev, [selectedTask.id]: [...filtered, { role: 'assistant', content: generatedResult }] };
          });
        } else {
          setGeneralMessages(prev => {
            const filtered = prev.filter(m => !m.content.includes('正在分析您的招聘需求'));
            return [...filtered, { role: 'assistant', content: generatedResult }];
          });
        }
        
        setPostMode(prev => ({ ...prev, step: 'optimize', generatedResult, jobDescription: JSON.stringify(jobs) }));
        setIsTyping(false);
      } catch (err) {
        console.error('AI 生成岗位失败:', err);
        addPostMsg(`⚠️ 生成岗位时遇到问题，请稍后重试。\n\n错误信息：${(err as any)?.message || '未知错误'}`);
        setIsTyping(false);
      }
      
      return true;
    }
    
    if (postMode.step === 'optimize') {
      addPostMsg(userInput, 'user');
      setIsTyping(true);
      
      const handleOptimizeAction = async () => {
        try {
          // 判断用户是否确认发布
          const isConfirmPublish = /^(发布|确认|没问题|ok|OK|好的|可以|1|全部发布|直接发布|发吧)$/i.test(userInput.trim()) ||
            (userInput.includes('发布') && !userInput.includes('修改') && !userInput.includes('改') && userInput.length < 15) ||
            (userInput.includes('确认') && userInput.length < 10);
          
          if (isConfirmPublish) {
            // 用户确认发布
            let jobs: any[] = [];
            try { jobs = JSON.parse(postMode.jobDescription); } catch { jobs = []; }
            
            if (jobs.length === 0) {
              addPostMsg('⚠️ 未找到待发布的岗位数据，请重新描述您的招聘需求。');
              setPostMode(prev => ({ ...prev, step: 'requirement' }));
              setIsTyping(false);
              return;
            }
            
            addPostMsg(`⏳ 正在发布 ${jobs.length} 个岗位...`);
            
            const { createJob, updateTodo } = await import('./services/apiService');
            const companyName = user?.company_name || '未知企业';
            
            const publishResults: string[] = [];
            let successCount = 0;
            
            for (const job of jobs) {
              try {
                await createJob({
                  title: job.title,
                  company: companyName,
                  location: job.location || '不限',
                  description: job.description || '',
                  salary_min: job.salary_min ? job.salary_min * 1000 : undefined,
                  salary_max: job.salary_max ? job.salary_max * 1000 : undefined,
                  tags: job.tags || [],
                });
                successCount++;
                publishResults.push(`✅ **${job.title}** — 发布成功`);
              } catch (e) {
                publishResults.push(`❌ **${job.title}** — 发布失败: ${(e as any)?.message || '未知错误'}`);
              }
            }
            
            // 更新招聘任务状态为已完成
            if (selectedTask) {
              try {
                await updateTodo(selectedTask.id, { status: 'completed', progress: 100 });
                if (typeof refetchTasks === 'function') refetchTasks();
              } catch (e) { console.error('更新任务状态失败:', e); }
            }
            
            const response = `🎉 **岗位发布完成！**\n\n${publishResults.join('\n')}\n\n共 **${successCount}/${jobs.length}** 个岗位发布成功。\n\n---\n\n🎯 系统已开始为您智能匹配候选人，有合适的人才会第一时间通知您。\n\n您可以：\n• 前往 [职位管理](/employer/post) 查看已发布的岗位\n• 继续说"再招一个XX"快速添加新岗位`;
            
            // 移除"正在发布"消息
            if (selectedTask) {
              setTaskMessages(prev => {
                const msgs = prev[selectedTask.id] || [];
                const filtered = msgs.filter(m => !m.content.includes('正在发布'));
                return { ...prev, [selectedTask.id]: [...filtered, { role: 'assistant', content: response }] };
              });
            } else {
              setGeneralMessages(prev => {
                const filtered = prev.filter(m => !m.content.includes('正在发布'));
                return [...filtered, { role: 'assistant', content: response }];
              });
            }
            
            setPostMode({ active: false, step: 'requirement', jobDescription: '', generatedResult: null });
          } else {
            // 用户要修改 - 用 AI 根据用户反馈重新生成
            let currentJobs: any[] = [];
            try { currentJobs = JSON.parse(postMode.jobDescription); } catch { currentJobs = []; }
            
            addPostMsg('🤖 正在根据您的反馈修改岗位信息...');
            
            const modifyPrompt = `你是一个专业的HR招聘助手。以下是当前已生成的岗位信息：

${JSON.stringify(currentJobs, null, 2)}

用户的修改要求：${userInput}

请根据用户的修改要求，返回修改后的完整岗位列表。严格按照JSON数组格式返回（直接返回JSON，不要包含markdown代码块标记）：
[
  {
    "title": "职位名称",
    "location": "工作地点",
    "description": "完整的岗位描述",
    "salary_min": 数字,
    "salary_max": 数字,
    "tags": ["标签"]
  }
]

注意：
1. 只修改用户提到要改的部分，其他保持不变
2. 如果用户说删除某个岗位，就从列表中去掉
3. 如果用户说加岗位，就在列表中新增
4. 直接返回JSON，不要有其他文字`;
            
            try {
              const modifyResult = await chatWithAI({ message: modifyPrompt, context: 'job_modification' });
              
              let updatedJobs: any[] = [];
              try {
                let responseText = modifyResult.response || '';
                responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                updatedJobs = JSON.parse(responseText);
                if (!Array.isArray(updatedJobs)) updatedJobs = [updatedJobs];
              } catch {
                // 解析失败，保持原样
                updatedJobs = currentJobs;
              }
              
              const jobsSummary = updatedJobs.map((job: any, i: number) => {
                return `### 岗位 ${i + 1}：${job.title}\n\n📍 **地点：** ${job.location || '不限'} · 💰 **薪资：** ${job.salary_min || '面议'}K-${job.salary_max || '面议'}K/月\n\n${job.description}\n\n🏷️ ${(job.tags || []).join(' · ')}`;
              }).join('\n\n---\n\n');
              
              const updatedResult = `✏️ **已根据您的要求修改，请再次确认：**\n\n${jobsSummary}\n\n---\n\n✅ **没问题，直接发布** — 输入"发布"或"确认"\n✏️ **还需修改** — 继续告诉我要改什么`;
              
              // 移除"正在修改"消息
              if (selectedTask) {
                setTaskMessages(prev => {
                  const msgs = prev[selectedTask.id] || [];
                  const filtered = msgs.filter(m => !m.content.includes('正在根据您的反馈修改'));
                  return { ...prev, [selectedTask.id]: [...filtered, { role: 'assistant', content: updatedResult }] };
                });
              } else {
                setGeneralMessages(prev => {
                  const filtered = prev.filter(m => !m.content.includes('正在根据您的反馈修改'));
                  return [...filtered, { role: 'assistant', content: updatedResult }];
                });
              }
              
              setPostMode(prev => ({ ...prev, jobDescription: JSON.stringify(updatedJobs) }));
            } catch (err) {
              addPostMsg(`⚠️ 修改失败：${(err as any)?.message || '未知错误'}，请重试。`);
            }
          }
        } catch (err) {
          addPostMsg(`⚠️ 操作失败：${(err as any)?.message || '未知错误'}`);
        }
        setIsTyping(false);
      };
      
      handleOptimizeAction();
      return true;
    }
    
    return false;
  };
  
  // 处理邀请好友模式 URL 参数
  useEffect(() => {
    if (taskTypeFromUrl === 'invite') {
      const userInviteLink = `https://devnors.ai/register?ref=${user?.email?.split('@')[0] || 'user'}${userId}`;
      setInviteMode({
        active: true,
        step: 'intro',
        inviteLink: userInviteLink,
        inviteCount: 0
      });
      
      // 添加邀请好友引导消息
      const inviteMessage = `🎁 **邀请好友赚 Token**\n\n欢迎使用 Devnors 邀请奖励计划！\n\n**奖励规则：**\n• 每成功邀请 1 位好友注册，获得 **500 Token**\n• 好友完成首次使用，额外奖励 **200 Token**\n• 无上限，邀请越多，奖励越多！\n\n**您的专属邀请链接：**\n\`${userInviteLink}\`\n\n请输入以下操作：\n1️⃣ 复制邀请链接\n2️⃣ 查看邀请记录\n3️⃣ 了解更多奖励规则`;
      setGeneralMessages([{role: 'assistant', content: inviteMessage}]);
      
      // 清除 URL 参数
      navigate('/ai-assistant', { replace: true });
    }
  }, [taskTypeFromUrl, navigate, user, userId]);
  
  // 处理个人认证任务 URL 参数
  useEffect(() => {
    if (taskTypeFromUrl === 'personal_verification' && isLoggedIn && userId) {
      const handleVerificationTask = async () => {
        try {
          const { getTasks, createTodo } = await import('./services/apiService');
          
          // 检查是否已存在认证任务
          const existingTasks = await getTasks(userId);
          let verificationTask = existingTasks.find((t: any) => 
            t.todo_type === 'personal_verification' || 
            t.title === '完善个人认证信息' ||
            (t.title.includes('完善') && t.title.includes('认证'))
          );
          
          // 如果不存在则创建
          if (!verificationTask) {
            const verificationTaskData = {
              title: '完善个人认证信息',
              description: '完成身份认证、学历认证、技能认证、工作证明等，提升求职竞争力，增加面试机会',
              priority: 'high',
              source: 'agent',
              todo_type: 'personal_verification',
              ai_advice: '完成个人认证可以大幅提升您的可信度和求职成功率。建议优先完成身份认证和学历认证。',
              steps: [
                { order: 1, title: '完成身份认证', status: 'pending' },
                { order: 2, title: '完成学历认证', status: 'pending' },
                { order: 3, title: '完成技能认证', status: 'pending' },
                { order: 4, title: '完成工作证明', status: 'pending' },
                { order: 5, title: '完成征信认证', status: 'pending' }
              ]
            };
            
            verificationTask = await createTodo(verificationTaskData, userId);
            console.log('[Verification Task] 已创建个人认证任务');
            
            // 刷新任务列表
            if (typeof refetchTasks === 'function') {
              refetchTasks();
            }
          }
          
          // 选中该任务
          if (verificationTask) {
            setSelectedTask(verificationTask);
            
            // 启动认证模式
            setVerificationMode({
              active: true,
              items: verificationItems,
              currentIndex: 0,
              completedItems: []
            });
            
            // 添加欢迎消息，直接开始第一项认证
            const firstItem = verificationItems[0];
            const totalSteps = verificationItems.length;
            const welcomeMessage = `👋 **欢迎来到个人认证中心！**\n\n完成认证可以帮助您：\n✅ 提高简历可信度，增加 HR 信任\n✅ 获得"已认证"专属标识\n✅ 优先展示在推荐列表中\n✅ 增加 30% 以上的面试邀请机会\n\n---\n\n📋 **认证进度：** 0/${totalSteps} 项\n\n${firstItem.icon} **第 1 项：${firstItem.label}**\n\n${firstItem.description}`;
            
            setTaskMessages(prev => ({
              ...prev,
              [verificationTask.id]: [{ role: 'assistant', content: welcomeMessage }]
            }));
          }
          
        } catch (error) {
          console.error('处理认证任务失败:', error);
        }
        
        // 清除 URL 参数
        navigate('/ai-assistant', { replace: true });
      };
      
      handleVerificationTask();
    }
  }, [taskTypeFromUrl, isLoggedIn, userId, navigate, refetchTasks]);
  
  // 处理邀请好友流程
  const handleInviteProcess = async (userInput: string) => {
    if (inviteMode.active) {
      setGeneralMessages(prev => [...prev, {role: 'user', content: userInput}]);
      setIsTyping(true);
      
      setTimeout(() => {
        let response = '';
        if (userInput.includes('1') || userInput.includes('复制') || userInput.includes('链接')) {
          response = `📋 **邀请链接已准备好！**\n\n您的专属邀请链接：\n\`${inviteMode.inviteLink}\`\n\n**分享方式：**\n• 直接发送链接给好友\n• 分享到社交媒体\n• 发送邮件邀请\n\n💡 小贴士：告诉好友 Devnors 可以帮助他们：\n• 智能匹配理想职位\n• AI 优化简历\n• 模拟面试准备\n\n好友通过链接注册后，您将立即获得 500 Token 奖励！`;
        } else if (userInput.includes('2') || userInput.includes('记录') || userInput.includes('查看')) {
          response = `📊 **邀请记录**\n\n**本月邀请统计：**\n• 已邀请：${inviteMode.inviteCount} 人\n• 已获得 Token：${inviteMode.inviteCount * 500}\n• 待发放奖励：0 Token\n\n**邀请明细：**\n${inviteMode.inviteCount === 0 ? '暂无邀请记录，快去分享您的邀请链接吧！' : '• 用户 A*** - 已注册 - +500 Token'}\n\n继续邀请好友，赚取更多 Token！`;
        } else if (userInput.includes('3') || userInput.includes('规则') || userInput.includes('了解')) {
          response = `📜 **奖励规则详情**\n\n**基础奖励：**\n• 好友注册成功：+500 Token\n• 好友首次使用 AI 功能：+200 Token\n\n**额外奖励：**\n• 邀请满 5 人：额外 +1000 Token\n• 邀请满 10 人：额外 +3000 Token\n• 邀请满 20 人：额外 +8000 Token\n\n**注意事项：**\n• 奖励将在好友完成注册后 24 小时内发放\n• 同一设备/IP 仅计算一次有效邀请\n• 奖励 Token 可用于平台所有 AI 功能\n\n有其他问题吗？`;
        } else {
          response = `我理解您说的是："${userInput}"\n\n关于邀请好友，我可以帮您：\n1️⃣ 复制邀请链接\n2️⃣ 查看邀请记录\n3️⃣ 了解更多奖励规则\n\n请输入对应数字或描述您的需求。`;
        }
        
        setGeneralMessages(prev => [...prev, {role: 'assistant', content: response}]);
        setIsTyping(false);
      }, 1000);
      
      return true;
    }
    
    return false;
  };
  
  // 保存编辑的数据
  const saveEditData = async (fieldKey: string, value: string) => {
    const [type, field] = fieldKey.split('_');
    
    try {
      // 根据类型保存到不同的地方
      if (type === 'candidate' || type === 'employer') {
        const profileType = type as 'candidate' | 'employer';
        
        // 只有关键字段才保存到 Memory（避免重复保存所有字段）
        const memoryFields = ['experience', 'skills', 'education', 'projects', 'requirement', 'tech', 'culture', 'benefit'];
        const memoryType = field.toLowerCase();
        const memoryScope = type === 'employer' ? 'employer' : 'candidate';
        
        if (memoryFields.includes(memoryType)) {
          try {
            console.log('Saving memory:', { type: memoryType, content: value, importance: 'High', scope: memoryScope, userId });
            await createMemory({
              type: memoryType,
              content: value,
              importance: 'High',
              scope: memoryScope
            }, userId);
            refetchMemories();
          } catch (memErr) {
            console.log('Memory 保存跳过（可能重复）:', memErr);
          }
        }
        
        // 保存到 Profile API (用于 Profile 页面显示)
        try {
          const { updateProfileField } = await import('./services/apiService');
          await updateProfileField(userId, profileType, field, value, true); // 编辑模式强制覆盖
          console.log('Profile field updated:', { field, value, profileType });
        } catch (profileErr) {
          console.log('Profile API update failed (non-critical):', profileErr);
        }
      }
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  };
  
  // 获取当前显示的消息
  const currentMessages = selectedTask 
    ? (taskMessages[selectedTask.id] || [])
    : generalMessages;
  
  // 获取用户简历缺失字段
  const getProfileMissingFields = async () => {
    try {
      const { getUserProfile } = await import('./services/apiService');
      const profile = await getUserProfile(userId, 'candidate');
      
      const missingFields: {key: string; label: string; editUrl: string}[] = [];
      
      if (!profile?.display_name || profile.display_name.trim() === '') {
        missingFields.push({key: 'display_name', label: '姓名', editUrl: '/ai-assistant?editType=candidate&editField=name'});
      }
      if (!profile?.title || profile.title.trim() === '') {
        missingFields.push({key: 'title', label: '职位头衔', editUrl: '/ai-assistant?editType=candidate&editField=title'});
      }
      if (!profile?.summary || profile.summary.length < 20) {
        missingFields.push({key: 'summary', label: '个人简介', editUrl: '/ai-assistant?editType=candidate&editField=summary'});
      }
      
      const candidateData = profile?.candidate_data || {};
      
      // 辅助函数：检查字段是否有有效值
      const hasValue = (val: any) => {
        if (!val) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'string') return val.trim() !== '';
        return true;
      };
      
      if (!hasValue(candidateData.skills)) {
        missingFields.push({key: 'skills', label: '技能特长', editUrl: '/ai-assistant?editType=candidate&editField=skills'});
      }
      if (!hasValue(candidateData.experience)) {
        missingFields.push({key: 'experience', label: '工作经历', editUrl: '/ai-assistant?editType=candidate&editField=experience'});
      }
      if (!hasValue(candidateData.projects)) {
        missingFields.push({key: 'projects', label: '项目经历', editUrl: '/ai-assistant?editType=candidate&editField=projects'});
      }
      if (!hasValue(candidateData.education)) {
        missingFields.push({key: 'education', label: '教育背景', editUrl: '/ai-assistant?editType=candidate&editField=education'});
      }
      if (!hasValue(candidateData.expected_salary)) {
        missingFields.push({key: 'expected_salary', label: '期望薪资', editUrl: '/ai-assistant?editType=candidate&editField=expected_salary'});
      }
      if (!hasValue(candidateData.expected_location)) {
        missingFields.push({key: 'expected_location', label: '期望工作地点', editUrl: '/ai-assistant?editType=candidate&editField=expected_location'});
      }
      
      return missingFields;
    } catch (error) {
      console.error('获取用户资料失败:', error);
      return [];
    }
  };

  // 开始完善简历引导流程
  const startProfileCompleteGuide = async (isTaskMode: boolean = false) => {
    console.log('[Profile Guide] Starting profile complete guide, isTaskMode:', isTaskMode);
    setIsTyping(true);
    
    try {
      const missingFields = await getProfileMissingFields();
      console.log('[Profile Guide] Missing fields:', missingFields);
    
    if (missingFields.length === 0) {
      const successMessage = {
        role: 'assistant' as const,
        content: `✨ **您的简历资料已经很完善了！**\n\n当前简历完善度：100%\n\n您可以：\n• 前往 [个人主页](/candidate/profile) 查看和微调\n\n完成个人认证信息，提高求职机会：\n\n[[TASK:完善个人认证信息:personal_verification:🔐]]\n\n🎉 任务已完成！还有什么我可以帮您的吗？`
      };
      
      if (isTaskMode && selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), successMessage]
        }));
      } else {
        setGeneralMessages(prev => [...prev, successMessage]);
      }
      setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
    } else {
      const completenessPercent = Math.round(((9 - missingFields.length) / 9) * 100);
      const fieldsList = missingFields.map((f, i) => 
        `${i + 1}️⃣ **${f.label}**`
      ).join('\n');
      
      const guideMessage = {
        role: 'assistant' as const,
        content: `📝 **开始完善简历资料**\n\n当前简历完善度：**${completenessPercent}%**\n\n需要补充以下信息（共 ${missingFields.length} 项）：\n\n${fieldsList}\n\n---\n\n🚀 **现在开始填写第 1 项：${missingFields[0].label}**\n\n${getFieldPrompt(missingFields[0].key)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程\n📎 快捷方式：点击左下角上传简历，AI 自动解析填充`
      };
      
      if (isTaskMode && selectedTask) {
        console.log('[Profile Guide] Adding guide message to task:', selectedTask.id);
        setTaskMessages(prev => {
          const newMessages = [...(prev[selectedTask.id] || []), guideMessage];
          console.log('[Profile Guide] Task messages count:', newMessages.length);
          return {
            ...prev,
            [selectedTask.id]: newMessages
          };
        });
      } else {
        console.log('[Profile Guide] Adding guide message to general messages');
        setGeneralMessages(prev => [...prev, guideMessage]);
      }
      
      // 设置完善简历模式，自动从第一项开始
      setProfileCompleteMode({
        active: true,
        missingFields,
        currentFieldIndex: 0
      });
      console.log('[Profile Guide] Profile mode set to active');
    }
    } catch (error) {
      console.error('[Profile Guide] Error in startProfileCompleteGuide:', error);
      // 出错时也要添加一条消息让用户知道
      const errorMessage = {
        role: 'assistant' as const,
        content: `❌ 抱歉，获取简历信息时出现问题，请稍后再试。\n\n您也可以前往 [个人资料页](/candidate/profile) 手动编辑。`
      };
      if (isTaskMode && selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), errorMessage]
        }));
      } else {
        setGeneralMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
    }
  };
  
  // 获取字段填写提示
  const getFieldPrompt = (fieldKey: string) => {
    const prompts: Record<string, string> = {
      'display_name': '请输入您的真实姓名：',
      'title': '请输入您的职位头衔（如：高级前端工程师、产品经理、数据分析师）：',
      'summary': '请简要介绍您自己（包括工作经验、专业领域、个人优势等，建议 50-200 字）：',
      'skills': '请列出您的核心技能（用逗号分隔，如：React, TypeScript, Node.js, Python）：',
      'experience': '请描述您最近的工作经历：\n• 公司名称\n• 职位名称\n• 在职时间\n• 主要职责和成就',
      'projects': '请描述您参与过的重要项目：\n• 项目名称\n• 您的角色/职责\n• 项目成果/亮点\n• 使用的技术',
      'education': '请填写您的教育背景：\n• 学校名称\n• 专业\n• 学历（本科/硕士/博士）\n• 毕业时间',
      'expected_salary': '请输入您的期望薪资范围（如：3K-5K、5K-10K、10K-15K、15K-20K、20K-30K、30K以上、面议）：',
      'expected_location': '请输入您期望的工作地点（如：北京、上海、深圳、远程均可）：'
    };
    return prompts[fieldKey] || '请输入相关信息：';
  };
  
  // ===== 完善企业资料 相关函数 =====
  
  // 企业资料需要完善的所有字段定义
  const enterpriseProfileFields = [
    { key: 'display_name', label: '企业全称', type: 'text' as const },
    { key: 'short_name', label: '企业简称', type: 'text' as const },
    { key: 'industry', label: '所属行业', type: 'select' as const, options: ['互联网/IT', '人工智能', '金融/投资', '教育培训', '医疗健康', '制造业', '其他'] },
    { key: 'company_size', label: '企业规模', type: 'select' as const, options: ['0-20人', '20-99人', '100-499人', '500-999人', '1000人以上'] },
    { key: 'funding_stage', label: '融资阶段', type: 'select' as const, options: ['未融资', '天使轮', 'A轮', 'B轮', 'C轮及以上', '已上市', '不需要融资'] },
    { key: 'detail_address', label: '公司地址', type: 'text' as const },
    { key: 'contact_name', label: 'HR姓名', type: 'text' as const },
    { key: 'hr_phone', label: '联系电话', type: 'text' as const },
    { key: 'description', label: '企业简介', type: 'textarea' as const },
    { key: 'benefits', label: '企业福利', type: 'select' as const, options: ['五险一金', '年终奖', '带薪年假', '弹性工作', '餐补', '交通补贴', '员工培训', '节日福利'] },
  ];
  
  // 获取企业资料缺失字段
  const getEnterpriseMissingFields = async () => {
    try {
      const { getSettings } = await import('./services/apiService');
      const currentSettings = await getSettings(userId);
      
      const missingFields: {key: string; label: string; type: 'text' | 'select' | 'textarea'; options?: string[]}[] = [];
      
      const hasValue = (val: any) => {
        if (!val) return false;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (trimmed === '' || trimmed === '[]' || trimmed === '{}') return false;
          // 对于 benefits，检查 JSON 数组是否为空
          if (trimmed.startsWith('[')) {
            try { return JSON.parse(trimmed).length > 0; } catch { return false; }
          }
          return true;
        }
        return true;
      };
      
      for (const field of enterpriseProfileFields) {
        if (!hasValue(currentSettings[field.key])) {
          missingFields.push(field);
        }
      }
      
      return missingFields;
    } catch (error) {
      console.error('获取企业资料失败:', error);
      return [];
    }
  };
  
  // 获取企业字段填写提示
  const getEnterpriseFieldPrompt = (field: {key: string; label: string; type: string; options?: string[]}) => {
    if (field.type === 'select' && field.options) {
      if (field.key === 'benefits') {
        return `请选择企业福利（可多选，用逗号分隔）：\n\n${field.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n例如输入：1,3,4 或 五险一金,带薪年假,弹性工作`;
      }
      return `请选择${field.label}：\n\n${field.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n💡 直接输入序号或选项名称即可`;
    }
    
    const prompts: Record<string, string> = {
      'display_name': '请输入企业全称（与营业执照一致）：',
      'short_name': '请输入企业简称（如：字节、阿里、腾讯）：',
      'detail_address': '请输入公司地址（如：浙江省杭州市西湖区文三路XXX号）：',
      'contact_name': '请输入HR联系人姓名：',
      'hr_phone': '请输入联系电话（手机号或座机）：',
      'description': '请输入企业简介（介绍企业业务、文化、愿景等，建议50-300字）：',
    };
    return prompts[field.key] || `请输入${field.label}：`;
  };
  
  // 解析用户输入的选择值
  const parseEnterpriseSelectInput = (input: string, field: {key: string; options?: string[]}) => {
    if (!field.options) return input.trim();
    
    // 福利字段支持多选
    if (field.key === 'benefits') {
      const results: string[] = [];
      const parts = input.split(/[,，、\s]+/).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        const numMatch = part.match(/^(\d+)$/);
        if (numMatch) {
          const idx = parseInt(numMatch[1]) - 1;
          if (idx >= 0 && idx < field.options.length) {
            results.push(field.options[idx]);
          }
        } else {
          // 直接匹配选项名
          const match = field.options.find(o => o.includes(part) || part.includes(o));
          if (match) results.push(match);
          else results.push(part); // 允许自定义输入
        }
      }
      return JSON.stringify(results.length > 0 ? results : [input.trim()]);
    }
    
    // 单选字段
    const numMatch = input.trim().match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1]) - 1;
      if (idx >= 0 && idx < field.options.length) {
        return field.options[idx];
      }
    }
    // 直接匹配选项名
    const match = field.options.find(o => o === input.trim() || o.includes(input.trim()));
    return match || input.trim();
  };
  
  // 计算企业资料完善进度
  const [enterpriseProfileProgress, setEnterpriseProfileProgress] = useState(0);
  
  const calculateEnterpriseProfileProgress = async () => {
    if (!userId || (userRole !== 'employer' && userRole !== 'recruiter')) return 0;
    
    try {
      const { getSettings } = await import('./services/apiService');
      const currentSettings = await getSettings(userId);
      
      const hasValue = (val: any) => {
        if (!val) return false;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (trimmed === '' || trimmed === '[]' || trimmed === '{}') return false;
          if (trimmed.startsWith('[')) {
            try { return JSON.parse(trimmed).length > 0; } catch { return false; }
          }
          return true;
        }
        return true;
      };
      
      let completedFields = 0;
      const totalFields = enterpriseProfileFields.length;
      
      for (const field of enterpriseProfileFields) {
        if (hasValue(currentSettings[field.key])) completedFields++;
      }
      
      const progress = Math.round((completedFields / totalFields) * 100);
      setEnterpriseProfileProgress(progress);
      
      // 进度达到100%，自动标记任务完成
      if (progress >= 100 && selectedTask) {
        const taskTitle = selectedTask.title || selectedTask.task || '';
        const taskType = selectedTask.todo_type || selectedTask.type || '';
        const isEnterpriseProfileTask = taskType === 'enterprise_profile' || 
          taskTitle === '完善企业资料';
        
        if (isEnterpriseProfileTask && selectedTask.status !== 'completed') {
          try {
            const { updateTodo } = await import('./services/apiService');
            await updateTodo(selectedTask.id, { status: 'completed', progress: 100 });
            console.log('[Enterprise Profile Task] 任务已自动标记为完成');
            if (typeof refetchTasks === 'function') refetchTasks();
          } catch (e) {
            console.error('更新企业任务状态失败:', e);
          }
        }
      }
      
      return progress;
    } catch (error) {
      console.error('计算企业资料进度失败:', error);
      return 0;
    }
  };
  
  // 开始完善企业资料引导流程
  const startEnterpriseProfileGuide = async (isTaskMode: boolean = false) => {
    console.log('[Enterprise Profile Guide] Starting guide, isTaskMode:', isTaskMode);
    setIsTyping(true);
    
    try {
      const missingFields = await getEnterpriseMissingFields();
      console.log('[Enterprise Profile Guide] Missing fields:', missingFields.map(f => f.label));
      
      if (missingFields.length === 0) {
        const successMessage = {
          role: 'assistant' as const,
          content: `✅ **企业资料已完善！**\n\n当前完善度：100%\n\n您可以：\n• 前往 [基础信息设置](/settings?tab=General) 查看或修改\n• 前往 [企业主页](/employer/profile) 查看展示效果\n\n🎉 任务已完成！现在可以开始发布职位招聘人才了。`
        };
        
        if (isTaskMode && selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), successMessage]
          }));
          // 标记任务完成
          const { updateTodo } = await import('./services/apiService');
          await updateTodo(selectedTask.id, { progress: 100, status: 'completed' });
          if (typeof refetchTasks === 'function') refetchTasks();
        } else {
          setGeneralMessages(prev => [...prev, successMessage]);
        }
        setEnterpriseProfileMode({ active: false, missingFields: [], currentFieldIndex: -1 });
      } else {
        const totalFields = enterpriseProfileFields.length;
        const filledCount = totalFields - missingFields.length;
        const completenessPercent = Math.round((filledCount / totalFields) * 100);
        const fieldsList = missingFields.map((f, i) => 
          `${i + 1}️⃣ **${f.label}**`
        ).join('\n');
        
        const guideMessage = {
          role: 'assistant' as const,
          content: `📋 **开始完善企业资料**\n\n完善企业资料可以帮助您：\n✅ 提升企业主页展示效果\n✅ 增加候选人投递意愿\n✅ 提高人才匹配精准度\n\n---\n\n📊 当前完善度：**${completenessPercent}%**（${filledCount}/${totalFields}）\n\n需要补充以下信息（共 ${missingFields.length} 项）：\n\n${fieldsList}\n\n---\n\n🚀 **现在开始填写第 1 项：${missingFields[0].label}**\n\n${getEnterpriseFieldPrompt(missingFields[0])}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`
        };
        
        if (isTaskMode && selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), guideMessage]
          }));
        } else {
          setGeneralMessages(prev => [...prev, guideMessage]);
        }
        
        setEnterpriseProfileMode({
          active: true,
          missingFields,
          currentFieldIndex: 0
        });
      }
    } catch (error) {
      console.error('[Enterprise Profile Guide] Error:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: `❌ 抱歉，获取企业资料时出现问题，请稍后再试。\n\n您也可以前往 [基础信息设置](/settings?tab=General) 手动编辑。`
      };
      if (isTaskMode && selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), errorMessage]
        }));
      } else {
        setGeneralMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
    }
  };
  
  // 计算「完善简历资料」任务的动态进度
  const [profileTaskProgress, setProfileTaskProgress] = useState(0);
  
  const calculateProfileTaskProgress = async () => {
    if (!userId || userRole !== 'candidate') return 0;
    
    try {
      const { getUserProfile } = await import('./services/apiService');
      const profile = await getUserProfile(userId, 'candidate');
      
      let completedFields = 0;
      const totalFields = 9;  // 增加了 projects 字段
      
      // 辅助函数：检查字段是否有有效值
      const hasValue = (val: any) => {
        if (!val) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'string') return val.trim() !== '';
        return true;
      };
      
      // 检查每个字段
      if (hasValue(profile?.display_name)) completedFields++;
      if (hasValue(profile?.title)) completedFields++;
      if (profile?.summary && profile.summary.trim() !== '' && profile.summary.length >= 20) completedFields++;
      
      const candidateData = profile?.candidate_data || {};
      if (hasValue(candidateData.skills)) completedFields++;
      if (hasValue(candidateData.experience)) completedFields++;
      if (hasValue(candidateData.projects)) completedFields++;
      if (hasValue(candidateData.education)) completedFields++;
      if (hasValue(candidateData.expected_salary)) completedFields++;
      if (hasValue(candidateData.expected_location)) completedFields++;
      
      const progress = Math.round((completedFields / totalFields) * 100);
      setProfileTaskProgress(progress);
      
      // 当进度达到100%时，自动将任务标记为已完成，并创建"完善个人认证信息"任务
      if (progress >= 100 && selectedTask) {
        const taskTitle = selectedTask.title || selectedTask.task || '';
        const taskType = selectedTask.todo_type || selectedTask.type || '';
        const isProfileTask = taskType === 'profile_complete' || 
          taskTitle === '完善简历资料';
        
        if (isProfileTask && selectedTask.status !== 'completed') {
          try {
            const { updateTodo, createTodo, getTasks } = await import('./services/apiService');
            await updateTodo(selectedTask.id, { status: 'completed', progress: 100 });
            console.log('[Profile Task] 任务已自动标记为完成');
            
            // 检查并创建"完善个人认证信息"任务
            if (userId) {
              const existingTasks = await getTasks(userId);
              const hasVerificationTask = existingTasks.some((t: any) => 
                t.todo_type === 'personal_verification' || 
                t.title === '完善个人认证信息' ||
                (t.title.includes('完善') && t.title.includes('认证'))
              );
              
              if (!hasVerificationTask) {
                // 创建"完善个人认证信息"任务
                const verificationTaskData = {
                  title: '完善个人认证信息',
                  description: '完成身份认证、学历认证、技能认证、工作证明等，提升求职竞争力，增加面试机会',
                  priority: 'high',
                  source: 'agent',
                  todo_type: 'personal_verification',
                  ai_advice: '完成个人认证可以大幅提升您的可信度和求职成功率。建议优先完成身份认证和学历认证。',
                  steps: [
                    { order: 1, title: '完成身份认证', status: 'pending' },
                    { order: 2, title: '完成学历认证', status: 'pending' },
                    { order: 3, title: '完成技能认证', status: 'pending' },
                    { order: 4, title: '完成工作证明', status: 'pending' },
                    { order: 5, title: '完成征信认证', status: 'pending' }
                  ]
                };
                
                await createTodo(verificationTaskData, userId);
                console.log('[Verification Task] 简历100%完成，已自动创建个人认证任务');
              }
            }
            
            // 刷新任务列表
            if (typeof refetchTasks === 'function') {
              refetchTasks();
            }
          } catch (err) {
            console.error('自动完成任务失败:', err);
          }
        }
      }
      
      return progress;
    } catch (error) {
      console.error('计算任务进度失败:', error);
      return 0;
    }
  };
  
  // 当选中任务变化时，计算进度
  useEffect(() => {
    if (selectedTask) {
      const taskTitle = selectedTask.title || selectedTask.task || '';
      const taskType = selectedTask.todo_type || selectedTask.type || '';
      const isProfileTask = taskType === 'profile_complete' || 
        taskTitle === '完善简历资料' ||
        (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')) && !taskTitle.includes('企业'));
      
      if (isProfileTask) {
        calculateProfileTaskProgress();
      }
      
      const isEnterpriseProfileTask = taskType === 'enterprise_profile' || 
        taskTitle === '完善企业资料';
      
      if (isEnterpriseProfileTask) {
        calculateEnterpriseProfileProgress();
      }
    }
  }, [selectedTask, userId, userRole]);
  
  // 获取任务显示进度（对于完善简历任务和认证任务使用动态计算的进度）
  const getTaskDisplayProgress = () => {
    if (!selectedTask) return 0;
    
    const taskTitle = selectedTask.title || selectedTask.task || '';
    const taskType = selectedTask.todo_type || selectedTask.type || '';
    
    // 检查是否是完善简历任务
    const isProfileTask = taskType === 'profile_complete' || 
      taskTitle === '完善简历资料' ||
      (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')) && !taskTitle.includes('企业'));
    
    if (isProfileTask) {
      return profileTaskProgress;
    }
    
    // 检查是否是完善企业资料任务
    const isEnterpriseProfileTask = taskType === 'enterprise_profile' || 
      taskTitle === '完善企业资料';
    
    if (isEnterpriseProfileTask) {
      return enterpriseProfileProgress;
    }
    
    // 从最新的 tasks 数据中获取进度（确保获取最新数据）
    const latestTask = tasks.find((t: any) => t.id === selectedTask.id);
    const currentProgress = latestTask?.progress ?? selectedTask.progress ?? 0;
    const currentStatus = (latestTask?.status || selectedTask.status || '').toLowerCase();
    
    // 检查是否是DISC测试任务
    const isDiscTask = taskTitle === 'DISC性格测试';
    if (isDiscTask) {
      // 如果测试已完成，显示100%
      if (discTestMode.completed || currentStatus === 'completed' || currentProgress >= 100) {
        return 100;
      }
      // 根据当前题目计算进度
      if (discTestMode.active && discTestMode.currentQuestion > 0) {
        return Math.round((discTestMode.currentQuestion / discQuestions.length) * 100);
      }
      return currentProgress;
    }
    
    // 检查是否是云端求职轮巡任务
    const isCloudJobTask = taskTitle?.includes('云端求职轮巡');
    if (isCloudJobTask) {
      // 运行中的任务根据实际状态显示进度
      if (currentStatus === 'completed' || currentProgress >= 100) {
        return 100;
      }
      if (currentStatus === 'running') {
        // 运行中，显示实际进度或最小10%
        return Math.max(currentProgress, 10);
      }
      // 偏好收集阶段
      if (jobSearchMode.active && jobSearchMode.currentQuestion > 0) {
        const questionProgress = Math.round((jobSearchMode.currentQuestion / jobSearchQuestions.length) * 50);
        return jobSearchMode.isSearching ? 75 : questionProgress;
      }
      return currentProgress;
    }
    
    // 检查是否是智能求职助手任务（旧版本兼容）
    const isJobSearchTask = taskTitle === '智能求职助手';
    if (isJobSearchTask) {
      // 如果已完成，显示100%
      if (jobSearchMode.completed && !jobSearchMode.isSearching || currentStatus === 'completed' || currentProgress >= 100) {
        return 100;
      }
      // 根据当前问题计算进度（偏好收集占50%，匹配占50%）
      if (jobSearchMode.active && jobSearchMode.currentQuestion > 0) {
        const questionProgress = Math.round((jobSearchMode.currentQuestion / jobSearchQuestions.length) * 50);
        return jobSearchMode.isSearching ? 75 : questionProgress;
      }
      return currentProgress;
    }
    
    // 检查是否是认证任务
    const isVerificationTask = taskType === 'personal_verification' || 
      taskTitle === '完善个人认证信息' ||
      (taskTitle.includes('完善') && taskTitle.includes('认证'));
    
    if (isVerificationTask) {
      // 检查任务是否已完成（优先使用最新数据）
      if (currentStatus === 'completed' || currentProgress >= 100) {
        return 100;
      }
      
      if (verificationMode.active) {
        // 使用动态计算的认证进度
        const totalItems = verificationItems.length;
        const completedCount = verificationMode.completedItems.length;
        return Math.round((completedCount / totalItems) * 100);
      }
    }
    
    // 检查是否是企业认证任务（不使用 EMPLOYER 匹配，避免和"完善企业资料"冲突）
    const isEnterpriseVerificationTask = taskType === 'enterprise_verification' || 
      taskTitle === '完成企业认证' ||
      (taskTitle.includes('企业') && taskTitle.includes('认证') && !taskTitle.includes('资料'));
    
    if (isEnterpriseVerificationTask) {
      // 检查任务是否已完成
      if (currentStatus === 'completed' || currentProgress >= 100) {
        return 100;
      }
      
      if (enterpriseVerificationMode.active) {
        // 使用动态计算的认证进度
        const totalItems = enterpriseVerificationItems.length;
        const completedCount = enterpriseVerificationMode.completedItems.length;
        return Math.round((completedCount / totalItems) * 100);
      }
    }
    
    return currentProgress;
  };
  
  // 记录上次选中的任务ID，用于检测任务切换
  const lastSelectedTaskIdRef = useRef<number | null>(null);
  
  // 初始化任务专属消息
  useEffect(() => {
    if (!selectedTask) {
      lastSelectedTaskIdRef.current = null;
      // 切换到通用对话时，重置认证模式和简历完善模式
      setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
      setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
      return;
    }
    
    const taskTitle = selectedTask.title || selectedTask.task || '';
    const taskAdvice = selectedTask.aiAdvice || selectedTask.ai_advice || '';
    const taskType = selectedTask.todo_type || selectedTask.type || '';
    
    // 检查是否是完善简历资料任务（排除企业资料）
    const isProfileCompleteTask = taskType === 'profile_complete' || 
      taskTitle === '完善简历资料';
    
    // 检查是否是完善企业资料任务
    const isEnterpriseProfileTask = taskType === 'enterprise_profile' || 
      taskTitle === '完善企业资料';
    
    // 检测是否是新选中的任务（任务切换）
    const isNewSelection = lastSelectedTaskIdRef.current !== selectedTask.id;
    lastSelectedTaskIdRef.current = selectedTask.id;
    
    if (isProfileCompleteTask && userRole === 'candidate') {
      // 对于完善简历任务，每次选中时都重新初始化并启动引导
      if (isNewSelection || !profileCompleteMode.active) {
        console.log('[useEffect] Initializing profile task, taskId:', selectedTask.id);
        // 重置引导模式状态
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        // 重置认证模式（切换到简历任务时）
        setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
        
        // 初始化任务消息 - 直接启动引导，不再设置等待消息
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: []  // 清空，让引导消息成为第一条
        }));
        
        // 立即启动引导流程（不再延迟）
        console.log('[useEffect] Starting profile guide immediately');
        startProfileCompleteGuide(true);
      }
    } else if (taskType === 'personal_verification' || taskTitle === '完善个人认证信息' || (taskTitle.includes('完善') && taskTitle.includes('认证'))) {
      // 对于认证任务，启动认证引导流程
      // 异步加载已完成的认证数据
      const initVerificationTask = async () => {
        try {
          const { getPersonalCertifications } = await import('./services/apiService');
          const certifications = await getPersonalCertifications(userId);
          
          // 根据已有认证确定已完成的项目
          const completedKeys: string[] = [];
          const certCategories = new Set(certifications.map((c: any) => c.category));
          
          // 从身份认证中提取姓名（用于后续证件的姓名验证）
          let identityNameFromDB = '';
          const identityCerts = certifications.filter((c: any) => c.category === 'identity');
          if (identityCerts.length > 0) {
            // 从 "实名认证 - 姓名" 格式中提取姓名
            const identityCert = identityCerts[0];
            if (identityCert.name && identityCert.name.includes(' - ')) {
              identityNameFromDB = identityCert.name.split(' - ')[1] || '';
            } else if (identityCert.name) {
              identityNameFromDB = identityCert.name;
            }
            console.log('[Verification] Extracted identity name from DB:', identityNameFromDB);
          }
          
          // 检查身份认证是否完成（需要正反面都完成，或者有 identity 类别的认证）
          if (certCategories.has('identity')) {
            completedKeys.push('identity_front', 'identity_back');
          }
          // 检查学历认证
          if (certCategories.has('education')) {
            completedKeys.push('education');
          }
          // 检查技能认证（驾驶证、职业证书）- 需要分别检查
          const skillCerts = certifications.filter((c: any) => c.category === 'skill');
          for (const cert of skillCerts) {
            if (cert.name === '驾驶证') {
              completedKeys.push('skill_driver');
            } else {
              completedKeys.push('skill_cert');
            }
          }
          // 检查工作证明
          if (certCategories.has('work')) {
            completedKeys.push('work');
          }
          // 检查征信认证（公积金证明、社保证明）- 需要分别检查
          const creditCertsData = certifications.filter((c: any) => c.category === 'credit');
          for (const cert of creditCertsData) {
            if (cert.name === '公积金证明') {
              completedKeys.push('credit_fund');
            } else if (cert.name === '社保证明') {
              completedKeys.push('credit_social');
            }
          }
          
          // 找到第一个未完成的认证项
          let startIndex = 0;
          for (let i = 0; i < verificationItems.length; i++) {
            if (!completedKeys.includes(verificationItems[i].key)) {
              startIndex = i;
              break;
            }
            // 如果所有项都已完成
            if (i === verificationItems.length - 1) {
              startIndex = verificationItems.length; // 表示全部完成
            }
          }
          
          const totalSteps = verificationItems.length;
          const completedCount = completedKeys.length;
          
          console.log('[useEffect] Initializing verification task, completed:', completedKeys, 'startIndex:', startIndex);
          
          // 检查任务是否已经完成（用户之前已完成流程）
          const isTaskAlreadyCompleted = selectedTask.status?.toLowerCase() === 'completed' || selectedTask.progress >= 100;
          
          // 检查是否全部完成
          if (startIndex >= totalSteps || isTaskAlreadyCompleted) {
            // 所有认证都已完成 或 任务已标记完成
            setVerificationMode({
              active: false,
              items: verificationItems,
              currentIndex: -1,
              completedItems: completedKeys,
              identityName: identityNameFromDB
            });
            
            const completeMessage = `🎉 **恭喜！您已完成全部认证！**\n\n✅ 已完成：${completedCount}/${totalSteps} 项\n\n您的所有认证信息已保存，这将大幅提升您的求职竞争力！\n\n👉 前往 [设置 - 个人认证信息](/settings?tab=PersonalVerification) 查看详情\n\n还有什么我可以帮您的吗？`;
            
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [{ role: 'assistant', content: completeMessage }]
            }));
            
            // 确保任务状态为完成
            if (!isTaskAlreadyCompleted) {
              const { updateTodo } = await import('./services/apiService');
              await updateTodo(selectedTask.id, { progress: 100, status: 'completed' });
              if (typeof refetchTasks === 'function') {
                refetchTasks();
              }
            }
            return; // 直接返回，不再执行后续代码
          } else {
            // 还有未完成的认证项
            setVerificationMode({
              active: true,
              items: verificationItems,
              currentIndex: startIndex,
              completedItems: completedKeys,
              identityName: identityNameFromDB
            });
            
            const currentItem = verificationItems[startIndex];
            let welcomeMessage = `👋 **欢迎来到个人认证中心！**\n\n`;
            
            if (completedCount > 0) {
              welcomeMessage += `📊 **您已完成 ${completedCount}/${totalSteps} 项认证**\n\n`;
              welcomeMessage += `已完成的认证：\n`;
              if (completedKeys.includes('identity_front')) welcomeMessage += `✅ 身份认证\n`;
              if (completedKeys.includes('education')) welcomeMessage += `✅ 学历认证\n`;
              if (completedKeys.includes('skill_driver') || completedKeys.includes('skill_cert')) welcomeMessage += `✅ 技能认证\n`;
              if (completedKeys.includes('work')) welcomeMessage += `✅ 工作证明\n`;
              if (completedKeys.includes('credit_fund') || completedKeys.includes('credit_social')) welcomeMessage += `✅ 征信认证\n`;
              welcomeMessage += `\n---\n\n`;
              welcomeMessage += `📋 **继续完成剩余认证：**\n\n`;
            } else {
              welcomeMessage += `完成认证可以帮助您：\n✅ 提高简历可信度，增加 HR 信任\n✅ 获得"已认证"专属标识\n✅ 优先展示在推荐列表中\n✅ 增加 30% 以上的面试邀请机会\n\n---\n\n📋 **认证进度：** ${completedCount}/${totalSteps} 项\n\n`;
            }
            
            welcomeMessage += `${currentItem.icon} **第 ${startIndex + 1} 项：${currentItem.label}**\n\n${currentItem.description}`;
            
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [{ role: 'assistant', content: welcomeMessage }]
            }));
          }
          
          // 更新任务进度
          const { updateTodo } = await import('./services/apiService');
          const progress = Math.round((completedCount / totalSteps) * 100);
          await updateTodo(selectedTask.id, { progress, status: progress >= 100 ? 'completed' : 'in_progress' });
          
          // 刷新任务列表
          if (typeof refetchTasks === 'function') {
            refetchTasks();
          }
        } catch (error) {
          console.error('初始化认证任务失败:', error);
          // 发生错误时，使用默认初始化
          setVerificationMode({
            active: true,
            items: verificationItems,
            currentIndex: 0,
            completedItems: []
          });
          
          const firstItem = verificationItems[0];
          const totalSteps = verificationItems.length;
          const welcomeMessage = `👋 **欢迎来到个人认证中心！**\n\n完成认证可以帮助您：\n✅ 提高简历可信度，增加 HR 信任\n✅ 获得"已认证"专属标识\n✅ 优先展示在推荐列表中\n✅ 增加 30% 以上的面试邀请机会\n\n---\n\n📋 **认证进度：** 0/${totalSteps} 项\n\n${firstItem.icon} **第 1 项：${firstItem.label}**\n\n${firstItem.description}`;
          
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [{ role: 'assistant', content: welcomeMessage }]
          }));
        }
      };
      
      // 只在新选择任务或需要重新激活时执行
      const existingMessages = taskMessages[selectedTask.id];
      const hasExistingMessages = existingMessages && existingMessages.length > 0;
      
      if (!hasExistingMessages || (isNewSelection && !verificationMode.active)) {
        initVerificationTask();
      }
    } else if (isEnterpriseProfileTask) {
      // 完善企业资料任务 - 使用对话引导流程（必须在企业认证之前匹配！）
      if (isNewSelection || !enterpriseProfileMode.active) {
        console.log('[useEffect] Initializing enterprise profile task, taskId:', selectedTask.id);
        // 重置引导模式状态
        setEnterpriseProfileMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
        setDiscTestMode({ active: false, currentQuestion: 0, answers: [], completed: false });
        
        // 清空旧消息，启动企业资料引导流程
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: []
        }));
        startEnterpriseProfileGuide(true);
      }
    } else if (taskType === 'enterprise_verification' || taskTitle === '完成企业认证' || (taskTitle.includes('企业') && taskTitle.includes('认证'))) {
      // 企业认证任务（注意：不再使用 taskType === 'EMPLOYER' 匹配，因为会和"完善企业资料"冲突）
      const initEnterpriseVerificationTask = async () => {
        try {
          const { getEnterpriseCertifications } = await import('./services/apiService');
          const certifications = await getEnterpriseCertifications(userId);
          
          // 根据已有认证确定已完成的项目
          const completedKeys: string[] = [];
          const certCategories = new Set(certifications.map((c: any) => c.category));
          
          // 从营业执照中提取企业名称
          let companyNameFromDB = '';
          const businessLicenseCerts = certifications.filter((c: any) => c.category === 'qualification' && c.name?.includes('营业执照'));
          if (businessLicenseCerts.length > 0) {
            const cert = businessLicenseCerts[0];
            companyNameFromDB = cert.organization || '';
            completedKeys.push('business_license');
          }
          
          // 检查法人身份证认证（合并记录表示正反面都完成）
          const hasLegalPersonId = certifications.some((c: any) => 
            c.name?.includes('法人身份证') && !c.name?.includes('正面') && !c.name?.includes('背面')
          );
          if (hasLegalPersonId) {
            completedKeys.push('legal_person_id_front');
            completedKeys.push('legal_person_id_back');
          }
          
          // 找到第一个未完成的认证项
          let startIndex = 0;
          for (let i = 0; i < enterpriseVerificationItems.length; i++) {
            if (!completedKeys.includes(enterpriseVerificationItems[i].key)) {
              startIndex = i;
              break;
            }
            if (i === enterpriseVerificationItems.length - 1) {
              startIndex = enterpriseVerificationItems.length;
            }
          }
          
          const totalSteps = enterpriseVerificationItems.length;
          const completedCount = completedKeys.length;
          
          console.log('[useEffect] Initializing enterprise verification task, completed:', completedKeys, 'startIndex:', startIndex);
          
          // 检查任务是否已经完成
          const isTaskAlreadyCompleted = selectedTask.status?.toLowerCase() === 'completed' || selectedTask.progress >= 100;
          
          if (startIndex >= totalSteps || isTaskAlreadyCompleted) {
            // 所有认证都已完成
            setEnterpriseVerificationMode({
              active: false,
              items: enterpriseVerificationItems,
              currentIndex: -1,
              completedItems: completedKeys,
              companyName: companyNameFromDB
            });
            
            const completeMessage = `🎉 **恭喜！企业认证已全部完成！**\n\n✅ 已完成：${completedCount}/${totalSteps} 项\n\n您的企业已通过认证，这将大幅提升招聘效果和候选人信任度！\n\n👉 前往 [设置 - 企业认证信息](/settings?tab=Verification) 查看详情\n\n还有什么我可以帮您的吗？`;
            
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [{ role: 'assistant', content: completeMessage }]
            }));
          } else {
            // 设置企业认证模式
            setEnterpriseVerificationMode({
              active: true,
              items: enterpriseVerificationItems,
              currentIndex: startIndex,
              completedItems: completedKeys,
              companyName: companyNameFromDB
            });
            
            // 重置其他模式
            setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
            setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
            setDiscTestMode({ active: false, currentQuestion: 0, answers: [], completed: false });
            setJobSearchMode({ active: false, currentQuestion: 0, answers: [], completed: false, tokenUsed: 0, isSearching: false });
            
            const currentItem = enterpriseVerificationItems[startIndex];
            const welcomeMessage = currentItem 
              ? `🏢 **欢迎来到企业认证中心！**\n\n完成企业认证可以帮助您：\n✅ 提升企业可信度，获得"认证企业"标识\n✅ 优先展示在企业推荐列表\n✅ 增加候选人投递意愿\n✅ 解锁更多高级招聘功能\n\n---\n\n📋 **认证进度：** ${completedCount}/${totalSteps} 项\n\n${currentItem.icon} **第 ${startIndex + 1} 项：${currentItem.label}**\n\n${currentItem.description}`
              : `🏢 **欢迎来到企业认证中心！**\n\n完成企业认证可以帮助您：\n✅ 提升企业可信度，获得"认证企业"标识\n✅ 优先展示在企业推荐列表\n✅ 增加候选人投递意愿\n✅ 解锁更多高级招聘功能\n\n---\n\n📋 **认证进度：** ${completedCount}/${totalSteps} 项\n\n点击下方 **「开始认证」** 按钮开始企业认证流程。`;
            
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [{ role: 'assistant', content: welcomeMessage }]
            }));
          }
        } catch (error) {
          console.error('初始化企业认证任务失败:', error);
        }
      };
      
      const existingMessages = taskMessages[selectedTask.id];
      const hasExistingMessages = existingMessages && existingMessages.length > 0;
      
      if (!hasExistingMessages || (isNewSelection && !enterpriseVerificationMode.active)) {
        initEnterpriseVerificationTask();
      }
    } else if (taskTitle === 'DISC性格测试') {
      // DISC测试任务
      if (isNewSelection) {
        setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setDiscTestMode({ active: true, currentQuestion: 0, answers: [], completed: false });
        setJobSearchMode({ active: false, currentQuestion: 0, answers: [], completed: false, tokenUsed: 0, isSearching: false });
        
        const discWelcomeMessage = `🎯 **欢迎参加 DISC 性格测试！**\n\n**什么是 DISC？**\nDISC 是一种广泛应用于职场的行为风格评估工具，帮助您了解自己的：\n\n• **D (Dominance) 支配型** - 结果导向、果断决策\n• **I (Influence) 影响型** - 善于沟通、热情乐观\n• **S (Steadiness) 稳健型** - 稳重可靠、团队协作\n• **C (Conscientiousness) 谨慎型** - 注重细节、追求完美\n\n**测试有什么好处？**\n✅ 了解您的行为风格和工作偏好\n✅ 发现您的优势和潜在成长空间\n✅ 帮助 HR 更好地匹配适合您的岗位\n✅ 提升团队协作和沟通效率\n\n📋 测试共 **10 道题目**，预计用时 3-5 分钟\n\n---\n\n准备好了吗？输入「开始测试」开始您的 DISC 之旅！`;
        
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [{ role: 'assistant', content: discWelcomeMessage }]
        }));
      }
    } else if (taskTitle?.includes('云端求职轮巡')) {
      // 云端求职轮巡任务
      if (isNewSelection) {
        setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setDiscTestMode({ active: false, currentQuestion: 0, answers: [], completed: false });
        
        // 检查任务状态决定初始化模式
        const taskStatus = (selectedTask.status || '').toUpperCase();
        const isRunning = taskStatus === 'RUNNING';
        
        if (isRunning) {
          // 任务正在运行中，设置为已完成偏好收集的状态
          setJobSearchMode({ active: true, currentQuestion: 0, answers: [], completed: true, tokenUsed: 0, isSearching: false });
        } else {
          // 任务待开始，需要收集偏好
          setJobSearchMode({ active: true, currentQuestion: 0, answers: [], completed: false, tokenUsed: 0, isSearching: false });
        }
        
        // 获取任务描述中的会员信息
        const taskDesc = selectedTask.description || '';
        const daysMatch = taskDesc.match(/(\d+)天/);
        const days = daysMatch ? parseInt(daysMatch[1]) : 7;
        
        // 根据任务状态生成欢迎消息
        const initCloudTask = async () => {
          const { getMemories } = await import('./services/apiService');
          const memories = await getMemories(userId);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          
          const recentJobPreference = memories.find((m: any) => {
            if (m.type?.toLowerCase() !== 'preference' || !m.content?.includes('求职偏好')) return false;
            const memoryDate = new Date(m.created_at || m.createdAt);
            return memoryDate > oneMonthAgo;
          });
          
          let welcomeMsg = '';
          
          if (isRunning) {
            // 任务已在运行
            welcomeMsg = `🚀 **云端求职轮巡任务运行中！**\n\n`;
            welcomeMsg += `📋 **任务名称**：${taskTitle}\n`;
            welcomeMsg += `⏱️ **轮巡周期**：${days} 天\n`;
            welcomeMsg += `📊 **任务状态**：🟢 运行中\n\n`;
            welcomeMsg += `---\n\n## 🤖 AI 正在云端为您工作\n\n`;
            welcomeMsg += `• ⏰ 每小时扫描全网新增岗位\n`;
            welcomeMsg += `• 🎯 自动筛选匹配度 ≥ 85% 的岗位\n`;
            welcomeMsg += `• 📤 自动投递符合条件的岗位\n`;
            welcomeMsg += `• 🔔 实时通知投递结果和面试邀请\n\n`;
            welcomeMsg += `---\n\n💡 您可以：\n`;
            welcomeMsg += `• 输入「查看进度」查看实时投递进度\n`;
            welcomeMsg += `• 输入「查看投递」查看所有投递记录\n`;
            welcomeMsg += `• 输入「暂停轮巡」暂停任务\n`;
            welcomeMsg += `• 输入「修改偏好」更新求职偏好`;
          } else if (recentJobPreference) {
            // 有偏好记录，准备开始
            welcomeMsg = `🎯 **云端求职轮巡任务准备就绪！**\n\n`;
            welcomeMsg += `📋 **任务名称**：${taskTitle}\n`;
            welcomeMsg += `⏱️ **轮巡周期**：${days} 天\n`;
            welcomeMsg += `📊 **任务状态**：⏸️ 待启动\n\n`;
            welcomeMsg += `---\n\n检测到您已有求职偏好记录：\n\n`;
            welcomeMsg += `${recentJobPreference.content}\n\n`;
            welcomeMsg += `---\n\n输入「开始」即可启动云端轮巡任务！\n`;
            welcomeMsg += `或输入「修改偏好」重新设置求职偏好。`;
          } else {
            // 无偏好记录，需要收集
            welcomeMsg = `🎯 **云端求职轮巡任务**\n\n`;
            welcomeMsg += `📋 **任务名称**：${taskTitle}\n`;
            welcomeMsg += `⏱️ **轮巡周期**：${days} 天\n`;
            welcomeMsg += `📊 **任务状态**：⏸️ 待启动\n\n`;
            welcomeMsg += `---\n\n在启动云端轮巡之前，我需要了解您的**求职偏好**，以便更精准地为您匹配岗位。\n\n`;
            welcomeMsg += `📋 共 **${jobSearchQuestions.length} 个问题**，预计用时 2-3 分钟\n\n`;
            welcomeMsg += `---\n\n准备好了吗？输入「开始」开始设置求职偏好！`;
          }
          
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [{ role: 'assistant', content: welcomeMsg }]
          }));
        };
        
        initCloudTask();
      }
    } else if (taskTitle === '智能求职助手') {
      // 智能求职助手任务（旧版本兼容）
      if (isNewSelection) {
        setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setDiscTestMode({ active: false, currentQuestion: 0, answers: [], completed: false });
        setJobSearchMode({ active: true, currentQuestion: 0, answers: [], completed: false, tokenUsed: 0, isSearching: false });
        
        const jobSearchWelcomeMessage = `🎯 **智能求职助手**\n\n欢迎使用智能求职功能！我将根据您的简历、认证信息和求职偏好，为您智能匹配并推荐合适的岗位。\n\n在开始之前，我需要了解一些您的**求职偏好**，这将帮助我更精准地为您匹配合适的岗位。\n\n📋 共 **${jobSearchQuestions.length} 个问题**，预计用时 2-3 分钟\n\n---\n\n准备好了吗？输入「开始」开始您的智能求职之旅！`;
        
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [{ role: 'assistant', content: jobSearchWelcomeMessage }]
        }));
      }
    } else if (taskType === 'recruit' || taskTitle?.includes('智能招聘')) {
      // 智能招聘任务 - 主动引导用户发布招聘需求
      if (isNewSelection) {
        setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setEnterpriseProfileMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setDiscTestMode({ active: false, currentQuestion: 0, answers: [], completed: false });
        setJobSearchMode({ active: false, currentQuestion: 0, answers: [], completed: false, tokenUsed: 0, isSearching: false });
        
        // 启动招聘引导
        setPostMode({
          active: true,
          step: 'requirement',
          jobDescription: '',
          generatedResult: null
        });
        
        const initRecruitTask = async () => {
          try {
            const { getSettings } = await import('./services/apiService');
            const settingsData = await getSettings(userId).catch(() => ({}));
            const companyName = settingsData.display_name || settingsData.short_name || user?.company_name || '贵公司';
            
            const welcomeMsg = `🏢 **${companyName} · 智能招聘助手**\n\n我将帮您完成整个招聘流程：\n\n` +
              `**① 描述需求** → 告诉我您想招什么人\n` +
              `**② AI 生成岗位** → 我会根据您的企业信息自动生成完整的岗位描述\n` +
              `**③ 确认发布** → 您确认后一键上线\n\n---\n\n` +
              `现在请告诉我您的招聘需求，可以简单描述，我来帮您完善。例如：\n\n` +
              `💡 "需要一个前端和一个后端"\n` +
              `💡 "招产品经理，3年经验以上"\n` +
              `💡 "技术团队扩招5个人"\n\n` +
              `您想招什么人？`;
            
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [{ role: 'assistant', content: welcomeMsg }]
            }));
          } catch (e) {
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [{ role: 'assistant', content: '🏢 **智能招聘助手**\n\n请告诉我您的招聘需求，我来帮您自动生成岗位并发布。' }]
            }));
          }
        };
        
        initRecruitTask();
      }
    } else {
      // 普通任务：重置认证模式和简历完善模式
      if (isNewSelection) {
        setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        setDiscTestMode({ active: false, currentQuestion: 0, answers: [], completed: false });
        setJobSearchMode({ active: false, currentQuestion: 0, answers: [], completed: false, tokenUsed: 0, isSearching: false });
      }
      
      if (!taskMessages[selectedTask.id]) {
        // 普通任务初始化消息（只在没有消息时初始化）
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [{
            role: 'assistant',
            content: `你好！我是 Devnors 任务执行助手。关于「${taskTitle}」这项任务，我已经准备好协助您。${taskAdvice ? `\n\n💡 AI建议：${taskAdvice}` : ''}\n\n您可以告诉我您想要如何执行这个任务，或者有什么具体的问题需要我帮忙解答。`
          }]
        }));
      }
    }
  }, [selectedTask, userRole]);
  
  // 滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [currentMessages, isTyping]);
  
  // 根据 icon 字符串获取图标组件
  const getIconComponent = (iconName: string | undefined) => {
    switch (iconName) {
      case 'UserIcon': return UserIcon;
      case 'Building2': return Building2;
      case 'Calendar': return Calendar;
      case 'Zap': return Zap;
      default: return Calendar;
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isTyping) return;
    
    const userMessage = inputMessage;
    
    // 编辑模式处理
    if (editMode.active && editMode.awaitingInput) {
      const fieldKey = `${editMode.type}_${editMode.field}`;
      const config = EDIT_FIELD_CONFIG[fieldKey];
      
      // 添加用户消息
      setGeneralMessages(prev => [...prev, {role: 'user', content: userMessage}]);
      setInputMessage('');
      setIsTyping(true);
      
      // 验证输入
      const validation = config?.validate(userMessage);
      
      if (!validation?.valid) {
        // 验证失败
        setTimeout(() => {
          setGeneralMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ ${validation?.message || '输入格式不正确'}\n\n请重新输入，${config?.prompt}`
          }]);
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 验证成功，保存数据
      const saved = await saveEditData(fieldKey, userMessage);
      
      if (saved) {
        setGeneralMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **${config?.label}已更新！**\n\n您输入的内容：「${userMessage}」\n\n已成功保存到您的${editMode.type === 'employer' ? '企业' : '职业'}画像中。\n\n📌 您可以继续完善其他信息，或返回查看更新后的画像。`
        }]);
        
        // 退出编辑模式
        setEditMode({ active: false, type: '', field: '', awaitingInput: false });
      } else {
        setGeneralMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ 保存失败，请稍后重试。`
        }]);
      }
      
      setIsTyping(false);
      return;
    }
    
    // 求职申请模式处理
    if (applyMode.active) {
      setInputMessage('');
      const handled = await handleApplyProcess(userMessage);
      if (handled) return;
    }
    
    // 招聘发布模式处理
    if (postMode.active) {
      setInputMessage('');
      const handled = await handlePostProcess(userMessage);
      if (handled) return;
    }
    
    // 邀请好友模式处理
    if (inviteMode.active) {
      setInputMessage('');
      const handled = await handleInviteProcess(userMessage);
      if (handled) return;
    }
    
    // 检测用户是否有找工作意图
    const jobSearchKeywords = ['找工作', '求职', '找个工作', '想换工作', '开始求职', '投简历', '应聘', '找份工作', '想跳槽', '看机会', '看看机会', '想找', '找一份'];
    const isJobSearchRequest = jobSearchKeywords.some(kw => userMessage.includes(kw)) && userRole === 'candidate';
    
    if (isJobSearchRequest && !jobSearchMode.active) {
      setInputMessage('');
      
      // 添加用户消息
      if (selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content: userMessage}]
        }));
      } else {
        setGeneralMessages(prev => [...prev, {role: 'user', content: userMessage}]);
      }
      
      setIsTyping(true);
      
      // 检查用户是否完成了必要的任务
      const checkPrerequisites = async () => {
        try {
          // 动态导入API函数
          const { getPersonalCertifications, getTasks, createTodo, getMemories } = await import('./services/apiService');
          
          // 获取用户任务列表
          const userTasks = await getTasks(userId);
          
          // 检查简历完善任务
          const profileTask = userTasks.find((t: any) => 
            t.title === '完善简历资料' || t.todo_type === 'profile_complete'
          );
          const isProfileCompleted = profileTask?.status?.toLowerCase() === 'completed' || profileTask?.progress >= 100;
          
          // 检查身份认证 - 从个人认证数据中检查
          const certifications = await getPersonalCertifications(userId);
          const hasIdentityVerification = certifications.some((c: any) => 
            c.category === 'identity'
          );
          
          const addMsg = (content: string) => {
            if (selectedTask) {
              setTaskMessages(prev => ({
                ...prev,
                [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
              }));
            } else {
              setGeneralMessages(prev => [...prev, {role: 'assistant', content}]);
            }
          };
          
          if (!isProfileCompleted) {
            // 简历未完成，引导用户先完善简历
            const guideMsg = `👋 很高兴您想要开始求职！\n\n不过，我发现您的**简历资料还未完善**。为了能够帮您更精准地匹配合适的岗位，建议您先完成以下步骤：\n\n📋 **第一步：完善简历资料**\n填写完整的个人信息，让招聘方更好地了解您\n\n[[TASK:完善简历资料:profile_complete:FileText]]\n\n完成简历后，我就可以帮您开始智能求职啦！`;
            addMsg(guideMsg);
            setIsTyping(false);
            return;
          }
          
          if (!hasIdentityVerification) {
            // 身份认证未完成
            const guideMsg = `👋 很高兴您想要开始求职！\n\n您的简历已完善，但还需要完成**身份认证**才能开始投递。身份认证可以提高您的可信度，让招聘方更放心。\n\n🆔 **请先完成身份认证**\n\n[[TASK:完善个人认证信息:personal_verification:Shield]]\n\n完成身份认证后，我就可以帮您开始智能求职啦！`;
            addMsg(guideMsg);
            setIsTyping(false);
            return;
          }
          
          // 前置条件满足，检查是否已有运行中的云端轮巡任务
          const existingJobTask = userTasks.find((t: any) => 
            t.title?.includes('云端求职轮巡') && 
            (t.status?.toUpperCase() === 'RUNNING' || t.status?.toUpperCase() === 'PENDING')
          );
          
          if (existingJobTask) {
            // 已有运行中的任务，使用卡片引导
            addMsg(`🔔 **检测到您已有运行中的云端求职轮巡任务！**\n\n任务状态：🟢 运行中\n\n点击下方卡片查看任务详情：\n\n[[TASK:${existingJobTask.title}:cloud_job:🚀]]`);
            setIsTyping(false);
            return;
          }
          
          // 检查求职偏好
          const memories = await getMemories(userId);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          
          const recentJobPreference = memories.find((m: any) => {
            if (m.type?.toLowerCase() !== 'preference' || !m.content?.includes('求职偏好')) return false;
            const memoryDate = new Date(m.created_at || m.createdAt);
            return memoryDate > oneMonthAgo;
          });
          
          // 获取用户会员等级（模拟）
          const userMembership = 'pro'; // 实际应从用户数据获取：'basic' | 'pro' | 'ultra'
          const membershipConfig: Record<string, {name: string; days: number; color: string}> = {
            'basic': { name: 'Devnors 1.0', days: 1, color: 'slate' },
            'pro': { name: 'Devnors 1.0 Pro', days: 7, color: 'indigo' },
            'ultra': { name: 'Devnors 1.0 Ultra', days: 30, color: 'amber' }
          };
          const membership = membershipConfig[userMembership] || membershipConfig['basic'];
          
          // 生成任务ID
          const taskId = `JOB_${Date.now()}_${userId}`;
          const taskShortId = taskId.slice(-6);
          
          // 创建新的云端轮巡任务
          addMsg(`🎯 **智能求职助手启动！**\n\n太棒了！您已完成简历和身份认证。\n\n⏳ 正在为您创建云端求职轮巡任务...`);
          
          // 创建任务
          let newTask: any = null;
          try {
            newTask = await createTodo({
              title: `云端求职轮巡 #${taskShortId}`,
              description: `${membership.name} - ${membership.days}天在线轮巡投递`,
              priority: 'HIGH',
              status: recentJobPreference ? 'RUNNING' : 'PENDING',
              progress: 0,
              source: 'AGENT',
              todo_type: 'CANDIDATE',
              icon: 'Rocket',
              user_id: userId,
            });
            console.log('[JobSearch] 云端轮巡任务创建成功:', newTask);
            
            if (typeof refetchTasks === 'function') {
              await refetchTasks();
            }
          } catch (e) {
            console.error('创建轮巡任务失败:', e);
            addMsg(`❌ 创建任务失败，请稍后重试。`);
            setIsTyping(false);
            return;
          }
          
          // 延迟后切换到新任务
          setTimeout(async () => {
            // 重新获取任务列表以获得新任务的完整信息
            const updatedTasks = await getTasks(userId);
            const createdTask = updatedTasks.find((t: any) => t.title?.includes(taskShortId));
            
            if (createdTask) {
              addMsg(`✅ **云端求职轮巡任务创建成功！**\n\n🎖️ 会员等级：${membership.name}\n⏱️ 轮巡周期：${membership.days} 天\n\n点击下方卡片进入任务：\n\n[[TASK:${createdTask.title}:cloud_job:🚀]]`);
              setIsTyping(false);
            } else {
              addMsg(`✅ **云端求职轮巡任务创建成功！**\n\n🎖️ 会员等级：${membership.name}\n⏱️ 轮巡周期：${membership.days} 天\n\n点击下方卡片进入任务：\n\n[[TASK:云端求职轮巡 #${taskShortId}:cloud_job:🚀]]`);
              setIsTyping(false);
            }
          }, 1000);
          
        } catch (err: any) {
          console.error('检查求职前置条件失败:', err);
          console.error('错误详情:', err?.message, err?.stack);
          const errorMsg = `抱歉，检查您的资料时遇到了问题：${err?.message || '未知错误'}。请稍后再试，或先确保您已完善简历和身份认证。`;
          if (selectedTask) {
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content: errorMsg}]
            }));
          } else {
            setGeneralMessages(prev => [...prev, {role: 'assistant', content: errorMsg}]);
          }
        }
        setIsTyping(false);
      };
      
      checkPrerequisites();
      return;
    }
    
    // 检测用户是否想要完善简历
    const profileKeywords = ['完善简历', '填写简历', '更新简历', '完善资料', '补充信息', '补充简历', '开始填写', '完善个人'];
    const isProfileRequest = profileKeywords.some(kw => userMessage.includes(kw));
    
    console.log('[handleSend] Checking profile request:', {
      userMessage,
      isProfileRequest,
      userRole,
      profileCompleteModeActive: profileCompleteMode.active
    });
    
    if (isProfileRequest && userRole === 'candidate' && !profileCompleteMode.active) {
      console.log('[handleSend] Starting profile guide flow');
      setInputMessage('');
      // 根据是否有选中任务，添加到对应的消息列表
      if (selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content: userMessage}]
        }));
        // 使用任务模式的引导流程
        startProfileCompleteGuide(true);
      } else {
        setGeneralMessages(prev => [...prev, {role: 'user', content: userMessage}]);
        // 使用非任务模式的引导流程
        startProfileCompleteGuide(false);
      }
      return;
    }
    
    // 检测企业用户是否想要完善企业资料
    const enterpriseProfileKeywords = ['完善企业', '完善公司', '企业资料', '企业信息', '公司信息', '完善资料'];
    const isEnterpriseProfileRequest = enterpriseProfileKeywords.some(kw => userMessage.includes(kw));
    
    if (isEnterpriseProfileRequest && (userRole === 'employer' || userRole === 'recruiter') && !enterpriseProfileMode.active) {
      console.log('[handleSend] Starting enterprise profile guide flow');
      setInputMessage('');
      if (selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content: userMessage}]
        }));
        startEnterpriseProfileGuide(true);
      } else {
        setGeneralMessages(prev => [...prev, {role: 'user', content: userMessage}]);
        startEnterpriseProfileGuide(false);
      }
      return;
    }
    
    // 检测企业用户是否想要招聘
    const recruitKeywords = ['招聘', '招人', '发布岗位', '发布职位', '开始招聘', '招个', '招一个', '想招', '要招', '需要招', '招几个', '发布招聘', '找人', '缺人', '招工', '发JD', '发jd'];
    const isRecruitRequest = recruitKeywords.some(kw => userMessage.includes(kw)) && (userRole === 'employer' || userRole === 'recruiter');
    
    if (isRecruitRequest && !postMode.active) {
      setInputMessage('');
      setGeneralMessages(prev => [...prev, {role: 'user', content: userMessage}]);
      setIsTyping(true);
      
      // 前置条件检查
      const checkRecruitPrerequisites = async () => {
        try {
          const { getEnterpriseCertifications, getSettings, getTasks } = await import('./services/apiService');
          const [certifications, settingsData, tasks] = await Promise.all([
            getEnterpriseCertifications(userId).catch(() => []),
            getSettings(userId).catch(() => ({})),
            getTasks(userId).catch(() => []),
          ]);
          
          const hasBusinessLicense = certifications.some((c: any) => c.category === 'qualification' && c.name?.includes('营业执照'));
          const certTask = tasks.find((t: any) => t.title === '完成企业认证' || (t.title?.includes('企业') && t.title?.includes('认证')));
          const certCompleted = hasBusinessLicense || certTask?.status?.toLowerCase() === 'completed';
          
          const requiredFields = ['display_name', 'industry', 'company_size', 'detail_address', 'description'];
          const hasValue = (val: any) => val && typeof val === 'string' ? val.trim() !== '' && val.trim() !== '[]' && val.trim() !== '{}' : !!val;
          const missingProfileFields = requiredFields.filter(k => !hasValue(settingsData[k]));
          const profileCompleted = missingProfileFields.length === 0;
          
          if (!certCompleted || !profileCompleted) {
            const issues: string[] = [];
            if (!certCompleted) issues.push('• **企业认证未完成** — 请先前往 [企业认证信息](/settings?tab=Verification) 上传营业执照等认证材料\n\n[[TASK:完成企业认证:enterprise_verification:🏢]]');
            if (!profileCompleted) issues.push('• **企业资料未完善** — 还需补充：' + missingProfileFields.map(k => {
              const labels: Record<string, string> = { display_name: '企业全称', industry: '所属行业', company_size: '企业规模', detail_address: '公司地址', description: '企业简介' };
              return labels[k] || k;
            }).join('、') + '\n\n[[TASK:完善企业资料:enterprise_profile:📋]]');
            
            setGeneralMessages(prev => [...prev, {role: 'assistant', content: `👋 收到您的招聘需求！\n\n不过在开始招聘前，需要先完成以下准备工作，以保障招聘质量和企业可信度：\n\n${issues.join('\n\n')}\n\n完成后再告诉我您的招聘需求，我就能帮您智能生成岗位并发布了！`}]);
            setIsTyping(false);
            return;
          }
          
          // 前置条件满足，创建招聘任务并启动招聘引导
          const companyName = settingsData.display_name || settingsData.short_name || user?.company_name || '贵公司';
          
          // 创建招聘任务
          try {
            const { createTodo } = await import('./services/apiService');
            const existingRecruitTask = tasks.find((t: any) => 
              (t.todo_type?.toUpperCase() === 'RECRUIT' || t.title?.includes('智能招聘')) &&
              (t.status?.toUpperCase() === 'PENDING' || t.status?.toUpperCase() === 'RUNNING' || t.status?.toUpperCase() === 'IN_PROGRESS')
            );
            if (!existingRecruitTask) {
              const taskShortId = `RC${Date.now().toString().slice(-6)}`;
              await createTodo({
                title: `智能招聘 #${taskShortId}`,
                description: 'AI 智能招聘助手 — 描述您的招聘需求，AI 自动生成岗位并发布',
                priority: 'HIGH',
                source: 'AGENT',
                todo_type: 'RECRUIT',
                ai_advice: '告诉 AI 助手您的招聘需求，AI 将为您自动生成专业岗位描述并一键发布。',
                steps: [
                  { step: 1, title: '描述招聘需求', status: 'pending' },
                  { step: 2, title: 'AI 生成岗位', status: 'pending' },
                  { step: 3, title: '确认并发布', status: 'pending' },
                ],
              }, userId);
              if (typeof refetchTasks === 'function') refetchTasks();
            }
          } catch (e) {
            console.error('创建招聘任务失败:', e);
          }
          
          setPostMode({
            active: true,
            step: 'requirement',
            jobDescription: '',
            generatedResult: null
          });
          
          // 如果用户消息中已经包含了具体需求，直接处理
          const hasSpecificNeed = userMessage.length > 10 && (
            userMessage.includes('工程师') || userMessage.includes('经理') || userMessage.includes('设计') ||
            userMessage.includes('开发') || userMessage.includes('运营') || /\d+[kK]/.test(userMessage) ||
            userMessage.includes('经验') || userMessage.includes('年')
          );
          
          if (hasSpecificNeed) {
            // 用户已经描述了具体需求，直接进入生成流程
            setGeneralMessages(prev => [...prev, {role: 'assistant', content: `✅ **${companyName}** 企业认证和资料均已完善！\n\n📋 已为您创建「智能招聘」任务，正在根据需求生成岗位...`}]);
            setIsTyping(false);
            // 延迟后触发 postProcess
            setTimeout(() => {
              handlePostProcess(userMessage);
            }, 500);
          } else {
            // 用户只是表达了招聘意图，引导描述
            setGeneralMessages(prev => [...prev, {role: 'assistant', content: `✅ **${companyName}** 企业认证和资料均已完善，可以开始招聘！\n\n📋 已为您创建「智能招聘」任务，您可以在任务中心查看进度。\n\n---\n\n**第一步：描述您的招聘需求**\n\n请告诉我您想招什么人，例如：\n\n> "招聘高级前端工程师，3年以上React经验，薪资25-40K"\n> "技术团队扩招，需要前端2人、后端3人、产品经理1人"\n\n**第二步：AI 自动生成岗位**\n我会根据企业信息和需求，生成专业的岗位描述\n\n**第三步：确认并一键发布**\n您确认无误后，岗位将立即上线并开始智能匹配候选人\n\n💡 描述越详细，生成的岗位越精准！`}]);
            setIsTyping(false);
          }
        } catch (err) {
          console.error('检查招聘前置条件失败:', err);
          setGeneralMessages(prev => [...prev, {role: 'assistant', content: `⚠️ 检查招聘资质时出现异常：${(err as any)?.message || '未知错误'}。请稍后重试。`}]);
          setIsTyping(false);
        }
      };
      
      checkRecruitPrerequisites();
      return;
    }
    
    // 完善简历模式处理
    if (profileCompleteMode.active) {
      setInputMessage('');
      
      // 添加用户消息到当前对话
      const addUserMessage = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'user' as const, content}]);
        }
      };
      
      // 添加 AI 消息到当前对话
      const addAssistantMessage = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'assistant' as const, content}]);
        }
      };
      
      addUserMessage(userMessage);
      setIsTyping(true);
      
      // 用户输入了跳过当前字段
      if (userMessage.includes('跳过')) {
        const currentIndex = profileCompleteMode.currentFieldIndex;
        const currentField = profileCompleteMode.missingFields[currentIndex];
        const nextIndex = currentIndex + 1;
        const totalFields = profileCompleteMode.missingFields.length;
        
        setTimeout(async () => {
          if (nextIndex >= totalFields) {
            // 所有字段都已处理（跳过或填写）
            const progress = await calculateProfileTaskProgress();
            addAssistantMessage(`⏭️ 已跳过「${currentField?.label}」\n\n---\n\n📋 **简历完善流程结束**\n\n当前完善度：**${progress}%**\n\n${progress < 100 ? '💡 提示：完善更多资料可以获得更多面试机会！\n\n您可以随时发送"完善简历"继续补充信息。' : '🎉 您的简历已完善！'}\n\n还有什么我可以帮您的吗？`);
            setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
          } else {
            // 跳过当前字段，继续下一个
            const nextField = profileCompleteMode.missingFields[nextIndex];
            const skippedCount = currentIndex + 1;
            addAssistantMessage(`⏭️ 已跳过「${currentField?.label}」 (${skippedCount}/${totalFields})\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getFieldPrompt(nextField.key)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程\n📎 快捷方式：点击左下角上传简历，AI 自动解析填充`);
            setProfileCompleteMode(prev => ({
              ...prev,
              currentFieldIndex: nextIndex
            }));
          }
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 用户想退出整个流程
      if (userMessage.includes('退出') || userMessage.includes('取消') || userMessage.includes('稍后')) {
        setTimeout(async () => {
          const progress = await calculateProfileTaskProgress();
          addAssistantMessage(`好的，您可以稍后继续完善简历。\n\n当前完善度：**${progress}%**\n\n💡 提示：完善的简历可以帮助您获得更多面试机会！\n\n还有什么我可以帮您的吗？`);
          setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 检查用户是否确认覆盖已有值
      const confirmKeywords = ['确认', '覆盖', '是', '修改', '更新', 'yes', 'ok'];
      const cancelKeywords = ['取消', '不', '否', '保留', 'no', 'cancel'];
      
      // 如果有待确认覆盖的字段
      if ((profileCompleteMode as any).pendingOverwrite) {
        const pending = (profileCompleteMode as any).pendingOverwrite;
        const isConfirm = confirmKeywords.some(kw => userMessage.toLowerCase().includes(kw));
        const isCancel = cancelKeywords.some(kw => userMessage.toLowerCase().includes(kw));
        
        if (isConfirm) {
          // 用户确认覆盖
          try {
            const { updateProfileField } = await import('./services/apiService');
            await updateProfileField(userId, 'candidate', pending.field, pending.value, true); // force_update = true
            
            const currentIndex = profileCompleteMode.currentFieldIndex;
            const nextIndex = currentIndex + 1;
            const totalFields = profileCompleteMode.missingFields.length;
            
            setTimeout(async () => {
              await calculateProfileTaskProgress();
              
              if (nextIndex >= totalFields) {
                // 所有字段都已处理
                const progress = await calculateProfileTaskProgress();
                addAssistantMessage(`✅ **${pending.label}已更新！**\n\n旧值：${pending.existingValue}\n新值：${pending.value}\n\n---\n\n🎉 **恭喜！您的简历资料已全部完善！**\n\n✨ 简历完善度：**${progress}%**\n\n现在您可以：\n• 前往 [个人主页](/candidate/profile) 查看和微调\n\n完成个人认证信息，提高求职机会：\n\n[[TASK:完善个人认证信息:personal_verification:🔐]]\n\n祝您求职顺利！🚀`);
                setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
              } else {
                // 继续下一个字段
                const nextField = profileCompleteMode.missingFields[nextIndex];
                const completedCount = nextIndex;
                const progressPercent = Math.round((completedCount / totalFields) * 100);
                
                addAssistantMessage(`✅ **${pending.label}已更新！** (${completedCount}/${totalFields})\n\n📊 完善进度：${'█'.repeat(Math.floor(progressPercent / 10))}${'░'.repeat(10 - Math.floor(progressPercent / 10))} ${progressPercent}%\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getFieldPrompt(nextField.key)}\n\n💡 输入 "跳过" 可以跳过当前项`);
                
                // 清除待覆盖状态，继续下一个字段
                setProfileCompleteMode(prev => {
                  const newState = { ...prev };
                  delete (newState as any).pendingOverwrite;
                  return {
                    ...newState,
                    currentFieldIndex: nextIndex
                  };
                });
              }
              setIsTyping(false);
            }, 500);
          } catch (e) {
            addAssistantMessage(`❌ 更新失败，请稍后重试。`);
            setIsTyping(false);
          }
          return;
        } else if (isCancel) {
          // 用户取消，跳过此字段
          const currentIndex = profileCompleteMode.currentFieldIndex;
          const nextIndex = currentIndex + 1;
          const totalFields = profileCompleteMode.missingFields.length;
          
          setTimeout(async () => {
            if (nextIndex >= totalFields) {
              // 所有字段都已处理
              const progress = await calculateProfileTaskProgress();
              addAssistantMessage(`好的，保留原有的${pending.label}：「${pending.existingValue}」\n\n---\n\n📋 **简历完善流程结束**\n\n当前完善度：**${progress}%**\n\n还有什么我可以帮您的吗？`);
              setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
            } else {
              // 继续下一个字段
              const nextField = profileCompleteMode.missingFields[nextIndex];
              addAssistantMessage(`好的，保留原有的${pending.label}：「${pending.existingValue}」\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getFieldPrompt(nextField.key)}\n\n💡 输入 "跳过" 可以跳过当前项`);
              
              setProfileCompleteMode(prev => {
                const newState = { ...prev };
                delete (newState as any).pendingOverwrite;
                return {
                  ...newState,
                  currentFieldIndex: nextIndex
                };
              });
            }
            setIsTyping(false);
          }, 500);
          return;
        }
      }
      
      // 当前正在填写某个字段，保存用户输入
      if (profileCompleteMode.currentFieldIndex >= 0) {
        const field = profileCompleteMode.missingFields[profileCompleteMode.currentFieldIndex];
        
        try {
          // 保存到用户资料（简历字段直接保存到 profile，不重复存到 memory）
          const { updateProfileField } = await import('./services/apiService');
          const result = await updateProfileField(userId, 'candidate', field.key, userMessage, false);
          
          // 检查是否已有值
          if (result.has_existing && !result.success) {
            // 已有值，询问用户是否覆盖
            setTimeout(() => {
              addAssistantMessage(`⚠️ **${field.label}已有值**\n\n当前值：「${result.existing_value}」\n您输入的：「${userMessage}」\n\n是否要覆盖原有内容？\n\n• 输入 **"确认"** 覆盖原内容\n• 输入 **"取消"** 保留原内容`);
              // 保存待覆盖信息
              setProfileCompleteMode(prev => ({
                ...prev,
                pendingOverwrite: {
                  field: field.key,
                  label: field.label,
                  value: userMessage,
                  existingValue: result.existing_value
                }
              } as any));
              setIsTyping(false);
            }, 500);
            return;
          }
          
          // 只有关键字段（经历、技能、项目）才保存到 Memory 用于画像展示
          const memoryFields = ['experience', 'skills', 'education', 'projects'];
          if (memoryFields.includes(field.key)) {
            try {
              // 字段名到 Memory 类型的映射（处理单复数差异）
              const fieldToMemoryType: Record<string, string> = {
                'skills': 'skill',
                'projects': 'project',
                'experience': 'experience',
                'education': 'education'
              };
              const memoryType = fieldToMemoryType[field.key] || field.key.toLowerCase();
              
              await createMemory({
                type: memoryType,
                content: userMessage,
                importance: 'High',
                scope: 'candidate'
              }, userId);
              refetchMemories();
            } catch (memErr) {
              console.log('Memory 保存跳过（可能重复）:', memErr);
            }
          }
          
          // 计算下一个字段
          const nextIndex = profileCompleteMode.currentFieldIndex + 1;
          const totalFields = profileCompleteMode.missingFields.length;
          const completedCount = nextIndex;
          const progressPercent = Math.round((completedCount / totalFields) * 100);
          
          setTimeout(async () => {
            // 刷新任务进度（等待更新完成）
            const actualProgress = await calculateProfileTaskProgress();
            
            if (nextIndex >= totalFields) {
              // 所有字段都已完成
              addAssistantMessage(`✅ **${field.label}已保存！**\n\n---\n\n🎉 **恭喜！您的简历资料已全部完善！**\n\n✨ 简历完善度：**${actualProgress}%**\n\n现在您可以：\n• 前往 [个人主页](/candidate/profile) 查看和微调\n\n完成个人认证信息，提高求职机会：\n\n[[TASK:完善个人认证信息:personal_verification:🔐]]\n\n祝您求职顺利！🚀`);
              setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
            } else {
              // 自动进入下一项
              const nextField = profileCompleteMode.missingFields[nextIndex];
              addAssistantMessage(`✅ **${field.label}已保存！** (${completedCount}/${totalFields})\n\n📊 完善进度：${'█'.repeat(Math.floor(actualProgress / 10))}${'░'.repeat(10 - Math.floor(actualProgress / 10))} ${actualProgress}%\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getFieldPrompt(nextField.key)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程\n📎 快捷方式：点击左下角上传简历，AI 自动解析填充`);
              
              setProfileCompleteMode(prev => ({
                ...prev,
                currentFieldIndex: nextIndex
              }));
            }
            setIsTyping(false);
          }, 600);
          
          return;
        } catch (error) {
          console.error('保存资料失败:', error);
          setTimeout(() => {
            addAssistantMessage(`❌ 保存失败，请稍后重试。\n\n您输入的是：「${userMessage}」\n\n请重新输入${field.label}：`);
            setIsTyping(false);
          }, 500);
          return;
        }
      }
      
      // 没有选择字段时，检查用户是否选择了某个数字
      const numMatch = userMessage.match(/^(\d)$/);
      if (numMatch) {
        const fieldIndex = parseInt(numMatch[1]) - 1;
        if (fieldIndex >= 0 && fieldIndex < profileCompleteMode.missingFields.length) {
          const field = profileCompleteMode.missingFields[fieldIndex];
          
          setTimeout(() => {
            addAssistantMessage(`📝 **填写${field.label}**\n\n${getFieldPrompt(field.key)}`);
            
            setProfileCompleteMode(prev => ({
              ...prev,
              currentFieldIndex: fieldIndex
            }));
            setIsTyping(false);
          }, 500);
          
          return;
        }
      }
      
      // 其他情况，提示用户
      setTimeout(() => {
        const currentIndex = profileCompleteMode.currentFieldIndex;
        const currentField = profileCompleteMode.missingFields[currentIndex >= 0 ? currentIndex : 0];
        addAssistantMessage(`我没有理解您的意思。\n\n现在正在填写「${currentField?.label || '简历信息'}」，请直接输入内容。\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程\n📎 快捷方式：点击左下角上传简历，AI 自动解析填充`);
        setIsTyping(false);
      }, 500);
      
      return;
    }
    
    // 完善企业资料模式处理
    if (enterpriseProfileMode.active) {
      setInputMessage('');
      
      // 添加用户消息
      const addUserMsg = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'user' as const, content}]);
        }
      };
      
      const addAsstMsg = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'assistant' as const, content}]);
        }
      };
      
      addUserMsg(userMessage);
      setIsTyping(true);
      
      // 用户跳过当前字段
      if (userMessage.includes('跳过')) {
        const currentIndex = enterpriseProfileMode.currentFieldIndex;
        const currentField = enterpriseProfileMode.missingFields[currentIndex];
        const nextIndex = currentIndex + 1;
        const totalFields = enterpriseProfileMode.missingFields.length;
        
        setTimeout(async () => {
          if (nextIndex >= totalFields) {
            const progress = await calculateEnterpriseProfileProgress();
            addAsstMsg(`⏭️ 已跳过「${currentField?.label}」\n\n---\n\n📋 **企业资料完善流程结束**\n\n当前完善度：**${progress}%**\n\n${progress < 100 ? '💡 提示：完善更多资料可以提升招聘效果！\n\n您可以随时点击此任务继续补充，或前往 [基础信息设置](/settings?tab=General) 手动编辑。' : '🎉 企业资料已完善！'}`);
            setEnterpriseProfileMode({ active: false, missingFields: [], currentFieldIndex: -1 });
          } else {
            const nextField = enterpriseProfileMode.missingFields[nextIndex];
            addAsstMsg(`⏭️ 已跳过「${currentField?.label}」 (${currentIndex + 1}/${totalFields})\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getEnterpriseFieldPrompt(nextField)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`);
            setEnterpriseProfileMode(prev => ({ ...prev, currentFieldIndex: nextIndex }));
          }
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 用户退出流程
      if (userMessage.includes('退出') || userMessage.includes('稍后')) {
        setTimeout(async () => {
          const progress = await calculateEnterpriseProfileProgress();
          addAsstMsg(`好的，您可以稍后继续完善企业资料。\n\n当前完善度：**${progress}%**\n\n💡 提示：完善的企业资料可以帮助您吸引更多优质人才！\n\n您可以随时点击此任务继续补充，或前往 [基础信息设置](/settings?tab=General) 手动编辑。`);
          setEnterpriseProfileMode({ active: false, missingFields: [], currentFieldIndex: -1 });
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 当前正在填写某个字段，保存用户输入
      if (enterpriseProfileMode.currentFieldIndex >= 0) {
        const field = enterpriseProfileMode.missingFields[enterpriseProfileMode.currentFieldIndex];
        
        try {
          const { updateSettings } = await import('./services/apiService');
          
          // 解析用户输入
          let valueToSave = userMessage.trim();
          if (field.type === 'select' && field.options) {
            valueToSave = parseEnterpriseSelectInput(userMessage, field);
          }
          
          // 手机号格式验证
          if (field.key === 'hr_phone' || field.key === 'contact_phone') {
            const phoneClean = valueToSave.replace(/[\s\-]/g, '');
            const mobileReg = /^1[3-9]\d{9}$/;
            const landlineReg = /^0\d{2,3}\d{7,8}$/;
            if (!mobileReg.test(phoneClean) && !landlineReg.test(phoneClean)) {
              setTimeout(() => {
                addAsstMsg(`⚠️ 您输入的「${valueToSave}」不是有效的电话号码格式。\n\n请输入正确的手机号（如 13812345678）或固定电话（如 02112345678）：`);
                setIsTyping(false);
              }, 300);
              return;
            }
            valueToSave = phoneClean;
          }
          
          // 只发送需要更新的字段
          const updateData: any = {};
          updateData[field.key] = valueToSave;
          
          await updateSettings(updateData, userId);
          console.log(`[Enterprise Profile] 已保存 ${field.label}: ${valueToSave}`);
          
          // 计算下一步
          const nextIndex = enterpriseProfileMode.currentFieldIndex + 1;
          const totalFields = enterpriseProfileMode.missingFields.length;
          const completedCount = nextIndex;
          
          setTimeout(async () => {
            const actualProgress = await calculateEnterpriseProfileProgress();
            
            // 显示保存的值（福利字段特殊处理）
            let displayValue = valueToSave;
            if (field.key === 'benefits') {
              try { displayValue = JSON.parse(valueToSave).join('、'); } catch { /* keep original */ }
            }
            
            if (nextIndex >= totalFields) {
              addAsstMsg(`✅ **${field.label}已保存！** → ${displayValue}\n\n---\n\n🎉 **恭喜！企业资料已全部完善！**\n\n✨ 完善度：**${actualProgress}%**\n\n您可以：\n• 前往 [基础信息设置](/settings?tab=General) 查看或修改\n• 前往 [企业主页](/employer/profile) 查看展示效果\n\n现在可以开始发布职位，招聘优质人才了！🚀`);
              setEnterpriseProfileMode({ active: false, missingFields: [], currentFieldIndex: -1 });
            } else {
              const nextField = enterpriseProfileMode.missingFields[nextIndex];
              addAsstMsg(`✅ **${field.label}已保存！** → ${displayValue} (${completedCount}/${totalFields})\n\n📊 完善进度：${'█'.repeat(Math.floor(actualProgress / 10))}${'░'.repeat(10 - Math.floor(actualProgress / 10))} ${actualProgress}%\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getEnterpriseFieldPrompt(nextField)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`);
              setEnterpriseProfileMode(prev => ({ ...prev, currentFieldIndex: nextIndex }));
            }
            setIsTyping(false);
          }, 600);
          
          return;
        } catch (error) {
          console.error('保存企业资料失败:', error);
          setTimeout(() => {
            addAsstMsg(`❌ 保存失败，请稍后重试。\n\n您输入的是：「${userMessage}」\n\n请重新输入${field.label}：`);
            setIsTyping(false);
          }, 500);
          return;
        }
      }
      
      // 其他情况
      setTimeout(() => {
        const currentIndex = enterpriseProfileMode.currentFieldIndex;
        const currentField = enterpriseProfileMode.missingFields[currentIndex >= 0 ? currentIndex : 0];
        addAsstMsg(`我没有理解您的意思。\n\n现在正在填写「${currentField?.label || '企业资料'}」，请直接输入内容。\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`);
        setIsTyping(false);
      }, 500);
      
      return;
    }
    
    // DISC测试模式处理
    if (discTestMode.active) {
      // 处理重新测试
      if (discTestMode.completed && (userMessage.includes('重新测试') || userMessage.includes('再测一次'))) {
        setInputMessage('');
        setDiscTestMode({ active: true, currentQuestion: 0, answers: [], completed: false });
        
        const addRestartMsg = (content: string) => {
          if (selectedTask) {
            setTaskMessages(prev => ({
              ...prev,
              [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
            }));
          } else {
            setGeneralMessages(prev => [...prev, {role: 'assistant' as const, content}]);
          }
        };
        
        addRestartMsg(`🔄 好的，让我们重新开始 DISC 性格测试！\n\n📋 测试共 **10 道题目**，预计用时 3-5 分钟\n\n准备好了吗？输入「开始测试」开始您的 DISC 之旅！`);
        return;
      }
      
      // 测试已完成，不处理其他输入
      if (discTestMode.completed) {
        return;
      }
      setInputMessage('');
      
      // 添加用户消息
      const addUserMsg = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'user' as const, content}]);
        }
      };
      
      // 添加 AI 消息
      const addAIMsg = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'assistant' as const, content}]);
        }
      };
      
      addUserMsg(userMessage);
      setIsTyping(true);
      
      // 检测开始测试
      if (userMessage.includes('开始测试') || userMessage.includes('开始') || userMessage.includes('Start')) {
        setTimeout(() => {
          const firstQuestion = discQuestions[0];
          let questionMsg = `📝 **DISC 性格测试开始！**\n\n---\n\n**第 1 题 / 共 ${discQuestions.length} 题**\n\n${firstQuestion.question}\n\n`;
          firstQuestion.options.forEach(opt => {
            questionMsg += `**${opt.label}.** ${opt.text}\n\n`;
          });
          questionMsg += `\n请输入您的选择（A/B/C/D）`;
          
          addAIMsg(questionMsg);
          setDiscTestMode(prev => ({ ...prev, currentQuestion: 1 }));
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 处理答案
      const answerMatch = userMessage.toUpperCase().match(/^[ABCD]$/);
      if (answerMatch && discTestMode.currentQuestion > 0) {
        const answer = answerMatch[0];
        const currentQ = discQuestions[discTestMode.currentQuestion - 1];
        const selectedOption = currentQ.options.find(opt => opt.label === answer);
        
        if (selectedOption) {
          const newAnswer = {
            question: discTestMode.currentQuestion,
            answer: answer,
            dimension: selectedOption.dimension
          };
          
          const newAnswers = [...discTestMode.answers, newAnswer];
          
          setTimeout(async () => {
            if (discTestMode.currentQuestion < discQuestions.length) {
              // 继续下一题
              const nextQ = discQuestions[discTestMode.currentQuestion];
              let questionMsg = `✅ 已记录您的选择：**${answer}**\n\n---\n\n**第 ${discTestMode.currentQuestion + 1} 题 / 共 ${discQuestions.length} 题**\n\n${nextQ.question}\n\n`;
              nextQ.options.forEach(opt => {
                questionMsg += `**${opt.label}.** ${opt.text}\n\n`;
              });
              questionMsg += `\n请输入您的选择（A/B/C/D）`;
              
              addAIMsg(questionMsg);
              setDiscTestMode(prev => ({
                ...prev,
                currentQuestion: prev.currentQuestion + 1,
                answers: newAnswers
              }));
            } else {
              // 测试完成，计算结果
              const scores = { D: 0, I: 0, S: 0, C: 0 };
              newAnswers.forEach(a => {
                scores[a.dimension as keyof typeof scores]++;
              });
              
              // 找出最高分的维度
              const maxScore = Math.max(...Object.values(scores));
              const dominantTypes = Object.entries(scores)
                .filter(([_, score]) => score === maxScore)
                .map(([type]) => type);
              
              // 计算百分比
              const total = discQuestions.length;
              const percentages = {
                D: Math.round((scores.D / total) * 100),
                I: Math.round((scores.I / total) * 100),
                S: Math.round((scores.S / total) * 100),
                C: Math.round((scores.C / total) * 100)
              };
              
              // DISC类型描述
              const typeDescriptions: Record<string, {name: string; traits: string; strengths: string; careers: string}> = {
                D: {
                  name: "支配型 (Dominance)",
                  traits: "结果导向、果断决策、喜欢挑战、追求效率",
                  strengths: "领导力强、善于解决问题、推动力强、敢于承担风险",
                  careers: "管理者、创业者、销售总监、项目经理、咨询顾问"
                },
                I: {
                  name: "影响型 (Influence)",
                  traits: "善于社交、热情乐观、富有感染力、喜欢表达",
                  strengths: "沟通能力强、团队激励、人际关系好、创意丰富",
                  careers: "市场营销、公关、培训师、销售、人力资源"
                },
                S: {
                  name: "稳健型 (Steadiness)",
                  traits: "稳重可靠、耐心倾听、团队协作、追求和谐",
                  strengths: "忠诚度高、执行力强、善于支持他人、处事冷静",
                  careers: "客户服务、行政管理、人力资源、项目协调、医疗护理"
                },
                C: {
                  name: "谨慎型 (Conscientiousness)",
                  traits: "注重细节、追求完美、逻辑清晰、严谨认真",
                  strengths: "分析能力强、质量把控好、专业知识扎实、规划能力强",
                  careers: "工程师、数据分析师、财务、质量管理、研发"
                }
              };
              
              const primaryType = dominantTypes[0];
              const primaryDesc = typeDescriptions[primaryType];
              
              // 生成结果消息
              let resultMsg = `🎉 **DISC 测试完成！**\n\n---\n\n## 📊 您的 DISC 评估结果\n\n`;
              resultMsg += `### 主导类型：${primaryDesc.name}\n\n`;
              resultMsg += `**得分分布：**\n`;
              resultMsg += `• D 支配型：${scores.D} 分 (${percentages.D}%)\n`;
              resultMsg += `• I 影响型：${scores.I} 分 (${percentages.I}%)\n`;
              resultMsg += `• S 稳健型：${scores.S} 分 (${percentages.S}%)\n`;
              resultMsg += `• C 谨慎型：${scores.C} 分 (${percentages.C}%)\n\n`;
              resultMsg += `---\n\n### 🎯 性格特点\n${primaryDesc.traits}\n\n`;
              resultMsg += `### 💪 核心优势\n${primaryDesc.strengths}\n\n`;
              resultMsg += `### 💼 适合职业\n${primaryDesc.careers}\n\n`;
              resultMsg += `---\n\n✅ 测试结果已保存到您的个人档案，HR 可以参考此结果为您匹配更合适的岗位！\n\n还有什么我可以帮您的吗？`;
              
              addAIMsg(resultMsg);
              
              // 保存结果到 Memory
              try {
                const { createMemory } = await import('./services/apiService');
                
                // 构建完整的DISC结果描述
                const discResultContent = `【DISC性格测试结果】\n主导类型: ${primaryDesc.name}\n得分分布: D-${scores.D}分(${percentages.D}%) I-${scores.I}分(${percentages.I}%) S-${scores.S}分(${percentages.S}%) C-${scores.C}分(${percentages.C}%)\n性格特点: ${primaryDesc.traits}\n核心优势: ${primaryDesc.strengths}\n适合职业: ${primaryDesc.careers}`;
                
                await createMemory({
                  type: 'experience',
                  content: discResultContent,
                  importance: 'High',
                  scope: 'candidate'
                }, userId);
                console.log('[DISC] 测试结果已保存到 Memory');
              } catch (err) {
                console.error('[DISC] 保存测试结果失败:', err);
              }
              
              // 更新任务进度为100%
              if (selectedTask) {
                try {
                  const { updateTodo } = await import('./services/apiService');
                  await updateTodo(selectedTask.id, { progress: 100, status: 'completed' });
                  if (typeof refetchTasks === 'function') {
                    refetchTasks();
                  }
                } catch (err) {
                  console.error('[DISC] 更新任务进度失败:', err);
                }
              }
              
              setDiscTestMode(prev => ({
                ...prev,
                answers: newAnswers,
                completed: true
              }));
            }
            setIsTyping(false);
          }, 500);
          return;
        }
      }
      
      // 无效输入
      setTimeout(() => {
        if (discTestMode.currentQuestion === 0) {
          addAIMsg(`请输入「开始测试」来开始 DISC 性格测试。`);
        } else {
          addAIMsg(`请输入有效的选项（A/B/C/D）来回答当前问题。`);
        }
        setIsTyping(false);
      }, 500);
      return;
    }
    
    // 求职偏好模式处理
    if (jobSearchMode.active) {
      setInputMessage('');
      
      // 添加用户消息
      const addJobMsg = (content: string, role: 'user' | 'assistant') => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role, content}]);
        }
      };
      
      addJobMsg(userMessage, 'user');
      setIsTyping(true);
      
      // 处理调整偏好/修改偏好
      if (jobSearchMode.completed && (userMessage.includes('调整偏好') || userMessage.includes('修改偏好') || userMessage.includes('重新测试') || userMessage.includes('再来一次'))) {
        setTimeout(() => {
          setJobSearchMode({ active: true, currentQuestion: 0, answers: [], completed: false, tokenUsed: jobSearchMode.tokenUsed, isSearching: false });
          addJobMsg(`🔄 好的，让我们重新收集您的求职偏好！\n\n之前的偏好将被新的偏好覆盖。\n\n📋 共 **${jobSearchQuestions.length} 个问题**，预计用时 2-3 分钟\n\n准备好了吗？输入「开始」开始！`, 'assistant');
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 处理继续找工作
      if (jobSearchMode.completed && !jobSearchMode.isSearching && (userMessage.includes('继续找') || userMessage.includes('继续搜索'))) {
        setJobSearchMode(prev => ({ ...prev, isSearching: true }));
        addJobMsg(`🔍 **继续为您搜索新岗位...**\n\n⏳ 正在获取最新职位信息...`, 'assistant');
        
        setTimeout(async () => {
          const tokenBalance = 1000 - jobSearchMode.tokenUsed;
          const tokenCost = 200;
          
          if (tokenBalance < tokenCost) {
            addJobMsg(`⚠️ **Token 余额不足**\n\n继续搜索需要 ${tokenCost} Token，您当前余额为 ${tokenBalance} Token。\n\n请充值后继续。`, 'assistant');
            setJobSearchMode(prev => ({ ...prev, isSearching: false }));
            setIsTyping(false);
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          let newSearchMsg = `📋 **新岗位搜索完成！**\n\n---\n\n找到 **8** 个新增匹配岗位：\n\n`;
          newSearchMsg += `### ✅ 已自动投递（匹配度 ≥ 85%）\n\n`;
          newSearchMsg += `1. **产品经理** - 快手\n`;
          newSearchMsg += `   📊 匹配度: 89% | ✅ 已投递\n\n`;
          newSearchMsg += `2. **高级产品经理** - B站\n`;
          newSearchMsg += `   📊 匹配度: 86% | ✅ 已投递\n\n`;
          newSearchMsg += `### ❌ 已跳过（匹配度 < 85%）\n\n`;
          newSearchMsg += `3. **产品助理** - 拼多多 | 匹配度: 68% | 原因: 职级不匹配\n`;
          newSearchMsg += `4. **运营经理** - 滴滴 | 匹配度: 72% | 原因: 岗位方向不符\n\n`;
          newSearchMsg += `---\n\n💰 本次消耗: ${tokenCost} Token | 剩余: ${tokenBalance - tokenCost} Token`;
          
          addJobMsg(newSearchMsg, 'assistant');
          setJobSearchMode(prev => ({ ...prev, isSearching: false, tokenUsed: prev.tokenUsed + tokenCost }));
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 处理查看投递记录
      if (jobSearchMode.completed && !jobSearchMode.isSearching && (userMessage.includes('查看投递') || userMessage.includes('投递记录'))) {
        setTimeout(() => {
          let recordMsg = `📋 **您的投递记录**\n\n---\n\n### 📬 已投递岗位\n\n`;
          recordMsg += `| 岗位 | 公司 | 投递时间 | 状态 |\n`;
          recordMsg += `|------|------|----------|------|\n`;
          recordMsg += `| 高级产品经理 | 字节跳动 | 今天 | 🟡 待查看 |\n`;
          recordMsg += `| 产品负责人 | 阿里巴巴 | 今天 | 🟢 已查看 |\n`;
          recordMsg += `| 产品经理 | 美团 | 今天 | 🟡 待查看 |\n`;
          recordMsg += `| 高级产品经理 | 腾讯 | 今天 | 🟡 待查看 |\n`;
          recordMsg += `| 产品经理 | 快手 | 今天 | 🟡 待查看 |\n`;
          recordMsg += `| 高级产品经理 | B站 | 今天 | 🟡 待查看 |\n\n`;
          recordMsg += `---\n\n**状态说明**：\n`;
          recordMsg += `• 🟡 待查看 - HR 尚未查看您的简历\n`;
          recordMsg += `• 🟢 已查看 - HR 已查看，等待进一步反馈\n`;
          recordMsg += `• 🔵 邀请面试 - 已收到面试邀请\n`;
          recordMsg += `• 🔴 未通过 - 本次投递未通过筛选\n\n`;
          recordMsg += `---\n\n📊 **查看更详细的投递进度和 AI 对接队列**\n\n`;
          recordMsg += `[[LINK:前往工作台查看详情:/workbench:📊]]`;
          
          addJobMsg(recordMsg, 'assistant');
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 如果已完成且正在搜索，不处理
      if (jobSearchMode.completed && jobSearchMode.isSearching) {
        setTimeout(() => {
          addJobMsg(`⏳ AI 求职代理正在工作中，请稍候...\n\n正在为您分析和投递合适的岗位。`, 'assistant');
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 检测开始
      if (jobSearchMode.currentQuestion === 0 && (userMessage.includes('开始') || userMessage.includes('Start') || userMessage.includes('好'))) {
        setTimeout(() => {
          const firstQ = jobSearchQuestions[0];
          let qMsg = `📝 **求职偏好调查开始！**\n\n---\n\n**第 1 题 / 共 ${jobSearchQuestions.length} 题**\n\n${firstQ.question}\n\n`;
          firstQ.options.forEach(opt => {
            qMsg += `**${opt.label}.** ${opt.text}\n\n`;
          });
          qMsg += `\n请输入您的选择（A/B/C/D）`;
          
          addJobMsg(qMsg, 'assistant');
          setJobSearchMode(prev => ({ ...prev, currentQuestion: 1 }));
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 处理答案
      const answerMatch = userMessage.toUpperCase().match(/^[ABCD]$/);
      if (answerMatch && jobSearchMode.currentQuestion > 0 && !jobSearchMode.completed) {
        const answer = answerMatch[0];
        const currentQ = jobSearchQuestions[jobSearchMode.currentQuestion - 1];
        const selectedOption = currentQ.options.find(opt => opt.label === answer);
        
        if (selectedOption) {
          const newAnswer = {
            question: currentQ.question,
            answer: selectedOption.text,
            key: currentQ.key
          };
          
          const newAnswers = [...jobSearchMode.answers, newAnswer];
          
          setTimeout(async () => {
            if (jobSearchMode.currentQuestion < jobSearchQuestions.length) {
              // 继续下一题
              const nextQ = jobSearchQuestions[jobSearchMode.currentQuestion];
              let qMsg = `✅ 已记录：**${selectedOption.text}**\n\n---\n\n**第 ${jobSearchMode.currentQuestion + 1} 题 / 共 ${jobSearchQuestions.length} 题**\n\n${nextQ.question}\n\n`;
              nextQ.options.forEach(opt => {
                qMsg += `**${opt.label}.** ${opt.text}\n\n`;
              });
              qMsg += `\n请输入您的选择（A/B/C/D）`;
              
              addJobMsg(qMsg, 'assistant');
              setJobSearchMode(prev => ({
                ...prev,
                currentQuestion: prev.currentQuestion + 1,
                answers: newAnswers
              }));
            } else {
              // 偏好收集完成，保存到memory
              const keyLabel: Record<string, string> = {
                'job_type': '工作类型',
                'salary_expectation': '期望薪资',
                'work_location': '工作地点',
                'company_size': '公司规模',
                'industry_preference': '行业偏好',
                'remote_preference': '远程办公',
                'start_time': '入职时间',
                'overtime_attitude': '加班态度',
                'travel_requirement': '出差接受度',
                'career_focus': '职业关注点'
              };
              
              let preferenceSummary = `【求职偏好信息】\n`;
              newAnswers.forEach(a => {
                preferenceSummary += `${keyLabel[a.key] || a.key}: ${a.answer}\n`;
              });
              
              // 保存到Memory
              try {
                await createMemory({
                  type: 'preference',
                  content: preferenceSummary,
                  importance: 'High',
                  scope: 'candidate'
                }, userId);
                console.log('[JobSearch] 求职偏好已保存到 Memory');
              } catch (err) {
                console.error('[JobSearch] 保存求职偏好失败:', err);
              }
              
              // 显示偏好汇总
              let completionMsg = `🎉 **求职偏好收集完成！**\n\n---\n\n## 📋 您的求职偏好汇总\n\n`;
              newAnswers.forEach(a => {
                completionMsg += `• **${keyLabel[a.key] || a.key}**: ${a.answer}\n`;
              });
              completionMsg += `\n---\n\n✅ 偏好已保存到您的档案！`;
              
              addJobMsg(completionMsg, 'assistant');
              
              setJobSearchMode(prev => ({
                ...prev,
                answers: newAnswers,
                completed: true,
                isSearching: true
              }));
              
              // 更新任务进度
              if (selectedTask) {
                try {
                  await updateTodo(selectedTask.id, { progress: 30, status: 'IN_PROGRESS' });
                  if (typeof refetchTasks === 'function') {
                    refetchTasks();
                  }
                } catch (err) {
                  console.error('[JobSearch] 更新任务进度失败:', err);
                }
              }
              
              // 获取用户会员等级
              const userMembership = 'pro'; // 实际应从用户数据获取：'basic' | 'pro' | 'ultra'
              const membershipConfig: Record<string, {name: string; days: number; color: string}> = {
                'basic': { name: 'Devnors 1.0', days: 1, color: 'slate' },
                'pro': { name: 'Devnors 1.0 Pro', days: 7, color: 'indigo' },
                'ultra': { name: 'Devnors 1.0 Ultra', days: 30, color: 'amber' }
              };
              const membership = membershipConfig[userMembership] || membershipConfig['basic'];
              
              // 启动云端轮巡任务
              setTimeout(async () => {
                const startTime = new Date();
                const endTime = new Date(startTime.getTime() + membership.days * 24 * 60 * 60 * 1000);
                
                // 检查是否已在云端轮巡任务中
                const isInCloudTask = selectedTask?.title?.includes('云端求职轮巡');
                const taskTitle = selectedTask?.title || '云端求职轮巡';
                
                // 更新当前任务状态为运行中
                if (selectedTask) {
                  try {
                    await updateTodo(selectedTask.id, { progress: 10, status: 'RUNNING' });
                    if (typeof refetchTasks === 'function') {
                      refetchTasks();
                    }
                  } catch (err) {
                    console.error('[JobSearch] 更新任务状态失败:', err);
                  }
                }
                
                let taskStartedMsg = `🚀 **${isInCloudTask ? '云端轮巡任务已启动' : '智能求职任务已启动'}！**\n\n`;
                taskStartedMsg += `---\n\n## 📋 任务详情\n\n`;
                taskStartedMsg += `| 项目 | 内容 |\n`;
                taskStartedMsg += `|------|------|\n`;
                taskStartedMsg += `| 任务名称 | **${taskTitle}** |\n`;
                taskStartedMsg += `| 会员等级 | **${membership.name}** |\n`;
                taskStartedMsg += `| 轮巡周期 | **${membership.days} 天** |\n`;
                taskStartedMsg += `| 开始时间 | ${startTime.toLocaleString('zh-CN')} |\n`;
                taskStartedMsg += `| 结束时间 | ${endTime.toLocaleString('zh-CN')} |\n`;
                taskStartedMsg += `| 任务状态 | 🟢 运行中 |\n\n`;
                taskStartedMsg += `---\n\n## 🤖 AI 求职代理工作模式\n\n`;
                taskStartedMsg += `您的 AI 求职代理将在云端 **24小时不间断** 为您工作：\n\n`;
                taskStartedMsg += `• ⏰ **每小时** 扫描全网新增岗位\n`;
                taskStartedMsg += `• 🎯 **自动筛选** 匹配度 ≥ 85% 的岗位\n`;
                taskStartedMsg += `• 📤 **自动投递** 符合条件的岗位\n`;
                taskStartedMsg += `• 🔔 **实时通知** 投递结果和面试邀请\n\n`;
                taskStartedMsg += `---\n\n## 📊 预计效果\n\n`;
                taskStartedMsg += `根据您的简历和偏好，预计 ${membership.days} 天内：\n\n`;
                taskStartedMsg += `• 扫描岗位：**${membership.days * 50}+** 个\n`;
                taskStartedMsg += `• 智能投递：**${membership.days * 5}-${membership.days * 10}** 个\n`;
                taskStartedMsg += `• 面试邀请：**${Math.ceil(membership.days * 1.5)}-${membership.days * 3}** 个（预估）\n\n`;
                taskStartedMsg += `---\n\n💡 **温馨提示**：\n`;
                taskStartedMsg += `• 任务运行期间，请保持手机畅通以接收面试邀请\n`;
                taskStartedMsg += `• 您可以随时输入「暂停轮巡」暂停任务\n`;
                taskStartedMsg += `• 输入「查看进度」可查看实时投递进度\n`;
                taskStartedMsg += `• 输入「修改偏好」可更新求职偏好\n\n`;
                taskStartedMsg += `---\n\n🚀 **任务已开始运行，AI 正在为您搜索合适的岗位...**`;
                
                addJobMsg(taskStartedMsg, 'assistant');
                
                // 模拟首次投递结果
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                let firstBatchMsg = `📬 **首轮投递完成！**\n\n`;
                firstBatchMsg += `---\n\n### ✅ 本轮投递 (${new Date().toLocaleTimeString('zh-CN')})\n\n`;
                firstBatchMsg += `| 岗位 | 公司 | 匹配度 | 状态 |\n`;
                firstBatchMsg += `|------|------|--------|------|\n`;
                firstBatchMsg += `| 高级产品经理 | 字节跳动 | 94% | ✅ 已投递 |\n`;
                firstBatchMsg += `| 产品负责人 | 阿里巴巴 | 91% | ✅ 已投递 |\n`;
                firstBatchMsg += `| 产品经理 | 美团 | 88% | ✅ 已投递 |\n`;
                firstBatchMsg += `| 产品经理 | 腾讯 | 85% | ✅ 已投递 |\n\n`;
                firstBatchMsg += `---\n\n⏰ **下次轮巡**: 1小时后\n\n`;
                firstBatchMsg += `💰 **本次消耗**: 200 Token\n\n`;
                firstBatchMsg += `---\n\n🔔 AI 将持续在云端为您工作，有新的投递或面试邀请会立即通知您！`;
                
                addJobMsg(firstBatchMsg, 'assistant');
                
                // 更新任务进度（不设为完成，因为是长期运行的任务）
                if (selectedTask) {
                  try {
                    await updateTodo(selectedTask.id, { progress: 25 });
                    if (typeof refetchTasks === 'function') {
                      refetchTasks();
                    }
                  } catch (err) {
                    console.error('[JobSearch] 更新任务进度失败:', err);
                  }
                }
                
                setJobSearchMode(prev => ({
                  ...prev,
                  isSearching: false,
                  tokenUsed: 200
                }));
                setIsTyping(false);
              }, 3000);
            }
            setIsTyping(false);
          }, 500);
          return;
        }
      }
      
      // 无效输入
      setTimeout(() => {
        if (jobSearchMode.currentQuestion === 0) {
          addJobMsg(`请输入「开始」来开始求职偏好调查。`, 'assistant');
        } else if (!jobSearchMode.completed) {
          addJobMsg(`请输入有效的选项（A/B/C/D）来回答当前问题。`, 'assistant');
        }
        setIsTyping(false);
      }, 500);
      return;
    }
    
    // 完善认证模式处理
    if (verificationMode.active) {
      setInputMessage('');
      
      // 添加用户消息
      const addUserMessage = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'user' as const, content}]);
        }
      };
      
      // 添加 AI 消息
      const addAssistantMsg = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'assistant' as const, content}]);
        }
      };
      
      addUserMessage(userMessage);
      setIsTyping(true);
      
      const currentIndex = verificationMode.currentIndex;
      const currentItem = verificationMode.items[currentIndex];
      const totalItems = verificationMode.items.length;
      const completedCount = verificationMode.completedItems.length;
      
      // 判断是否是身份证认证项
      const isIdentityItem = currentItem?.key === 'identity_front' || currentItem?.key === 'identity_back';
      
      // 用户选择跳过
      if (userMessage.includes('跳过')) {
        // 身份认证不能跳过
        if (isIdentityItem) {
          setTimeout(() => {
            addAssistantMsg(`⚠️ **身份认证是必填项**，不能跳过。\n\n身份认证是所有认证的基础，后续认证需要与身份证姓名进行核对。\n\n📷 请点击下方 **「上传证件」** 按钮上传身份证照片。`);
            setIsTyping(false);
          }, 500);
          return;
        }
        
        // 其他认证可以跳过
        setTimeout(async () => {
          const nextIndex = currentIndex + 1;
          
          if (nextIndex >= totalItems) {
            // 所有认证项都已处理
            addAssistantMsg(`⏭️ 已跳过「${currentItem.label}」\n\n---\n\n📋 **认证流程结束**\n\n✅ 已完成：${completedCount} 项认证\n\n${completedCount > 0 ? '🎉 您已完成部分认证！已认证的信息将显示在您的个人主页。' : '💡 您可以随时返回完成认证，提高求职竞争力。'}\n\n👉 前往 [设置 - 个人认证信息](/settings?tab=PersonalVerification) 查看详情\n\n还有什么我可以帮您的吗？`);
            setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
            
            // 更新任务为完成（100%）
            if (selectedTask) {
              try {
                const { updateTodo } = await import('./services/apiService');
                await updateTodo(selectedTask.id, { 
                  progress: 100, 
                  status: 'completed' 
                });
                if (typeof refetchTasks === 'function') {
                  refetchTasks();
                }
              } catch (updateError) {
                console.error('更新任务状态失败:', updateError);
              }
            }
          } else {
            // 继续下一项
            const nextItem = verificationMode.items[nextIndex];
            addAssistantMsg(`⏭️ 已跳过「${currentItem.label}」\n\n---\n\n📋 **认证进度：** ${completedCount}/${totalItems} 项\n\n${nextItem.icon} **第 ${nextIndex + 1} 项：${nextItem.label}**\n\n${nextItem.description}`);
            setVerificationMode(prev => ({
              ...prev,
              currentIndex: nextIndex
            }));
          }
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 用户选择退出
      if (userMessage.includes('退出') || userMessage.includes('取消') || userMessage.includes('稍后')) {
        // 身份认证阶段不能退出
        if (isIdentityItem) {
          setTimeout(() => {
            addAssistantMsg(`⚠️ **身份认证是必填项**，请先完成身份认证。\n\n📷 请点击下方 **「上传证件」** 按钮上传身份证照片。`);
            setIsTyping(false);
          }, 500);
          return;
        }
        
        setTimeout(() => {
          addAssistantMsg(`好的，您可以稍后继续完成认证。\n\n✅ 已完成：${completedCount} 项\n\n💡 完成认证可以大幅提高求职成功率！\n\n还有什么我可以帮您的吗？`);
          setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 处理用户输入的认证信息
      setTimeout(async () => {
        try {
          // 检查当前认证项是否需要图片上传
          if (currentItem && currentItem.needsImage) {
            // 需要图片上传的项目，提示用户点击上传按钮
            addAssistantMsg(`📷 **请点击左下角的「上传证件」按钮上传您的${currentItem.label}图片**\n\n${currentItem.description}`);
            setIsTyping(false);
            return;
          }
          
          // 不需要图片的认证项（如征信认证）
          let success = false;
          let savedInfo = '';
          
          if (currentItem.key === 'credit') {
            // 征信认证：只需要授权
            if (userMessage.includes('授权') || userMessage.includes('同意') || userMessage.includes('确认')) {
              success = true;
              savedInfo = '已授权征信查询';
            }
          }
          
          if (success) {
            const newCompletedItems = [...verificationMode.completedItems, currentItem.key];
            const nextIndex = currentIndex + 1;
            
            // 保存认证信息到数据库并更新任务进度
            try {
              const { createPersonalCertification, updateTodo } = await import('./services/apiService');
              
              // 保存认证信息
              const certData = {
                name: currentItem.key === 'credit' ? '征信认证' : currentItem.label,
                organization: '系统认证',
                cert_date: new Date().toISOString().split('T')[0],
                category: currentItem.key,
                color: 'orange',
                icon: 'FileCheck'
              };
              await createPersonalCertification(certData, userId);
              console.log(`[Certification] 已保存${currentItem.label}到数据库`);
              
              // 更新任务进度
              if (selectedTask) {
                const progress = Math.round((newCompletedItems.length / totalItems) * 100);
                const taskStatus = progress >= 100 ? 'completed' : 'in_progress';
                await updateTodo(selectedTask.id, { 
                  progress, 
                  status: taskStatus 
                });
                console.log(`[Task Progress] 任务进度更新为 ${progress}%`);
                
                // 刷新任务列表
                if (typeof refetchTasks === 'function') {
                  refetchTasks();
                }
              }
            } catch (saveError) {
              console.error('保存认证信息失败:', saveError);
            }
            
            if (nextIndex >= totalItems) {
              // 所有认证项都已完成
              addAssistantMsg(`✅ **${currentItem.label}认证成功！**\n\n${savedInfo}\n\n---\n\n🎉 **恭喜！您已完成全部认证！**\n\n✅ 已完成：${newCompletedItems.length}/${totalItems} 项\n\n您的认证信息已保存，这将大幅提升您的求职竞争力！\n\n👉 前往 [设置 - 个人认证信息](/settings?tab=PersonalVerification) 查看详情\n\n还有什么我可以帮您的吗？`);
              setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
            } else {
              // 继续下一项
              const nextItem = verificationMode.items[nextIndex];
              addAssistantMsg(`✅ **${currentItem.label}认证成功！**\n\n${savedInfo}\n\n---\n\n📋 **认证进度：** ${newCompletedItems.length}/${totalItems} 项\n\n${nextItem.icon} **第 ${nextIndex + 1} 项：${nextItem.label}**\n\n${nextItem.description}`);
              setVerificationMode(prev => ({
                ...prev,
                currentIndex: nextIndex,
                completedItems: newCompletedItems
              }));
            }
          } else {
            // 输入格式不正确
            addAssistantMsg(`⚠️ 请按照以下提示操作：\n\n${currentItem.description}`);
          }
          
          setIsTyping(false);
        } catch (error) {
          console.error('处理认证信息失败:', error);
          addAssistantMsg(`抱歉，处理认证信息时出现问题，请稍后再试。`);
          setIsTyping(false);
        }
      }, 800);
      
      return;
    }
    
    // 企业认证模式处理
    if (enterpriseVerificationMode.active) {
      setInputMessage('');
      
      const addUserMsg = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'user' as const, content}]);
        }
      };
      
      const addAssistantMsg = (content: string) => {
        if (selectedTask) {
          setTaskMessages(prev => ({
            ...prev,
            [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
          }));
        } else {
          setGeneralMessages(prev => [...prev, {role: 'assistant' as const, content}]);
        }
      };
      
      addUserMsg(userMessage);
      setIsTyping(true);
      
      const currentIndex = enterpriseVerificationMode.currentIndex;
      const currentItem = enterpriseVerificationItems[currentIndex];
      const totalItems = enterpriseVerificationItems.length;
      const completedCount = enterpriseVerificationMode.completedItems.length;
      
      // 检查 currentItem 是否有效
      if (!currentItem) {
        console.error('[handleSendMessage] Enterprise verification currentItem is undefined, currentIndex:', currentIndex);
        setTimeout(() => {
          addAssistantMsg(`⚠️ 当前认证项无效，请刷新页面后重试。`);
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 用户选择跳过
      if (userMessage.includes('跳过')) {
        // 营业执照不能跳过
        if (currentItem.required) {
          setTimeout(() => {
            addAssistantMsg(`⚠️ **${currentItem.label}是必填项**，不能跳过。\n\n营业执照是企业认证的基础，后续认证需要与营业执照信息进行核对。\n\n📷 请点击下方 **「上传证件」** 按钮上传营业执照照片。`);
            setIsTyping(false);
          }, 500);
          return;
        }
        
        // 其他认证可以跳过
        setTimeout(async () => {
          const nextIndex = currentIndex + 1;
          
          if (nextIndex >= totalItems) {
            addAssistantMsg(`⏭️ 已跳过「${currentItem.label}」\n\n---\n\n📋 **企业认证流程结束**\n\n✅ 已完成：${completedCount} 项认证\n\n${completedCount > 0 ? '🎉 您的企业已完成部分认证！已认证的信息将显示在企业主页。' : '💡 您可以随时返回完成认证，提高招聘效果。'}\n\n👉 前往 [设置 - 企业认证信息](/settings?tab=Verification) 查看详情\n\n还有什么我可以帮您的吗？`);
            setEnterpriseVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
            
            if (selectedTask) {
              try {
                const { updateTodo } = await import('./services/apiService');
                await updateTodo(selectedTask.id, { progress: 100, status: 'completed' });
                if (typeof refetchTasks === 'function') refetchTasks();
              } catch (e) {
                console.error('更新任务状态失败:', e);
              }
            }
          } else {
            const nextItem = enterpriseVerificationItems[nextIndex];
            addAssistantMsg(`⏭️ 已跳过「${currentItem.label}」\n\n---\n\n📋 **认证进度：** ${completedCount}/${totalItems} 项\n\n${nextItem.icon} **第 ${nextIndex + 1} 项：${nextItem.label}**\n\n${nextItem.description}`);
            setEnterpriseVerificationMode(prev => ({ ...prev, currentIndex: nextIndex }));
          }
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 用户选择退出
      if (userMessage.includes('退出') || userMessage.includes('取消') || userMessage.includes('稍后')) {
        // 检查是否所有必填项都已完成
        const completedItems = enterpriseVerificationMode.completedItems;
        const requiredItems = enterpriseVerificationItems.filter(item => item.required);
        const allRequiredCompleted = requiredItems.every(item => completedItems.includes(item.key));
        
        if (!allRequiredCompleted) {
          // 找出未完成的必填项
          const incompleteRequired = requiredItems.filter(item => !completedItems.includes(item.key));
          const incompleteList = incompleteRequired.map(item => `• ${item.label}`).join('\n');
          setTimeout(() => {
            addAssistantMsg(`⚠️ **请先完成所有必填认证项**\n\n以下认证项为必填：\n${incompleteList}\n\n📷 请点击下方 **「上传证件」** 按钮上传证件照片。`);
            setIsTyping(false);
          }, 500);
          return;
        }
        
        setTimeout(() => {
          addAssistantMsg(`📋 **已暂停企业认证**\n\n当前进度：${completedCount}/${totalItems} 项\n\n您可以随时返回继续完成认证。已完成的认证信息会自动保存。\n\n还有什么我可以帮您的吗？`);
          setEnterpriseVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
          setIsTyping(false);
        }, 500);
        return;
      }
      
      // 提示上传图片
      setTimeout(() => {
        addAssistantMsg(`📷 请点击下方 **「上传证件」** 按钮上传 **${currentItem.label}** 图片。\n\n${currentItem.description}`);
        setIsTyping(false);
      }, 500);
      return;
    }
    
    // 普通消息处理
    if (selectedTask) {
      setTaskMessages(prev => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'user', content: userMessage}]
      }));
    } else {
      setGeneralMessages(prev => [...prev, {role: 'user', content: userMessage}]);
    }
    
    setInputMessage('');
    setIsTyping(true);
    
    try {
      const taskTitle = selectedTask?.title || selectedTask?.task || '';
      const result = await chatWithAI({
        message: userMessage,
        history: currentMessages.map(m => ({role: m.role, content: m.content})),
        model: selectedModel,
        context: selectedTask ? `当前任务是：${taskTitle}。任务描述：${selectedTask?.description || ''}` : undefined,
      });
      
      const aiResponse = {role: 'assistant' as const, content: result.response};
      
      if (selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), aiResponse]
        }));
      } else {
        setGeneralMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('AI 聊天失败:', error);
      const errorResponse = {role: 'assistant' as const, content: `抱歉，处理您的请求时出现问题。请稍后再试。`};
      
      if (selectedTask) {
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), errorResponse]
        }));
      } else {
        setGeneralMessages(prev => [...prev, errorResponse]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // 添加 AI 消息的辅助函数（组件级别）
  const addFileUploadMessage = (content: string) => {
    if (selectedTask) {
      setTaskMessages(prev => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] || []), {role: 'assistant' as const, content}]
      }));
    } else {
      setGeneralMessages(prev => [...prev, {role: 'assistant' as const, content}]);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'md'];
    
    if (!allowedExtensions.includes(fileExtension || '')) {
      addFileUploadMessage('❌ 不支持的文件格式。请上传 PDF、Word (.doc/.docx) 或文本文件 (.txt/.md)。');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // 检查文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addFileUploadMessage('❌ 文件过大，请上传不超过 10MB 的文件。');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setUploadingFile(true);
    addFileUploadMessage(`📎 正在解析文件：**${file.name}**...\n\n请稍候，正在使用 AI 提取简历内容...`);
    
    try {
      // 调用后端 API 解析文件
      const { parseResumeFile, autoFillProfileFromResume } = await import('./services/apiService');
      const result = await parseResumeFile(file);
      
      if (result.success && result.content) {
        addFileUploadMessage(`✅ **文件解析成功！**\n\n📄 文件：${result.filename}\n📊 提取了 ${result.char_count} 个字符\n\n🤖 正在智能分析简历，自动填充您的个人资料...`);
        
        // 自动填充用户资料
        if (userId) {
          try {
            const fillResult = await autoFillProfileFromResume(userId, result.content);
            
            if (fillResult.success) {
              // 构建成功消息
              let successMsg = `🎉 **简历智能解析完成！**\n\n`;
              successMsg += `📊 **简历完善度：${fillResult.completeness}%**\n\n`;
              
              if (fillResult.updates_made.length > 0) {
                successMsg += `✅ **已自动填充以下信息：**\n`;
                fillResult.updates_made.forEach(field => {
                  successMsg += `• ${field}\n`;
                });
                successMsg += `\n`;
              }
              
              if (fillResult.memories_created.length > 0) {
                successMsg += `💾 **已保存到记忆中心：**\n`;
                fillResult.memories_created.forEach(mem => {
                  successMsg += `• ${mem}\n`;
                });
                successMsg += `\n`;
              }
              
              // 根据完善度显示不同的引导
              if (fillResult.completeness >= 100) {
                successMsg += `---\n\n`;
                successMsg += `您可以：\n`;
                successMsg += `• 前往 [个人主页](/candidate/profile) 查看和编辑资料\n`;
                successMsg += `• 前往 [记忆中心](/candidate/memory) 管理您的记忆\n\n`;
                successMsg += `完成个人认证信息，提高求职机会：\n\n`;
                successMsg += `[[TASK:完善个人认证信息:personal_verification:🔐]]`;
                addFileUploadMessage(successMsg);
              } else {
                // 完善度不到100%，继续引导用户完善
                successMsg += `---\n\n`;
                successMsg += `📝 继续完善剩余信息，提高匹配度...\n`;
                addFileUploadMessage(successMsg);
                
                // 延迟启动引导流程
                setTimeout(() => {
                  startProfileCompleteGuide(!!selectedTask);
                }, 1000);
              }
              
              // 刷新任务进度
              await calculateProfileTaskProgress();
              
              // 如果完善度达到100%，标记任务完成
              if (fillResult.completeness >= 100 && selectedTask) {
                const taskTitle = selectedTask.title || selectedTask.task || '';
                const taskType = selectedTask.todo_type || selectedTask.type || '';
                const isProfileTask = taskType === 'profile_complete' || 
                  taskTitle === '完善简历资料';
                
                if (isProfileTask && selectedTask.status !== 'completed') {
                  const { updateTodo, createTodo, getTasks } = await import('./services/apiService');
                  await updateTodo(selectedTask.id, { status: 'completed', progress: 100 });
                  
                  // 检查是否已存在"完善个人认证信息"任务
                  if (userId) {
                    const existingTasks = await getTasks(userId);
                    const hasVerificationTask = existingTasks.some((t: any) => 
                      t.todo_type === 'personal_verification' || 
                      t.title === '完善个人认证信息' ||
                      (t.title.includes('完善') && t.title.includes('认证'))
                    );
                    
                    if (!hasVerificationTask) {
                      // 创建"完善个人认证信息"任务
                      const verificationTaskData = {
                        title: '完善个人认证信息',
                        description: '完成身份认证、学历认证、技能认证、工作证明等，提升求职竞争力，增加面试机会',
                        priority: 'high',
                        source: 'agent',
                        todo_type: 'personal_verification',
                        ai_advice: '完成个人认证可以大幅提升您的可信度和求职成功率。建议优先完成身份认证和学历认证。',
                        steps: [
                          { order: 1, title: '完成身份认证', status: 'pending' },
                          { order: 2, title: '完成学历认证', status: 'pending' },
                          { order: 3, title: '完成职业资格认证', status: 'pending' },
                          { order: 4, title: '完成征信认证', status: 'pending' }
                        ]
                      };
                      
                      await createTodo(verificationTaskData, userId);
                      console.log('[Verification Task] 已自动创建个人认证任务');
                    }
                  }
                  
                  if (typeof refetchTasks === 'function') {
                    refetchTasks();
                  }
                }
              }
            } else {
              addFileUploadMessage(`⚠️ 自动填充部分失败，您可以手动完善资料。\n\n简历内容已填入下方输入框，点击发送可继续分析。`);
              setInputMessage(result.content.substring(0, 5000));
            }
          } catch (fillError: any) {
            console.error('自动填充失败:', fillError);
            addFileUploadMessage(`⚠️ 自动填充失败：${fillError.message}\n\n简历内容已填入下方输入框，您可以手动完善资料。`);
            setInputMessage(result.content.substring(0, 5000));
          }
        } else {
          // 未登录，只填入输入框
          setInputMessage(result.content.substring(0, 5000));
          addFileUploadMessage(`✅ 文件解析成功！\n\n请先登录后再上传简历，系统将自动填充您的个人资料。`);
        }
      } else {
        addFileUploadMessage('❌ 文件内容为空，请检查文件后重试。');
      }
    } catch (error: any) {
      console.error('文件解析失败:', error);
      addFileUploadMessage(`❌ 文件解析失败：${error.message || '未知错误'}\n\n请尝试直接复制粘贴简历内容到输入框。`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 处理证件图片上传和 AI 审核
  const handleCertImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 检查是否处于个人认证模式或企业认证模式
    const isPersonalVerification = verificationMode.active;
    const isEnterpriseVerification = enterpriseVerificationMode.active;
    
    if (!isPersonalVerification && !isEnterpriseVerification) {
      if (certImageInputRef.current) certImageInputRef.current.value = '';
      return;
    }
    
    // 根据认证模式获取当前项
    const currentIndex = isPersonalVerification ? verificationMode.currentIndex : enterpriseVerificationMode.currentIndex;
    const currentItem = isPersonalVerification ? verificationMode.items[currentIndex] : enterpriseVerificationItems[currentIndex];
    const totalItems = isPersonalVerification ? verificationMode.items.length : enterpriseVerificationItems.length;
    
    // 检查 currentItem 是否有效
    if (!currentItem) {
      console.error('[handleCertImageUpload] currentItem is undefined, currentIndex:', currentIndex);
      addCertImageMessage(`❌ 图片处理失败\n\n当前认证项无效，请刷新页面后重试。`);
      if (certImageInputRef.current) certImageInputRef.current.value = '';
      return;
    }
    
    // 检查文件类型
    const fileType = file.type;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(fileType)) {
      addCertImageMessage(`❌ 不支持的图片格式。请上传 JPG 或 PNG 格式的图片。`);
      if (certImageInputRef.current) certImageInputRef.current.value = '';
      return;
    }
    
    // 检查文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addCertImageMessage(`❌ 图片过大，请上传不超过 10MB 的图片。`);
      if (certImageInputRef.current) certImageInputRef.current.value = '';
      return;
    }
    
    setUploadingCertImage(true);
    
    // 添加用户上传图片的消息
    addCertImageMessage(`📤 正在上传证件图片：**${file.name}**...`);
    
    try {
      // 获取图片信息用于显示
      const fileSizeKB = (file.size / 1024).toFixed(1);
      
      // 添加图片信息消息
      addCertImageMessage(`🖼️ **已收到图片，正在使用 AI OCR 审核...**\n\n📄 文件：${file.name}\n📊 大小：${fileSizeKB} KB\n🔍 状态：AI 正在识别证件内容...`);
      
      setIsTyping(true);
      
      // 读取图片为 base64
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // 移除 data URL 前缀，只保留 base64 数据
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // 调用后端 OCR API 进行真正的图片内容识别
      const { certOCRReview } = await import('./services/apiService');
      const ocrResult = await certOCRReview(imageBase64, currentItem.key as 'education' | 'skill_driver' | 'skill_cert' | 'work' | 'identity_front' | 'identity_back' | 'credit_fund' | 'credit_social' | 'business_license' | 'org_code' | 'tax_registration' | 'legal_person_id' | 'legal_person_id_front' | 'legal_person_id_back' | 'qualification' | 'enterprise_credit', userId);
      
      // 转换 OCR 结果格式
      const reviewResult = {
        success: ocrResult.success,
        reason: ocrResult.reason,
        extractedInfo: ocrResult.extracted_info,
        detectedSide: ocrResult.detected_side as 'front' | 'back' | undefined
      };
      
      if (reviewResult.success) {
        // 审核通过（后端已验证姓名一致性）
        
        // ========== 企业认证处理分支 ==========
        if (isEnterpriseVerification) {
          const nextIndex = currentIndex + 1;
          const newCompletedItems = [...enterpriseVerificationMode.completedItems, currentItem.key];
          
          try {
            const { updateTodo, createEnterpriseCertification } = await import('./services/apiService');
            
            // 根据当前项构建认证数据
            const certData: any = {
              name: currentItem.label,
              organization: '系统认证',
              category: 'qualification',
              cert_date: new Date().toISOString().split('T')[0],
              color: 'blue',
              icon: 'Building2'
            };
            
            // 根据提取的信息填充数据
            if (reviewResult.extractedInfo) {
              if (currentItem.key === 'business_license') {
                // 营业执照 - 保存详细信息
                const companyName = reviewResult.extractedInfo['企业名称'] || reviewResult.extractedInfo['公司名称'] || '营业执照';
                const legalRepresentative = reviewResult.extractedInfo['法定代表人'] || '';
                certData.name = `营业执照 - ${companyName}`;
                certData.organization = legalRepresentative || '系统认证';
                
                // 保存营业执照专用字段
                certData.credit_code = reviewResult.extractedInfo['统一社会信用代码'] || '';
                certData.valid_period = reviewResult.extractedInfo['有效期'] || reviewResult.extractedInfo['经营期限'] || '';
                certData.business_address = reviewResult.extractedInfo['住所'] || reviewResult.extractedInfo['地址'] || '';
                certData.registered_capital = reviewResult.extractedInfo['注册资本'] || '';
                certData.business_scope = reviewResult.extractedInfo['经营范围'] || '';
                
                // 保存原始图片用于后台查看
                certData.image_data = imageBase64;
                
                // 保存企业名称和法定代表人到状态（法定代表人用于后续校验身份证）
                setEnterpriseVerificationMode(prev => ({
                  ...prev,
                  companyName: companyName,
                  legalRepresentative: legalRepresentative
                }));
              } else if (currentItem.key === 'legal_person_id_front') {
                // 法人身份证正面 - 校验姓名与营业执照法定代表人是否一致
                const idName = reviewResult.extractedInfo['姓名'] || '';
                const idNumber = reviewResult.extractedInfo['身份证号'] || '';
                const legalRepresentative = enterpriseVerificationMode.legalRepresentative || '';
                
                // 校验姓名一致性
                if (legalRepresentative && idName && legalRepresentative !== idName) {
                  // 姓名不一致，拒绝审核
                  addCertImageMessage(`❌ **法人身份证审核未通过！**\n\n**原因：身份证姓名与营业执照法定代表人不一致**\n\n• 营业执照法定代表人：**${legalRepresentative}**\n• 身份证姓名：**${idName}**\n\n请上传与营业执照法定代表人一致的身份证照片。\n\n📷 点击下方 **「上传证件」** 按钮重新上传。`);
                  setIsTyping(false);
                  setUploadingCertImage(false);
                  if (certImageInputRef.current) certImageInputRef.current.value = '';
                  return;
                }
                
                // 将正面信息暂存到状态
                setEnterpriseVerificationMode(prev => ({
                  ...prev,
                  legalPersonIdFront: {
                    name: idName,
                    idNumber: idNumber,
                    imageData: imageBase64
                  }
                }));
                
                // 正面不创建数据库记录，标记为跳过保存
                certData._skipSave = true;
              } else if (currentItem.key === 'legal_person_id_back') {
                // 法人身份证背面 - 合并正面信息创建完整记录
                const frontInfo = enterpriseVerificationMode.legalPersonIdFront;
                const authority = reviewResult.extractedInfo['签发机关'] || '公安机关';
                const validPeriod = reviewResult.extractedInfo['有效期'] || reviewResult.extractedInfo['有效期限'] || '';
                
                certData.name = `法人身份证 - ${frontInfo?.name || '已认证'}`;
                certData.organization = '身份证认证';
                certData.id_card_name = frontInfo?.name || '';
                certData.id_card_number = frontInfo?.idNumber || '';
                certData.id_card_authority = authority;
                certData.id_card_valid_period = validPeriod;
                certData.image_data_front = frontInfo?.imageData || '';
                certData.image_data_back = imageBase64;
              } else {
                // 其他证件
                certData.name = currentItem.label;
                Object.keys(reviewResult.extractedInfo).forEach(key => {
                  if (key.includes('名称') || key.includes('公司')) {
                    certData.name = `${currentItem.label} - ${reviewResult.extractedInfo[key]}`;
                  }
                });
              }
            }
            
            // 尝试保存到数据库（如果API存在的话，且不是跳过保存的情况）
            if (!certData._skipSave) {
              try {
                await createEnterpriseCertification(certData, userId);
                console.log('[Enterprise Cert] 已保存企业认证到数据库');
              } catch (saveErr) {
                console.warn('[Enterprise Cert] 保存认证失败（API可能未实现）:', saveErr);
              }
            } else {
              console.log('[Enterprise Cert] 跳过保存（等待后续步骤合并）');
            }
            
            // 构建成功消息
            let successMessage = `✅ **${currentItem.label}审核通过！**\n\n`;
            if (reviewResult.extractedInfo) {
              successMessage += `📋 **识别到的信息：**\n`;
              Object.entries(reviewResult.extractedInfo).forEach(([key, value]) => {
                successMessage += `• ${key}：${value}\n`;
              });
              successMessage += `\n`;
            }
            
            // 检查是否完成所有认证
            if (nextIndex >= enterpriseVerificationItems.length) {
              // 认证全部完成
              successMessage += `---\n\n🎉 **恭喜！企业认证已全部完成！**\n\n`;
              successMessage += `✅ 已完成：${newCompletedItems.length}/${enterpriseVerificationItems.length} 项\n\n`;
              successMessage += `您的企业已通过认证，这将大幅提升招聘效果！\n\n`;
              successMessage += `接下来，请完善企业资料以获得更好的招聘效果：\n\n`;
              successMessage += `[[TASK:完善企业资料:enterprise_profile:📋]]`;
              
              addCertImageMessage(successMessage);
              
              setEnterpriseVerificationMode(prev => ({
                ...prev,
                currentIndex: nextIndex,
                completedItems: newCompletedItems
              }));
              
              // 更新任务为完成状态
              if (selectedTask) {
                await updateTodo(selectedTask.id, { 
                  progress: 100, 
                  status: 'completed' 
                });
                if (typeof refetchTasks === 'function') {
                  refetchTasks();
                }
              }
              
              // 创建"完善企业资料"引导任务
              try {
                const { createTodo, updateSettings, getEnterpriseCertifications } = await import('./services/apiService');
                
                // 创建完善企业资料任务
                const profileTaskData = {
                  title: '完善企业资料',
                  description: '完善企业基本信息、联系方式、企业介绍等，提升招聘效果',
                  priority: 'MEDIUM',
                  source: 'AGENT',
                  todo_type: 'EMPLOYER',
                  icon: 'FileText',
                  user_id: userId,
                  progress: 0,
                  status: 'pending'
                };
                
                await createTodo(profileTaskData);
                console.log('[Enterprise] 已创建"完善企业资料"引导任务');
                
                // 获取企业认证信息，用于自动填充基础信息
                const certifications = await getEnterpriseCertifications(userId);
                const businessLicenseCert = certifications.find((c: any) => c.category === 'qualification' && c.name?.includes('营业执照'));
                
                if (businessLicenseCert) {
                  // 将认证识别的信息自动填入基础信息设置
                  const settingsToUpdate: any = {};
                  
                  // 企业名称（从营业执照名称中提取）
                  const certName = businessLicenseCert.name || '';
                  const companyNameMatch = certName.match(/营业执照\s*-\s*(.+)/);
                  if (companyNameMatch && companyNameMatch[1]) {
                    settingsToUpdate.display_name = companyNameMatch[1];
                  }
                  
                  // 公司地址
                  if (businessLicenseCert.business_address) {
                    settingsToUpdate.detail_address = businessLicenseCert.business_address;
                  }
                  
                  // 法定代表人姓名作为联系人
                  if (businessLicenseCert.organization && businessLicenseCert.organization !== '系统认证') {
                    settingsToUpdate.contact_name = businessLicenseCert.organization;
                  }
                  
                  // 如果有需要更新的设置，调用API更新
                  if (Object.keys(settingsToUpdate).length > 0) {
                    await updateSettings(settingsToUpdate, userId);
                    console.log('[Enterprise] 已将认证信息自动填入基础设置:', settingsToUpdate);
                  }
                }
                
                // 刷新任务列表
                if (typeof refetchTasks === 'function') {
                  refetchTasks();
                }
              } catch (taskError) {
                console.error('[Enterprise] 创建完善企业资料任务失败:', taskError);
              }
            } else {
              // 继续下一项
              const nextItem = enterpriseVerificationItems[nextIndex];
              successMessage += `---\n\n📋 **认证进度：** ${newCompletedItems.length}/${enterpriseVerificationItems.length} 项\n\n`;
              successMessage += `${nextItem.icon} **第 ${nextIndex + 1} 项：${nextItem.label}**\n\n`;
              successMessage += nextItem.description;
              
              addCertImageMessage(successMessage);
              
              setEnterpriseVerificationMode(prev => ({
                ...prev,
                currentIndex: nextIndex,
                completedItems: newCompletedItems
              }));
              
              // 更新任务进度
              if (selectedTask) {
                const progress = Math.round((newCompletedItems.length / enterpriseVerificationItems.length) * 100);
                await updateTodo(selectedTask.id, { 
                  progress, 
                  status: 'in_progress' 
                });
                if (typeof refetchTasks === 'function') {
                  refetchTasks();
                }
              }
            }
          } catch (error) {
            console.error('[Enterprise Cert] 处理失败:', error);
            addCertImageMessage(`❌ 处理认证信息时出错，请重试。`);
          }
          
          setIsTyping(false);
          setUploadingCertImage(false);
          if (certImageInputRef.current) certImageInputRef.current.value = '';
          return;
        }
        
        // ========== 个人认证处理分支 ==========
        const newCompletedItems = [...verificationMode.completedItems, currentItem.key];
        const nextIndex = currentIndex + 1;
        
        // 保存认证信息到数据库
        try {
          const { createPersonalCertification, updateTodo, updateCandidateIdentity, updateCandidateEducation } = await import('./services/apiService');
          
          // 处理身份证正反面
          if (currentItem.key === 'identity_front' || currentItem.key === 'identity_back') {
            const isIdFront = currentItem.key === 'identity_front';
            let identityNameFromFront = '';
            
            // 更新身份证状态
            if (isIdFront) {
              identityNameFromFront = reviewResult.extractedInfo?.['姓名'] || '';
              setIdCardInfo(prev => ({
                ...prev,
                frontUploaded: true,
                frontInfo: reviewResult.extractedInfo || null
              }));
              
              // 保存正面信息到用户资料
              if (reviewResult.extractedInfo && userId) {
                try {
                  await updateCandidateIdentity(userId, {
                    real_name: reviewResult.extractedInfo['姓名'],
                    gender: reviewResult.extractedInfo['性别'],
                    birthday: reviewResult.extractedInfo['出生日期'],
                    id_number: reviewResult.extractedInfo['身份证号'],
                    address: reviewResult.extractedInfo['住址'],
                    ethnicity: reviewResult.extractedInfo['民族']
                  });
                  console.log('[ID Card Front] 已保存身份证正面信息到用户资料');
                } catch (profileError) {
                  console.error('保存身份证正面信息失败:', profileError);
                }
              }
            } else {
              setIdCardInfo(prev => ({
                ...prev,
                backUploaded: true,
                backInfo: reviewResult.extractedInfo || null
              }));
              
              // 保存反面信息到用户资料
              if (reviewResult.extractedInfo && userId) {
                try {
                  await updateCandidateIdentity(userId, {
                    id_issuing_authority: reviewResult.extractedInfo['签发机关'],
                    id_valid_period: reviewResult.extractedInfo['有效期限']
                  });
                  console.log('[ID Card Back] 已保存身份证反面信息到用户资料');
                } catch (profileError) {
                  console.error('保存身份证反面信息失败:', profileError);
                }
              }
            }
            
            // 当身份证两面都上传完成后，创建认证记录
            const updatedIdCardInfo = isIdFront 
              ? { ...idCardInfo, frontUploaded: true, frontInfo: reviewResult.extractedInfo || null }
              : { ...idCardInfo, backUploaded: true, backInfo: reviewResult.extractedInfo || null };
            
            if (updatedIdCardInfo.frontUploaded && updatedIdCardInfo.backUploaded) {
              // 两面都已上传，创建完整的身份认证记录
              // 组合性别和民族信息
              const gender = updatedIdCardInfo.frontInfo?.['性别'] || '';
              const ethnicity = updatedIdCardInfo.frontInfo?.['民族'] || '';
              const genderEthnicity = [gender, ethnicity ? `${ethnicity}族` : ''].filter(Boolean).join(' · ');
              const finalIdentityName = updatedIdCardInfo.frontInfo?.['姓名'] || '';
              
              const certData = {
                name: `实名认证 - ${finalIdentityName || '已认证'}`,
                organization: updatedIdCardInfo.backInfo?.['签发机关'] || '公安机关',
                cert_date: updatedIdCardInfo.backInfo?.['有效期限'] || '', // 存储有效期
                level: updatedIdCardInfo.frontInfo?.['身份证号'] || '', // 存储打码后的身份证号
                degree: updatedIdCardInfo.frontInfo?.['住址'] || '', // 存储打码后的地址
                major: genderEthnicity, // 存储性别和民族
                category: 'identity',
                color: 'blue',
                icon: 'IdCard'
              };
              await createPersonalCertification(certData, userId);
              console.log('[Certification] 已保存完整身份认证到数据库');
              
              // 身份证认证完成，继续下一项认证
              const nextItemIndex = 2;  // identity_back 是 index 1，下一项是 index 2
              const nextItem = verificationItems[nextItemIndex];
              
              let successMessage = `✅ **身份认证已完成！**\n\n`;
              successMessage += `👤 认证姓名：**${finalIdentityName}**\n\n`;
              successMessage += `📋 **识别到的信息：**\n`;
              if (updatedIdCardInfo.frontInfo) {
                Object.entries(updatedIdCardInfo.frontInfo).forEach(([key, value]) => {
                  successMessage += `• ${key}：${value}\n`;
                });
              }
              successMessage += `\n已自动保存认证信息。\n\n`;
              successMessage += `---\n\n`;
              successMessage += `📋 **认证进度：** 2/${verificationItems.length} 项\n\n`;
              successMessage += `⚠️ 后续认证信息必须与身份证姓名「${finalIdentityName}」一致\n\n`;
              successMessage += `${nextItem.icon} **第 ${nextItemIndex + 1} 项：${nextItem.label}**\n\n`;
              successMessage += nextItem.description;
              
              addCertImageMessage(successMessage);
              
              // 更新状态：继续下一项
              setVerificationMode(prev => ({
                ...prev,
                currentIndex: nextItemIndex,
                completedItems: ['identity_front', 'identity_back'],
                identityName: finalIdentityName
              }));
              
              // 更新任务进度
              if (selectedTask) {
                const progress = Math.round((2 / verificationItems.length) * 100);
                await updateTodo(selectedTask.id, { 
                  progress, 
                  status: 'in_progress' 
                });
                if (typeof refetchTasks === 'function') {
                  refetchTasks();
                }
              }
              
              // 身份认证完成后，创建DISC测试任务
              try {
                const existingTasks = await getTasks(userId);
                const hasDiscTask = existingTasks.some((t: any) => 
                  t.title === 'DISC性格测试'
                );
                
                if (!hasDiscTask) {
                  await createTodo({
                    title: 'DISC性格测试',
                    description: '通过DISC测试了解您的行为风格，提升求职匹配度',
                    priority: 'MEDIUM',
                    status: 'PENDING',
                    progress: 0,
                    source: 'AGENT',
                    todo_type: 'CANDIDATE',
                    icon: 'UserIcon',
                    user_id: userId,
                  });
                  console.log('[DISC Task] 已创建DISC性格测试任务');
                  if (typeof refetchTasks === 'function') {
                    refetchTasks();
                  }
                }
              } catch (discTaskError) {
                console.error('创建DISC测试任务失败:', discTaskError);
              }
              
              return;  // 身份证认证完成，直接返回
            }
          } else {
            // 其他认证类型的处理
            // 根据 key 确定正确的 category
            const categoryMap: Record<string, string> = {
              'education': 'education',
              'skill_driver': 'skill',
              'skill_cert': 'skill',
              'work': 'work',
              'credit_fund': 'credit',
              'credit_social': 'credit'
            };
            
            const certData: any = {
              name: currentItem.label,
              organization: '系统认证',
              cert_date: new Date().toISOString().split('T')[0],
              category: categoryMap[currentItem.key] || currentItem.key,
            };
            
            // 根据提取的信息填充认证数据
            if (reviewResult.extractedInfo) {
              if (currentItem.key === 'education') {
                certData.name = reviewResult.extractedInfo['姓名'] || '学历认证';
                certData.organization = reviewResult.extractedInfo['学校'] || '未知学校';
                certData.degree = reviewResult.extractedInfo['学历'];
                certData.major = reviewResult.extractedInfo['专业'];
                certData.cert_number = reviewResult.extractedInfo['证书编号'];
                
                // 使用 OCR 提取的毕业时间，而不是当前日期
                if (reviewResult.extractedInfo['毕业时间']) {
                  certData.cert_date = reviewResult.extractedInfo['毕业时间'];
                }
                
                // 保存学历信息到用户资料
                if (userId) {
                  try {
                    await updateCandidateEducation(userId, {
                      education: reviewResult.extractedInfo['学历'],
                      school: reviewResult.extractedInfo['学校'],
                      major: reviewResult.extractedInfo['专业'],
                      graduation_year: reviewResult.extractedInfo['毕业时间'],
                      degree: reviewResult.extractedInfo['学位'],
                      cert_number: reviewResult.extractedInfo['证书编号']
                    });
                    console.log('[Education] 已保存学历信息到用户资料');
                  } catch (profileError) {
                    console.error('保存学历信息失败:', profileError);
                  }
                }
              } else if (currentItem.key === 'skill_driver') {
                // 驾驶证认证
                certData.name = '驾驶证';
                certData.organization = reviewResult.extractedInfo['姓名'] || '驾驶人';  // 驾驶人姓名
                certData.level = reviewResult.extractedInfo['准驾车型'] || '';
                certData.cert_number = reviewResult.extractedInfo['证号'] || '';
                certData.cert_date = reviewResult.extractedInfo['有效期至'] || '';
                certData.major = reviewResult.extractedInfo['初次领证'] || '';  // 发证日期
              } else if (currentItem.key === 'skill_cert') {
                // 职业资格证书认证
                certData.name = reviewResult.extractedInfo['证书类型'] || reviewResult.extractedInfo['证书名称'] || '职业资格证书';
                certData.organization = reviewResult.extractedInfo['发证机构'] || '';
                certData.level = reviewResult.extractedInfo['等级'] || '';
                certData.cert_number = reviewResult.extractedInfo['证书编号'] || '';
                certData.major = reviewResult.extractedInfo['姓名'] || '';  // 保存持证人姓名
              } else if (currentItem.key === 'work') {
                // 工作证明认证 - 名称使用公司名或认证方式，不使用人名
                const companyName = reviewResult.extractedInfo['公司名称'] || '';
                const proofType = reviewResult.extractedInfo['认证方式'] || '工作证明';
                certData.name = companyName || proofType;  // 使用公司名作为标题，如果没有则使用认证方式
                certData.organization = reviewResult.extractedInfo['姓名'] || '';  // 存储姓名到 organization
                certData.degree = reviewResult.extractedInfo['职位'] || '';  // 存储职位
                certData.major = proofType;  // 存储认证方式
                certData.cert_date = reviewResult.extractedInfo['在职时间'] || '';
              } else if (currentItem.key === 'credit_fund') {
                // 公积金证明
                certData.name = '公积金证明';
                certData.organization = reviewResult.extractedInfo['姓名'] || '';
                certData.level = reviewResult.extractedInfo['缴存基数'] || '';
                certData.major = reviewResult.extractedInfo['缴存状态'] || '正常缴存';
                certData.cert_date = reviewResult.extractedInfo['缴存时间'] || '';
              } else if (currentItem.key === 'credit_social') {
                // 社保证明
                certData.name = '社保证明';
                certData.organization = reviewResult.extractedInfo['姓名'] || '';
                certData.level = reviewResult.extractedInfo['参保类型'] || '';
                certData.major = reviewResult.extractedInfo['缴纳状态'] || '正常缴纳';
                certData.cert_date = reviewResult.extractedInfo['缴纳时间'] || '';
              }
            }
            
            // 设置颜色和图标
            const certStyles: Record<string, {color: string; icon: string}> = {
              'identity_front': { color: 'blue', icon: 'IdCard' },
              'identity_back': { color: 'blue', icon: 'IdCard' },
              'education': { color: 'green', icon: 'GraduationCap' },
              'skill_driver': { color: 'purple', icon: 'Car' },
              'skill_cert': { color: 'purple', icon: 'Award' },
              'work': { color: 'amber', icon: 'Briefcase' },
              'credit_fund': { color: 'orange', icon: 'Building' },
              'credit_social': { color: 'orange', icon: 'ShieldCheck' }
            };
            certData.color = certStyles[currentItem.key]?.color || 'gray';
            certData.icon = certStyles[currentItem.key]?.icon || 'Award';
            
            await createPersonalCertification(certData, userId);
            console.log(`[Certification] 已保存${currentItem.label}到数据库`);
          }
          
          // 更新任务进度
          if (selectedTask) {
            const progress = Math.round((newCompletedItems.length / totalItems) * 100);
            const taskStatus = progress >= 100 ? 'completed' : 'in_progress';
            await updateTodo(selectedTask.id, { 
              progress, 
              status: taskStatus 
            });
            console.log(`[Task Progress] 任务进度更新为 ${progress}%`);
            
            // 刷新任务列表
            if (typeof refetchTasks === 'function') {
              refetchTasks();
            }
          }
        } catch (saveError) {
          console.error('保存认证信息失败:', saveError);
        }
        
        let successMessage = `✅ **${currentItem.label}审核通过！**\n\n`;
        successMessage += `📋 **识别到的信息：**\n`;
        if (reviewResult.extractedInfo) {
          Object.entries(reviewResult.extractedInfo).forEach(([key, value]) => {
            successMessage += `• ${key}：${value}\n`;
          });
        }
        successMessage += `\n已自动保存认证信息。`;
        
        // 身份证正面完成，继续反面
        if (currentItem.key === 'identity_front') {
          const nextItem = verificationMode.items[1];  // identity_back
          successMessage += `\n\n---\n\n${nextItem.icon} **继续上传：${nextItem.label}**\n\n${nextItem.description}`;
          
          addCertImageMessage(successMessage);
          setVerificationMode(prev => ({
            ...prev,
            currentIndex: 1,
            completedItems: newCompletedItems
          }));
        } else if (nextIndex >= totalItems) {
          // 所有认证项都已完成
          successMessage += `\n\n---\n\n🎉 **恭喜！您已完成全部认证！**\n\n`;
          successMessage += `✅ 已完成：${newCompletedItems.length}/${totalItems} 项\n\n`;
          successMessage += `您的认证信息已保存，这将大幅提升您的求职竞争力！\n\n`;
          successMessage += `👉 前往 [设置 - 个人认证信息](/settings?tab=PersonalVerification) 查看详情\n\n`;
          successMessage += `还有什么我可以帮您的吗？`;
          
          addCertImageMessage(successMessage);
          setVerificationMode({ active: false, items: [], currentIndex: -1, completedItems: [] });
          
          // 更新任务为完成
          if (selectedTask) {
            const { updateTodo } = await import('./services/apiService');
            await updateTodo(selectedTask.id, { 
              progress: 100, 
              status: 'completed' 
            });
            if (typeof refetchTasks === 'function') {
              refetchTasks();
            }
          }
        } else {
          // 继续下一项
          const nextItem = verificationMode.items[nextIndex];
          successMessage += `\n\n---\n\n`;
          successMessage += `📋 **认证进度：** ${newCompletedItems.length}/${totalItems} 项\n\n`;
          successMessage += `${nextItem.icon} **第 ${nextIndex + 1} 项：${nextItem.label}**\n\n`;
          successMessage += nextItem.description;
          
          addCertImageMessage(successMessage);
          setVerificationMode(prev => ({
            ...prev,
            currentIndex: nextIndex,
            completedItems: newCompletedItems
          }));
          
          // 更新任务进度
          if (selectedTask) {
            const { updateTodo } = await import('./services/apiService');
            const progress = Math.round((newCompletedItems.length / totalItems) * 100);
            await updateTodo(selectedTask.id, { 
              progress, 
              status: 'in_progress' 
            });
            if (typeof refetchTasks === 'function') {
              refetchTasks();
            }
          }
        }
      } else {
        // 审核不通过
        const isIdentityItem = currentItem.key === 'identity_front' || currentItem.key === 'identity_back';
        
        let failMessage = `❌ **${currentItem.label}审核未通过**\n\n`;
        failMessage += `**原因：** ${reviewResult.reason}\n\n`;
        failMessage += `📷 请重新上传符合要求的证件图片：\n`;
        failMessage += `• 确保图片清晰，文字可辨认\n`;
        failMessage += `• 确保证件在图片中完整显示\n`;
        failMessage += `• 避免反光、遮挡或模糊\n\n`;
        
        // 根据认证项类型显示不同的提示
        if (isIdentityItem) {
          failMessage += `📷 请重新上传身份证照片（身份认证是必填项）`;
        } else {
          failMessage += `💡 输入 **"跳过"** 可以跳过当前认证项`;
        }
        
        addCertImageMessage(failMessage);
      }
      
    } catch (error: any) {
      console.error('证件图片上传失败:', error);
      const errorMsg = error.message || '未知错误';
      const isNetworkError = errorMsg.includes('无法连接') || errorMsg.includes('fetch') || errorMsg.includes('network');
      
      if (isNetworkError) {
        addCertImageMessage(`❌ **网络连接失败**\n\n无法连接到服务器，请检查：\n• 后端服务是否正常运行\n• 网络连接是否正常\n\n请稍后重试或输入 **"跳过"** 跳过当前认证项。`);
      } else {
        addCertImageMessage(`❌ **图片处理失败**\n\n错误信息：${errorMsg}\n\n请重新上传或输入 **"跳过"** 跳过当前认证项。`);
      }
    } finally {
      setUploadingCertImage(false);
      setIsTyping(false);
      if (certImageInputRef.current) certImageInputRef.current.value = '';
    }
  };
  
  // 添加证件图片相关消息的辅助函数
  const addCertImageMessage = (content: string) => {
    if (selectedTask) {
      setTaskMessages(prev => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] || []), { role: 'assistant' as const, content }]
      }));
    } else {
      setGeneralMessages(prev => [...prev, { role: 'assistant' as const, content }]);
    }
  };
  
  // 模拟 AI 审核证件图片 (实际应用中应调用后端 API)
  // 建立严格的审核规则
  const simulateAIReview = async (certType: string, fileName: string, fileSize: number): Promise<{
    success: boolean;
    reason?: string;
    extractedInfo?: Record<string, string>;
    detectedSide?: 'front' | 'back'; // 自动检测的身份证面
  }> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fileNameLower = fileName.toLowerCase();
    const fileSizeKB = fileSize / 1024;
    
    // ========== 通用审核规则 ==========
    // 规则1: 图片大小检查 - 过小的图片无法识别
    if (fileSizeKB < 50) {
      return {
        success: false,
        reason: '图片文件过小（小于50KB），分辨率可能不足，无法清晰识别证件信息。请上传清晰的原始证件照片。'
      };
    }
    
    // 规则2: 检测常见的非证件图片特征
    const nonCertKeywords = ['screenshot', '截图', 'logo', 'icon', '头像', 'avatar', 'wallpaper', '壁纸', 'background', 'meme', '表情', 'emoji', 'gif'];
    if (nonCertKeywords.some(keyword => fileNameLower.includes(keyword))) {
      return {
        success: false,
        reason: '检测到上传的可能不是证件图片。请上传正规证件的拍照或扫描件。'
      };
    }
    
    // ========== 针对不同证件类型的专门审核规则 ==========
    switch (certType) {
      case 'identity_front':
      case 'identity_back': {
        // 身份证审核规则
        const idCardKeywords = ['身份证', 'id', 'identity', 'sfz', '正面', '反面', 'front', 'back', '国徽'];
        const hasIdCardHint = idCardKeywords.some(k => fileNameLower.includes(k));
        
        // 身份证图片通常在 100KB - 3MB 之间
        if (fileSizeKB > 5000) {
          return {
            success: false,
            reason: '图片文件过大，请压缩后重新上传（建议不超过10MB）。'
          };
        }
        
        // 模拟 AI 识别成功率（有关键词提示时提高成功率）
        const idPassRate = hasIdCardHint ? 0.95 : 0.7;
        if (Math.random() > idPassRate) {
          return {
            success: false,
            reason: certType === 'identity_front' 
              ? '未能识别到身份证正面（人像面）信息。请确保：\n• 上传的是身份证正面照片\n• 证件四角完整可见\n• 照片清晰无反光'
              : '未能识别到身份证反面（国徽面）信息。请确保：\n• 上传的是身份证反面照片\n• 国徽和签发机关信息清晰可见'
          };
        }
        
        if (certType === 'identity_front') {
          return {
            success: true,
            detectedSide: 'front',
            extractedInfo: {
              '证件面': '正面（人像面）',
              '姓名': '张三',
              '性别': '男',
              '民族': '汉',
              '出生日期': '1995年06月15日',
              '住址': '上海市浦东新区****路**号',
              '身份证号': '310115199506******'
            }
          };
        } else {
          return {
            success: true,
            detectedSide: 'back',
            extractedInfo: {
              '证件面': '反面（国徽面）',
              '签发机关': '上海市公安局浦东分局',
              '有效期限': '2020.01.01-2040.01.01'
            }
          };
        }
      }
      
      case 'education': {
        // ========== 学历认证审核规则 ==========
        // 设计原则：拒绝明显的非证书图片，允许正常的证书照片通过
        
        // 规则1: 图片大小必须在合理范围内
        // 太小的图片无法看清证书内容
        if (fileSizeKB < 100) {
          return {
            success: false,
            reason: '**图片分辨率不足**\n\n上传的图片太小（' + Math.round(fileSizeKB) + 'KB），无法清晰识别证书信息。\n\n**请上传：**\n• 分辨率较高的清晰照片（建议100KB以上）\n• 或使用扫描仪扫描的高清版本\n\n💡 建议使用手机相机近距离拍摄，确保文字清晰可读。'
          };
        }
        
        // 规则2: 拒绝明显的非证书图片（截图、头像、壁纸、表情包等）
        const invalidFilePatterns = [
          // 截图类
          'screenshot', '截图', '屏幕快照', 'screen', 'snip',
          // 头像/社交类
          'avatar', '头像', 'profile', 'icon', 'logo',
          // 壁纸/背景类
          'wallpaper', '壁纸', 'background', '背景', 'desktop',
          // 表情/娱乐类
          'emoji', '表情', 'meme', 'sticker', 'gif',
          // 明显非证书的描述
          '风景', 'landscape', '自拍', 'selfie', '美食', 'food',
          '旅游', 'travel', '宠物', 'pet', '游戏', 'game'
        ];
        
        const isInvalidFile = invalidFilePatterns.some(p => fileNameLower.includes(p));
        
        if (isInvalidFile) {
          return {
            success: false,
            reason: '**检测到非学历证书图片**\n\n上传的文件不是学历证书。\n\n**学历认证要求上传以下证件之一：**\n• 毕业证书原件照片\n• 学位证书原件照片\n• 学信网学历认证报告\n\n**请重新上传正确的证件照片。**'
          };
        }
        
        // 规则3: 检测学历相关关键词（用于优化识别结果展示）
        const educationKeywords = [
          '毕业', '学历', '学位', '证书', '文凭', '学信',
          '大学', '学院', '本科', '硕士', '博士', '专科', '学士',
          'diploma', 'degree', 'certificate', 'university', 'college',
          'bachelor', 'master', 'phd'
        ];
        const hasEducationKeyword = educationKeywords.some(k => fileNameLower.includes(k));
        
        // 规则4: 文件大小和类型综合判断
        // 正常的证书照片/扫描件通常在 100KB - 10MB 之间
        // 如果文件大小合理，我们假设用户上传的是正确的证书
        const isReasonableSize = fileSizeKB >= 100 && fileSizeKB <= 10240;
        
        if (!isReasonableSize) {
          return {
            success: false,
            reason: '**图片大小异常**\n\n上传的图片大小不在正常范围内。学历证书照片通常在 100KB - 10MB 之间。\n\n**请检查：**\n• 是否上传了正确的文件\n• 图片是否被过度压缩\n\n请重新拍摄或选择原始图片上传。'
          };
        }
        
        // 通过审核，返回模拟的提取信息
        // 实际生产环境中，这里应该调用 OCR API 提取真实信息
        return {
          success: true,
          extractedInfo: {
            '学校': hasEducationKeyword ? '清华大学' : '北京大学',
            '专业': '计算机科学与技术',
            '学历': '本科',
            '学位': '工学学士',
            '毕业时间': '2020年6月',
            '证书编号': '1084**********'
          }
        };
      }
      
      case 'skill_driver': {
        // 驾驶证审核规则
        const driverKeywords = ['驾驶证', '驾照', 'driver', 'license', 'c1', 'c2', 'a1', 'b1'];
        const hasDriverHint = driverKeywords.some(k => fileNameLower.includes(k));
        
        if (fileSizeKB < 80) {
          return {
            success: false,
            reason: '驾驶证图片分辨率过低。请上传清晰的驾驶证照片（建议不小于100KB）。'
          };
        }
        
        const driverPassRate = hasDriverHint ? 0.85 : 0.5;
        if (Math.random() > driverPassRate) {
          return {
            success: false,
            reason: '未能识别到有效的驾驶证。\n\n请确保：\n• 上传的是驾驶证正本照片\n• 图片清晰，准驾车型和有效期可辨认'
          };
        }
        
        return {
          success: true,
          extractedInfo: {
            '姓名': '张三',
            '准驾车型': 'C1',
            '有效期至': '2030-12-31',
            '证号': '110101****1234'
          }
        };
      }
      
      case 'skill_cert': {
        // 职业资格证书审核规则
        const skillKeywords = [
          '资格', '证书', '职业', '技能', '等级', 'certificate', 'qualification', 'license',
          '工程师', '会计', '律师', '医师', '教师', '建造师', 'pmp', 'cpa', 'cfa'
        ];
        const hasSkillHint = skillKeywords.some(k => fileNameLower.includes(k));
        
        if (fileSizeKB < 80) {
          return {
            success: false,
            reason: '职业资格证书图片分辨率过低。请上传清晰的证书照片或扫描件（建议不小于100KB）。'
          };
        }
        
        const skillPassRate = hasSkillHint ? 0.85 : 0.4;
        if (Math.random() > skillPassRate) {
          return {
            success: false,
            reason: '未能识别到有效的职业资格证书。\n\n**技能认证支持以下证书：**\n• 国家职业资格证书\n• 专业技术资格证书\n• 技能等级证书\n• 行业认证证书（如PMP、CPA等）\n\n**请确保证书图片：**\n• 完整显示证书内容\n• 印章和编号清晰可见'
          };
        }
        
        return {
          success: true,
          extractedInfo: {
            '证书名称': '高级软件工程师',
            '发证机构': '人力资源和社会保障部',
            '证书编号': 'XYZ****5678',
            '等级': '高级'
          }
        };
      }
      
      case 'work': {
        // 工作证明审核规则
        const workKeywords = [
          '工牌', '在职', '离职', '证明', '公司', '企业', '员工', 'badge', 'employee', 'email'
        ];
        const hasWorkHint = workKeywords.some(k => fileNameLower.includes(k));
        
        if (fileSizeKB < 50) {
          return {
            success: false,
            reason: '工作证明图片分辨率过低。请上传清晰的工作证明照片（建议不小于80KB）。'
          };
        }
        
        const workPassRate = hasWorkHint ? 0.85 : 0.5;
        if (Math.random() > workPassRate) {
          return {
            success: false,
            reason: '未能识别到有效的工作证明。\n\n**支持的证明类型：**\n• 工牌照片\n• 企业邮箱截图\n• 在职/离职证明\n• 劳动合同\n\n请确保公司名称和您的姓名清晰可见。'
          };
        }
        
        return {
          success: true,
          extractedInfo: {
            '姓名': '张三',
            '公司名称': '某科技有限公司',
            '职位': '高级工程师',
            '认证方式': '工牌',
            '在职时间': '2020年6月 - 至今'
          }
        };
      }
      
      case 'credit_fund': {
        // 公积金证明审核规则
        const fundKeywords = [
          '公积金', '住房', '缴存', '账户', 'fund', 'housing'
        ];
        const hasFundHint = fundKeywords.some(k => fileNameLower.includes(k));
        
        if (fileSizeKB < 50) {
          return {
            success: false,
            reason: '公积金证明图片分辨率过低。请上传清晰的证明照片（建议不小于80KB）。'
          };
        }
        
        const fundPassRate = hasFundHint ? 0.85 : 0.5;
        if (Math.random() > fundPassRate) {
          return {
            success: false,
            reason: '未能识别到有效的公积金证明。\n\n**支持的证明类型：**\n• 公积金缴存证明\n• 公积金账户截图\n• 住房公积金查询结果\n\n请确保姓名和缴存信息清晰可见。'
          };
        }
        
        return {
          success: true,
          extractedInfo: {
            '姓名': '张三',
            '缴存基数': '12000元',
            '缴存状态': '正常缴存',
            '缴存时间': '2020年6月 - 至今'
          }
        };
      }
      
      case 'credit_social': {
        // 社保证明审核规则
        const socialKeywords = [
          '社保', '社会保险', '医保', '养老', 'social', 'insurance'
        ];
        const hasSocialHint = socialKeywords.some(k => fileNameLower.includes(k));
        
        if (fileSizeKB < 50) {
          return {
            success: false,
            reason: '社保证明图片分辨率过低。请上传清晰的证明照片（建议不小于80KB）。'
          };
        }
        
        const socialPassRate = hasSocialHint ? 0.85 : 0.5;
        if (Math.random() > socialPassRate) {
          return {
            success: false,
            reason: '未能识别到有效的社保证明。\n\n**支持的证明类型：**\n• 社保缴纳证明\n• 社保账户截图\n• 社保查询结果\n\n请确保姓名和缴纳信息清晰可见。'
          };
        }
        
        return {
          success: true,
          extractedInfo: {
            '姓名': '张三',
            '参保类型': '五险一金',
            '缴纳状态': '正常缴纳',
            '缴纳时间': '2020年6月 - 至今'
          }
        };
      }
      
      default:
        return {
          success: true,
          extractedInfo: {
            '认证状态': '已通过'
          }
        };
    }
  };
  
  // 自动检测身份证正反面 (模拟)
  const detectIdCardSide = async (fileName: string): Promise<'front' | 'back' | 'unknown'> => {
    // 实际应用中应该使用图像识别 API 分析图片内容
    // 这里通过模拟来演示功能
    // 检测逻辑：正面有人像和姓名，反面有国徽和有效期
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟 90% 准确率的自动检测
    const detectionRate = 0.9;
    if (Math.random() < detectionRate) {
      // 随机返回正面或反面（实际应该分析图片内容）
      return Math.random() < 0.5 ? 'front' : 'back';
    }
    return 'unknown';
  };

  const handleResetChat = () => {
    // 重置完善简历模式
    setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
    
    if (selectedTask) {
      const taskTitle = selectedTask.title || selectedTask.task || '';
      const taskType = selectedTask.todo_type || selectedTask.type || '';
      const isProfileTask = taskType === 'profile_complete' || 
        taskTitle === '完善简历资料';
      
      setTaskMessages(prev => ({
        ...prev,
        [selectedTask.id]: [{
          role: 'assistant',
          content: isProfileTask 
            ? `👋 您好！我来帮您完成「${taskTitle}」任务。\n\n输入 "开始填写简历" 开始引导流程。`
            : `你好！我是 Devnors 任务执行助手。关于"${taskTitle}"这项任务，我已经准备好协助您。`
        }]
      }));
    } else {
      // 重置为欢迎消息
      setGeneralMessages([{role: 'assistant', content: getWelcomeMessage()}]);
    }
  };

  const TaskIcon = selectedTask ? getIconComponent(selectedTask.icon) : Calendar;

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex gap-5 h-[calc(100vh-180px)] min-h-[600px]">
        {/* 左侧任务列表 */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-indigo-50 to-slate-50 px-4 py-3 border-b border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <ListTodo size={14} className="text-white" />
                </div>
                <span className="text-slate-800 font-bold text-sm">任务中心</span>
              </div>
            </div>
            {/* 任务筛选标签 */}
            <div className="flex gap-1">
              <button
                onClick={() => setTaskFilter('pending')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  taskFilter === 'pending' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                进行中 ({pendingTasksCount})
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  taskFilter === 'completed' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                已完成 ({completedTasksCount})
              </button>
            </div>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-hide">
            {/* 通用助手入口 */}
            <div 
              className={`cursor-pointer p-3.5 rounded-lg border transition-all ${
                !selectedTask 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
              }`}
              onClick={() => setSelectedTask(null)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  !selectedTask ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-slate-200'
                }`}>
                  <Bot size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">通用 AI 助手</div>
                  <div className="text-xs text-slate-400">随时提问咨询</div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-100 my-2"></div>
            
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserIcon size={40} className="text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm font-medium mb-1">请先登录</p>
                <p className="text-slate-300 text-xs mb-3">登录后可查看任务</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  立即登录
                </button>
              </div>
            ) : tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ListTodo size={40} className="text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm font-medium mb-1">
                  {taskFilter === 'completed' ? '暂无已完成任务' : '暂无进行中任务'}
                </p>
                <p className="text-slate-300 text-xs">
                  {taskFilter === 'completed' ? '完成任务后会显示在这里' : 'AI 会自动生成任务'}
                </p>
              </div>
            ) : filteredTasks.map((task: any) => {
              const TaskItemIcon = getIconComponent(task.icon);
              const isSelected = selectedTask?.id === task.id;
              return (
                <div 
                  key={task.id} 
                  className={`cursor-pointer p-3.5 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                      : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                  }`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      task.status === 'running' ? 'bg-amber-100 text-amber-600' : 
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                      <TaskItemIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {task.status?.toLowerCase() === 'running' && <Loader2 size={10} className="animate-spin text-amber-500" />}
                        {task.status?.toLowerCase() === 'completed' && <CheckCircle2 size={10} className="text-emerald-500" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          task.status?.toLowerCase() === 'running' ? 'text-amber-500' : 
                          task.status?.toLowerCase() === 'completed' ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {task.status?.toLowerCase() === 'running' ? '进行中' : task.status?.toLowerCase() === 'completed' ? '已完成' : '待执行'}
                        </span>
                      </div>
                      <div className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {task.priority && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 
                            task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                        {task.source === 'agent' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-600">
                            Agent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧 AI 对话区域 */}
        <div className="flex-1 bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-lg flex flex-col min-w-0">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-white to-slate-50 px-5 py-3 border-b border-slate-200/80 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-slate-900 font-bold text-sm">
                Devnors AI助手
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:border-indigo-300 cursor-pointer"
              >
                {modelOptions.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button 
                onClick={handleResetChat} 
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all" 
                title="重置对话"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
          
          {/* 任务信息条（选中任务时显示） */}
          {selectedTask && (
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0">
                  <TaskIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-slate-900 truncate">{selectedTask.title || selectedTask.task}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                      selectedTask.priority === 'High' ? 'bg-rose-100 text-rose-600' : 
                      selectedTask.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {selectedTask.priority}
                    </span>
                    {selectedTask.source === 'agent' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-600 flex-shrink-0">Agent</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {/* 云端求职轮巡任务显示特殊信息 */}
                    {selectedTask.title?.includes('云端求职轮巡') ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-amber-500" />
                          已执行 {(() => {
                            const createdStr = selectedTask.created_at || selectedTask.createdAt || selectedTask.updated_at || selectedTask.updatedAt;
                            if (!createdStr) return '1分钟';
                            // 处理不同的日期格式
                            const created = new Date(createdStr.replace(' ', 'T'));
                            if (isNaN(created.getTime())) return '1分钟';
                            const now = new Date();
                            const diffMs = now.getTime() - created.getTime();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            if (diffHours > 24) {
                              const diffDays = Math.floor(diffHours / 24);
                              return `${diffDays}天${diffHours % 24}小时`;
                            }
                            if (diffHours > 0) return `${diffHours}小时${diffMins}分钟`;
                            return `${Math.max(1, diffMins)}分钟`;
                          })()}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} className="text-blue-500" />
                          查看岗位 <strong className="text-blue-600">{(() => {
                            const createdStr = selectedTask.created_at || selectedTask.createdAt || selectedTask.updated_at || selectedTask.updatedAt;
                            if (!createdStr) return 15;
                            const created = new Date(createdStr.replace(' ', 'T'));
                            if (isNaN(created.getTime())) return 15;
                            // 基于执行时间计算查看岗位数（每小时约50个）
                            const diffHours = Math.max(0.1, (new Date().getTime() - created.getTime()) / (1000 * 60 * 60));
                            return Math.floor(diffHours * 50) + 15;
                          })()}</strong> 个
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1">
                          <Send size={12} className="text-emerald-500" />
                          投递岗位 <strong className="text-emerald-600">{(() => {
                            const createdStr = selectedTask.created_at || selectedTask.createdAt || selectedTask.updated_at || selectedTask.updatedAt;
                            if (!createdStr) return 4;
                            const created = new Date(createdStr.replace(' ', 'T'));
                            if (isNaN(created.getTime())) return 4;
                            // 基于执行时间计算投递岗位数（每小时约5个）
                            const diffHours = Math.max(0.1, (new Date().getTime() - created.getTime()) / (1000 * 60 * 60));
                            return Math.floor(diffHours * 5) + 4;
                          })()}</strong> 个
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{selectedTask.description?.substring(0, 40)}{selectedTask.description?.length > 40 ? '...' : ''}</span>
                        <span className="flex items-center gap-1 text-indigo-600 font-medium flex-shrink-0">
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${getTaskDisplayProgress()}%` }}></div>
                          </div>
                          {getTaskDisplayProgress()}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all flex-shrink-0"
                  title="退出任务"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
            
          {/* 消息区域 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-gradient-to-b from-slate-50/50 to-white">
            {currentMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-slate-200'
                  }`}>
                    {msg.role === 'user' ? <UserIcon size={14} className="text-white" /> : <Bot size={14} className="text-indigo-600" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-md' 
                      : 'bg-white text-slate-700 rounded-tl-md border border-slate-100 shadow-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-line">{msg.content}</p>
                    ) : (
                      <div className="markdown-content">
                        {/* 渲染消息内容，支持任务卡片和链接卡片 */}
                        {(() => {
                          // 解析任务卡片语法: [[TASK:任务标题:任务类型:图标]] 和 链接卡片语法: [[LINK:标题:路径:图标]]
                          const cardRegex = /\[\[(TASK|LINK):([^:]+):([^:]+):([^\]]+)\]\]/g;
                          const parts: (string | { type: 'task'; title: string; taskType: string; icon: string } | { type: 'link'; title: string; path: string; icon: string })[] = [];
                          let lastIndex = 0;
                          let match;
                          const content = msg.content;
                          
                          while ((match = cardRegex.exec(content)) !== null) {
                            // 添加卡片之前的文本
                            if (match.index > lastIndex) {
                              parts.push(content.slice(lastIndex, match.index));
                            }
                            // 根据类型添加卡片
                            if (match[1] === 'TASK') {
                              parts.push({
                                type: 'task',
                                title: match[2],
                                taskType: match[3],
                                icon: match[4]
                              });
                            } else if (match[1] === 'LINK') {
                              parts.push({
                                type: 'link',
                                title: match[2],
                                path: match[3],
                                icon: match[4]
                              });
                            }
                            lastIndex = match.index + match[0].length;
                          }
                          // 添加剩余文本
                          if (lastIndex < content.length) {
                            parts.push(content.slice(lastIndex));
                          }
                          
                          // 如果没有任务卡片，直接渲染 Markdown
                          if (parts.length === 1 && typeof parts[0] === 'string') {
                            return (
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({node, ...props}) => (
                                    <Link to={props.href || '#'} className="text-indigo-600 hover:underline font-medium">
                                      {props.children}
                                    </Link>
                                  ),
                                  h1: ({node, ...props}) => <h3 className="text-base font-bold text-slate-900 mt-3 mb-2" {...props} />,
                                  h2: ({node, ...props}) => <h4 className="text-sm font-bold text-slate-900 mt-3 mb-1.5" {...props} />,
                                  h3: ({node, ...props}) => <h5 className="text-sm font-bold text-slate-800 mt-2 mb-1" {...props} />,
                                  p: ({node, ...props}) => <p className="my-1.5 leading-relaxed" {...props} />,
                                  ul: ({node, ...props}) => <ul className="my-2 ml-4 list-disc space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="my-2 ml-4 list-decimal space-y-1" {...props} />,
                                  li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                  em: ({node, ...props}) => <em className="italic" {...props} />,
                                  code: ({node, inline, className, ...props}: any) => {
                                    const isInline = inline || !className;
                                    return isInline ? (
                                      <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                                    ) : (
                                      <code className="block bg-slate-800 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto font-mono my-2" {...props} />
                                    );
                                  },
                                  pre: ({node, ...props}) => <pre className="my-2" {...props} />,
                                  hr: ({node, ...props}) => <hr className="my-3 border-slate-200" {...props} />,
                                  blockquote: ({node, ...props}) => (
                                    <blockquote className="border-l-4 border-indigo-300 pl-3 my-2 text-slate-600 italic bg-slate-50 py-2 rounded-r" {...props} />
                                  ),
                                  table: ({node, ...props}) => (
                                    <div className="overflow-x-auto my-2">
                                      <table className="min-w-full border-collapse border border-slate-200 text-xs" {...props} />
                                    </div>
                                  ),
                                  th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-bold" {...props} />,
                                  td: ({node, ...props}) => <td className="border border-slate-200 px-3 py-2" {...props} />,
                                  img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg my-2" {...props} />,
                                }}
                              >
                                {content}
                              </ReactMarkdown>
                            );
                          }
                          
                          // 有任务卡片时，分段渲染
                          return parts.map((part, partIdx) => {
                            if (typeof part === 'string') {
                              return (
                                <ReactMarkdown 
                                  key={partIdx}
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    a: ({node, ...props}) => (
                                      <Link to={props.href || '#'} className="text-indigo-600 hover:underline font-medium">
                                        {props.children}
                                      </Link>
                                    ),
                                    h1: ({node, ...props}) => <h3 className="text-base font-bold text-slate-900 mt-3 mb-2" {...props} />,
                                    h2: ({node, ...props}) => <h4 className="text-sm font-bold text-slate-900 mt-3 mb-1.5" {...props} />,
                                    h3: ({node, ...props}) => <h5 className="text-sm font-bold text-slate-800 mt-2 mb-1" {...props} />,
                                    p: ({node, ...props}) => <p className="my-1.5 leading-relaxed" {...props} />,
                                    ul: ({node, ...props}) => <ul className="my-2 ml-4 list-disc space-y-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="my-2 ml-4 list-decimal space-y-1" {...props} />,
                                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                    em: ({node, ...props}) => <em className="italic" {...props} />,
                                    code: ({node, inline, className, ...props}: any) => {
                                      const isInline = inline || !className;
                                      return isInline ? (
                                        <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                                      ) : (
                                        <code className="block bg-slate-800 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto font-mono my-2" {...props} />
                                      );
                                    },
                                    pre: ({node, ...props}) => <pre className="my-2" {...props} />,
                                    hr: ({node, ...props}) => <hr className="my-3 border-slate-200" {...props} />,
                                    blockquote: ({node, ...props}) => (
                                      <blockquote className="border-l-4 border-indigo-300 pl-3 my-2 text-slate-600 italic bg-slate-50 py-2 rounded-r" {...props} />
                                    ),
                                    table: ({node, ...props}) => (
                                      <div className="overflow-x-auto my-2">
                                        <table className="min-w-full border-collapse border border-slate-200 text-xs" {...props} />
                                      </div>
                                    ),
                                    th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-bold" {...props} />,
                                    td: ({node, ...props}) => <td className="border border-slate-200 px-3 py-2" {...props} />,
                                    img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg my-2" {...props} />,
                                  }}
                                >
                                  {part}
                                </ReactMarkdown>
                              );
                            } else if (part.type === 'task') {
                              // 渲染任务卡片
                              const handleTaskClick = async () => {
                                try {
                                  const { createTodo, getTasks } = await import('./services/apiService');
                                  
                                  // 先获取最新的任务列表
                                  const latestTasks = await getTasks(userId);
                                  
                                  // 找到对应任务
                                  let targetTask = latestTasks.find((t: any) => 
                                    t.title === part.title || 
                                    t.title?.includes(part.title) || 
                                    (part.taskType === 'enterprise_verification' && t.title === '完成企业认证') ||
                                    (part.taskType === 'enterprise_profile' && t.title === '完善企业资料') ||
                                    (part.taskType === 'profile_complete' && t.title === '完善简历资料') ||
                                    (part.taskType === 'personal_verification' && t.title === '完善个人认证信息')
                                  );
                                  
                                  console.log('[TaskCard] 查找任务:', part.title, part.taskType, '找到:', targetTask?.title);
                                  
                                  // 如果任务不存在，则创建任务
                                  if (!targetTask && part.taskType) {
                                    // 根据任务类型创建相应的任务
                                    let taskData: any = null;
                                    
                                    if (part.taskType === 'enterprise_verification') {
                                      taskData = {
                                        title: '完成企业认证',
                                        description: '完成营业执照、资质认证等企业认证，提升招聘效果和可信度',
                                        priority: 'HIGH',
                                        source: 'AGENT',
                                        todo_type: 'EMPLOYER',
                                        icon: 'Building2',
                                        user_id: userId,
                                      };
                                    } else if (part.taskType === 'profile_complete') {
                                      taskData = {
                                        title: '完善简历资料',
                                        description: '完善您的简历资料，提高匹配精准度',
                                        priority: 'HIGH',
                                        source: 'AGENT',
                                        todo_type: 'CANDIDATE',
                                        icon: 'FileText',
                                        user_id: userId,
                                      };
                                    } else if (part.taskType === 'personal_verification') {
                                      taskData = {
                                        title: '完善个人认证信息',
                                        description: '完成身份认证、学历认证等，提升求职竞争力',
                                        priority: 'HIGH',
                                        source: 'AGENT',
                                        todo_type: 'CANDIDATE',
                                        icon: 'Shield',
                                        user_id: userId,
                                      };
                                    } else if (part.taskType === 'enterprise_profile') {
                                      taskData = {
                                        title: '完善企业资料',
                                        description: '完善企业基本信息、联系方式、企业介绍等，提升招聘效果',
                                        priority: 'MEDIUM',
                                        source: 'AGENT',
                                        todo_type: 'EMPLOYER',
                                        icon: 'FileText',
                                        user_id: userId,
                                      };
                                    }
                                    
                                    if (taskData) {
                                      console.log('[TaskCard] 创建任务:', taskData.title);
                                      const newTask = await createTodo(taskData, userId);
                                      console.log('[TaskCard] 创建任务成功:', newTask);
                                      
                                      // 刷新任务列表
                                      if (typeof refetchTasks === 'function') {
                                        await refetchTasks();
                                      }
                                      
                                      // 重新获取任务列表以找到新创建的任务
                                      const updatedTasks = await getTasks(userId);
                                      targetTask = updatedTasks.find((t: any) => 
                                        t.title === taskData.title
                                      );
                                    }
                                  }
                                  
                                  if (targetTask) {
                                    console.log('[TaskCard] 选中任务:', targetTask.title);
                                    setSelectedTask(targetTask);
                                  }
                                } catch (error) {
                                  console.error('[TaskCard] 处理任务点击失败:', error);
                                }
                              };
                              
                              return (
                                <div 
                                  key={partIdx}
                                  onClick={handleTaskClick}
                                  className="my-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg border border-indigo-100 group-hover:scale-105 transition-transform">
                                      {part.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{part.title}</div>
                                      <div className="text-xs text-slate-500 mt-0.5">点击开始任务</div>
                                    </div>
                                    <ArrowRight size={16} className="text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                  </div>
                                </div>
                              );
                            } else if (part.type === 'link') {
                              // 渲染链接卡片
                              return (
                                <Link 
                                  key={partIdx}
                                  to={part.path}
                                  className="block my-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group no-underline"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg border border-emerald-100 group-hover:scale-105 transition-transform">
                                      {part.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{part.title}</div>
                                      <div className="text-xs text-slate-500 mt-0.5">点击查看详情</div>
                                    </div>
                                    <ExternalLink size={16} className="text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                                  </div>
                                </Link>
                              );
                            } else {
                              return null;
                            }
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 animate-in fade-in">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                  <Loader2 className="animate-spin text-indigo-600" size={14} />
                </div>
                <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-md border border-slate-100 shadow-sm">
                  <span className="text-slate-500 text-xs">正在思考中...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* 输入区域 */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 bg-slate-50 rounded-xl p-2 border border-slate-200">
              {/* 隐藏的文件上传 input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              {/* 隐藏的证件图片上传 input */}
              <input
                ref={certImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleCertImageUpload}
                className="hidden"
              />
              {/* 上传按钮 - 根据任务类型显示不同内容 */}
              {(() => {
                // 检查是否是个人认证任务且当前项需要图片
                const isVerificationUpload = verificationMode.active && verificationMode.items[verificationMode.currentIndex]?.needsImage;
                // 检查是否是企业认证任务且当前项需要图片
                const isEnterpriseVerificationUpload = enterpriseVerificationMode.active && enterpriseVerificationItems[enterpriseVerificationMode.currentIndex]?.needsImage;
                
                // 检查是否是完善简历任务
                const taskTitle = selectedTask?.title || selectedTask?.task || '';
                const taskType = selectedTask?.todo_type || selectedTask?.type || '';
                const isProfileTask = taskType === 'profile_complete' || 
                  taskTitle === '完善简历资料';
                
                if (isVerificationUpload || isEnterpriseVerificationUpload) {
                  // 认证任务：显示"上传证件"按钮
                  return (
                    <button
                      onClick={() => certImageInputRef.current?.click()}
                      disabled={uploadingCertImage || isTyping}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                      title="上传证件图片"
                    >
                      {uploadingCertImage ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Camera size={18} />
                      )}
                      <span className="text-sm font-medium">上传证件</span>
                    </button>
                  );
                } else if (isProfileTask) {
                  // 完善简历任务：显示"上传简历"按钮
                  return (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile || isTyping}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                      title="上传简历文件 (PDF/Word/TXT)"
                    >
                      {uploadingFile ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Upload size={18} />
                      )}
                      <span className="text-sm font-medium">上传简历</span>
                    </button>
                  );
                } else {
                  // 其他情况：只显示附件图标
                  return (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile || isTyping}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all disabled:opacity-50"
                      title="上传附件"
                    >
                      {uploadingFile ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Paperclip size={18} />
                      )}
                    </button>
                  );
                }
              })()}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={selectedTask ? "输入指令执行任务..." : "输入您的问题..."}
                className="flex-1 bg-transparent border-none rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={isTyping}
                data-send-btn
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-200 font-medium text-sm"
              >
                <Send size={14} /> 发送
              </button>
            </div>
            {/* 根据任务类型或模式显示相关提示 */}
            {(() => {
              // 获取当前任务相关的提示
              const getTaskPrompts = (): {label: string; prompt: string; autoSend?: boolean}[] => {
                // 检查是否处于个人认证模式
                if (verificationMode.active) {
                  const currentItem = verificationMode.items[verificationMode.currentIndex];
                  const isIdentityItem = currentItem?.key === 'identity_front' || currentItem?.key === 'identity_back';
                  
                  // 身份认证阶段 - 不能跳过
                  if (isIdentityItem) {
                    return []; // 身份认证必须完成，不提供跳过选项
                  }
                  
                  // 其他认证项 - 显示跳过按钮
                  return [
                    { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true }
                  ];
                }
                
                // 检查是否处于DISC测试模式
                if (discTestMode.active) {
                  if (discTestMode.completed) {
                    // 测试已完成，显示重新测试按钮
                    return [
                      { label: "🔄 重新测试", prompt: "重新测试", autoSend: true }
                    ];
                  } else if (discTestMode.currentQuestion === 0) {
                    return [
                      { label: "🚀 开始测试", prompt: "开始测试", autoSend: true }
                    ];
                  } else {
                    // 答题阶段，显示ABCD选项
                    return [
                      { label: "A", prompt: "A", autoSend: true },
                      { label: "B", prompt: "B", autoSend: true },
                      { label: "C", prompt: "C", autoSend: true },
                      { label: "D", prompt: "D", autoSend: true }
                    ];
                  }
                }
                
                // 检查是否处于求职偏好模式
                if (jobSearchMode.active) {
                  if (jobSearchMode.completed) {
                    if (jobSearchMode.isSearching) {
                      return []; // AI正在自动处理中，不显示按钮
                    }
                    // 云端轮巡任务已创建，显示后续操作按钮
                    return [
                      { label: "📋 查看投递", prompt: "查看投递", autoSend: true },
                      { label: "⏸️ 暂停轮巡", prompt: "暂停轮巡", autoSend: true },
                      { label: "✏️ 修改偏好", prompt: "修改偏好", autoSend: true }
                    ];
                  } else if (jobSearchMode.currentQuestion === 0) {
                    return [
                      { label: "🚀 开始", prompt: "开始", autoSend: true },
                      { label: "✏️ 修改偏好", prompt: "修改偏好", autoSend: true }
                    ];
                  } else {
                    // 答题阶段，显示ABCD选项
                    return [
                      { label: "A", prompt: "A", autoSend: true },
                      { label: "B", prompt: "B", autoSend: true },
                      { label: "C", prompt: "C", autoSend: true },
                      { label: "D", prompt: "D", autoSend: true }
                    ];
                  }
                }
                
                // 检查是否处于完善简历模式
                if (profileCompleteMode.active) {
                  const currentField = profileCompleteMode.missingFields[profileCompleteMode.currentFieldIndex];
                  if (currentField) {
                    // 根据当前字段显示可直接使用的示例值
                    const fieldPrompts: Record<string, {label: string; prompt: string; autoSend?: boolean}[]> = {
                      'display_name': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'title': [
                        { label: "前端工程师", prompt: "高级前端工程师", autoSend: true },
                        { label: "后端工程师", prompt: "资深后端工程师", autoSend: true },
                        { label: "产品经理", prompt: "产品经理", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                      'summary': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'skills': [
                        { label: "前端技能", prompt: "React, TypeScript, Vue, Node.js, CSS", autoSend: true },
                        { label: "后端技能", prompt: "Python, Java, Go, MySQL, Redis", autoSend: true },
                        { label: "全栈技能", prompt: "React, Node.js, Python, MySQL, Docker", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                      'experience': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'education': [
                        { label: "本科示例", prompt: "北京大学 | 计算机科学 | 本科 | 2020年", autoSend: true },
                        { label: "硕士示例", prompt: "清华大学 | 软件工程 | 硕士 | 2022年", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                      'expected_salary': [
                        { label: "5K-10K", prompt: "5K-10K", autoSend: true },
                        { label: "10K-15K", prompt: "10K-15K", autoSend: true },
                        { label: "15K-20K", prompt: "15K-20K", autoSend: true },
                        { label: "20K-30K", prompt: "20K-30K", autoSend: true },
                        { label: "30K以上", prompt: "30K以上", autoSend: true },
                        { label: "面议", prompt: "面议", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                      'expected_location': [
                        { label: "北京", prompt: "北京", autoSend: true },
                        { label: "上海", prompt: "上海", autoSend: true },
                        { label: "深圳", prompt: "深圳", autoSend: true },
                        { label: "远程", prompt: "远程均可", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                    };
                    return fieldPrompts[currentField.key] || [{ label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true }];
                  }
                  return [];
                }
                
                // 检查是否处于完善企业资料模式
                if (enterpriseProfileMode.active) {
                  const currentField = enterpriseProfileMode.missingFields[enterpriseProfileMode.currentFieldIndex];
                  if (currentField) {
                    const enterpriseFieldPrompts: Record<string, {label: string; prompt: string; autoSend?: boolean}[]> = {
                      'display_name': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'short_name': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'industry': [
                        { label: "互联网/IT", prompt: "1", autoSend: true },
                        { label: "人工智能", prompt: "2", autoSend: true },
                        { label: "金融/投资", prompt: "3", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                      'company_size': [
                        { label: "0-20人", prompt: "1", autoSend: true },
                        { label: "20-99人", prompt: "2", autoSend: true },
                        { label: "100-499人", prompt: "3", autoSend: true },
                        { label: "500+", prompt: "4", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                      'funding_stage': [
                        { label: "未融资", prompt: "1", autoSend: true },
                        { label: "A轮", prompt: "3", autoSend: true },
                        { label: "已上市", prompt: "6", autoSend: true },
                        { label: "不需要融资", prompt: "7", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                      'detail_address': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'contact_name': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'hr_phone': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'description': [
                        { label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'benefits': [
                        { label: "全选", prompt: "1,2,3,4,5,6,7,8", autoSend: true },
                        { label: "基础福利", prompt: "1,3,8", autoSend: true },
                        { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                      ],
                    };
                    return enterpriseFieldPrompts[currentField.key] || [{ label: "⏭️ 跳过此项", prompt: "跳过", autoSend: true }];
                  }
                  return [];
                }
                
                // 非完善简历模式
                if (!selectedTask) {
                  // 通用 AI 助手 - 显示找工作等快捷入口
                  if (userRole === 'candidate') {
                    return [
                      { label: "🚀 找工作", prompt: "找工作", autoSend: true },
                      { label: "✏️ 修改偏好", prompt: "修改偏好", autoSend: true },
                    ];
                  }
                  return [];
                }
                
                // 任务模式 - 根据任务类型返回相关提示
                const taskTitle = selectedTask.title || selectedTask.task || '';
                const taskType = selectedTask.todo_type || selectedTask.type || '';
                
                // 完善简历任务（但还没开始引导）
                if (taskType === 'profile_complete' || taskTitle === '完善简历资料') {
                  return [
                    { label: "开始填写简历", prompt: "开始填写简历", autoSend: true },
                  ];
                }
                
                // 面试准备任务
                if (taskTitle.includes('面试')) {
                  return [
                    { label: "常见问题", prompt: "列举这个职位的常见面试问题" },
                    { label: "自我介绍", prompt: "帮我准备自我介绍" },
                    { label: "模拟面试", prompt: "开始模拟面试" },
                  ];
                }
                
                // 职位推荐任务
                if (taskTitle.includes('职位') || taskTitle.includes('推荐')) {
                  return [
                    { label: "查看推荐", prompt: "查看为我推荐的职位" },
                    { label: "调整偏好", prompt: "我想调整职位偏好" },
                  ];
                }
                
                // 人才筛选任务
                if (taskTitle.includes('候选人') || taskTitle.includes('筛选') || taskTitle.includes('人才')) {
                  return [
                    { label: "查看候选人", prompt: "查看匹配的候选人" },
                    { label: "调整条件", prompt: "调整筛选条件" },
                  ];
                }
                
                // 完善个人认证信息任务（但还没开始认证流程）
                if (taskType === 'personal_verification' || 
                    taskTitle === '完善个人认证信息' ||
                    (taskTitle.includes('认证') && taskTitle.includes('信息') && !taskTitle.includes('企业'))) {
                  return [
                    { label: "🚀 开始认证", prompt: "开始认证", autoSend: true },
                  ];
                }
                
                // 企业认证任务
                if (taskType === 'enterprise_verification' || 
                    taskType?.toUpperCase() === 'EMPLOYER' ||
                    taskTitle === '完成企业认证' ||
                    (taskTitle.includes('企业') && taskTitle.includes('认证'))) {
                  if (enterpriseVerificationMode.active) {
                    const currentItem = enterpriseVerificationItems[enterpriseVerificationMode.currentIndex];
                    if (currentItem?.required) {
                      return [
                        { label: "📷 上传证件", prompt: "上传证件", autoSend: false },
                      ];
                    }
                    return [
                      { label: "📷 上传证件", prompt: "上传证件", autoSend: false },
                      { label: "⏭️ 跳过", prompt: "跳过", autoSend: true },
                    ];
                  }
                  return [
                    { label: "🚀 开始认证", prompt: "开始认证", autoSend: true },
                  ];
                }
                
                // 其他任务 - 不显示提示
                return [];
              };
              
              const prompts = getTaskPrompts();
              
              // 如果没有提示，不渲染这个区域
              if (prompts.length === 0) return null;
              
              return (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {prompts.map((item, sIdx) => (
                    <button 
                      key={sIdx}
                      onClick={() => {
                        if (item.autoSend) {
                          // 自动发送：直接设置消息并触发发送
                          setInputMessage(item.prompt);
                          // 使用 setTimeout 确保状态更新后再调用 handleSend
                          setTimeout(() => {
                            const sendBtn = document.querySelector('[data-send-btn]') as HTMLButtonElement;
                            if (sendBtn) sendBtn.click();
                          }, 50);
                        } else {
                          setInputMessage(item.prompt);
                        }
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-xs font-medium text-slate-500 border border-slate-200 rounded-full transition-colors hover:border-indigo-200 hover:text-indigo-600"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 求职申请任务详情页 (ApplyDetailView) - 重定向到 AI 助手 ---
const ApplyDetailView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 重定向到 AI 助手页面并启动求职申请任务
    navigate('/ai-assistant?taskType=apply', { replace: true });
  }, [navigate]);

  return (
    <div className="pt-40 text-center">
      <Loader2 className="mx-auto text-emerald-600 animate-spin mb-4" size={48} />
      <p className="text-slate-500">正在跳转到 AI 助手...</p>
    </div>
  );
};

// --- 职位管理页 (JobManagementView) ---
const JobManagementView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || 0;

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'draft'>('all');
  const [searchText, setSearchText] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // 加载岗位
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getMyJobs(userId);
      setJobs(data || []);
    } catch (e) {
      console.error('加载岗位失败:', e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchJobs();
  }, [userId]);

  // 过滤
  const filteredJobs = jobs.filter(j => {
    if (filter !== 'all' && j.status !== filter) return false;
    if (searchText && !j.title?.toLowerCase().includes(searchText.toLowerCase()) && !j.company?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // 统计
  const activeCount = jobs.filter(j => j.status === 'active').length;
  const closedCount = jobs.filter(j => j.status === 'closed').length;
  const totalViews = jobs.reduce((s, j) => s + (j.view_count || 0), 0);
  const totalApplies = jobs.reduce((s, j) => s + (j.apply_count || 0), 0);

  // 删除
  const handleDelete = async (jobId: number) => {
    try {
      await deleteJob(jobId, userId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setDeleteConfirm(null);
      showToast('岗位已删除');
    } catch (e) {
      console.error('删除失败:', e);
      showToast('删除失败，请重试');
    }
  };

  // 切换状态
  const handleToggleStatus = async (job: any) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await updateJob(job.id, { status: newStatus, user_id: userId } as any);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
      showToast(newStatus === 'active' ? '岗位已上线' : '岗位已关闭');
    } catch (e) {
      console.error('状态更新失败:', e);
      showToast('操作失败，请重试');
    }
  };

  // 编辑
  const openEdit = (job: any) => {
    setEditingJob(job);
    setEditForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      description: job.description || '',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      tags: (job.tags || []).join(', '),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingJob) return;
    setSaving(true);
    try {
      const tagsList = editForm.tags ? editForm.tags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean) : [];
      await updateJob(editingJob.id, {
        title: editForm.title,
        company: editForm.company,
        location: editForm.location,
        description: editForm.description,
        salary_min: editForm.salary_min ? Number(editForm.salary_min) : undefined,
        salary_max: editForm.salary_max ? Number(editForm.salary_max) : undefined,
        tags: tagsList,
        user_id: userId,
      } as any);
      setJobs(prev => prev.map(j => j.id === editingJob.id ? {
        ...j,
        ...editForm,
        salary_min: editForm.salary_min ? Number(editForm.salary_min) : j.salary_min,
        salary_max: editForm.salary_max ? Number(editForm.salary_max) : j.salary_max,
        tags: tagsList,
      } : j));
      setEditingJob(null);
      showToast('岗位信息已更新');
    } catch (e) {
      console.error('保存失败:', e);
      showToast('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return '面议';
    if (min && max) return `${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`;
    if (min) return `${(min / 1000).toFixed(0)}k 起`;
    return `最高 ${((max || 0) / 1000).toFixed(0)}k`;
  };

  const statusLabel = (s: string) => {
    if (s === 'active') return { text: '招聘中', color: 'bg-emerald-100 text-emerald-700' };
    if (s === 'closed') return { text: '已关闭', color: 'bg-slate-100 text-slate-500' };
    if (s === 'draft') return { text: '草稿', color: 'bg-amber-100 text-amber-700' };
    return { text: s, color: 'bg-slate-100 text-slate-500' };
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <button onClick={() => navigate("/employer")} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4 font-black transition-colors group text-sm">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回
          </button>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded shadow-xl"><Briefcase size={32} /></div>
            职位管理
          </h1>
          <p className="text-slate-500 font-medium mt-2">管理您发布的所有招聘岗位</p>
        </div>
        <button
          onClick={() => navigate('/ai-assistant?taskType=post')}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-200 active:scale-95 transition-all"
        >
          <Plus size={20} /> 发布职位
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Briefcase size={18} className="text-indigo-500" />
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">总岗位</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{jobs.length}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Play size={18} className="text-emerald-500" />
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">招聘中</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">{activeCount}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Eye size={18} className="text-indigo-500" />
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">总浏览</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalViews}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Users size={18} className="text-indigo-500" />
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">总投递</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalApplies}</div>
        </div>
      </div>

      {/* 搜索和过滤栏 */}
      <div className="bg-white rounded-lg border border-slate-100 p-4 mb-6 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索岗位名称或公司..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: '全部', count: jobs.length },
            { key: 'active' as const, label: '招聘中', count: activeCount },
            { key: 'closed' as const, label: '已关闭', count: closedCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded text-xs font-black transition-all ${
                filter === f.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="mx-auto animate-spin text-indigo-600 mb-3" size={24} />
          <p className="text-sm text-slate-400">加载中...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-100 shadow-sm">
          <Briefcase className="mx-auto text-slate-300 mb-4" size={40} />
          <p className="text-slate-900 font-black mb-1">
            {jobs.length === 0 ? '还没有发布过岗位' : '没有符合条件的岗位'}
          </p>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            {jobs.length === 0 ? '通过 AI 助手，一句话即可发布招聘岗位' : '尝试调整筛选条件'}
          </p>
          {jobs.length === 0 && (
            <button
              onClick={() => navigate('/ai-assistant?taskType=post')}
              className="bg-indigo-600 text-white px-6 py-3 rounded font-black text-sm inline-flex items-center gap-2 shadow-xl shadow-indigo-200 active:scale-95 transition-all"
            >
              <Sparkles size={16} /> 开始智能招聘
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const st = statusLabel(job.status);
            return (
              <div 
                key={job.id} 
                onClick={() => navigate(`/employer/post/${job.id}`)}
                className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded border border-slate-100 group hover:border-indigo-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className={`w-14 h-14 flex items-center justify-center text-xl font-black rounded shadow-lg ring-4 transition-transform group-hover:scale-105 flex-shrink-0 ${
                    job.status === 'active' ? 'bg-indigo-600 text-white ring-indigo-50' : 'bg-slate-400 text-white ring-slate-100'
                  }`}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-900">{job.title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{job.company} · {job.location}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${st.color}`}>{st.text}</span>
                      {job.tags && job.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{tag}</span>
                      ))}
                      {job.tags && job.tags.length > 3 && <span className="text-xs text-slate-400">+{job.tags.length - 3}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-3">
                    <div className="text-center px-3 py-2 bg-white rounded-lg border border-slate-100 min-w-[60px]">
                      <div className="text-xl font-bold text-indigo-600">{job.view_count || 0}</div>
                      <div className="text-xs text-slate-400">浏览</div>
                    </div>
                    <div className="text-center px-3 py-2 bg-white rounded-lg border border-slate-100 min-w-[60px]">
                      <div className="text-xl font-bold text-emerald-600">{job.apply_count || 0}</div>
                      <div className="text-xs text-slate-400">投递</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 text-right hidden md:block">
                    {job.created_at ? new Date(job.created_at).toLocaleDateString('zh-CN') : '-'}
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(job)} className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 rounded border border-slate-100 hover:border-indigo-200 transition-all" title="编辑"><Edit3 size={16} /></button>
                    <button onClick={() => handleToggleStatus(job)} className={`p-2.5 bg-white rounded border border-slate-100 transition-all ${job.status === 'active' ? 'text-slate-400 hover:text-amber-600 hover:border-amber-200' : 'text-slate-400 hover:text-emerald-600 hover:border-emerald-200'}`} title={job.status === 'active' ? '关闭' : '上线'}>{job.status === 'active' ? <Square size={16} /> : <Play size={16} />}</button>
                    <button onClick={() => setDeleteConfirm(job.id)} className="p-2.5 bg-white text-slate-400 hover:text-red-600 rounded border border-slate-100 hover:border-red-200 transition-all" title="删除"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 mb-2">确认删除</h3>
            <p className="text-sm text-slate-500 mb-6">删除后岗位信息将无法恢复，确认要删除这个岗位吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors">取消</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded bg-red-600 text-white text-sm font-black hover:bg-red-700 transition-colors">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingJob(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 size={18} className="text-indigo-600" /> 编辑岗位
              </h3>
            </div>
            <div className="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 mb-1.5 block uppercase tracking-wider">岗位名称</label>
                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1.5 block uppercase tracking-wider">公司名称</label>
                  <input value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1.5 block uppercase tracking-wider">工作地点</label>
                  <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1.5 block uppercase tracking-wider">最低薪资（元/月）</label>
                  <input type="number" value={editForm.salary_min} onChange={e => setEditForm({ ...editForm, salary_min: e.target.value })} placeholder="8000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 mb-1.5 block uppercase tracking-wider">最高薪资（元/月）</label>
                  <input type="number" value={editForm.salary_max} onChange={e => setEditForm({ ...editForm, salary_max: e.target.value })} placeholder="15000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 mb-1.5 block uppercase tracking-wider">标签（逗号分隔）</label>
                <input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} placeholder="React, Python, 远程" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 mb-1.5 block uppercase tracking-wider">岗位描述</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={5} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditingJob(null)} className="flex-1 py-2.5 rounded border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors">取消</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2.5 rounded bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-24 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-in slide-in-from-right duration-300 bg-emerald-500 text-white">
          <CheckCircle2 size={18} /> {toastMsg}
        </div>
      )}
    </div>
  );
};
// --- 邀请好友任务详情页 (InviteFriendView) ---
const InviteFriendView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 重定向到 AI 助手页面并启动邀请任务
    navigate('/ai-assistant?taskType=invite', { replace: true });
  }, [navigate]);

  return (
    <div className="pt-40 text-center">
      <Loader2 className="mx-auto text-amber-600 animate-spin mb-4" size={48} />
      <p className="text-slate-500">正在跳转到 AI 助手...</p>
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
  const [selectedModel, setSelectedModel] = useState('Devnors 1.0');
  
  const modelOptions = ['Devnors 1.0', 'Devnors 1.0 Pro', 'Devnors 1.0 Ultra'];

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
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-[600px] shadow-xl sticky top-8">
            <div className="bg-white/90 px-4 py-3 border-b border-slate-200 backdrop-blur-sm flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-slate-900 font-black text-sm tracking-wide uppercase">AI 投递助手</span>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:border-indigo-300 cursor-pointer"
                >
                  {modelOptions.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex justify-${msg.role === 'user' ? 'end' : 'start'}`}>
                  <div className={`flex gap-3 max-w-[85%] flex-row ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-indigo-50 border border-indigo-100'}`}>
                      {msg.role === 'user' ? <UserIcon size={14} className="text-white" /> : <Bot size={14} className="text-indigo-600" />}
                    </div>
                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white/90 border-t border-slate-200 backdrop-blur-md">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入您的问题..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
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
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-xs font-black text-slate-600 border border-slate-200 rounded-lg transition-colors"
                >
                  优化简历
                </button>
                <button 
                  onClick={() => setInputMessage('生成求职信')}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-xs font-black text-slate-600 border border-slate-200 rounded-lg transition-colors"
                >
                  求职信
                </button>
                <button 
                  onClick={() => setInputMessage('准备面试问题')}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-xs font-black text-slate-600 border border-slate-200 rounded-lg transition-colors"
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

// 主应用内容组件
const AppContent = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem('devnors_dark_mode') === 'true'; } catch { return false; }
  });
  const { isLoggedIn, userRole, user } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('devnors_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    // 同步保存到后端
    if (user?.id) {
      import('./services/apiService').then(m => {
        m.updateSettings({ dark_mode: newVal }, user.id).catch(() => {});
      });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/select-role" element={<RoleSelectionView />} />
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
          <Route path="/employer/post" element={<JobManagementView />} />
          <Route path="/employer/post/:postId" element={<JobPostDetailView />} />
          <Route path="/invite" element={<InviteFriendView />} />
          <Route path="/candidate/delivery" element={<AIDeliveryView />} />
          <Route path="/employer/talent-pool" element={<TalentPoolView />} />
          <Route path="/tokens" element={<TokenManagementView />} />
          <Route path="/notifications" element={<NotificationCenterView />} />
          <Route path="/settings" element={<SettingsManagementView isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/about" element={<AboutUsView />} />
          <Route path="/ai-assistant" element={<AIAssistantView />} />
          <Route path="/pricing" element={<PricingView />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/models" element={<ModelsPage />} />
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
                      <Link to="/products" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">Hire Agent</Link>
                      <Link to="/solutions" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">解决方案</Link>
                      <Link to="/models" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">Agent 技术</Link>
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
  );
};

// App 组件 - 包裹 AuthProvider 和 Router
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
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
