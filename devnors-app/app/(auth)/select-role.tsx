import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/config';

type RoleOption = 'candidate' | 'employer';

export default function SelectRoleScreen() {
  const setUserRole = useAuthStore((s) => s.setUserRole);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);
    const result = await setUserRole(selectedRole);
    setLoading(false);
    if (!result.success) {
      Alert.alert('操作失败', result.error);
    }
  };

  const roles: { key: RoleOption; icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
    {
      key: 'candidate',
      icon: 'person-outline',
      title: '我是求职者',
      desc: '找工作、投递简历、获取 AI 职业建议',
    },
    {
      key: 'employer',
      icon: 'business-outline',
      title: '我是招聘方',
      desc: '发布职位、筛选人才、AI 智能匹配',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.light.text, textAlign: 'center' }}>
          选择你的身份
        </Text>
        <Text
          style={{ fontSize: 14, color: COLORS.light.muted, textAlign: 'center', marginTop: 8, marginBottom: 40 }}
        >
          选择后可在设置中切换
        </Text>

        {roles.map((role) => {
          const isSelected = selectedRole === role.key;
          return (
            <TouchableOpacity
              key={role.key}
              activeOpacity={0.7}
              onPress={() => setSelectedRole(role.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 20,
                marginBottom: 16,
                borderRadius: 16,
                backgroundColor: isSelected ? COLORS.primaryBg : COLORS.light.card,
                borderWidth: 2,
                borderColor: isSelected ? COLORS.primary : COLORS.light.border,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: isSelected ? COLORS.primary : COLORS.light.borderLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons
                  name={role.icon}
                  size={28}
                  color={isSelected ? '#fff' : COLORS.light.muted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: isSelected ? COLORS.primary : COLORS.light.text,
                  }}
                >
                  {role.title}
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.light.muted, marginTop: 4 }}>
                  {role.desc}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          );
        })}

        <Button
          title="确认选择"
          onPress={handleConfirm}
          loading={loading}
          disabled={!selectedRole}
          size="lg"
          style={{ marginTop: 24 }}
        />
      </View>
    </SafeAreaView>
  );
}
