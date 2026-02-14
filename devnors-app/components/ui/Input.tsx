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
import { COLORS } from '../../constants/config';

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
            color: COLORS.light.textSecondary,
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
          borderColor: error ? COLORS.danger : isFocused ? COLORS.primary : COLORS.light.border,
          borderRadius: 10,
          backgroundColor: COLORS.light.bgSecondary,
          paddingHorizontal: 12,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? COLORS.primary : COLORS.light.placeholder}
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          style={[
            {
              flex: 1,
              paddingVertical: 12,
              fontSize: 15,
              color: COLORS.light.text,
            },
            style,
          ]}
          placeholderTextColor={COLORS.light.placeholder}
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
              color={COLORS.light.placeholder}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
