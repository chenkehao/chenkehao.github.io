import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Card from '../../components/ui/Card';

export default function EmployerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: string;
  }[] = [
    { icon: 'business-outline', label: '企业信息', route: '/(common)/settings' },
    { icon: 'people-outline', label: '团队管理', route: '/(common)/settings' },
    { icon: 'wallet-outline', label: 'Token 管理', route: '/(common)/tokens' },
    { icon: 'sparkles-outline', label: 'AI 助手', route: '/(common)/ai-assistant' },
    { icon: 'person-add-outline', label: '邀请好友', route: '/(common)/settings' },
    { icon: 'notifications-outline', label: '通知设置', route: '/(common)/notifications' },
    { icon: 'settings-outline', label: '设置', route: '/(common)/settings' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 用户信息卡片 */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons name="business" size={30} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>
                {user?.company_name || user?.name || '企业'}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                {user?.email}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                <View
                  style={{
                    backgroundColor: '#eef2ff',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#4f46e5', fontWeight: '500' }}>
                    {user?.account_tier || 'FREE'}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>招聘方</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* 菜单 */}
        <Card style={{ marginBottom: 20, padding: 0 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                if (item.route) router.push(item.route as `/${string}`);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: '#f1f5f9',
              }}
            >
              <Ionicons name={item.icon} size={20} color="#64748b" />
              <Text style={{ flex: 1, fontSize: 15, color: '#334155', marginLeft: 12 }}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </Card>

        {/* 退出 */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#fecaca',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#ef4444' }}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
