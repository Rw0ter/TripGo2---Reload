import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import type { Comment, StoryDetail } from '@/lib/api-types';
import { comingSoon } from '@/lib/coming-soon';
import { resolveLegacyImage } from '@/lib/legacy-images';
import { avatarColor, timeAgo } from '@/lib/story-format';
import { useAuthStore } from '@/stores/auth';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

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

// 浮动返回按钮（详情页隐藏了原生头）。
// 纯 style 定位——NativeWind 的 className 与函数式 style 混用会丢样式。
function BackButton({ onPress, top }: { onPress: () => void; top: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="返回"
      style={{
        position: 'absolute',
        top,
        left: 14,
        height: 36,
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name="chevron-back" size={23} color="#ffffff" />
    </Pressable>
  );
}

// 互动栏单项。label 是可见文字（可能是计数），a11y 是无障碍语义名。
function ActionItem({
  icon,
  color,
  label,
  a11y,
  onPress,
}: {
  icon: IconName;
  color: string;
  label: string;
  a11y?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      className="flex-1 flex-row items-center justify-center py-1">
      <Ionicons name={icon} size={19} color={color} />
      <Text className="ml-1.5 text-[12.5px] text-[#6b6553]">{label}</Text>
    </Pressable>
  );
}

// 故事详情（对应 Legacy Trip_Story.html）：全幅封面 + 内容卡 + 互动栏 + 评论。
export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storyId = Number(id);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [error, setError] = useState(false);
  // liked 由详情接口按当前用户回填（见 load）；加载完成前先 false。
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      // auth:true —— 登录时带 token，后端回填 liked。
      const d = await apiRequest<StoryDetail>(`/stories/${storyId}`, {
        auth: true,
      });
      setStory(d);
      setLiked(d.liked);
      setLikeCount(d.likeCount);
      setComments(d.comments);
    } catch {
      setError(true);
    }
  }, [storyId]);

  useEffect(() => {
    void load();
  }, [load]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/community');
    }
  }

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
        <BackButton onPress={goBack} top={insets.top + 6} />
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
        <BackButton onPress={goBack} top={insets.top + 6} />
        <ActivityIndicator color="#386641" />
      </View>
    );
  }

  const cover = story.images?.[0];
  const extraImages = (story.images ?? []).slice(1);
  const heroH = cover
    ? Math.min(286, Math.round(width * 0.74))
    : insets.top + 96;
  const cardW = width - 32;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-1 bg-[#F4F1E4]">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 28 }}>
          {/* 全幅封面 / 无图时绿色渐变带 */}
          {cover ? (
            <View>
              <Image
                source={resolveLegacyImage(cover)}
                resizeMode="cover"
                style={{ width, height: heroH }}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.45)', 'transparent']}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 110,
                }}
              />
            </View>
          ) : (
            <LinearGradient
              colors={['#3E6B4F', '#5C8A6D']}
              style={{ height: heroH }}
            />
          )}

          {/* 内容卡——上浮压住封面 */}
          <Animated.View
            entering={FadeInDown.duration(380)}
            style={{ marginTop: -22 }}
            className="rounded-t-[24px] bg-white px-4 pt-4">
            {/* 非遗主题标签 */}
            <View className="mb-2.5 flex-row">
              <View className="flex-row items-center rounded-full bg-[#E4EEE4] px-2.5 py-1">
                <Ionicons name="ribbon-outline" size={12} color="#386641" />
                <Text className="ml-1 text-[11px] font-semibold text-[#386641]">
                  非遗手记
                </Text>
              </View>
            </View>

            {/* 标题 */}
            <Text className="text-[21px] font-extrabold leading-8 text-[#2f3a30]">
              {story.title}
            </Text>

            {/* 作者 */}
            <View className="mt-3 flex-row items-center">
              <Avatar name={story.author.username} size={40} />
              <View className="ml-2.5 flex-1">
                <Text className="text-[14px] font-bold text-[#3a372f]">
                  {story.author.username}
                </Text>
                <Text className="text-[11px] text-[#9C8E7A]">
                  岭南守艺人 · {timeAgo(story.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => comingSoon('分享')}
                accessibilityRole="button"
                accessibilityLabel="分享"
                className="h-8 w-8 items-center justify-center rounded-full bg-[#F4F1E4]">
                <Ionicons name="share-social-outline" size={16} color="#8C836D" />
              </Pressable>
            </View>

            {/* 正文 */}
            <Text className="mt-3.5 text-[15px] leading-7 text-[#5c5647]">
              {story.content}
            </Text>

            {/* 额外配图 */}
            {extraImages.map((key, i) => (
              <Image
                key={`${story.id}-x${i}`}
                source={resolveLegacyImage(key)}
                resizeMode="cover"
                style={{
                  width: cardW,
                  height: Math.round(cardW * 0.6),
                  borderRadius: 14,
                  marginTop: 12,
                }}
              />
            ))}

            {/* 互动栏 */}
            <View className="mt-4 flex-row border-t border-[#EFEAD9] pb-1 pt-3">
              <ActionItem
                icon={liked ? 'heart' : 'heart-outline'}
                color={liked ? '#C0584B' : '#8C836D'}
                label={`${likeCount}`}
                a11y="点赞"
                onPress={onToggleLike}
              />
              <ActionItem
                icon="chatbubble-outline"
                color="#8C836D"
                label={`${comments.length}`}
                a11y="评论数"
              />
              <ActionItem
                icon="bookmark-outline"
                color="#8C836D"
                label="收藏"
                onPress={() => comingSoon('收藏')}
              />
              <ActionItem
                icon="share-social-outline"
                color="#8C836D"
                label="分享"
                onPress={() => comingSoon('分享')}
              />
            </View>
          </Animated.View>

          {/* 评论区 */}
          <View className="mt-3 bg-white px-4 py-4">
            <View className="flex-row items-center">
              <View
                style={{ width: 4, height: 15, borderRadius: 2 }}
                className="bg-[#386641]"
              />
              <Text className="ml-2 text-[15px] font-bold text-[#3a372f]">
                全部评论 {comments.length}
              </Text>
            </View>

            {comments.length === 0 ? (
              <View className="items-center py-9">
                <Ionicons
                  name="chatbubbles-outline"
                  size={30}
                  color="#CFC6B0"
                />
                <Text className="mt-2 text-[13px] text-[#9C8E7A]">
                  还没有评论，来抢个沙发吧
                </Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} className="mt-4 flex-row">
                  <Avatar name={c.author.username} size={34} />
                  <View className="ml-2.5 flex-1">
                    <Text className="text-[12.5px] font-semibold text-[#3a372f]">
                      {c.author.username}
                    </Text>
                    <Text className="mt-1 text-[13.5px] leading-5 text-[#4f4a3d]">
                      {c.text}
                    </Text>
                    <Text className="mt-1 text-[11px] text-[#B3A98F]">
                      {timeAgo(c.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* 浮动返回 */}
        <BackButton onPress={goBack} top={insets.top + 6} />

        {/* 评论输入条 */}
        <View
          className="flex-row items-center border-t border-[#E8E3D2] bg-white px-3 pt-2"
          style={{ paddingBottom: insets.bottom + 8 }}>
          <Ionicons name="create-outline" size={18} color="#B3A98F" />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={token ? '聊聊你的看法…' : '登录后参与讨论'}
            placeholderTextColor="#B3A98F"
            editable={!sending}
            className="ml-2 h-10 flex-1 rounded-full bg-[#F4F1E4] px-4 text-[13px] text-[#3a372f]"
          />
          <Pressable
            onPress={onSend}
            accessibilityRole="button"
            accessibilityLabel="发送评论"
            className="ml-2 h-10 items-center justify-center rounded-full bg-[#386641] px-5">
            <Text className="text-[13px] font-semibold text-white">
              {sending ? '发送中' : '发送'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
