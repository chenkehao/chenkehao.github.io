import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/config';

type LoginMode = 'password' | 'code';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string; code?: string }>({});
  const [loginError, setLoginError] = useState('');

  const validate = () => {
    const errs: typeof errors = {};
    if (!phone.trim()) {
      errs.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      errs.phone = '请输入正确的手机号';
    }
    if (loginMode === 'password') {
      if (!password) errs.password = '请输入密码';
      else if (password.length < 6) errs.password = '密码至少 6 位';
    } else {
      if (!verifyCode) errs.code = '请输入验证码';
      else if (verifyCode.length !== 6) errs.code = '验证码为 6 位数字';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoginError('');
    setLoading(true);

    // Web 逻辑：手机号转换为邮箱格式
    const email = `${phone.trim()}@phone.devnors.com`;
    const pwd = loginMode === 'password' ? password : `code_${verifyCode}`;

    try {
      const result = await login({ email, password: pwd });
      setLoading(false);
      if (!result.success) {
        setLoginError(result.error || '手机号或密码错误');
      }
    } catch (e: unknown) {
      setLoading(false);
      setLoginError(e instanceof Error ? e.message : '登录失败，请稍后重试');
    }
  };

  // 测试账号快捷登录
  const handleTestLogin = async (testEmail: string, testPassword: string) => {
    setLoginError('');
    setLoading(true);
    try {
      const result = await login({ email: testEmail, password: testPassword });
      setLoading(false);
      if (!result.success) {
        setLoginError(result.error || '登录失败');
      }
    } catch (e: unknown) {
      setLoading(false);
      setLoginError(e instanceof Error ? e.message : '登录失败');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Title */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <Ionicons name="flash" size={36} color="#fff" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.light.text, letterSpacing: -0.5 }}>
              Devnors
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.primary, fontWeight: '600', marginTop: 2 }}>
              得若
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.light.muted, marginTop: 6 }}>
              全场景 AI 原生智能招聘平台
            </Text>
          </View>

          {/* 登录模式切换 */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: COLORS.light.bgSecondary,
              borderRadius: 10,
              padding: 3,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => setLoginMode('password')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: loginMode === 'password' ? COLORS.light.card : 'transparent',
                alignItems: 'center',
                ...(loginMode === 'password' ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: loginMode === 'password' ? '600' : '400',
                  color: loginMode === 'password' ? COLORS.primary : COLORS.light.muted,
                }}
              >
                密码登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLoginMode('code')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: loginMode === 'code' ? COLORS.light.card : 'transparent',
                alignItems: 'center',
                ...(loginMode === 'code' ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: loginMode === 'code' ? '600' : '400',
                  color: loginMode === 'code' ? COLORS.primary : COLORS.light.muted,
                }}
              >
                验证码登录
              </Text>
            </TouchableOpacity>
          </View>

          {/* 手机号 */}
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

          {/* 密码 or 验证码 */}
          {loginMode === 'password' ? (
            <Input
              label="密码"
              icon="lock-closed-outline"
              placeholder="请输入密码"
              value={password}
              onChangeText={setPassword}
              isPassword
              error={errors.password}
            />
          ) : (
            <Input
              label="验证码"
              icon="shield-checkmark-outline"
              placeholder="请输入 6 位验证码"
              value={verifyCode}
              onChangeText={setVerifyCode}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.code}
            />
          )}

          {/* 邀请码 (可折叠) */}
          <TouchableOpacity
            onPress={() => setShowInviteCode(!showInviteCode)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginBottom: showInviteCode ? 0 : 8,
            }}
          >
            <Ionicons name="gift-outline" size={14} color={COLORS.primary} />
            <Text style={{ fontSize: 13, color: COLORS.primary }}>
              {showInviteCode ? '收起邀请码' : '有邀请码？'}
            </Text>
          </TouchableOpacity>

          {showInviteCode && (
            <Input
              icon="gift-outline"
              placeholder="请输入邀请码（选填）"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
            />
          )}

          {/* 错误提示 */}
          {loginError ? (
            <View
              style={{
                backgroundColor: COLORS.dangerBg,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: COLORS.dangerBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13, flex: 1 }}>
                {loginError}
              </Text>
            </View>
          ) : null}

          {/* 登录按钮 */}
          <Button
            title="登录"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={{ marginTop: 8 }}
          />

          {/* 注册链接 */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 14, color: COLORS.light.muted }}>还没有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                立即注册
              </Text>
            </TouchableOpacity>
          </View>

          {/* 测试账号 */}
          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.light.borderLight }} />
              <Text style={{ marginHorizontal: 12, fontSize: 12, color: COLORS.light.placeholder }}>
                测试账号
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.light.borderLight }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleTestLogin('test@example.com', 'test123456')}
                disabled={loading}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: COLORS.primaryBg,
                  borderWidth: 1,
                  borderColor: COLORS.primaryBorder,
                }}
              >
                <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
                  求职者测试
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTestLogin('hr@devnors.com', 'hr123456')}
                disabled={loading}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: COLORS.successBg,
                  borderWidth: 1,
                  borderColor: COLORS.successBg,
                }}
              >
                <Ionicons name="business-outline" size={16} color={COLORS.success} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.success }}>
                  企业方测试
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
