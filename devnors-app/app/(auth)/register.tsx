import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '请输入用户名';
    if (!email.trim()) errs.email = '请输入邮箱';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = '邮箱格式不正确';
    if (!password) errs.password = '请输入密码';
    else if (password.length < 6) errs.password = '密码至少 6 位';
    if (password !== confirmPassword) errs.confirmPassword = '两次密码不一致';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      ref_code: refCode.trim() || undefined,
    });
    setLoading(false);
    if (!result.success) {
      Alert.alert('注册失败', result.error || '注册失败，请稍后重试');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
          >
            <Ionicons name="chevron-back" size={24} color="#334155" />
            <Text style={{ fontSize: 16, color: '#334155', marginLeft: 4 }}>返回</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
            创建账号
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>
            注册 Devnors 得若，开始智能招聘之旅
          </Text>

          {/* Form */}
          <Input
            label="用户名"
            icon="person-outline"
            placeholder="请输入用户名"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

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
            placeholder="请输入密码 (至少6位)"
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
            label="邀请码 (可选)"
            icon="gift-outline"
            placeholder="输入邀请码可获得奖励"
            value={refCode}
            onChangeText={setRefCode}
          />

          <Button
            title="注册"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={{ marginTop: 8 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 14, color: '#64748b' }}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#4f46e5' }}>
                返回登录
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
