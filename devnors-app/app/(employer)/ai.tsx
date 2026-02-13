/**
 * 招聘者 AI 助手 Tab - 核心交互界面
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth';
import { chatWithAI, getChatMessages, saveChatMessage } from '../../services/ai';
import { getTodos } from '../../services/todos';
import { getMemories } from '../../services/memories';
import ChatMessageComponent from '../../components/ai/ChatMessage';
import TaskPanel from '../../components/ai/TaskPanel';
import QuickActions from '../../components/ai/QuickActions';
import ModelSelector from '../../components/ai/ModelSelector';
import { COLORS } from '../../constants/config';
import type { ChatMessage, Todo, Memory, AccountTier } from '../../shared/types';

export default function EmployerAIScreen() {
  const user = useAuthStore((s) => s.user);
  const userRole = useAuthStore((s) => s.userRole);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [currentModel, setCurrentModel] = useState('Devnors 1.0');
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { data: todos = [] } = useQuery({
    queryKey: ['todos', user?.id],
    queryFn: () => getTodos(user?.id || 0),
    enabled: !!user?.id,
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories', user?.id, 'employer'],
    queryFn: () => getMemories(user?.id || 0, 'employer'),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user?.account_tier) {
      const tier = user.account_tier.toUpperCase();
      if (tier === 'ULTRA') setCurrentModel('Devnors 1.0 Ultra');
      else if (tier === 'PRO') setCurrentModel('Devnors 1.0 Pro');
      else setCurrentModel('Devnors 1.0');
    }
  }, [user?.account_tier]);

  useEffect(() => {
    if (!user?.id) return;
    const todoId = selectedTodo?.id;
    setMessagesLoaded(false);
    getChatMessages(user.id, todoId ?? undefined)
      .then((history) => {
        if (history?.length) {
          setMessages(history.map((msg) => ({
            id: String(msg.id), role: msg.role as 'user' | 'assistant',
            content: msg.content, timestamp: msg.created_at, todoId: todoId ?? null,
          })));
        } else { setMessages([getWelcomeMessage()]); }
        setMessagesLoaded(true);
      })
      .catch(() => { setMessages([getWelcomeMessage()]); setMessagesLoaded(true); });
  }, [user?.id, selectedTodo?.id]);

  const getWelcomeMessage = useCallback((): ChatMessage => {
    if (selectedTodo) {
      return {
        id: 'welcome', role: 'assistant',
        content: `好的，让我们来处理任务「${selectedTodo.title}」。\n\n${selectedTodo.ai_advice || '请告诉我你需要什么帮助？'}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      id: 'welcome', role: 'assistant',
      content: `你好${user?.company_name ? ' ' + user.company_name : user?.name ? ' ' + user.name : ''}！我是 Devnors AI 招聘助手。\n\n我可以帮你：\n- **发布职位** 只需描述需求，AI 生成专业 JD\n- **智能筛选** 自动匹配和评估候选人\n- **人才邀请** AI 精准邀请目标人才\n- **面试问题** 根据职位定制面试题\n- 管理 **企业资料** 和认证\n\n点击右上角任务列表，查看进行中的招聘任务。`,
      timestamp: new Date().toISOString(),
    };
  }, [selectedTodo, user?.name, user?.company_name]);

  const buildMemoryContext = useCallback(() => {
    if (!memories.length) return '';
    const ctx = memories
      .filter((m: Memory) => m.importance === 'high' || m.type === 'requirement' || m.type === 'culture')
      .slice(0, 10).map((m: Memory) => `[${m.type}] ${m.content}`).join('\n');
    return ctx ? `\n\n企业记忆信息:\n${ctx}` : '';
  }, [memories]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`, role: 'user', content,
      timestamp: new Date().toISOString(), todoId: selectedTodo?.id ?? null,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const history = messages.filter((m) => m.id !== 'welcome').slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      let context = `用户角色: 招聘方/企业方`;
      if (user?.company_name) context += `\n企业名称: ${user.company_name}`;
      if (selectedTodo) {
        context += `\n当前任务: ${selectedTodo.title} (类型: ${selectedTodo.todo_type || '通用'}, 进度: ${selectedTodo.progress}%)`;
        if (selectedTodo.description) context += `\n任务描述: ${selectedTodo.description}`;
      }
      context += buildMemoryContext();
      const response = await chatWithAI({ message: content, history, model: currentModel, context, user_id: user?.id });
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`, role: 'assistant', content: response.response,
        timestamp: new Date().toISOString(), todoId: selectedTodo?.id ?? null,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (user?.id) {
        saveChatMessage({ role: 'user', content, todo_id: selectedTodo?.id ?? null }, user.id);
        saveChatMessage({ role: 'assistant', content: response.response, todo_id: selectedTodo?.id ?? null }, user.id);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'AI 回复失败';
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: `抱歉，发生了错误: ${errMsg}`, timestamp: new Date().toISOString() }]);
    } finally { setIsLoading(false); }
  };

  const activeTodoCount = todos.filter((t: Todo) => {
    const s = t.status?.toLowerCase();
    return s === 'pending' || s === 'running' || s === 'in_progress';
  }).length;

  useEffect(() => {
    if (messagesLoaded && messages.length > 0) {
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    }
  }, [messages.length, messagesLoaded]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.light.bg, borderBottomWidth: 1, borderBottomColor: COLORS.light.borderLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.light.text }} numberOfLines={1}>
              {selectedTodo ? selectedTodo.title : 'Devnors AI'}
            </Text>
            {selectedTodo && <Text style={{ fontSize: 11, color: COLORS.light.muted, marginTop: 1 }}>进度 {selectedTodo.progress}%</Text>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ModelSelector currentModel={currentModel} accountTier={(user?.account_tier?.toUpperCase() || 'FREE') as AccountTier} onSelect={setCurrentModel} />
          <TouchableOpacity onPress={() => setShowTaskPanel(true)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.light.bgSecondary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="list-outline" size={18} color={COLORS.light.textSecondary} />
            {activeTodoCount > 0 && (
              <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>{activeTodoCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {selectedTodo && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryBg, paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder }}>
          <Ionicons name="flag" size={12} color={COLORS.primary} />
          <Text style={{ fontSize: 12, color: COLORS.primary, flex: 1 }} numberOfLines={1}>{selectedTodo.title}</Text>
          <TouchableOpacity onPress={() => setSelectedTodo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={COLORS.primaryLight} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessageComponent message={item} onActionPress={(msg) => sendMessage(msg)}
              onTaskPress={(taskType) => { const t = todos.find((t: Todo) => t.todo_type === taskType); if (t) setSelectedTodo(t); }} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {isLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles" size={12} color="#fff" />
            </View>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={{ fontSize: 12, color: COLORS.light.placeholder }}>AI 正在思考...</Text>
          </View>
        )}

        <QuickActions currentTodo={selectedTodo} userRole={userRole} onAction={(msg) => sendMessage(msg)} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: COLORS.light.bg, borderTopWidth: 1, borderTopColor: COLORS.light.borderLight, gap: 8 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: COLORS.light.bgSecondary, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: COLORS.light.text, borderWidth: 1, borderColor: COLORS.light.border }}
            placeholder={selectedTodo ? `关于「${selectedTodo.title}」...` : '输入消息...'}
            placeholderTextColor={COLORS.light.placeholder}
            value={input} onChangeText={setInput} multiline
            returnKeyType="send" onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim() || isLoading}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: input.trim() ? COLORS.primary : COLORS.light.disabled, alignItems: 'center', justifyContent: 'center', shadowColor: input.trim() ? COLORS.primary : 'transparent', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }}>
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <TaskPanel visible={showTaskPanel} onClose={() => setShowTaskPanel(false)} todos={todos} selectedTodoId={selectedTodo?.id ?? null} onSelectTodo={setSelectedTodo} />
    </SafeAreaView>
  );
}
