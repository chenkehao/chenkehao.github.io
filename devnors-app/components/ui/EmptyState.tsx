import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <Ionicons name={icon} size={64} color="#cbd5e1" />
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#334155',
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: 14,
            color: '#64748b',
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      )}
      {actionTitle && onAction && (
        <View style={{ marginTop: 24 }}>
          <Button title={actionTitle} onPress={onAction} size="md" />
        </View>
      )}
    </View>
  );
}
