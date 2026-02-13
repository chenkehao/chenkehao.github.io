/**
 * 上下文感知快捷操作组件
 * 根据当前任务类型和用户角色动态显示不同的快捷按钮
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import type { Todo } from '../../shared/types';

interface Props {
  currentTodo: Todo | null;
  userRole: 'candidate' | 'employer' | null;
  onAction: (message: string) => void;
}

interface QuickAction {
  label: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: 'primary' | 'default';
}

function getQuickActions(todo: Todo | null, role: 'candidate' | 'employer' | null): QuickAction[] {
  // 有具体任务时，根据任务类型返回
  if (todo) {
    const todoType = todo.todo_type || '';

    switch (todoType) {
      case 'profile_complete':
        return [
          { label: '开始填写简历', message: '帮我开始完善简历资料', icon: 'create-outline', style: 'primary' },
          { label: '上传简历', message: '我想上传简历让AI帮我解析', icon: 'cloud-upload-outline' },
          { label: '查看进度', message: '查看我的简历完善进度', icon: 'analytics-outline' },
        ];

      case 'personal_verification':
        return [
          { label: '开始认证', message: '开始个人认证流程', icon: 'shield-checkmark-outline', style: 'primary' },
          { label: '上传证件', message: '我要上传认证证件', icon: 'camera-outline' },
          { label: '跳过', message: '跳过当前认证项', icon: 'play-skip-forward-outline' },
        ];

      case 'enterprise_verification':
        return [
          { label: '开始认证', message: '开始企业认证流程', icon: 'business-outline', style: 'primary' },
          { label: '上传营业执照', message: '我要上传营业执照', icon: 'document-outline' },
          { label: '跳过', message: '跳过此认证步骤', icon: 'play-skip-forward-outline' },
        ];

      case 'RECRUIT':
        return [
          { label: '招前端', message: '我要招一个前端工程师', icon: 'code-slash-outline', style: 'primary' },
          { label: '招后端', message: '我要招一个后端工程师', icon: 'server-outline' },
          { label: '招产品经理', message: '我要招一个产品经理', icon: 'bulb-outline' },
          { label: '自定义需求', message: '我有特定的招聘需求，让我描述一下', icon: 'create-outline' },
        ];

      case 'cloud_job_search':
        return [
          { label: '查看投递进度', message: '查看我的云端投递进度', icon: 'analytics-outline', style: 'primary' },
          { label: '调整偏好', message: '我想调整求职偏好设置', icon: 'options-outline' },
          { label: '暂停轮巡', message: '暂停自动投递', icon: 'pause-outline' },
        ];

      case 'disc_test':
        return [
          { label: '开始测试', message: '开始DISC性格测试', icon: 'analytics-outline', style: 'primary' },
          { label: '了解DISC', message: '什么是DISC性格测试？', icon: 'help-circle-outline' },
        ];

      case 'job_preference':
        return [
          { label: '开始设置', message: '开始设置我的求职偏好', icon: 'options-outline', style: 'primary' },
          { label: '快速推荐', message: '直接根据我的简历推荐职位', icon: 'flash-outline' },
        ];

      case 'enterprise_profile':
        return [
          { label: '开始完善', message: '开始完善企业资料', icon: 'business-outline', style: 'primary' },
          { label: '查看进度', message: '查看企业资料完善进度', icon: 'analytics-outline' },
        ];

      default:
        // 通用任务快捷操作
        return [
          { label: '查看详情', message: `查看任务"${todo.title}"的详细信息`, icon: 'information-circle-outline' },
          { label: '获取帮助', message: `这个任务我需要帮助: ${todo.title}`, icon: 'help-circle-outline' },
        ];
    }
  }

  // 无任务时，根据角色返回通用快捷操作
  if (role === 'candidate') {
    return [
      { label: '优化简历', message: '帮我优化简历', icon: 'document-text-outline', style: 'primary' },
      { label: '推荐职位', message: '根据我的情况推荐合适的职位', icon: 'briefcase-outline' },
      { label: '模拟面试', message: '帮我做模拟面试练习', icon: 'mic-outline' },
      { label: '职场问答', message: '我有一个职场相关问题', icon: 'help-circle-outline' },
    ];
  }

  if (role === 'employer') {
    return [
      { label: '发布职位', message: '帮我发布一个新职位', icon: 'add-circle-outline', style: 'primary' },
      { label: '筛选人才', message: '帮我筛选匹配的候选人', icon: 'people-outline' },
      { label: '优化JD', message: '帮我优化职位描述', icon: 'create-outline' },
      { label: '面试问题', message: '帮我准备面试问题', icon: 'chatbubbles-outline' },
    ];
  }

  return [
    { label: '自我介绍', message: '你能做什么？', icon: 'sparkles-outline' },
    { label: '使用帮助', message: '如何使用Devnors平台？', icon: 'help-circle-outline' },
  ];
}

export default function QuickActions({ currentTodo, userRole, onAction }: Props) {
  const actions = getQuickActions(currentTodo, userRole);

  if (actions.length === 0) return null;

  return (
    <View style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
      >
        {actions.map((action, idx) => {
          const isPrimary = action.style === 'primary';
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onAction(action.message)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isPrimary ? COLORS.primary : COLORS.light.bg,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                gap: 5,
                borderWidth: isPrimary ? 0 : 1,
                borderColor: '#e2e8f0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              {action.icon && (
                <Ionicons
                  name={action.icon}
                  size={14}
                  color={isPrimary ? '#fff' : COLORS.primary}
                />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: isPrimary ? '#fff' : '#334155',
                }}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
