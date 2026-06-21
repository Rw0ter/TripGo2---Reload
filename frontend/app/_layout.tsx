import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useRef } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastContainer } from '@/components/ui/toast';
import { VoiceAssistantBall } from '@/components/ai/voice-assistant-ball';
import { VoiceAssistantSheet } from '@/components/ai/voice-assistant-sheet';
import { VoiceAutomationGlow } from '@/components/ai/voice-automation-glow';
import { useVoiceAssistant } from '@/stores/voice-assistant';
import { apiRequest } from '@/lib/api';
import { streamChat } from '@/lib/ai';
import { startListening } from '@/lib/voice-recognition';
import { useAuthStore } from '@/stores/auth';

/** 当前正在播放的 Audio 元素，用于停止 */
let currentAudio: HTMLAudioElement | null = null;

/** TTS: 优先用后端 Piper 引擎，失败时回退浏览器 speechSynthesis */
async function speakText(text: string) {
  // 原生端（iOS/Android）：用 expo-speech 朗读
  if (Platform.OS !== 'web') {
    try { Speech.stop(); Speech.speak(text, { language: 'zh-CN' }); } catch { /* 静默 */ }
    return;
  }
  try {
    // 停止正在播放的音频
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    speechSynthesis.cancel();

    // 尝试后端 Piper TTS
    const baseUrl = (typeof window !== 'undefined' && (window as any).__API_BASE__) || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/ai/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const json = await res.json();
      const audio = json?.data?.audio || json?.audio;
      if (!audio) throw new Error('no audio');
      const binStr = atob(audio);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      currentAudio = new Audio(url);
      currentAudio.onended = () => { currentAudio = null; URL.revokeObjectURL(url); };
      currentAudio.play();
      return;
    }
  } catch { /* 后端不可用 */ }

  // 回退：浏览器 speechSynthesis
  try {
    if (Platform.OS === 'web') {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = 0.92;
      speechSynthesis.speak(u);
    }
  } catch { /* 静默 */ }
}

/** 从 AI 回复中提取 JSON 指令（兼容 markdown code block 内和纯文本） */
function extractCommand(text: string): { cmd: string | null; params: Record<string, string>; displayText: string } {
  // 先去掉 markdown code block 包裹（如果有）
  const unblocked = text.replace(/```(?:json)?\s*\n?/gi, '').replace(/```/g, '');
  const re = /\{\s*"command"\s*:\s*"(\w+)"([^}]*)\}/;
  const m = unblocked.match(re);
  if (!m) return { cmd: null, params: {}, displayText: text };
  const cmd = m[1];
  const rest = m[2];
  const params: Record<string, string> = {};
  const kvRe = /"(\w+)"\s*:\s*"([^"]+)"/g;
  let kv;
  while ((kv = kvRe.exec(rest))) params[kv[1]] = kv[2];
  // 清理 markdown 和 JSON 后剩余的文字作为展示
  const displayText = text.replace(/```(?:json)?\s*\n?/gi, '').replace(/```/g, '').replace(m[0], '').trim() || '执行中...';
  return { cmd, params, displayText };
}

/** 从显示消息列表构建 AI 对话历史（role+content 格式） */
function buildHistory(messages: { role: string; text: string; isCommand?: boolean }[]) {
  // 最近 24 条；把 App 注入的"[系统]…"执行回执改写成 user 角色的"（系统回执）"，
  // 避免模型把"[系统]已打开…"当成自己说过的话去模仿、伪造，而不真正走指令。
  return messages.slice(-24).map((m) => {
    if (m.role === 'assistant' && m.text.startsWith('[系统]')) {
      return {
        role: 'user' as const,
        content: `（系统回执）${m.text.replace(/^\[系统\]\s*/, '')}`,
      };
    }
    return { role: m.role as 'user' | 'assistant', content: m.text };
  });
}

// 跳转健壮性：把 AI 给的 page（可能是中文页名 / 非精确路径）归一化为合法路由，
// 避免「没严格按规范用指令」导致跳转失败。识别不了返回 null。
const ROUTE_KNOWN = ['home', 'itinerary', 'products', 'green', 'checkin', 'leaderboard', 'orders', 'vr', 'map', 'wallet', 'messages', 'mine', 'community', 'ai/assistant'];
const ROUTE_ALIASES: Record<string, string> = {
  首页: '/home', 主页: '/home',
  森林: '/itinerary', 绿色能量森林: '/itinerary', 能量森林: '/itinerary', 行程: '/itinerary',
  商城: '/products', 生态良品: '/products', 良品: '/products', 商品: '/products',
  绿色资讯: '/green', 资讯: '/green', 头条: '/green',
  签到: '/checkin', 打卡: '/checkin',
  排行榜: '/leaderboard', 减排榜: '/leaderboard', 榜单: '/leaderboard', 排名: '/leaderboard',
  订单: '/orders', 我的订单: '/orders',
  全景: '/vr', vr全景: '/vr',
  地图: '/map', 绿色地图: '/map', 低碳地图: '/map',
  钱包: '/wallet', 余额: '/wallet',
  消息: '/messages', 通知: '/messages',
  我的: '/mine', 个人中心: '/mine', 我: '/mine',
  社区: '/community',
  答题: '/quiz/1', 环保答题: '/quiz/1', 测验: '/quiz/1',
  助手: '/ai/assistant', ai助手: '/ai/assistant',
};
function resolveRoute(page: string): string | null {
  const raw = (page || '').trim();
  const p = raw.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!p) return null;
  if (ROUTE_KNOWN.includes(p)) return `/${p}`;
  if (/^quiz\/\d+$/.test(p)) return `/${p}`;
  if (p === 'quiz') return '/quiz/1';
  const prod = p.match(/^products?\/(\d+)$/);
  if (prod) return `/product/${prod[1]}`;
  if (ROUTE_ALIASES[p]) return ROUTE_ALIASES[p];
  // 包含关键词兜底（如 "去森林看看" 里夹了别的字）
  for (const k of Object.keys(ROUTE_ALIASES)) {
    if (raw.includes(k)) return ROUTE_ALIASES[k];
  }
  return null;
}

// 路由 → 友好界面名（深度融合：让 AI 知道用户当前在哪个界面）。
const SCREEN_NAMES: Record<string, string> = {
  '/home': '首页', '/itinerary': '绿色能量森林', '/products': '生态良品商城', '/green': '绿色资讯',
  '/checkin': '每日签到', '/leaderboard': '减排排行榜', '/orders': '我的订单', '/vr': 'VR 生态全景',
  '/map': '绿色地图', '/wallet': '钱包', '/messages': '消息', '/mine': '我的', '/community': '社区',
  '/ai/assistant': 'AI 助手', '/cantonese': '翻译',
};
function screenNameOf(pathname: string): string {
  if (SCREEN_NAMES[pathname]) return SCREEN_NAMES[pathname];
  if (pathname.startsWith('/scenic/')) return '绿色地标详情';
  if (pathname.startsWith('/product/')) return '商品详情';
  if (pathname.startsWith('/quiz/')) return '环保答题';
  if (pathname.startsWith('/guide/')) return '城市低碳指南';
  if (pathname.startsWith('/story/')) return '社区故事';
  return '绿途';
}

// 按商品名解析到当前数据库的商品(destination) id —— 规避 re-seed 导致的商品 ID 漂移
// （AI 只认商品名，App 实时查 /destinations 匹配出当前 id 再跳转）。
async function resolveDestinationId(query: string): Promise<{ id: number; title: string } | null> {
  const q = (query || '').trim();
  if (!q) return null;
  try {
    const list = await apiRequest<{ id: number; title: string }[]>('/destinations');
    if (!Array.isArray(list) || !list.length) return null;
    const norm = (s: string) => (s || '').replace(/\s|（.*?）|\(.*?\)|套装|礼盒|版/g, '');
    const nq = norm(q);
    const hit =
      list.find((p) => p.title === q) ||
      list.find((p) => p.title.includes(q) || q.includes(p.title)) ||
      list.find((p) => {
        const nt = norm(p.title);
        return nt && (nt.includes(nq) || nq.includes(nt));
      });
    return hit ? { id: hit.id, title: hit.title } : null;
  } catch {
    return null;
  }
}

/** 发送文字到 AI，携带完整对话历史 + 当前界面上下文，执行指令时放慢节奏让自动化"看得见" */
async function sendToAI(
  text: string,
  history: { role: string; text: string }[],
  addMessage: (m: any) => void,
  router: ReturnType<typeof useRouter>,
  hide: () => void,
  currentScreen: string,
) {
  addMessage({ role: 'user', text });
  // 深度融合：把"用户当前所在界面"作为上下文喂给 AI（不污染可见气泡）。
  const ctx = currentScreen ? `${text}\n\n[场景上下文：用户当前正在「${currentScreen}」界面]` : text;
  const chatMessages = [...buildHistory(history), { role: 'user' as const, content: ctx }];
  const va = useVoiceAssistant.getState();
  const stopGlow = () => va.setAutomating(false);
  try {
    let fullResponse = '';
    await new Promise<void>((resolve) => {
      const cancel = streamChat(chatMessages, {
        onToken: (d) => { fullResponse += d; },
        onDone: () => resolve(),
        onError: () => resolve(),
      });
      setTimeout(() => { cancel(); resolve(); }, 120_000);
    });
    if (!fullResponse) return;
    const { cmd, params, displayText } = extractCommand(fullResponse);
    if (cmd) {
      addMessage({ role: 'assistant', text: displayText, isCommand: true });
      // 点亮页面四周 RGB 流光灯带；放慢执行让用户看清"助手在替我操作"。
      va.setAutomating(true);
      if (cmd === 'open_page' && params.page) {
        const route = resolveRoute(params.page);
        if (route) {
          const label = screenNameOf(route);
          addMessage({ role: 'assistant', text: `正在为你打开「${label}」…`, isCommand: true });
          await new Promise((r) => setTimeout(r, 1100));
          router.push(route as never);
          await new Promise((r) => setTimeout(r, 900));
          addMessage({ role: 'assistant', text: `[系统] 已到达「${label}」`, isCommand: true });
          stopGlow();
        } else {
          addMessage({ role: 'assistant', text: `[系统] 未能识别页面「${params.page}」，请换个说法`, isCommand: true });
          stopGlow();
        }
      } else if (cmd === 'open_product' && params.name) {
        addMessage({ role: 'assistant', text: '正在为你查找商品…', isCommand: true });
        const d = await resolveDestinationId(params.name);
        if (!d) {
          addMessage({ role: 'assistant', text: `[系统] 没找到商品「${params.name}」，换个说法试试`, isCommand: true });
          stopGlow();
        } else {
          addMessage({ role: 'assistant', text: `正在为你打开「${d.title}」…`, isCommand: true });
          await new Promise((r) => setTimeout(r, 1000));
          router.push(`/product/${d.id}` as any);
          await new Promise((r) => setTimeout(r, 900));
          addMessage({ role: 'assistant', text: `[系统] 已到达商品详情「${d.title}」`, isCommand: true });
          stopGlow();
        }
      } else if (cmd === 'buy' && (params.name || params.productId)) {
        addMessage({ role: 'assistant', text: '正在为你查找商品…', isCommand: true });
        let pid: number | null = null;
        let title = params.name ?? '';
        if (params.productId && /^\d+$/.test(params.productId.replace(/^\/+/, ''))) {
          pid = parseInt(params.productId.replace(/^\/+/, ''), 10);
        } else if (params.name) {
          const d = await resolveDestinationId(params.name);
          if (d) { pid = d.id; title = d.title; }
        }
        if (pid == null) {
          addMessage({ role: 'assistant', text: `[系统] 没找到商品「${params.name ?? params.productId}」，换个说法试试`, isCommand: true });
          stopGlow();
        } else {
          addMessage({ role: 'assistant', text: `正在为你打开「${title}」并下单…`, isCommand: true });
          await new Promise((r) => setTimeout(r, 1000));
          router.push(`/product/${pid}?autoBuy=1` as any);
          await new Promise((r) => setTimeout(r, 900));
          addMessage({ role: 'assistant', text: `[系统] 已为你下单「${title}」，订单已支付`, isCommand: true });
          stopGlow();
        }
      } else if (cmd === 'collect_energy' && params.activity) {
        const names: Record<string, string> = {
          green_travel: '绿色出行', waste_sort: '垃圾分类', eco_quiz: '环保答题',
          share_green: '分享绿色', trade_in: '以旧换新',
        };
        const name = names[params.activity] ?? '绿色任务';
        addMessage({ role: 'assistant', text: `正在为你完成「${name}」…`, isCommand: true });
        await new Promise((r) => setTimeout(r, 900));
        try {
          await apiRequest('/eco/activity', { method: 'POST', body: { type: params.activity }, auth: true });
          addMessage({ role: 'assistant', text: `[系统] 已完成「${name}」，绿色能量与碳积分已到账`, isCommand: true });
        } catch (err) {
          addMessage({ role: 'assistant', text: `[系统] 收集失败：${err instanceof Error ? err.message : '请稍后再试'}`, isCommand: true });
        }
        await new Promise((r) => setTimeout(r, 600));
        stopGlow();
      } else if (cmd === 'plant_tree') {
        addMessage({ role: 'assistant', text: '正在为小树浇灌…', isCommand: true });
        await new Promise((r) => setTimeout(r, 900));
        try {
          const r = await apiRequest<{ message?: string }>('/eco/plant', { method: 'POST', auth: true });
          addMessage({ role: 'assistant', text: `[系统] ${r?.message ?? '浇灌成功，碳积分已到账'}`, isCommand: true });
        } catch (err) {
          addMessage({ role: 'assistant', text: `[系统] 浇灌失败：${err instanceof Error ? err.message : '请稍后再试'}`, isCommand: true });
        }
        await new Promise((r) => setTimeout(r, 600));
        stopGlow();
      } else if (cmd === 'query_profile') {
        addMessage({ role: 'assistant', text: '正在为你查询账户数据…', isCommand: true });
        try {
          const s = await apiRequest<{ carbonCredits: number; points: number; treesPlanted: number; totalCarbonSaved: number }>('/eco/progress', { auth: true });
          const name = useAuthStore.getState().user?.username ?? '你';
          addMessage({ role: 'assistant', text: `[系统] 账号名：${name}；碳积分 ${s.carbonCredits}、可用积分 ${s.points}、已种 ${s.treesPlanted} 棵真树、累计减排 ${s.totalCarbonSaved.toFixed(1)} kg`, isCommand: true });
        } catch (err) {
          addMessage({ role: 'assistant', text: `[系统] 查询失败：${err instanceof Error ? err.message : '请先登录'}`, isCommand: true });
        }
        stopGlow();
      } else if (cmd === 'query_rank') {
        addMessage({ role: 'assistant', text: '正在为你查询排名…', isCommand: true });
        try {
          const r = await apiRequest<{ self?: { rank: number; score: number; carbonCredits: number } }>('/leaderboard', { auth: true });
          if (r.self) {
            addMessage({ role: 'assistant', text: `[系统] 你当前在减排榜第 ${r.self.rank} 名，综合分 ${r.self.score}（碳积分 ${r.self.carbonCredits}）`, isCommand: true });
          } else {
            addMessage({ role: 'assistant', text: '[系统] 你还没进入榜单，多做绿色任务冲榜吧', isCommand: true });
          }
        } catch (err) {
          addMessage({ role: 'assistant', text: `[系统] 查询失败：${err instanceof Error ? err.message : '请先登录'}`, isCommand: true });
        }
        stopGlow();
      } else if (cmd === 'end') {
        stopGlow();
        const currentState = useVoiceAssistant.getState();
        const userMsgs = currentState.messages.filter((m) => m.role === 'user');
        const lastUserMsg = userMsgs[userMsgs.length - 1]?.text || '';
        const goodbyeWords = /再见|拜拜|结束|退出|关闭|没了|没有[了事]/;
        if (userMsgs.length >= 3 && goodbyeWords.test(lastUserMsg)) {
          addMessage({ role: 'assistant', text: '再见！低碳生活，从每一天开始。', isCommand: true });
          setTimeout(() => hide(), 900);
        }
      } else {
        stopGlow();
      }
    } else {
      addMessage({ role: 'assistant', text: fullResponse });
      // TTS 朗读（去除 markdown 格式标记）
      speakText(fullResponse.replace(/[*#`>\[\]_-]/g, ''));
    }
  } catch {
    stopGlow();
    addMessage({ role: 'assistant', text: '抱歉，AI 服务暂不可用。' });
  }
}

function VoiceAssistantOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { visible, listening, transcript, setListening, setTranscript, clearTranscript, addMessage, hide } = useVoiceAssistant();
  const inputRef = useRef<TextInput>(null);

  // 核心：请求麦克风 → 语音识别 → 发送 AI
  const startVoice = useCallback(async () => {
    if (Platform.OS === 'web') { speechSynthesis.cancel(); }
    setListening(true);
    clearTranscript();

    // 1. 先用 getUserMedia 触发浏览器原生麦克风权限弹窗
    let micGranted = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      micGranted = true;
    } catch {
      setListening(false);
      addMessage({ role: 'assistant', text: '麦克风权限未授予，请在系统/浏览器设置中允许麦克风访问，或在下方输入文字与我对话。' });
      return;
    }

    if (!micGranted) { setListening(false); return; }

    // 2. 语音识别
    try {
      const text = await startListening('zh-CN', { onInterim: (t) => setTranscript(t) });
      if (text && text.trim()) {
        setTranscript(text);
        await new Promise((r) => setTimeout(r, 300));
        clearTranscript();
        setListening(false);
        // 使用 getState() 读最新消息，避免 useCallback 闭包陷阱
        const currentState = useVoiceAssistant.getState();
        const history = [...currentState.messages];
        await sendToAI(text.trim(), history, addMessage, router, hide, screenNameOf(pathname));
      } else {
        setListening(false);
        addMessage({ role: 'assistant', text: '我没有听清，请再试一次或直接在下方输入文字。' });
      }
    } catch (e: any) {
      setListening(false);
      addMessage({ role: 'assistant', text: `语音识别失败：${e?.message || '未知错误'}。请尝试使用文字输入。` });
    }
  }, [setListening, clearTranscript, setTranscript, addMessage, hide, router, pathname]);

  const handleToggle = useCallback(() => {
    if (!listening) startVoice();
  }, [listening, startVoice]);

  // 文字输入兜底
  const handleTextSubmit = useCallback(async () => {
    const s = useVoiceAssistant.getState();
    const text = s.transcript.trim();
    if (!text) return;
    if (Platform.OS === 'web') { speechSynthesis.cancel(); }
    clearTranscript();
    setListening(false);
    const history = [...s.messages];
    await sendToAI(text, history, addMessage, router, hide, screenNameOf(pathname));
  }, [clearTranscript, setListening, addMessage, hide, router, pathname]);

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 100, pointerEvents: 'box-none',
    }}>
      <VoiceAssistantSheet />
      <VoiceAssistantBall listening={listening} onToggle={handleToggle} />
      {/* 底部文字输入兜底 */}
      <View style={{
        position: 'absolute', bottom: 40, left: 24, right: 24,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }} pointerEvents="auto">
        <TextInput
          ref={inputRef}
          placeholder={listening ? '正在聆听...' : '输入文字或点击上方球体说话...'}
          placeholderTextColor="#9CA3AF"
          value={transcript}
          onChangeText={(t) => setTranscript(t)}
          onSubmitEditing={handleTextSubmit}
          returnKeyType="send"
          editable={!listening}
          style={{ flex: 1, fontSize: 14, color: '#1A1A1A', paddingVertical: 8 }}
        />
      </View>
      {/* 关闭助手（替代原全屏点击退出，避免拦截正常页面操作） */}
      <Pressable
        onPress={hide}
        accessibilityRole="button"
        accessibilityLabel="关闭语音助手"
        style={{ position: 'absolute', top: insets.top + 10, right: 16 }}
        pointerEvents="auto">
        <View style={{ height: 38, width: 38, borderRadius: 19, backgroundColor: 'rgba(27,67,50,0.82)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={20} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View className="flex-1">
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="hello" options={{ headerShown: false }} />
          <Stack.Screen name="login1" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="map" options={{ headerShown: false }} />
          <Stack.Screen name="trip/create" options={{ headerShown: false }} />
          <Stack.Screen name="post/story" options={{ headerShown: false }} />
          <Stack.Screen name="story/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="scenic/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="guide/[city]" options={{ headerShown: false }} />
          <Stack.Screen name="checkin" options={{ headerShown: false }} />
          <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
          <Stack.Screen name="products" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="green" options={{ headerShown: false }} />
          <Stack.Screen name="quiz/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="messages" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
          <Stack.Screen name="wallet" options={{ headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: false }} />
          <Stack.Screen name="collections" options={{ headerShown: false }} />
          <Stack.Screen name="vr" options={{ headerShown: false }} />
          <Stack.Screen name="cantonese" options={{ headerShown: false }} />
          <Stack.Screen name="ai/assistant" options={{ headerShown: false }} />
          <Stack.Screen name="my/trips" options={{ headerShown: false }} />
          <Stack.Screen name="my/stories" options={{ headerShown: false }} />
          <Stack.Screen name="my/likes" options={{ headerShown: false }} />
          <Stack.Screen name="yinsizhengce" options={{ headerShown: false }} />
          <Stack.Screen name="yonghuxieyi" options={{ headerShown: false }} />
          <Stack.Screen name="permissions" options={{ headerShown: false }} />
          <Stack.Screen name="shequguifan" options={{ headerShown: false }} />
          <Stack.Screen name="about_us" options={{ headerShown: false }} />
        </Stack>
        <ToastContainer />
        <VoiceAssistantOverlay />
        <VoiceAutomationGlow />
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
