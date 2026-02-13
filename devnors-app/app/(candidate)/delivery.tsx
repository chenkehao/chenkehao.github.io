import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getRecommendedJobs } from '../../services/jobs';
import { quickApply } from '../../services/jobs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import type { Job } from '../../shared/types';

export default function DeliveryScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['deliveryJobs'],
    queryFn: () => getRecommendedJobs(10),
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: number) =>
      quickApply({ job_id: jobId, user_id: user?.id || 0 }),
    onSuccess: (_data, jobId) => {
      setAppliedIds((prev) => new Set(prev).add(jobId));
      queryClient.invalidateQueries({ queryKey: ['flowStats'] });
      Alert.alert('投递成功', '已成功投递，请关注消息通知');
    },
    onError: (error: Error) => {
      Alert.alert('投递失败', error.message);
    },
  });

  const handleBatchApply = () => {
    const typedJobs = jobs as unknown as Job[];
    const unapplied = typedJobs.filter((j) => !appliedIds.has(j.id));
    if (unapplied.length === 0) {
      Alert.alert('提示', '所有职位均已投递');
      return;
    }
    Alert.alert(
      'AI 智能投递',
      `将为您一键投递 ${unapplied.length} 个推荐职位，确认吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认投递',
          onPress: () => {
            unapplied.forEach((j) => applyMutation.mutate(j.id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a' }}>
            AI 智能投递
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            AI 根据你的简历和偏好，自动匹配并投递合适的职位
          </Text>
        </View>

        {/* 一键投递 */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="rocket" size={24} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>
                一键智能投递
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b' }}>
                {jobs.length} 个推荐职位待投递
              </Text>
            </View>
          </View>
          <Button
            title={`投递全部 (${jobs.length - appliedIds.size} 个)`}
            onPress={handleBatchApply}
            loading={applyMutation.isPending}
            disabled={isLoading}
          />
        </Card>

        {/* 职位列表 */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
          推荐职位
        </Text>
        {isLoading ? (
          <Card style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: '#94a3b8' }}>AI 正在匹配中...</Text>
          </Card>
        ) : (
          (jobs as unknown as Job[]).map((job) => {
            const applied = appliedIds.has(job.id);
            return (
              <Card key={job.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
                      {job.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                      {job.company} · {job.location}
                    </Text>
                  </View>
                  {job.salary_display && (
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#4f46e5' }}>
                      {job.salary_display}
                    </Text>
                  )}
                </View>
                <View style={{ marginTop: 12 }}>
                  <Button
                    title={applied ? '已投递' : '投递'}
                    variant={applied ? 'secondary' : 'primary'}
                    size="sm"
                    disabled={applied}
                    onPress={() => applyMutation.mutate(job.id)}
                    loading={applyMutation.isPending && applyMutation.variables === job.id}
                  />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
