import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getPublicFlow, advanceFlow } from '../../../services/flows';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingScreen from '../../../components/ui/LoadingScreen';

const stageLabels: Record<string, string> = {
  screening: '筛选中',
  interview: '面试中',
  offer: 'Offer',
  hired: '已录用',
  rejected: '已拒绝',
  resume_review: '简历筛选',
  technical_interview: '技术面试',
  hr_interview: 'HR面试',
  completed: '已完成',
};

export default function FlowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: flow, isLoading } = useQuery({
    queryKey: ['flow', id],
    queryFn: () => getPublicFlow(Number(id)),
    enabled: !!id,
  });

  const advanceMutation = useMutation({
    mutationFn: () => advanceFlow(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow', id] });
      Alert.alert('成功', '流程已推进');
    },
    onError: (error: Error) => Alert.alert('操作失败', error.message),
  });

  if (isLoading || !flow) {
    return <LoadingScreen message="加载流程详情..." />;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16 }}>
        {/* 状态概览 */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a' }}>
                {flow.job_title || `职位 #${flow.job_id}`}
              </Text>
              {flow.company && (
                <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                  {flow.company}
                </Text>
              )}
            </View>
            <View
              style={{
                backgroundColor: '#eef2ff',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#4f46e5' }}>
                {stageLabels[flow.current_stage] || flow.current_stage}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
            {flow.match_score > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="analytics-outline" size={16} color="#4f46e5" />
                <Text style={{ fontSize: 13, color: '#4f46e5' }}>
                  匹配 {flow.match_score}%
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="flash-outline" size={16} color="#f59e0b" />
              <Text style={{ fontSize: 13, color: '#f59e0b' }}>
                消耗 {flow.tokens_consumed} Token
              </Text>
            </View>
          </View>
        </Card>

        {/* 时间线 */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
            流程时间线
          </Text>
          {flow.timeline && flow.timeline.length > 0 ? (
            flow.timeline.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  paddingLeft: 16,
                  paddingBottom: index < flow.timeline.length - 1 ? 16 : 0,
                  borderLeftWidth: 2,
                  borderLeftColor: index === 0 ? '#4f46e5' : '#e2e8f0',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: -5,
                    top: 2,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: index === 0 ? '#4f46e5' : '#e2e8f0',
                  }}
                />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155' }}>
                    {item.action}
                  </Text>
                  {item.agent_name && (
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      由 {item.agent_name} 处理
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: '#94a3b8', textAlign: 'center' }}>暂无流程记录</Text>
          )}
        </Card>

        {/* 推进按钮 */}
        {flow.status !== 'completed' && flow.status !== 'rejected' && (
          <Button
            title="推进流程"
            onPress={() => advanceMutation.mutate()}
            loading={advanceMutation.isPending}
            size="lg"
          />
        )}
      </View>
    </ScrollView>
  );
}
