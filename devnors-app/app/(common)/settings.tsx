import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { useThemeStore } from '../../stores/theme';
import { changePassword } from '../../services/auth';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('提示', '请填写完整密码信息');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '新密码至少 6 位');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert('成功', '密码已修改');
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '修改失败';
      Alert.alert('失败', msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16 }}>
        {/* 账号信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
            账号信息
          </Text>
          <View style={{ gap: 10 }}>
            <SettingsRow label="用户名" value={user?.name || '-'} />
            <SettingsRow label="邮箱" value={user?.email || '-'} />
            <SettingsRow label="角色" value={user?.role || '-'} />
            <SettingsRow label="账户等级" value={user?.account_tier || 'FREE'} />
            {user?.company_name && (
              <SettingsRow label="公司" value={user.company_name} />
            )}
          </View>
        </Card>

        {/* 偏好设置 */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
            偏好设置
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="moon-outline" size={18} color="#64748b" />
              <Text style={{ fontSize: 15, color: '#334155' }}>深色模式</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ true: '#4f46e5' }}
            />
          </View>
        </Card>

        {/* 修改密码 */}
        <Card style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowChangePassword(!showChangePassword)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
              <Text style={{ fontSize: 15, color: '#334155' }}>修改密码</Text>
            </View>
            <Ionicons
              name={showChangePassword ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94a3b8"
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={{ marginTop: 16 }}>
              <Input
                label="当前密码"
                isPassword
                placeholder="请输入当前密码"
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <Input
                label="新密码"
                isPassword
                placeholder="请输入新密码 (至少6位)"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Button
                title="确认修改"
                onPress={handleChangePassword}
                loading={passwordLoading}
                size="md"
              />
            </View>
          )}
        </Card>

        {/* 关于 */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
            关于
          </Text>
          <SettingsRow label="版本" value="1.0.0" />
          <SettingsRow label="平台" value="Devnors 得若" />
        </Card>

        {/* 退出 */}
        <TouchableOpacity
          onPress={() =>
            Alert.alert('退出登录', '确定要退出吗？', [
              { text: '取消', style: 'cancel' },
              { text: '退出', style: 'destructive', onPress: () => logout() },
            ])
          }
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
      </View>
    </ScrollView>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
      }}
    >
      <Text style={{ fontSize: 14, color: '#64748b' }}>{label}</Text>
      <Text style={{ fontSize: 14, color: '#334155', fontWeight: '500' }}>{value}</Text>
    </View>
  );
}
