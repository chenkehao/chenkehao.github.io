/**
 * Token (积分) API 服务
 */
import api from './api';
import type { TokenStats, TokenPackage } from '../shared/types';

/** 获取 Token 统计信息 */
export const getTokenStats = async (userId: number): Promise<TokenStats> => {
  const response = await api.get<TokenStats>('/public/tokens/stats', {
    params: { user_id: userId },
  });
  return response.data;
};

/** 获取 Token 消耗历史 */
export const getTokenHistory = async (
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<{
  items: Array<{
    id: number;
    action: string;
    tokens: number;
    description: string;
    created_at: string;
  }>;
  total: number;
}> => {
  const response = await api.get('/public/tokens/history', {
    params: { user_id: userId, limit, offset },
  });
  return response.data;
};

/** 获取 Token 消耗趋势图 */
export const getTokenChart = async (
  userId: number,
  days: number = 7
): Promise<Array<{ date: string; usage: number }>> => {
  const response = await api.get('/public/tokens/chart', {
    params: { user_id: userId, days },
  });
  return response.data;
};

/** 获取可购买的 Token 套餐 */
export const getTokenPackages = async (): Promise<TokenPackage[]> => {
  const response = await api.get<TokenPackage[]>('/public/tokens/packages');
  return response.data;
};

/** 记录 Token 消耗 */
export const recordTokenUsage = async (
  userId: number,
  action: string,
  tokens: number,
  description?: string
): Promise<void> => {
  await api.post('/public/tokens/record', null, {
    params: { user_id: userId, action, tokens, description },
  });
};
