import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout,
  getCurrentUser,
  isAuthenticated,
  getToken,
  clearToken,
} from '../services/apiService';

// 用户类型
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string; // candidate, recruiter, admin, viewer (后端返回小写)
  account_tier: string;
  company_name?: string;
  company_logo?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

// Context 类型
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  userRole: 'candidate' | 'employer' | null;
  
  // 认证方法
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  
  // 角色相关
  setUserRole: (role: 'candidate' | 'employer') => Promise<void>;
  needsRoleSelection: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
  company_name?: string;
}

// 创建 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  // 计算用户角色（个人/企业）- 支持大小写
  const normalizedRole = user?.role?.toLowerCase();
  const userRole = normalizedRole === 'candidate' ? 'candidate' : 
                   normalizedRole === 'recruiter' || normalizedRole === 'admin' ? 'employer' : null;

  // 检查登录状态
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated()) {
        const userData = await getCurrentUser();
        setUser(userData);
        // 如果用户角色是 VIEWER，说明需要选择身份
        if (userData.role?.toLowerCase() === 'viewer') {
          setNeedsRoleSelection(true);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化时检查登录状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      await apiLogin({ email, password });
      const userData = await getCurrentUser();
      setUser(userData);
      
      // 检查是否需要选择身份
      if (userData.role?.toLowerCase() === 'viewer') {
        setNeedsRoleSelection(true);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('登录失败:', error);
      return { 
        success: false, 
        error: error.message || '登录失败，请检查邮箱和密码' 
      };
    }
  };

  // 注册
  const register = async (data: RegisterData) => {
    try {
      await apiRegister(data);
      // 注册成功后自动登录
      const loginResult = await login(data.email, data.password);
      return loginResult;
    } catch (error: any) {
      console.error('注册失败:', error);
      return { 
        success: false, 
        error: error.message || '注册失败，请稍后再试' 
      };
    }
  };

  // 登出
  const logout = () => {
    apiLogout();
    setUser(null);
    setNeedsRoleSelection(false);
  };

  // 刷新用户信息
  const refreshUser = async () => {
    if (isAuthenticated()) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('刷新用户信息失败:', error);
      }
    }
  };

  // 设置用户角色
  const setUserRole = async (role: 'candidate' | 'employer') => {
    try {
      const apiRole = role === 'candidate' ? 'CANDIDATE' : 'RECRUITER';
      const response = await fetch('/api/v1/auth/me/role?role=' + apiRole, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await refreshUser();
        setNeedsRoleSelection(false);
      }
    } catch (error) {
      console.error('设置角色失败:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    userRole,
    login,
    register,
    logout,
    refreshUser,
    setUserRole,
    needsRoleSelection,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
