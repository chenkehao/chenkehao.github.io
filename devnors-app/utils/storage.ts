/**
 * 跨平台安全存储适配器
 * - 原生端: 使用 expo-secure-store
 * - Web 端: 回退到 localStorage
 */
import { Platform } from 'react-native';

let SecureStore: typeof import('expo-secure-store') | null = null;

// 仅在非 Web 平台加载 SecureStore
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch {
    // fallback
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore!.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore!.setItemAsync(key, value);
  } catch {
    // ignore
  }
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore!.deleteItemAsync(key);
  } catch {
    // ignore
  }
}
