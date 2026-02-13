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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/config';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState('');

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = '请输入邮箱';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = '邮箱格式不正确';
    if (!password) errs.password = '请输入密码';
    else if (password.length < 6) errs.password = '密码至少 6 位';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoginError('');
    setLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      setLoading(false);
      if (!result.success) {
        setLoginError(result.error || '请检查邮箱和密码');
      }
    } catch (e: unknown) {
      setLoading(false);
      setLoginError(e instanceof Error ? e.message : '登录失败，请稍后重试');
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
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 20,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="flash" size={40} color="#fff" />
              </View>
            </View>
            <Text style={{ fontSize: 30, fontWeight: '800', color: COLORS.light.text, letterSpacing: -0.5 }}>
              Devnors
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: '600', marginTop: 2 }}>
              得若
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.light.muted, marginTop: 8 }}>
              全场景 AI 原生智能招聘平台
            </Text>
          </View>

          {/* Form */}
          <Input
            label="邮箱"
            icon="mail-outline"
            placeholder="请输入邮箱地址"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label="密码"
            icon="lock-closed-outline"
            placeholder="请输入密码"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
          />

          {loginError ? (
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
                {loginError}
              </Text>
            </View>
          ) : null}

          <Button
            title="登录"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={{ marginTop: 12 }}
          />

          {/* Register Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28 }}>
            <Text style={{ fontSize: 14, color: COLORS.light.muted }}>还没有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                立即注册
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
