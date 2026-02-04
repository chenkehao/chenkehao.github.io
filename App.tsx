
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
  History, Timer, ClipboardCheck, Filter, ChevronRight, ChevronDown, UserCircle2, Database, AlertCircle, Sparkle, Eraser, Milestone, Brain, Pin, Trash2, Edit3, Save, CreditCard, ArrowUpRight, TrendingDown, Wallet, Key, UserPlus, ShieldAlert, Laptop, Bell, Verified, Medal, Trophy, Landmark, CircleDollarSign, Gem, CreditCard as CreditCardIcon, Github as GithubIcon, MessageCircle, Tag, Instagram, Twitter, RotateCcw, GitBranch, ArrowRightCircle, Upload, Code, PlusCircle, Wand2, Link2, Linkedin, Gift, FileCheck, Moon, Sun, Inbox, AlertTriangle, Paperclip
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
  getSettings,
  updateSettings,
  getEnterpriseCertifications,
  getPersonalCertifications,
  getTeamMembers,
  getAIConfigs,
  getAPIKeys,
  getAuditLogs,
  getAccountTier
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
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
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
                    <div className="text-xs text-slate-500">{user?.email}</div>
                  </div>
                  <Link 
                    to="/settings" 
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={16} /> 账户设置
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
                      to="/employer/post" 
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Briefcase size={16} /> 职位管理
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
                <div className="inline-flex p-3 bg-indigo-50 rounded text-indigo-600 mb-6">
                  <Users size={32} />
                </div>
                <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">100万<span className="text-indigo-600">+</span></div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">全球储备人才</div>
             </div>
             <div className="text-center md:border-r border-slate-100">
                <div className="inline-flex p-3 bg-emerald-50 rounded text-emerald-600 mb-6">
                  <Building2 size={32} />
                </div>
                <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">2万<span className="text-emerald-600">+</span></div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">活跃入驻企业</div>
             </div>
             <div className="text-center">
                <div className="inline-flex p-3 bg-rose-50 rounded text-rose-600 mb-6">
                  <Sparkles size={32} />
                </div>
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

// --- 设置与管理页面 ---
const SettingsManagementView = ({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const userId = user?.id || 0;
  const isEmployer = userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin';
  
  const [activeTab, setActiveTab] = useState<'General' | 'Account' | 'AIEngine' | 'API' | 'Team' | 'Audit'>('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 动态数据状态
  const [settings, setSettings] = useState<any>({});
  const [enterpriseCerts, setEnterpriseCerts] = useState<any[]>([]);
  const [personalCerts, setPersonalCerts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
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
        setTeamMembers(teamMembersData);
        setLlmConfigs(aiConfigsData);
        setApiKeys(apiKeysData);
        setAuditLogs(auditLogsData);
        setAccountTierInfo(accountTierData);
      } catch (error) {
        console.error('加载设置失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllSettings();
  }, [userId]);

  // 保存设置
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings(settings, userId);
      alert('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 复制API Key
  const handleCopyAPIKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('API Key 已复制到剪贴板');
  };

  const navItems = [
    { id: 'General', label: '基础信息', icon: UserCircle2 },
    { id: 'Verification', label: '企业认证信息', icon: ShieldCheck },
    { id: 'PersonalVerification', label: '个人认证信息', icon: Fingerprint },
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
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">基础信息设置</h3>
            <div className="bg-white rounded-lg p-10 border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">显示名称 / 企业全称</label>
                  <input 
                    type="text" 
                    value={settings.display_name || ''} 
                    onChange={(e) => setSettings({...settings, display_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">管理联系邮箱</label>
                  <input 
                    type="email" 
                    value={settings.contact_email || ''} 
                    onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">联系人姓名</label>
                  <input 
                    type="text" 
                    value={settings.contact_name || ''} 
                    onChange={(e) => setSettings({...settings, contact_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">联系电话</label>
                  <input 
                    type="tel" 
                    value={settings.contact_phone || ''} 
                    onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">公司地址</label>
                  <input 
                    type="text" 
                    value={settings.address || ''} 
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">官方网址</label>
                  <input 
                    type="url" 
                    value={settings.website || ''} 
                    onChange={(e) => setSettings({...settings, website: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">所属行业</label>
                  <select 
                    value={settings.industry || '人工智能'}
                    onChange={(e) => setSettings({...settings, industry: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option>人工智能</option>
                    <option>互联网</option>
                    <option>人力资源</option>
                    <option>金融服务</option>
                    <option>电子商务</option>
                    <option>其他</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">企业规模</label>
                  <select 
                    value={settings.company_size || '1-50人'}
                    onChange={(e) => setSettings({...settings, company_size: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option>1-50人</option>
                    <option>51-200人</option>
                    <option>201-500人</option>
                    <option>501-1000人</option>
                    <option>1000人以上</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">企业简介</label>
                <textarea 
                  rows={4} 
                  value={settings.description || ''} 
                  onChange={(e) => setSettings({...settings, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" 
                />
              </div>
              <div className="p-6 bg-indigo-50 rounded border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2"><Bell size={16}/> 智能消息推送</h4>
                    <p className="text-xs text-indigo-700/70 mt-1 font-medium">当智能体完成简历初筛或约面成功时，通过邮件即时通知。</p>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, notification_enabled: !settings.notification_enabled})}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.notification_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notification_enabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2"><Moon size={16}/> 深色模式</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">切换到深色主题以减少眼睛疲劳。</p>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-indigo-600 text-white px-8 py-3.5 rounded font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        );
      case 'Verification':
        const qualificationCerts = enterpriseCerts.filter((c: any) => c.category === 'qualification');
        const creditCerts = enterpriseCerts.filter((c: any) => c.category === 'credit');
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
                    {qualificationCerts.map((cert: any, idx: number) => (
                      <div key={idx} className={`p-5 rounded-lg border ${cert.color || 'bg-amber-50 border-amber-200'} flex items-start gap-4`}>
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Medal size={24} className="text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-black text-slate-900 text-sm">{cert.name}</h5>
                          <p className="text-xs text-slate-500 mt-1">{cert.organization}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-400">认证日期: {cert.date}</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                              {cert.status === 'valid' ? '有效' : cert.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-500" /> 信用信息认证
                </h4>
                {creditCerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <ShieldCheck size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无信用认证信息</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditCerts.map((credit: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <Building2 size={24} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">{credit.name}</h5>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                              {credit.status === 'valid' ? '已认证' : credit.status}
                            </span>
                          </div>
                          {credit.score && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${credit.score}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-500">{credit.score}分</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Verified size={20} className="text-indigo-500" /> 其他认证
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'AI 算法专利', count: enterpriseCerts.filter((c: any) => c.category === 'patent').length || 12, icon: Lightbulb },
                    { name: '软件著作权', count: enterpriseCerts.filter((c: any) => c.category === 'copyright').length || 8, icon: Code },
                    { name: '商标注册', count: enterpriseCerts.filter((c: any) => c.category === 'trademark').length || 5, icon: Tag },
                  ].map((item, idx) => (
                    <div key={idx} className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 text-center">
                      <item.icon size={28} className="mx-auto text-indigo-600 mb-2" />
                      <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                      <p className="text-2xl font-black text-indigo-600 mt-1">{item.count}</p>
                      <p className="text-xs text-slate-400">项</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'PersonalVerification':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">个人认证信息</h3>
            
            <div className="bg-white rounded-lg p-10 border border-slate-100 shadow-sm space-y-8">
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-indigo-500" /> 学历认证
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { school: '清华大学', degree: '硕士', major: '计算机科学与技术', date: '2018-06', status: '已认证', color: 'bg-indigo-50 border-indigo-200' },
                    { school: '北京大学', degree: '学士', major: '软件工程', date: '2015-06', status: '已认证', color: 'bg-emerald-50 border-emerald-200' },
                  ].map((edu, idx) => (
                    <div key={idx} className={`p-5 rounded-lg border ${edu.color} flex items-start gap-4`}>
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <GraduationCap size={24} className="text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-slate-900 text-sm">{edu.school}</h5>
                        <p className="text-xs text-slate-500 mt-1">{edu.degree} · {edu.major}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-400">毕业时间: {edu.date}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">{edu.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-amber-500" /> 职业认证
                </h4>
                <div className="space-y-4">
                  {[
                    { name: 'PMP 项目管理专业人士', org: 'PMI', date: '2020-03', status: '有效', color: 'bg-amber-50 border-amber-200' },
                    { name: 'AWS 认证解决方案架构师', org: 'Amazon', date: '2021-09', status: '有效', color: 'bg-orange-50 border-orange-200' },
                    { name: '国家软件设计师', org: '工信部', date: '2019-11', status: '有效', color: 'bg-blue-50 border-blue-200' },
                  ].map((cert, idx) => (
                    <div key={idx} className={`p-5 rounded-lg border ${cert.color} flex items-start gap-4`}>
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Briefcase size={24} className="text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-slate-900 text-sm">{cert.name}</h5>
                        <p className="text-xs text-slate-500 mt-1">发证机构: {cert.org}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-400">认证日期: {cert.date}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">{cert.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <FileCheck size={20} className="text-emerald-500" /> 征信认证
                </h4>
                <div className="space-y-4">
                  {[
                    { name: '个人征信报告', date: '2024-01-10', status: '良好', score: 780, icon: FileText },
                    { name: '司法记录核查', date: '2024-01-10', status: '无记录', score: 100, icon: ShieldCheck },
                  ].map((credit, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <credit.icon size={24} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{credit.name}</h5>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">{credit.status}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${credit.score}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{credit.score}分</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">查询日期: {credit.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Trophy size={20} className="text-purple-500" /> 权威获奖资质
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: '国家科技进步奖', org: '科技部', year: '2022', level: '一等奖', icon: Medal },
                    { name: '中国AI创新人物', org: '中国人工智能学会', year: '2023', level: '年度', icon: Award },
                    { name: '最佳论文奖', org: 'IEEE', year: '2021', level: '优秀', icon: Trophy },
                  ].map((award, idx) => (
                    <div key={idx} className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100 text-center">
                      <award.icon size={28} className="mx-auto text-purple-600 mb-2" />
                      <h5 className="font-bold text-slate-900 text-sm">{award.name}</h5>
                      <p className="text-xs text-slate-500 mt-1">{award.org}</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">{award.year}年</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">{award.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
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
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">团队成员与权限控制</h3>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                <UserPlus size={18} /> 邀请新成员
              </button>
            </div>
            <div className="bg-white rounded border border-slate-100 shadow-sm overflow-hidden">
               {teamMembers.length === 0 ? (
                 <div className="text-center py-12 text-slate-400">
                   <Users2 size={40} className="mx-auto mb-3 opacity-50" />
                   <p className="text-sm font-medium">暂无团队成员</p>
                   <p className="text-xs mt-1">点击上方按钮邀请新成员加入</p>
                 </div>
               ) : (
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
                          {teamMembers.map((member: any) => (
                            <tr key={member.id} className="group hover:bg-slate-50/30 transition-colors">
                               <td className="py-6 pl-10">
                                  <div className="flex items-center gap-4">
                                     <div className="w-11 h-11 rounded bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200">
                                       {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                                     </div>
                                     <div>
                                        <div className="text-sm font-black text-slate-900">{member.name || member.email?.split('@')[0]}</div>
                                        <div className="text-xs text-slate-400 font-medium">{member.email}</div>
                                     </div>
                                  </div>
                               </td>
                               <td className="py-6">
                                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                                     member.role?.toLowerCase() === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                                  }`}>
                                     {member.role || 'Viewer'}
                                  </span>
                               </td>
                               <td className="py-6">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${member.status?.toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                     <span className="text-xs font-bold text-slate-600">
                                       {member.status?.toLowerCase() === 'active' ? '活跃' : '已邀请'}
                                     </span>
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
               )}
            </div>
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

      {/* Settings Link */}
      <div className="mt-8 text-center">
        <Link to="/settings" className="text-slate-500 hover:text-indigo-600 text-sm font-medium">
          消息通知设置 →
        </Link>
      </div>
    </div>
  );
};

// --- Token 与资金管理页面 ---
const TokenManagementView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || 0;
  const [rechargeAmount, setRechargeAmount] = useState<number | null>(null);
  
  // 动态数据状态
  const [tokenStats, setTokenStats] = useState<any>(null);
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeak, setChartPeak] = useState(0);
  const [chartAvg, setChartAvg] = useState(0);
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { getTokenStats, getTokenHistory, getTokenChart, getTokenPackages } = await import('./services/apiService');
        
        // 并行加载所有数据
        const [statsRes, historyRes, chartRes, packagesRes] = await Promise.all([
          getTokenStats(userId),
          getTokenHistory(userId, 10),
          getTokenChart(userId, 7),
          getTokenPackages()
        ]);
        
        setTokenStats(statsRes);
        setTokenHistory(historyRes.items || []);
        setChartData(chartRes.data || []);
        setChartPeak(chartRes.peak || 0);
        setChartAvg(chartRes.average || 0);
        setPackages(packagesRes.packages || []);
      } catch (error) {
        console.error('加载 Token 数据失败:', error);
        // 使用默认数据
        setTokenStats({
          balance: 100000,
          balance_display: '0.10M',
          today_usage: 0,
          today_usage_display: '0',
          change_rate: 0,
          change_direction: 'stable',
          total_purchased: 0,
          total_purchased_display: '¥ 0.00',
          estimated_days: 999
        });
        setPackages([
          { id: 'starter', name: '入门体验', tokens_display: '100,000', price: 99, discount: null, accent: 'bg-indigo-50' },
          { id: 'pro', name: '精英猎聘', tokens_display: '1,000,000', price: 799, discount: '性价比最高', accent: 'bg-amber-50' },
          { id: 'enterprise', name: '企业旗舰', tokens_display: '10,000,000', price: 6999, discount: '-20%', accent: 'bg-rose-50' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);
  
  // 加载状态
  if (loading) {
    return (
      <div className="pt-40 text-center">
        <Loader2 className="mx-auto text-indigo-600 animate-spin mb-4" size={48} />
        <p className="text-slate-500">加载资金账户数据中...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 font-black transition-colors  ">
        <ChevronLeft size={20} /> 返回
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-4 ">
             <div className="p-3 bg-amber-500 text-white rounded shadow-xl"><CircleDollarSign size={28}/></div>
             资金账户
          </h1>
          <p className="text-slate-500 font-medium tracking-tight ">管理多智能体协作所需的 Token 燃料与账户资金</p>
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
             <div className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ">
               <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div> 可用 Token 余额
             </div>
             <div className="text-6xl font-black mb-6 tracking-tighter">{tokenStats?.balance_display || '0.00M'}</div>
             <div className="flex items-center gap-2 text-indigo-100 font-bold text-sm bg-black/10 px-4 py-2 rounded-full w-fit">
                <Clock size={16} /> 预计可续航 <span className="text-amber-400 ml-1">{tokenStats?.estimated_days || 0} 天</span>
             </div>
           </div>
        </div>
        
        <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow flex flex-col justify-between group  ">
           <div>
             <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 ">今日智能体负载消耗</div>
             <div className="text-4xl font-black text-slate-900 flex items-baseline gap-2 ">
               {tokenStats?.today_usage_display || '0'} <span className="text-sm font-bold text-slate-300 uppercase tracking-tighter ">Tokens</span>
             </div>
           </div>
           <div className={`mt-8 flex items-center gap-2 font-black text-sm px-4 py-1.5 rounded-full w-fit ${
             tokenStats?.change_direction === 'up' ? 'text-rose-500 bg-rose-50' : 
             tokenStats?.change_direction === 'down' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-500 bg-slate-50'
           }`}>
             {tokenStats?.change_direction === 'up' ? <TrendingUp size={16} /> : 
              tokenStats?.change_direction === 'down' ? <TrendingDown size={16} /> : <Activity size={16} />}
             消耗环比{tokenStats?.change_direction === 'up' ? '上升' : tokenStats?.change_direction === 'down' ? '下降' : ''} {Math.abs(tokenStats?.change_rate || 0)}%
           </div>
        </div>

        <div className="bg-white rounded-lg p-10 border border-slate-100 card-shadow flex flex-col justify-between  ">
           <div>
             <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 ">账户累计充值</div>
             <div className="text-4xl font-black text-slate-900 tracking-tight ">{tokenStats?.total_purchased_display || '¥ 0.00'}</div>
           </div>
           <div className="mt-8">
              <button className="text-indigo-600 font-black text-sm flex items-center gap-1 hover:gap-2 transition-all ">
                管理支付方式 <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
           {/* 消耗趋势图 */}
           <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow  ">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 ">
                   <Activity className="text-indigo-600 " /> Token 资源消耗分布 (近 7 日)
                 </h3>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg uppercase  ">峰值: {(chartPeak/1000).toFixed(0)}k</span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-xs font-black rounded-lg uppercase  ">均值: {(chartAvg/1000).toFixed(0)}k</span>
                 </div>
              </div>
              <div className="h-[320px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData.length > 0 ? chartData : MOCK_USAGE_CHART}>
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
           <div className="bg-white p-10 rounded-lg border border-slate-100 card-shadow overflow-hidden  ">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 ">
                <History className="text-indigo-600 " /> 数字能源消耗流水 (Transaction Logs)
              </h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-50 text-xs uppercase font-black tracking-widest text-slate-400  ">
                          <th className="pb-4 pl-2">发生时间</th>
                          <th className="pb-4">操作类型</th>
                          <th className="pb-4 text-center">Token 消耗</th>
                          <th className="pb-4 text-right pr-2">费用参考</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 ">
                       {(tokenHistory.length > 0 ? tokenHistory : MOCK_TOKEN_HISTORY).map((h: any, i: number) => (
                         <tr key={i} className="group hover:bg-slate-50/50 transition-colors /50">
                            <td className="py-5 pl-2 text-sm font-bold text-slate-500 ">{h.date}</td>
                            <td className="py-5">
                               <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg uppercase tracking-tight  ">{h.type}</span>
                            </td>
                            <td className="py-5 text-center text-sm font-black text-slate-900 ">{h.tokens.toLocaleString()}</td>
                            <td className="py-5 text-right text-sm font-black text-slate-900  pr-2">{h.cost}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <button className="w-full mt-6 py-4 text-xs font-black text-slate-400 border border-dashed border-slate-200 rounded hover:bg-slate-50 transition-all uppercase tracking-widest  ">
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
                 {packages.map((pkg: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => setRechargeAmount(pkg.price)}
                      className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${rechargeAmount === pkg.price ? 'bg-indigo-600 border-indigo-400 shadow-xl scale-[1.02]' : 'bg-white/5 border-white/10 hover:border-indigo-500/50 group'}`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <div className={`text-xs font-black uppercase ${rechargeAmount === pkg.price ? 'text-indigo-200' : 'text-slate-500'}`}>{pkg.name}</div>
                          {pkg.discount && <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded uppercase">{pkg.discount}</span>}
                       </div>
                       <div className="text-3xl font-black mb-1">{pkg.tokens_display || pkg.tokens} <span className="text-xs font-bold opacity-40">Tokens</span></div>
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
           <div className="bg-white p-8 rounded-lg border border-slate-100 card-shadow  ">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center "><Bot size={20} className="text-indigo-600 " /></div>
                 <h3 className="text-lg font-black text-slate-900 leading-tight ">AI 负载预估</h3>
              </div>
              <div className="p-5 bg-slate-50 rounded-lg border border-slate-100 italic text-[11px] leading-relaxed text-slate-600   ">
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
                <div className="text-3xl font-black text-indigo-600">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
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
                      <div className={`text-2xl font-black ${solution.textColor}`}>{stat.value}</div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
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
              <div className="text-3xl font-black text-indigo-600 mb-1">{item.value}</div>
              <div className="font-bold text-slate-900 text-sm">{item.title}</div>
              <div className="text-xs text-slate-500">{item.desc}</div>
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
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-colors">
          <ChevronLeft size={20} /> 返回
        </button>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/ai-assistant?taskType=apply')}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded font-black text-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Edit3 size={18} /> 编辑资料
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
          <div className="bg-white rounded p-10 border border-slate-100 card-shadow text-center relative group">
            <button 
              onClick={() => handleEditProfile('skill')}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Edit3 size={16} />
            </button>
            <div className="w-40 h-40 bg-indigo-600 text-white flex items-center justify-center text-5xl font-black rounded-lg shadow-2xl ring-8 ring-indigo-50 mx-auto mb-8">
              {displayProfile.name.charAt(0)}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{displayProfile.name}</h1>
            <p className="text-xl text-indigo-600 font-black mb-6">{displayProfile.role || '点击编辑添加职位'}</p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {displayProfile.skills.length > 0 ? displayProfile.skills.map((skill: string, i: number) => (
                <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded">{skill}</span>
              )) : (
                <button 
                  onClick={() => handleEditProfile('skill')}
                  className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  + 添加技能
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded">
                <div className="text-2xl font-black text-slate-900">{displayProfile.experienceYears || 0}+</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">工作经验</div>
              </div>
              <div className="p-4 bg-slate-50 rounded">
                <div className="text-2xl font-black text-slate-900">-</div>
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
            <RadarChart data={displayProfile.radarData} />
          </div>
        </div>

        {/* 右侧主要内容 */}
        <div className="lg:col-span-8 space-y-10">
          {/* 职业概述 */}
          <div className="bg-indigo-50 rounded p-8 border border-indigo-100">
            <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <Sparkles size={18} className="text-indigo-600" /> 关于我
            </h3>
            <p className="text-base leading-relaxed text-slate-900 font-medium">"{displayProfile.summary}"</p>
          </div>

          {/* 工作经历 */}
          <div className="bg-white rounded p-12 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
              <Briefcase size={24} className="text-indigo-600" /> 工作经历
            </h3>
            {displayProfile.experience?.length > 0 ? (
              <div className="space-y-6">
                {displayProfile.experience.map((exp: any, i: number) => (
                  <div key={i} className="relative pl-12">
                    <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-4 border-indigo-600 flex items-center justify-center text-indigo-600 font-black z-10">{i + 1}</div>
                    {typeof exp === 'string' ? (
                      <p className="text-lg text-slate-700 font-medium whitespace-pre-wrap">{exp}</p>
                    ) : (
                      <div>
                        <h4 className="text-xl font-black text-slate-900 mb-1">{exp.position || exp.role || '职位'}</h4>
                        <p className="text-sm font-bold text-indigo-600 mb-2">{exp.company} · {exp.period}</p>
                        {exp.description && <p className="text-slate-500 font-medium">{exp.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : displayProfile.careerPath?.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                {displayProfile.careerPath.map((step: any, i: number) => (
                  <div key={i} className="relative pl-12">
                    <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-4 border-indigo-600 flex items-center justify-center text-indigo-600 font-black z-10">{i + 1}</div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">{step.role}</h4>
                    <p className="text-sm font-bold text-indigo-600 mb-2">{step.timeframe}</p>
                    <p className="text-slate-500 font-medium">{step.requirement}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
                <p>暂无工作经历，<button onClick={() => handleEditProfile('experience')} className="text-indigo-600 hover:underline">点击添加</button></p>
              </div>
            )}
          </div>

          {/* 项目经验 */}
          <div className="bg-white rounded p-12 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
              <Rocket size={24} className="text-amber-600" /> 项目经验
            </h3>
            {displayProfile.projects?.length > 0 ? (
              <div className="space-y-6">
                {displayProfile.projects.map((proj: any, i: number) => (
                  <div key={i} className="p-6 bg-gradient-to-br from-amber-50 to-white rounded-lg border border-amber-100">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-amber-500 rounded flex items-center justify-center flex-shrink-0">
                        <Rocket size={20} className="text-white" />
                      </div>
                      {typeof proj === 'string' ? (
                        <p className="text-lg text-slate-700 font-medium whitespace-pre-wrap flex-1">{proj}</p>
                      ) : (
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-slate-900 mb-1">{proj.name || '项目名称'}</h4>
                          {proj.role && <p className="text-sm font-bold text-amber-600 mb-2">角色：{proj.role}</p>}
                          {proj.description && <p className="text-slate-500 font-medium">{proj.description}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Rocket size={32} className="mx-auto mb-3 opacity-50" />
                <p>暂无项目经历，<button onClick={() => handleEditProfile('projects')} className="text-amber-600 hover:underline">点击添加</button></p>
              </div>
            )}
          </div>

          {/* 教育背景 */}
          <div className="bg-white rounded p-10 border border-slate-100 card-shadow">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <GraduationCap size={24} className="text-indigo-600" /> 教育背景
            </h3>
            {displayProfile.education?.length > 0 ? (
              <div className="space-y-4">
                {displayProfile.education.map((edu: any, i: number) => (
                  <div key={i} className="p-6 bg-gradient-to-r from-indigo-50 to-white rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-600 rounded flex items-center justify-center shadow-lg flex-shrink-0">
                        <GraduationCap size={28} className="text-white" />
                      </div>
                      {typeof edu === 'string' ? (
                        <p className="text-lg text-slate-700 font-medium whitespace-pre-wrap flex-1">{edu}</p>
                      ) : (
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-slate-900 mb-1">{edu.school || '学校名称'}</h4>
                          <p className="text-sm font-bold text-indigo-600 mb-1">
                            {edu.major}{edu.degree && ` · ${edu.degree}`}
                          </p>
                          {edu.period && <p className="text-slate-500 text-sm">{edu.period}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <GraduationCap size={32} className="mx-auto mb-3 opacity-50" />
                <p>暂无教育背景，<button onClick={() => handleEditProfile('education')} className="text-indigo-600 hover:underline">点击添加</button></p>
              </div>
            )}
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
                  {displayProfile.awards?.map((award, i) => (
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
                  {(!displayProfile.awards || displayProfile.awards.length === 0) && (
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
                  {displayProfile.certifications?.map((cert, i) => (
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
                  {(!displayProfile.certifications || displayProfile.certifications.length === 0) && (
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
                  {displayProfile.credentials?.map((cred, i) => (
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
                  {(!displayProfile.credentials || displayProfile.credentials.length === 0) && (
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
              {displayProfile.agentFeedbacks?.map((fb, i) => (
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
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  // 使用 API 获取动态数据
  const { data: memories, loading: memoriesLoading } = useMemories(userId, 'employer');
  
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
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  // 使用动态数据
  const { data: profileData, loading: profileLoading } = useProfile(userId, 'employer');
  const { data: memoriesData } = useMemories(userId, 'employer');
  
  // 从 memories 中提取企业信息
  const companyInfo = useMemo(() => {
    if (!memoriesData) return {};
    const info: any = {};
    memoriesData.forEach((m: any) => {
      const type = m.type?.toLowerCase();
      if (type === 'culture' || type === '文化') info.culture = m.content;
      if (type === 'tech' || type === '技术') info.tech = m.content;
      if (type === 'team' || type === '团队') info.team = m.content;
      if (type === 'benefit' || type === '福利') info.benefit = m.content;
    });
    return info;
  }, [memoriesData]);
  
  // 合并数据
  const employerData = profileData?.employer_data || {};
  const displayCompany = {
    name: employerData?.company_name || user?.company_name || '未设置公司名称',
    slogan: profileData?.title || employerData?.slogan || '',
    mission: profileData?.summary || employerData?.mission || companyInfo.culture || '',
    culture: employerData?.culture || companyInfo.culture || '',
    tech: employerData?.tech_stack || companyInfo.tech || '',
    benefits: employerData?.benefits || [],
    industry: employerData?.industry || '',
    size: employerData?.size || '',
    location: employerData?.location || '',
  };
  
  // 判断资料是否为空
  const isProfileEmpty = profileData?.is_empty || (!displayCompany.mission && !displayCompany.culture);
  
  // 跳转到 AI 助手编辑
  const handleEditCompany = (field: string) => {
    navigate(`/ai-assistant?editType=employer&editField=${field}`);
  };
  
  // 加载状态
  if (profileLoading) {
    return (
      <div className="pt-40 text-center">
        <Loader2 className="mx-auto text-indigo-600 animate-spin mb-4" size={48} />
        <p className="text-slate-500">加载企业资料中...</p>
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
        <div className="bg-white rounded-lg p-12 border border-slate-100 shadow-xl text-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 size={48} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">完善您的企业主页</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            您还没有设置企业主页信息。通过 AI 助手快速完善资料，展示企业文化，吸引更多优秀人才。
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
            <button 
              onClick={() => handleEditCompany('company')}
              className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-all"
            >
              <Building2 className="text-indigo-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">公司介绍</div>
              <div className="text-xs text-slate-500">添加公司基本信息</div>
            </button>
            <button 
              onClick={() => handleEditCompany('culture')}
              className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-all"
            >
              <Heart className="text-emerald-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">企业文化</div>
              <div className="text-xs text-slate-500">展示公司价值观</div>
            </button>
            <button 
              onClick={() => handleEditCompany('benefit')}
              className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg text-left transition-all"
            >
              <Gift className="text-amber-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">福利待遇</div>
              <div className="text-xs text-slate-500">展示员工福利</div>
            </button>
            <button 
              onClick={() => navigate('/ai-assistant?taskType=post')}
              className="p-4 bg-rose-50 hover:bg-rose-100 rounded-lg text-left transition-all"
            >
              <FileText className="text-rose-600 mb-2" size={24} />
              <div className="font-bold text-slate-900">发布职位</div>
              <div className="text-xs text-slate-500">开始招聘人才</div>
            </button>
          </div>
          <button 
            onClick={() => navigate('/ai-assistant?taskType=post')}
            className="bg-indigo-600 text-white px-8 py-4 rounded font-black shadow-xl hover:bg-indigo-700 transition-all"
          >
            开始完善资料
          </button>
        </div>
      </div>
    );
  }

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
                       <Globe size={12} /> {displayCompany.industry || 'AI 驱动型企业'}
                    </div>
                    <h1 className="text-5xl font-black mb-1 tracking-tight">{displayCompany.name}</h1>
                    <p className="text-xl text-indigo-100/70 font-medium">{displayCompany.slogan || '点击编辑添加公司标语'}</p>
                 </div>
              </div>
              <div className="flex gap-4 mb-2">
                 <button 
                   onClick={() => handleEditCompany('company')}
                   className="bg-white text-slate-900 px-7 py-3.5 rounded font-black hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                 >
                    <Edit3 size={18} /> 编辑资料
                 </button>
                 <button 
                   onClick={() => handleEditCompany('company')}
                   className="bg-white text-slate-900 px-7 py-3.5 rounded font-black hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                 >
                    <Edit3 size={18} /> 编辑资料
                 </button>
                 <button 
                   onClick={() => handleEditCompany('company')}
                   className="bg-white text-slate-900 px-7 py-3.5 rounded font-black hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                 >
                    <Edit3 size={18} /> 编辑资料
                 </button>
                 <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3.5 rounded font-black hover:bg-white/20 transition-all flex items-center gap-2">
                    <Share2 size={18} /> 分享主页
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
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 获取来源页面（如果有）
  const from = (location.state as any)?.from || null;
  
  // 表单数据
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 已登录则跳转
  useEffect(() => {
    if (isLoggedIn) {
      if (needsRoleSelection) {
        navigate('/select-role', { state: { from } });
      } else if (from) {
        // 跳转到来源页面
        navigate(from);
      } else {
        // 根据角色跳转到默认控制台
        if (userRole === 'employer' || userRole === 'recruiter' || userRole === 'admin') {
          navigate('/employer');
        } else {
          navigate('/candidate');
        }
      }
    }
  }, [isLoggedIn, needsRoleSelection, navigate, from, userRole]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLoginMode) {
        // 登录
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error || '登录失败');
        }
      } else {
        // 注册
        if (password !== confirmPassword) {
          setError('两次密码输入不一致');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('密码至少需要6位');
          setIsLoading(false);
          return;
        }
        const result = await register({ email, password, name, role: 'VIEWER' });
        if (!result.success) {
          setError(result.error || '注册失败');
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

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-white rounded-2xl p-10 shadow-2xl border border-slate-100 max-w-md mx-auto relative overflow-hidden">
        {/* 品牌装饰 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 rotate-6 hover:rotate-0 transition-transform">
            <Zap className="text-white" size={32}/>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {isLoginMode ? '欢迎回来' : '创建账号'}
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {isLoginMode ? '登录您的智能招聘空间' : '开启 AI 原生招聘之旅'}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* 登录/注册表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">姓名</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 focus:outline-none transition-all" 
                placeholder="请输入您的姓名"
                required={!isLoginMode}
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">邮箱</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 focus:outline-none transition-all" 
              placeholder="请输入邮箱地址"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 focus:outline-none transition-all" 
              placeholder={isLoginMode ? '请输入密码' : '设置密码（至少6位）'}
              required
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">确认密码</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-3.5 px-4 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 focus:outline-none transition-all" 
                placeholder="再次输入密码"
                required={!isLoginMode}
              />
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
              isLoginMode ? '登录' : '注册'
            )}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            className="text-sm text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
          >
            {isLoginMode ? '没有账号？立即注册' : '已有账号？立即登录'}
          </button>
        </div>

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
  
  // 文件上传状态
  const [uploadingFile, setUploadingFile] = useState(false);
  
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
  
  // 获取用户画像 memories 来判断完善程度
  const userId = user?.id || 0;
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
  
  // 生成欢迎消息
  const getWelcomeMessage = () => {
    if (!isLoggedIn) {
      return '您好！我是 Devnors AI 智能助手。\n\n请先登录以获得个性化的服务体验。';
    }
    const userName = user?.name || user?.email?.split('@')[0] || '用户';
    if (userRole === 'employer') {
      return `${userName}您好！我是您的 AI 招聘助手 🏢\n\n我可以帮您：\n• 搜索筛选候选人\n• 分析人才市场\n• 优化职位描述\n• 制定招聘策略\n\n有什么招聘需求？`;
    } else {
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
  
  // 过滤后的任务列表
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return tasks.filter((task: any) => {
      if (taskFilter === 'completed') {
        return task.status === 'completed';
      } else {
        return task.status !== 'completed';
      }
    });
  }, [tasks, taskFilter]);
  
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
        t.title === '完善个人简历资料' ||
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
          title: '完善个人简历资料',
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
        
        const promptMessage = `⚠️ **简历完善度检查**\n\n您好！我检测到您的简历资料还不够完整（当前完善度 ${completenessPercent}%）。\n\n**缺失的信息：**\n${missingLabels.map(l => `• ${l}`).join('\n')}\n\n完善的简历可以帮助您：\n✅ 获得更精准的职位推荐\n✅ 提高被HR查看的几率\n✅ 增加面试邀请机会\n\n✅ 我已为您创建了一个「完善简历资料」的任务。您可以：\n\n1️⃣ 点击左侧任务列表中的任务开始填写\n2️⃣ 或输入 **"完善简历"** 立即开始\n3️⃣ 或前往 [个人资料页](/candidate/profile) 手动编辑\n\n现在就开始完善吧！`;
        
        setGeneralMessages(prev => [...prev, {role: 'assistant', content: promptMessage}]);
        
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
      setPostMode({
        active: true,
        step: 'requirement',
        jobDescription: '',
        generatedResult: null
      });
      
      // 添加招聘发布引导消息
      const postMessage = `🏢 **发布招聘职位**\n\n欢迎使用 AI 智能招聘助手！我将帮您完成以下任务：\n\n**第一步：描述招聘需求**\n请告诉我您想招聘的职位信息，包括：\n• 职位名称\n• 工作职责\n• 技能要求\n• 薪资范围（可选）\n\n💡 示例：\n"招聘高级前端工程师，需要 3 年以上 React 经验，负责核心产品开发，薪资 30-50K"`;
      setGeneralMessages([{role: 'assistant', content: postMessage}]);
      
      // 清除 URL 参数
      navigate('/ai-assistant', { replace: true });
    }
  }, [taskTypeFromUrl, navigate]);
  
  // 处理招聘发布流程
  const handlePostProcess = async (userInput: string) => {
    if (postMode.step === 'requirement') {
      // 用户提交了招聘需求
      setPostMode(prev => ({ ...prev, jobDescription: userInput, step: 'generate' }));
      setGeneralMessages(prev => [...prev, {role: 'user', content: userInput}]);
      setIsTyping(true);
      
      // 模拟 AI 生成职位描述
      setTimeout(async () => {
        const generatedResult = `📋 **职位描述已生成！**\n\n**职位名称：** ${userInput.includes('前端') ? '高级前端工程师' : userInput.includes('后端') ? '高级后端工程师' : 'AI 应用工程师'}\n\n**岗位职责：**\n• 负责核心产品功能开发与优化\n• 参与技术方案设计与评审\n• 指导初级工程师，推动代码质量提升\n\n**任职要求：**\n• 本科及以上学历，计算机相关专业\n• 3年以上相关开发经验\n• 良好的沟通能力和团队协作精神\n\n**薪资福利：**\n• 薪资面议，五险一金\n• 弹性工作，免费三餐\n\n---\n\n我已将招聘需求保存到企业画像中。接下来，您想要：\n\n1️⃣ 发布职位并开始筛选\n2️⃣ 继续优化职位描述\n3️⃣ 查看人才推荐\n\n请输入数字或直接描述您的需求。`;
        
        // 保存到 Memory
        try {
          await createMemory({
            type: 'requirement',
            content: userInput.substring(0, 500),
            importance: 'High',
            scope: 'employer'
          }, userId);
          refetchMemories();
        } catch (e) {
          console.error('保存招聘需求记忆失败', e);
        }
        
        setGeneralMessages(prev => [...prev, {role: 'assistant', content: generatedResult}]);
        setPostMode(prev => ({ ...prev, step: 'optimize', generatedResult }));
        setIsTyping(false);
      }, 2000);
      
      return true;
    }
    
    if (postMode.step === 'optimize') {
      // 用户选择后续操作
      setGeneralMessages(prev => [...prev, {role: 'user', content: userInput}]);
      setIsTyping(true);
      
      setTimeout(() => {
        let response = '';
        if (userInput.includes('1') || userInput.includes('发布') || userInput.includes('筛选')) {
          response = `✅ **职位已发布成功！**\n\n🎯 系统已开始为您智能匹配候选人...\n\n**初步匹配结果：**\n\n**1. 张三** - 高级前端工程师\n• 匹配度：95%\n• 经验：5年\n• 现任职：字节跳动\n\n**2. 李四** - 全栈工程师\n• 匹配度：88%\n• 经验：4年\n• 现任职：阿里巴巴\n\n**3. 王五** - 前端技术专家\n• 匹配度：85%\n• 经验：6年\n• 现任职：腾讯\n\n💡 点击候选人姓名可查看详细简历，或告诉我您想了解哪位候选人。`;
        } else if (userInput.includes('2') || userInput.includes('优化') || userInput.includes('描述')) {
          response = `✨ **职位描述优化建议：**\n\n**1. 技术要求更具体**\n• 明确技术栈版本要求\n• 补充加分项技能\n\n**2. 职责更有吸引力**\n• 突出项目影响力\n• 强调成长空间\n\n**3. 福利亮点**\n• 添加独特福利\n• 强调团队文化\n\n请告诉我您想优化哪个部分，或者直接发送您的修改意见。`;
        } else if (userInput.includes('3') || userInput.includes('人才') || userInput.includes('推荐')) {
          response = `🎯 **人才智能推荐**\n\n基于您的企业画像和招聘需求，为您推荐以下人才：\n\n**技术匹配型：**\n• 候选人 A：React 专家，大厂背景\n• 候选人 B：全栈能手，创业经验\n\n**文化匹配型：**\n• 候选人 C：追求技术深度，适合研发团队\n• 候选人 D：沟通能力强，适合跨部门协作\n\n需要我详细介绍哪位候选人？`;
        } else {
          response = `好的，我来帮您处理：${userInput}\n\n请稍等，正在为您优化职位描述...`;
        }
        
        setGeneralMessages(prev => [...prev, {role: 'assistant', content: response}]);
        setIsTyping(false);
      }, 1500);
      
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
        content: `✨ **您的简历资料已经很完善了！**\n\n当前简历完善度：100%\n\n您可以：\n• 前往 [个人资料页](/candidate/profile) 查看和微调\n• 开始 [浏览职位](/jobs) 寻找机会\n• 让我帮您 [智能匹配职位](/ai-assistant?taskType=apply)\n\n🎉 任务已完成！还有什么我可以帮您的吗？`
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
        content: `📝 **开始完善简历资料**\n\n当前简历完善度：**${completenessPercent}%**\n\n需要补充以下信息（共 ${missingFields.length} 项）：\n\n${fieldsList}\n\n---\n\n🚀 **现在开始填写第 1 项：${missingFields[0].label}**\n\n${getFieldPrompt(missingFields[0].key)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`
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
      'expected_salary': '请输入您的期望薪资范围（如：25K-35K、30K以上、面议）：',
      'expected_location': '请输入您期望的工作地点（如：北京、上海、深圳、远程均可）：'
    };
    return prompts[fieldKey] || '请输入相关信息：';
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
      
      // 当进度达到100%时，自动将任务标记为已完成
      if (progress >= 100 && selectedTask) {
        const taskTitle = selectedTask.title || selectedTask.task || '';
        const taskType = selectedTask.todo_type || selectedTask.type || '';
        const isProfileTask = taskType === 'profile_complete' || 
          taskTitle === '完善个人简历资料' ||
          (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')));
        
        if (isProfileTask && selectedTask.status !== 'completed') {
          try {
            const { updateTodo } = await import('./services/apiService');
            await updateTodo(selectedTask.id, { status: 'completed', progress: 100 });
            console.log('[Profile Task] 任务已自动标记为完成');
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
        taskTitle === '完善个人简历资料' ||
        (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')));
      
      if (isProfileTask) {
        calculateProfileTaskProgress();
      }
    }
  }, [selectedTask, userId, userRole]);
  
  // 获取任务显示进度（对于完善简历任务使用动态计算的进度）
  const getTaskDisplayProgress = () => {
    if (!selectedTask) return 0;
    
    const taskTitle = selectedTask.title || selectedTask.task || '';
    const taskType = selectedTask.todo_type || selectedTask.type || '';
    const isProfileTask = taskType === 'profile_complete' || 
      taskTitle === '完善个人简历资料' ||
      (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')));
    
    if (isProfileTask) {
      return profileTaskProgress;
    }
    
    return selectedTask.progress || 0;
  };
  
  // 记录上次选中的任务ID，用于检测任务切换
  const lastSelectedTaskIdRef = useRef<number | null>(null);
  
  // 初始化任务专属消息
  useEffect(() => {
    if (!selectedTask) {
      lastSelectedTaskIdRef.current = null;
      return;
    }
    
    const taskTitle = selectedTask.title || selectedTask.task || '';
    const taskAdvice = selectedTask.aiAdvice || selectedTask.ai_advice || '';
    const taskType = selectedTask.todo_type || selectedTask.type || '';
    
    // 检查是否是完善简历资料任务
    const isProfileCompleteTask = taskType === 'profile_complete' || 
      taskTitle === '完善个人简历资料' ||
      (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')));
    
    // 检测是否是新选中的任务（任务切换）
    const isNewSelection = lastSelectedTaskIdRef.current !== selectedTask.id;
    lastSelectedTaskIdRef.current = selectedTask.id;
    
    if (isProfileCompleteTask && userRole === 'candidate') {
      // 对于完善简历任务，每次选中时都重新初始化并启动引导
      if (isNewSelection || !profileCompleteMode.active) {
        console.log('[useEffect] Initializing profile task, taskId:', selectedTask.id);
        // 重置引导模式状态
        setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
        
        // 初始化任务消息 - 直接启动引导，不再设置等待消息
        setTaskMessages(prev => ({
          ...prev,
          [selectedTask.id]: []  // 清空，让引导消息成为第一条
        }));
        
        // 立即启动引导流程（不再延迟）
        console.log('[useEffect] Starting profile guide immediately');
        startProfileCompleteGuide(true);
      }
    } else if (!taskMessages[selectedTask.id]) {
      // 普通任务初始化消息（只在没有消息时初始化）
      setTaskMessages(prev => ({
        ...prev,
        [selectedTask.id]: [{
          role: 'assistant',
          content: `你好！我是 Devnors 任务执行助手。关于「${taskTitle}」这项任务，我已经准备好协助您。${taskAdvice ? `\n\n💡 AI建议：${taskAdvice}` : ''}\n\n您可以告诉我您想要如何执行这个任务，或者有什么具体的问题需要我帮忙解答。`
        }]
      }));
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
            addAssistantMessage(`⏭️ 已跳过「${currentField?.label}」 (${skippedCount}/${totalFields})\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getFieldPrompt(nextField.key)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`);
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
                addAssistantMessage(`✅ **${pending.label}已更新！**\n\n旧值：${pending.existingValue}\n新值：${pending.value}\n\n---\n\n🎉 **恭喜！您的简历资料已全部完善！**\n\n✨ 简历完善度：**${progress}%**\n\n现在您可以：\n• 前往 [浏览职位](/jobs) 寻找机会\n• 让我帮您 [智能匹配职位](/ai-assistant?taskType=apply)\n• 查看 [个人资料](/candidate/profile) 预览简历\n\n祝您求职顺利！🚀`);
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
              addAssistantMessage(`✅ **${field.label}已保存！**\n\n---\n\n🎉 **恭喜！您的简历资料已全部完善！**\n\n✨ 简历完善度：**${actualProgress}%**\n\n现在您可以：\n• 前往 [浏览职位](/jobs) 寻找机会\n• 让我帮您 [智能匹配职位](/ai-assistant?taskType=apply)\n• 查看 [个人资料](/candidate/profile) 预览简历\n\n祝您求职顺利！🚀`);
              setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
            } else {
              // 自动进入下一项
              const nextField = profileCompleteMode.missingFields[nextIndex];
              addAssistantMessage(`✅ **${field.label}已保存！** (${completedCount}/${totalFields})\n\n📊 完善进度：${'█'.repeat(Math.floor(actualProgress / 10))}${'░'.repeat(10 - Math.floor(actualProgress / 10))} ${actualProgress}%\n\n---\n\n📝 **继续填写第 ${nextIndex + 1} 项：${nextField.label}**\n\n${getFieldPrompt(nextField.key)}\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`);
              
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
        addAssistantMessage(`我没有理解您的意思。\n\n现在正在填写「${currentField?.label || '简历信息'}」，请直接输入内容。\n\n💡 输入 "跳过" 可以跳过当前项，输入 "退出" 可以结束填写流程`);
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
              
              successMsg += `---\n\n`;
              successMsg += `您可以：\n`;
              successMsg += `• 前往 [个人主页](/candidate/profile) 查看和编辑资料\n`;
              successMsg += `• 前往 [记忆中心](/candidate/memory) 管理您的记忆\n`;
              successMsg += `• 开始 [浏览职位](/jobs) 寻找机会`;
              
              addFileUploadMessage(successMsg);
              
              // 刷新任务进度
              await calculateProfileTaskProgress();
              
              // 如果完善度达到100%，标记任务完成
              if (fillResult.completeness >= 100 && selectedTask) {
                const taskTitle = selectedTask.title || selectedTask.task || '';
                const taskType = selectedTask.todo_type || selectedTask.type || '';
                const isProfileTask = taskType === 'profile_complete' || 
                  taskTitle === '完善个人简历资料' ||
                  (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')));
                
                if (isProfileTask && selectedTask.status !== 'completed') {
                  const { updateTodo } = await import('./services/apiService');
                  await updateTodo(selectedTask.id, { status: 'completed', progress: 100 });
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

  const handleResetChat = () => {
    // 重置完善简历模式
    setProfileCompleteMode({ active: false, missingFields: [], currentFieldIndex: -1 });
    
    if (selectedTask) {
      const taskTitle = selectedTask.title || selectedTask.task || '';
      const taskType = selectedTask.todo_type || selectedTask.type || '';
      const isProfileTask = taskType === 'profile_complete' || 
        taskTitle === '完善个人简历资料' ||
        (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')));
      
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
                进行中 ({tasks.filter((t: any) => t.status !== 'completed').length})
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  taskFilter === 'completed' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                已完成 ({tasks.filter((t: any) => t.status === 'completed').length})
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
                        {task.status === 'running' && <Loader2 size={10} className="animate-spin text-amber-500" />}
                        {task.status === 'completed' && <CheckCircle2 size={10} className="text-emerald-500" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          task.status === 'running' ? 'text-amber-500' : 
                          task.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {task.status === 'running' ? '执行中' : task.status === 'completed' ? '已完成' : '待执行'}
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
                    <span>{selectedTask.description?.substring(0, 40)}{selectedTask.description?.length > 40 ? '...' : ''}</span>
                    <span className="flex items-center gap-1 text-indigo-600 font-medium flex-shrink-0">
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${getTaskDisplayProgress()}%` }}></div>
                      </div>
                      {getTaskDisplayProgress()}%
                    </span>
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
                          {msg.content}
                        </ReactMarkdown>
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
              {/* 上传附件按钮 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile || isTyping}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all disabled:opacity-50"
                title="上传简历文件 (PDF/Word/TXT)"
              >
                {uploadingFile ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Paperclip size={18} />
                )}
              </button>
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
                // 检查是否处于完善简历模式
                if (profileCompleteMode.active) {
                  const currentField = profileCompleteMode.missingFields[profileCompleteMode.currentFieldIndex];
                  if (currentField) {
                    // 根据当前字段显示可直接使用的示例值
                    const fieldPrompts: Record<string, {label: string; prompt: string; autoSend?: boolean}[]> = {
                      'display_name': [
                        { label: "跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'title': [
                        { label: "前端工程师", prompt: "高级前端工程师", autoSend: true },
                        { label: "后端工程师", prompt: "资深后端工程师", autoSend: true },
                        { label: "产品经理", prompt: "产品经理", autoSend: true },
                        { label: "跳过", prompt: "跳过", autoSend: true },
                      ],
                      'summary': [
                        { label: "跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'skills': [
                        { label: "前端技能", prompt: "React, TypeScript, Vue, Node.js, CSS", autoSend: true },
                        { label: "后端技能", prompt: "Python, Java, Go, MySQL, Redis", autoSend: true },
                        { label: "全栈技能", prompt: "React, Node.js, Python, MySQL, Docker", autoSend: true },
                        { label: "跳过", prompt: "跳过", autoSend: true },
                      ],
                      'experience': [
                        { label: "跳过此项", prompt: "跳过", autoSend: true },
                      ],
                      'education': [
                        { label: "本科示例", prompt: "北京大学 | 计算机科学 | 本科 | 2020年", autoSend: true },
                        { label: "硕士示例", prompt: "清华大学 | 软件工程 | 硕士 | 2022年", autoSend: true },
                        { label: "跳过", prompt: "跳过", autoSend: true },
                      ],
                      'expected_salary': [
                        { label: "25-35K", prompt: "25K-35K", autoSend: true },
                        { label: "35-50K", prompt: "35K-50K", autoSend: true },
                        { label: "50K以上", prompt: "50K以上", autoSend: true },
                        { label: "面议", prompt: "面议", autoSend: true },
                      ],
                      'expected_location': [
                        { label: "北京", prompt: "北京", autoSend: true },
                        { label: "上海", prompt: "上海", autoSend: true },
                        { label: "深圳", prompt: "深圳", autoSend: true },
                        { label: "远程", prompt: "远程均可", autoSend: true },
                      ],
                    };
                    return fieldPrompts[currentField.key] || [{ label: "跳过此项", prompt: "跳过", autoSend: true }];
                  }
                  return [];
                }
                
                // 非完善简历模式
                if (!selectedTask) {
                  // 没有选中任务，不显示提示
                  return [];
                }
                
                // 任务模式 - 根据任务类型返回相关提示
                const taskTitle = selectedTask.title || selectedTask.task || '';
                const taskType = selectedTask.todo_type || selectedTask.type || '';
                
                // 完善简历任务（但还没开始引导）
                if (taskType === 'profile_complete' || 
                    taskTitle === '完善个人简历资料' ||
                    (taskTitle.includes('完善') && (taskTitle.includes('简历') || taskTitle.includes('资料')))) {
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

// --- 招聘发布任务详情页 (EmployerPostView) - 重定向到 AI 助手 ---
const EmployerPostView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 重定向到 AI 助手页面并启动招聘发布任务
    navigate('/ai-assistant?taskType=post', { replace: true });
  }, [navigate]);

  return (
    <div className="pt-40 text-center">
      <Loader2 className="mx-auto text-indigo-600 animate-spin mb-4" size={48} />
      <p className="text-slate-500">正在跳转到 AI 助手...</p>
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isLoggedIn, userRole } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
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
          <Route path="/employer/post" element={<EmployerPostView />} />
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
