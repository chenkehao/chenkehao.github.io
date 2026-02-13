/**
 * 工作流 API 服务
 */
import api from './api';
import type { Flow, FlowListResponse } from '../shared/types';

/** 获取工作流列表 */
export const getPublicFlows = async (
  limit: number = 10,
  userId?: number
): Promise<Flow[]> => {
  const response = await api.get<Flow[]>('/public/flows', {
    params: { limit, user_id: userId },
  });
  return response.data;
};

/** 获取工作流统计 */
export const getFlowStats = async (userId?: number): Promise<{
  viewed: number;
  applied: number;
  passed: number;
  pending: number;
  rejected: number;
  total: number;
  avgMatch: number;
}> => {
  const response = await api.get('/public/flows/stats', {
    params: { user_id: userId },
  });
  return response.data;
};

/** 获取工作流详情 */
export const getPublicFlow = async (flowId: number): Promise<Flow> => {
  const response = await api.get<Flow>(`/public/flows/${flowId}`);
  return response.data;
};

/** 创建工作流 */
export const createFlow = async (data: {
  candidate_id: number;
  job_id: number;
}): Promise<Flow> => {
  const response = await api.post<Flow>('/flows', data);
  return response.data;
};

/** 推进工作流 */
export const advanceFlow = async (id: number): Promise<Flow> => {
  const response = await api.post<Flow>(`/flows/${id}/advance`);
  return response.data;
};
