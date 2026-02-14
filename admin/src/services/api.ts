/**
 * Admin API Service
 * 统一管理后台 API 调用
 */

const BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.hash = '#/login';
    throw new Error('登录已过期');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `请求失败 (${res.status})`);
  }

  return res.json();
}

function get<T = any>(path: string) { return request<T>(path); }
function post<T = any>(path: string, body?: any) { return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); }
function put<T = any>(path: string, body?: any) { return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }); }
function del<T = any>(path: string) { return request<T>(path, { method: 'DELETE' }); }

/** 构建查询参数，自动过滤 undefined/null/空字符串 */
function buildQuery(params: Record<string, any> = {}): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

// ─── Auth ───
export const login = (email: string, password: string) =>
  post('/auth/login/json', { email, password });

export const getMe = () => get('/auth/me');
export const updateMe = (data: any) => put('/auth/me', data);
export const changePassword = (old_password: string, new_password: string) =>
  put(`/auth/me/password?old_password=${encodeURIComponent(old_password)}&new_password=${encodeURIComponent(new_password)}`);

// ─── Dashboard ───
export const getDashboardStats = () => get('/admin/dashboard/stats');
export const getDashboardTrends = (days = 7) => get(`/admin/dashboard/trends?days=${days}`);
export const getDashboardRecent = () => get('/admin/dashboard/recent');

// ─── Users ───
export const getUsers = (params: Record<string, any> = {}) =>
  get(`/admin/users${buildQuery(params)}`);
export const getUserDetail = (id: number) => get(`/admin/users/${id}`);
export const getUserProfile = (id: number) => get(`/admin/users/${id}/profile`);
export const updateUser = (id: number, data: any) => put(`/admin/users/${id}`, data);
export const resetPassword = (id: number, password: string) =>
  post(`/admin/users/${id}/reset-password`, { new_password: password });
export const grantTokens = (userId: number, amount: number, reason: string) =>
  post('/admin/users/grant-tokens', { user_id: userId, amount, reason });

// ─── Enterprises ───
export const getEnterprises = (params: Record<string, any> = {}) =>
  get(`/admin/enterprises${buildQuery(params)}`);
export const getEnterpriseCerts = (params: Record<string, any> = {}) =>
  get(`/admin/certifications/enterprise${buildQuery(params)}`);
export const getPersonalCerts = (params: Record<string, any> = {}) =>
  get(`/admin/certifications/personal${buildQuery(params)}`);
export const reviewCert = (type: string, id: number, status: string) =>
  put(`/admin/certifications/${type}/${id}/review`, { new_status: status });
export const getEnterpriseTeam = (userId: number) => get(`/admin/enterprises/${userId}/team`);

// ─── Jobs ───
export const getJobs = (params: Record<string, any> = {}) =>
  get(`/admin/jobs${buildQuery(params)}`);
export const updateJob = (id: number, data: any) => put(`/admin/jobs/${id}`, data);
export const deleteJob = (id: number) => del(`/admin/jobs/${id}`);
export const getJobTags = () => get('/admin/job-tags');
export const createJobTag = (name: string, category?: string) => post('/admin/job-tags', { name, category });
export const deleteJobTag = (id: number) => del(`/admin/job-tags/${id}`);

// ─── Candidates ───
export const getCandidates = (params: Record<string, any> = {}) =>
  get(`/admin/candidates${buildQuery(params)}`);
export const getCandidateDetail = (id: number) => get(`/admin/candidates/${id}`);

// ─── Flows ───
export const getFlows = (params: Record<string, any> = {}) =>
  get(`/admin/flows${buildQuery(params)}`);
export const getFlowStats = () => get('/admin/flows/stats');

// ─── Tokens ───
export const getTokenOverview = () => get('/admin/tokens/overview');
export const getTokenHistory = (params: Record<string, any> = {}) =>
  get(`/admin/tokens/history${buildQuery(params)}`);
export const getTokenPackages = (params: Record<string, any> = {}) =>
  get(`/admin/tokens/packages${buildQuery(params)}`);

// ─── Invitations ───
export const getInvitations = (params: Record<string, any> = {}) =>
  get(`/admin/invitations${buildQuery(params)}`);
export const getInvitationStats = () => get('/admin/invitations/stats');

// ─── Tickets ───
export const getTickets = (params: Record<string, any> = {}) =>
  get(`/admin/tickets${buildQuery(params)}`);
export const getTicketDetail = (id: number) => get(`/admin/tickets/${id}`);
export const replyTicket = (id: number, reply: string, status?: string) =>
  put(`/admin/tickets/${id}`, { reply, ...(status ? { status } : {}) });
export const getTicketStats = () => get('/admin/tickets/stats/summary');

// ─── Notifications ───
export const getNotifications = (params: Record<string, any> = {}) =>
  get(`/admin/notifications${buildQuery(params)}`);
export const sendNotification = (data: any) => post('/admin/notifications/send', data);

// ─── AI ───
export const getAIStats = () => get('/admin/ai/stats');
export const getChatMessages = (params: Record<string, any> = {}) =>
  get(`/admin/ai/chat-messages${buildQuery(params)}`);
export const getAIConfigs = () => get('/admin/ai/configs');

// ─── Changelogs ───
export const getChangelogs = () => get('/admin/changelogs');
export const createChangelog = (data: any) => post('/admin/changelogs', data);
export const updateChangelog = (id: number, data: any) => put(`/admin/changelogs/${id}`, data);
export const deleteChangelog = (id: number) => del(`/admin/changelogs/${id}`);

// ─── Audit ───
export const getAuditLogs = (params: Record<string, any> = {}) =>
  get(`/admin/audit-logs${buildQuery(params)}`);
export const getAuditStats = () => get('/admin/audit-logs/stats');
export const getAPIKeys = () => get('/admin/api-keys');
export const getWebhooks = () => get('/admin/webhooks');

// ─── Analytics ───
export const getAnalyticsOverview = (days = 30) => get(`/admin/analytics/overview?days=${days}`);

// ─── Orders ───
export const getOrderStats = () => get('/admin/orders/stats');
export const getOrderTrends = (days = 30) => get(`/admin/orders/trends?days=${days}`);
export const getOrders = (params: Record<string, any> = {}) =>
  get(`/admin/orders${buildQuery(params)}`);
export const getOrderDetail = (id: number) => get(`/admin/orders/${id}`);
export const refundOrder = (id: number, refund_amount: number, reason: string) =>
  post(`/admin/orders/${id}/refund`, { refund_amount, reason });
export const updateOrderRemark = (id: number, admin_remark: string) =>
  put(`/admin/orders/${id}/remark`, { admin_remark });
export const createManualOrder = (data: any) => post('/admin/orders/manual', data);

// ─── Administrators ───
export const getAdministrators = () => get('/admin/administrators');
export const createAdministrator = (data: any) => post('/admin/administrators', data);
export const updateAdministrator = (id: number, data: any) => put(`/admin/administrators/${id}`, data);
export const toggleAdministrator = (id: number) => put(`/admin/administrators/${id}/toggle`);
export const deleteAdministrator = (id: number) => del(`/admin/administrators/${id}`);

// ─── Roles ───
export const getRoles = () => get('/admin/roles');
export const createRole = (data: any) => post('/admin/roles', data);
export const updateRole = (id: number, data: any) => put(`/admin/roles/${id}`, data);
export const deleteRole = (id: number) => del(`/admin/roles/${id}`);
export const getPermissionModules = () => get('/admin/permissions/modules');

// ─── System ───
export const getSystemInfo = () => get('/admin/system/info');
