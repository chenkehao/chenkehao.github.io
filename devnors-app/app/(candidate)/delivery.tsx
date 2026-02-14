import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getRecommendedJobs } from '../../services/jobs';
import { quickApply } from '../../services/jobs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';
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
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="AI 智能投递" showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 说明 */}
        <Text style={{ fontSize: 14, color: COLORS.light.muted, marginBottom: 16 }}>
          AI 根据你的简历和偏好，自动匹配并投递合适的职位
        </Text>

        {/* 一键投递 */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: COLORS.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="rocket" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text }}>
                一键智能投递
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.light.muted }}>
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
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
          推荐职位
        </Text>
        {isLoading ? (
          <Card style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: COLORS.light.placeholder }}>AI 正在匹配中...</Text>
          </Card>
        ) : (
          (jobs as unknown as Job[]).map((job) => {
            const applied = appliedIds.has(job.id);
            return (
              <Card key={job.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text }}>
                      {job.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.light.muted, marginTop: 4 }}>
                      {job.company} · {job.location}
                    </Text>
                  </View>
                  {job.salary_display && (
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
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
    </View>
  );
}
