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
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';
import { getMyJobs } from '../../services/jobs';
import { getFlowStats, getPublicFlows } from '../../services/flows';
import { getTokenStats } from '../../services/tokens';
import { getTodos } from '../../services/todos';
import { getPublicTalentsPaged, getTalentSkills } from '../../services/candidates';
import TalentCard from '../../components/business/TalentCard';
import Card from '../../components/ui/Card';
import type { Todo, Flow } from '../../shared/types';

const FLOW_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  viewed: { label: '已查看', color: COLORS.info, bg: COLORS.infoBg },
  applied: { label: '已投递', color: COLORS.primary, bg: COLORS.primaryBg },
  screening: { label: '筛选中', color: COLORS.warning, bg: COLORS.warningBg },
  passed: { label: '已通过', color: COLORS.success, bg: COLORS.successBg },
  pending: { label: '进行中', color: COLORS.warning, bg: COLORS.warningBg },
  rejected: { label: '未通过', color: COLORS.danger, bg: COLORS.dangerBg },
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
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader
        title="工作台"
        rightActions={[
          { icon: 'notifications-outline', onPress: () => router.push('/(common)/notifications' as `/${string}`) },
          { icon: 'wallet-outline', onPress: () => router.push('/(common)/tokens' as `/${string}`) },
        ]}
      />

      {/* 页签切换 */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.light.bg, borderBottomWidth: 0.5, borderBottomColor: COLORS.light.borderLight }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
                paddingVertical: 8, borderRadius: 18,
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
                { label: '发布职位', value: jobs.length, color: COLORS.primary, icon: 'briefcase-outline' as const },
                { label: '候选人', value: flowStats?.total ?? 0, color: COLORS.info, icon: 'people-outline' as const },
                { label: '面试中', value: flowStats?.pending ?? 0, color: COLORS.warning, icon: 'time-outline' as const },
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
                  招聘任务
                </Text>
                {pendingTodos.slice(0, 3).map((todo: Todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    onPress={() => router.push('/(employer)/ai')}
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

            {/* 快捷操作 */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 10 }}>
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
                        width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primaryBg,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.light.textSecondary }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 最近流程 */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text }}>最近招聘</Text>
                <TouchableOpacity onPress={() => setActiveTab('flows')}>
                  <Text style={{ fontSize: 13, color: COLORS.primary }}>查看全部</Text>
                </TouchableOpacity>
              </View>
              {(flows as Flow[]).length === 0 ? (
                <Card style={{ alignItems: 'center', padding: 30 }}>
                  <Ionicons name="git-branch-outline" size={32} color={COLORS.light.disabled} />
                  <Text style={{ color: COLORS.light.placeholder, marginTop: 8 }}>暂无招聘流程</Text>
                </Card>
              ) : (
                (flows as Flow[]).slice(0, 3).map((flow) => {
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
                            {flow.candidate_name || `候选人 #${flow.candidate_id}`}
                          </Text>
                          <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 2 }}>
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
                flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light.card,
                borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.light.border,
                marginBottom: 10,
              }}
            >
              <Ionicons name="search-outline" size={18} color={COLORS.light.placeholder} />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: COLORS.light.text }}
                placeholder="搜索人才..."
                placeholderTextColor={COLORS.light.placeholder}
                value={talentSearch}
                onChangeText={setTalentSearch}
                onSubmitEditing={() => setTalentSearchQuery(talentSearch)}
                returnKeyType="search"
              />
              {talentSearch ? (
                <TouchableOpacity onPress={() => { setTalentSearch(''); setTalentSearchQuery(''); }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.light.placeholder} />
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
                        backgroundColor: active ? COLORS.primary : COLORS.light.card, borderWidth: 1,
                        borderColor: active ? COLORS.primary : COLORS.light.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: active ? '#fff' : COLORS.light.muted, fontWeight: active ? '500' : '400' }}>
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
                <Ionicons name="people-outline" size={48} color={COLORS.light.disabled} />
                <Text style={{ fontSize: 14, color: COLORS.light.placeholder, marginTop: 10 }}>暂无人才数据</Text>
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

            {(flows as Flow[]).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="git-branch-outline" size={48} color={COLORS.light.disabled} />
                <Text style={{ fontSize: 14, color: COLORS.light.placeholder, marginTop: 10 }}>暂无招聘流程</Text>
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
                          {flow.candidate_name || `候选人 #${flow.candidate_id}`}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 2 }}>
                          {flow.job_title || `职位 #${flow.job_id}`}
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
