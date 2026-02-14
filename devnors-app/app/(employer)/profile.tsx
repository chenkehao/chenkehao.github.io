import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import { COLORS } from '../../constants/config';

/** 手机号脱敏 138****1234 */
const maskPhone = (phone?: string) =>
  phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '';

export default function EmployerProfileScreen() {
  const router = useRouter();
  const { user, logout, setUserRole } = useAuthStore();
  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState('');

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => logout() },
    ]);
  };

  /** 切换为求职者（参考 Web 逻辑） */
  const handleSwitchRole = useCallback(async () => {
    Alert.alert('切换身份', '确定要切换为求职者身份吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          setSwitching(true);
          setSwitchMsg('正在切换身份...');
          const result = await setUserRole('candidate');
          if (result.success) {
            setSwitchMsg('切换成功');
            setTimeout(() => {
              setSwitching(false);
              setSwitchMsg('');
            }, 1000);
          } else {
            setSwitching(false);
            setSwitchMsg('');
            Alert.alert('切换失败', result.error || '请稍后重试');
          }
        },
      },
    ]);
  }, [setUserRole]);

  const menuItems: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: string;
    badge?: string;
    onPress?: () => void;
  }[] = [
    { icon: 'create-outline', label: '编辑资料', route: '/(common)/edit-profile' },
    { icon: 'wallet-outline', label: 'Token 管理', route: '/(common)/tokens' },
    { icon: 'notifications-outline', label: '通知中心', route: '/(common)/notifications' },
    { icon: 'sparkles-outline', label: 'AI 助手', onPress: () => router.navigate('/(employer)/ai' as `/${string}`) },
    { icon: 'person-add-outline', label: '邀请好友', route: '/(common)/invite' },
    { icon: 'settings-outline', label: '设置', route: '/(common)/settings' },
  ];

  const displayName = user?.company_name || user?.name || '企业';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      {/* 切换身份遮罩 */}
      <Modal transparent visible={switching} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', minWidth: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 }}>
            {switchMsg === '切换成功' ? (
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            ) : (
              <ActivityIndicator size="large" color={COLORS.primary} />
            )}
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginTop: 16 }}>
              {switchMsg}
            </Text>
          </View>
        </View>
      </Modal>

      <PageHeader
        title="我"
        rightActions={[
          { icon: 'settings-outline', onPress: () => router.push('/(common)/settings' as `/${string}`) },
        ]}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* ========== 用户信息卡片 ========== */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* 头像 / 企业logo */}
            <View style={{ marginRight: 14 }}>
              <Avatar uri={user?.avatar_url || user?.company_logo} name={displayName} size={60} />
            </View>

            {/* 信息 */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.light.text }}>
                {displayName}
              </Text>
              {user?.company_name && user?.name && user.company_name !== user.name && (
                <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 1 }}>{user.name}</Text>
              )}

              {/* UID + 邮箱 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: COLORS.light.bgSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, color: COLORS.light.muted, fontFamily: 'Courier' }}>
                    UID: {user?.id || 0}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: COLORS.light.muted }} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
              </View>

              {/* 手机号 */}
              {user?.phone ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                  <Ionicons name="call-outline" size={12} color={COLORS.light.muted} />
                  <Text style={{ fontSize: 12, color: COLORS.light.textSecondary }}>{maskPhone(user.phone)}</Text>
                  <View style={{ backgroundColor: COLORS.successBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '500' }}>已绑定</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                  <Ionicons name="call-outline" size={12} color={COLORS.light.disabled} />
                  <Text style={{ fontSize: 12, color: COLORS.light.placeholder }}>手机未绑定</Text>
                </View>
              )}

              {/* 标签行 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: COLORS.primaryBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>{user?.account_tier || 'FREE'}</Text>
                </View>
                <View style={{ backgroundColor: COLORS.light.bgSecondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, color: COLORS.light.muted, fontWeight: '500' }}>招聘方</Text>
                </View>
                {user?.is_verified && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                    <Text style={{ fontSize: 11, color: COLORS.success, fontWeight: '500' }}>已认证</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 邀请码 */}
          {user?.invite_code ? (
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.light.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="gift-outline" size={14} color={COLORS.light.muted} />
                <Text style={{ fontSize: 12, color: COLORS.light.muted }}>邀请码</Text>
              </View>
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600', fontFamily: 'Courier' }}>{user.invite_code}</Text>
            </View>
          ) : null}
        </Card>

        {/* ========== 身份切换 ========== */}
        <TouchableOpacity
          onPress={handleSwitchRole}
          activeOpacity={0.6}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: COLORS.light.card,
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.light.borderLight,
          }}
        >
          <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.primary} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.primary }}>切换为求职者</Text>
        </TouchableOpacity>

        {/* ========== 菜单列表 ========== */}
        <Card style={{ marginBottom: 20, padding: 0 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                if (item.onPress) item.onPress();
                else if (item.route) router.push(item.route as `/${string}`);
              }}
              activeOpacity={0.6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                borderBottomWidth: index < menuItems.length - 1 ? 0.5 : 0,
                borderBottomColor: COLORS.light.borderLight,
              }}
            >
              <Ionicons name={item.icon} size={20} color={COLORS.light.muted} />
              <Text style={{ flex: 1, fontSize: 15, color: COLORS.light.textSecondary, marginLeft: 12 }}>
                {item.label}
              </Text>
              {item.badge && (
                <View style={{ backgroundColor: COLORS.danger, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, marginRight: 8 }}>
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '500' }}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={14} color={COLORS.light.disabled} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* ========== 退出登录 ========== */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.6}
          style={{
            backgroundColor: COLORS.light.card,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.dangerBg,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.danger }}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
