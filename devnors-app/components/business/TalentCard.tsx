import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TalentCardProps {
  talent: {
    id: number;
    profile?: {
      name: string;
      role: string;
      skills: string[];
      experienceYears: number;
      summary: string;
    };
    candidate_name?: string;
  };
  onPress?: () => void;
}

export default function TalentCard({ talent, onPress }: TalentCardProps) {
  const name = talent.profile?.name || talent.candidate_name || '匿名';
  const role = talent.profile?.role || '未设置';
  const skills = talent.profile?.skills || [];
  const exp = talent.profile?.experienceYears;

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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#eef2ff',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="person" size={20} color="#4f46e5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>{name}</Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {role}{exp ? ` · ${exp}年经验` : ''}
          </Text>
        </View>
      </View>

      {skills.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 }}>
          {skills.slice(0, 5).map((skill, i) => (
            <View
              key={i}
              style={{
                backgroundColor: '#f0fdf4',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 11, color: '#16a34a' }}>{skill}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
