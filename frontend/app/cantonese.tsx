import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { speak, stop } from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';
import { translateToCantonese } from '@/lib/ai';

// ── 岭南绿主题（与 App 同源）──
const PRIMARY = '#386641';
const GOLD = '#D4A76A';
const BG = '#F4F1E4';
const INK = '#2f3a30';
const MUTE = '#9a9382';

// 后端 GET /cultural?category=phrase 返回结构
interface CulturalItem {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  color: string;
}
interface Phrase {
  id: number;
  canto: string;
  jyutping: string;
  meaning: string;
}

// cultural phrase 的 title 形如「你好 (nei5 hou2)」，拆出粤语词与 jyutping。
function parsePhrase(item: CulturalItem): Phrase {
  const m = item.title.match(/^(.+?)\s*\((.+)\)\s*$/);
  return {
    id: item.id,
    canto: m ? m[1].trim() : item.title,
    jyutping: m ? m[2].trim() : '',
    meaning: item.subtitle,
  };
}

export default function CantoneseScreen() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [translating, setTranslating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hint, setHint] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const [phrases, setPhrases] = useState<Phrase[] | null>(null);
  const [phraseErr, setPhraseErr] = useState(false);

  // ── 原生语音识别事件（Web 走浏览器 Web Speech API；原生需 dev build）──
  useSpeechRecognitionEvent('result', (e) => {
    const t = e.results?.[0]?.transcript;
    if (typeof t === 'string') setInput(t);
  });
  useSpeechRecognitionEvent('end', () => setRecording(false));
  useSpeechRecognitionEvent('error', (e) => {
    setRecording(false);
    setHint(`语音识别失败（${e.error ?? '未知'}），可改用文字输入`);
  });

  // ── 常用短语 ──
  const loadPhrases = useCallback(async () => {
    try {
      const ph = await apiRequest<CulturalItem[]>('/cultural?category=phrase');
      setPhrases(ph.map(parsePhrase));
      setPhraseErr(false);
    } catch {
      setPhraseErr(true);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void loadPhrases();
    }, [loadPhrases]),
  );

  // 麦克风：开始 / 停止语音输入。
  async function onMic() {
    setHint('');
    if (recording) {
      ExpoSpeechRecognitionModule.stop();
      setRecording(false);
      return;
    }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setHint('未授予麦克风 / 语音识别权限，可改用文字输入');
        return;
      }
      setResult('');
      ExpoSpeechRecognitionModule.start({
        lang: 'cmn-Hans-CN', // 说普通话 → 识别为中文，再译成粤语
        interimResults: true,
        continuous: false,
      });
      setRecording(true);
    } catch {
      setHint('当前环境不支持语音输入，请用文字输入');
      setRecording(false);
    }
  }

  // 译成粤语。
  async function onTranslate() {
    const t = input.trim();
    if (!t || translating) return;
    if (recording) {
      ExpoSpeechRecognitionModule.stop();
      setRecording(false);
    }
    setHint('');
    setTranslating(true);
    setResult('');
    try {
      setResult(await translateToCantonese(t));
    } catch {
      setHint('翻译失败，请稍后重试');
    } finally {
      setTranslating(false);
    }
  }

  // TTS 朗读（粤语 zh-HK）。
  function onSpeak(text: string, id: string) {
    if (!text) return;
    stop();
    setSpeakingId(id);
    speak(text, {
      language: 'zh-HK',
      rate: 0.85,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {/* ── 绿色 Hero ── */}
        <LinearGradient colors={['#3E6B4F', '#5C8A6D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <ScreenHeader title="粤语课堂" subtitle="一句普通话，译成地道粤语" tint="dark" />
        </LinearGradient>

        {/* ── 主体 ── */}
        <View className="-mt-3 rounded-t-[24px] px-4 pt-5" style={{ backgroundColor: BG }}>
          {/* 翻译器卡片 */}
          <Animated.View
            entering={FadeInDown.duration(420)}
            className="overflow-hidden rounded-2xl bg-white p-4"
            style={{ boxShadow: '0px 4px 16px rgba(0,0,0,0.07)' }}>
            {/* 输入区 */}
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: MUTE }}>普通话</Text>
              {input.length > 0 ? (
                <Pressable onPress={() => { setInput(''); setResult(''); setHint(''); }} hitSlop={8}>
                  <Text className="text-[12px]" style={{ color: MUTE }}>清空</Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="输入，或点麦克风说一句普通话…"
              placeholderTextColor="#bcb6a8"
              multiline
              className="mt-1.5 text-[17px] leading-7"
              style={{ color: INK, minHeight: 56, textAlignVertical: 'top' }}
            />

            {/* 操作行：麦克风 + 译成粤语 */}
            <View className="mt-2 flex-row items-center" style={{ gap: 10 }}>
              <Pressable
                onPress={onMic}
                accessibilityRole="button"
                accessibilityLabel={recording ? '停止语音输入' : '语音输入'}
                style={({ pressed }) => ({
                  height: 46,
                  width: 46,
                  borderRadius: 23,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: recording ? '#C0392B' : '#EAF1EB',
                  transform: pressed ? [{ scale: 0.94 }] : [],
                })}>
                <Ionicons name={recording ? 'stop' : 'mic'} size={22} color={recording ? '#fff' : PRIMARY} />
              </Pressable>
              <Pressable
                onPress={onTranslate}
                disabled={!input.trim() || translating}
                accessibilityRole="button"
                accessibilityLabel="译成粤语"
                style={({ pressed }) => ({ flex: 1, transform: pressed ? [{ scale: 0.98 }] : [], opacity: !input.trim() ? 0.5 : 1 })}
                className="overflow-hidden rounded-2xl">
                <LinearGradient
                  colors={['#386641', '#5C8A6D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 46 }}
                  className="flex-row items-center justify-center">
                  {translating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="language" size={17} color="#fff" />
                      <Text className="ml-1.5 text-[15px] font-bold text-white">译成粤语</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {recording ? (
              <Text className="mt-2 text-[12px]" style={{ color: '#C0392B' }}>● 正在聆听…再次点击停止</Text>
            ) : null}
            {hint ? <Text className="mt-2 text-[12px]" style={{ color: '#B0703A' }}>{hint}</Text> : null}

            {/* 译文区 */}
            <View className="mt-4 rounded-2xl px-4 py-3.5" style={{ backgroundColor: '#F4F8F4' }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: PRIMARY }}>粤语</Text>
                {result ? (
                  <Pressable
                    onPress={() => onSpeak(result, 'result')}
                    accessibilityRole="button"
                    accessibilityLabel="朗读粤语译文"
                    className="flex-row items-center rounded-full px-2.5 py-1"
                    style={{ backgroundColor: speakingId === 'result' ? PRIMARY : '#E3EEE4' }}>
                    <Ionicons
                      name={speakingId === 'result' ? 'volume-high' : 'volume-medium-outline'}
                      size={14}
                      color={speakingId === 'result' ? '#fff' : PRIMARY}
                    />
                    <Text className="ml-1 text-[12px] font-semibold" style={{ color: speakingId === 'result' ? '#fff' : PRIMARY }}>朗读</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text className="mt-1.5 text-[19px] font-semibold leading-8" style={{ color: result ? INK : '#c2bcae' }}>
                {result || '译文会显示在这里'}
              </Text>
            </View>
          </Animated.View>

          {/* 常用粤语 */}
          <Animated.View entering={FadeInDown.delay(120).duration(420)} className="mt-6">
            <View className="mb-3 flex-row items-center px-1">
              <View style={{ width: 4, height: 17, borderRadius: 2, backgroundColor: PRIMARY }} />
              <Ionicons name="chatbubbles" size={15} color={PRIMARY} style={{ marginLeft: 7 }} />
              <Text className="ml-2 text-[16px] font-extrabold" style={{ color: INK }}>常用粤语</Text>
              <Text className="ml-2 text-[11px]" style={{ color: MUTE }}>点一点，听发音</Text>
            </View>

            {!phrases && !phraseErr ? (
              <View className="items-center py-8"><ActivityIndicator color={PRIMARY} /></View>
            ) : phraseErr ? (
              <Pressable onPress={() => void loadPhrases()} className="items-center py-8">
                <Ionicons name="cloud-offline-outline" size={32} color={MUTE} />
                <Text className="mt-2 text-[13px]" style={{ color: MUTE }}>加载失败，点此重试</Text>
              </Pressable>
            ) : (
              (phrases ?? []).map((p) => {
                const id = `p-${p.id}`;
                const playing = speakingId === id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => onSpeak(p.canto, id)}
                    accessibilityRole="button"
                    accessibilityLabel={`朗读 ${p.canto}`}
                    style={({ pressed }) => ({ backgroundColor: pressed ? '#F7F4EA' : '#fff', boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' })}
                    className="mb-2.5 flex-row items-center rounded-2xl px-3.5 py-3">
                    <View className="flex-1">
                      <Text className="text-[16px] font-bold" style={{ color: INK }}>{p.canto}</Text>
                      {p.jyutping ? (
                        <Text className="mt-0.5 text-[12.5px] font-medium" style={{ color: GOLD }}>{p.jyutping}</Text>
                      ) : null}
                      {p.meaning ? (
                        <Text className="mt-0.5 text-[12px]" style={{ color: MUTE }}>{p.meaning}</Text>
                      ) : null}
                    </View>
                    <View
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: playing ? PRIMARY : '#EAF1EB' }}>
                      <Ionicons
                        name={playing ? 'volume-high' : 'volume-medium-outline'}
                        size={19}
                        color={playing ? '#fff' : PRIMARY}
                      />
                    </View>
                  </Pressable>
                );
              })
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
