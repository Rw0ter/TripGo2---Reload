import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Pressable, ScrollView, Text, View, Animated as RNAnimated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { speak, stop } from 'expo-speech';

// ── Phrase data ──────────────────────────────────────────────

const GREETING_PHRASES = [
  { canto: '你好', jyutping: 'nei5 hou2', meaning: 'Hello', emoji: '👋' },
  { canto: '早晨', jyutping: 'zou2 san4', meaning: 'Good morning', emoji: '🌅' },
  { canto: '晚安', jyutping: 'maan5 on1', meaning: 'Good night', emoji: '🌙' },
  { canto: '再見', jyutping: 'zoi3 gin3', meaning: 'Goodbye', emoji: '👋' },
];

const FOOD_PHRASES = [
  { canto: '食咗饭未?', jyutping: 'sik6 zo2 faan6 mei6?', meaning: 'Have you eaten?', emoji: '🍚' },
  { canto: '多谢', jyutping: 'do1 ze6', meaning: 'Thank you', emoji: '🙏' },
  { canto: '唔该', jyutping: 'm4 goi1', meaning: 'Please / Excuse me', emoji: '😊' },
  { canto: '好好味', jyutping: 'hou2 hou2 mei6', meaning: 'Very delicious', emoji: '😋' },
  { canto: '饮茶', jyutping: 'jam2 caa4', meaning: 'Drink tea / Yum cha', emoji: '🍵' },
  { canto: '埋单', jyutping: 'maai4 daan1', meaning: 'Check please', emoji: '💰' },
];

const LESSONS = [
  { title: '粤语拼音入门', desc: '学习粤拼基本规则', icon: 'text-outline', lessons: 5 },
  { title: '日常对话', desc: '问候、购物、出行', icon: 'chatbubbles-outline', lessons: 10 },
  { title: '饮食文化', desc: '茶楼点餐、美食表达', icon: 'restaurant-outline', lessons: 6 },
  { title: '岭南俗语', desc: '地道俚语和谚语', icon: 'book-outline', lessons: 8 },
  { title: '粤语故事', desc: '民间传说与历史典故', icon: 'library-outline', lessons: 4 },
];

// ── Play-button icon component with pulse animation ──────────

function PlayButton({ onPress, isPlaying }: { onPress: () => void; isPlaying: boolean }) {
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  function handlePress() {
    // quick scale bounce
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

// ── Phrase row ───────────────────────────────────────────────

function PhraseRow({
  phrase,
  isPlaying,
  onPlay,
}: {
  phrase: (typeof GREETING_PHRASES)[0];
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const router = useRouter();

  function handlePlay() {
    onPlay();
    // Speak Cantonese text using expo-speech with Cantonese voice
    speak(phrase.canto, { language: 'zh-HK', rate: 0.8 });
  }

  return (
    <Pressable
      onPress={handlePlay}
      className="mb-2 flex-row items-center rounded-xl bg-white px-3 py-3 shadow-sm active:bg-[#F5F5F5]"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Emoji */}
      <Text className="text-[26px]">{phrase.emoji}</Text>

      {/* Text block */}
      <View className="ml-3 flex-1">
        <Text className="text-[16px] font-bold text-[#333]">{phrase.canto}</Text>
        <Text className="mt-0.5 text-[13px] font-medium text-[#D4522A]">{phrase.jyutping}</Text>
        <Text className="mt-0.5 text-[12px] text-[#999]">{phrase.meaning}</Text>
      </View>

      <PlayButton onPress={handlePlay} isPlaying={isPlaying} />
    </Pressable>
  );
}

// ── Category card ────────────────────────────────────────────

function CategoryCard({
  title,
  icon,
  phrases,
  playingId,
  onPlay,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  phrases: typeof GREETING_PHRASES;
  playingId: string | null;
  onPlay: (id: string) => void;
}) {
  return (
    <View className="mb-4 overflow-hidden rounded-xl bg-white" style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    }}>
      {/* Category header */}
      <View className="flex-row items-center border-b border-[#F0EDE5] px-4 py-3">
        <Ionicons name={icon} size={20} color="#D4522A" />
        <Text className="ml-2 text-[15px] font-bold text-[#D4522A]">{title}</Text>
      </View>

      {/* Phrase list */}
      <View className="px-4 py-2">
        {phrases.map((p) => (
          <PhraseRow
            key={p.canto}
            phrase={p}
            isPlaying={playingId === p.canto}
            onPlay={() => onPlay(p.canto)}
          />
        ))}
      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────

export default function CantoneseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playingRef = useRef<string | null>(null);

  function handlePlay(phraseId: string) {
    // When a phrase starts playing, mark it as active.
    // After ~2 seconds (typical short phrase length), clear the indicator.
    if (playingRef.current) {
      // Stop previous speech before starting new one
      stop();
    }
    playingRef.current = phraseId;
    setPlayingId(phraseId);

    speak(phraseId, {
      language: 'zh-HK',
      rate: 0.8,
      onDone: () => {
        playingRef.current = null;
        setPlayingId(null);
      },
      onError: () => {
        playingRef.current = null;
        setPlayingId(null);
      },
      onStopped: () => {
        playingRef.current = null;
        setPlayingId(null);
      },
    });
  }

  return (
    <View className="flex-1 bg-[#F8F5E6]">
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Header ── */}
        <View style={{ paddingTop: insets.top + 6 }} className="bg-[#D4522A] pb-10">
          {/* Back row */}
          <View className="flex-row items-center px-4">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Text className="text-[18px] font-bold text-white">粤语课堂</Text>
          </View>

          {/* Title area */}
          <View className="mt-5 items-center">
            <Text className="text-[48px]">🗣️</Text>
            <Text className="mt-3 text-[28px] font-bold text-white">粤语课堂</Text>
            <Text className="mt-2 text-[14px] text-white/80">学说广东话 · 传承岭南音</Text>
          </View>
        </View>

        {/* ── Body (overlaps header bottom slightly) ── */}
        <View
          style={{ marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          className="bg-[#F8F5E6] px-4 pt-5"
        >
          {/* ── TTS hint ── */}
          <View className="mx-1 mb-4 flex-row items-center rounded-lg bg-[#D4522A]/8 px-3 py-2.5">
            <Ionicons name="bulb-outline" size={18} color="#D4522A" />
            <Text className="ml-2 flex-1 text-[12px] text-[#D4522A]/80">
              点击任意短语或喇叭按钮，即可听到粤语真人发音
            </Text>
          </View>

          {/* ── Category: Daily Greetings ── */}
          <CategoryCard
            title="日常招呼用语"
            icon="chatbubble-ellipses-outline"
            phrases={GREETING_PHRASES}
            playingId={playingId}
            onPlay={handlePlay}
          />

          {/* ── Category: Food Phrases ── */}
          <CategoryCard
            title="饮食相关用语"
            icon="restaurant-outline"
            phrases={FOOD_PHRASES}
            playingId={playingId}
            onPlay={handlePlay}
          />

          {/* ── Lesson cards section ── */}
          <Text className="mb-3 mt-2 text-[16px] font-bold text-[#333]">课程内容</Text>
          {LESSONS.map((l) => (
            <Pressable
              key={l.title}
              className="mb-2 flex-row items-center rounded-xl bg-white p-3.5 active:bg-[#F5F5F5]"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 1,
              }}
              onPress={() => {
                // Navigate or could open a modal / detail in the future
                // For now just give haptic-style visual feedback via the active state
              }}
            >
              <View
                className="h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#D4522A]/10"
              >
                <Ionicons name={l.icon as any} size={22} color="#D4522A" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold text-[#333]">{l.title}</Text>
                <Text className="mt-0.5 text-[12px] text-[#999]">
                  {l.desc} · {l.lessons} 课时
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
