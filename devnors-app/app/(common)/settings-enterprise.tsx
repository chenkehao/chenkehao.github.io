/**
 * 企业基础信息页 - 对齐 Web General Settings（招聘方专属）
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { getSettings, updateSettings } from '../../services/settings';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { COLORS } from '../../constants/config';

const INDUSTRIES = ['互联网/IT', '人工智能', '金融/投资', '教育培训', '医疗健康', '制造业', '其他'];
const COMPANY_SIZES = ['0-20人', '20-99人', '100-499人', '500-999人', '1000人以上'];
const FUNDING_STAGES = ['未融资', '天使轮', 'A轮', 'B轮', 'C轮及以上', '已上市', '不需要融资'];
const BENEFITS = ['五险一金', '年终奖', '带薪年假', '弹性工作', '餐补', '交通补贴', '员工培训', '节日福利'];

export default function EnterpriseInfoScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: () => getSettings(user?.id || 0),
    enabled: !!user?.id,
  });

  const [form, setForm] = useState({
    display_name: '',
    short_name: '',
    industry: '',
    company_size: '',
    funding_stage: '',
    detail_address: '',
    hr_name: '',
    contact_phone: '',
    description: '',
    benefits: [] as string[],
  });

  useEffect(() => {
    if (settings) {
      setForm({
        display_name: settings.display_name || user?.company_name || '',
        short_name: settings.short_name || '',
        industry: settings.industry || '',
        company_size: settings.company_size || '',
        funding_stage: settings.funding_stage || '',
        detail_address: settings.detail_address || '',
        hr_name: settings.hr_name || '',
        contact_phone: settings.contact_phone || '',
        description: settings.description || '',
        benefits: settings.benefits || [],
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => updateSettings(user?.id || 0, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      Alert.alert('成功', '企业信息已保存');
    },
    onError: (err: Error) => Alert.alert('失败', err.message),
  });

  const toggleBenefit = (b: string) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(b) ? prev.benefits.filter((x) => x !== b) : [...prev.benefits, b],
    }));
  };

  const SelectField = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.light.textSecondary, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: value === opt ? COLORS.primary : COLORS.light.bgSecondary,
              borderWidth: 1,
              borderColor: value === opt ? COLORS.primary : COLORS.light.border,
            }}
          >
            <Text style={{ fontSize: 13, color: value === opt ? '#fff' : COLORS.light.textSecondary }}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }}>
      <PageHeader title="企业信息" showBack />
      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Card style={{ marginBottom: 16 }}>
          <Input label="企业全称" placeholder="请输入企业全称" value={form.display_name} onChangeText={(v) => setForm({ ...form, display_name: v })} />
          <Input label="企业简称" placeholder="选填" value={form.short_name} onChangeText={(v) => setForm({ ...form, short_name: v })} />
          <SelectField label="所属行业" options={INDUSTRIES} value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
          <SelectField label="企业规模" options={COMPANY_SIZES} value={form.company_size} onChange={(v) => setForm({ ...form, company_size: v })} />
          <SelectField label="融资阶段" options={FUNDING_STAGES} value={form.funding_stage} onChange={(v) => setForm({ ...form, funding_stage: v })} />
          <Input label="公司地址" placeholder="详细地址" value={form.detail_address} onChangeText={(v) => setForm({ ...form, detail_address: v })} />
          <Input label="HR 姓名" placeholder="招聘联系人" value={form.hr_name} onChangeText={(v) => setForm({ ...form, hr_name: v })} />
          <Input label="联系电话" placeholder="手机或座机" value={form.contact_phone} onChangeText={(v) => setForm({ ...form, contact_phone: v })} keyboardType="phone-pad" />
          <Input label="企业简介" placeholder="简要介绍公司业务和文化（最多1000字）" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
        </Card>

        {/* 企业福利 */}
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.light.text, marginBottom: 12 }}>企业福利</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BENEFITS.map((b) => {
              const selected = form.benefits.includes(b);
              return (
                <TouchableOpacity
                  key={b}
                  onPress={() => toggleBenefit(b)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: selected ? COLORS.primaryBg : COLORS.light.bgSecondary,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.light.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {selected && <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />}
                  <Text style={{ fontSize: 13, color: selected ? COLORS.primary : COLORS.light.textSecondary }}>{b}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Button title="保存信息" onPress={() => mutation.mutate()} loading={mutation.isPending} size="lg" />
      </View>
    </ScrollView>
    </View>
  );
}
