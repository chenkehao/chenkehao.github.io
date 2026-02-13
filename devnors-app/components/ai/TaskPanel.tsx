/**
 * 任务面板组件 - 底部弹出 Sheet
 * 显示进行中和已完成的任务列表
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Todo } from '../../shared/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  todos: Todo[];
  selectedTodoId: number | null;
  onSelectTodo: (todo: Todo | null) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TODO_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  profile_complete: 'person-outline',
  personal_verification: 'shield-checkmark-outline',
  enterprise_verification: 'business-outline',
  RECRUIT: 'megaphone-outline',
  cloud_job_search: 'cloud-outline',
  disc_test: 'analytics-outline',
  job_preference: 'options-outline',
  enterprise_profile: 'create-outline',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待执行', color: '#f59e0b', bg: '#fef3c7' },
  running: { label: '进行中', color: '#3b82f6', bg: '#dbeafe' },
  in_progress: { label: '进行中', color: '#3b82f6', bg: '#dbeafe' },
  completed: { label: '已完成', color: '#10b981', bg: '#d1fae5' },
};

const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  high: { color: '#ef4444', bg: '#fef2f2' },
  medium: { color: '#f59e0b', bg: '#fef3c7' },
  low: { color: '#6b7280', bg: '#f3f4f6' },
};

export default function TaskPanel({
  visible,
  onClose,
  todos,
  selectedTodoId,
  onSelectTodo,
}: Props) {
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  const filteredTodos = todos.filter((t) => {
    const s = t.status?.toLowerCase();
    return filter === 'pending'
      ? s === 'pending' || s === 'running' || s === 'in_progress'
      : s === 'completed';
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* 背景遮罩 */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet 内容 */}
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: SCREEN_HEIGHT * 0.7,
            paddingBottom: 34,
          }}
        >
          {/* 把手 */}
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#e2e8f0',
              }}
            />
          </View>

          {/* 标题 */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
              任务列表
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* 筛选 Tab */}
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: 20,
              marginBottom: 12,
              backgroundColor: '#f1f5f9',
              borderRadius: 10,
              padding: 3,
            }}
          >
            {(['pending', 'completed'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: filter === f ? '#fff' : 'transparent',
                  alignItems: 'center',
                  ...(filter === f
                    ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : {}),
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: filter === f ? '600' : '400',
                    color: filter === f ? '#0f172a' : '#64748b',
                  }}
                >
                  {f === 'pending' ? '进行中' : '已完成'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 通用 AI 助手入口 */}
          <TouchableOpacity
            onPress={() => {
              onSelectTodo(null);
              onClose();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 20,
              marginBottom: 8,
              padding: 14,
              borderRadius: 12,
              backgroundColor: selectedTodoId === null ? '#eef2ff' : '#f8fafc',
              borderWidth: selectedTodoId === null ? 2 : 1,
              borderColor: selectedTodoId === null ? '#4f46e5' : '#e2e8f0',
              gap: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#4f46e5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
                通用 AI 助手
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                自由对话，随时提问
              </Text>
            </View>
            {selectedTodoId === null && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#4f46e5',
                }}
              />
            )}
          </TouchableOpacity>

          {/* 任务列表 */}
          <ScrollView style={{ paddingHorizontal: 20 }}>
            {filteredTodos.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="clipboard-outline" size={40} color="#cbd5e1" />
                <Text style={{ color: '#94a3b8', marginTop: 8, fontSize: 14 }}>
                  {filter === 'pending' ? '暂无进行中的任务' : '暂无已完成的任务'}
                </Text>
              </View>
            ) : (
              filteredTodos.map((todo) => {
                const isSelected = selectedTodoId === todo.id;
                const statusInfo = STATUS_LABELS[todo.status?.toLowerCase()] || STATUS_LABELS.pending;
                const priorityInfo = PRIORITY_COLORS[todo.priority?.toLowerCase()] || PRIORITY_COLORS.medium;
                const iconName = TODO_ICONS[todo.todo_type || ''] || 'document-outline';

                return (
                  <TouchableOpacity
                    key={todo.id}
                    onPress={() => {
                      onSelectTodo(todo);
                      onClose();
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 12,
                      marginBottom: 8,
                      backgroundColor: isSelected ? '#eef2ff' : '#fff',
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? '#4f46e5' : '#f1f5f9',
                      gap: 10,
                    }}
                  >
                    {/* 图标 */}
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: '#f1f5f9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={iconName} size={18} color="#64748b" />
                    </View>

                    {/* 内容 */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', flex: 1 }}
                          numberOfLines={1}
                        >
                          {todo.title}
                        </Text>
                      </View>

                      {/* 标签行 */}
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        <View
                          style={{
                            backgroundColor: statusInfo.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: statusInfo.color, fontWeight: '500' }}>
                            {statusInfo.label}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: priorityInfo.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{ fontSize: 10, color: priorityInfo.color, fontWeight: '500' }}
                          >
                            {todo.priority === 'high'
                              ? '高'
                              : todo.priority === 'medium'
                              ? '中'
                              : '低'}
                          </Text>
                        </View>
                        {todo.source === 'agent' && (
                          <View
                            style={{
                              backgroundColor: '#ede9fe',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: '#7c3aed', fontWeight: '500' }}>
                              Agent
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 进度条 */}
                      {todo.progress > 0 && todo.progress < 100 && (
                        <View
                          style={{
                            height: 3,
                            backgroundColor: '#e2e8f0',
                            borderRadius: 2,
                            marginTop: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              height: 3,
                              width: `${todo.progress}%`,
                              backgroundColor: '#4f46e5',
                              borderRadius: 2,
                            }}
                          />
                        </View>
                      )}
                    </View>

                    {/* 选中指示 */}
                    {isSelected && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#4f46e5',
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
