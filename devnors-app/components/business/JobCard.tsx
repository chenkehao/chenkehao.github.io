import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Job } from '../../shared/types';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
  showApplyButton?: boolean;
  onApply?: () => void;
}

export default function JobCard({ job, onPress, showApplyButton, onApply }: JobCardProps) {
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
      {/* 标题与薪资 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 }} numberOfLines={1}>
          {job.title}
        </Text>
        {job.salary_display && (
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#4f46e5', marginLeft: 8 }}>
            {job.salary_display}
          </Text>
        )}
      </View>

      {/* 公司与地点 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="business-outline" size={14} color="#64748b" />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{job.company}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{job.location}</Text>
        </View>
      </View>

      {/* 标签 */}
      {job.tags && job.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 }}>
          {job.tags.slice(0, 4).map((tag) => (
            <View
              key={tag.id}
              style={{
                backgroundColor: '#eef2ff',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 11, color: '#4f46e5' }}>{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 底部信息 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            {job.view_count} 浏览
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            {job.apply_count} 投递
          </Text>
        </View>
        {showApplyButton && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onApply?.();
            }}
            style={{
              backgroundColor: '#4f46e5',
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#fff' }}>投递</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
