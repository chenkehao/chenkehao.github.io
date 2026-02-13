import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: '#4f46e5',
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    text: { color: '#ffffff' },
  },
  secondary: {
    container: { backgroundColor: '#f1f5f9' },
    text: { color: '#334155' },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: '#4f46e5',
    },
    text: { color: '#4f46e5' },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: '#4f46e5' },
  },
  danger: {
    container: { backgroundColor: '#ef4444' },
    text: { color: '#ffffff' },
  },
};

const sizeStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    text: { fontSize: 13 },
  },
  md: {
    container: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12 },
    text: { fontSize: 17 },
  },
};

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const vStyle = variantStyles[variant] || variantStyles.primary;
  const sStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        vStyle.container,
        sStyle.container,
        disabled && { opacity: 0.5 },
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyle.text.color} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              { fontWeight: '600', textAlign: 'center' },
              vStyle.text,
              sStyle.text,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
