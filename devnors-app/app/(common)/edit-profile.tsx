import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { updateUser } from '../../services/auth';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import { COLORS } from '../../constants/config';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCompanyName(user.company_name || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    setLoading(true);
    try {
      const updateData: { name?: string; phone?: string; company_name?: string; avatar_url?: string } = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      };
      if (user?.role === 'recruiter' && companyName.trim()) {
        updateData.company_name = companyName.trim();
      }
      await updateUser(updateData);
      await refreshUser();
      Alert.alert('成功', '资料已更新', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '更新失败';
      Alert.alert('失败', msg);
    } finally {
      setLoading(false);
    }
  };

  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';
  const roleLabel = isRecruiter ? '招聘方' : user?.role === 'candidate' ? '求职者' : user?.role || '-';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="编辑资料" showBack />
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          {/* ========== 头像区域 ========== */}
          <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 24 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ marginBottom: 12 }}>
                <Avatar uri={user?.avatar_url} name={user?.name} size={80} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.light.text }}>
                {user?.name || '未设置姓名'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                <View style={{ backgroundColor: COLORS.light.bgSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, color: COLORS.light.muted, fontFamily: 'Courier' }}>
                    UID: {user?.id || 0}
                  </Text>
                </View>
                {user?.is_verified && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                    <Text style={{ fontSize: 11, color: COLORS.success, fontWeight: '500' }}>已认证</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* ========== 基本信息 ========== */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 16 }}>
              基本信息
            </Text>

            <Input
              label="姓名"
              icon="person-outline"
              placeholder="请输入姓名"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="邮箱"
              icon="mail-outline"
              placeholder="邮箱"
              value={user?.email || ''}
              onChangeText={() => {}}
              editable={false}
            />

            <Input
              label="手机号"
              icon="call-outline"
              placeholder="请输入手机号"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Input
              label="头像链接"
              icon="image-outline"
              placeholder="输入头像URL（可选）"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
            />

            {isRecruiter && (
              <Input
                label="公司名称"
                icon="business-outline"
                placeholder="请输入公司名称"
                value={companyName}
                onChangeText={setCompanyName}
              />
            )}
          </Card>

          {/* ========== 账户信息 (只读) ========== */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
              账户信息
            </Text>
            <InfoRow label="UID" value={`${user?.id || 0}`} mono />
            <InfoRow label="角色" value={roleLabel} />
            <InfoRow label="账户等级" value={user?.account_tier || 'FREE'} highlight />
            <InfoRow label="邀请码" value={user?.invite_code || '-'} mono />
            <InfoRow label="认证状态" value={user?.is_verified ? '已认证' : '未认证'} verified={user?.is_verified} />
            <InfoRow
              label="上次登录"
              value={user?.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '-'}
            />
            <InfoRow
              label="注册时间"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
              last
            />
          </Card>

          {/* ========== 保存按钮 ========== */}
          <Button
            title="保存修改"
            onPress={handleSave}
            loading={loading}
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  mono,
  highlight,
  verified,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  verified?: boolean;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: COLORS.light.borderLight,
      }}
    >
      <Text style={{ fontSize: 14, color: COLORS.light.muted }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {verified !== undefined && (
          <Ionicons
            name={verified ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={verified ? COLORS.success : COLORS.light.disabled}
          />
        )}
        {highlight ? (
          <View style={{ backgroundColor: COLORS.primaryBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>{value}</Text>
          </View>
        ) : (
          <Text
            style={{
              fontSize: 14,
              color: COLORS.light.textSecondary,
              fontWeight: '500',
              ...(mono ? { fontFamily: 'Courier' } : {}),
            }}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}
