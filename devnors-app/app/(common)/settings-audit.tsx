/**
 * 审计日志页 - 对齐 Web Audit Logs
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getAuditLogs, getAuditLogStats } from '../../services/settings';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

const CATEGORIES = [
  { id: 'all', label: '全部日志' },
  { id: 'auth', label: '认证安全' },
  { id: 'data', label: '数据变更' },
  { id: 'ai', label: 'AI 智能体' },
  { id: 'api', label: 'API 调用' },
  { id: 'system', label: '系统' },
];

const riskColors: Record<string, { dot: string; bg: string }> = {
  danger: { dot: COLORS.danger, bg: COLORS.dangerBg },
  warning: { dot: COLORS.warning, bg: COLORS.warningBg },
  info: { dot: COLORS.success, bg: COLORS.successBg },
};

export default function AuditLogsScreen() {
  const user = useAuthStore((s) => s.user);
  const [category, setCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['auditStats', user?.id],
    queryFn: () => getAuditLogStats(user?.id || 0),
    enabled: !!user?.id,
  });

  const { data: logs = [], refetch } = useQuery({
    queryKey: ['auditLogs', user?.id, category],
    queryFn: () => getAuditLogs(user?.id || 0, {
      limit: 50,
      category: category === 'all' ? undefined : category,
    }),
    enabled: !!user?.id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const typedStats = stats as { total?: number; auth?: number; data?: number; ai_api?: number } | undefined;
  const typedLogs = logs as Array<{
    id: number;
    action: string;
    category: string;
    risk_level: string;
    actor?: string;
    ip_address?: string;
    created_at: string;
  }>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="审计日志" showBack />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
      <View style={{ padding: 16 }}>
        {/* 统计卡片 */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { label: '总记录', value: typedStats?.total || 0, color: COLORS.primary },
            { label: '认证安全', value: typedStats?.auth || 0, color: COLORS.danger },
            { label: '数据变更', value: typedStats?.data || 0, color: COLORS.warning },
            { label: 'AI/API', value: typedStats?.ai_api || 0, color: COLORS.info },
          ].map((s, i) => (
            <Card key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: COLORS.light.muted, marginTop: 2 }}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* 分类筛选 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: category === cat.id ? COLORS.primary : COLORS.light.card,
                  borderWidth: 1,
                  borderColor: category === cat.id ? COLORS.primary : COLORS.light.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: category === cat.id ? '#fff' : COLORS.light.textSecondary }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* 日志列表 */}
        {typedLogs.length > 0 ? (
          typedLogs.map((log) => {
            const risk = riskColors[log.risk_level] || riskColors.info;
            const catLabel = CATEGORIES.find((c) => c.id === log.category)?.label || log.category;
            return (
              <Card key={log.id} style={{ marginBottom: 8, backgroundColor: risk.bg }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: risk.dot, marginTop: 5, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.light.text }}>{log.action}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <View style={{ backgroundColor: COLORS.primaryBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, color: COLORS.primary }}>{catLabel}</Text>
                      </View>
                      {log.actor && (
                        <Text style={{ fontSize: 11, color: COLORS.light.muted }}>BY {log.actor}</Text>
                      )}
                      {log.ip_address && (
                        <Text style={{ fontSize: 11, color: COLORS.light.placeholder }}>{log.ip_address}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.light.placeholder, marginTop: 4 }}>
                      {new Date(log.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.light.disabled} />
            <Text style={{ fontSize: 14, color: COLORS.light.muted, marginTop: 8 }}>暂无日志记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}
