import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FadeInDown, FadeIn, FadeInRight, FadeInLeft } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';
import { streamChat, streamPlan, type ChatMessage } from '@/lib/ai';

// AI 回答用 Markdown 渲染（标题 / 列表 / 加粗 / 引用 / 表格 / 代码）。岭南绿配色，
// 聊天气泡与行程结果共用一套样式。
const MD_STYLES = StyleSheet.create({
  body: { color: '#222', fontSize: 15, lineHeight: 24 },
  heading1: { fontSize: 19, fontWeight: '800', color: '#111', marginTop: 8, marginBottom: 4 },
  heading2: { fontSize: 17, fontWeight: '800', color: '#111', marginTop: 8, marginBottom: 4 },
  heading3: { fontSize: 15.5, fontWeight: '700', color: '#2D6A4F', marginTop: 8, marginBottom: 2 },
  strong: { fontWeight: '700', color: '#111' },
  em: { fontStyle: 'italic' },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  list_item: { marginVertical: 1, flexDirection: 'row' },
  blockquote: {
    backgroundColor: '#F3FAF5',
    borderLeftColor: '#2D6A4F',
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginVertical: 6,
  },
  code_inline: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fence: { backgroundColor: '#F6F6F6', borderRadius: 8, padding: 10, borderWidth: 0 },
  code_block: { backgroundColor: '#F6F6F6', borderRadius: 8, padding: 10, borderWidth: 0 },
  link: { color: '#2D6A4F', textDecorationLine: 'underline' },
  table: { borderColor: '#E8E8E8', borderWidth: 1, borderRadius: 10, marginVertical: 6 },
  th: { padding: 7, fontWeight: '700' },
  td: { padding: 7 },
  hr: { backgroundColor: '#EFEFEF', height: 1, marginVertical: 8 },
});

// ── Types ──────────────────────────────────────────────────
type Mode = 'planner' | 'chat';
interface Message { role: 'user' | 'assistant'; text: string; }

// ── Constants ──────────────────────────────────────────────
const WELCOME_MSG: Message = {
  role: 'assistant',
  text: '你好！我是文脉粤游的智能旅行助手。\n\n我可以帮你规划岭南地区的旅行行程，介绍非遗文化和美食，推荐景点和路线。\n\n💡 试试切换到「行程规划」模式，输入出发地和目的地，我就能为你生成一份完整的旅行计划。',
};

const SUGGESTIONS = [
  { text: '推荐一个广州三日游行程', icon: 'compass-outline' },
  { text: '广东有什么非遗文化？', icon: 'library-outline' },
  { text: '潮汕地区有什么好吃的？', icon: 'restaurant-outline' },
  { text: '开平碉楼在哪里？怎么去？', icon: 'home-outline' },
  { text: '佛山醒狮表演在哪里看？', icon: 'paw-outline' },
  { text: '广东有哪些世界文化遗产？', icon: 'globe-outline' },
];

const PREFERENCES = [
  { key: 'nature', label: '自然风光', icon: 'leaf-outline' },
  { key: 'culture', label: '历史文化', icon: 'library-outline' },
  { key: 'food', label: '美食之旅', icon: 'restaurant-outline' },
  { key: 'heritage', label: '非遗体验', icon: 'color-palette-outline' },
  { key: 'family', label: '亲子游玩', icon: 'people-outline' },
  { key: 'photo', label: '摄影打卡', icon: 'camera-outline' },
];

// ── Chat Bubble ────────────────────────────────────────────
function ChatBubble({ msg, index }: { msg: Message; index: number }) {
  const isUser = msg.role === 'user';
  return (
    <Animated.View
      entering={isUser ? FadeInRight.delay(60).springify() : FadeInLeft.delay(60).springify()}
      className={`mb-4 ${isUser ? 'ml-10' : 'mr-10'}`}>
      {!isUser && (
        <View className="mb-1.5 ml-1 flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9]">
            <Ionicons name="sparkles" size={13} color="#2D6A4F" />
          </View>
          <Text className="text-[12px] font-medium text-[#999]">TripGo AI</Text>
        </View>
      )}
      <View
        className={`rounded-[20px] px-4 py-3 ${
          isUser
            ? 'rounded-tr-md bg-[#2D6A4F]'
            : 'rounded-tl-md border border-[#EBEBEB] bg-white'
        }`}
        style={!isUser ? { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : {}}>
        {isUser ? (
          <Text className="text-[15px] leading-6 text-white">{msg.text}</Text>
        ) : (
          // 助手回复按 Markdown 渲染；流式过程中文本可能是半截 markdown，渲染器能容错。
          <Markdown style={MD_STYLES}>{msg.text}</Markdown>
        )}
      </View>
    </Animated.View>
  );
}

// ── Welcome State ──────────────────────────────────────────
function WelcomeState({ onTap }: { onTap: (q: string) => void }) {
  return (
    <Animated.View entering={FadeIn.delay(200).springify()} className="px-2 pt-4">
      <Text className="mb-4 text-center text-[13px] font-medium text-[#bbb]">
        你可以问我关于广东旅游的任何问题
      </Text>
      <View className="flex-row flex-wrap justify-center gap-2.5">
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s.text}
            onPress={() => onTap(s.text)}
            className="flex-row items-center rounded-full border border-[#EBEBEB] bg-white px-4 py-2.5 active:bg-[#F9F9F9]"
            style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
            <Ionicons name={s.icon as any} size={15} color="#2D6A4F" />
            <Text className="ml-2 text-[13px] text-[#444]">{s.text}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Planner Form ───────────────────────────────────────────
function PlannerForm({
  from, setFrom, to, setTo, budget, setBudget, days, setDays,
  tags, setTags, notes, setNotes, loading, onSubmit,
}: {
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  budget: number; setBudget: (v: number) => void;
  days: number; setDays: (v: number) => void;
  tags: string[]; setTags: (v: string[] | ((p: string[]) => string[])) => void;
  notes: string; setNotes: (v: string) => void;
  loading: boolean; onSubmit: () => void;
}) {
  const canSubmit = from.trim().length > 0 && to.trim().length > 0;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} className="mx-4 mt-4 overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white p-5"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
      {/* From / To */}
      <View className="flex-row gap-3">
        {[['出发地', 'location-outline', '广州', from, setFrom] as const, ['目的地', 'flag-outline', '潮州', to, setTo] as const].map(([label, icon, ph, val, setter]) => (
          <View key={label} className="flex-1">
            <Text className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">{label}</Text>
            <View className="flex-row items-center rounded-xl bg-[#F8F8F8] px-3.5 py-3.5">
              <Ionicons name={icon} size={17} color="#bbb" />
              <TextInput value={val} onChangeText={setter} placeholder={ph} placeholderTextColor="#ccc"
                className="ml-2 flex-1 text-[16px] font-medium text-[#111]" />
            </View>
          </View>
        ))}
      </View>

      {/* Budget */}
      <View className="mt-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">预算 / 人</Text>
          <Text className="text-[20px] font-extrabold text-[#2D6A4F]">¥{budget.toLocaleString()}</Text>
        </View>
        <View className="mt-2.5 flex-row gap-2">
          {[500, 1000, 2000, 3000, 5000].map(v => (
            <Pressable key={v} onPress={() => setBudget(v)}
              className={`flex-1 rounded-xl py-2.5 ${budget === v ? 'bg-[#2D6A4F]' : 'bg-[#F8F8F8]'}`}>
              <Text className={`text-center text-[13px] font-semibold ${budget === v ? 'text-white' : 'text-[#888]'}`}>
                ¥{v >= 1000 ? `${v / 1000}k` : v}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Days */}
      <View className="mt-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">天数</Text>
          <Text className="text-[20px] font-extrabold text-[#2D6A4F]">{days} 天</Text>
        </View>
        <View className="mt-2.5 flex-row gap-2">
          {[1, 2, 3, 4, 5, 7].map(d => (
            <Pressable key={d} onPress={() => setDays(d)}
              className={`flex-1 rounded-xl py-2.5 ${days === d ? 'bg-[#2D6A4F]' : 'bg-[#F8F8F8]'}`}>
              <Text className={`text-center text-[14px] font-semibold ${days === d ? 'text-white' : 'text-[#888]'}`}>{d}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Preferences */}
      <View className="mt-5">
        <Text className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-[#aaa]">偏好</Text>
        <View className="flex-row flex-wrap gap-2">
          {PREFERENCES.map(p => {
            const active = tags.includes(p.key);
            return (
              <Pressable key={p.key}
                onPress={() => setTags(prev => prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key])}
                className={`flex-row items-center rounded-full px-3.5 py-2 ${active ? 'bg-[#2D6A4F]' : 'border border-[#EBEBEB] bg-white'}`}>
                <Ionicons name={p.icon as any} size={13} color={active ? '#fff' : '#999'} />
                <Text className={`ml-1.5 text-[12px] font-medium ${active ? 'text-white' : 'text-[#666]'}`}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View className="mt-4">
        <TextInput value={notes} onChangeText={setNotes}
          placeholder="补充说明：民宿偏好、特殊需求…"
          placeholderTextColor="#ccc" multiline
          className="rounded-xl bg-[#F8F8F8] p-3.5 text-[14px] text-[#444]"
          style={{ minHeight: 52, textAlignVertical: 'top' }} />
      </View>

      {/* Submit */}
      <Pressable onPress={onSubmit} disabled={!canSubmit || loading} className="mt-5">
        <LinearGradient
          colors={canSubmit && !loading ? ['#2D6A4F', '#40916C', '#52B788'] : ['#ccc', '#bbb']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          className="flex-row items-center justify-center rounded-2xl py-4">
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-[16px] font-bold text-white">正在生成行程…</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
              <Text className="text-[16px] font-bold text-white">生成行程</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Plan Result ────────────────────────────────────────────
function PlanResult({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} className="mx-4 mt-4 rounded-2xl border border-[#EBEBEB] bg-white p-5"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold text-[#111]">你的专属行程</Text>
        <View className="rounded-full bg-[#E8F5E9] px-3 py-1">
          <Text className="text-[11px] font-semibold text-[#2D6A4F]">AI 生成</Text>
        </View>
      </View>
      <View className="h-px bg-[#F0F0F0] mb-4" />
      {/* 行程为 Markdown（概览引用 / 分天标题 / 预算表格 / 贴士列表），统一交给渲染器 */}
      <Markdown style={MD_STYLES}>{text}</Markdown>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────
export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('chat');

  // Chat
  const [msgs, setMsgs] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<ScrollView>(null);
  const chatCancel = useRef<(() => void) | null>(null);

  // Planner
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [budget, setBudget] = useState(2000);
  const [days, setDays] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState('');
  const planCancel = useRef<(() => void) | null>(null);

  // 卸载时中断进行中的流，避免泄漏
  useEffect(
    () => () => {
      chatCancel.current?.();
      planCancel.current?.();
    },
    [],
  );

  // AI 对话：调用后端 SSE 接口（DeepSeek 代理），逐 token 流式填充助手气泡。
  function send(q?: string) {
    const text = (q ?? input).trim();
    if (!text || chatLoading) return;

    // 发给后端的完整历史（去掉首条欢迎语占位）+ 本轮用户消息
    const history: ChatMessage[] = msgs
      .filter((m, i) => !(i === 0 && m.text === WELCOME_MSG.text))
      .map((m) => ({ role: m.role, content: m.text }));
    history.push({ role: 'user', content: text });

    // UI：追加用户气泡 + 一个空助手气泡用于流式填充
    setMsgs((m) => [...m, { role: 'user', text }, { role: 'assistant', text: '' }]);
    setInput('');
    setChatLoading(true);

    chatCancel.current = streamChat(history, {
      onToken: (delta) =>
        setMsgs((cur) => {
          const copy = cur.slice();
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, text: last.text + delta };
          return copy;
        }),
      onDone: () => {
        setChatLoading(false);
        setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 60);
      },
      onError: (msg) => {
        setMsgs((cur) => {
          const copy = cur.slice();
          copy[copy.length - 1] = { role: 'assistant', text: `⚠️ ${msg}` };
          return copy;
        });
        setChatLoading(false);
      },
    });
  }

  // AI 行程规划：调用后端 SSE 接口，流式累积 Markdown 行程。
  function doPlan() {
    if (!from.trim() || !to.trim() || planLoading) return;
    setPlanLoading(true);
    setPlanResult('');
    const tagLabels = PREFERENCES.filter((p) => tags.includes(p.key)).map((p) => p.label);

    planCancel.current = streamPlan(
      {
        from: from.trim(),
        to: to.trim(),
        budget,
        days,
        tags: tagLabels,
        notes: notes.trim() || undefined,
      },
      {
        onToken: (delta) => setPlanResult((prev) => prev + delta),
        onDone: () => setPlanLoading(false),
        onError: (msg) => {
          setPlanResult(`⚠️ ${msg}`);
          setPlanLoading(false);
        },
      },
    );
  }

  const isWelcome = msgs.length === 1 && msgs[0].role === 'assistant' && msgs[0].text === WELCOME_MSG.text;

  return (
    <View className="flex-1 bg-white">
      {/* ── Header ────────────────────────────────────────── */}
      <View className="bg-[#1B4332]">
        <ScreenHeader title="智能助手" tint="dark" />

        <View className="mx-4 mb-4 flex-row rounded-xl bg-white/10 p-1">
          {(['chat', 'planner'] as Mode[]).map(m => {
            const active = mode === m;
            const isChat = m === 'chat';
            return (
              <Pressable key={m} onPress={() => setMode(m)}
                className={`flex-1 flex-row items-center justify-center rounded-lg py-2.5 ${active ? 'bg-white shadow-sm' : ''}`}>
                <Ionicons name={isChat ? 'chatbubble-ellipses-outline' : 'compass-outline'} size={17}
                  color={active ? '#1B4332' : 'rgba(255,255,255,0.8)'} />
                <Text className={`ml-2 text-[14px] font-semibold ${active ? 'text-[#1B4332]' : 'text-white/80'}`}>
                  {isChat ? 'AI 对话' : '行程规划'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Chat Mode ─────────────────────────────────────── */}
      {mode === 'chat' && (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={-insets.bottom}>
          <ScrollView ref={chatRef} className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 8, paddingTop: 8 }}
            onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {msgs.map((m, i) => (
              <ChatBubble key={i} msg={m} index={i} />
            ))}
            {chatLoading && (
              <View className="mb-4 mr-10 flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#E8F5E9]">
                  <Ionicons name="sparkles" size={13} color="#2D6A4F" />
                </View>
                <View className="rounded-[20px] rounded-tl-md border border-[#EBEBEB] bg-white px-5 py-3">
                  <ActivityIndicator size="small" color="#2D6A4F" />
                </View>
              </View>
            )}
            {isWelcome && <WelcomeState onTap={send} />}
          </ScrollView>

          {/* Input */}
          <View className="flex-row items-center gap-2 border-t border-[#F0F0F0] bg-white px-3 pt-2.5" style={{ paddingBottom: insets.bottom + 10 }}>
            <TextInput value={input} onChangeText={setInput} onSubmitEditing={() => send()} placeholder="输入问题…" placeholderTextColor="#ccc"
              className="flex-1 rounded-2xl bg-[#F5F5F5] px-4 py-3 text-[15px]" returnKeyType="send" />
            <Pressable onPress={() => send()} disabled={!input.trim() || chatLoading}
              className={`h-11 w-11 items-center justify-center rounded-full ${input.trim() && !chatLoading ? 'bg-[#2D6A4F]' : 'bg-[#E8E8E8]'}`}
              style={input.trim() && !chatLoading ? { shadowColor: '#2D6A4F', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } : {}}>
              <Ionicons name="arrow-up" size={22} color={input.trim() && !chatLoading ? '#fff' : '#bbb'} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Planner Mode ──────────────────────────────────── */}
      {mode === 'planner' && (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={-insets.bottom}>
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <PlannerForm
              from={from} setFrom={setFrom} to={to} setTo={setTo}
              budget={budget} setBudget={setBudget} days={days} setDays={setDays}
              tags={tags} setTags={setTags} notes={notes} setNotes={setNotes}
              loading={planLoading} onSubmit={doPlan} />

            {planResult ? <PlanResult text={planResult} /> : null}

            {!planResult && !planLoading && (
              <Animated.View entering={FadeInDown.delay(300).springify()} className="mx-4 mt-6 items-center rounded-2xl bg-[#F9F9F9] py-10">
                <Ionicons name="compass-outline" size={44} color="#e0e0e0" />
                <Text className="mt-4 text-[15px] font-medium text-[#ccc]">设置出发地和目的地</Text>
                <Text className="mt-1 text-[13px] text-[#ddd]">点击「生成行程」获取 AI 规划</Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
