/**
 * 认证 API 服务
 */
import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../shared/types';

/** 用户登录 (JSON 方式) */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login/json', data);
  return response.data;
};

/** 用户注册 */
export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await api.post<User>('/auth/register', data);
  return response.data;
};

/** 获取当前用户信息 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

/** 更新用户信息 */
export const updateUser = async (data: {
  name?: string;
  phone?: string;
  avatar_url?: string;
  company_name?: string;
}): Promise<User> => {
  const response = await api.put<User>('/auth/me', data);
  return response.data;
};

/** 更新用户角色 */
export const updateUserRole = async (role: string): Promise<void> => {
  await api.put(`/auth/me/role?role=${role}`);
};

/** 修改密码 */
export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  await api.put(
    `/auth/me/password?old_password=${encodeURIComponent(oldPassword)}&new_password=${encodeURIComponent(newPassword)}`
  );
};

/** 上传头像 */
export const uploadAvatar = async (uri: string, fileName: string): Promise<User> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await api.post<User>('/auth/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
