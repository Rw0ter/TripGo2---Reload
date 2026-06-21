import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { avatarColor } from '@/lib/story-format';

// 瀑布流封面高度池——交错取值制造「高低落差」。
const COVER_HEIGHTS = [150, 196, 128, 172, 144, 208, 162, 134];

// 紧凑动态卡（瀑布流单元）：封面 + 标题 + 摘要 + 作者/点赞。
function StoryCard({
  item,
  width,
  coverH,
}: {
  item: Story;
  width: number;
  coverH: number;
}) {
  const router = useRouter();
  const cover = item.images?.[0];

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/story/[id]', params: { id: item.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={{ width, boxShadow: '0px 4px 12px rgba(0,0,0,0.07)' }}
      className="mb-3 overflow-hidden rounded-2xl bg-white">
      {cover ? (
        <Image
          source={resolveLegacyImage(cover)}
          resizeMode="cover"
          style={{ width, height: coverH }}
        />
      ) : null}
      <View className="p-2.5">
        <Text
          numberOfLines={2}
          className="text-[13.5px] font-bold leading-5 text-[#2f3a30]">
          {item.title}
        </Text>
        <Text
          numberOfLines={2}
          className="mt-1 text-[12px] leading-4 text-[#8b8573]">
          {item.content}
        </Text>
        <View className="mt-2 flex-row items-center">
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: avatarColor(item.author.username),
            }}
            className="items-center justify-center">
            <Text className="text-[10px] font-bold text-white">
              {item.author.username.slice(0, 1)}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            className="ml-1.5 flex-1 text-[11px] text-[#9C8E7A]">
            {item.author.username}
          </Text>
          <Ionicons
            name={item.liked ? 'heart' : 'heart-outline'}
            size={13}
            color={item.liked ? '#C0584B' : '#C3BBA8'}
          />
          <Text className="ml-0.5 text-[11px] text-[#9C8E7A]">
            {item.likeCount}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// 社区（对应 Legacy community.html）：岭南非遗传承的动态流，内容走后端。
// 固定绿色头 + 两栏高低落差瀑布流。
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState(false);

  // 两栏列宽 = 屏宽 - 外边距 12*2 - 列间距 10，再二等分。
  const colW = Math.floor((width - 12 * 2 - 10) / 2);

  const load = useCallback(async () => {
    setError(false);
    try {
      // auth:true —— 登录时带上 token，后端据此回填 liked。
      const data = await apiRequest<Story[]>('/stories', { auth: true });
      setStories(data);
    } catch {
      setError(true);
    }
  }, []);

  // 每次回到社区 tab 都刷新，发布 / 点赞后能看到最新动态。
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // 把动态按估算高度分到较矮的一列，制造左右落差。
  const columns = useMemo(() => {
    const colA: { item: Story; coverH: number }[] = [];
    const colB: { item: Story; coverH: number }[] = [];
    let hA = 0;
    let hB = 0;
    (stories ?? []).forEach((item, i) => {
      const hasCover = !!item.images?.[0];
      const coverH = hasCover ? COVER_HEIGHTS[i % COVER_HEIGHTS.length] : 0;
      const est = coverH + 116; // 封面 + 文字区估高
      if (hA <= hB) {
        colA.push({ item, coverH });
        hA += est;
      } else {
        colB.push({ item, coverH });
        hB += est;
      }
    });
    return { colA, colB };
  }, [stories]);

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      {/* 固定绿色头——在 ScrollView 之外，不随内容滚动 */}
      <LinearGradient
        colors={['#3E6B4F', '#5C8A6D']}
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}>
        <View style={{ paddingTop: insets.top + 10 }} className="px-5 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-white">社区</Text>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel="搜索动态">
              <Ionicons name="search" size={20} color="#ffffff" />
            </Pressable>
          </View>
          <Text className="mt-1 text-[12px] text-white/75">
            绿色生活日记 · 低碳行动的记录与分享
          </Text>
        </View>
      </LinearGradient>

      {error ? (
        <Pressable
          onPress={() => void load()}
          accessibilityRole="button"
          className="flex-1 items-center justify-center">
          <Ionicons name="cloud-offline-outline" size={32} color="#9C8E7A" />
          <Text className="mt-2 text-sm text-[#9C8E7A]">
            动态加载失败，点此重试
          </Text>
        </Pressable>
      ) : !stories ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#386641" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 28 }}>
          <View className="flex-row" style={{ gap: 10 }}>
            <View style={{ width: colW }}>
              {columns.colA.map(({ item, coverH }, i) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(Math.min(i, 6) * 60).duration(380)}>
                  <StoryCard item={item} width={colW} coverH={coverH} />
                </Animated.View>
              ))}
            </View>
            <View style={{ width: colW }}>
              {columns.colB.map(({ item, coverH }, i) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(Math.min(i, 6) * 60).duration(380)}>
                  <StoryCard item={item} width={colW} coverH={coverH} />
                </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
