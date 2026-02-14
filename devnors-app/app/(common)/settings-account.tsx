/**
 * 账号信息页 - 对齐 Web AccountInfo
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { changePassword } from '../../services/auth';
import { useThemeStore } from '../../stores/theme';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

export default function AccountInfoScreen() {
  const { user, refreshUser } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  // 密码修改
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleChangePwd = async () => {
    setPwdMsg(null);
    if (!oldPwd || !newPwd) {
      setPwdMsg({ type: 'error', text: '请填写完整密码信息' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: '新密码至少 6 位' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: '两次密码不一致' });
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword(oldPwd, newPwd);
      setPwdMsg({ type: 'success', text: '密码修改成功' });
      setShowPwdForm(false);
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (error: unknown) {
      setPwdMsg({ type: 'error', text: error instanceof Error ? error.message : '修改失败' });
    } finally {
      setPwdLoading(false);
    }
  };

  const roleName = user?.role === 'recruiter' ? '招聘方' : user?.role === 'candidate' ? '求职者' : user?.role === 'admin' ? '管理员' : user?.role || '-';
  const maskEmail = (email?: string) => {
    if (!email) return '-';
    const [local, domain] = email.split('@');
    if (local.length <= 3) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 3)}***@${domain}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="账号信息" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>

        {/* 头像与基本信息 */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: COLORS.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons name="person" size={40} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.light.text }}>
              {user?.name || '用户'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <View style={{ backgroundColor: COLORS.primaryBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>{roleName}</Text>
              </View>
              <View style={{ backgroundColor: COLORS.warningBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.warning }}>
                  {user?.account_tier || 'FREE'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* 账号详情 */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
            账号详情
          </Text>
          <InfoRow label="UID" value={`#${user?.id || '-'}`} />
          <InfoRow label="昵称" value={user?.name || '-'} />
          <InfoRow label="邮箱" value={maskEmail(user?.email)} />
          <InfoRow label="手机" value={user?.phone || '未绑定'} />
          {user?.company_name && <InfoRow label="公司" value={user.company_name} />}
          <InfoRow label="邀请码" value={user?.invite_code || '-'} />
          <InfoRow
            label="注册时间"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
          />
          <InfoRow
            label="最后登录"
            value={user?.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '-'}
          />
        </Card>

        {/* 偏好设置 */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
            偏好设置
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="moon-outline" size={18} color={COLORS.light.muted} />
              <Text style={{ fontSize: 14, color: COLORS.light.textSecondary }}>深色模式</Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: isDarkMode ? COLORS.primary : COLORS.light.border,
                justifyContent: 'center',
                padding: 2,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  alignSelf: isDarkMode ? 'flex-end' : 'flex-start',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* 安全设置 - 修改密码 */}
        <Card style={{ marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => { setShowPwdForm(!showPwdForm); setPwdMsg(null); }}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.light.muted} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text }}>修改密码</Text>
            </View>
            <Ionicons name={showPwdForm ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.light.placeholder} />
          </TouchableOpacity>

          {showPwdForm && (
            <View style={{ marginTop: 16 }}>
              <Input label="当前密码" isPassword placeholder="请输入当前密码" value={oldPwd} onChangeText={setOldPwd} />
              <Input label="新密码" isPassword placeholder="请输入新密码（至少6位）" value={newPwd} onChangeText={setNewPwd} />
              <Input label="确认新密码" isPassword placeholder="再次输入新密码" value={confirmPwd} onChangeText={setConfirmPwd} />

              {pwdMsg && (
                <View
                  style={{
                    backgroundColor: pwdMsg.type === 'error' ? COLORS.dangerBg : COLORS.successBg,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name={pwdMsg.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                    size={14}
                    color={pwdMsg.type === 'error' ? COLORS.danger : COLORS.success}
                  />
                  <Text style={{ color: pwdMsg.type === 'error' ? COLORS.danger : COLORS.success, fontSize: 13 }}>
                    {pwdMsg.text}
                  </Text>
                </View>
              )}

              <Button title="确认修改" onPress={handleChangePwd} loading={pwdLoading} size="md" />
            </View>
          )}
        </Card>

        {/* 关于 */}
        <Card style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
            关于
          </Text>
          <InfoRow label="应用版本" value="1.0.0" />
          <InfoRow label="平台" value="Devnors 得若" />
          <InfoRow label="技术支持" value="support@devnors.com" />
        </Card>
      </View>
    </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.light.borderLight }}>
      <Text style={{ fontSize: 13, color: COLORS.light.muted }}>{label}</Text>
      <Text style={{ fontSize: 13, color: COLORS.light.textSecondary, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}
