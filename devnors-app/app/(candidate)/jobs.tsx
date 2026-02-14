import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getPublicJobs, getJobTags } from '../../services/jobs';
import JobCard from '../../components/business/JobCard';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';
import type { Job } from '../../shared/types';

export default function JobsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);

  const { data: tagsData = [] } = useQuery({
    queryKey: ['jobTags'],
    queryFn: getJobTags,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['publicJobs', page, searchQuery, selectedTag],
    queryFn: () =>
      getPublicJobs({
        page,
        page_size: 20,
        search: searchQuery || undefined,
        tag: selectedTag || undefined,
      }),
  });

  const jobs = data?.items || [];
  const hasMore = data ? data.page < data.pages : false;

  const handleSearch = () => {
    setSearchQuery(search);
    setPage(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="职位搜索" showBack />

      {/* 搜索栏 */}
      <View style={{ padding: 16, paddingBottom: 0, backgroundColor: COLORS.light.bg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.light.bgSecondary,
            borderRadius: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: COLORS.light.border,
          }}
        >
          <Ionicons name="search-outline" size={18} color={COLORS.light.placeholder} />
          <TextInput
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: COLORS.light.text }}
            placeholder="搜索职位、公司..."
            placeholderTextColor={COLORS.light.placeholder}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); setSearchQuery(''); setPage(1); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.light.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 标签筛选 */}
        {tagsData.length > 0 && (
          <FlatList
            data={[{ id: 0, name: '全部', category: '' }, ...tagsData]}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12, marginBottom: 8 }}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const active = selectedTag === (item.id === 0 ? '' : item.name);
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTag(item.id === 0 ? '' : item.name);
                    setPage(1);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: active ? COLORS.primary : COLORS.light.card,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: active ? COLORS.primary : COLORS.light.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: active ? '#fff' : COLORS.light.muted,
                      fontWeight: active ? '500' : '400',
                    }}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* 职位列表 */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 12 }}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => router.push(`/(common)/job/${item.id}` as `/${string}`)}
            showApplyButton
          />
        )}
        onEndReached={() => {
          if (hasMore && !isFetching) setPage((p) => p + 1);
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetching ? (
            <ActivityIndicator style={{ padding: 16 }} color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="search-outline" size={56} color={COLORS.light.disabled} />
              <Text style={{ fontSize: 16, color: COLORS.light.placeholder, marginTop: 12 }}>
                {searchQuery ? '没有找到相关职位' : '暂无职位'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
