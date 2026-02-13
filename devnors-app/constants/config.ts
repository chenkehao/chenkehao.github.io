/**
 * APP 配置常量 - 与 Web 统一配色
 */

// 后端 API 地址
export const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api/v1'
  : 'https://api.devnors.com/api/v1';

// Token 存储 key
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'devnors_access_token',
  USER_DATA: 'devnors_user_data',
  THEME_MODE: 'devnors_theme_mode',
  ONBOARDED: 'devnors_onboarded',
} as const;

// 角色枚举
export const USER_ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter',
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const;

// 颜色主题 - 与 Web 统一
export const COLORS = {
  // 品牌色
  primary: '#4f46e5',       // indigo-600 (Web 主色)
  primaryDark: '#4338ca',   // indigo-700
  primaryLight: '#818cf8',  // indigo-400
  primaryBg: '#eef2ff',     // indigo-50
  primaryBorder: '#c7d2fe', // indigo-200

  // 渐变
  gradientStart: '#4f46e5', // indigo-600
  gradientEnd: '#7c3aed',   // violet-600

  // 语义色
  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  info: '#3b82f6',
  infoBg: '#dbeafe',

  // 浅色主题
  light: {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#334155',
    muted: '#64748b',
    placeholder: '#94a3b8',
    disabled: '#cbd5e1',
  },

  // 深色主题
  dark: {
    bg: '#080808',
    bgSecondary: '#0f0f0f',
    card: '#151515',
    border: '#252525',
    borderLight: '#1a1a1a',
    text: '#e8eaed',
    textSecondary: '#bdc1c6',
    muted: '#9aa0a6',
    placeholder: '#5f6368',
    disabled: '#3c4043',
  },
} as const;

// 分页默认值
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,
} as const;
