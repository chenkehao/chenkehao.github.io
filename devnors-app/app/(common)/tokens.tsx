import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getTokenStats, getTokenHistory, getTokenPackages } from '../../services/tokens';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

export default function TokensScreen() {
  const user = useAuthStore((s) => s.user);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);

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
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="Token 余额" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* 余额卡片 */}
        <Card
          variant="elevated"
          style={{
            marginBottom: 20,
            backgroundColor: COLORS.primary,
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
        <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
          充值套餐
        </Text>
        {(Array.isArray(packages) ? packages as Array<{ id: number; name: string; tokens: number; price: number; description?: string }> : []).map((pkg) => (
          <Card key={pkg.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: COLORS.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="diamond-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text }}>
                {pkg.name}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.light.muted }}>
                {pkg.tokens.toLocaleString()} Token
              </Text>
            </View>
            <Button
              title={purchasingId === pkg.id ? '处理中...' : `¥${pkg.price}`}
              size="sm"
              variant="outline"
              loading={purchasingId === pkg.id}
              onPress={() => {
                Alert.alert(
                  '确认购买',
                  `确定购买「${pkg.name}」套餐吗？\n\n${pkg.tokens.toLocaleString()} Token · ¥${pkg.price}`,
                  [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '确认购买',
                      onPress: async () => {
                        setPurchasingId(pkg.id);
                        setTimeout(() => {
                          setPurchasingId(null);
                          Alert.alert('购买成功', `已成功购买 ${pkg.tokens.toLocaleString()} Token`);
                        }, 1500);
                      },
                    },
                  ]
                );
              }}
            />
          </Card>
        ))}

        {/* 消耗历史 */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.light.text,
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
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.light.borderLight,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: COLORS.light.textSecondary }}>
                {item.description || item.action}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.light.placeholder, marginTop: 2 }}>
                {new Date(item.created_at).toLocaleString('zh-CN')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: item.tokens > 0 ? COLORS.success : COLORS.danger,
              }}
            >
              {item.tokens > 0 ? '+' : ''}{item.tokens}
            </Text>
          </View>
        ))}

        {(!history?.items || history.items.length === 0) && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: COLORS.light.placeholder }}>暂无消耗记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}
