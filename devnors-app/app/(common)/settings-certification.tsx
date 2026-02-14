/**
 * 认证信息页 - 企业认证(招聘方) / 个人认证(求职者)
 */
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getEnterpriseCertifications, getPersonalCertifications } from '../../services/settings';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: '已认证', color: COLORS.success, bg: COLORS.successBg },
  pending: { label: '待审核', color: COLORS.warning, bg: COLORS.warningBg },
  expired: { label: '已过期', color: COLORS.danger, bg: COLORS.dangerBg },
  none: { label: '未认证', color: COLORS.light.muted, bg: COLORS.light.bgSecondary },
};

export default function CertificationScreen() {
  const user = useAuthStore((s) => s.user);
  const isEmployer = user?.role === 'recruiter' || user?.role === 'admin';

  const { data: enterpriseCerts = [] } = useQuery({
    queryKey: ['enterpriseCerts', user?.id],
    queryFn: () => getEnterpriseCertifications(user?.id || 0),
    enabled: !!user?.id && isEmployer,
  });

  const { data: personalCerts = [] } = useQuery({
    queryKey: ['personalCerts', user?.id],
    queryFn: () => getPersonalCertifications(user?.id || 0),
    enabled: !!user?.id && !isEmployer,
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="认证信息" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {isEmployer ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 16 }}>
              企业认证
            </Text>

            {/* 营业执照 */}
            <CertCard
              icon="document-text-outline"
              title="营业执照"
              status={(enterpriseCerts as Array<{ cert_type: string; status: string }>).find((c) => c.cert_type === 'business_license')?.status || 'none'}
              fields={[
                { label: '统一社会信用代码', value: '***' },
                { label: '有效期', value: '-' },
              ]}
            />

            {/* 法人身份证 */}
            <CertCard
              icon="card-outline"
              title="法人身份证"
              status={(enterpriseCerts as Array<{ cert_type: string; status: string }>).find((c) => c.cert_type === 'legal_person_id')?.status || 'none'}
              fields={[
                { label: '姓名', value: '***' },
                { label: '证件号', value: '***' },
              ]}
            />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.light.text, marginBottom: 16 }}>
              个人认证
            </Text>

            {[
              { icon: 'finger-print-outline' as const, title: '身份认证', type: 'identity', desc: '实名认证' },
              { icon: 'school-outline' as const, title: '学历认证', type: 'education', desc: '学位、院校认证' },
              { icon: 'ribbon-outline' as const, title: '技能认证', type: 'skill', desc: '驾照、职业证书' },
              { icon: 'briefcase-outline' as const, title: '工作证明', type: 'work', desc: '在职证明、工牌' },
              { icon: 'shield-checkmark-outline' as const, title: '征信认证', type: 'credit', desc: '公积金、社保' },
              { icon: 'trophy-outline' as const, title: '获奖认证', type: 'award', desc: '荣誉奖项' },
            ].map((item) => (
              <CertCard
                key={item.type}
                icon={item.icon}
                title={item.title}
                status={(personalCerts as Array<{ cert_type: string; status: string }>).find((c) => c.cert_type === item.type)?.status || 'none'}
                fields={[{ label: '说明', value: item.desc }]}
              />
            ))}
          </>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

function CertCard({ icon, title, status, fields }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  status: string;
  fields: { label: string; value: string }[];
}) {
  const s = statusMap[status] || statusMap.none;
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={18} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text }}>{title}</Text>
        </View>
        <View style={{ backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: s.color }}>{s.label}</Text>
        </View>
      </View>
      {fields.map((f, idx) => (
        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
          <Text style={{ fontSize: 13, color: COLORS.light.muted }}>{f.label}</Text>
          <Text style={{ fontSize: 13, color: COLORS.light.textSecondary }}>{f.value}</Text>
        </View>
      ))}
    </Card>
  );
}
