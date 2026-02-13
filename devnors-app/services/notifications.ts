/**
 * 通知 API 服务
 */
import api from './api';
import type { Notification } from '../shared/types';

/** 获取通知列表 */
export const getNotifications = async (
  userId: number,
  options: {
    type?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{
  items: Notification[];
  total: number;
  unread_count: number;
}> => {
  const response = await api.get('/public/notifications', {
    params: {
      user_id: userId,
      notification_type: options.type,
      unread_only: options.unreadOnly,
      page: options.page || 1,
      page_size: options.pageSize || 20,
    },
  });
  return response.data;
};

/** 标记已读 */
export const markNotificationRead = async (
  userId: number,
  notificationId?: number
): Promise<void> => {
  await api.post('/public/notifications/read', null, {
    params: { user_id: userId, notification_id: notificationId },
  });
};

/** 删除通知 */
export const deleteNotification = async (
  userId: number,
  notificationId: number
): Promise<void> => {
  await api.delete(`/public/notifications/${notificationId}`, {
    params: { user_id: userId },
  });
};

/** 获取未读通知数量 */
export const getUnreadCount = async (userId: number): Promise<{ count: number }> => {
  const response = await api.get('/public/notifications/unread-count', {
    params: { user_id: userId },
  });
  return response.data;
};
