import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/config';
import PageHeader from '../../components/ui/PageHeader';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registerError, setRegisterError] = useState('');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!phone.trim()) {
      errs.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      errs.phone = '请输入正确的手机号';
    }
    if (!password) errs.password = '请输入密码';
    else if (password.length < 6) errs.password = '密码至少 6 位';
    if (password !== confirmPassword) errs.confirmPassword = '两次密码不一致';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setRegisterError('');
    setLoading(true);

    // Web 逻辑：手机号转换为邮箱格式
    const email = `${phone.trim()}@phone.devnors.com`;
    const userName = name.trim() || phone.trim();

    try {
      const result = await register({
        name: userName,
        email,
        password,
        role: 'candidate', // 默认求职者，后续可在角色选择页切换
        ref_code: refCode.trim() || undefined,
      });
      setLoading(false);
      if (!result.success) {
        setRegisterError(result.error || '注册失败，请稍后重试');
      }
    } catch (e: unknown) {
      setLoading(false);
      setRegisterError(e instanceof Error ? e.message : '注册失败');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bg }}>
      <PageHeader title="注册" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 副标题 */}
          <Text style={{ fontSize: 14, color: COLORS.light.muted, marginBottom: 24 }}>
            注册 Devnors 得若，开始智能招聘之旅
          </Text>

          {/* Form */}
          <Input
            label="手机号"
            icon="call-outline"
            placeholder="请输入手机号"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={11}
            error={errors.phone}
          />

          <Input
            label="昵称（选填）"
            icon="person-outline"
            placeholder="不填则默认使用手机号"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="密码"
            icon="lock-closed-outline"
            placeholder="请输入密码（至少6位）"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
          />

          <Input
            label="确认密码"
            icon="lock-closed-outline"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            error={errors.confirmPassword}
          />

          <Input
            label="邀请码（选填）"
            icon="gift-outline"
            placeholder="输入邀请码双方均可获得 Token 奖励"
            value={refCode}
            onChangeText={(text) => setRefCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={10}
          />

          {/* 奖励提示 */}
          <View
            style={{
              backgroundColor: COLORS.primaryBg,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="gift" size={16} color={COLORS.primary} />
            <Text style={{ fontSize: 12, color: COLORS.primary, flex: 1 }}>
              新用户注册即赠 50,000 Token，填写邀请码额外获得 20,000 Token 奖励
            </Text>
          </View>

          {/* 错误提示 */}
          {registerError ? (
            <View
              style={{
                backgroundColor: COLORS.dangerBg,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#fecaca',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13, flex: 1 }}>
                {registerError}
              </Text>
            </View>
          ) : null}

          <Button
            title="注册"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={{ marginTop: 4 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 14, color: COLORS.light.muted }}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                返回登录
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
