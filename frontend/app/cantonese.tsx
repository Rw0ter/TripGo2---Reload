import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface Cultural { id: number; title: string; subtitle: string; content: string; icon: string; color: string; }

export default function CantoneseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phrases, setPhrases] = useState<Cultural[] | null>(null);
  const [lessons, setLessons] = useState<Cultural[] | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, l] = await Promise.all([
        apiRequest<Cultural[]>('/cultural?category=phrase'),
        apiRequest<Cultural[]>('/cultural?category=lesson'),
      ]);
      setPhrases(p);
      setLessons(l);
    } catch { setPhrases(null); setLessons(null); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <View className="flex-1 bg-[#FFF8F0]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: insets.top + 6 }} className="bg-[#D4522A] pb-8">
          <View className="flex-row items-center px-4">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Text className="text-[18px] font-bold text-white">粤语课堂</Text>
          </View>
          <Text className="mt-4 text-center text-[40px]">🗣️</Text>
          <Text className="mt-2 text-center text-[15px] text-white/80">学说广东话 · 传承岭南音</Text>
        </View>

        <View style={{ marginTop: -16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} className="bg-[#FFF8F0] px-4 pt-5">
          <Text className="mb-2 text-[16px] font-bold text-[#333]">常用短语</Text>
          {!phrases ? (
            <View className="items-center py-6"><ActivityIndicator color="#D4522A" /></View>
          ) : (
            phrases.map((p) => (
              <View key={p.id} className="mb-2 flex-row items-center rounded-xl bg-white p-3 shadow-sm">
                <Text className="text-[24px]">{p.content}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-[14px] font-bold text-[#333]">{p.title}</Text>
                  <Text className="mt-0.5 text-[12px] text-[#999]">{p.subtitle}</Text>
                </View>
                <Pressable className="rounded-full bg-[#D4522A]/10 px-3 py-1.5">
                  <Ionicons name="volume-high" size={18} color="#D4522A" />
                </Pressable>
              </View>
            ))
          )}

          <Text className="mb-2 mt-5 text-[16px] font-bold text-[#333]">课程内容</Text>
          {!lessons ? (
            <View className="items-center py-6"><ActivityIndicator color="#D4522A" /></View>
          ) : (
            lessons.map((l) => (
              <Pressable key={l.id} className="mb-2 flex-row items-center rounded-xl bg-white p-3.5 shadow-sm">
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: l.color + '20' }} className="items-center justify-center">
                  <Ionicons name={l.icon as any} size={22} color={l.color} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[14px] font-bold text-[#333]">{l.title}</Text>
                  <Text className="mt-0.5 text-[12px] text-[#999]">{l.subtitle} · {(() => { try { return JSON.parse(l.content).lessons; } catch { return '?'; } })()} 课时</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
