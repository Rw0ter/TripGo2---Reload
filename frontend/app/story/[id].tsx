import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/lib/api';
import type { Comment, StoryDetail } from '@/lib/api-types';
import { resolveLegacyImage } from '@/lib/legacy-images';
import { avatarColor, timeAgo } from '@/lib/story-format';
import { useAuthStore } from '@/stores/auth';

// 作者字母头像。
function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor(name),
      }}
      className="items-center justify-center">
      <Text style={{ fontSize: size * 0.42 }} className="font-bold text-white">
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

// 故事详情（对应 Legacy Trip_Story.html）：正文 + 配图 + 点赞 + 评论。
export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storyId = Number(id);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [error, setError] = useState(false);
  // liked 初始 false：详情接口未返回当前用户的点赞态；点赞按切换处理、服务端为准。
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const d = await apiRequest<StoryDetail>(`/stories/${storyId}`);
      setStory(d);
      setLikeCount(d.likeCount);
      setComments(d.comments);
    } catch {
      setError(true);
    }
  }, [storyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggleLike() {
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const r = await apiRequest<{ liked: boolean; likeCount: number }>(
        `/stories/${storyId}/like`,
        { method: 'POST', auth: true },
      );
      setLiked(r.liked);
      setLikeCount(r.likeCount);
    } catch {
      // 忽略，保持原状态
    }
  }

  async function onSend() {
    const text = draft.trim();
    if (!text || sending) return;
    if (!token) {
      router.push('/login');
      return;
    }
    setSending(true);
    try {
      const c = await apiRequest<Comment>(`/stories/${storyId}/comments`, {
        method: 'POST',
        auth: true,
        body: { text },
      });
      setComments((prev) => [...prev, c]);
      setDraft('');
    } catch {
      // 忽略
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4F1E4]">
        <Pressable
          onPress={() => void load()}
          accessibilityRole="button"
          className="items-center">
          <Ionicons name="cloud-offline-outline" size={32} color="#9C8E7A" />
          <Text className="mt-2 text-sm text-[#9C8E7A]">
            加载失败，点此重试
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!story) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4F1E4]">
        <ActivityIndicator color="#386641" />
      </View>
    );
  }

  const imgW = width - 32;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-1 bg-[#F4F1E4]">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          {/* 作者 */}
          <View className="flex-row items-center px-4 pt-4">
            <Avatar name={story.author.username} size={40} />
            <View className="ml-2.5 flex-1">
              <Text className="text-[14px] font-bold text-[#3a372f]">
                {story.author.username}
              </Text>
              <Text className="text-[11px] text-[#9C8E7A]">
                {timeAgo(story.createdAt)}
              </Text>
            </View>
          </View>

          {/* 标题 + 正文 */}
          <Text className="mt-3 px-4 text-[18px] font-extrabold leading-7 text-[#2f3a30]">
            {story.title}
          </Text>
          <Text className="mt-2 px-4 text-[14px] leading-6 text-[#5c5647]">
            {story.content}
          </Text>

          {/* 配图 */}
          {(story.images ?? []).map((key, i) => (
            <Image
              key={`${story.id}-${i}`}
              source={resolveLegacyImage(key)}
              resizeMode="cover"
              style={{
                width: imgW,
                height: Math.round(imgW * 0.62),
                borderRadius: 16,
                marginTop: 12,
                marginLeft: 16,
              }}
            />
          ))}

          {/* 点赞条 */}
          <View className="mt-4 flex-row items-center px-4">
            <Pressable
              onPress={onToggleLike}
              accessibilityRole="button"
              accessibilityLabel="点赞"
              style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' }}
              className="flex-row items-center rounded-full bg-white px-3.5 py-1.5">
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={18}
                color={liked ? '#C0584B' : '#8C836D'}
              />
              <Text className="ml-1.5 text-[13px] text-[#6b6553]">
                {likeCount}
              </Text>
            </Pressable>
            <View className="ml-3 flex-row items-center">
              <Ionicons name="chatbubble-outline" size={16} color="#8C836D" />
              <Text className="ml-1 text-[13px] text-[#8C836D]">
                {comments.length}
              </Text>
            </View>
          </View>

          {/* 评论区 */}
          <View className="mt-4 border-t border-[#E8E3D2] px-4 pt-4">
            <Text className="text-[14px] font-bold text-[#3a372f]">
              评论 {comments.length}
            </Text>
            {comments.length === 0 ? (
              <Text className="mt-3 text-[13px] text-[#9C8E7A]">
                还没有评论，来说点什么吧
              </Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} className="mt-3.5 flex-row">
                  <Avatar name={c.author.username} size={32} />
                  <View className="ml-2.5 flex-1">
                    <Text className="text-[12.5px] font-semibold text-[#3a372f]">
                      {c.author.username}
                    </Text>
                    <Text className="mt-0.5 text-[13px] leading-5 text-[#5c5647]">
                      {c.text}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-[#B3A98F]">
                      {timeAgo(c.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* 评论输入条 */}
        <View
          className="flex-row items-center border-t border-[#E8E3D2] bg-white px-3 pt-2"
          style={{ paddingBottom: insets.bottom + 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={token ? '写评论…' : '登录后参与讨论'}
            placeholderTextColor="#B3A98F"
            editable={!sending}
            className="h-10 flex-1 rounded-full bg-[#F4F1E4] px-4 text-[13px] text-[#3a372f]"
          />
          <Pressable
            onPress={onSend}
            accessibilityRole="button"
            accessibilityLabel="发送评论"
            className="ml-2 h-10 items-center justify-center rounded-full bg-[#386641] px-4">
            <Text className="text-[13px] font-semibold text-white">
              {sending ? '发送中' : '发送'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
