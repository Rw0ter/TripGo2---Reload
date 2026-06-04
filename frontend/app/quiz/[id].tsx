import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────

interface Question {
  q: string;
  options: string[];
  answer: number;
}

interface QuizDetail {
  id: number;
  tag: string;
  title: string;
  desc: string;
  questions: Question[];
}

// ─── Offline fallback (matches Legacy history.html) ─────────────────

const OFFLINE_QUESTIONS: Question[] = [
  {
    q: '被誉为"岭南音乐活化石"的广东非遗代表是？',
    options: ['粤剧', '客家山歌', '广东音乐', '汉剧'],
    answer: 2,
  },
  {
    q: '广州著名的传统手工艺"广州牙雕"主要以什么原料制作？',
    options: ['竹子', '玉石', '象牙', '木材'],
    answer: 2,
  },
  {
    q: '被列为国家级非遗的"醒狮"起源于广东哪个地区？',
    options: ['广州', '佛山', '深圳', '惠州'],
    answer: 1,
  },
  {
    q: '广东非遗中"英歌舞"常在什么场合中表演？',
    options: ['婚礼庆典', '清明扫墓', '春节与庙会', '中秋祭月'],
    answer: 2,
  },
  {
    q: '广东传统饮食文化中被列为非遗的点心是？',
    options: ['肠粉', '虾饺', '烧麦', '云吞面'],
    answer: 1,
  },
];

const CONFETTI_COLORS = ['#ff5252', '#ffb300', '#4caf50', '#29b6f6', '#ab47bc'];

function pickOfflineQuestions(count = 5): Question[] {
  const pool = [...OFFLINE_QUESTIONS];
  const result: Question[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

// ─── Confetti particle ──────────────────────────────────────────────

function ConfettiParticle({
  color,
  dx,
  dy,
  duration,
}: {
  color: string;
  dx: number;
  dy: number;
  duration: number;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(tx, { toValue: dx, duration, useNativeDriver: true }),
      Animated.timing(ty, { toValue: dy, duration, useNativeDriver: true }),
      Animated.timing(rot, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0, duration, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 8,
        height: 14,
        backgroundColor: color,
        borderRadius: 2,
        opacity: op,
        transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
      }}
    />
  );
}

// ─── Confetti overlay ───────────────────────────────────────────────

function ConfettiOverlay({ visible }: { visible: boolean }) {
  const { width: sw, height: sh } = useWindowDimensions();

  const particles = useMemo(() => {
    if (!visible) return [];
    return Array.from({ length: 46 }, () => ({
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      key: Math.random().toString(36).slice(2),
      dx: (Math.random() - 0.5) * sw * 0.75,
      dy: -(Math.random() * sh * 0.3 + 50),
      duration: 1000 + Math.random() * 500,
    }));
  }, [visible, sw, sh]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      {particles.map((p) => (
        <ConfettiParticle
          key={p.key}
          color={p.color}
          dx={p.dx}
          dy={p.dy}
          duration={p.duration}
        />
      ))}
    </View>
  );
}

// ─── Cross-platform shadow ─────────────────────────────────────────

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  android: { elevation: 6 },
  default: {},
});

const btnShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  android: { elevation: 3 },
  default: {},
});

// ─── Main screen ────────────────────────────────────────────────────

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth * 0.9, 400);

  const [data, setData] = useState<QuizDetail | null>(null);
  const [offline, setOffline] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const awardedRef = useRef(false);

  // ─── Load quiz ─────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const result = await apiRequest<QuizDetail>(`/quiz/${id}`);
      setData(result);
      setOffline(false);
    } catch {
      setOffline(true);
      setData({
        id: Number(id) || 1,
        tag: '非遗文化',
        title: '广东非遗文化',
        desc: '离线题库',
        questions: pickOfflineQuestions(),
      });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // ─── Points awarding on completion ─────────────────────────────

  useEffect(() => {
    if (!done || awardedRef.current) return;
    awardedRef.current = true;
    setShowConfetti(true);
    apiRequest('/checkin/quiz', {
      method: 'POST',
      auth: true,
      body: { points: score },
    }).catch(() => {});
  }, [done, score]);

  // ─── Loading ───────────────────────────────────────────────────

  if (!data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-[#f9f7f0]"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#FFB300" />
        <Text className="mt-3 text-[14px] text-[#666]">题目生成中，请稍候...</Text>
      </View>
    );
  }

  const q = data.questions[qIdx];
  const isLast = qIdx === data.questions.length - 1;
  const correctCount = score / 10;

  // ─── Handlers ──────────────────────────────────────────────────

  const handleSelect = (i: number) => {
    if (submitted) return;
    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    if (selected === q.answer) setScore((s) => s + 10);
  };

  const handleNext = () => {
    if (isLast) {
      setDone(true);
    } else {
      setQIdx((n) => n + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  const handleRestart = () => {
    awardedRef.current = false;
    setQIdx(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setDone(false);
    setShowConfetti(false);
    if (offline) {
      setData((prev) =>
        prev ? { ...prev, questions: pickOfflineQuestions() } : null,
      );
    }
  };

  // ─── Completion screen ─────────────────────────────────────────

  if (done) {
    const passed = correctCount >= data.questions.length / 2;

    return (
      <View
        className="flex-1 items-center justify-center bg-[#f9f7f0]"
        style={{ paddingTop: insets.top }}
      >
        <ConfettiOverlay visible={showConfetti} />

        {/* Centered result card */}
        <View
          style={[{ width: cardWidth }, cardShadow]}
          className="rounded-2xl bg-white px-6 py-8"
        >
          <View className="items-center">
            {/* Trophy circle */}
            <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-[#FFF8E1]">
              <Ionicons name="trophy" size={44} color="#FFB300" />
            </View>

            <Text className="text-[22px] font-bold text-[#333]">
              {passed ? '恭喜通过！' : '答题结束！'}
            </Text>

            <Text className="mt-3 text-center text-[16px] leading-7 text-[#666]">
              你答对了{' '}
              <Text className="font-bold text-[#FFB300]">{correctCount}</Text>
              {' / '}
              <Text className="font-bold text-[#333]">{data.questions.length}</Text>
              {' 题'}
            </Text>

            <Text className="mt-1 text-[15px] font-semibold text-[#FFB300]">
              获得 {score} 积分
            </Text>

            {passed && (
              <Text className="mt-2 text-[28px]">{'🎉'}</Text>
            )}

            {/* Action buttons */}
            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={handleRestart}
                className="rounded-full bg-[#FFB300] px-8 py-2.5 active:opacity-80"
              >
                <Text className="text-[15px] font-semibold text-white">
                  再来一次
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                className="rounded-full border border-[#FFB300] px-8 py-2.5 active:opacity-80"
              >
                <Text className="text-[15px] font-semibold text-[#FFB300]">
                  退出答题
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─── Quiz card ─────────────────────────────────────────────────

  return (
    <View
      className="flex-1 items-center justify-center bg-[#f9f7f0]"
      style={{ paddingTop: insets.top }}
    >
      {/* ── Outer card ── */}
      <View
        style={[{ width: cardWidth }, cardShadow]}
        className="overflow-hidden rounded-2xl bg-white"
      >
        {/* ── Header gradient ── */}
        <LinearGradient
          colors={['#FFD54F', '#FFB300']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative px-4 pb-5 pt-4"
        >
          {/* Title */}
          <View className="flex-row items-center justify-center">
            <Text className="text-[20px] font-bold text-white">
              {data.title}
            </Text>
            {offline && (
              <Text className="ml-1 text-[12px] text-white/80">
                (离线模式)
              </Text>
            )}
          </View>

          {/* Score badge — top right */}
          <View className="absolute right-4 top-3 flex-row items-center rounded-full bg-white/20 px-3 py-1">
            <Ionicons name="cash" size={14} color="#fff" />
            <Text className="ml-1 text-[14px] font-semibold text-white">
              {score}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Back button — overlaps header/content boundary ── */}
        <Pressable
          onPress={() => router.back()}
          style={[
            {
              position: 'absolute',
              left: 10,
              top: 52,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.95)',
              alignItems: 'center',
              justifyContent: 'center',
            },
            btnShadow,
          ]}
        >
          <Ionicons name="chevron-back" size={16} color="#333" />
        </Pressable>

        {/* ── Body ── */}
        <View className="px-5 pb-5 pt-3">
          {/* Question number */}
          <Text className="text-center text-[20px] font-bold text-[#333]">
            {qIdx + 1}
          </Text>

          {/* Question text */}
          <Text className="mt-3 text-left text-[15px] leading-6 text-[#333]">
            {q.q}
          </Text>

          {/* ── Options ── */}
          <View className="mt-4 gap-2.5">
            {q.options.map((opt, i) => {
              let bg = 'bg-white';
              let border = 'border-[#eee]';
              let textCls = 'text-[#333]';
              let checkIcon: string | null = null;
              let checkColor = '';

              if (submitted) {
                if (i === q.answer) {
                  bg = 'bg-[#E8F5E9]';
                  border = 'border-[#4CAF50]';
                  textCls = 'text-[#2E7D32]';
                  checkIcon = 'checkmark-circle';
                  checkColor = '#4CAF50';
                } else if (i === selected) {
                  bg = 'bg-[#FFEBEE]';
                  border = 'border-[#F44336]';
                  textCls = 'text-[#C62828]';
                  checkIcon = 'close-circle';
                  checkColor = '#F44336';
                }
              } else if (i === selected) {
                bg = 'bg-[#FFF8E1]';
                border = 'border-[#FFB300]';
              }

              return (
                <Pressable
                  key={i}
                  onPress={() => handleSelect(i)}
                  disabled={submitted}
                  className={`rounded-full border px-5 py-3 ${bg} ${border} ${submitted ? '' : 'active:opacity-80'}`}
                >
                  <View className="flex-row items-center justify-center">
                    {checkIcon && (
                      <Ionicons
                        name={checkIcon as any}
                        size={18}
                        color={checkColor}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      className={`text-center text-[15px] font-semibold ${textCls}`}
                    >
                      {opt}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ── Buttons ── */}
          <View className="mt-5 flex-row justify-center">
            {!submitted ? (
              <Pressable
                onPress={handleSubmit}
                disabled={selected === null}
                className={`rounded-full px-10 py-2.5 ${
                  selected === null ? 'bg-[#ccc]' : 'bg-[#FFB300] active:opacity-80'
                }`}
              >
                <Text className="text-[15px] font-semibold text-white">
                  提交
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleNext}
                className="rounded-full bg-[#FFB300] px-10 py-2.5 active:opacity-80"
              >
                <Text className="text-[15px] font-semibold text-white">
                  {isLast ? '查看结果' : '下一题'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Progress bar ── */}
          <View className="mt-4">
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-[#eee]">
              <View
                className="h-full rounded-full bg-[#FFB300]"
                style={{
                  width: `${((qIdx + 1) / data.questions.length) * 100}%`,
                }}
              />
            </View>
            <Text className="mt-1 text-center text-[13px] text-[#666]">
              进度: {qIdx + 1}/{data.questions.length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
