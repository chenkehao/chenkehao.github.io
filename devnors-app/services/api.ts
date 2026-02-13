/**
 * Axios API 客户端 - 统一请求封装
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';
import { getItem, deleteItem } from '../utils/storage';

// 创建 Axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动附加 JWT Token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    if (error.response?.status === 401) {
      try {
        await deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
        await deleteItem(STORAGE_KEYS.USER_DATA);
      } catch {
        // ignore
      }
    }

    const message =
      error.response?.data?.detail ||
      error.message ||
      '请求失败，请稍后重试';
    
    return Promise.reject(new Error(message));
  }
);

export default api;
