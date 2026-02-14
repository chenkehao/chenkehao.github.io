/**
 * 自定义大模型配置页 - 对齐 Web AIEngine（Ultra 专属）
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getAIConfigs, createAIConfig, deleteAIConfig } from '../../services/settings';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-o3', name: 'GPT-o3', provider: 'OpenAI' },
  { id: 'claude-4-opus', name: 'Claude 4 Opus', provider: 'Anthropic' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'qwen-3', name: 'Qwen 3', provider: 'Alibaba' },
  { id: 'grok-3', name: 'Grok 3', provider: 'xAI' },
];

export default function AIEngineScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isUltra = user?.account_tier === 'ULTRA';

  const { data: configs = [] } = useQuery({
    queryKey: ['aiConfigs', user?.id],
    queryFn: () => getAIConfigs(user?.id || 0),
    enabled: !!user?.id,
  });

  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => createAIConfig(user?.id || 0, {
      model_name: selectedModel,
      api_key: apiKey,
      base_url: baseUrl || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConfigs'] });
      setShowForm(false);
      setSelectedModel('');
      setApiKey('');
      setBaseUrl('');
      Alert.alert('成功', '模型配置已保存');
    },
    onError: (err: Error) => Alert.alert('失败', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAIConfig(user?.id || 0, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiConfigs'] }),
  });

  const connectedModels = (configs as Array<{ id: number; model_name: string; status?: string }>);

  if (!isUltra) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
        <PageHeader title="AI 引擎配置" showBack />
        <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16, alignItems: 'center', paddingTop: 80 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.warningBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="diamond" size={40} color={COLORS.warning} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.light.text, marginBottom: 8 }}>Ultra 专属功能</Text>
          <Text style={{ fontSize: 14, color: COLORS.light.muted, textAlign: 'center', lineHeight: 22 }}>
            升级到 Ultra 会员后，可接入第三方 AI 大模型{'\n'}（GPT-4o, Claude 4, Gemini 等）
          </Text>
          <Button
            title="了解升级"
            onPress={() => Alert.alert('升级', '请前往 Token 管理页面查看升级套餐')}
            style={{ marginTop: 24 }}
          />
        </View>
      </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="AI 引擎配置" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* 已接入模型 */}
        {connectedModels.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
              已接入模型
            </Text>
            {connectedModels.map((config) => (
              <Card key={config.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.successBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.light.text }}>{config.model_name}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.success }}>已连接</Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert('断开连接', `确定断开 ${config.model_name}？`, [
                    { text: '取消', style: 'cancel' },
                    { text: '断开', style: 'destructive', onPress: () => deleteMutation.mutate(config.id) },
                  ])}
                >
                  <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {/* 配置新模型 */}
        {showForm ? (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 16 }}>
              配置新模型
            </Text>

            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.light.textSecondary, marginBottom: 8 }}>选择模型</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {AVAILABLE_MODELS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedModel(m.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: selectedModel === m.id ? COLORS.primary : COLORS.light.bgSecondary,
                    borderWidth: 1,
                    borderColor: selectedModel === m.id ? COLORS.primary : COLORS.light.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: selectedModel === m.id ? '#fff' : COLORS.light.textSecondary }}>
                    {m.name}
                  </Text>
                  <Text style={{ fontSize: 10, color: selectedModel === m.id ? 'rgba(255,255,255,0.7)' : COLORS.light.placeholder }}>
                    {m.provider}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="API Key" isPassword placeholder="请输入 API Key" value={apiKey} onChangeText={setApiKey} />
            <Input label="自定义 Base URL（选填）" placeholder="如有自定义代理地址" value={baseUrl} onChangeText={setBaseUrl} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button title="取消" variant="secondary" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <Button
                title="保存配置"
                onPress={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!selectedModel || !apiKey}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : (
          <Button
            title="接入新模型"
            onPress={() => setShowForm(true)}
            variant="outline"
            size="lg"
          />
        )}

        {/* 说明 */}
        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.light.text }}>使用说明</Text>
          </View>
          <Text style={{ fontSize: 12, color: COLORS.light.muted, lineHeight: 20 }}>
            • 接入后，模型将出现在 AI 助手的模型选择器中{'\n'}
            • API Key 会加密存储，不会明文展示{'\n'}
            • 使用第三方模型将收取 20% 通道服务费{'\n'}
            • 费用按实际 API 调用量计算
          </Text>
        </Card>
      </View>
    </ScrollView>
    </View>
  );
}
