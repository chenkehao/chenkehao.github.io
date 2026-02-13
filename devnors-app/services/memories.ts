/**
 * 记忆 API 服务
 */
import api from './api';
import type { Memory } from '../shared/types';

/** 获取记忆列表 */
export const getMemories = async (
  userId: number,
  scope: 'candidate' | 'employer' = 'candidate'
): Promise<Memory[]> => {
  const response = await api.get<Memory[]>('/public/memories', {
    params: { user_id: userId, scope },
  });
  return response.data;
};

/** 创建记忆 */
export const createMemory = async (
  data: {
    type: string;
    content: string;
    importance?: string;
    scope?: 'candidate' | 'employer';
  },
  userId: number
): Promise<Memory> => {
  const response = await api.post<Memory>('/public/memories', data, {
    params: { user_id: userId },
  });
  return response.data;
};

/** 更新记忆 */
export const updateMemory = async (
  memoryId: number,
  data: {
    type: string;
    content: string;
    importance?: string;
    scope?: 'candidate' | 'employer';
  }
): Promise<Memory> => {
  const response = await api.put<Memory>(`/public/memories/${memoryId}`, data);
  return response.data;
};

/** 删除记忆 */
export const deleteMemory = async (memoryId: number): Promise<void> => {
  await api.delete(`/public/memories/${memoryId}`);
};

/** AI 记忆优化 */
export const optimizeMemories = async (
  userId: number,
  scope: 'candidate' | 'employer' = 'candidate'
): Promise<{ optimized: number; message: string }> => {
  const response = await api.post('/public/memories/optimize', null, {
    params: { user_id: userId, scope },
  });
  return response.data;
};
