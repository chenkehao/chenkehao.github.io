/**
 * 通知中心页面 - 对齐 Web NotificationCenterView
 * 从"我"页面 / 设置进入时使用此页面
 * 与消息 Tab 页共享相同的 API 和显示逻辑
 */
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getNotifications, markNotificationRead, deleteNotification } from '../../services/notifications';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';
import type { Notification } from '../../shared/types';

// 类型 Tab
const TABS: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: '全部', icon: 'notifications-outline' },
  { id: 'system', label: '系统', icon: 'settings-outline' },
  { id: 'match', label: '匹配', icon: 'locate-outline' },
  { id: 'interview', label: '面试', icon: 'calendar-outline' },
  { id: 'message', label: '互动', icon: 'chatbubble-outline' },
];

// icon 映射
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  Bell: 'notifications-outline',
  Target: 'locate-outline',
  Calendar: 'calendar-outline',
  MessageSquare: 'chatbubble-outline',
  Eye: 'eye-outline',
  AlertCircle: 'alert-circle-outline',
  CheckCircle2: 'checkmark-circle-outline',
  Users: 'people-outline',
  Zap: 'flash-outline',
  Briefcase: 'briefcase-outline',
};

function getStyle(importance: string, read: boolean) {
  if (importance === 'critical' && !read) {
    return { bg: COLORS.dangerBg, border: COLORS.danger, iconBg: COLORS.dangerBg, iconColor: COLORS.danger };
  }
  if (!read) {
    return { bg: COLORS.primaryBg, border: COLORS.primaryBorder, iconBg: COLORS.primaryBg, iconColor: COLORS.primary };
  }
  return { bg: COLORS.light.card, border: COLORS.light.borderLight, iconBg: COLORS.light.bgSecondary, iconColor: COLORS.light.placeholder };
}

export default function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['allNotifications', user?.id, activeTab],
    queryFn: () =>
      getNotifications(user?.id || 0, {
        type: activeTab === 'all' ? undefined : activeTab,
        pageSize: 100,
      }),
    enabled: !!user?.id,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;
  const total = data?.total || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markNotificationRead(user.id);
    queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
  };

  const handlePress = async (item: Notification) => {
    if (!item.read && user?.id) {
      await markNotificationRead(user.id, item.id);
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    }
  };

  const handleDelete = (item: Notification) => {
    Alert.alert('删除通知', `确定删除「${item.title}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          if (user?.id) {
            await deleteNotification(user.id, item.id);
            queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const s = getStyle(item.importance, item.read);
    const iconName = ICON_MAP[item.icon] || 'notifications-outline';

    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          backgroundColor: s.bg,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
          gap: 12,
          borderWidth: 1,
          borderColor: s.border,
        }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: s.iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={iconName} size={20} color={s.iconColor} />
          {item.importance === 'critical' && !item.read && (
            <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger }} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {item.importance === 'critical' && (
              <View style={{ backgroundColor: COLORS.dangerBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
                <Text style={{ fontSize: 10, color: COLORS.danger, fontWeight: '700' }}>重要</Text>
              </View>
            )}
            <Text style={{ flex: 1, fontSize: 14, fontWeight: item.read ? '400' : '600', color: item.read ? COLORS.light.muted : COLORS.light.text }} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary }} />}
          </View>
          <Text style={{ fontSize: 13, color: item.read ? COLORS.light.placeholder : COLORS.light.muted, marginTop: 3 }} numberOfLines={2}>
            {item.content}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
            <Text style={{ fontSize: 11, color: COLORS.light.placeholder }}>{item.time}</Text>
            {item.sender && item.sender !== '系统' && (
              <View style={{ backgroundColor: COLORS.light.bgSecondary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: COLORS.light.placeholder, fontWeight: '500' }}>via {item.sender}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader
        title="通知中心"
        showBack
        rightActions={
          unreadCount > 0
            ? [{ icon: 'checkmark-done-outline', onPress: handleMarkAllRead }]
            : undefined
        }
      />

      {/* 类型 Tab */}
      <View style={{ flexDirection: 'row', backgroundColor: COLORS.light.bg, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.light.borderLight }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, backgroundColor: isActive ? COLORS.primaryBg : 'transparent' }}
            >
              <Ionicons name={tab.icon} size={16} color={isActive ? COLORS.primary : COLORS.light.placeholder} />
              <Text style={{ fontSize: 11, fontWeight: isActive ? '600' : '400', color: isActive ? COLORS.primary : COLORS.light.muted, marginTop: 2 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 未读提示 */}
      {unreadCount > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.primaryBg }}>
          <Text style={{ fontSize: 13, color: COLORS.primary }}>{unreadCount} 条未读通知</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>全部已读</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 通知列表 */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Ionicons name="notifications-outline" size={56} color={COLORS.light.disabled} />
            <Text style={{ fontSize: 16, color: COLORS.light.placeholder, marginTop: 12 }}>暂无通知</Text>
            <Text style={{ fontSize: 13, color: COLORS.light.disabled, marginTop: 4 }}>通知将在这里显示</Text>
          </View>
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <Text style={{ textAlign: 'center', fontSize: 12, color: COLORS.light.disabled, paddingVertical: 16 }}>
              共 {total} 条通知 · 长按可删除
            </Text>
          ) : null
        }
      />
    </View>
  );
}
