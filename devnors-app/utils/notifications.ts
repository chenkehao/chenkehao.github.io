/**
 * 推送通知工具
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { Platform } from 'react-native';
import api from '../services/api';

// 配置通知处理方式
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 注册推送通知并获取 Expo Push Token
 */
export async function registerForPushNotifications(
  userId: number
): Promise<string | null> {
  if (!Device.default.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    // 请求权限
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission denied');
      return null;
    }

    // 获取 Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Device.default.expoConfig?.extra?.eas?.projectId,
    });
    const pushToken = tokenData.data;

    // 注册到后端
    await api.post('/public/devices/register', {
      push_token: pushToken,
      platform: Platform.OS,
    }, {
      params: { user_id: userId },
    });

    // Android 需要设置通知渠道
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    return pushToken;
  } catch (error) {
    console.error('Failed to register push notifications:', error);
    return null;
  }
}

/**
 * 添加通知接收监听器
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * 添加通知点击监听器
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
