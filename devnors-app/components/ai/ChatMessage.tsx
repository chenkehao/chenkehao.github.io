/**
 * 聊天消息渲染组件 - 支持特殊消息类型
 * - 普通文本 + Markdown
 * - [[TASK:title:type:icon]] -> 任务卡片
 * - [[LINK:title:path:icon]] -> 导航链接卡片
 * - [[ACTION:label:message:style]] -> 操作按钮
 * - <think>...</think> -> 可折叠思考过程
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/config';
import type { ChatMessage as ChatMessageType } from '../../shared/types';

interface Props {
  message: ChatMessageType;
  onActionPress?: (actionMessage: string) => void;
  onTaskPress?: (taskType: string) => void;
}

// 解析特殊消息标记
function parseSpecialTokens(content: string) {
  const parts: Array<{
    type: 'text' | 'task' | 'link' | 'action' | 'think';
    content: string;
    meta?: Record<string, string>;
  }> = [];

  let remaining = content;

  // 处理 <think>...</think> 块
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  remaining = remaining.replace(thinkRegex, (_, thinkContent) => {
    parts.push({ type: 'think', content: thinkContent.trim() });
    return '___THINK_PLACEHOLDER___';
  });

  // 按行分割处理特殊标记
  const lines = remaining.split('\n');
  let textBuffer = '';

  for (const line of lines) {
    // [[TASK:title:type:icon]]
    const taskMatch = line.match(/\[\[TASK:([^:]+):([^:]+):([^\]]+)\]\]/);
    if (taskMatch) {
      if (textBuffer.trim()) {
        parts.push({ type: 'text', content: textBuffer.trim() });
        textBuffer = '';
      }
      parts.push({
        type: 'task',
        content: taskMatch[1],
        meta: { taskType: taskMatch[2], icon: taskMatch[3] },
      });
      continue;
    }

    // [[LINK:title:path:icon]]
    const linkMatch = line.match(/\[\[LINK:([^:]+):([^:]+):([^\]]+)\]\]/);
    if (linkMatch) {
      if (textBuffer.trim()) {
        parts.push({ type: 'text', content: textBuffer.trim() });
        textBuffer = '';
      }
      parts.push({
        type: 'link',
        content: linkMatch[1],
        meta: { path: linkMatch[2], icon: linkMatch[3] },
      });
      continue;
    }

    // [[ACTION:label:message:style]]
    const actionMatch = line.match(/\[\[ACTION:([^:]+):([^:]+):([^\]]+)\]\]/);
    if (actionMatch) {
      if (textBuffer.trim()) {
        parts.push({ type: 'text', content: textBuffer.trim() });
        textBuffer = '';
      }
      parts.push({
        type: 'action',
        content: actionMatch[1],
        meta: { message: actionMatch[2], style: actionMatch[3] },
      });
      continue;
    }

    if (line === '___THINK_PLACEHOLDER___') {
      if (textBuffer.trim()) {
        parts.push({ type: 'text', content: textBuffer.trim() });
        textBuffer = '';
      }
      // think was already added above
      continue;
    }

    textBuffer += line + '\n';
  }

  if (textBuffer.trim()) {
    parts.push({ type: 'text', content: textBuffer.trim() });
  }

  // If no special parts found, return all as text
  if (parts.length === 0) {
    return [{ type: 'text' as const, content }];
  }

  return parts;
}

/** 思考过程折叠组件 */
function ThinkBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 10,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color="#94a3b8"
        />
        <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
          AI 思考过程
        </Text>
      </View>
      {expanded && (
        <Text
          style={{
            fontSize: 12,
            color: '#64748b',
            marginTop: 8,
            lineHeight: 18,
          }}
        >
          {content}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/** 任务卡片组件 */
function TaskCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: string;
  taskType: string;
  onPress: () => void;
}) {
  const iconName = (
    {
      user: 'person-outline',
      building: 'business-outline',
      calendar: 'calendar-outline',
      search: 'search-outline',
      sparkles: 'sparkles-outline',
    } as Record<string, string>
  )[icon] || 'document-outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef2ff',
        borderRadius: 12,
        padding: 12,
        marginVertical: 4,
        gap: 10,
        borderWidth: 1,
        borderColor: '#c7d2fe',
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
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#312e81' }}>{title}</Text>
        <Text style={{ fontSize: 11, color: '#4f46e5', marginTop: 2 }}>点击开始</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#4f46e5" />
    </TouchableOpacity>
  );
}

/** 链接卡片组件 */
function LinkCard({ title, path, icon }: { title: string; path: string; icon: string }) {
  const router = useRouter();
  const iconName = (
    {
      briefcase: 'briefcase-outline',
      user: 'person-outline',
      building: 'business-outline',
      settings: 'settings-outline',
      wallet: 'wallet-outline',
    } as Record<string, string>
  )[icon] || 'link-outline';

  return (
    <TouchableOpacity
      onPress={() => router.push(path as `/${string}`)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 10,
        padding: 10,
        marginVertical: 3,
        gap: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0',
      }}
    >
      <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={16} color="#16a34a" />
      <Text style={{ fontSize: 13, color: '#15803d', flex: 1 }}>{title}</Text>
      <Ionicons name="open-outline" size={14} color="#16a34a" />
    </TouchableOpacity>
  );
}

/** 操作按钮组件 */
function ActionButton({
  label,
  actionStyle,
  onPress,
}: {
  label: string;
  actionStyle: string;
  onPress: () => void;
}) {
  const isPrimary = actionStyle === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isPrimary ? '#4f46e5' : '#fff',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        marginVertical: 3,
        borderWidth: isPrimary ? 0 : 1,
        borderColor: '#e2e8f0',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: isPrimary ? '#fff' : '#334155',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** 简单 Markdown 文本渲染 */
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        // 标题
        if (line.startsWith('### ')) {
          return (
            <Text
              key={i}
              style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 8, marginBottom: 4 }}
            >
              {line.slice(4)}
            </Text>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <Text
              key={i}
              style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 8, marginBottom: 4 }}
            >
              {line.slice(3)}
            </Text>
          );
        }

        // 列表项
        if (line.match(/^[-*] /)) {
          return (
            <View key={i} style={{ flexDirection: 'row', marginVertical: 2, paddingLeft: 4 }}>
              <Text style={{ color: '#4f46e5', fontSize: 14, marginRight: 6 }}>•</Text>
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 20, flex: 1 }}>
                {renderInlineMarkdown(line.slice(2))}
              </Text>
            </View>
          );
        }

        // 数字列表项
        if (line.match(/^\d+\. /)) {
          const match = line.match(/^(\d+)\. (.*)/)!;
          return (
            <View key={i} style={{ flexDirection: 'row', marginVertical: 2, paddingLeft: 4 }}>
              <Text style={{ color: '#4f46e5', fontSize: 14, marginRight: 6, fontWeight: '600' }}>
                {match[1]}.
              </Text>
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 20, flex: 1 }}>
                {renderInlineMarkdown(match[2])}
              </Text>
            </View>
          );
        }

        // 空行
        if (!line.trim()) {
          return <View key={i} style={{ height: 8 }} />;
        }

        // 普通文本
        return (
          <Text key={i} style={{ fontSize: 14, color: '#334155', lineHeight: 20 }}>
            {renderInlineMarkdown(line)}
          </Text>
        );
      })}
    </View>
  );
}

/** 内联 Markdown (加粗/代码) */
function renderInlineMarkdown(text: string) {
  // 简单处理 **bold** 和 `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text
          key={i}
          style={{
            backgroundColor: '#f1f5f9',
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#4f46e5',
            paddingHorizontal: 3,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }
    return part;
  });
}

export default function ChatMessage({ message, onActionPress, onTaskPress }: Props) {
  const isUser = message.role === 'user';
  const parsedParts = isUser ? null : parseSpecialTokens(message.content);

  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        marginBottom: 12,
      }}
    >
      {/* 角色标识 */}
      {!isUser && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={12} color="#fff" />
          </View>
          <Text style={{ fontSize: 12, color: COLORS.light.muted, fontWeight: '500' }}>Devnors AI</Text>
        </View>
      )}

      {/* 消息内容 */}
      <View
        style={{
          backgroundColor: isUser ? COLORS.primary : COLORS.light.bg,
          borderRadius: 16,
          borderTopRightRadius: isUser ? 4 : 16,
          borderTopLeftRadius: isUser ? 16 : 4,
          padding: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
          ...(isUser ? {} : { borderWidth: 1, borderColor: '#f1f5f9' }),
        }}
      >
        {isUser ? (
          <Text style={{ fontSize: 14, color: '#fff', lineHeight: 20 }}>{message.content}</Text>
        ) : (
          parsedParts!.map((part, idx) => {
            switch (part.type) {
              case 'think':
                return <ThinkBlock key={idx} content={part.content} />;
              case 'task':
                return (
                  <TaskCard
                    key={idx}
                    title={part.content}
                    taskType={part.meta?.taskType || ''}
                    icon={part.meta?.icon || 'sparkles'}
                    onPress={() => onTaskPress?.(part.meta?.taskType || '')}
                  />
                );
              case 'link':
                return (
                  <LinkCard
                    key={idx}
                    title={part.content}
                    path={part.meta?.path || '/'}
                    icon={part.meta?.icon || 'link'}
                  />
                );
              case 'action':
                return (
                  <ActionButton
                    key={idx}
                    label={part.content}
                    actionStyle={part.meta?.style || 'default'}
                    onPress={() => onActionPress?.(part.meta?.message || part.content)}
                  />
                );
              case 'text':
              default:
                return <SimpleMarkdown key={idx} content={part.content} />;
            }
          })
        )}
      </View>

      {/* 时间戳 */}
      <Text
        style={{
          fontSize: 10,
          color: '#94a3b8',
          marginTop: 4,
          textAlign: isUser ? 'right' : 'left',
        }}
      >
        {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}
