import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
import type { Banner, Quiz, Scenic } from '@/lib/api-types';
import { comingSoon } from '@/lib/coming-soon';
import { resolveLegacyImage } from '@/lib/legacy-images';

// 四宫格 / 五项入口是 App 导航菜单（非后端数据），保持静态。
const GRID4 = [
  { icon: require('../../assets/legacy/img/index_list_4combo/qd.png'), label: '签到' },
  { icon: require('../../assets/legacy/img/lxwd.png'), label: '研学智囊团' },
  { icon: require('../../assets/legacy/img/index_list_4combo/phb.png'), label: '排行榜' },
  { icon: require('../../assets/legacy/img/VR.png'), label: 'VR' },
];

const ENTRY5 = [
  { icon: require('../../assets/legacy/img/pipa1.png'), label: '文创产品' },
  { icon: require('../../assets/legacy/img/lxdt3.png'), label: '旅行地图' },
  { icon: require('../../assets/legacy/img/zhushou.png'), label: '智能助手' },
  { icon: require('../../assets/legacy/img/people_dance.png'), label: '学习小课堂' },
  { icon: require('../../assets/legacy/img/tieding1.png'), label: '粤语课堂' },
];

const quizIcon = require('../../assets/legacy/img/count.png');

// 瀑布流卡片高度池——交错取值制造「高低落差」。
const MASONRY_HEIGHTS = [212, 166, 196, 236, 172, 204, 184, 224];

// 顶部轮播图：高清广东城市大图 + 名称浮层，每 4 秒自动切换、可手动滑动。
function Carousel({
  banners,
  pageWidth,
}: {
  banners: Banner[];
  pageWidth: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const imgWidth = pageWidth - 28;
  const count = banners.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % count;
      indexRef.current = next;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
    }, 4000);
    return () => clearInterval(timer);
  }, [pageWidth, count]);

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    indexRef.current = i;
    setIndex(i);
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}>
        {banners.map((b) => (
          <View key={b.id} style={{ width: pageWidth }} className="items-center">
            <View
              style={{ width: imgWidth, height: 196, boxShadow: '0px 8px 20px rgba(0,0,0,0.28)' }}
              className="overflow-hidden rounded-3xl">
              <Image
                source={resolveLegacyImage(b.image)}
                resizeMode="cover"
                style={{ width: imgWidth, height: 196 }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.66)']}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 110,
                }}
              />
              <View className="absolute bottom-3.5 left-4 right-4">
                <Text className="text-xl font-extrabold text-white">
                  {b.title}
                </Text>
                <Text className="mt-0.5 text-[12px] text-white/85">
                  {b.subtitle}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="mt-2.5 flex-row justify-center gap-1.5">
        {banners.map((b, i) => (
          <View
            key={b.id}
            style={{
              width: i === index ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i === index ? '#ffffff' : 'rgba(255,255,255,0.45)',
            }}
          />
        ))}
      </View>
    </View>
  );
}

// 区块标题：彩条 + 标题 + 可选「更多」。
function SectionHeader({
  title,
  subtitle,
  onMore,
}: {
  title: string;
  subtitle?: string;
  onMore?: () => void;
}) {
  return (
    <View className="mb-2.5 flex-row items-end justify-between px-4">
      <View className="flex-row items-center">
        <View
          style={{ width: 4, height: 17, borderRadius: 2 }}
          className="bg-[#386641]"
        />
        <Text className="ml-2 text-[16px] font-extrabold text-[#2f3a30]">
          {title}
        </Text>
        {subtitle ? (
          <Text className="ml-2 text-[11px] text-[#9a9382]">{subtitle}</Text>
        ) : null}
      </View>
      {onMore ? (
        <Pressable onPress={onMore}>
          <Text className="text-[12px] text-[#9a9382]">更多 ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// 知识小课堂答题卡。
function QuizCard({ item, width }: { item: Quiz; width: number }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={{ width, boxShadow: '0px 4px 12px rgba(148,116,52,0.18)' }}
      className="mr-3 rounded-2xl bg-white p-3.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <View className="self-start overflow-hidden rounded-full">
            <LinearGradient
              colors={['#f97316', '#ef4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text className="text-[11px] font-semibold text-white">
                {item.tag}
              </Text>
            </LinearGradient>
          </View>
          <Text className="mt-1.5 text-[15px] font-extrabold text-[#3b2f16]">
            {item.title}
          </Text>
          <Text className="mt-1 text-[12px] leading-5 text-[#7d7b6a]">
            {item.desc}
          </Text>
          <View className="mt-2 self-start overflow-hidden rounded-full">
            <LinearGradient
              colors={['#f97316', '#facc15']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text className="text-[12px] font-bold text-white">
                {item.btn}
              </Text>
            </LinearGradient>
          </View>
        </View>
        <Image
          source={quizIcon}
          resizeMode="contain"
          style={{ width: 52, height: 52 }}
        />
      </View>
    </Pressable>
  );
}

// 热门景点大横卡。
function HotCard({ item, width }: { item: Scenic; width: number }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={{ width, height: 130 }}
      className="mr-3 overflow-hidden rounded-2xl">
      <Image
        source={resolveLegacyImage(item.image)}
        resizeMode="cover"
        style={{ width, height: 130 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
      />
      <View className="absolute right-2.5 top-2.5 rounded-full bg-[#f97316] px-2 py-0.5">
        <Text className="text-[10px] font-bold text-white">热门</Text>
      </View>
      <View className="absolute bottom-2.5 left-3 right-3">
        <Text className="text-base font-bold text-white">{item.name}</Text>
        <Text numberOfLines={1} className="mt-0.5 text-[11px] text-white/85">
          {item.summary}
        </Text>
      </View>
    </Pressable>
  );
}

// 城市精选瀑布流卡：整图铺底 + 底部渐隐浮层，高度交错。
function MasonryCard({
  item,
  width,
  height,
}: {
  item: Scenic;
  width: number;
  height: number;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/guide/[city]', params: { city: item.city || item.name } })}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={{ width, height, boxShadow: '0px 5px 14px rgba(0,0,0,0.16)' }}
      className="mb-3 overflow-hidden rounded-2xl">
      <Image
        source={resolveLegacyImage(item.image)}
        resizeMode="cover"
        style={{ width, height }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '66%' }}
      />
      <View className="absolute left-0 right-0 top-0 flex-row justify-start p-2">
        <View className="rounded-md bg-white/22 px-1.5 py-0.5">
          <Text className="text-[10px] font-medium text-white">广东 · 城市</Text>
        </View>
      </View>
      <View className="absolute bottom-2.5 left-3 right-3">
        <Text className="text-[15px] font-extrabold text-white">
          {item.name}
        </Text>
        <Text numberOfLines={2} className="mt-0.5 text-[11px] leading-4 text-white/82">
          {item.summary}
        </Text>
      </View>
    </Pressable>
  );
}

function EntryItem({
  icon,
  label,
  size,
  onPress,
}: {
  icon: ImageSourcePropType;
  label: string;
  size: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center py-1.5">
      <Image
        source={icon}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      <Text className="mt-1.5 text-[12px] text-[#4a4a42]">{label}</Text>
    </Pressable>
  );
}

interface HomeData {
  banners: Banner[];
  hot: Scenic[];
  masonry: Scenic[];
  quizzes: Quiz[];
}

// 首页（对应 Legacy index1.html）：高清城市轮播 + 入口宫格 + 知识小课堂 +
// 热门景点 + 城市精选高低落差瀑布流，内容均走后端。
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState(false);

  const quizCardW = Math.round(width * 0.66);
  const hotCardW = Math.round(width * 0.62);
  const colW = Math.floor((width - 32 - 12) / 2);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [banners, scenic, quizzes] = await Promise.all([
        apiRequest<Banner[]>('/banners'),
        apiRequest<Scenic[]>('/scenic?section=home'),
        apiRequest<Quiz[]>('/quiz'),
      ]);
      setData({
        banners,
        hot: scenic.filter((s) => s.hot),
        masonry: scenic.filter((s) => !s.hot),
        quizzes,
      });
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 把瀑布流条目按「较矮列优先」分到两列，制造交错。
  const columns = useMemo(() => {
    const colA: { item: Scenic; h: number }[] = [];
    const colB: { item: Scenic; h: number }[] = [];
    let hA = 0;
    let hB = 0;
    (data?.masonry ?? []).forEach((item, i) => {
      const h = MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length];
      if (hA <= hB) {
        colA.push({ item, h });
        hA += h;
      } else {
        colB.push({ item, h });
        hB += h;
      }
    });
    return { colA, colB };
  }, [data?.masonry]);

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}>
        {/* 绿色头部：分段控件 + 搜索 + 轮播 */}
        <LinearGradient colors={['#3E6B4F', '#5C8A6D']}>
          <Animated.View
            entering={FadeInDown.duration(450)}
            style={{ paddingTop: insets.top + 6 }}
            className="px-4 pb-2">
            <View className="flex-row items-end justify-center gap-12">
              <Text className="text-lg font-bold text-white">发现</Text>
              <Pressable onPress={() => comingSoon('非遗文化')}>
                <Text className="pb-0.5 text-sm font-bold text-white/65">
                  非遗
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="search"
              style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.12)' }}
              className="mt-3 h-11 flex-row items-center rounded-full bg-white px-4">
              <Ionicons name="search" size={16} color="#5C8A6D" />
              <Text className="ml-2 text-sm text-[#9aa39b]">
                搜索目的地 / 景点 / 酒店
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(90).duration(450)}
            className="pb-7 pt-1">
            {data ? (
              <Carousel banners={data.banners} pageWidth={width} />
            ) : (
              <View
                style={{ height: 196 }}
                className="mx-3.5 rounded-3xl bg-white/12"
              />
            )}
          </Animated.View>
        </LinearGradient>

        {/* 主体 */}
        <View className="-mt-4 rounded-t-[22px] bg-[#F4F1E4] pt-5">
          {/* 入口宫格 */}
          <Animated.View
            entering={FadeInDown.delay(160).duration(450)}
            style={{ boxShadow: '0px 4px 14px rgba(0,0,0,0.06)' }}
            className="mx-4 rounded-2xl bg-white pb-2 pt-3">
            <View className="flex-row justify-around px-2">
              {GRID4.map((it) => {
                const routes: Record<string, string> = { '签到': '/checkin', '研学智囊团': '/study', '排行榜': '/leaderboard' };
                const target = routes[it.label];
                return (
                  <EntryItem
                    key={it.label}
                    icon={it.icon}
                    label={it.label}
                    size={40}
                    onPress={() => target ? router.push(target as any) : comingSoon(it.label)}
                  />
                );
              })}
            </View>
            <View
              style={{ height: 1 }}
              className="mx-3 my-1.5 bg-[#EFEBDC]"
            />
            <View className="flex-row justify-around px-1">
              {ENTRY5.map((it) => {
                const routes: Record<string, string> = { '文创产品': '/products', '旅行地图': '/map', '学习小课堂': '/study' };
                const target = routes[it.label];
                return (
                  <EntryItem
                    key={it.label}
                    icon={it.icon}
                    label={it.label}
                    size={42}
                    onPress={() => target ? router.push(target as any) : comingSoon(it.label)}
                  />
                );
              })}
            </View>
          </Animated.View>

          {error ? (
            <Pressable
              onPress={() => void load()}
              accessibilityRole="button"
              className="items-center py-14">
              <Ionicons name="cloud-offline-outline" size={32} color="#9C8E7A" />
              <Text className="mt-2 text-sm text-[#9C8E7A]">
                内容加载失败，点此重试
              </Text>
            </Pressable>
          ) : !data ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#386641" />
            </View>
          ) : (
            <>
              {/* 知识小课堂 */}
              <Animated.View
                entering={FadeInDown.delay(220).duration(450)}
                className="mt-5">
                <SectionHeader
                  title="知识小课堂"
                  subtitle="答题赢积分"
                  onMore={() => router.push('/study')}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {data.quizzes.map((it) => (
                    <QuizCard key={it.id} item={it} width={quizCardW} />
                  ))}
                </ScrollView>
              </Animated.View>

              {/* 热门景点 */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(450)}
                className="mt-6">
                <SectionHeader title="热门景点" subtitle="广东人气榜" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {data.hot.map((it) => (
                    <HotCard key={it.id} item={it} width={hotCardW} />
                  ))}
                </ScrollView>
              </Animated.View>

              {/* 城市精选 —— 高低落差瀑布流 */}
              <Animated.View
                entering={FadeInDown.delay(380).duration(450)}
                className="mt-6">
                <SectionHeader title="城市精选" subtitle="发现岭南" />
                <View className="flex-row gap-3 px-4">
                  <View className="flex-1">
                    {columns.colA.map(({ item, h }) => (
                      <MasonryCard
                        key={item.id}
                        item={item}
                        width={colW}
                        height={h}
                      />
                    ))}
                  </View>
                  <View className="flex-1">
                    {columns.colB.map(({ item, h }) => (
                      <MasonryCard
                        key={item.id}
                        item={item}
                        width={colW}
                        height={h}
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
