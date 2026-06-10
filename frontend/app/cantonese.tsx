import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { speak, stop } from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import { translateToCantonese } from '@/lib/ai';

// ── 岭南绿主题（仅呼应配色；本屏是「双面板翻译器」工具台版式，不套首页骨架）──
const PRIMARY = '#386641';
const PRIMARY_SOFT = '#5C8A6D';
const GOLD = '#D4A76A';
const SURFACE = '#FBFAF4'; // 工具台底：近白，刻意区别于首页米白圆角面板 #F4F1E4
const INK = '#26302a';
const MUTE = '#9a9382';
const LINE = '#ECE8DA';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

  // 清空两侧面板。
  function clearAll() {
    stop();
    setSpeakingId(null);
    setInput('');
    setResult('');
    setHint('');
  }

  // 常用语「用」：装入翻译器，普通话面板填释义、粤语面板直接呈现对照。
  function applyPhrase(p: Phrase) {
    stop();
    setSpeakingId(null);
    setHint('');
    setInput(p.meaning || p.canto);
    setResult(p.canto);
  }

  const resultSpeaking = speakingId === 'result';

  return (
    <View className="flex-1" style={{ backgroundColor: SURFACE }}>
      {/* ── 细顶栏：返回 + 标题 + 语向徽标（工具台气质，非绿渐变大 Hero）── */}
      <View
        style={{
          paddingTop: insets.top + 6,
          borderBottomWidth: 1,
          borderBottomColor: LINE,
          backgroundColor: '#fff',
        }}
        className="px-3 pb-2.5">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center">
            <Ionicons name="chevron-back" size={23} color={INK} />
          </Pressable>
          <View className="ml-1 flex-1">
            <Text
              className="text-[17px] font-bold"
              style={{ color: INK, letterSpacing: -0.2 }}>
              粤语课堂
            </Text>
            <Text className="mt-0.5 text-[11.5px]" style={{ color: MUTE }}>
              普通话 → 地道粤语 · 即译即读
            </Text>
          </View>
          {/* 语向胶囊：普 → 粤 */}
          <View
            className="flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: '#EEF4EF', borderWidth: 1, borderColor: '#DDE8DE' }}>
            <Text className="text-[11.5px] font-bold" style={{ color: PRIMARY }}>普</Text>
            <Ionicons name="arrow-forward" size={11} color={GOLD} style={{ marginHorizontal: 3 }} />
            <Text className="text-[11.5px] font-bold" style={{ color: PRIMARY }}>粤</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 8}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 28 }}>
          {/* ════ 上面板：普通话输入（占满宽、大输入区 + 麦克风）════ */}
          <Animated.View
            entering={FadeInDown.duration(380)}
            className="rounded-3xl bg-white"
            style={{
              borderWidth: 1,
              borderColor: LINE,
              boxShadow: '0px 6px 18px rgba(56,102,65,0.06)',
            }}>
            {/* 面板头：标记 + 计数 + 清空 */}
            <View
              className="flex-row items-center justify-between px-4 pb-2 pt-3.5"
              style={{ borderBottomWidth: 1, borderBottomColor: '#F3F0E6' }}>
              <View className="flex-row items-center">
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: MUTE }} />
                <Text className="ml-2 text-[13px] font-bold" style={{ color: INK }}>普通话</Text>
                <Text className="ml-1.5 text-[11px]" style={{ color: '#c2bcae' }}>原文</Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <Text className="text-[11px]" style={{ color: '#c2bcae' }}>{input.length}/200</Text>
                {input.length > 0 ? (
                  <Pressable onPress={clearAll} hitSlop={8} className="flex-row items-center">
                    <Ionicons name="close-circle" size={14} color={MUTE} />
                    <Text className="ml-1 text-[12px]" style={{ color: MUTE }}>清空</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="输入想说的话，或点下方麦克风说一句普通话…"
              placeholderTextColor="#c5bfb1"
              multiline
              maxLength={200}
              className="px-4 pt-3 text-[19px] leading-8"
              style={{ color: INK, minHeight: 104, textAlignVertical: 'top' }}
            />

            {/* 输入面板底栏：大麦克风 + 录音态文案 */}
            <View className="flex-row items-center px-4 pb-3.5 pt-1" style={{ gap: 12 }}>
              <Pressable
                onPress={onMic}
                accessibilityRole="button"
                accessibilityLabel={recording ? '停止语音输入' : '语音输入'}
                style={({ pressed }) => ({
                  height: 52,
                  width: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: recording ? '#C0392B' : '#EEF4EF',
                  borderWidth: recording ? 0 : 1,
                  borderColor: '#DDE8DE',
                  transform: pressed ? [{ scale: 0.93 }] : [],
                })}>
                <Ionicons name={recording ? 'stop' : 'mic'} size={24} color={recording ? '#fff' : PRIMARY} />
              </Pressable>
              <View className="flex-1">
                {recording ? (
                  <Animated.Text
                    entering={FadeIn.duration(220)}
                    className="text-[13px] font-semibold"
                    style={{ color: '#C0392B' }}>
                    ● 正在聆听…再次点击麦克风结束
                  </Animated.Text>
                ) : (
                  <Text className="text-[12.5px] leading-5" style={{ color: MUTE }}>
                    点麦克风说普通话，识别后自动填入上方
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* ════ 中段操作条：语向轴 + 翻译主按钮（连接上下面板）════ */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(380)}
            className="flex-row items-center"
            style={{ marginTop: 12, marginBottom: 12, gap: 12 }}>
            <View
              className="items-center justify-center rounded-2xl"
              style={{ width: 52, height: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: LINE }}>
              <Ionicons name="swap-vertical" size={22} color={GOLD} />
            </View>
            <Pressable
              onPress={onTranslate}
              disabled={!input.trim() || translating}
              accessibilityRole="button"
              accessibilityLabel="译成粤语"
              className="flex-1 overflow-hidden rounded-2xl"
              style={({ pressed }) => ({
                transform: pressed ? [{ scale: 0.985 }] : [],
                opacity: !input.trim() ? 0.45 : 1,
                boxShadow: '0px 6px 16px rgba(56,102,65,0.26)',
              })}>
              <LinearGradient
                colors={[PRIMARY, PRIMARY_SOFT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 52 }}
                className="flex-row items-center justify-center">
                {translating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="language" size={18} color="#fff" />
                    <Text className="ml-2 text-[16px] font-bold text-white">译成粤语</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ════ 下面板：粤语输出（大字译文 + 喇叭朗读）════ */}
          <Animated.View
            entering={FadeInDown.delay(140).duration(380)}
            className="overflow-hidden rounded-3xl"
            style={{
              borderWidth: 1,
              borderColor: '#DDE8DE',
              backgroundColor: '#F4F8F4',
              boxShadow: '0px 6px 18px rgba(56,102,65,0.08)',
            }}>
            {/* 译文面板头：绿调强调 + 朗读 */}
            <View
              className="flex-row items-center justify-between px-4 pb-2 pt-3.5"
              style={{ borderBottomWidth: 1, borderBottomColor: '#E2EBE3' }}>
              <View className="flex-row items-center">
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: PRIMARY }} />
                <Text className="ml-2 text-[13px] font-bold" style={{ color: PRIMARY }}>粤语</Text>
                <Text className="ml-1.5 text-[11px]" style={{ color: PRIMARY_SOFT }}>译文</Text>
              </View>
              {result ? (
                <Pressable
                  onPress={() => onSpeak(result, 'result')}
                  accessibilityRole="button"
                  accessibilityLabel="朗读粤语译文"
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{ backgroundColor: resultSpeaking ? PRIMARY : '#E3EEE4' }}>
                  <Ionicons
                    name={resultSpeaking ? 'volume-high' : 'volume-medium-outline'}
                    size={15}
                    color={resultSpeaking ? '#fff' : PRIMARY}
                  />
                  <Text
                    className="ml-1.5 text-[12.5px] font-bold"
                    style={{ color: resultSpeaking ? '#fff' : PRIMARY }}>
                    {resultSpeaking ? '朗读中' : '朗读'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* 译文主体 */}
            <View className="px-4 py-4" style={{ minHeight: 120 }}>
              {translating ? (
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <ActivityIndicator color={PRIMARY} size="small" />
                  <Text className="text-[14px]" style={{ color: PRIMARY_SOFT }}>正在译成地道粤语…</Text>
                </View>
              ) : result ? (
                <Animated.Text
                  entering={FadeIn.duration(260)}
                  className="text-[24px] font-bold leading-9"
                  style={{ color: INK }}>
                  {result}
                </Animated.Text>
              ) : (
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#b9c6ba" />
                  <Text className="text-[15px]" style={{ color: '#a9b8aa' }}>
                    译文会显示在这里，点「朗读」听发音
                  </Text>
                </View>
              )}
            </View>

            {hint ? (
              <View
                className="flex-row items-center px-4 py-2.5"
                style={{ backgroundColor: '#FBF1E4', borderTopWidth: 1, borderTopColor: '#F0E3CE' }}>
                <Ionicons name="information-circle" size={15} color="#B0703A" />
                <Text className="ml-1.5 flex-1 text-[12.5px]" style={{ color: '#B0703A' }}>{hint}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* ════ 底部：常用语横滑 chip 带（首屏即可见，非折叠抽屉/非首页瀑布流）════ */}
          <Animated.View entering={FadeInDown.delay(200).duration(380)} className="mt-5">
            {/* 区头：图标 + 标题 + 用法说明（无首页绿竖条 SectionTitle） */}
            <View className="flex-row items-center px-1">
              <View
                className="items-center justify-center rounded-xl"
                style={{ width: 30, height: 30, backgroundColor: '#FBF3E4' }}>
                <Ionicons name="bookmarks" size={15} color={GOLD} />
              </View>
              <View className="ml-2.5 flex-1">
                <Text className="text-[14px] font-bold" style={{ color: INK }}>常用粤语</Text>
                <Text className="mt-0.5 text-[11px]" style={{ color: MUTE }}>
                  点 chip 即朗读，点「用」装入上方翻译器
                </Text>
              </View>
            </View>

            {/* chip 带主体 */}
            {!phrases && !phraseErr ? (
              <View className="items-center py-8">
                <ActivityIndicator color={PRIMARY} />
              </View>
            ) : phraseErr ? (
              <Pressable onPress={() => void loadPhrases()} className="mt-3 items-center py-8">
                <Ionicons name="cloud-offline-outline" size={28} color={MUTE} />
                <Text className="mt-2 text-[13px]" style={{ color: MUTE }}>加载失败，点此重试</Text>
              </Pressable>
            ) : (phrases ?? []).length === 0 ? (
              <View className="mt-3 items-center py-8">
                <Text className="text-[13px]" style={{ color: MUTE }}>暂无常用语</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                className="mt-3"
                contentContainerStyle={{ paddingHorizontal: 1, paddingVertical: 2, gap: 10 }}>
                {(phrases ?? []).map((p) => {
                  const id = `p-${p.id}`;
                  const playing = speakingId === id;
                  return (
                    <View
                      key={p.id}
                      className="overflow-hidden rounded-2xl"
                      style={{
                        width: 188,
                        borderWidth: 1,
                        borderColor: playing ? PRIMARY : LINE,
                        backgroundColor: playing ? PRIMARY : '#fff',
                        boxShadow: '0px 4px 12px rgba(56,102,65,0.05)',
                      }}>
                      {/* 整粒可点 → 朗读（播放态整粒变绿、字与喇叭转白）*/}
                      <Pressable
                        onPress={() => onSpeak(p.canto, id)}
                        accessibilityRole="button"
                        accessibilityLabel={`朗读 ${p.canto}`}
                        className="px-3.5 pb-2.5 pt-3">
                        <View className="flex-row items-center justify-between">
                          <Text
                            className="flex-1 pr-2 text-[17px] font-bold"
                            numberOfLines={1}
                            style={{ color: playing ? '#fff' : INK }}>
                            {p.canto}
                          </Text>
                          <Ionicons
                            name={playing ? 'volume-high' : 'volume-medium-outline'}
                            size={17}
                            color={playing ? '#fff' : PRIMARY}
                          />
                        </View>
                        {p.jyutping ? (
                          <Text
                            className="mt-0.5 text-[12px] font-semibold"
                            numberOfLines={1}
                            style={{ color: playing ? '#EAF1EB' : GOLD }}>
                            {p.jyutping}
                          </Text>
                        ) : null}
                        {p.meaning ? (
                          <Text
                            className="mt-1 text-[12px]"
                            numberOfLines={1}
                            style={{ color: playing ? '#D6E5D8' : MUTE }}>
                            {p.meaning}
                          </Text>
                        ) : null}
                      </Pressable>

                      {/* 副动作行：用 → 装入翻译器（与整粒朗读区分，避免误触）*/}
                      <Pressable
                        onPress={() => applyPhrase(p)}
                        accessibilityRole="button"
                        accessibilityLabel={`把 ${p.canto} 装入翻译器`}
                        className="flex-row items-center justify-center py-2"
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: playing ? 'rgba(255,255,255,0.25)' : '#F3F0E6',
                          backgroundColor: playing ? 'rgba(255,255,255,0.12)' : '#F6FAF6',
                        }}>
                        <Ionicons
                          name="enter-outline"
                          size={13}
                          color={playing ? '#fff' : PRIMARY}
                        />
                        <Text
                          className="ml-1 text-[12px] font-semibold"
                          style={{ color: playing ? '#fff' : PRIMARY }}>
                          用这句
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}