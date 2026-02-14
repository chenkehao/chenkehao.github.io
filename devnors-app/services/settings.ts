/**
 * 设置 API 服务 - 对齐 Web 功能
 */
import api from './api';

// ============ 通用设置 ============

export const getSettings = async (userId: number) => {
  const res = await api.get('/settings', { params: { user_id: userId } });
  return res.data;
};

export const updateSettings = async (userId: number, data: Record<string, unknown>) => {
  const res = await api.put('/settings', data, { params: { user_id: userId } });
  return res.data;
};

// ============ 企业认证 ============

export const getEnterpriseCertifications = async (userId: number) => {
  const res = await api.get('/settings/enterprise-certifications', { params: { user_id: userId } });
  return res.data;
};

export const createEnterpriseCertification = async (userId: number, data: Record<string, unknown>) => {
  const res = await api.post('/settings/enterprise-certifications', data, { params: { user_id: userId } });
  return res.data;
};

// ============ 个人认证 ============

export const getPersonalCertifications = async (userId: number) => {
  const res = await api.get('/settings/personal-certifications', { params: { user_id: userId } });
  return res.data;
};

export const createPersonalCertification = async (userId: number, data: Record<string, unknown>) => {
  const res = await api.post('/settings/personal-certifications', data, { params: { user_id: userId } });
  return res.data;
};

// ============ 团队管理 ============

export const getTeamMembers = async (userId: number) => {
  const res = await api.get('/settings/team-members', { params: { user_id: userId } });
  return res.data;
};

export const inviteTeamMember = async (userId: number, data: { phone: string; role: string }) => {
  const res = await api.post('/settings/team-members', data, { params: { user_id: userId } });
  return res.data;
};

export const removeTeamMember = async (userId: number, memberId: number) => {
  await api.delete(`/settings/team-members/${memberId}`, { params: { user_id: userId } });
};

export const transferAdmin = async (userId: number, newAdminId: number) => {
  const res = await api.post('/settings/team-members/transfer-admin', { new_admin_id: newAdminId }, { params: { user_id: userId } });
  return res.data;
};

export const approveMember = async (userId: number, memberId: number, approve: boolean) => {
  const res = await api.post(`/settings/enterprise/approve-member/${memberId}`, null, { params: { user_id: userId, approve } });
  return res.data;
};

// ============ AI 引擎配置 ============

export const getAIConfigs = async (userId: number) => {
  const res = await api.get('/settings/ai-configs', { params: { user_id: userId } });
  return res.data;
};

export const createAIConfig = async (userId: number, data: { model_name: string; api_key: string; base_url?: string }) => {
  const res = await api.post('/settings/ai-configs', data, { params: { user_id: userId } });
  return res.data;
};

export const deleteAIConfig = async (userId: number, configId: number) => {
  await api.delete(`/settings/ai-configs/${configId}`, { params: { user_id: userId } });
};

// ============ API 密钥 ============

export const getAPIKeys = async (userId: number) => {
  const res = await api.get('/settings/api-keys', { params: { user_id: userId } });
  return res.data;
};

export const createAPIKey = async (userId: number, name: string, environment: string) => {
  const res = await api.post('/settings/api-keys', null, { params: { user_id: userId, name, environment } });
  return res.data;
};

export const toggleAPIKey = async (userId: number, keyId: number) => {
  const res = await api.put(`/settings/api-keys/${keyId}/toggle`, null, { params: { user_id: userId } });
  return res.data;
};

export const regenerateAPIKey = async (userId: number, keyId: number) => {
  const res = await api.post(`/settings/api-keys/${keyId}/regenerate`, null, { params: { user_id: userId } });
  return res.data;
};

export const deleteAPIKey = async (userId: number, keyId: number) => {
  await api.delete(`/settings/api-keys/${keyId}`, { params: { user_id: userId } });
};

export const getAPIKeyUsage = async (userId: number) => {
  const res = await api.get('/settings/api-keys/usage', { params: { user_id: userId } });
  return res.data;
};

// ============ Webhook ============

export const getWebhooks = async (userId: number) => {
  const res = await api.get('/settings/webhooks', { params: { user_id: userId } });
  return res.data;
};

export const createWebhook = async (userId: number, data: { url: string; events: string[]; description?: string }) => {
  const res = await api.post('/settings/webhooks', data, { params: { user_id: userId } });
  return res.data;
};

export const updateWebhook = async (userId: number, hookId: number, data: Record<string, unknown>) => {
  const res = await api.put(`/settings/webhooks/${hookId}`, data, { params: { user_id: userId } });
  return res.data;
};

export const deleteWebhook = async (userId: number, hookId: number) => {
  await api.delete(`/settings/webhooks/${hookId}`, { params: { user_id: userId } });
};

export const testWebhook = async (userId: number, hookId: number) => {
  const res = await api.post(`/settings/webhooks/${hookId}/test`, null, { params: { user_id: userId } });
  return res.data;
};

// ============ 审计日志 ============

export const getAuditLogs = async (userId: number, params?: { limit?: number; category?: string }) => {
  const res = await api.get('/settings/audit-logs', { params: { user_id: userId, ...params } });
  return res.data;
};

export const getAuditLogStats = async (userId: number) => {
  const res = await api.get('/settings/audit-logs/stats', { params: { user_id: userId } });
  return res.data;
};

// ============ 账户等级 ============

export const getAccountTier = async (userId: number) => {
  const res = await api.get('/settings/account-tier', { params: { user_id: userId } });
  return res.data;
};

export const upgradeAccountTier = async (userId: number, tier: string) => {
  const res = await api.post('/settings/account-tier/upgrade', { tier }, { params: { user_id: userId } });
  return res.data;
};
