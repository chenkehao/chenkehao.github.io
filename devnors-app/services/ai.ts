/**
 * AI 服务 API
 */
import api from './api';

/** AI 简历分析 */
export const analyzeResume = async (
  resumeText: string,
  userId?: number
): Promise<{
  name: string;
  role: string;
  skills: string[];
  experienceYears: number;
  summary: string;
  radarData: { subject: string; value: number }[];
  interviewQuestions?: string[];
  optimizationSuggestions?: string[];
  careerPath?: { role: string; requirement: string; timeframe: string }[];
  skillGaps?: { skill: string; priority: string; resource: string }[];
}> => {
  const params = userId ? `?user_id=${userId}` : '';
  const response = await api.post(`/ai/analyze-resume${params}`, {
    resume_text: resumeText,
  });
  return response.data;
};

/** AI 助手聊天 */
export const chatWithAI = async (data: {
  message: string;
  history?: Array<{ role: string; content: string }>;
  model?: string;
  context?: string;
  user_id?: number;
}): Promise<{
  response: string;
  tokens_used: number;
  model: string;
  error?: string;
  balance?: number;
  required?: number;
}> => {
  const response = await api.post('/public/chat', {
    message: data.message,
    history: data.history || [],
    model: data.model || 'Devnors 1.0',
    context: data.context || '',
    user_id: data.user_id || 0,
  });
  return response.data;
};

/** AI 职位匹配 */
export const matchJobs = async (
  candidateId: number,
  jobIds?: number[]
): Promise<{
  matches: {
    job_id: number;
    match_score: number;
    match_reasons: string[];
    gaps: string[];
  }[];
}> => {
  const response = await api.post('/ai/match-jobs', {
    candidate_id: candidateId,
    job_ids: jobIds,
  });
  return response.data;
};

/** 智能候选人匹配 */
export const smartMatch = async (data: {
  job_ids: number[];
  user_id: number;
  extra_requirements?: string;
}): Promise<{
  matches: Array<{
    id: number | null;
    name: string;
    title: string;
    experience: string;
    match_score: number;
    highlight: string;
    skills: string[];
    source: 'database' | 'ai_simulated';
    match_reason: string;
  }>;
  total_real: number;
  total_simulated: number;
}> => {
  const response = await api.post('/public/smart-match', data);
  return response.data;
};

/** 获取聊天历史 */
export const getChatMessages = async (
  userId: number,
  todoId?: number,
  limit: number = 100
): Promise<Array<{ id: number; role: string; content: string; created_at: string }>> => {
  const response = await api.get('/public/chat-messages', {
    params: { user_id: userId, todo_id: todoId, limit },
  });
  return response.data;
};

/** 保存聊天消息 */
export const saveChatMessage = async (
  data: { role: string; content: string; todo_id?: number | null },
  userId: number
): Promise<void> => {
  await api.post('/public/chat-messages', data, {
    params: { user_id: userId },
  });
};
