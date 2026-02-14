import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/auth';
import { getPublicJob, quickApply } from '../../../services/jobs';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingScreen from '../../../components/ui/LoadingScreen';
import PageHeader from '../../../components/ui/PageHeader';
import { COLORS } from '../../../constants/config';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getPublicJob(Number(id)),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      quickApply({ job_id: Number(id), user_id: user?.id || 0 }),
    onSuccess: () => Alert.alert('投递成功', '已成功投递，请关注消息通知'),
    onError: (error: Error) => Alert.alert('投递失败', error.message),
  });

  if (isLoading || !job) {
    return <LoadingScreen message="加载职位详情..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="职位详情" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* 标题 */}
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.light.text }}>
          {job.title}
        </Text>
        {job.salary_display && (
          <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginTop: 8 }}>
            {job.salary_display}
          </Text>
        )}

        {/* 公司信息 */}
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="business-outline" size={16} color={COLORS.light.muted} />
            <Text style={{ fontSize: 14, color: COLORS.light.muted }}>{job.company}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={16} color={COLORS.light.muted} />
            <Text style={{ fontSize: 14, color: COLORS.light.muted }}>{job.location}</Text>
          </View>
        </View>

        {/* 标签 */}
        {job.tags?.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8 }}>
            {job.tags.map((tag) => (
              <View
                key={tag.id}
                style={{
                  backgroundColor: COLORS.primaryBg,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 13, color: COLORS.primary }}>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 职位描述 */}
        <Card style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 8 }}>
            职位描述
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.light.textSecondary, lineHeight: 22 }}>
            {job.description}
          </Text>
        </Card>

        {/* 要求 */}
        {job.requirements && (
          <Card style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 8 }}>
              任职要求
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.light.textSecondary, lineHeight: 22 }}>
              {job.requirements}
            </Text>
          </Card>
        )}

        {/* 数据 */}
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 13, color: COLORS.light.placeholder }}>
            {job.view_count} 次浏览
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.light.placeholder }}>
            {job.apply_count} 人投递
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.light.placeholder }}>
            {new Date(job.created_at).toLocaleDateString('zh-CN')} 发布
          </Text>
        </View>
      </View>

      {/* 底部投递按钮 */}
      <View
        style={{
          padding: 16,
          paddingBottom: 34,
          backgroundColor: COLORS.light.bg,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.light.borderLight,
        }}
      >
        <Button
          title="立即投递"
          onPress={() => applyMutation.mutate()}
          loading={applyMutation.isPending}
          size="lg"
        />
      </View>
    </ScrollView>
    </View>
  );
}
