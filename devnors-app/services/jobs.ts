/**
 * 职位 API 服务
 */
import api from './api';
import type { Job, JobListResponse, JobTag } from '../shared/types';

/** 获取推荐职位 */
export const getRecommendedJobs = async (limit: number = 5): Promise<Job[]> => {
  const response = await api.get<Job[]>('/public/jobs-recommended', {
    params: { limit },
  });
  return response.data;
};

/** 获取公开职位列表 (分页 + 筛选) */
export const getPublicJobs = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  location?: string;
  job_type?: string;
  tag?: string;
  experience?: string;
  salary_min?: number;
  salary_max?: number;
  sort?: string;
}): Promise<JobListResponse> => {
  const response = await api.get<JobListResponse>('/public/jobs', { params });
  return response.data;
};

/** 获取职位详情 */
export const getPublicJob = async (jobId: number): Promise<Job> => {
  const response = await api.get<Job>(`/public/jobs/${jobId}`);
  return response.data;
};

/** 获取所有岗位标签 */
export const getJobTags = async (): Promise<JobTag[]> => {
  const response = await api.get<JobTag[]>('/public/job-tags');
  return response.data;
};

/** 创建职位 */
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
  const response = await api.post<Job>('/public/jobs', data);
  return response.data;
};

/** 获取我发布的职位 */
export const getMyJobs = async (userId: number): Promise<Job[]> => {
  const response = await api.get<Job[]>('/public/my-jobs', {
    params: { user_id: userId },
  });
  return response.data;
};

/** 获取岗位详情及投递列表 */
export const getJobDetail = async (jobId: number, userId: number): Promise<Job & { applications?: unknown[] }> => {
  const response = await api.get(`/public/job-detail/${jobId}`, {
    params: { user_id: userId },
  });
  return response.data;
};

/** 更新职位 */
export const updateJob = async (id: number, data: Partial<Job> & { user_id?: number }): Promise<Job> => {
  const response = await api.put<Job>(`/public/jobs/${id}`, data);
  return response.data;
};

/** 删除职位 */
export const deleteJob = async (id: number, userId?: number): Promise<void> => {
  await api.delete(`/public/jobs/${id}`, {
    params: { user_id: userId },
  });
};

/** 一键快速投递 */
export const quickApply = async (data: {
  job_id: number;
  user_id: number;
  cover_letter?: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/public/quick-apply', data);
  return response.data;
};
