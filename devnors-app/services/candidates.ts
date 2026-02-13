/**
 * 候选人 API 服务
 */
import api from './api';
import type { Candidate } from '../shared/types';

/** 获取我的候选人档案 */
export const getMyCandidate = async (): Promise<Candidate> => {
  const response = await api.get<Candidate>('/candidates/me');
  return response.data;
};

/** 获取候选人列表 */
export const getCandidates = async (): Promise<Candidate[]> => {
  const response = await api.get<Candidate[]>('/candidates');
  return response.data;
};

/** 获取候选人详情 */
export const getCandidate = async (id: number): Promise<Candidate> => {
  const response = await api.get<Candidate>(`/candidates/${id}`);
  return response.data;
};

/** 获取人才列表 */
export const getPublicTalents = async (limit: number = 10): Promise<Candidate[]> => {
  const response = await api.get<Candidate[]>('/public/talents', {
    params: { limit },
  });
  return response.data;
};

/** 获取人才列表 (分页 + 筛选) */
export const getPublicTalentsPaged = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  skill?: string;
  experience_min?: number;
  experience_max?: number;
  sort?: string;
}): Promise<{ items: Candidate[]; total: number; page: number; page_size: number; pages: number }> => {
  const response = await api.get('/public/talents', { params });
  return response.data;
};

/** 获取人才技能标签 */
export const getTalentSkills = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/public/talent-skills');
  return response.data;
};

/** 获取用户资料 */
export const getUserProfile = async (
  userId: number,
  profileType: 'candidate' | 'employer' = 'candidate'
): Promise<Record<string, unknown>> => {
  const response = await api.get('/public/profile', {
    params: { user_id: userId, profile_type: profileType },
  });
  return response.data;
};

/** 更新用户资料 */
export const updateUserProfile = async (
  userId: number,
  profileType: 'candidate' | 'employer',
  data: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const response = await api.post('/public/profile', data, {
    params: { user_id: userId, profile_type: profileType },
  });
  return response.data;
};
