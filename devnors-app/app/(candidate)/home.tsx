/**
 * 求职者工作台 - 整合职位浏览
 * 统计卡片 + 任务中心 + 推荐职位 + 投递队列
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { COLORS } from '../../constants/config';
import { getFlowStats, getPublicFlows } from '../../services/flows';
import { getTokenStats } from '../../services/tokens';
import { getTodos } from '../../services/todos';
import { getRecommendedJobs, getPublicJobs, getJobTags } from '../../services/jobs';
import JobCard from '../../components/business/JobCard';
import Card from '../../components/ui/Card';
import type { Todo, Flow, Job } from '../../shared/types';

const FLOW_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  viewed: { label: '已查看', color: '#3b82f6', bg: '#dbeafe' },
  applied: { label: '已投递', color: '#4f46e5', bg: '#eef2ff' },
  passed: { label: '已通过', color: '#10b981', bg: '#d1fae5' },
  pending: { label: '进行中', color: '#f59e0b', bg: '#fef3c7' },
  rejected: { label: '未通过', color: '#ef4444', bg: '#fef2f2' },
};

type TabKey = 'overview' | 'jobs' | 'flows';

export default function CandidateWorkbenchScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [jobSearch, setJobSearch] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // 统计数据
  const { data: flowStats, refetch: refetchStats } = useQuery({
    queryKey: ['flowStats', user?.id],
    queryFn: () => getFlowStats(user?.id),
    enabled: !!user?.id,
  });

  const { data: tokenStats, refetch: refetchTokens } = useQuery({
    queryKey: ['tokenStats', user?.id],
    queryFn: () => getTokenStats(user?.id || 0),
    enabled: !!user?.id,
  });

  const { data: todos = [], refetch: refetchTodos } = useQuery({
    queryKey: ['todos', user?.id],
    queryFn: () => getTodos(user?.id || 0),
    enabled: !!user?.id,
  });

  const { data: flows = [], refetch: refetchFlows } = useQuery({
    queryKey: ['recentFlows', user?.id],
    queryFn: () => getPublicFlows(10, user?.id),
    enabled: !!user?.id,
  });

  // 推荐职位
  const { data: recommendedJobs = [], refetch: refetchRecommended } = useQuery({
    queryKey: ['recommendedJobs'],
    queryFn: () => getRecommendedJobs(6),
  });

  // 职位搜索
  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ['publicJobs', 1, jobSearchQuery, selectedTag],
    queryFn: () =>
      getPublicJobs({
        page: 1,
        page_size: 20,
        search: jobSearchQuery || undefined,
        tag: selectedTag || undefined,
      }),
    enabled: activeTab === 'jobs',
  });

  const { data: tagsData = [] } = useQuery({
    queryKey: ['jobTags'],
    queryFn: getJobTags,
    enabled: activeTab === 'jobs',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchTokens(), refetchTodos(), refetchFlows(), refetchRecommended()]);
    if (activeTab === 'jobs') await refetchJobs();
    setRefreshing(false);
  }, [activeTab]);

  const pendingTodos = todos.filter((t: Todo) => {
    const s = t.status?.toLowerCase();
    return s === 'pending' || s === 'running' || s === 'in_progress';
  });

  const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'overview', label: '总览', icon: 'home-outline' },
    { key: 'jobs', label: '职位', icon: 'briefcase-outline' },
    { key: 'flows', label: '投递', icon: 'paper-plane-outline' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* 顶部 */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 13, color: '#64748b' }}>
              你好，{user?.name || '求职者'}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 2 }}>
              工作台
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/(common)/notifications' as `/${string}`)}
              style={{
                width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications-outline" size={18} color="#334155" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(common)/tokens' as `/${string}`)}
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
                borderRadius: 10, paddingHorizontal: 10, height: 36, gap: 4,
              }}
            >
              <Ionicons name="wallet-outline" size={14} color="#4f46e5" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>
                {tokenStats?.balance_display ?? '0'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 页签切换 */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 4 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 18,
                backgroundColor: activeTab === tab.key ? '#4f46e5' : 'transparent',
                gap: 4,
              }}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={activeTab === tab.key ? '#fff' : '#64748b'}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  color: activeTab === tab.key ? '#fff' : '#64748b',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
        }
        contentContainerStyle={{ padding: 16 }}
      >
        {/* ====== 总览 Tab ====== */}
        {activeTab === 'overview' && (
          <>
            {/* 统计卡片 */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {[
                { label: '已投递', value: flowStats?.applied ?? 0, color: '#4f46e5', icon: 'paper-plane-outline' as const },
                { label: '进行中', value: flowStats?.pending ?? 0, color: '#f59e0b', icon: 'time-outline' as const },
                { label: '已通过', value: flowStats?.passed ?? 0, color: '#10b981', icon: 'checkmark-circle-outline' as const },
              ].map((stat) => (
                <Card key={stat.label} style={{ flex: 1, alignItems: 'center', padding: 14 }}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a', marginTop: 4 }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{stat.label}</Text>
                </Card>
              ))}
            </View>

            {/* 待办任务 */}
            {pendingTodos.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 10 }}>
                  待办任务
                </Text>
                {pendingTodos.slice(0, 3).map((todo: Todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    onPress={() => router.push('/(candidate)/ai')}
                    style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                      borderRadius: 12, padding: 14, marginBottom: 8, gap: 10,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="sparkles-outline" size={18} color="#4f46e5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>
                        {todo.title}
                      </Text>
                      {todo.progress > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <View style={{ flex: 1, height: 3, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: 3, width: `${todo.progress}%`, backgroundColor: '#4f46e5', borderRadius: 2 }} />
                          </View>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>{todo.progress}%</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 推荐职位 */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>推荐职位</Text>
                <TouchableOpacity onPress={() => setActiveTab('jobs')}>
                  <Text style={{ fontSize: 13, color: '#4f46e5' }}>查看全部</Text>
                </TouchableOpacity>
              </View>
              {(recommendedJobs as Job[]).length === 0 ? (
                <Card style={{ alignItems: 'center', padding: 30 }}>
                  <Ionicons name="briefcase-outline" size={32} color="#cbd5e1" />
                  <Text style={{ color: '#94a3b8', marginTop: 8 }}>暂无推荐</Text>
                </Card>
              ) : (
                (recommendedJobs as Job[]).slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onPress={() => router.push(`/(common)/job/${job.id}` as `/${string}`)}
                    showApplyButton
                  />
                ))
              )}
            </View>
          </>
        )}

        {/* ====== 职位 Tab ====== */}
        {activeTab === 'jobs' && (
          <>
            {/* 搜索栏 */}
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e2e8f0',
                marginBottom: 10,
              }}
            >
              <Ionicons name="search-outline" size={18} color="#94a3b8" />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15 }}
                placeholder="搜索职位、公司..."
                value={jobSearch}
                onChangeText={setJobSearch}
                onSubmitEditing={() => { setJobSearchQuery(jobSearch); }}
                returnKeyType="search"
              />
              {jobSearch ? (
                <TouchableOpacity onPress={() => { setJobSearch(''); setJobSearchQuery(''); }}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* 标签 */}
            {tagsData.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 6 }}
              >
                {[{ id: 0, name: '全部' }, ...tagsData].map((tag) => {
                  const active = selectedTag === (tag.id === 0 ? '' : tag.name);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => setSelectedTag(tag.id === 0 ? '' : tag.name)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
                        backgroundColor: active ? '#4f46e5' : '#fff', borderWidth: 1,
                        borderColor: active ? '#4f46e5' : '#e2e8f0',
                      }}
                    >
                      <Text style={{ fontSize: 13, color: active ? '#fff' : '#64748b', fontWeight: active ? '500' : '400' }}>
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* 职位列表 */}
            {(jobsData?.items || []).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 10 }}>
                  {jobSearchQuery ? '没有找到相关职位' : '暂无职位'}
                </Text>
              </View>
            ) : (
              ((jobsData?.items || []) as Job[]).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => router.push(`/(common)/job/${job.id}` as `/${string}`)}
                  showApplyButton
                />
              ))
            )}
          </>
        )}

        {/* ====== 投递 Tab ====== */}
        {activeTab === 'flows' && (
          <>
            {/* 状态概览 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: '全部', count: flowStats?.total ?? 0, color: '#334155' },
                { label: '已投递', count: flowStats?.applied ?? 0, color: '#4f46e5' },
                { label: '进行中', count: flowStats?.pending ?? 0, color: '#f59e0b' },
                { label: '已通过', count: flowStats?.passed ?? 0, color: '#10b981' },
                { label: '未通过', count: flowStats?.rejected ?? 0, color: '#ef4444' },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12,
                    paddingVertical: 8, borderWidth: 1, borderColor: '#e2e8f0',
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }} />
                  <Text style={{ fontSize: 12, color: '#334155' }}>{item.label}</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>{item.count}</Text>
                </View>
              ))}
            </View>

            {/* 流程列表 */}
            {(flows as Flow[]).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="git-branch-outline" size={48} color="#cbd5e1" />
                <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 10 }}>暂无投递记录</Text>
              </View>
            ) : (
              (flows as Flow[]).map((flow) => {
                const statusInfo = FLOW_STATUS_MAP[flow.status] || FLOW_STATUS_MAP.pending;
                return (
                  <TouchableOpacity
                    key={flow.id}
                    onPress={() => router.push(`/(common)/flow/${flow.id}` as `/${string}`)}
                    style={{
                      backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>
                          {flow.job_title || `职位 #${flow.job_id}`}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {flow.company || '未知公司'}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: statusInfo.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: statusInfo.color, fontWeight: '500' }}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    {flow.match_score > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                        <Ionicons name="analytics-outline" size={14} color="#4f46e5" />
                        <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '500' }}>匹配度 {flow.match_score}%</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
