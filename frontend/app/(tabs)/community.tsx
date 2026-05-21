import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import type { Story } from '@/lib/api-types';
import { comingSoon } from '@/lib/coming-soon';
import { resolveLegacyImage } from '@/lib/legacy-images';

// 作者字母头像配色池（取岭南大地色）。
const AVATAR_COLORS = ['#3E6B4F', '#C2622A', '#B98A1E', '#2E7B74', '#BC5447', '#3F6C9C'];

// 用户名稳定映射到一个配色。
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[h];
}

// 相对时间，如「3 小时前」。
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return `${Math.floor(d / 30)} 个月前`;
}

// 单条动态卡：作者行 + 正文 + 配图 + 操作行。点赞做本地乐观切换。
function StoryCard({ item, width }: { item: Story; width: number }) {
  const [liked, setLiked] = useState(false);
  const likeCount = item.likeCount + (liked ? 1 : 0);

  const imgs = item.images.slice(0, 3);
  const gap = 6;
  const single = imgs.length === 1;
  const cellW = single
    ? width
    : Math.floor((width - gap * (imgs.length - 1)) / imgs.length);
  const cellH = single ? Math.round(width * 0.6) : cellW;

  return (
    <View
      style={{ boxShadow: '0px 4px 14px rgba(0,0,0,0.06)' }}
      className="mx-4 mt-3.5 rounded-2xl bg-white p-3.5">
      {/* 作者行 */}
      <View className="flex-row items-center">
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: avatarColor(item.author.username),
          }}
          className="items-center justify-center">
          <Text className="text-[16px] font-bold text-white">
            {item.author.username.slice(0, 1)}
          </Text>
        </View>
        <View className="ml-2.5 flex-1">
          <Text className="text-[14px] font-bold text-[#3a372f]">
            {item.author.username}
          </Text>
          <Text className="text-[11px] text-[#9C8E7A]">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color="#C3BBA8" />
      </View>

      {/* 正文 */}
      <Text className="mt-2.5 text-[15px] font-bold text-[#2f3a30]">
        {item.title}
      </Text>
      <Text className="mt-1 text-[13px] leading-5 text-[#6b6553]">
        {item.content}
      </Text>

      {/* 配图 */}
      {imgs.length > 0 ? (
        <View className="mt-2.5 flex-row" style={{ gap }}>
          {imgs.map((key, i) => (
            <Image
              key={`${item.id}-${i}`}
              source={resolveLegacyImage(key)}
              resizeMode="cover"
              style={{ width: cellW, height: cellH, borderRadius: 12 }}
            />
          ))}
        </View>
      ) : null}

      {/* 操作行 */}
      <View className="mt-3 flex-row items-center border-t border-[#F0ECDF] pt-2.5">
        <Pressable
          onPress={() => setLiked((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="点赞"
          className="flex-row items-center">
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#C0584B' : '#8C836D'}
          />
          <Text className="ml-1 text-[12px] text-[#8C836D]">{likeCount}</Text>
        </Pressable>
        <Pressable
          onPress={() => comingSoon('动态详情')}
          accessibilityRole="button"
          accessibilityLabel="评论"
          className="ml-5 flex-row items-center">
          <Ionicons name="chatbubble-outline" size={17} color="#8C836D" />
          <Text className="ml-1 text-[12px] text-[#8C836D]">
            {item.commentCount}
          </Text>
        </Pressable>
        <View className="flex-1" />
        <Pressable
          onPress={() => comingSoon('分享')}
          accessibilityRole="button"
          accessibilityLabel="分享">
          <Ionicons name="share-social-outline" size={17} color="#8C836D" />
        </Pressable>
      </View>
    </View>
  );
}

// 社区（对应 Legacy community.html）：岭南旅途与文化的动态流，内容走后端。
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState(false);

  // 卡片内容宽度 = 屏宽 - mx-4 两侧 - p-3.5 两侧。
  const cardInner = width - 32 - 28;

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await apiRequest<Story[]>('/stories');
      setStories(data);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}>
        {/* 渐变头 */}
        <LinearGradient colors={['#3E6B4F', '#5C8A6D']}>
          <View
            style={{ paddingTop: insets.top + 10 }}
            className="px-5 pb-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">社区</Text>
              <Pressable
                onPress={() => comingSoon('搜索动态')}
                accessibilityRole="button"
                accessibilityLabel="搜索动态">
                <Ionicons name="search" size={20} color="#ffffff" />
              </Pressable>
            </View>
            <Text className="mt-1 text-[12px] text-white/75">
              岭南此刻 · 旅途与文化的分享
            </Text>
          </View>
        </LinearGradient>

        {error ? (
          <Pressable
            onPress={() => void load()}
            accessibilityRole="button"
            className="items-center py-16">
            <Ionicons name="cloud-offline-outline" size={32} color="#9C8E7A" />
            <Text className="mt-2 text-sm text-[#9C8E7A]">
              动态加载失败，点此重试
            </Text>
          </Pressable>
        ) : !stories ? (
          <View className="items-center py-20">
            <ActivityIndicator color="#386641" />
          </View>
        ) : (
          stories.map((s, i) => (
            <Animated.View
              key={s.id}
              entering={FadeInDown.delay(Math.min(i, 6) * 70).duration(420)}>
              <StoryCard item={s} width={cardInner} />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
