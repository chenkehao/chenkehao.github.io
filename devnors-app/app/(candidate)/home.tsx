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
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { COLORS } from '../../constants/config';
import PageHeader from '../../components/ui/PageHeader';
import { getFlowStats, getPublicFlows } from '../../services/flows';
import { getTokenStats } from '../../services/tokens';
import { getTodos } from '../../services/todos';
import { getRecommendedJobs, getPublicJobs, getJobTags } from '../../services/jobs';
import JobCard from '../../components/business/JobCard';
import Card from '../../components/ui/Card';
import type { Todo, Flow, Job } from '../../shared/types';

const FLOW_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  viewed: { label: '已查看', color: COLORS.info, bg: COLORS.infoBg },
  applied: { label: '已投递', color: COLORS.primary, bg: COLORS.primaryBg },
  passed: { label: '已通过', color: COLORS.success, bg: COLORS.successBg },
  pending: { label: '进行中', color: COLORS.warning, bg: COLORS.warningBg },
  rejected: { label: '未通过', color: COLORS.danger, bg: COLORS.dangerBg },
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
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader
        title="工作台"
        rightActions={[
          { icon: 'notifications-outline', onPress: () => router.push('/(common)/notifications' as `/${string}`) },
          { icon: 'wallet-outline', onPress: () => router.push('/(common)/tokens' as `/${string}`) },
        ]}
      />
      {/* 页签切换 + Token 余额 */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.light.bg, borderBottomWidth: 0.5, borderBottomColor: COLORS.light.borderLight }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
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
                  backgroundColor: activeTab === tab.key ? COLORS.primary : 'transparent',
                  gap: 4,
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={activeTab === tab.key ? '#fff' : COLORS.light.muted}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: activeTab === tab.key ? '600' : '400',
                    color: activeTab === tab.key ? '#fff' : COLORS.light.muted,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(common)/tokens' as `/${string}`)}
            style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryBg,
              borderRadius: 10, paddingHorizontal: 10, height: 28, gap: 4,
            }}
          >
            <Ionicons name="wallet-outline" size={12} color={COLORS.primary} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.light.textSecondary }}>
              {tokenStats?.balance_display ?? '0'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={{ padding: 16 }}
      >
        {/* ====== 总览 Tab ====== */}
        {activeTab === 'overview' && (
          <>
            {/* 统计卡片 */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {[
                { label: '已投递', value: flowStats?.applied ?? 0, color: COLORS.primary, icon: 'paper-plane-outline' as const },
                { label: '进行中', value: flowStats?.pending ?? 0, color: COLORS.warning, icon: 'time-outline' as const },
                { label: '已通过', value: flowStats?.passed ?? 0, color: COLORS.success, icon: 'checkmark-circle-outline' as const },
              ].map((stat) => (
                <Card key={stat.label} style={{ flex: 1, alignItems: 'center', padding: 14 }}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                  <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.light.text, marginTop: 4 }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.light.muted, marginTop: 2 }}>{stat.label}</Text>
                </Card>
              ))}
            </View>

            {/* 待办任务 */}
            {pendingTodos.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 10 }}>
                  待办任务
                </Text>
                {pendingTodos.slice(0, 3).map((todo: Todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    onPress={() => router.push('/(candidate)/ai')}
                    style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light.card,
                      borderRadius: 12, padding: 14, marginBottom: 8, gap: 10,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryBg,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.light.text }} numberOfLines={1}>
                        {todo.title}
                      </Text>
                      {todo.progress > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <View style={{ flex: 1, height: 3, backgroundColor: COLORS.light.border, borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: 3, width: `${todo.progress}%`, backgroundColor: COLORS.primary, borderRadius: 2 }} />
                          </View>
                          <Text style={{ fontSize: 10, color: COLORS.light.muted }}>{todo.progress}%</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.light.placeholder} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 推荐职位 */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text }}>推荐职位</Text>
                <TouchableOpacity onPress={() => setActiveTab('jobs')}>
                  <Text style={{ fontSize: 13, color: COLORS.primary }}>查看全部</Text>
                </TouchableOpacity>
              </View>
              {(recommendedJobs as Job[]).length === 0 ? (
                <Card style={{ alignItems: 'center', padding: 30 }}>
                  <Ionicons name="briefcase-outline" size={32} color={COLORS.light.disabled} />
                  <Text style={{ color: COLORS.light.placeholder, marginTop: 8 }}>暂无推荐</Text>
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
                flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light.card,
                borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.light.border,
                marginBottom: 10,
              }}
            >
              <Ionicons name="search-outline" size={18} color={COLORS.light.placeholder} />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: COLORS.light.text }}
                placeholder="搜索职位、公司..."
                placeholderTextColor={COLORS.light.placeholder}
                value={jobSearch}
                onChangeText={setJobSearch}
                onSubmitEditing={() => { setJobSearchQuery(jobSearch); }}
                returnKeyType="search"
              />
              {jobSearch ? (
                <TouchableOpacity onPress={() => { setJobSearch(''); setJobSearchQuery(''); }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.light.placeholder} />
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
                        backgroundColor: active ? COLORS.primary : COLORS.light.card, borderWidth: 1,
                        borderColor: active ? COLORS.primary : COLORS.light.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: active ? '#fff' : COLORS.light.muted, fontWeight: active ? '500' : '400' }}>
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
                <Ionicons name="search-outline" size={48} color={COLORS.light.disabled} />
                <Text style={{ fontSize: 14, color: COLORS.light.placeholder, marginTop: 10 }}>
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
                { label: '全部', count: flowStats?.total ?? 0, color: COLORS.light.textSecondary },
                { label: '已投递', count: flowStats?.applied ?? 0, color: COLORS.primary },
                { label: '进行中', count: flowStats?.pending ?? 0, color: COLORS.warning },
                { label: '已通过', count: flowStats?.passed ?? 0, color: COLORS.success },
                { label: '未通过', count: flowStats?.rejected ?? 0, color: COLORS.danger },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    backgroundColor: COLORS.light.card, borderRadius: 10, paddingHorizontal: 12,
                    paddingVertical: 8, borderWidth: 1, borderColor: COLORS.light.border,
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }} />
                  <Text style={{ fontSize: 12, color: COLORS.light.textSecondary }}>{item.label}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.light.placeholder, fontWeight: '600' }}>{item.count}</Text>
                </View>
              ))}
            </View>

            {/* 流程列表 */}
            {(flows as Flow[]).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="git-branch-outline" size={48} color={COLORS.light.disabled} />
                <Text style={{ fontSize: 14, color: COLORS.light.placeholder, marginTop: 10 }}>暂无投递记录</Text>
              </View>
            ) : (
              (flows as Flow[]).map((flow) => {
                const statusInfo = FLOW_STATUS_MAP[flow.status] || FLOW_STATUS_MAP.pending;
                return (
                  <TouchableOpacity
                    key={flow.id}
                    onPress={() => router.push(`/(common)/flow/${flow.id}` as `/${string}`)}
                    style={{
                      backgroundColor: COLORS.light.card, borderRadius: 12, padding: 14, marginBottom: 8,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.light.text }} numberOfLines={1}>
                          {flow.job_title || `职位 #${flow.job_id}`}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 2 }}>
                          {flow.company || '未知公司'}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: statusInfo.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: statusInfo.color, fontWeight: '500' }}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    {flow.match_score > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                        <Ionicons name="analytics-outline" size={14} color={COLORS.primary} />
                        <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '500' }}>匹配度 {flow.match_score}%</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
