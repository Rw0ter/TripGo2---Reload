import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface LikedStory { id: number; title: string; author: { username: string }; createdAt: string; liked: boolean; }

export default function MyLikesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [stories, setStories] = useState<LikedStory[] | null>(null);

  // Fetch all stories and filter by liked client-side
  const load = useCallback(async () => {
    try {
      const all = await apiRequest<LikedStory[]>('/stories', { auth: true });
      setStories(all.filter((s) => s.liked));
    } catch { setStories(null); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center bg-white px-4 pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <View className="flex-row items-center">
          <Ionicons name="heart" size={18} color="#C0584B" />
          <Text className="ml-1.5 text-[17px] font-bold text-[#333]">我的点赞</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {!stories ? (
          <View className="items-center py-12"><ActivityIndicator color="#C0584B" /></View>
        ) : stories.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="heart-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">还没有点赞过任何故事</Text>
            <Pressable onPress={() => router.push('/community')} className="mt-4 rounded-full bg-[#C0584B]/10 px-6 py-2.5">
              <Text className="text-[13px] font-semibold text-[#C0584B]">去社区发现精彩</Text>
            </Pressable>
          </View>
        ) : (
          stories.map((s) => (
            <Pressable key={s.id} onPress={() => router.push({ pathname: '/story/[id]', params: { id: s.id } })}
              className="mb-3 flex-row items-center rounded-xl bg-white p-4 shadow-sm">
              <Ionicons name="heart" size={18} color="#C0584B" />
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-semibold text-[#333]">{s.title}</Text>
                <Text className="mt-0.5 text-[12px] text-[#999]">{s.author.username} · {s.createdAt?.slice(0, 10)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
