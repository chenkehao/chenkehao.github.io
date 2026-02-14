/**
 * API 与集成页 - 对齐 Web API & Integration
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getAPIKeys, createAPIKey, toggleAPIKey, deleteAPIKey, regenerateAPIKey, getWebhooks, createWebhook, deleteWebhook, testWebhook } from '../../services/settings';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

const WEBHOOK_EVENTS = [
  { id: '*', label: '全部事件' },
  { id: 'flow.stage_changed', label: '流程阶段变更' },
  { id: 'flow.completed', label: '流程完成' },
  { id: 'candidate.matched', label: '候选人匹配' },
  { id: 'job.created', label: '岗位创建' },
  { id: 'job.updated', label: '岗位更新' },
];

export default function APIIntegrationScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');

  // API Keys
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys', user?.id],
    queryFn: () => getAPIKeys(user?.id || 0),
    enabled: !!user?.id,
  });

  const createKeyMutation = useMutation({
    mutationFn: () => createAPIKey(user?.id || 0, 'Production Key', 'production'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      Alert.alert('成功', 'API 密钥已创建');
    },
    onError: (err: Error) => Alert.alert('失败', err.message),
  });

  const toggleKeyMutation = useMutation({
    mutationFn: (id: number) => toggleAPIKey(user?.id || 0, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apiKeys'] }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: number) => deleteAPIKey(user?.id || 0, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apiKeys'] }),
  });

  // Webhooks
  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks', user?.id],
    queryFn: () => getWebhooks(user?.id || 0),
    enabled: !!user?.id,
  });

  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [webhookDesc, setWebhookDesc] = useState('');

  const createWebhookMutation = useMutation({
    mutationFn: () => createWebhook(user?.id || 0, { url: webhookUrl, events: webhookEvents, description: webhookDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setShowWebhookForm(false);
      setWebhookUrl('');
      setWebhookEvents([]);
      setWebhookDesc('');
      Alert.alert('成功', 'Webhook 已创建');
    },
    onError: (err: Error) => Alert.alert('失败', err.message),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: number) => deleteWebhook(user?.id || 0, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: number) => testWebhook(user?.id || 0, id),
    onSuccess: () => Alert.alert('成功', '测试请求已发送'),
    onError: (err: Error) => Alert.alert('失败', err.message),
  });

  const typedKeys = apiKeys as Array<{ id: number; key: string; name: string; environment: string; is_active: boolean; created_at: string }>;
  const typedHooks = webhooks as Array<{ id: number; url: string; events: string[]; description: string; is_active: boolean; last_status?: number }>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="API 与集成" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* Tab 切换 */}
        <View style={{ flexDirection: 'row', backgroundColor: COLORS.light.bgSecondary, borderRadius: 10, padding: 3, marginBottom: 16, borderWidth: 1, borderColor: COLORS.light.border }}>
          {(['keys', 'webhooks'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
                backgroundColor: activeTab === tab ? COLORS.light.card : 'transparent',
                ...(activeTab === tab ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}),
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: activeTab === tab ? '600' : '400', color: activeTab === tab ? COLORS.primary : COLORS.light.muted }}>
                {tab === 'keys' ? 'API 密钥' : 'Webhook'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'keys' ? (
          <>
            <Button title="创建 API 密钥" onPress={() => createKeyMutation.mutate()} loading={createKeyMutation.isPending} variant="outline" style={{ marginBottom: 16 }} />
            {typedKeys.map((key) => (
              <Card key={key.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.light.text }}>{key.name}</Text>
                  <View style={{ backgroundColor: key.is_active ? COLORS.successBg : COLORS.dangerBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 11, color: key.is_active ? COLORS.success : COLORS.danger }}>{key.is_active ? '启用' : '禁用'}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: COLORS.light.muted, fontFamily: 'monospace' }} numberOfLines={1}>
                  {key.key ? `${key.key.substring(0, 16)}...` : '***'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <TouchableOpacity onPress={() => toggleKeyMutation.mutate(key.id)}>
                    <Text style={{ fontSize: 12, color: COLORS.primary }}>{key.is_active ? '禁用' : '启用'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('删除', '确定删除此密钥？', [
                    { text: '取消', style: 'cancel' },
                    { text: '删除', style: 'destructive', onPress: () => deleteKeyMutation.mutate(key.id) },
                  ])}>
                    <Text style={{ fontSize: 12, color: COLORS.danger }}>删除</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
            {typedKeys.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="key-outline" size={40} color={COLORS.light.disabled} />
                <Text style={{ fontSize: 14, color: COLORS.light.muted, marginTop: 8 }}>暂无 API 密钥</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {showWebhookForm ? (
              <Card style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>创建 Webhook</Text>
                <Input label="URL" placeholder="https://your-api.com/webhook" value={webhookUrl} onChangeText={setWebhookUrl} autoCapitalize="none" />
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.light.textSecondary, marginBottom: 8 }}>订阅事件</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {WEBHOOK_EVENTS.map((e) => {
                    const selected = webhookEvents.includes(e.id);
                    return (
                      <TouchableOpacity
                        key={e.id}
                        onPress={() => setWebhookEvents(selected ? webhookEvents.filter((x) => x !== e.id) : [...webhookEvents, e.id])}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: selected ? COLORS.primaryBg : COLORS.light.bgSecondary, borderWidth: 1, borderColor: selected ? COLORS.primary : COLORS.light.border }}
                      >
                        <Text style={{ fontSize: 12, color: selected ? COLORS.primary : COLORS.light.textSecondary }}>{e.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Input label="描述（选填）" placeholder="Webhook 描述" value={webhookDesc} onChangeText={setWebhookDesc} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button title="取消" variant="secondary" onPress={() => setShowWebhookForm(false)} style={{ flex: 1 }} />
                  <Button title="创建" onPress={() => createWebhookMutation.mutate()} loading={createWebhookMutation.isPending} disabled={!webhookUrl} style={{ flex: 1 }} />
                </View>
              </Card>
            ) : (
              <Button title="创建 Webhook" onPress={() => setShowWebhookForm(true)} variant="outline" style={{ marginBottom: 16 }} />
            )}
            {typedHooks.map((hook) => (
              <Card key={hook.id} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.light.text }} numberOfLines={1}>{hook.url}</Text>
                <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 4 }}>{hook.events?.join(', ') || '-'}</Text>
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                  <TouchableOpacity onPress={() => testWebhookMutation.mutate(hook.id)}>
                    <Text style={{ fontSize: 12, color: COLORS.primary }}>测试</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Alert.alert('删除', '确定删除？', [
                    { text: '取消', style: 'cancel' },
                    { text: '删除', style: 'destructive', onPress: () => deleteWebhookMutation.mutate(hook.id) },
                  ])}>
                    <Text style={{ fontSize: 12, color: COLORS.danger }}>删除</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
            {typedHooks.length === 0 && !showWebhookForm && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="globe-outline" size={40} color={COLORS.light.disabled} />
                <Text style={{ fontSize: 14, color: COLORS.light.muted, marginTop: 8 }}>暂无 Webhook</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
    </View>
  );
}
