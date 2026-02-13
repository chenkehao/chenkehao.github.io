import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import LoadingScreen from '../components/ui/LoadingScreen';
import "../global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

/** 认证路由守卫 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, needsRoleSelection, userRole } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)' as string;

    if (!isLoggedIn && !inAuthGroup) {
      // 未登录且不在登录页面 => 跳转到登录
      router.replace('/(auth)/login');
    } else if (isLoggedIn && needsRoleSelection && (segments as string[])[1] !== 'select-role') {
      // 已登录但需要选择角色
      router.replace('/(auth)/select-role');
    } else if (isLoggedIn && !needsRoleSelection && inAuthGroup) {
      // 已登录且已选角色，还在认证页面 => 跳转到 AI 助手
      if (userRole === 'employer') {
        router.replace('/(employer)/ai');
      } else {
        router.replace('/(candidate)/ai');
      }
    }
  }, [isLoggedIn, isLoading, needsRoleSelection, userRole, segments]);

  if (isLoading) {
    return <LoadingScreen message="正在加载..." />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#f8fafc' },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(candidate)" />
          <Stack.Screen name="(employer)" />
          <Stack.Screen
            name="(common)"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </Stack>
      </AuthGuard>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
