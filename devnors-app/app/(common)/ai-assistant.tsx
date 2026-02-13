/**
 * 旧的 AI 助手页面 - 重定向到 Tab 中的 AI 助手
 * 保留此文件以兼容旧的路由引用
 */
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

export default function AIAssistantRedirect() {
  const userRole = useAuthStore((s) => s.userRole);

  if (userRole === 'employer') {
    return <Redirect href="/(employer)/ai" />;
  }

  return <Redirect href="/(candidate)/ai" />;
}
