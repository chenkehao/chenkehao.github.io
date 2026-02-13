/**
 * 共享类型定义 - 从 Web 端迁移
 */

// ============ 用户相关 ============

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  account_tier: string;
  company_name?: string;
  company_logo?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  invite_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'candidate' | 'recruiter';
  company_name?: string;
  ref_code?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// ============ 职位相关 ============

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary_display?: string;
  description: string;
  requirements?: string;
  job_type: string;
  status: string;
  tags: JobTag[];
  view_count: number;
  apply_count: number;
  created_at: string;
  user_id?: number;
  salary_min?: number;
  salary_max?: number;
}

export interface JobTag {
  id: number;
  name: string;
  category?: string;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ============ 候选人相关 ============

export interface CandidateProfile {
  name: string;
  role: string;
  skills: string[];
  experienceYears: number;
  radarData: { subject: string; value: number }[];
  summary: string;
  idealJobPersona?: string;
  interviewQuestions?: string[];
  optimizationSuggestions?: string[];
  careerPath?: CareerNode[];
  salaryRange?: string;
  marketDemand?: string;
  skillGaps?: SkillGap[];
  agentFeedbacks?: AgentFeedback[];
  certifications?: Certification[];
  awards?: Award[];
  credentials?: Credential[];
}

export interface CareerNode {
  role: string;
  requirement: string;
  timeframe: string;
}

export interface SkillGap {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  resource: string;
}

export interface AgentFeedback {
  agentName: string;
  type: 'Technical' | 'SoftSkills' | 'Strategy';
  comment: string;
  score: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  icon?: string;
  color?: string;
}

export interface Award {
  name: string;
  org: string;
  year: string;
  description: string;
}

export interface Credential {
  name: string;
  authority: string;
  validUntil?: string;
}

export interface Candidate {
  id: number;
  user_id: number;
  resume_text?: string;
  is_profile_complete: boolean;
  profile?: CandidateProfile;
  created_at: string;
}

// ============ 工作流相关 ============

export interface Flow {
  id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  current_stage: string;
  current_step: number;
  match_score: number;
  tokens_consumed: number;
  next_action?: string;
  agents_used?: string[];
  timeline: FlowTimelineItem[];
  created_at: string;
  candidate_name?: string;
  job_title?: string;
  company?: string;
}

export interface FlowTimelineItem {
  action: string;
  agent_name?: string;
  tokens_used: number;
  timestamp: string;
}

export interface FlowListResponse {
  items: Flow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ============ Token 相关 ============

export interface TokenStats {
  balance: number;
  balance_display: string;
  today_usage: number;
  today_usage_display: string;
  change_rate: number;
  change_direction: string;
  total_purchased: number;
  total_purchased_display: string;
  estimated_days: number;
  packages: TokenPackage[];
}

export interface TokenPackage {
  id: number;
  name: string;
  tokens: number;
  price: number;
  description?: string;
}

// ============ 通知相关 ============

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  extra_data?: Record<string, unknown>;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

// ============ 待办相关 ============

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  progress: number;
  source?: string;
  todo_type?: string;
  ai_advice?: string;
  steps?: TodoStep[];
  due_date?: string;
  created_at: string;
}

export interface TodoStep {
  title: string;
  status: string;
  description?: string;
}

// ============ 记忆相关 ============

export interface Memory {
  id: number;
  user_id: number;
  type: string;
  content: string;
  importance: string;
  scope: 'candidate' | 'employer';
  created_at: string;
}

// ============ 邀请相关 ============

export interface InviteStats {
  invite_code: string;
  invite_link: string;
  invite_count: number;
  total_reward_tokens: number;
  token_balance: number;
  records: InviteRecord[];
  rules: {
    per_invite_reward: number;
    new_user_bonus: number;
    milestone_5: number;
    milestone_10: number;
    milestone_20: number;
  };
}

export interface InviteRecord {
  id: number;
  invitee_name: string;
  reward_tokens: number;
  status: string;
  created_at: string | null;
}

// ============ AI 聊天相关 ============

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  todoId?: number | null;
}

export interface AIModel {
  id: string;
  name: string;
  tier: AccountTier;
}

export const AI_MODELS: AIModel[] = [
  { id: 'Devnors 1.0', name: 'Devnors 1.0', tier: 'FREE' },
  { id: 'Devnors 1.0 Pro', name: 'Devnors 1.0 Pro', tier: 'PRO' },
  { id: 'Devnors 1.0 Ultra', name: 'Devnors 1.0 Ultra', tier: 'ULTRA' },
];

// ============ 通用 ============

export type AccountTier = 'FREE' | 'PRO' | 'ULTRA';
export type UserRole = 'candidate' | 'recruiter' | 'admin' | 'viewer';
