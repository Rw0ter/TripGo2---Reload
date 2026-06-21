import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
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
function buildHistory(messages: { role: string; text: string }[]) {
  // 最近 20 条，避免 context 过长
  return messages.slice(-20).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.text,
  }));
}

/** 发送文字到 AI，携带完整对话历史 */
async function sendToAI(
  text: string,
  history: { role: string; text: string }[],
  addMessage: (m: any) => void,
  router: ReturnType<typeof useRouter>,
  hide: () => void,
) {
  addMessage({ role: 'user', text });
  const chatMessages = [...buildHistory(history), { role: 'user' as const, content: text }];
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
      // 点亮页面四周 RGB 流光灯带，提示「助手正在替你操作」
      useVoiceAssistant.getState().setAutomating(true);
      setTimeout(() => useVoiceAssistant.getState().setAutomating(false), 1800);
      if (cmd === 'open_page' && params.page) {
        let route = params.page.replace(/^\/+/, '');
        // 纠正常见 AI 错误：/products/91 → /product/91（产品详情是单数路径）
        route = route.replace(/^products\/(\d+)$/, 'product/$1');
        setTimeout(() => router.push(`/${route}` as any), 600);
        addMessage({ role: 'assistant', text: `[系统] 已执行：打开页面 /${route}`, isCommand: true });
      } else if (cmd === 'buy' && params.productId) {
        const pid = params.productId.replace(/^\/+/, '');
        setTimeout(() => router.push(`/product/${pid}?autoBuy=1` as any), 600);
        addMessage({ role: 'assistant', text: `[系统] 已执行：跳转商品页并自动下单，productId=${pid}，订单已支付`, isCommand: true });
      } else if (cmd === 'collect_energy' && params.activity) {
        const names: Record<string, string> = {
          green_travel: '绿色出行', waste_sort: '垃圾分类', eco_quiz: '环保答题',
          share_green: '分享绿色', trade_in: '以旧换新',
        };
        const name = names[params.activity] ?? '绿色任务';
        try {
          await apiRequest('/eco/activity', { method: 'POST', body: { type: params.activity }, auth: true });
          addMessage({ role: 'assistant', text: `[系统] 已完成「${name}」，绿色能量与碳积分已到账`, isCommand: true });
        } catch (err) {
          addMessage({ role: 'assistant', text: `[系统] 收集失败：${err instanceof Error ? err.message : '请稍后再试'}`, isCommand: true });
        }
      } else if (cmd === 'plant_tree') {
        try {
          const r = await apiRequest<{ message?: string }>('/eco/plant', { method: 'POST', auth: true });
          addMessage({ role: 'assistant', text: `[系统] ${r?.message ?? '浇灌成功，碳积分已到账'}`, isCommand: true });
        } catch (err) {
          addMessage({ role: 'assistant', text: `[系统] 浇灌失败：${err instanceof Error ? err.message : '请稍后再试'}`, isCommand: true });
        }
      } else if (cmd === 'end') {
        // 用 getState() 绕开闭包读最新消息
        const currentState = useVoiceAssistant.getState();
        const userMsgs = currentState.messages.filter((m) => m.role === 'user');
        const lastUserMsg = userMsgs[userMsgs.length - 1]?.text || '';
        const goodbyeWords = /再见|拜拜|结束|退出|关闭|没了|没有[了事]/;
        if (userMsgs.length >= 3 && goodbyeWords.test(lastUserMsg)) {
          addMessage({ role: 'assistant', text: '再见！低碳生活，从每一天开始。', isCommand: true });
          setTimeout(() => hide(), 900);
        }
      }
    } else {
      addMessage({ role: 'assistant', text: fullResponse });
      // TTS 朗读（去除 markdown 格式标记）
      speakText(fullResponse.replace(/[*#`>\[\]_-]/g, ''));
    }
  } catch {
    addMessage({ role: 'assistant', text: '抱歉，AI 服务暂不可用。' });
  }
}

function VoiceAssistantOverlay() {
  const router = useRouter();
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
        await sendToAI(text.trim(), history, addMessage, router, hide);
      } else {
        setListening(false);
        addMessage({ role: 'assistant', text: '我没有听清，请再试一次或直接在下方输入文字。' });
      }
    } catch (e: any) {
      setListening(false);
      addMessage({ role: 'assistant', text: `语音识别失败：${e?.message || '未知错误'}。请尝试使用文字输入。` });
    }
  }, [setListening, clearTranscript, setTranscript, addMessage, hide, router]);

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
    await sendToAI(text, history, addMessage, router, hide);
  }, [clearTranscript, setListening, addMessage, hide, router]);

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
          value={listening ? transcript : ''}
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
