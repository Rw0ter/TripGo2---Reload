import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────
// answer 仅离线题库本地携带；在线题目由后端剥离，判分走 /quiz/:id/check|submit。
interface Question { q: string; options: string[]; answer?: number; }
interface QuizDetail { id: number; tag: string; title: string; desc: string; questions: Question[]; }

// ── 离线兜底（断网时本地判分，绿色低碳题）──────────────────
const OFFLINE_QUESTIONS: Question[] = [
  { q: '以下哪种气体是主要的温室气体？', options: ['氧气', '二氧化碳', '氮气', '氢气'], answer: 1 },
  { q: '以下哪项不属于可再生能源？', options: ['太阳能', '风能', '煤炭', '水能'], answer: 2 },
  { q: '全球变暖的主要原因是？', options: ['火山喷发', '太阳活动', '人类活动排放温室气体', '地球公转'], answer: 2 },
  { q: '以下哪种交通方式碳排放最低？', options: ['私家车', '公交车', '高铁', '自行车'], answer: 3 },
  { q: '废旧电池应投入哪类垃圾？', options: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'], answer: 2 },
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
      setData({ id: Number(id) || 1, tag: '绿色低碳', title: '绿色低碳知识', desc: '离线题库', questions: pickOfflineQuestions() });
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  // ── Loading ───────────────────────────────────────────
  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-eco-cream">
        <ActivityIndicator size="large" color="#40916C" />
        <Text className="mt-4 text-[14px] text-eco-mid/70">题目加载中…</Text>
      </View>
    );
  }

  const q = data.questions[qIdx];
  const isLast = qIdx === data.questions.length - 1;
  const total = data.questions.length;

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
      void Haptics.notificationAsync(
        choice === ans ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
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
      void Haptics.notificationAsync(
        res.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
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

  // ── 完成页 ─────────────────────────────────────────────
  if (done) {
    const correctCount = correctTotal;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = correctCount >= total / 2;

    return (
      <View className="flex-1 bg-eco-cream">
        <ScreenHeader title="答题结果" tint="light" />
        <View className="flex-1 items-center justify-center px-6" style={{ paddingBottom: insets.bottom + 40 }}>
          {/* 正确率环（裁切渐变近似进度环） */}
          <Animated.View entering={FadeIn.duration(500)} className="items-center">
            <View
              className="h-40 w-40 items-center justify-center rounded-full"
              style={{ borderWidth: 12, borderColor: passed ? '#52B788' : '#E9D8A6' }}>
              <Text className="text-[40px] font-extrabold text-eco-dark">{accuracy}%</Text>
              <Text className="text-[12px] text-eco-mid/70">正确率</Text>
            </View>
          </Animated.View>

          <Text className="mt-6 text-[24px] font-extrabold text-eco-dark">{passed ? '太棒了！' : '再接再厉'}</Text>
          <Text className="mt-2 text-center text-[15px] leading-6 text-eco-mid/80">
            {passed ? '你是名副其实的低碳生活达人，继续守护绿色地球！' : '多了解一些绿色低碳知识，下次一定能拿高分～'}
          </Text>

          <View className="mt-8 w-full max-w-sm rounded-3xl bg-white p-6" style={{ boxShadow: '0px 6px 20px rgba(45,106,79,0.1)' }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-eco-mid">正确题数</Text>
              <Text className="text-[18px] font-extrabold text-eco">{correctCount} / {total}</Text>
            </View>
            <View className="my-3 h-px bg-eco-pale" />
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-eco-mid">获得积分</Text>
              <Text className="text-[18px] font-extrabold text-eco">+{score}</Text>
            </View>
          </View>

          <View className="mt-8 flex-row gap-3">
            <Pressable onPress={handleRestart} className="rounded-2xl bg-eco px-9 py-3.5 active:opacity-80">
              <Text className="text-[16px] font-bold text-white">再来一次</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} className="rounded-2xl border border-eco-pale px-9 py-3.5 active:bg-eco-pale/40">
              <Text className="text-[16px] font-bold text-eco-mid">完成</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── 答题页 ─────────────────────────────────────────────
  return (
    <View className="flex-1 bg-eco-cream">
      <ScreenHeader title={data.title} tint="light" right={
        <View className="flex-row items-center rounded-full bg-eco-pale px-3 py-1.5">
          <Ionicons name="leaf" size={14} color="#40916C" />
          <Text className="ml-1 text-[14px] font-bold text-eco">{score}</Text>
        </View>
      } />

      {/* 分段进度 */}
      <View className="flex-row gap-1.5 px-5 pt-3">
        {data.questions.map((_, i) => {
          const ans = answers[i];
          const correct = revealed[i] !== undefined && ans === revealed[i];
          const answered = ans !== undefined && revealed[i] !== undefined;
          let color = '#E4EFE7';
          if (i === qIdx) color = '#52B788';
          else if (answered) color = correct ? '#40916C' : '#E07A5F';
          return <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: color }} />;
        })}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        {offline && (
          <View className="mb-3 self-start rounded-md bg-[#FFF3E0] px-2.5 py-0.5">
            <Text className="text-[11px] font-medium text-[#E65100]">离线模式</Text>
          </View>
        )}

        <Text className="text-[12px] font-semibold uppercase tracking-widest text-eco-mid/60">
          第 {qIdx + 1} 题 / 共 {total} 题
        </Text>

        <Animated.View entering={FadeInDown.delay(50).springify()} key={`q-${qIdx}`}>
          <Text className="mt-3 text-[21px] font-bold leading-8 text-eco-dark">{q.q}</Text>
        </Animated.View>

        <View className="mt-6" style={{ gap: 10 }}>
          {q.options.map((opt, i) => (
            <OptionButton key={`${qIdx}-${i}`} index={i} optIdx={i} label={LABELS[i]} text={opt}
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
            className={`w-full items-center rounded-2xl py-4 ${selected === null || submitting ? 'bg-[#D7E4DB]' : 'bg-eco'}`}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className={`text-[16px] font-bold ${selected === null ? 'text-eco-mid/50' : 'text-white'}`}>提交答案</Text>
            )}
          </Pressable>
        ) : (
          <Pressable onPress={handleNext} className="w-full items-center rounded-2xl bg-eco py-4 active:opacity-80">
            <Text className="text-[16px] font-bold text-white">{isLast ? '查看结果' : '下一题'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── 选项按钮（提交后高亮对错）──────────────────────────────
function OptionButton({
  index, optIdx, label, text, answer, selected, submitted, onPress,
}: {
  index: number; optIdx: number; answer: number; selected: number | null;
  submitted: boolean; label: string; text: string; onPress: () => void;
}) {
  const isCorrect = submitted && optIdx === answer;
  const isWrong = submitted && optIdx === selected && optIdx !== answer;
  const isPicked = !submitted && selected === optIdx;

  let borderColor = '#E4EFE7';
  let bg = '#fff';
  let labelBg = '#EDF5EF';
  let labelColor = '#6E9A85';

  if (isPicked) { borderColor = '#52B788'; bg = '#F0FAF3'; labelBg = '#40916C'; labelColor = '#fff'; }
  if (isCorrect) { borderColor = '#40916C'; bg = '#EAF7EF'; labelBg = '#40916C'; labelColor = '#fff'; }
  if (isWrong) { borderColor = '#E07A5F'; bg = '#FCF0EC'; labelBg = '#E07A5F'; labelColor = '#fff'; }

  return (
    <Animated.View entering={FadeInDown.delay(index * 60 + 120).springify()}>
      <Pressable
        onPress={onPress}
        disabled={submitted}
        className="flex-row items-center rounded-2xl border px-4 py-4 active:scale-[0.98]"
        style={{ borderColor, backgroundColor: bg }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: labelBg }} className="items-center justify-center">
          <Text style={{ color: labelColor }} className="text-[14px] font-bold">{label}</Text>
        </View>
        <Text className="ml-3 flex-1 text-[15px] font-medium text-eco-dark">{text}</Text>
        {isCorrect && <Ionicons name="checkmark-circle" size={22} color="#40916C" />}
        {isWrong && <Ionicons name="close-circle" size={22} color="#E07A5F" />}
      </Pressable>
    </Animated.View>
  );
}
