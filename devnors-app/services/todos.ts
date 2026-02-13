/**
 * 待办事项 API 服务
 */
import api from './api';
import type { Todo } from '../shared/types';

/** 获取待办列表 */
export const getTodos = async (userId: number): Promise<Todo[]> => {
  const response = await api.get<Todo[]>('/public/todos', {
    params: { user_id: userId },
  });
  return response.data;
};

/** 创建待办 */
export const createTodo = async (
  data: {
    title: string;
    description?: string;
    priority?: string;
    source?: string;
    todo_type?: string;
    ai_advice?: string;
    steps?: Array<{ title: string; status: string }>;
    due_date?: string;
  },
  userId: number
): Promise<Todo> => {
  const response = await api.post<Todo>('/public/todos', data, {
    params: { user_id: userId },
  });
  return response.data;
};

/** 更新待办 */
export const updateTodo = async (
  todoId: number,
  data: {
    status?: string;
    progress?: number;
    steps?: Array<{ title: string; status: string }>;
    ai_advice?: string;
  }
): Promise<Todo> => {
  const params: Record<string, string> = {};
  if (data.status) params.status = data.status;
  if (data.progress !== undefined) params.progress = String(data.progress);

  const body: Record<string, unknown> = {};
  if (data.steps) body.steps = data.steps;
  if (data.ai_advice) body.ai_advice = data.ai_advice;

  const response = await api.put<Todo>(`/public/todos/${todoId}`, body, { params });
  return response.data;
};

/** 删除待办 */
export const deleteTodo = async (todoId: number): Promise<void> => {
  await api.delete(`/public/todos/${todoId}`);
};
