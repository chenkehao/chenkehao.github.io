/**
 * 统一头像组件 - 参考 Web 端样式
 * 1. 有 avatar_url 时显示图片（自动处理相对路径）
 * 2. 无 avatar_url 时显示渐变背景 + 姓名首字母
 */
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL, COLORS } from '../../constants/config';

interface AvatarProps {
  /** 头像 URL（支持绝对/相对路径） */
  uri?: string | null;
  /** 用户名（取首字母做兜底） */
  name?: string | null;
  /** 尺寸，默认 60 */
  size?: number;
  /** 字体大小，默认 size * 0.4 */
  fontSize?: number;
}

/** 将后端返回的相对路径转为绝对 URL */
function resolveAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  // 已经是绝对 URL
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // 相对路径：从 API_BASE_URL 推导出服务器根地址
  const serverRoot = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${serverRoot}${url}`;
}

export default function Avatar({ uri, name, size = 60, fontSize }: AvatarProps) {
  const resolvedUri = resolveAvatarUrl(uri);
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  const textSize = fontSize || Math.round(size * 0.4);
  const radius = size / 2;

  // 显示图片
  if (resolvedUri && !imgError) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={{ uri: resolvedUri }}
          style={{ width: size, height: size, borderRadius: radius }}
          onError={() => setImgError(true)}
        />
      </View>
    );
  }

  // 兜底：渐变背景 + 首字母（与 Web 的 from-indigo-500 to-purple-600 一致）
  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { width: size, height: size, borderRadius: radius }]}
    >
      <Text style={[styles.initial, { fontSize: textSize }]}>{initial}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
  },
});
