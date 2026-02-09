/**
 * API 数据获取 Hooks
 * 用于替换前端 MOCK 数据
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getRecommendedJobs,
  getPublicJobs,
  getPublicJob,
  getPublicFlows,
  getPublicFlow,
  getPublicTalents,
  getTokenStats,
  getQualifications,
  getMemories,
  getTodos,
  getTasks,
} from '../services/apiService';

// 通用数据获取 Hook
function useApiData<T>(fetcher: () => Promise<T>, defaultValue: T, deps: any[] = []) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, deps);

  return { data, loading, error, refetch };
}

// ============ 职位相关 Hooks ============

export function useRecommendedJobs(limit: number = 5) {
  return useApiData(
    () => getRecommendedJobs(limit),
    [],
    [limit]
  );
}

export function usePublicJobs(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  location?: string;
}) {
  return useApiData(
    () => getPublicJobs(params),
    { items: [], total: 0, page: 1, page_size: 20, pages: 0 },
    [params?.page, params?.page_size, params?.search, params?.location]
  );
}

export function usePublicJob(jobId: number | null) {
  return useApiData(
    async () => {
      if (!jobId) return null;
      return getPublicJob(jobId);
    },
    null,
    [jobId]
  );
}

// ============ 工作流相关 Hooks ============

export function useFlows(limit: number = 10, userId?: number) {
  return useApiData(
    () => getPublicFlows(limit, userId),
    [],
    [limit, userId]
  );
}

export function useFlow(flowId: number | null) {
  return useApiData(
    async () => {
      if (!flowId) return null;
      return getPublicFlow(flowId);
    },
    null,
    [flowId]
  );
}

// ============ 人才相关 Hooks ============

export function useTalents(limit: number = 10) {
  return useApiData(
    () => getPublicTalents(limit),
    [],
    [limit]
  );
}

// ============ 统计相关 Hooks ============

export function useTokenStats(userId: number = 1) {
  return useApiData(
    () => getTokenStats(userId),
    {
      balance: 0,
      balance_display: '0',
      today_usage: 0,
      today_usage_display: '0',
      change_rate: 0,
      change_direction: 'stable',
      total_purchased: 0,
      total_purchased_display: '¥ 0.00',
      estimated_days: 0,
      packages: [],
    },
    [userId]
  );
}

export function useQualifications() {
  return useApiData(
    getQualifications,
    [],
    []
  );
}

// ============ 记忆/任务相关 Hooks ============

/**
 * 获取记忆数据
 * @param userId 用户ID
 * @param scope 记忆范围: 'candidate' (人才画像) 或 'employer' (企业画像)
 */
export function useMemories(userId: number = 1, scope: 'candidate' | 'employer' = 'candidate') {
  return useApiData(
    () => getMemories(userId, scope),
    [],
    [userId, scope]
  );
}

export function useTodos(userId: number = 1) {
  return useApiData(
    () => getTodos(userId),
    [],
    [userId]
  );
}

export function useTasks(userId: number = 1) {
  return useApiData(
    () => getTasks(userId),
    [],
    [userId]
  );
}

/**
 * 获取用户资料 Hook
 */
export function useProfile(userId: number = 1, profileType: 'candidate' | 'employer' = 'candidate') {
  return useApiData(
    () => import('../services/apiService').then(m => m.getUserProfile(userId, profileType)),
    null,
    [userId, profileType]
  );
}

// ============ 导出所有 Hooks ============
export default {
  useRecommendedJobs,
  usePublicJobs,
  usePublicJob,
  useFlows,
  useFlow,
  useTalents,
  useTokenStats,
  useQualifications,
  useMemories,
  useTodos,
  useTasks,
  useProfile,
};
