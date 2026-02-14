import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getMyJobs, createJob, deleteJob } from '../../services/jobs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';
import type { Job } from '../../shared/types';

export default function PostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['myJobs', user?.id],
    queryFn: () => getMyJobs(user?.id || 0),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJob(id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
  });

  const handleDelete = (job: Job) => {
    Alert.alert('删除职位', `确定删除「${job.title}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(job.id),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader
        title="职位管理"
        showBack
        rightActions={[
          { icon: 'add-circle-outline', onPress: () => setShowCreateModal(true) },
        ]}
      />

      {/* 职位列表 */}
      <FlatList
        data={jobs as Job[]}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => router.push(`/(common)/job/${item.id}` as `/${string}`)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.light.muted, marginTop: 4 }}>
                    {item.location} · {item.salary_display || '面议'}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: item.status === 'open' ? COLORS.successBg : COLORS.dangerBg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: item.status === 'open' ? COLORS.success : COLORS.danger,
                    }}
                  >
                    {item.status === 'open' ? '招聘中' : '已关闭'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: COLORS.light.placeholder }}>
                  {item.view_count} 浏览
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.light.placeholder }}>
                  {item.apply_count} 投递
                </Text>
              </View>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: COLORS.light.borderLight,
                gap: 8,
              }}
            >
              <Button
                title="删除"
                variant="ghost"
                size="sm"
                onPress={() => handleDelete(item)}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="briefcase-outline" size={56} color={COLORS.light.disabled} />
              <Text style={{ fontSize: 16, color: COLORS.light.placeholder, marginTop: 12 }}>
                暂无发布的职位
              </Text>
              <Button
                title="发布第一个职位"
                onPress={() => setShowCreateModal(true)}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : null
        }
      />

      {/* 创建职位 Modal */}
      <CreateJobModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={user?.id || 0}
        companyName={user?.company_name || ''}
      />
    </View>
  );
}

function CreateJobModal({
  visible,
  onClose,
  userId,
  companyName,
}: {
  visible: boolean;
  onClose: () => void;
  userId: number;
  companyName: string;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [requirements, setRequirements] = useState('');
  const [tagsText, setTagsText] = useState('');

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setSalaryMin('');
    setSalaryMax('');
    setRequirements('');
    setTagsText('');
  };

  const mutation = useMutation({
    mutationFn: () => {
      const tags = tagsText
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      return createJob({
        title,
        company: companyName,
        location,
        description: requirements
          ? `${description}\n\n【任职要求】\n${requirements}`
          : description,
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        user_id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      onClose();
      resetForm();
      Alert.alert('成功', '职位发布成功');
    },
    onError: (error: Error) => {
      Alert.alert('发布失败', error.message);
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: COLORS.light.borderLight,
            backgroundColor: COLORS.light.bg,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, color: COLORS.light.muted }}>取消</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.light.text }}>发布职位</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Input
            label="职位名称"
            placeholder="如：高级前端工程师"
            value={title}
            onChangeText={setTitle}
          />
          <Input
            label="工作地点"
            placeholder="如：北京 · 朝阳区"
            value={location}
            onChangeText={setLocation}
          />

          {/* 薪资范围 */}
          <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.light.textSecondary, marginBottom: 6 }}>
            薪资范围（K/月）
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={{
                  backgroundColor: COLORS.light.bgSecondary,
                  borderWidth: 1,
                  borderColor: COLORS.light.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: COLORS.light.text,
                }}
                placeholder="最低"
                placeholderTextColor={COLORS.light.placeholder}
                value={salaryMin}
                onChangeText={setSalaryMin}
                keyboardType="numeric"
              />
            </View>
            <Text style={{ alignSelf: 'center', color: COLORS.light.placeholder }}>-</Text>
            <View style={{ flex: 1 }}>
              <TextInput
                style={{
                  backgroundColor: COLORS.light.bgSecondary,
                  borderWidth: 1,
                  borderColor: COLORS.light.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: COLORS.light.text,
                }}
                placeholder="最高"
                placeholderTextColor={COLORS.light.placeholder}
                value={salaryMax}
                onChangeText={setSalaryMax}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label="技能标签"
            placeholder="用逗号分隔，如：React, TypeScript, Node.js"
            value={tagsText}
            onChangeText={setTagsText}
          />

          <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.light.textSecondary, marginBottom: 6 }}>
            职位描述
          </Text>
          <TextInput
            style={{
              backgroundColor: COLORS.light.bgSecondary,
              borderWidth: 1,
              borderColor: COLORS.light.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              minHeight: 100,
              textAlignVertical: 'top',
              marginBottom: 16,
              color: COLORS.light.text,
            }}
            placeholder="请输入职位描述、职责、福利等..."
            placeholderTextColor={COLORS.light.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.light.textSecondary, marginBottom: 6 }}>
            任职要求
          </Text>
          <TextInput
            style={{
              backgroundColor: COLORS.light.bgSecondary,
              borderWidth: 1,
              borderColor: COLORS.light.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              minHeight: 80,
              textAlignVertical: 'top',
              marginBottom: 16,
              color: COLORS.light.text,
            }}
            placeholder="请输入任职要求、学历、经验等..."
            placeholderTextColor={COLORS.light.placeholder}
            value={requirements}
            onChangeText={setRequirements}
            multiline
          />

          <Button
            title="发布职位"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!title.trim() || !location.trim() || !description.trim()}
            size="lg"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
