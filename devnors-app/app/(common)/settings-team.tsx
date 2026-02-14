/**
 * 团队管理页 - 对齐 Web Team Management（招聘方专属）
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getTeamMembers, inviteTeamMember, removeTeamMember, approveMember } from '../../services/settings';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: '管理员', color: COLORS.danger, bg: COLORS.dangerBg },
  recruiter: { label: '招聘官', color: COLORS.primary, bg: COLORS.primaryBg },
  viewer: { label: '查看者', color: COLORS.light.muted, bg: COLORS.light.bgSecondary },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: '已加入', color: COLORS.success },
  pending: { label: '待接受', color: COLORS.warning },
  pending_approval: { label: '待审批', color: COLORS.warning },
};

export default function TeamManagementScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('recruiter');

  const { data: members = [] } = useQuery({
    queryKey: ['teamMembers', user?.id],
    queryFn: () => getTeamMembers(user?.id || 0),
    enabled: !!user?.id,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteTeamMember(user?.id || 0, { phone: invitePhone, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setShowInvite(false);
      setInvitePhone('');
      Alert.alert('成功', '已发送邀请');
    },
    onError: (err: Error) => Alert.alert('失败', err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeTeamMember(user?.id || 0, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamMembers'] }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) => approveMember(user?.id || 0, id, approve),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamMembers'] }),
  });

  const typedMembers = members as Array<{
    id: number;
    name?: string;
    phone?: string;
    email?: string;
    role: string;
    status: string;
    user_id?: number;
  }>;

  const activeMembers = typedMembers.filter((m) => m.status === 'active');
  const pendingMembers = typedMembers.filter((m) => m.status === 'pending' || m.status === 'pending_approval');

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="团队管理" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* 邀请按钮 */}
        <Button
          title="邀请成员"
          onPress={() => setShowInvite(true)}
          variant="outline"
          style={{ marginBottom: 16 }}
        />

        {/* 待审批 */}
        {pendingMembers.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.warning, marginBottom: 8 }}>
              待处理 ({pendingMembers.length})
            </Text>
            {pendingMembers.map((m) => (
              <Card key={m.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.warningBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="person-outline" size={18} color={COLORS.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.light.text }}>{m.name || m.phone || m.email || '-'}</Text>
                    <Text style={{ fontSize: 12, color: statusLabels[m.status]?.color || COLORS.light.muted }}>
                      {statusLabels[m.status]?.label || m.status}
                    </Text>
                  </View>
                  {m.status === 'pending_approval' && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => approveMutation.mutate({ id: m.id, approve: true })}
                        style={{ backgroundColor: COLORS.successBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                      >
                        <Text style={{ fontSize: 12, color: COLORS.success }}>通过</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => approveMutation.mutate({ id: m.id, approve: false })}
                        style={{ backgroundColor: COLORS.dangerBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                      >
                        <Text style={{ fontSize: 12, color: COLORS.danger }}>拒绝</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* 成员列表 */}
        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
          团队成员 ({activeMembers.length})
        </Text>
        {activeMembers.map((m) => {
          const r = roleLabels[m.role] || roleLabels.viewer;
          return (
            <Card key={m.id} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="person" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.light.text }}>{m.name || '-'}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.light.muted }}>{m.phone || m.email || '-'}</Text>
                </View>
                <View style={{ backgroundColor: r.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: r.color }}>{r.label}</Text>
                </View>
                {m.role !== 'admin' && (
                  <TouchableOpacity
                    onPress={() => Alert.alert('移除成员', `确定移除 ${m.name || '-'}？`, [
                      { text: '取消', style: 'cancel' },
                      { text: '移除', style: 'destructive', onPress: () => removeMutation.mutate(m.id) },
                    ])}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={COLORS.light.placeholder} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        })}

        {activeMembers.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="people-outline" size={40} color={COLORS.light.disabled} />
            <Text style={{ fontSize: 14, color: COLORS.light.muted, marginTop: 8 }}>暂无团队成员</Text>
          </View>
        )}
      </View>

      {/* 邀请弹窗 */}
      <Modal visible={showInvite} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.light.border }}>
            <TouchableOpacity onPress={() => setShowInvite(false)}>
              <Text style={{ fontSize: 15, color: COLORS.light.muted }}>取消</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.light.text }}>邀请成员</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ padding: 16 }}>
            <Input label="手机号" icon="call-outline" placeholder="请输入成员手机号" value={invitePhone} onChangeText={setInvitePhone} keyboardType="phone-pad" maxLength={11} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.light.textSecondary, marginBottom: 8 }}>选择角色</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              {[
                { id: 'viewer', label: '查看者' },
                { id: 'recruiter', label: '招聘官' },
                { id: 'admin', label: '管理员' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setInviteRole(r.id)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                    backgroundColor: inviteRole === r.id ? COLORS.primary : COLORS.light.bgSecondary,
                    borderWidth: 1, borderColor: inviteRole === r.id ? COLORS.primary : COLORS.light.border,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: inviteRole === r.id ? '#fff' : COLORS.light.textSecondary }}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="发送邀请" onPress={() => inviteMutation.mutate()} loading={inviteMutation.isPending} disabled={!invitePhone.trim()} size="lg" />
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
    </View>
  );
}
