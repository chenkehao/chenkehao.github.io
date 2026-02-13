import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getCandidate } from '../../../services/candidates';
import Card from '../../../components/ui/Card';
import LoadingScreen from '../../../components/ui/LoadingScreen';

export default function CandidateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => getCandidate(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !candidate) {
    return <LoadingScreen message="加载人才详情..." />;
  }

  const profile = candidate.profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16 }}>
        {/* 基本信息 */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons name="person" size={28} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>
                {profile?.name || '匿名'}
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                {profile?.role || '未设置'}
                {profile?.experienceYears ? ` · ${profile.experienceYears}年经验` : ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* 技能 */}
        {profile?.skills && profile.skills.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 10 }}>
              技能标签
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {profile.skills.map((skill, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#eef2ff',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#4f46e5' }}>{skill}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 个人简介 */}
        {profile?.summary && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 8 }}>
              个人简介
            </Text>
            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
              {profile.summary}
            </Text>
          </Card>
        )}

        {/* 薪资/市场 */}
        {(profile?.salaryRange || profile?.marketDemand) && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 8 }}>
              市场分析
            </Text>
            {profile?.salaryRange && (
              <Text style={{ fontSize: 14, color: '#334155', marginBottom: 4 }}>
                薪资范围: {profile.salaryRange}
              </Text>
            )}
            {profile?.marketDemand && (
              <Text style={{ fontSize: 14, color: '#334155' }}>
                市场需求: {profile.marketDemand}
              </Text>
            )}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
