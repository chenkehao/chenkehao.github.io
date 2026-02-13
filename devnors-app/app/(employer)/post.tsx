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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a' }}>职位管理</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#4f46e5',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            gap: 4,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#fff' }}>发布职位</Text>
        </TouchableOpacity>
      </View>

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
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    {item.location} · {item.salary_display || '面议'}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: item.status === 'open' ? '#dcfce7' : '#fef2f2',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: item.status === 'open' ? '#16a34a' : '#ef4444',
                    }}
                  >
                    {item.status === 'open' ? '招聘中' : '已关闭'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                  {item.view_count} 浏览
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>
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
                borderTopColor: '#f1f5f9',
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
              <Ionicons name="briefcase-outline" size={56} color="#cbd5e1" />
              <Text style={{ fontSize: 16, color: '#94a3b8', marginTop: 12 }}>
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
    </SafeAreaView>
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

  const mutation = useMutation({
    mutationFn: () =>
      createJob({
        title,
        company: companyName,
        location,
        description,
        user_id: userId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      onClose();
      setTitle('');
      setLocation('');
      setDescription('');
      Alert.alert('成功', '职位发布成功');
    },
    onError: (error: Error) => {
      Alert.alert('发布失败', error.message);
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, color: '#64748b' }}>取消</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#0f172a' }}>发布职位</Text>
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
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 6 }}>
            职位描述
          </Text>
          <TextInput
            style={{
              backgroundColor: '#f8fafc',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              minHeight: 150,
              textAlignVertical: 'top',
              marginBottom: 16,
            }}
            placeholder="请输入职位描述、要求、福利等..."
            value={description}
            onChangeText={setDescription}
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
