import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Flow } from '../../shared/types';

interface FlowCardProps {
  flow: Flow;
  onPress?: () => void;
}

const stageColors: Record<string, string> = {
  screening: '#3b82f6',
  interview: '#f59e0b',
  offer: '#10b981',
  hired: '#4f46e5',
  rejected: '#ef4444',
};

const stageLabels: Record<string, string> = {
  screening: '筛选中',
  interview: '面试中',
  offer: 'Offer',
  hired: '已录用',
  rejected: '已拒绝',
  resume_review: '简历筛选',
  technical_interview: '技术面试',
  hr_interview: 'HR面试',
  completed: '已完成',
};

export default function FlowCard({ flow, onPress }: FlowCardProps) {
  const stageColor = stageColors[flow.current_stage] || '#64748b';
  const stageLabel = stageLabels[flow.current_stage] || flow.current_stage;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>
            {flow.job_title || `职位 #${flow.job_id}`}
          </Text>
          {flow.company && (
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {flow.company}
            </Text>
          )}
        </View>
        <View
          style={{
            backgroundColor: stageColor + '15',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '500', color: stageColor }}>
            {stageLabel}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
        {flow.match_score > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="analytics-outline" size={14} color="#4f46e5" />
            <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '500' }}>
              匹配 {flow.match_score}%
            </Text>
          </View>
        )}
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>
          {new Date(flow.created_at).toLocaleDateString('zh-CN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
