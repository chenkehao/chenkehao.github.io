/**
 * 邀请 API 服务
 */
import api from './api';
import type { InviteStats } from '../shared/types';

/** 获取邀请统计 */
export const getInviteStats = async (userId: number): Promise<InviteStats> => {
  const response = await api.get<InviteStats>('/public/invite/stats', {
    params: { user_id: userId },
  });
  return response.data;
};

/** 获取邀请记录 */
export const getInviteRecords = async (userId: number): Promise<InviteStats['records']> => {
  const response = await api.get('/public/invite/records', {
    params: { user_id: userId },
  });
  return response.data;
};
