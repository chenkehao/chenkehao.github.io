import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/config';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = '加载中...' }: LoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.light.bgSecondary,
      }}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: 12, fontSize: 14, color: COLORS.light.muted }}>
        {message}
      </Text>
    </View>
  );
}
