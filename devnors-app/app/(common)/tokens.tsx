import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getTokenStats, getTokenHistory, getTokenPackages } from '../../services/tokens';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function TokensScreen() {
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ['tokenStats', user?.id],
    queryFn: () => getTokenStats(user?.id || 0),
    enabled: !!user?.id,
  });

  const { data: history } = useQuery({
    queryKey: ['tokenHistory', user?.id],
    queryFn: () => getTokenHistory(user?.id || 0, 20),
    enabled: !!user?.id,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['tokenPackages'],
    queryFn: getTokenPackages,
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16 }}>
        {/* 余额卡片 */}
        <Card
          variant="elevated"
          style={{
            marginBottom: 20,
            backgroundColor: '#4f46e5',
          }}
        >
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Token 余额</Text>
          <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff', marginTop: 4 }}>
            {stats?.balance_display || '0'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
            <View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>今日消耗</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                {stats?.today_usage_display || '0'}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>预计可用</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                {stats?.estimated_days || 0} 天
              </Text>
            </View>
          </View>
        </Card>

        {/* 充值套餐 */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
          充值套餐
        </Text>
        {(packages as Array<{ id: number; name: string; tokens: number; price: number; description?: string }>).map((pkg) => (
          <Card key={pkg.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="diamond-outline" size={20} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
                {pkg.name}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                {pkg.tokens.toLocaleString()} Token
              </Text>
            </View>
            <Button
              title={`¥${pkg.price}`}
              size="sm"
              variant="outline"
              onPress={() => {}}
            />
          </Card>
        ))}

        {/* 消耗历史 */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#0f172a',
            marginTop: 20,
            marginBottom: 12,
          }}
        >
          消耗记录
        </Text>
        {(history?.items || []).map((item: { id: number; action: string; tokens: number; description: string; created_at: string }, index: number) => (
          <View
            key={item.id || index}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#f1f5f9',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: '#334155' }}>
                {item.description || item.action}
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {new Date(item.created_at).toLocaleString('zh-CN')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: item.tokens > 0 ? '#10b981' : '#ef4444',
              }}
            >
              {item.tokens > 0 ? '+' : ''}{item.tokens}
            </Text>
          </View>
        ))}

        {(!history?.items || history.items.length === 0) && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#94a3b8' }}>暂无消耗记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
