import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getInviteStats } from '../../services/invite';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

export default function InviteScreen() {
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ['inviteStats', user?.id],
    queryFn: () => getInviteStats(user?.id || 0),
    enabled: !!user?.id,
  });

  const inviteCode = stats?.invite_code || user?.invite_code || '---';
  const inviteLink = stats?.invite_link || `https://devnors.com/register?ref=${inviteCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我在使用 Devnors 得若 AI 招聘平台，注册使用我的邀请码 ${inviteCode} 可获得额外 Token 奖励！注册链接：${inviteLink}`,
        title: '邀请好友加入 Devnors',
      });
    } catch (_e) {
      // 用户取消分享
    }
  };

  const handleCopyCode = () => {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(inviteCode);
    }
    // iOS native会通过 Share API
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="邀请好友" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* 邀请码卡片 */}
        <Card
          variant="elevated"
          style={{
            marginBottom: 20,
            backgroundColor: COLORS.primary,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="gift-outline" size={40} color="rgba(255,255,255,0.9)" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 12 }}>
              邀请好友 赢取 Token
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' }}>
              每邀请一位好友注册，您和好友都将获得 Token 奖励
            </Text>

            {/* 邀请码 */}
            <TouchableOpacity
              onPress={handleCopyCode}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 4 }}>
                {inviteCode}
              </Text>
              <Ionicons name="copy-outline" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
              点击复制邀请码
            </Text>
          </View>

          {/* 分享按钮 */}
          <TouchableOpacity
            onPress={handleShare}
            style={{
              backgroundColor: '#fff',
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
              marginTop: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="share-social" size={18} color={COLORS.primary} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
              邀请好友
            </Text>
          </TouchableOpacity>
        </Card>

        {/* 统计数据 */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.primary }}>
              {stats?.invite_count || 0}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 4 }}>
              已邀请
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.success }}>
              {stats?.total_reward_tokens || 0}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.light.muted, marginTop: 4 }}>
              获得奖励
            </Text>
          </Card>
        </View>

        {/* 奖励规则 */}
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
            奖励规则
          </Text>
          {[
            { icon: 'person-add' as const, text: `每邀请1人注册，双方各得 ${stats?.rules?.per_invite_reward || 500} Token` },
            { icon: 'trophy' as const, text: `邀请满5人，额外奖励 ${stats?.rules?.milestone_5 || 1000} Token` },
            { icon: 'medal' as const, text: `邀请满10人，额外奖励 ${stats?.rules?.milestone_10 || 3000} Token` },
            { icon: 'diamond' as const, text: `邀请满20人，额外奖励 ${stats?.rules?.milestone_20 || 8000} Token` },
          ].map((rule, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 10,
                borderBottomWidth: idx < 3 ? 1 : 0,
                borderBottomColor: COLORS.light.borderLight,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: COLORS.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={rule.icon} size={16} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 13, color: COLORS.light.textSecondary, flex: 1 }}>
                {rule.text}
              </Text>
            </View>
          ))}
        </Card>

        {/* 邀请记录 */}
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>
            邀请记录
          </Text>
          {(stats?.records || []).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Ionicons name="people-outline" size={40} color={COLORS.light.disabled} />
              <Text style={{ fontSize: 14, color: COLORS.light.muted, marginTop: 8 }}>
                暂无邀请记录
              </Text>
            </View>
          ) : (
            (stats?.records || []).map((record, idx) => (
              <View
                key={record.id || idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: idx < (stats?.records?.length || 0) - 1 ? 1 : 0,
                  borderBottomColor: COLORS.light.borderLight,
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, color: COLORS.light.text }}>
                    {record.invitee_name}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.light.placeholder, marginTop: 2 }}>
                    {record.created_at
                      ? new Date(record.created_at).toLocaleDateString('zh-CN')
                      : '-'}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                  +{record.reward_tokens} Token
                </Text>
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
    </View>
  );
}
