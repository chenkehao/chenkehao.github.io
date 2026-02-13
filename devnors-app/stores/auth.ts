/**
 * 认证状态管理 (Zustand)
 */
import { create } from 'zustand';
import { STORAGE_KEYS } from '../constants/config';
import { getItem, setItem, deleteItem } from '../utils/storage';
import * as authApi from '../services/auth';
import type { User, LoginRequest, RegisterRequest } from '../shared/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  needsRoleSelection: boolean;

  // 计算属性
  userRole: 'candidate' | 'employer' | null;

  // Actions
  initialize: () => Promise<void>;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserRole: (role: 'candidate' | 'employer') => Promise<{ success: boolean; error?: string }>;
}

// 计算用户角色
function computeUserRole(user: User | null): 'candidate' | 'employer' | null {
  if (!user) return null;
  const role = user.role?.toLowerCase();
  if (role === 'candidate') return 'candidate';
  if (role === 'recruiter' || role === 'admin') return 'employer';
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  needsRoleSelection: false,
  userRole: null,

  // 初始化 - APP 启动时调用
  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        const userData = await authApi.getCurrentUser();
        if (userData.account_tier) {
          userData.account_tier = userData.account_tier.toUpperCase();
        }
        const needsRole = userData.role?.toLowerCase() === 'viewer';
        set({
          user: userData,
          isLoggedIn: true,
          needsRoleSelection: needsRole,
          userRole: computeUserRole(userData),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth init error:', error);
      try {
        await deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
      } catch {}
      set({ user: null, isLoggedIn: false, isLoading: false });
    }
  },

  // 登录
  login: async (data) => {
    try {
      const authResponse = await authApi.login(data);
      // 存储 Token
      await setItem(STORAGE_KEYS.ACCESS_TOKEN, authResponse.access_token);
      // 获取用户信息
      const userData = await authApi.getCurrentUser();
      if (userData.account_tier) {
        userData.account_tier = userData.account_tier.toUpperCase();
      }
      const needsRole = userData.role?.toLowerCase() === 'viewer';
      set({
        user: userData,
        isLoggedIn: true,
        needsRoleSelection: needsRole,
        userRole: computeUserRole(userData),
      });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '登录失败';
      return { success: false, error: message };
    }
  },

  // 注册
  register: async (data) => {
    try {
      await authApi.register(data);
      const result = await get().login({
        email: data.email,
        password: data.password,
      });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '注册失败';
      return { success: false, error: message };
    }
  },

  // 登出
  logout: async () => {
    try {
      await deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
      await deleteItem(STORAGE_KEYS.USER_DATA);
    } catch {}
    set({
      user: null,
      isLoggedIn: false,
      needsRoleSelection: false,
      userRole: null,
    });
  },

  // 刷新用户信息
  refreshUser: async () => {
    try {
      const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return;
      const userData = await authApi.getCurrentUser();
      if (userData.account_tier) {
        userData.account_tier = userData.account_tier.toUpperCase();
      }
      set({
        user: userData,
        userRole: computeUserRole(userData),
      });
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },

  // 设置用户角色
  setUserRole: async (role) => {
    try {
      const apiRole = role === 'candidate' ? 'CANDIDATE' : 'RECRUITER';
      await authApi.updateUserRole(apiRole);
      await get().refreshUser();
      set({ needsRoleSelection: false });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '设置角色失败';
      return { success: false, error: message };
    }
  },
}));
