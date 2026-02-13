import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  icon,
  containerStyle,
  isPassword,
  style,
  ...rest
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#334155',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: error ? '#ef4444' : isFocused ? '#4f46e5' : '#e2e8f0',
          borderRadius: 10,
          backgroundColor: '#f8fafc',
          paddingHorizontal: 12,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? '#4f46e5' : '#94a3b8'}
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          style={[
            {
              flex: 1,
              paddingVertical: 12,
              fontSize: 15,
              color: '#0f172a',
            },
            style,
          ]}
          placeholderTextColor="#94a3b8"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
