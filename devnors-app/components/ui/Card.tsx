import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
}

export default function Card({
  variant = 'default',
  padding = 16,
  style,
  children,
  ...rest
}: CardProps) {
  const baseStyle: ViewStyle = {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding,
  };

  const variants: Record<string, ViewStyle> = {
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    outlined: {
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
  };

  return (
    <View style={[baseStyle, variants[variant], style]} {...rest}>
      {children}
    </View>
  );
}
