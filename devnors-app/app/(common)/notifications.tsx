// 通知中心页面 - 复用候选人端消息逻辑
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getNotifications, markNotificationRead, deleteNotification } from '../../services/notifications';
import type { Notification } from '../../shared/types';

export default function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['allNotifications', user?.id],
    queryFn: () => getNotifications(user?.id || 0, { pageSize: 100 }),
    enabled: !!user?.id,
  });

  const notifications = data?.items || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const handlePress = async (item: Notification) => {
    if (!item.is_read && user?.id) {
      await markNotificationRead(user.id, item.id);
      refetch();
    }
  };

  const handleDelete = async (item: Notification) => {
    if (user?.id) {
      await deleteNotification(user.id, item.id);
      refetch();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
        }
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            onLongPress={() => handleDelete(item)}
            style={{
              backgroundColor: item.is_read ? '#fff' : '#f0f4ff',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: item.is_read ? '400' : '600',
                color: '#0f172a',
              }}
            >
              {item.title}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }} numberOfLines={3}>
              {item.content}
            </Text>
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              {new Date(item.created_at).toLocaleString('zh-CN')}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="notifications-outline" size={56} color="#cbd5e1" />
            <Text style={{ fontSize: 16, color: '#94a3b8', marginTop: 12 }}>暂无通知</Text>
          </View>
        }
      />
    </View>
  );
}
