/**
 * Auth 布局 - 登录/注册/角色选择
 * 完全关闭原生 header，由各页面自带 PageHeader
 */
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/config';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.light.bg },
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        ...(Platform.OS === 'ios' ? { fullScreenGestureEnabled: true } : {}),
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="select-role" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
