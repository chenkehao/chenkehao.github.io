/**
 * 系统设置 - 导航 Hub（对齐 Web 设置侧边栏）
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  route: string;
  roles?: string[]; // 仅指定角色可见
  tier?: string;    // 仅指定等级可见
};

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: '账号与安全',
    items: [
      {
        id: 'account',
        icon: 'person-circle-outline',
        label: '账号信息',
        desc: '头像、昵称、手机、密码',
        route: '/(common)/settings-account',
      },
    ],
  },
  {
    title: '企业管理',
    items: [
      {
        id: 'enterprise',
        icon: 'business-outline',
        label: '企业基础信息',
        desc: '企业名称、行业、规模、福利',
        route: '/(common)/settings-enterprise',
        roles: ['recruiter', 'admin'],
      },
      {
        id: 'certification',
        icon: 'shield-checkmark-outline',
        label: '认证信息',
        desc: '企业认证 / 个人认证',
        route: '/(common)/settings-certification',
      },
      {
        id: 'team',
        icon: 'people-outline',
        label: '人员与权限',
        desc: '团队成员、角色管理',
        route: '/(common)/settings-team',
        roles: ['recruiter', 'admin'],
      },
    ],
  },
  {
    title: '开发者与集成',
    items: [
      {
        id: 'ai-engine',
        icon: 'hardware-chip-outline',
        label: '自定义大模型',
        desc: '接入第三方 AI 模型 API',
        route: '/(common)/settings-ai-engine',
      },
      {
        id: 'api',
        icon: 'key-outline',
        label: 'API 与集成',
        desc: 'API 密钥、Webhook',
        route: '/(common)/settings-api',
      },
    ],
  },
  {
    title: '安全与日志',
    items: [
      {
        id: 'audit',
        icon: 'laptop-outline',
        label: '系统安全日志',
        desc: '操作记录、安全审计',
        route: '/(common)/settings-audit',
      },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const userRole = user?.role?.toLowerCase() || '';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="系统设置" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* 用户简要信息 */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: COLORS.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.light.text }}>
                {user?.name || '用户'}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.light.muted, marginTop: 2 }}>
                {user?.email}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: COLORS.primaryBg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>
                {user?.account_tier || 'FREE'}
              </Text>
            </View>
          </View>
        </Card>

        {/* 菜单分组 */}
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.roles && !item.roles.includes(userRole)) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <View key={section.title} style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: COLORS.light.placeholder,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                {section.title}
              </Text>
              <Card style={{ padding: 0 }}>
                {visibleItems.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(item.route as `/${string}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderBottomWidth: idx < visibleItems.length - 1 ? 1 : 0,
                      borderBottomColor: COLORS.light.borderLight,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: COLORS.primaryBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.light.text }}>
                        {item.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 2 }}>
                        {item.desc}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.light.disabled} />
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          );
        })}

        {/* 退出登录 */}
        <TouchableOpacity
          onPress={() =>
            Alert.alert('退出登录', '确定要退出吗？', [
              { text: '取消', style: 'cancel' },
              { text: '退出', style: 'destructive', onPress: () => logout() },
            ])
          }
          style={{
            backgroundColor: COLORS.light.card,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.dangerBg,
            marginBottom: 40,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.danger }}>退出登录</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}
