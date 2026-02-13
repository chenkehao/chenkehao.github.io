import React from 'react';
import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';

const isWeb = Platform.OS === 'web';

export default function CandidateLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.light.muted,
        tabBarStyle: {
          backgroundColor: COLORS.light.card,
          borderTopColor: COLORS.light.borderLight,
          borderTopWidth: 1,
          height: isWeb ? 60 : 85,
          paddingBottom: isWeb ? 8 : 28,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Devnors AI',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: focused ? COLORS.primary : COLORS.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                ...(focused ? {
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                } : {}),
              }}
            >
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={20}
                color={focused ? '#fff' : COLORS.primary}
              />
            </View>
          ),
          tabBarActiveTintColor: COLORS.primary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 0,
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '消息',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: '工作台',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="delivery" options={{ href: null }} />
    </Tabs>
  );
}
