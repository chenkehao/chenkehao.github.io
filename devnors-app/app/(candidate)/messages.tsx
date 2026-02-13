import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getNotifications, markNotificationRead } from '../../services/notifications';
import type { Notification } from '../../shared/types';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  system: 'settings-outline',
  job: 'briefcase-outline',
  flow: 'git-branch-outline',
  token: 'wallet-outline',
  invite: 'person-add-outline',
};

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user?.id || 0, { pageSize: 50 }),
    enabled: !!user?.id,
  });

  const notifications = data?.items || [];
  const unreadCount = data?.unread_count || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markNotificationRead(user.id);
    refetch();
  };

  const handlePress = async (item: Notification) => {
    if (!item.is_read && user?.id) {
      await markNotificationRead(user.id, item.id);
      refetch();
    }
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
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a' }}>消息</Text>
          {unreadCount > 0 && (
            <Text style={{ fontSize: 13, color: '#4f46e5', marginTop: 2 }}>
              {unreadCount} 条未读
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={{ fontSize: 13, color: '#4f46e5' }}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
        }
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            style={{
              flexDirection: 'row',
              backgroundColor: item.is_read ? '#fff' : '#f0f4ff',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: item.is_read ? '#f1f5f9' : '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={iconMap[item.notification_type] || 'notifications-outline'}
                size={18}
                color={item.is_read ? '#94a3b8' : '#4f46e5'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: item.is_read ? '400' : '600',
                  color: '#0f172a',
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {new Date(item.created_at).toLocaleString('zh-CN')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="chatbubbles-outline" size={56} color="#cbd5e1" />
            <Text style={{ fontSize: 16, color: '#94a3b8', marginTop: 12 }}>暂无消息</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
