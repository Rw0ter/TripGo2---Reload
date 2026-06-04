import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

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

export default function MyStoriesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const all = await apiRequest<Story[]>('/stories', { auth: true });
      // 后端暂无 /stories/mine，取全量后按当前用户作者名客户端过滤。
      const username = useAuthStore.getState().user?.username;
      setStories(all.filter((s) => s.author.username === username));
    } catch {
      setStories(null);
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
        <ScreenHeader
          title="我的故事"
          tint="dark"
          right={
            <Pressable onPress={() => router.push('/post/story')}>
              <Ionicons name="add-circle" size={24} color="#fff" />
            </Pressable>
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {!stories && !error ? (
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
        ) : stories!.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons
              name="document-text-outline"
              size={64}
              color="#ccc"
              style={{ marginTop: 40 }}
            />
            <Text className="mt-4 text-[16px] font-bold text-[#333]">
              你的非遗故事
            </Text>
            <Text className="mt-2 text-center text-[14px] leading-5 text-[#999]">
              发布你的岭南文化体验{'\n'}与更多人分享旅程中的感动
            </Text>
            <Pressable
              onPress={() => router.push('/post/story')}
              className="mt-6 rounded-full bg-[#3E6B4F] px-8 py-3"
            >
              <Text className="text-[15px] font-bold text-white">发布故事</Text>
            </Pressable>
          </View>
        ) : (
          stories!.map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                router.push({ pathname: '/story/[id]', params: { id: s.id } })
              }
              className="mb-3 rounded-xl bg-white p-4 shadow-sm"
            >
              <View className="flex-row items-start">
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-bold text-[#333]"
                    numberOfLines={1}
                  >
                    {s.title}
                  </Text>
                  <Text
                    className="mt-1.5 text-[13px] leading-5 text-[#666]"
                    numberOfLines={2}
                  >
                    {s.content}
                  </Text>
                  <View className="mt-2.5 flex-row items-center">
                    <Ionicons name="heart-outline" size={14} color="#C0584B" />
                    <Text className="ml-1 text-[12px] text-[#999]">
                      {s.likeCount}
                    </Text>
                    <Ionicons
                      name="chatbubble-outline"
                      size={13}
                      color="#999"
                      style={{ marginLeft: 12 }}
                    />
                    <Text className="ml-1 text-[12px] text-[#999]">
                      {s.commentCount}
                    </Text>
                    <Text className="ml-3 text-[12px] text-[#bbb]">
                      {s.createdAt.slice(0, 10)}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#ccc"
                  style={{ marginTop: 2, marginLeft: 8 }}
                />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
