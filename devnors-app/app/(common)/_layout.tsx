/**
 * Common 页面布局 - 微信风格导航
 * 完全使用自定义 header 替代原生 header，避免 iOS 系统按钮样式
 */
import React from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS } from '../../constants/config';
import PageHeader from '../../components/ui/PageHeader';

export default function CommonLayout() {
  return (
    <Stack
      screenOptions={{
        // 关闭原生 header，用自定义 header 完全替代
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.light.bgSecondary },
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        ...(Platform.OS === 'ios' ? { fullScreenGestureEnabled: true } : {}),
      }}
    >
      <Stack.Screen name="job/[id]" />
      <Stack.Screen name="candidate/[id]" />
      <Stack.Screen name="flow/[id]" />
      <Stack.Screen name="ai-assistant" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="tokens" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings-account" />
      <Stack.Screen name="settings-enterprise" />
      <Stack.Screen name="settings-certification" />
      <Stack.Screen name="settings-ai-engine" />
      <Stack.Screen name="settings-api" />
      <Stack.Screen name="settings-team" />
      <Stack.Screen name="settings-audit" />
    </Stack>
  );
}
