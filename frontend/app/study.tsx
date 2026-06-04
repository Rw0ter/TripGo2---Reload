import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface Topic { id: number; title: string; subtitle: string; content: string; icon: string; color: string; }

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[] | null>(null);

  const load = useCallback(async () => {
    try { setTopics(await apiRequest<Topic[]>('/cultural?category=topic')); }
    catch { setTopics(null); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <View className="flex-1 bg-[#fdf8f2]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: insets.top + 8 }} className="bg-[#476647] px-4 pb-5 shadow-sm">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </Pressable>
            <Text className="text-[18px] font-bold text-white">学习小课堂</Text>
          </View>
          <Text className="mt-2 text-[13px] text-white/75">探索岭南非遗文化，传承中华文明</Text>
        </View>

        <View className="px-4 pt-4">
          <View className="mb-2 flex-row items-center">
            <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#476647' }} />
            <Text className="ml-2 text-[16px] font-bold text-[#333]">非遗主题</Text>
          </View>
          {!topics ? (
            <View className="items-center py-10"><ActivityIndicator color="#476647" /></View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {topics.map((t) => {
                const quizId = (() => { try { return JSON.parse(t.content).quizId; } catch { return null; } })();
                return (
                  <Pressable key={t.id} onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: quizId ?? 1 } })}
                    style={{ width: '46%' }} className="rounded-xl bg-white p-3 shadow-sm">
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.color + '20' }} className="items-center justify-center">
                      <Ionicons name={t.icon as any} size={20} color={t.color} />
                    </View>
                    <Text className="mt-2 text-[14px] font-bold text-[#222]">{t.title}</Text>
                    <Text numberOfLines={1} className="mt-0.5 text-[12px] text-[#888]">{t.subtitle}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View className="mt-5 px-4">
          <View className="mb-2 flex-row items-center">
            <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#476647' }} />
            <Text className="ml-2 text-[16px] font-bold text-[#333]">视频学习</Text>
          </View>
          {[
            { title: '粤剧《帝女花》经典片段', duration: '5:32', icon: 'musical-notes' },
            { title: '广绣传承人现场演示', duration: '8:15', icon: 'color-palette' },
            { title: '佛山醒狮采青表演', duration: '3:48', icon: 'paw' },
          ].map((v, i) => (
            <Pressable key={i} className="mb-3 flex-row items-center overflow-hidden rounded-xl bg-white shadow-sm">
              <View style={{ width: 100, height: 64, backgroundColor: '#47664730' }} className="items-center justify-center">
                <Ionicons name={v.icon as any} size={24} color="#476647" />
              </View>
              <View className="flex-1 px-3">
                <Text numberOfLines={2} className="text-[13px] font-semibold text-[#333]">{v.title}</Text>
                <Text className="mt-1 text-[11px] text-[#999]">{v.duration}</Text>
              </View>
              <Ionicons name="play-circle" size={28} color="#476647" />
              <View style={{ width: 8 }} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
