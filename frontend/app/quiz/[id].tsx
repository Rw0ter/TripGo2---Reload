import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────
// answer 仅离线题库本地携带；在线题目由后端剥离，判分走 /quiz/:id/check|submit。
interface Question { q: string; options: string[]; answer?: number; }
interface QuizDetail { id: number; tag: string; title: string; desc: string; questions: Question[]; }

// ── Offline fallback ──────────────────────────────────────
const OFFLINE_QUESTIONS: Question[] = [
  { q: '被誉为"岭南音乐活化石"的广东非遗代表是？', options: ['粤剧', '客家山歌', '广东音乐', '汉剧'], answer: 2 },
  { q: '广州著名的传统手工艺"广州牙雕"主要以什么原料制作？', options: ['竹子', '玉石', '象牙', '木材'], answer: 2 },
  { q: '被列为国家级非遗的"醒狮"起源于广东哪个地区？', options: ['广州', '佛山', '深圳', '惠州'], answer: 1 },
  { q: '广东非遗中"英歌舞"常在什么场合中表演？', options: ['婚礼庆典', '清明扫墓', '春节与庙会', '中秋祭月'], answer: 2 },
  { q: '广东传统饮食文化中被列为非遗的点心是？', options: ['肠粉', '虾饺', '烧麦', '云吞面'], answer: 1 },
];

function pickOfflineQuestions(count = 5): Question[] {
  const pool = [...OFFLINE_QUESTIONS];
  const result: Question[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return result;
}

const LABELS = ['A', 'B', 'C', 'D'];

// ── Main ──────────────────────────────────────────────────
export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [data, setData] = useState<QuizDetail | null>(null);
  const [offline, setOffline] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, number>>({}); // qIdx -> 正确答案
  const [answers, setAnswers] = useState<number[]>([]); // qIdx -> 所选
  const [score, setScore] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0); // 服务端权威答对数
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setData(await apiRequest<QuizDetail>(`/quiz/${id}`));
      setOffline(false);
    } catch {
      setOffline(true);
      setData({ id: Number(id) || 1, tag: '非遗文化', title: '广东非遗文化', desc: '离线题库', questions: pickOfflineQuestions() });
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  // ── Loading ───────────────────────────────────────────
  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#386641" />
        <Text className="mt-4 text-[14px] text-[#999]">题目加载中…</Text>
      </View>
    );
  }

  const q = data.questions[qIdx];
  const isLast = qIdx === data.questions.length - 1;
  const total = data.questions.length;
  const pct = ((qIdx + 1) / total) * 100;

  const handleSelect = (i: number) => { if (!submitted) setSelected(i); };

  // 提交单题：在线走后端逐题校验，离线本地判分。
  const handleSubmit = async () => {
    if (selected === null || submitted || submitting) return;
    const choice = selected;
    setAnswers((a) => { const c = a.slice(); c[qIdx] = choice; return c; });

    if (offline) {
      const ans = q.answer ?? 0;
      setRevealed((r) => ({ ...r, [qIdx]: ans }));
      if (choice === ans) setScore((s) => s + 10);
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ correct: boolean; answer: number }>(
        `/quiz/${data.id}/check`,
        { method: 'POST', body: { questionIndex: qIdx, choice } },
      );
      setRevealed((r) => ({ ...r, [qIdx]: res.answer }));
      if (res.correct) setScore((s) => s + 10);
    } catch {
      // 校验失败：仅标记已提交，不显示对错（answer 缺省）
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  // 完成：在线提交全部答案由服务端权威判分 + 发积分；离线用本地分数。
  const finish = async () => {
    if (offline) {
      setCorrectTotal(score / 10);
      setDone(true);
      return;
    }
    try {
      const res = await apiRequest<{ total: number; correct: number; score: number }>(
        `/quiz/${data.id}/submit`,
        { method: 'POST', auth: true, body: { answers } },
      );
      setScore(res.score);
      setCorrectTotal(res.correct);
    } catch {
      setCorrectTotal(score / 10); // 兜底用本地累计
    }
    setDone(true);
  };

  const handleNext = () => {
    if (isLast) { void finish(); }
    else { setQIdx((n) => n + 1); setSelected(null); setSubmitted(false); }
  };

  const handleRestart = () => {
    setQIdx(0); setSelected(null); setSubmitted(false); setSubmitting(false);
    setRevealed({}); setAnswers([]); setScore(0); setCorrectTotal(0); setDone(false);
    if (offline) setData((prev) => prev ? { ...prev, questions: pickOfflineQuestions() } : null);
  };

  // ── Completion screen ──────────────────────────────────
  if (done) {
    const correctCount = correctTotal;
    const passed = correctCount >= total / 2;

    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="答题结果" tint="light" />

        <View className="flex-1 items-center justify-center px-6" style={{ paddingBottom: insets.bottom + 40 }}>
          <RNAnimated.View>
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-[#E8F5E9]">
              <Ionicons name={passed ? 'trophy' : 'school'} size={48} color="#386641" />
            </View>
          </RNAnimated.View>

          <Text className="text-[24px] font-bold text-[#111]">{passed ? '恭喜通过' : '继续加油'}</Text>
          <Text className="mt-2 text-center text-[15px] leading-6 text-[#666]">
            {passed ? '你对岭南文化的了解非常扎实！' : '多了解一些非遗知识，下次一定能通过～'}
          </Text>

          <View className="mt-8 w-full max-w-sm rounded-2xl bg-[#F9F9F9] p-6 shadow-sm" style={{ shadowColor: '#000', shadowOpacity: 0.41, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-[#555]">正确题数</Text>
              <Text className="text-[18px] font-bold text-[#386641]">{correctCount} / {total}</Text>
            </View>
            <View className="mt-3 h-px bg-[#ECECEC]" />
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-[#555]">获得积分</Text>
              <Text className="text-[18px] font-bold text-[#386641]">+{score}</Text>
            </View>
          </View>

          <View className="mt-8 flex-row gap-3">
            <Pressable onPress={handleRestart} className="rounded-xl bg-[#386641] px-8 py-3.5 active:opacity-80">
              <Text className="text-[16px] font-semibold text-white">再来一次</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} className="rounded-xl border border-[#ddd] px-8 py-3.5 active:bg-[#F5F5F5]">
              <Text className="text-[16px] font-semibold text-[#555]">退出</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Quiz screen ────────────────────────────────────────
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={data.title} tint="light" right={
        <View className="flex-row items-center rounded-full bg-[#F5F5F5] px-3 py-1.5">
          <Ionicons name="star" size={14} color="#386641" />
          <Text className="ml-1 text-[14px] font-semibold text-[#386641]">{score}</Text>
        </View>
      } />

      <View className="h-0.5 bg-[#F0F0F0]">
        <RNAnimated.View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#386641' }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 60 }}>
        {offline && (
          <View className="mb-3 self-start rounded-md bg-[#FFF3E0] px-2.5 py-0.5">
            <Text className="text-[11px] font-medium text-[#E65100]">离线模式</Text>
          </View>
        )}

        <Text className="text-[13px] font-medium uppercase tracking-widest text-[#999]">
          第 {qIdx + 1} 题 · 共 {total} 题
        </Text>

        <Animated.View entering={FadeInDown.delay(50).springify()} key={`q-${qIdx}`}>
          <Text className="mt-3 text-[20px] font-bold leading-7 text-[#111]">
            {q.q}
          </Text>
        </Animated.View>

        <View className="mt-6" style={{ gap: 10 }}>
          {q.options.map((opt, i) => (
            <OptionButton key={`${qIdx}-${i}`} index={qIdx} optIdx={i} label={LABELS[i]} text={opt}
              answer={revealed[qIdx] ?? -1} selected={selected} submitted={submitted}
              onPress={() => handleSelect(i)} />
          ))}
        </View>
      </ScrollView>

      <View className="px-5 pt-2" style={{ paddingBottom: insets.bottom + 10 }}>
        {!submitted ? (
          <Pressable
            onPress={handleSubmit}
            disabled={selected === null || submitting}
            className={`w-full items-center rounded-2xl py-4 ${selected === null || submitting ? 'bg-[#E5E5E5]' : 'bg-[#386641]'}`}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className={`text-[16px] font-bold ${selected === null ? 'text-[#bbb]' : 'text-white'}`}>
                提交答案
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            className="w-full items-center rounded-2xl bg-[#386641] py-4 active:opacity-80">
            <Text className="text-[16px] font-bold text-white">
              {isLast ? '查看结果' : '下一题'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Option button with animated feedback ──────────────────
function OptionButton({
  index, optIdx, label, text, answer, selected, submitted, onPress,
}: {
  index: number; optIdx: number; answer: number; selected: number | null;
  submitted: boolean; label: string; text: string; onPress: () => void;
}) {
  const isCorrect = submitted && optIdx === answer;
  const isWrong = submitted && optIdx === selected && optIdx !== answer;
  const isPicked = !submitted && selected === optIdx;

  let borderColor = '#E8E8E8';
  let bg = '#fff';
  let labelBg = '#F5F5F5';
  let labelColor = '#888';

  if (isCorrect)  { borderColor = '#386641'; bg = '#F0F7F0'; labelBg = '#386641'; labelColor = '#fff'; }
  if (isWrong)    { borderColor = '#E53935'; bg = '#FFF5F5'; labelBg = '#E53935'; labelColor = '#fff'; }
  if (isPicked)   { borderColor = '#386641'; bg = '#F0F7F0'; labelBg = '#386641'; labelColor = '#fff'; }

  return (
    <Animated.View entering={FadeInDown.delay(index * 60 + 300).springify()} key={`opt-${index}-${optIdx}`}>
      <Pressable
        onPress={onPress}
        disabled={submitted}
        className="flex-row items-center rounded-2xl border px-4 py-4 active:scale-[0.98]"
        style={{ borderColor, backgroundColor: bg }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: labelBg }} className="items-center justify-center">
          <Text style={{ color: labelColor }} className="text-[14px] font-bold">{label}</Text>
        </View>
        <Text className="ml-3 flex-1 text-[15px] font-medium text-[#222]">{text}</Text>
        {isCorrect && <Ionicons name="checkmark-circle" size={22} color="#386641" />}
        {isWrong && <Ionicons name="close-circle" size={22} color="#E53935" />}
      </Pressable>
    </Animated.View>
  );
}
