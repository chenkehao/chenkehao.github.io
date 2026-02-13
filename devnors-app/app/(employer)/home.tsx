/**
 * 招聘者工作台 - 整合人才库
 * 统计卡片 + 任务中心 + 人才库 + 招聘流程
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getMyJobs } from '../../services/jobs';
import { getFlowStats, getPublicFlows } from '../../services/flows';
import { getTokenStats } from '../../services/tokens';
import { getTodos } from '../../services/todos';
import { getPublicTalentsPaged, getTalentSkills } from '../../services/candidates';
import TalentCard from '../../components/business/TalentCard';
import Card from '../../components/ui/Card';
import type { Todo, Flow } from '../../shared/types';

const FLOW_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  viewed: { label: '已查看', color: '#3b82f6', bg: '#dbeafe' },
  applied: { label: '已投递', color: '#4f46e5', bg: '#eef2ff' },
  screening: { label: '筛选中', color: '#f59e0b', bg: '#fef3c7' },
  passed: { label: '已通过', color: '#10b981', bg: '#d1fae5' },
  pending: { label: '进行中', color: '#f59e0b', bg: '#fef3c7' },
  rejected: { label: '未通过', color: '#ef4444', bg: '#fef2f2' },
};

type TabKey = 'overview' | 'talent' | 'flows';

export default function EmployerWorkbenchScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [talentSearch, setTalentSearch] = useState('');
  const [talentSearchQuery, setTalentSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  const { data: jobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['myJobs', user?.id],
    queryFn: () => getMyJobs(user?.id || 0),
    enabled: !!user?.id,
  });

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

  // 人才库
  const { data: talentsData, refetch: refetchTalents } = useQuery({
    queryKey: ['talents', 1, talentSearchQuery, selectedSkill],
    queryFn: () =>
      getPublicTalentsPaged({
        page: 1,
        page_size: 20,
        search: talentSearchQuery || undefined,
        skill: selectedSkill || undefined,
      }),
    enabled: activeTab === 'talent',
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['talentSkills'],
    queryFn: getTalentSkills,
    enabled: activeTab === 'talent',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchJobs(), refetchStats(), refetchTokens(), refetchTodos(), refetchFlows()]);
    if (activeTab === 'talent') await refetchTalents();
    setRefreshing(false);
  }, [activeTab]);

  const pendingTodos = todos.filter((t: Todo) => {
    const s = t.status?.toLowerCase();
    return s === 'pending' || s === 'running' || s === 'in_progress';
  });

  const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'overview', label: '总览', icon: 'home-outline' },
    { key: 'talent', label: '人才库', icon: 'people-outline' },
    { key: 'flows', label: '招聘', icon: 'git-branch-outline' },
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
              {user?.company_name || user?.name || '招聘方'}
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
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
                paddingVertical: 8, borderRadius: 18,
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
                { label: '发布职位', value: jobs.length, color: '#4f46e5', icon: 'briefcase-outline' as const },
                { label: '候选人', value: flowStats?.total ?? 0, color: '#3b82f6', icon: 'people-outline' as const },
                { label: '面试中', value: flowStats?.pending ?? 0, color: '#f59e0b', icon: 'time-outline' as const },
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
                  招聘任务
                </Text>
                {pendingTodos.slice(0, 3).map((todo: Todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    onPress={() => router.push('/(employer)/ai')}
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

            {/* 快捷操作 */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 10 }}>
                快捷操作
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[
                  { label: 'AI发布职位', icon: 'add-circle-outline' as const, onPress: () => router.push('/(employer)/ai') },
                  { label: '浏览人才', icon: 'people-outline' as const, onPress: () => setActiveTab('talent') },
                  { label: '招聘流程', icon: 'git-branch-outline' as const, onPress: () => setActiveTab('flows') },
                  { label: '设置', icon: 'settings-outline' as const, onPress: () => router.push('/(common)/settings' as `/${string}`) },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.onPress}
                    style={{ flex: 1, alignItems: 'center', gap: 6 }}
                  >
                    <View
                      style={{
                        width: 48, height: 48, borderRadius: 14, backgroundColor: '#eef2ff',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={item.icon} size={22} color="#4f46e5" />
                    </View>
                    <Text style={{ fontSize: 11, color: '#334155' }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 最近流程 */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>最近招聘</Text>
                <TouchableOpacity onPress={() => setActiveTab('flows')}>
                  <Text style={{ fontSize: 13, color: '#4f46e5' }}>查看全部</Text>
                </TouchableOpacity>
              </View>
              {(flows as Flow[]).length === 0 ? (
                <Card style={{ alignItems: 'center', padding: 30 }}>
                  <Ionicons name="git-branch-outline" size={32} color="#cbd5e1" />
                  <Text style={{ color: '#94a3b8', marginTop: 8 }}>暂无招聘流程</Text>
                </Card>
              ) : (
                (flows as Flow[]).slice(0, 3).map((flow) => {
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
                            {flow.candidate_name || `候选人 #${flow.candidate_id}`}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {flow.job_title || `职位 #${flow.job_id}`}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: statusInfo.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, color: statusInfo.color, fontWeight: '500' }}>{statusInfo.label}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* ====== 人才库 Tab ====== */}
        {activeTab === 'talent' && (
          <>
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
                placeholder="搜索人才..."
                value={talentSearch}
                onChangeText={setTalentSearch}
                onSubmitEditing={() => setTalentSearchQuery(talentSearch)}
                returnKeyType="search"
              />
              {talentSearch ? (
                <TouchableOpacity onPress={() => { setTalentSearch(''); setTalentSearchQuery(''); }}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* 技能标签 */}
            {skills.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 6 }}
              >
                {['全部', ...skills].map((skill) => {
                  const active = selectedSkill === (skill === '全部' ? '' : skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      onPress={() => setSelectedSkill(skill === '全部' ? '' : skill)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
                        backgroundColor: active ? '#4f46e5' : '#fff', borderWidth: 1,
                        borderColor: active ? '#4f46e5' : '#e2e8f0',
                      }}
                    >
                      <Text style={{ fontSize: 13, color: active ? '#fff' : '#64748b', fontWeight: active ? '500' : '400' }}>
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* 人才列表 */}
            {(talentsData?.items || []).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 10 }}>暂无人才数据</Text>
              </View>
            ) : (
              (talentsData?.items || []).map((talent: { id: number; profile?: { name: string; role: string; skills: string[]; experienceYears: number; summary: string }; candidate_name?: string }) => (
                <TalentCard
                  key={talent.id}
                  talent={talent}
                  onPress={() => router.push(`/(common)/candidate/${talent.id}` as `/${string}`)}
                />
              ))
            )}
          </>
        )}

        {/* ====== 招聘流程 Tab ====== */}
        {activeTab === 'flows' && (
          <>
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

            {(flows as Flow[]).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="git-branch-outline" size={48} color="#cbd5e1" />
                <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 10 }}>暂无招聘流程</Text>
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
                          {flow.candidate_name || `候选人 #${flow.candidate_id}`}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {flow.job_title || `职位 #${flow.job_id}`}
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
