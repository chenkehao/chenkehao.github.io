import { Stack } from 'expo-router';

export default function CommonLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#4f46e5',
        headerTitleStyle: { fontWeight: '600', color: '#0f172a' },
        headerBackTitle: '返回',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#f8fafc' },
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="job/[id]" options={{ title: '职位详情' }} />
      <Stack.Screen name="candidate/[id]" options={{ title: '人才详情' }} />
      <Stack.Screen name="flow/[id]" options={{ title: '流程详情' }} />
      <Stack.Screen name="ai-assistant" options={{ title: 'AI 助手' }} />
      <Stack.Screen name="settings" options={{ title: '设置' }} />
      <Stack.Screen name="tokens" options={{ title: 'Token 管理' }} />
      <Stack.Screen name="notifications" options={{ title: '通知中心' }} />
    </Stack>
  );
}
