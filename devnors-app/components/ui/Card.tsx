import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { COLORS } from '../../constants/config';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.light.card,
          borderRadius: 12,
          padding: 16,
          ...(variant === 'elevated'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }
            : {
                borderWidth: 1,
                borderColor: COLORS.light.borderLight,
              }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
