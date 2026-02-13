import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
      }}
    >
      <ActivityIndicator size="large" color="#4f46e5" />
      {message && (
        <Text
          style={{
            fontSize: 14,
            color: '#64748b',
            marginTop: 12,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
