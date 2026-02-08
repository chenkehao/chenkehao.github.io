/**
 * API Service - 与后端 API 对接
 */

// 后端 API 基础地址（使用相对路径，通过 Vite 代理）
const API_BASE_URL = '/api/v1';

// Token 存储 key
const TOKEN_KEY = 'devnors_access_token';
const USER_KEY = 'devnors_user';

/**
 * 获取存储的 Token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 设置 Token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 清除 Token
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * 获取存储的用户信息
 */
export const getStoredUser = (): any | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * 存储用户信息
 */
export const setStoredUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * 通用请求函数
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || `HTTP Error: ${response.status}`);
  }

  // 处理空响应
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  return JSON.parse(text);
}

// ============ 认证 API ============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'candidate' | 'recruiter';
  company_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  account_tier: string;
  company_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await request<AuthResponse>('/auth/login/json', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (response.access_token) {
    setToken(response.access_token);
  }
  
  return response;
};

/**
 * 用户注册
 */
export const register = async (data: RegisterRequest): Promise<UserInfo> => {
  return request<UserInfo>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const user = await request<UserInfo>('/auth/me');
  setStoredUser(user);
  return user;
};

/**
 * 登出
 */
export const logout = (): void => {
  clearToken();
  localStorage.removeItem('devnors_user');
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * 更新用户信息
 */
export const updateUser = async (data: {
  name?: string;
  phone?: string;
  avatar_url?: string;
  company_name?: string;
  company_logo?: string;
}): Promise<UserInfo> => {
  return request<UserInfo>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * 更新用户角色
 */
export const updateUserRole = async (role: string): Promise<any> => {
  return request(`/auth/me/role?role=${role}`, {
    method: 'PUT',
  });
};

/**
 * 修改密码
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<any> => {
  return request(`/auth/me/password?old_password=${encodeURIComponent(oldPassword)}&new_password=${encodeURIComponent(newPassword)}`, {
    method: 'PUT',
  });
};

/**
 * 上传头像
 */
export const uploadAvatar = async (file: File): Promise<UserInfo> => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/auth/me/avatar`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || '头像上传失败');
  }
  
  return response.json();
};

// ============ AI API ============

export interface ResumeAnalysisResult {
  name: string;
  role: string;
  skills: string[];
  experienceYears: number;
  summary: string;
  idealJobPersona?: string;
  salaryRange?: string;
  marketDemand?: string;
  radarData: { subject: string; value: number }[];
  interviewQuestions?: string[];
  optimizationSuggestions?: string[];
  careerPath?: { role: string; requirement: string; timeframe: string }[];
  skillGaps?: { skill: string; priority: string; resource: string }[];
  agentFeedbacks?: { agentName: string; type: string; comment: string; score: number }[];
}

/**
 * AI 简历分析
 */
export const analyzeResumeAPI = async (resumeText: string): Promise<ResumeAnalysisResult> => {
  return request<ResumeAnalysisResult>('/ai/analyze-resume', {
    method: 'POST',
    body: JSON.stringify({ resume_text: resumeText }),
  });
};

/**
 * AI 面试对话
 */
export const chatWithInterviewerAPI = async (
  history: { role: string; content: string }[],
  message: string
): Promise<{ response: string; tokens_used: number }> => {
  return request('/ai/interview/chat', {
    method: 'POST',
    body: JSON.stringify({ history, message }),
  });
};

/**
 * AI 职位匹配
 */
export const matchJobsAPI = async (
  candidateId: number,
  jobIds?: number[]
): Promise<{ matches: { job_id: number; match_score: number; match_reasons: string[]; gaps: string[] }[] }> => {
  return request('/ai/match-jobs', {
    method: 'POST',
    body: JSON.stringify({ candidate_id: candidateId, job_ids: jobIds }),
  });
};

/**
 * 市场分析
 */
export const analyzeMarketAPI = async (data: {
  role: string;
  skills: string[];
  experience_years: number;
  location?: string;
}): Promise<{
  salary_range: string;
  market_demand: string;
  competition_level: string;
  trending_skills: string[];
  recommendations: string[];
}> => {
  return request('/ai/market-analysis', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 获取 Token 使用情况
 */
export const getTokenUsage = async (): Promise<{
  total_tokens: number;
  used_tokens: number;
  remaining_tokens: number;
  usage_breakdown: Record<string, number>;
}> => {
  return request('/ai/token-usage');
};

// ============ 职位 API ============

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
  tags: { id: number; name: string }[];
  view_count: number;
  apply_count: number;
  created_at: string;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * 获取职位列表
 */
export const getJobs = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  location?: string;
}): Promise<JobListResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.page_size) query.set('page_size', params.page_size.toString());
  if (params?.search) query.set('search', params.search);
  if (params?.location) query.set('location', params.location);
  
  const queryString = query.toString();
  return request(`/jobs${queryString ? `?${queryString}` : ''}`);
};

/**
 * 获取职位详情
 */
export const getJob = async (id: number): Promise<Job> => {
  return request(`/jobs/${id}`);
};

/**
 * 创建职位
 */
export const createJob = async (data: {
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  tags?: string[];
  user_id?: number;
}): Promise<Job> => {
  const storedUser = getStoredUser();
  const payload = {
    ...data,
    user_id: data.user_id || storedUser?.id || 1,
  };
  return request('/public/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * 获取我发布的职位
 */
export const getMyJobs = async (userId: number): Promise<any[]> => {
  return request(`/public/my-jobs?user_id=${userId}`);
};

/**
 * 获取岗位详情及投递列表
 */
export const getJobDetail = async (jobId: number, userId: number): Promise<any> => {
  return request(`/public/job-detail/${jobId}?user_id=${userId}`);
};

/**
 * 更新职位
 */
export const updateJob = async (id: number, data: Partial<Job> & { user_id?: number }): Promise<any> => {
  const storedUser = getStoredUser();
  const payload = { ...data, user_id: data.user_id || storedUser?.id || 1 };
  return request(`/public/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

/**
 * 删除职位
 */
export const deleteJob = async (id: number, userId?: number): Promise<void> => {
  const storedUser = getStoredUser();
  const uid = userId || storedUser?.id || 1;
  return request(`/public/jobs/${id}?user_id=${uid}`, {
    method: 'DELETE',
  });
};

// ============ 候选人 API ============

export interface Candidate {
  id: number;
  user_id: number;
  resume_text?: string;
  is_profile_complete: boolean;
  profile?: ResumeAnalysisResult;
  created_at: string;
}

/**
 * 获取我的候选人档案
 */
export const getMyCandidate = async (): Promise<Candidate> => {
  return request('/candidates/me');
};

/**
 * 获取候选人列表（企业用户）
 */
export const getCandidates = async (): Promise<Candidate[]> => {
  return request('/candidates');
};

/**
 * 获取候选人详情
 */
export const getCandidate = async (id: number): Promise<Candidate> => {
  return request(`/candidates/${id}`);
};

// ============ 工作流 API ============

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
  timeline: { action: string; agent_name?: string; tokens_used: number; timestamp: string }[];
  created_at: string;
}

export interface FlowListResponse {
  items: Flow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * 获取工作流列表
 */
export const getFlows = async (params?: {
  page?: number;
  status?: string;
}): Promise<FlowListResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.status) query.set('status', params.status);
  
  const queryString = query.toString();
  return request(`/flows${queryString ? `?${queryString}` : ''}`);
};

/**
 * 获取工作流详情
 */
export const getFlow = async (id: number): Promise<Flow> => {
  return request(`/flows/${id}`);
};

/**
 * 创建工作流
 */
export const createFlow = async (data: {
  candidate_id: number;
  job_id: number;
}): Promise<Flow> => {
  return request('/flows', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 推进工作流
 */
export const advanceFlow = async (id: number): Promise<Flow> => {
  return request(`/flows/${id}/advance`, {
    method: 'POST',
  });
};

// ============ 公开 API (无需登录) ============

/**
 * 获取推荐职位列表
 */
export const getRecommendedJobs = async (limit: number = 5): Promise<any[]> => {
  return request(`/public/jobs-recommended?limit=${limit}`);
};

/**
 * 获取公开职位列表
 */
export const getPublicJobs = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  location?: string;
}): Promise<any> => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.page_size) query.append('page_size', params.page_size.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.location) query.append('location', params.location);
  return request(`/public/jobs?${query.toString()}`);
};

/**
 * 获取公开职位详情
 */
export const getPublicJob = async (jobId: number): Promise<any> => {
  return request(`/public/jobs/${jobId}`);
};

/**
 * 获取工作流列表
 */
export const getPublicFlows = async (limit: number = 10): Promise<any[]> => {
  return request(`/public/flows?limit=${limit}`);
};

/**
 * 获取工作流详情
 */
export const getPublicFlow = async (flowId: number): Promise<any> => {
  return request(`/public/flows/${flowId}`);
};

/**
 * 获取人才列表
 */
export const getPublicTalents = async (limit: number = 10): Promise<any[]> => {
  return request(`/public/talents?limit=${limit}`);
};

// Token 统计已移到文件末尾的新 API

/**
 * 获取资质认证
 */
export const getQualifications = async (): Promise<any[]> => {
  return request('/public/stats/qualifications');
};

/**
 * 获取记忆 - 支持人才画像和企业画像
 * @param userId 用户ID
 * @param scope 记忆范围: 'candidate' (人才画像) 或 'employer' (企业画像)
 */
export const getMemories = async (userId: number = 1, scope: 'candidate' | 'employer' = 'candidate'): Promise<any[]> => {
  return request(`/public/memories?user_id=${userId}&scope=${scope}`);
};

/**
 * 创建记忆 - 支持人才画像和企业画像
 */
export const createMemory = async (data: {
  type: string;
  content: string;
  importance?: string;
  scope?: 'candidate' | 'employer';
}, userId: number = 1): Promise<any> => {
  return request(`/public/memories?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 删除记忆
 */
export const deleteMemory = async (memoryId: number): Promise<any> => {
  return request(`/public/memories/${memoryId}`, {
    method: 'DELETE',
  });
};

/**
 * AI 驱动的记忆优化
 * 1. 合并重复同类记忆
 * 2. 删除不重要的无意义记忆
 * 3. 检查并修正记忆分类
 * 4. 从用户行为总结新记忆
 */
export const optimizeMemories = async (userId: number, scope: 'candidate' | 'employer' = 'candidate'): Promise<any> => {
  return request(`/public/memories/optimize?user_id=${userId}&scope=${scope}`, {
    method: 'POST',
  });
};

/**
 * 获取待办任务
 */
export const getTodos = async (userId: number = 1): Promise<any[]> => {
  return request(`/public/todos?user_id=${userId}`);
};

/**
 * 创建待办事项
 */
export const createTodo = async (data: {
  title: string;
  description?: string;
  priority?: string;
  source?: string;
  todo_type?: string;
  ai_advice?: string;
  steps?: any[];
  due_date?: string;
}, userId: number = 1): Promise<any> => {
  return request(`/public/todos?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 更新待办事项
 */
export const updateTodo = async (todoId: number, data: {
  status?: string;
  progress?: number;
}): Promise<any> => {
  const params = new URLSearchParams();
  if (data.status) params.append('status', data.status);
  if (data.progress !== undefined) params.append('progress', String(data.progress));
  
  return request(`/public/todos/${todoId}?${params.toString()}`, {
    method: 'PUT',
  });
};

/**
 * 删除待办事项
 */
export const deleteTodo = async (todoId: number): Promise<any> => {
  return request(`/public/todos/${todoId}`, {
    method: 'DELETE',
  });
};

/**
 * 清理重复的「完善简历资料」任务
 */
export const cleanupDuplicateProfileTasks = async (userId: number): Promise<any> => {
  return request(`/public/todos/cleanup/duplicates?user_id=${userId}`, {
    method: 'DELETE',
  });
};

/**
 * 获取任务列表
 */
export const getTasks = async (userId: number = 1): Promise<any[]> => {
  return request(`/public/tasks?user_id=${userId}`);
};

/**
 * AI 助手聊天
 */
export const chatWithAI = async (data: {
  message: string;
  history?: Array<{role: string; content: string}>;
  model?: string;
  context?: string;
}): Promise<{response: string; tokens_used: number; model: string}> => {
  return request('/public/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: data.message,
      history: data.history || [],
      model: data.model || 'Devnors 1.0',
      context: data.context || '',
    }),
  });
};

/**
 * 获取个性化招聘建议（基于企业资料由大模型生成）
 */
export const getRecruitmentSuggestions = async (userId: number = 1): Promise<{
  company_name: string;
  company_summary: string;
  suggestions: string[];
  enterprise_context: string;
}> => {
  return request(`/public/recruitment-suggestions?user_id=${userId}`);
};

// ==================== 设置相关 API ====================

/**
 * 获取用户设置
 */
export const getSettings = async (userId: number = 1): Promise<any> => {
  return request(`/settings?user_id=${userId}`);
};

/**
 * 更新用户设置
 */
export const updateSettings = async (data: {
  display_name?: string;
  short_name?: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  address?: string;
  detail_address?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  funding_stage?: string;
  description?: string;
  hr_phone?: string;
  benefits?: string;
  notification_enabled?: boolean;
  dark_mode?: boolean;
  [key: string]: any;
}, userId: number = 1): Promise<any> => {
  return request(`/settings?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * 获取企业认证信息
 */
export const getEnterpriseCertifications = async (userId: number = 1): Promise<any[]> => {
  return request(`/settings/enterprise-certifications?user_id=${userId}`);
};

/**
 * 获取个人认证信息
 */
export const getPersonalCertifications = async (userId: number = 1): Promise<any[]> => {
  return request(`/settings/personal-certifications?user_id=${userId}`);
};

/**
 * 创建个人认证
 */
export const createPersonalCertification = async (data: {
  name: string;
  organization: string;
  cert_date: string;
  category: string;
  degree?: string;
  major?: string;
  cert_number?: string;
  score?: number;
  level?: string;
  color?: string;
  icon?: string;
  image_data?: string;
}, userId: number = 1): Promise<any> => {
  return request(`/settings/personal-certifications?user_id=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      organization: data.organization,
      cert_date: data.cert_date || '',
      category: data.category,
      degree: data.degree || null,
      major: data.major || null,
      cert_number: data.cert_number || null,
      score: data.score !== undefined ? data.score : null,
      level: data.level || null,
      color: data.color || null,
      icon: data.icon || null,
      image_data: data.image_data || null,
    }),
  });
};

/**
 * 创建企业认证
 */
export const createEnterpriseCertification = async (data: {
  name: string;
  organization?: string;
  cert_date?: string;
  category?: string;
  color?: string;
  icon?: string;
  score?: number;
  credit_code?: string;
  valid_period?: string;
  business_address?: string;
  registered_capital?: string;
  business_scope?: string;
  image_data?: string;
  id_card_name?: string;
  id_card_number?: string;
  id_card_authority?: string;
  id_card_valid_period?: string;
  image_data_front?: string;
  image_data_back?: string;
}, userId: number = 1): Promise<any> => {
  // 使用 JSON body 传递数据以支持大字段（如 base64 图片）
  return request(`/settings/enterprise-certifications?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      organization: data.organization || '系统认证',
      cert_date: data.cert_date || new Date().toISOString().split('T')[0],
      category: data.category || 'qualification',
      color: data.color,
      icon: data.icon,
      score: data.score,
      credit_code: data.credit_code,
      valid_period: data.valid_period,
      business_address: data.business_address,
      registered_capital: data.registered_capital,
      business_scope: data.business_scope,
      image_data: data.image_data,
      id_card_name: data.id_card_name,
      id_card_number: data.id_card_number,
      id_card_authority: data.id_card_authority,
      id_card_valid_period: data.id_card_valid_period,
      image_data_front: data.image_data_front,
      image_data_back: data.image_data_back
    })
  });
};

/**
 * 获取团队成员
 */
export const getTeamMembers = async (userId: number = 1): Promise<any> => {
  return request(`/settings/team-members?user_id=${userId}`);
};

/**
 * 邀请团队成员（支持手机号或邮箱）
 */
export const inviteTeamMember = async (data: {
  name?: string;
  email?: string;
  phone?: string;
  role: string;
}, userId: number = 1): Promise<any> => {
  return request(`/settings/team-members?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 删除团队成员
 */
export const deleteTeamMember = async (memberId: number, userId: number = 1): Promise<any> => {
  return request(`/settings/team-members/${memberId}?user_id=${userId}`, {
    method: 'DELETE',
  });
};

/**
 * 移交管理员权限
 */
export const transferAdmin = async (newAdminId: number, userId: number = 1): Promise<any> => {
  return request(`/settings/team-members/transfer-admin?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ new_admin_id: newAdminId }),
  });
};

/**
 * 获取企业信息
 */
export const getEnterpriseInfo = async (userId: number = 1): Promise<any> => {
  return request(`/settings/enterprise-info?user_id=${userId}`);
};

/**
 * 检查企业是否已被验证
 */
export const checkEnterpriseVerification = async (creditCode: string, userId: number = 1): Promise<any> => {
  return request(`/settings/enterprise/check-verification?credit_code=${encodeURIComponent(creditCode)}&user_id=${userId}`, {
    method: 'POST',
  });
};

/**
 * 申请加入企业
 */
export const requestJoinEnterprise = async (enterpriseId: number, userId: number = 1): Promise<any> => {
  return request(`/settings/enterprise/request-join?enterprise_id=${enterpriseId}&user_id=${userId}`, {
    method: 'POST',
  });
};

/**
 * 审批成员加入申请
 */
export const approveMember = async (memberId: number, approve: boolean, userId: number = 1): Promise<any> => {
  return request(`/settings/enterprise/approve-member/${memberId}?approve=${approve}&user_id=${userId}`, {
    method: 'POST',
  });
};

/**
 * 获取AI引擎配置
 */
export const getAIConfigs = async (userId: number = 1): Promise<any[]> => {
  return request(`/settings/ai-configs?user_id=${userId}`);
};

/**
 * 创建AI引擎配置
 */
export const createAIConfig = async (data: {
  task: string;
  model_name: string;
  provider: string;
}, userId: number = 1): Promise<any> => {
  return request(`/settings/ai-configs?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 获取API密钥
 */
export const getAPIKeys = async (userId: number = 1): Promise<any[]> => {
  return request(`/settings/api-keys?user_id=${userId}`);
};

/**
 * 生成新API密钥
 */
export const createAPIKey = async (
  name: string = "Production Key",
  environment: string = "production",
  userId: number = 1
): Promise<any> => {
  return request(`/settings/api-keys?name=${encodeURIComponent(name)}&environment=${environment}&user_id=${userId}`, {
    method: 'POST',
  });
};

/**
 * 获取审计日志
 */
export const getAuditLogs = async (userId: number = 1, limit: number = 50): Promise<any[]> => {
  return request(`/settings/audit-logs?user_id=${userId}&limit=${limit}`);
};

/**
 * 获取账户等级信息
 */
export const getAccountTier = async (userId: number = 1): Promise<any> => {
  return request(`/settings/account-tier?user_id=${userId}`);
};

/**
 * 升级/变更账户等级
 */
export const upgradeAccountTier = async (userId: number, tier: string, billingCycle: string = 'annual'): Promise<any> => {
  return request(`/settings/account-tier/upgrade?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ tier, billing_cycle: billingCycle }),
  });
};

export default {
  // Auth
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  getToken,
  updateUser,
  updateUserRole,
  changePassword,
  // AI
  analyzeResumeAPI,
  chatWithInterviewerAPI,
  matchJobsAPI,
  analyzeMarketAPI,
  getTokenUsage,
  // Jobs
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  getJobDetail,
  // Candidates
  getMyCandidate,
  getCandidates,
  getCandidate,
  // Flows
  getFlows,
  getFlow,
  createFlow,
  advanceFlow,
  // Users
  getTeamMembers,
  inviteTeamMember,
  // Public APIs
  getRecommendedJobs,
  getPublicJobs,
  getPublicJob,
  getPublicFlows,
  getPublicFlow,
  getPublicTalents,
  getTokenStats,
  getQualifications,
  getMemories,
  createMemory,
  deleteMemory,
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getTasks,
  chatWithAI,
  // Profile APIs
  getUserProfile,
  updateUserProfile,
  updateProfileField,
};

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: number, profileType: 'candidate' | 'employer' = 'candidate'): Promise<any> {
  return request(`/public/profile?user_id=${userId}&profile_type=${profileType}`);
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: number, 
  profileType: 'candidate' | 'employer',
  data: {
    display_name?: string;
    title?: string;
    summary?: string;
    avatar_url?: string;
    cover_url?: string;
    candidate_data?: any;
    employer_data?: any;
  }
): Promise<any> {
  return request(`/public/profile?user_id=${userId}&profile_type=${profileType}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新用户资料的单个字段
 * @param forceUpdate 是否强制覆盖已有值（默认 false，只在字段为空时保存）
 */
export async function updateProfileField(
  userId: number,
  profileType: 'candidate' | 'employer',
  field: string,
  value: string,
  forceUpdate: boolean = false
): Promise<any> {
  return request(`/public/profile/field?user_id=${userId}&profile_type=${profileType}&field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}&force_update=${forceUpdate}`, {
    method: 'PATCH',
  });
}

/**
 * 更新候选人身份信息（从身份证识别）
 */
export async function updateCandidateIdentity(
  userId: number,
  data: {
    real_name?: string;
    gender?: string;
    birthday?: string;
    id_number?: string;
    address?: string;
    ethnicity?: string;
    id_issuing_authority?: string;
    id_valid_period?: string;
  }
): Promise<any> {
  // 将身份信息存储到 candidate_data 中
  return request(`/public/profile?user_id=${userId}&profile_type=candidate`, {
    method: 'POST',
    body: JSON.stringify({
      candidate_data: {
        identity_info: data
      }
    }),
  });
}

/**
 * 更新候选人教育信息（从学历证书识别）
 */
export async function updateCandidateEducation(
  userId: number,
  data: {
    education?: string;
    school?: string;
    major?: string;
    graduation_year?: string;
    degree?: string;
    cert_number?: string;
  }
): Promise<any> {
  return request(`/public/profile?user_id=${userId}&profile_type=candidate`, {
    method: 'POST',
    body: JSON.stringify({
      candidate_data: {
        education_info: data
      }
    }),
  });
}

// ============ Token 资金账户 API ============

/**
 * 获取用户 Token 统计信息
 */
export async function getTokenStats(userId: number): Promise<any> {
  return request(`/public/tokens/stats?user_id=${userId}`);
}

/**
 * 获取 Token 消耗历史
 */
export async function getTokenHistory(userId: number, limit: number = 20, offset: number = 0): Promise<any> {
  return request(`/public/tokens/history?user_id=${userId}&limit=${limit}&offset=${offset}`);
}

/**
 * 获取 Token 消耗趋势图数据
 */
export async function getTokenChart(userId: number, days: number = 7): Promise<any> {
  return request(`/public/tokens/chart?user_id=${userId}&days=${days}`);
}

/**
 * 获取可购买的 Token 套餐
 */
export async function getTokenPackages(): Promise<any> {
  return request('/public/tokens/packages');
}

/**
 * 记录 Token 消耗
 */
export async function recordTokenUsage(
  userId: number,
  action: string,
  tokens: number,
  description?: string
): Promise<any> {
  const params = new URLSearchParams({
    user_id: String(userId),
    action,
    tokens: String(tokens),
  });
  if (description) {
    params.append('description', description);
  }
  return request(`/public/tokens/record?${params.toString()}`, {
    method: 'POST',
  });
}

// ============ 消息通知 API ============

/**
 * 获取用户通知列表
 */
export async function getNotifications(
  userId: number,
  options: {
    type?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<any> {
  const params = new URLSearchParams({
    user_id: String(userId),
    page: String(options.page || 1),
    page_size: String(options.pageSize || 20),
  });
  if (options.type) {
    params.append('notification_type', options.type);
  }
  if (options.unreadOnly) {
    params.append('unread_only', 'true');
  }
  return request(`/public/notifications?${params.toString()}`);
}

/**
 * 标记通知已读
 */
export async function markNotificationRead(
  userId: number,
  notificationId?: number
): Promise<any> {
  const params = new URLSearchParams({
    user_id: String(userId),
  });
  if (notificationId) {
    params.append('notification_id', String(notificationId));
  }
  return request(`/public/notifications/read?${params.toString()}`, {
    method: 'POST',
  });
}

/**
 * 删除通知
 */
export async function deleteNotification(
  userId: number,
  notificationId: number
): Promise<any> {
  return request(`/public/notifications/${notificationId}?user_id=${userId}`, {
    method: 'DELETE',
  });
}

/**
 * 获取未读通知数量
 */
export async function getUnreadNotificationCount(userId: number): Promise<any> {
  return request(`/public/notifications/unread-count?user_id=${userId}`);
}

/**
 * 解析简历文件 (PDF/Word/TXT)
 */
export async function parseResumeFile(file: File): Promise<{
  success: boolean;
  filename: string;
  file_type: string;
  content: string;
  char_count: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/public/parse-resume`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '文件解析失败' }));
    throw new Error(error.detail || '文件解析失败');
  }
  
  return response.json();
}

/**
 * 智能解析简历并自动填充用户资料
 */
export async function autoFillProfileFromResume(
  userId: number,
  resumeContent: string
): Promise<{
  success: boolean;
  parsed_data: any;
  updates_made: string[];
  memories_created: string[];
  completeness: number;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/public/auto-fill-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      resume_content: resumeContent,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '自动填充失败' }));
    throw new Error(error.detail || '自动填充失败');
  }
  
  return response.json();
}

/**
 * 证件 OCR 审核 API
 * 使用 AI 视觉能力分析证件图片，判断是否有效并提取信息
 */
export async function certOCRReview(
  imageBase64: string,
  certType: 'education' | 'skill_driver' | 'skill_cert' | 'work' | 'identity_front' | 'identity_back' | 'credit_fund' | 'credit_social' | 'business_license' | 'org_code' | 'tax_registration' | 'legal_person_id' | 'legal_person_id_front' | 'legal_person_id_back' | 'qualification' | 'enterprise_credit',
  userId: number = 1
): Promise<{
  success: boolean;
  reason?: string;
  extracted_info?: Record<string, string>;
  detected_side?: 'front' | 'back';
}> {
  try {
    // 映射法人身份证类型到通用身份证类型
    let mappedCertType = certType;
    if (certType === 'legal_person_id_front') {
      mappedCertType = 'identity_front';
    } else if (certType === 'legal_person_id_back') {
      mappedCertType = 'identity_back';
    }
    
    const response = await fetch(`${API_BASE_URL}/settings/cert-ocr-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        cert_type: mappedCertType,
        user_id: userId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'OCR 审核失败' }));
      throw new Error(error.detail || 'OCR 审核失败');
    }
    
    return response.json();
  } catch (error: any) {
    // 处理网络错误（如后端未启动）
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('无法连接到服务器，请检查后端服务是否正常运行');
    }
    throw error;
  }
}
