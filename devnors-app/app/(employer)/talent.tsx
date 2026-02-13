import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getPublicTalentsPaged, getTalentSkills } from '../../services/candidates';
import TalentCard from '../../components/business/TalentCard';

export default function TalentScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [page, setPage] = useState(1);

  const { data: skills = [] } = useQuery({
    queryKey: ['talentSkills'],
    queryFn: getTalentSkills,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['talents', page, searchQuery, selectedSkill],
    queryFn: () =>
      getPublicTalentsPaged({
        page,
        page_size: 20,
        search: searchQuery || undefined,
        skill: selectedSkill || undefined,
      }),
  });

  const talents = data?.items || [];
  const hasMore = data ? data.page < data.pages : false;

  const handleSearch = () => {
    setSearchQuery(search);
    setPage(1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* 搜索栏 */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
          人才库
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}
        >
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15 }}
            placeholder="搜索人才..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {/* 技能标签 */}
        {skills.length > 0 && (
          <FlatList
            data={['全部', ...skills]}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const active = selectedSkill === (item === '全部' ? '' : item);
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedSkill(item === '全部' ? '' : item);
                    setPage(1);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: active ? '#4f46e5' : '#fff',
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: active ? '#4f46e5' : '#e2e8f0',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: active ? '#fff' : '#64748b',
                      fontWeight: active ? '500' : '400',
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <FlatList
        data={talents as unknown as Array<{ id: number; profile?: { name: string; role: string; skills: string[]; experienceYears: number; summary: string }; candidate_name?: string }>}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 12 }}
        renderItem={({ item }) => (
          <TalentCard
            talent={item}
            onPress={() => router.push(`/(common)/candidate/${item.id}` as `/${string}`)}
          />
        )}
        onEndReached={() => {
          if (hasMore && !isFetching) setPage((p) => p + 1);
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetching ? (
            <ActivityIndicator style={{ padding: 16 }} color="#4f46e5" />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="people-outline" size={56} color="#cbd5e1" />
              <Text style={{ fontSize: 16, color: '#94a3b8', marginTop: 12 }}>
                暂无人才数据
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
