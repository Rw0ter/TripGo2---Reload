import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { speak, stop } from 'expo-speech';
import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';

// 后端 GET /cultural?category=phrase|lesson 返回结构
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
  emoji: string;
}

// cultural phrase 的 title 形如「你好 (nei5 hou2)」，拆出粤语词与 jyutping。
function parsePhrase(item: CulturalItem): Phrase {
  const m = item.title.match(/^(.+?)\s*\((.+)\)\s*$/);
  return {
    id: item.id,
    canto: m ? m[1].trim() : item.title,
    jyutping: m ? m[2].trim() : '',
    meaning: item.subtitle,
    emoji: item.content || '🗣️',
  };
}

function lessonCount(content: string): number {
  try {
    return JSON.parse(content)?.lessons ?? 0;
  } catch {
    return 0;
  }
}

// ── Play-button ──────────────────────────────────────────
function PlayButton({ onPress, isPlaying }: { onPress: () => void; isPlaying: boolean }) {
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  function handlePress() {
    RNAnimated.sequence([
      RNAnimated.timing(pulseAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(pulseAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  }
  return (
    <Pressable
      onPress={handlePress}
      className={`h-10 w-10 items-center justify-center rounded-full ${isPlaying ? 'bg-[#D4522A]' : 'bg-[#D4522A]/10'}`}
    >
      <RNAnimated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons
          name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
          size={20}
          color={isPlaying ? '#fff' : '#D4522A'}
        />
      </RNAnimated.View>
    </Pressable>
  );
}

// ── Phrase row ───────────────────────────────────────────
function PhraseRow({ phrase, isPlaying, onPlay }: { phrase: Phrase; isPlaying: boolean; onPlay: () => void }) {
  function handlePlay() {
    onPlay();
    speak(phrase.canto, { language: 'zh-HK', rate: 0.8 });
  }
  return (
    <Pressable
      onPress={handlePlay}
      className="mb-2 flex-row items-center rounded-xl bg-white px-3 py-3 shadow-sm active:bg-[#F5F5F5]"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}
    >
      <Text className="text-[26px]">{phrase.emoji}</Text>
      <View className="ml-3 flex-1">
        <Text className="text-[16px] font-bold text-[#333]">{phrase.canto}</Text>
        {phrase.jyutping ? (
          <Text className="mt-0.5 text-[13px] font-medium text-[#D4522A]">{phrase.jyutping}</Text>
        ) : null}
        <Text className="mt-0.5 text-[12px] text-[#999]">{phrase.meaning}</Text>
      </View>
      <PlayButton onPress={handlePlay} isPlaying={isPlaying} />
    </Pressable>
  );
}

// ── Screen ───────────────────────────────────────────────
export default function CantoneseScreen() {
  const [phrases, setPhrases] = useState<Phrase[] | null>(null);
  const [lessons, setLessons] = useState<CulturalItem[] | null>(null);
  const [error, setError] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playingRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [ph, ls] = await Promise.all([
        apiRequest<CulturalItem[]>('/cultural?category=phrase'),
        apiRequest<CulturalItem[]>('/cultural?category=lesson'),
      ]);
      setPhrases(ph.map(parsePhrase));
      setLessons(ls);
    } catch {
      setError(true);
      setPhrases(null);
      setLessons(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function handlePlay(phraseId: string) {
    if (playingRef.current) stop();
    playingRef.current = phraseId;
    setPlayingId(phraseId);
    speak(phraseId, {
      language: 'zh-HK',
      rate: 0.8,
      onDone: () => { playingRef.current = null; setPlayingId(null); },
      onError: () => { playingRef.current = null; setPlayingId(null); },
      onStopped: () => { playingRef.current = null; setPlayingId(null); },
    });
  }

  const loading = !phrases && !lessons && !error;

  return (
    <View className="flex-1 bg-[#F8F5E6]">
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View className="bg-[#D4522A]">
          <ScreenHeader title="粤语课堂" subtitle="学说广东话 · 传承岭南音" tint="dark" />
        </View>

        <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }} className="bg-[#F8F5E6] px-4 pt-5">
          <View className="mx-1 mb-4 flex-row items-center rounded-lg bg-[#D4522A]/8 px-3 py-2.5">
            <Ionicons name="bulb-outline" size={18} color="#D4522A" />
            <Text className="ml-2 flex-1 text-[12px] text-[#D4522A]/80">
              点击任意短语或喇叭按钮，即可听到粤语真人发音
            </Text>
          </View>

          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#D4522A" />
            </View>
          ) : error ? (
            <View className="items-center py-16">
              <Ionicons name="cloud-offline-outline" size={44} color="#ccc" />
              <Text className="mt-2 text-[14px] text-[#999]">加载失败</Text>
              <Pressable onPress={() => load()} className="mt-3 rounded-full bg-[#D4522A] px-6 py-2">
                <Text className="text-[13px] font-bold text-white">重试</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* 常用粤语短语（GET /cultural?category=phrase） */}
              {phrases && phrases.length > 0 && (
                <View
                  className="mb-4 overflow-hidden rounded-xl bg-white"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
                >
                  <View className="flex-row items-center border-b border-[#F0EDE5] px-4 py-3">
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#D4522A" />
                    <Text className="ml-2 text-[15px] font-bold text-[#D4522A]">常用粤语短语</Text>
                  </View>
                  <View className="px-4 py-2">
                    {phrases.map((p) => (
                      <PhraseRow
                        key={p.id}
                        phrase={p}
                        isPlaying={playingId === p.canto}
                        onPlay={() => handlePlay(p.canto)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* 课程内容（GET /cultural?category=lesson） */}
              <Text className="mb-3 mt-2 text-[16px] font-bold text-[#333]">课程内容</Text>
              {(lessons ?? []).map((l) => (
                <View
                  key={l.id}
                  className="mb-2 flex-row items-center rounded-xl bg-white p-3.5"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}
                >
                  <View
                    className="h-[42px] w-[42px] items-center justify-center rounded-xl"
                    style={{ backgroundColor: (l.color || '#D4522A') + '1A' }}
                  >
                    <Ionicons name={(l.icon as any) || 'book-outline'} size={22} color={l.color || '#D4522A'} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[14px] font-bold text-[#333]">{l.title}</Text>
                    <Text className="mt-0.5 text-[12px] text-[#999]">
                      {l.subtitle} · {lessonCount(l.content)} 课时
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
