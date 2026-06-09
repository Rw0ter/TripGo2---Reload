import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';

interface StoryAuthor {
  username: string;
  avatar: string | null;
}

interface Story {
  id: number;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
  author: StoryAuthor;
  likeCount: number;
  commentCount: number;
  liked: boolean;
}

export default function MyLikesScreen() {
  const router = useRouter();
  const [likes, setLikes] = useState<Story[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      // 后端按 userId 返回本人点赞过的动态（按点赞时间倒序），无需前端过滤。
      const liked = await apiRequest<Story[]>('/stories/liked', { auth: true });
      setLikes(liked);
    } catch {
      setLikes(null);
      setError('加载失败，请下拉重试');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <View className="bg-[#3E6B4F]">
        <ScreenHeader title="我的点赞" tint="dark" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {!likes && !error ? (
          <View className="items-center py-20">
            <ActivityIndicator color="#3E6B4F" />
          </View>
        ) : error ? (
          <View className="items-center py-20">
            <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
            <Text className="mt-3 text-[14px] text-[#999]">{error}</Text>
            <Pressable
              onPress={() => load()}
              className="mt-4 rounded-full bg-[#3E6B4F] px-6 py-2.5"
            >
              <Text className="text-[14px] font-bold text-white">重试</Text>
            </Pressable>
          </View>
        ) : likes!.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text className="mt-4 text-[16px] font-bold text-[#333]">
              还没有点赞
            </Text>
            <Text className="mt-2 text-center text-[13px] leading-5 text-[#999]">
              去社区看看精彩的非遗故事{'\n'}为你喜欢的作品送上爱心
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/community')}
              className="mt-5 rounded-full bg-[#3E6B4F] px-7 py-2.5"
            >
              <Text className="text-[14px] font-bold text-white">去发现</Text>
            </Pressable>
          </View>
        ) : (
          likes!.map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                router.push({ pathname: '/story/[id]', params: { id: s.id } })
              }
              className="mb-3 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-[#FDF1F0]">
                <Ionicons name="heart" size={20} color="#C0584B" />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className="text-[14px] font-semibold text-[#333]"
                  numberOfLines={1}
                >
                  {s.title}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <Text className="text-[12px] text-[#999]">
                    {s.author.username}
                  </Text>
                  <Text className="mx-1.5 text-[11px] text-[#ccc]">·</Text>
                  <Text className="text-[12px] text-[#bbb]">
                    {s.createdAt.slice(0, 10)}
                  </Text>
                  {s.commentCount > 0 && (
                    <>
                      <Text className="mx-1.5 text-[11px] text-[#ccc]">·</Text>
                      <Ionicons
                        name="chatbubble-outline"
                        size={12}
                        color="#bbb"
                      />
                      <Text className="ml-0.5 text-[12px] text-[#bbb]">
                        {s.commentCount}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
