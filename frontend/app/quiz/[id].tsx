import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface Question { q: string; options: string[]; answer: number; }
interface QuizDetail { id: number; tag: string; title: string; desc: string; questions: Question[]; }

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<QuizDetail | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try { setData(await apiRequest<QuizDetail>(`/quiz/${id}`)); }
    catch {}
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (!data) return (
    <View className="flex-1 items-center justify-center bg-[#f9f7f0]">
      <ActivityIndicator color="#FFB300" />
    </View>
  );

  const q = data.questions[qIdx];
  const correct = selected !== null && selected === q?.answer;
  const wrong = selected !== null && selected !== q?.answer;

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    setShowResult(true);
    if (i === q.answer) setScore((s) => s + 10);
    setTimeout(() => {
      if (qIdx + 1 < data!.questions.length) {
        setQIdx((n) => n + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setDone(true);
      }
    }, 800);
  }

  return (
    <View className="flex-1 bg-[#f9f7f0]">
      {/* Header — matching Legacy history.html */}
      <View style={{ paddingTop: insets.top + 6 }} className="bg-[#FFB300] pb-4">
        <View className="flex-row items-center justify-between px-4">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text className="text-[18px] font-bold text-white">{data.title}</Text>
          <View className="flex-row items-center rounded-full bg-white/20 px-3 py-1">
            <Ionicons name="star" size={14} color="#fff" />
            <Text className="ml-1 text-[14px] font-semibold text-white">{score}</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View className="mx-4 mt-2 flex-row gap-1">
          {data.questions.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 1.5, backgroundColor: i <= qIdx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {done ? (
          <View className="items-center pt-8">
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFB300' }} className="items-center justify-center">
              <Ionicons name="trophy" size={40} color="#fff" />
            </View>
            <Text className="mt-4 text-[22px] font-bold text-[#333]">答题完成！</Text>
            <Text className="mt-2 text-[16px] text-[#666]">
              得分：<Text className="font-bold text-[#FFB300]">{score} 分</Text>
            </Text>
            <Text className="mt-1 text-[13px] text-[#999]">
              正确 {score / 10} / {data.questions.length} 题
            </Text>
            <Pressable onPress={() => router.back()} className="mt-6 rounded-full bg-[#FFB300] px-10 py-3">
              <Text className="text-[15px] font-bold text-white">返回</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <View className="self-start rounded-full bg-[#FFB300]/10 px-3 py-1">
                <Text className="text-[12px] font-semibold text-[#FFB300]">第 {qIdx + 1}/{data.questions.length} 题</Text>
              </View>
              <Text className="mt-3 text-[16px] leading-6 text-[#333]">{q.q}</Text>
            </View>

            <View className="mt-4 gap-2.5">
              {q.options.map((opt, i) => {
                let bg = 'bg-white';
                let border = 'border-[#eee]';
                if (showResult) {
                  if (i === q.answer) { bg = 'bg-[#E8F5E9]'; border = 'border-[#4CAF50]'; }
                  else if (wrong && i === selected) { bg = 'bg-[#FFEBEE]'; border = 'border-[#F44336]'; }
                } else if (i === selected) { bg = 'bg-[#FFF8E1]'; border = 'border-[#FFB300]'; }
                return (
                  <Pressable key={i} onPress={() => handleSelect(i)}
                    className={`rounded-xl border ${border} ${bg} px-4 py-3.5`}>
                    <View className="flex-row items-center">
                      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: showResult && i === q.answer ? '#4CAF50' : '#f0ead6' }} className="items-center justify-center">
                        <Text style={{ color: showResult && i === q.answer ? '#fff' : '#888' }} className="text-[12px] font-bold">{['A', 'B', 'C', 'D'][i]}</Text>
                      </View>
                      <Text className="ml-3 flex-1 text-[15px] text-[#333]">{opt}</Text>
                      {showResult && i === q.answer ? <Ionicons name="checkmark-circle" size={20} color="#4CAF50" /> : null}
                      {wrong && i === selected ? <Ionicons name="close-circle" size={20} color="#F44336" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
