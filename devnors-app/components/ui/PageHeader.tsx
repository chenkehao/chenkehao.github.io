/**
 * 微信风格页面顶部标题栏
 * Tab 页使用：不带返回按钮，显示标题 + 可选右侧按钮
 * 独立页使用：带返回箭头
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightActions?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badge?: number;
  }[];
  backgroundColor?: string;
  borderBottom?: boolean;
}

export default function PageHeader({
  title,
  showBack = false,
  onBack,
  rightActions,
  backgroundColor = COLORS.light.bg,
  borderBottom = true,
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View
      style={{
        backgroundColor,
        paddingTop: insets.top,
        borderBottomWidth: borderBottom ? 0.5 : 0,
        borderBottomColor: COLORS.light.borderLight,
      }}
    >
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        {/* 左侧 */}
        <View style={{ width: 56, alignItems: 'flex-start' }}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.light.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* 标题 */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: COLORS.light.text,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* 右侧 */}
        <View style={{ width: 56, flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }}>
          {rightActions?.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={action.onPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <View>
                <Ionicons name={action.icon} size={20} color={COLORS.light.text} />
                {action.badge != null && action.badge > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      backgroundColor: COLORS.danger,
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: COLORS.light.bg, fontWeight: '600' }}>
                      {action.badge > 99 ? '99+' : action.badge}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
