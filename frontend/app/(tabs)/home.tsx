import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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

// 首页功能入口（App 导航菜单，非后端数据）。图标为真实彩色扁平插画（Icons8 Color 集，下载到本地，
// 见 assets/images/home/icons/CREDITS.md），直接呈现、不加任何背景容器，替换旧版岭南主题 PNG
// （琵琶 / 铁鼎 / people_dance 等与绿色低碳无关的图）。
type EntryDef = {
  label: string;
  icon: ImageSourcePropType;
  route: string | null;
};
const ENTRIES: EntryDef[] = [
  { label: '签到', icon: require('../../assets/images/home/icons/checkin.png'), route: '/checkin' },
  { label: '绿色行动', icon: require('../../assets/images/home/icons/green-action.png'), route: '/green' },
  { label: '排行榜', icon: require('../../assets/images/home/icons/ranking.png'), route: '/leaderboard' },
  { label: 'VR', icon: require('../../assets/images/home/icons/vr.png'), route: '/vr' },
  { label: '生态良品', icon: require('../../assets/images/home/icons/eco-shop.png'), route: '/products' },
  { label: '绿色地图', icon: require('../../assets/images/home/icons/green-map.png'), route: '/map' },
  { label: '智能助手', icon: require('../../assets/images/home/icons/ai-assistant.png'), route: '/ai/assistant' },
  { label: '环保学堂', icon: require('../../assets/images/home/icons/eco-school.png'), route: '/green' },
  { label: '知识库', icon: require('../../assets/images/home/icons/knowledge.png'), route: '/cantonese' },
];


// 顶部轮播图：现代"露边卡片"样式 + 无缝循环。
// 无缝：数据头尾各克隆一张 [末, ...原, 首]，滑到克隆边缘后瞬时复位到对应真实图，
// 左右两端都自然衔接，不会再"最后一张突然跳回第一张"。
function Carousel({
  banners,
  pageWidth,
}: {
  banners: Banner[];
  pageWidth: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [real, setReal] = useState(0);
  const vRef = useRef(1); // 当前虚拟下标（data 下标，真实第一张在 1）
  const initedRef = useRef(false);
  const count = banners.length;
  const SIDE = 16;
  const GAP = 12;
  const cardW = pageWidth - SIDE * 2 - 22; // 右侧露出 ~22px 提示可滑动
  const interval = cardW + GAP;

  // 头尾克隆：[最后一张, ...原图, 第一张]
  const data =
    count > 1 ? [banners[count - 1], ...banners, banners[0]] : banners;

  // 初次定位到第一张真实图（data 下标 1）。
  const positionStart = () => {
    if (initedRef.current || count < 2) return;
    initedRef.current = true;
    scrollRef.current?.scrollTo({ x: interval, animated: false });
  };

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      const next = vRef.current + 1;
      vRef.current = next;
      setReal((next - 1 + count) % count);
      scrollRef.current?.scrollTo({ x: next * interval, animated: true });
      // 到达"末尾克隆（首图副本）"→ 动画结束后瞬时跳回真实首图，肉眼无缝。
      if (next === count + 1) {
        setTimeout(() => {
          vRef.current = 1;
          scrollRef.current?.scrollTo({ x: interval, animated: false });
        }, 450);
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [interval, count]);

  // 手动滑动结束：落在克隆边缘则瞬时复位到对应真实图。
  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (count < 2) return;
    let j = Math.round(e.nativeEvent.contentOffset.x / interval);
    if (j <= 0) {
      j = count; // 克隆的末图（最左）→ 真实末图
      scrollRef.current?.scrollTo({ x: j * interval, animated: false });
    } else if (j >= count + 1) {
      j = 1; // 克隆的首图（最右）→ 真实首图
      scrollRef.current?.scrollTo({ x: j * interval, animated: false });
    }
    vRef.current = j;
    setReal((j - 1 + count) % count);
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        disableIntervalMomentum
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={{ x: count > 1 ? interval : 0, y: 0 }}
        onLayout={positionStart}
        onContentSizeChange={positionStart}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingHorizontal: SIDE }}>
        {data.map((b, i) => (
          <View
            key={i}
            style={{ width: cardW, marginRight: i === data.length - 1 ? 0 : GAP }}>
            <View
              style={{ height: 190, boxShadow: '0px 10px 24px rgba(0,0,0,0.30)' }}
              className="overflow-hidden rounded-[26px]">
              <Image
                source={resolveLegacyImage(b.image)}
                resizeMode="cover"
                style={{ width: cardW, height: 190 }}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.06)', 'transparent', 'rgba(0,0,0,0.72)']}
                locations={[0, 0.42, 1]}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View className="absolute left-3.5 top-3.5 flex-row items-center rounded-full bg-white/20 px-2.5 py-1">
                <Ionicons name="leaf" size={11} color="#CFF5DD" />
                <Text className="ml-1 text-[10px] font-semibold text-white">绿色低碳</Text>
              </View>
              <View className="absolute bottom-4 left-4 right-4">
                <Text className="text-[19px] font-extrabold text-white" numberOfLines={1}>
                  {b.title}
                </Text>
                <Text className="mt-0.5 text-[12px] text-white/85" numberOfLines={1}>
                  {b.subtitle}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="mt-3 flex-row justify-center gap-1.5">
        {banners.map((b, i) => (
          <View
            key={b.id}
            style={{
              width: i === real ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === real ? '#ffffff' : 'rgba(255,255,255,0.45)',
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

// 答题卡配图 — 按 tag 关键词匹配，不受 re-seed 影响
const QUIZ_IMAGES: [string, ReturnType<typeof require>][] = [
  ['碳', require('../../assets/images/home/quiz_carbon.jpg')],
  ['垃圾', require('../../assets/images/home/quiz_waste.jpg')],
  ['生态', require('../../assets/images/home/quiz_eco.jpg')],
  ['能源', require('../../assets/images/home/quiz_energy.jpg')],
];
function quizImage(tag: string, title: string) {
  const haystack = tag + title;
  for (const [k, v] of QUIZ_IMAGES) if (haystack.includes(k)) return v;
  return require('../../assets/images/home/quiz_default.jpg');
}

function QuizCard({ item, width }: { item: Quiz; width: number }) {
  const router = useRouter();
  const img = quizImage(item.tag, item.title);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: item.id } })}
      style={{ width, borderRadius: 16, overflow: 'hidden', marginRight: 10,
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 }}>
      <Image source={img} style={{ width, height: 120 }} resizeMode="cover" />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 }} />
      <View className="absolute left-3 bottom-3 right-3">
        <View className="self-start rounded-full bg-[#40916C] px-2.5 py-0.5 mb-1.5">
          <Text className="text-[10px] font-bold text-white">{item.tag}</Text>
        </View>
        <Text className="text-[15px] font-extrabold text-white">{item.title}</Text>
        <Text className="text-[11px] text-white/70 mt-0.5" numberOfLines={1}>{item.desc}</Text>
      </View>
    </Pressable>
  );
}

function EntryItem({
  entry,
  width,
  onPress,
}: {
  entry: EntryDef;
  width: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={entry.label}
      style={{ width }}
      className="items-center py-2.5">
      <Image source={entry.icon} resizeMode="contain" style={{ width: 46, height: 46 }} />
      <Text className="mt-1.5 text-[12px] text-[#4a4a42]">{entry.label}</Text>
    </Pressable>
  );
}

interface EcoStats { carbonCredits: number; points: number; totalCarbonSaved: number; treesPlanted: number; }
interface Story { id: number; title: string; content: string; images: string[]; author: { username: string }; createdAt: string; }

interface HomeData {
  banners: Banner[];
  hot: Scenic[];
  masonry: Scenic[];
  eco: EcoStats | null;
  stories: Story[];
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
  const gridItemW = (width - 48) / 5; // 卡片 mx-4(32) + px-2(16)，5 列
  const load = useCallback(async () => {
    setError(false);
    try {
      const [banners, scenic, quizzes, eco, stories] = await Promise.all([
        apiRequest<Banner[]>('/banners'),
        apiRequest<Scenic[]>('/scenic?section=home'),
        apiRequest<Quiz[]>('/quiz'),
        apiRequest<EcoStats>('/eco/status', { auth: true }).catch(() => null),
        apiRequest<Story[]>('/stories').catch(() => [] as Story[]),
      ]);
      setData({
        banners,
        hot: scenic.filter((s) => s.hot),
        masonry: scenic.filter((s) => !s.hot),
        quizzes,
        eco,
        stories: (stories ?? []).slice(0, 5),
      });
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
        {/* 绿色头部：分段控件 + 搜索 + 轮播 */}
        <LinearGradient colors={['#3E6B4F', '#5C8A6D']}>
          <Animated.View
            entering={FadeInDown.duration(450)}
            style={{ paddingTop: insets.top + 6 }}
            className="px-4 pb-2">
            <View className="flex-row items-end justify-center gap-12">
              <Text className="text-lg font-bold text-white">发现</Text>
              <Pressable onPress={() => comingSoon('绿色专区')}>
                <Text className="pb-0.5 text-sm font-bold text-white/65">
                  绿色
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="search"
              style={{ boxShadow: '0px 5px 16px rgba(0,0,0,0.15)' }}
              className="mt-3 h-11 flex-row items-center rounded-full bg-white pl-4 pr-3.5">
              <Ionicons name="search" size={18} color="#40916C" />
              <Text className="ml-2.5 flex-1 text-[13px] text-[#9aa39b]">
                搜索生态良品 / 环保知识 / 活动
              </Text>
              <View style={{ width: 1, height: 18, backgroundColor: '#ECEFEA' }} />
              <Ionicons
                name="scan-outline"
                size={18}
                color="#7FA890"
                style={{ marginLeft: 12 }}
              />
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
          {/* 入口宫格 —— 浅色磁贴 + 矢量图标，5 列两排（列对齐） */}
          <Animated.View
            entering={FadeInDown.delay(160).duration(450)}
            style={{ boxShadow: '0px 6px 18px rgba(0,0,0,0.07)' }}
            className="mx-4 rounded-3xl bg-white px-2 pb-3 pt-3">
            <View className="flex-row flex-wrap">
              {ENTRIES.map((e) => (
                <EntryItem
                  key={e.label}
                  entry={e}
                  width={gridItemW}
                  onPress={() => (e.route ? router.push(e.route as any) : comingSoon(e.label))}
                />
              ))}
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
              {/* 今日碳足迹 —— 带背景图的优雅统计面板 */}
              {data.eco && (
                <Animated.View entering={FadeInDown.delay(220).duration(450)} className="mt-5">
                  <SectionHeader title="今日碳足迹" subtitle="每一步都算数" />
                  <View className="mx-4 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5 }}>
                    <Image source={require('../../assets/images/home/eco_forest.jpg')}
                      style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
                    <LinearGradient colors={['rgba(27,67,50,0.88)', 'rgba(27,67,50,0.75)']}
                      style={{ padding: 18 }}>
                      <View className="flex-row justify-between">
                        <View className="items-center flex-1">
                          <Text className="text-3xl font-extrabold text-white">{data.eco.carbonCredits}</Text>
                          <Text className="text-[11px] text-white/65 mt-0.5">碳积分</Text>
                        </View>
                        <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                        <View className="items-center flex-1">
                          <Text className="text-3xl font-extrabold text-white">{data.eco.totalCarbonSaved.toFixed(1)}</Text>
                          <Text className="text-[11px] text-white/65 mt-0.5">累计减排 kg</Text>
                        </View>
                        <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                        <View className="items-center flex-1">
                          <Text className="text-3xl font-extrabold text-white">{data.eco.treesPlanted}</Text>
                          <Text className="text-[11px] text-white/65 mt-0.5">已种虚拟树</Text>
                        </View>
                        <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                        <View className="items-center flex-1">
                          <Text className="text-3xl font-extrabold text-white">{data.eco.points}</Text>
                          <Text className="text-[11px] text-white/65 mt-0.5">可用积分</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                </Animated.View>
              )}

              {/* 答题挑战 —— Unsplash 真实配图 */}
              <Animated.View entering={FadeInDown.delay(280).duration(450)} className="mt-5">
                <SectionHeader title="答题挑战" subtitle="环保知识小考" onMore={() => router.push('/green')} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {data.quizzes.map((it) => (
                    <QuizCard key={it.id} item={it} width={quizCardW} />
                  ))}
                </ScrollView>
              </Animated.View>

              {/* 社区精选 —— Hero大图 + 双列瀑布流 */}
              {data.stories.length > 0 && (() => {
                const fallbackImgs = [
                  require('../../assets/images/home/eco_wind.jpg'),
                  require('../../assets/images/home/eco_trees.jpg'),
                  require('../../assets/images/home/eco_mountain.jpg'),
                  require('../../assets/images/home/eco_sunlight.jpg'),
                ];
                const storyData = data.stories.map((s, idx) => ({
                  s,
                  img: s.images?.[0] ? resolveLegacyImage(s.images[0]) : fallbackImgs[idx % 4],
                }));
                const hero = storyData[0];
                const rest = storyData.slice(1);
                const colW = Math.floor((width - 32 - 10) / 2);
                const heights = [196, 172, 210, 184];
                const leftCol: { s: Story; img: any; h: number }[] = [];
                const rightCol: { s: Story; img: any; h: number }[] = [];
                let hL = 0, hR = 0;
                rest.forEach((sd, i) => {
                  const h = heights[i % heights.length];
                  if (hL <= hR) { leftCol.push({ ...sd, h }); hL += h; }
                  else { rightCol.push({ ...sd, h }); hR += h; }
                });
                return (
                  <Animated.View entering={FadeInDown.delay(340).duration(450)} className="mt-5 mb-4">
                    <SectionHeader title="社区精选" subtitle="绿色生活日记" onMore={() => router.push('/community')} />

                    {/* Hero 大图卡 —— 首条占整行 */}
                    <Pressable
                      onPress={() => router.push({ pathname: '/story/[id]', params: { id: hero.s.id } })}
                      className="mx-4 rounded-2xl overflow-hidden active:scale-[0.98]"
                      style={{ height: 200, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
                      <Image source={hero.img} style={{ width: width - 32, height: 200 }} resizeMode="cover" />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 }} />
                      <View className="absolute bottom-4 left-4 right-4">
                        <Text numberOfLines={2} className="text-white font-extrabold text-[17px] leading-tight">{hero.s.title}</Text>
                        <Text className="text-white/55 text-[12px] mt-1.5">{hero.s.author?.username ?? '绿途用户'}</Text>
                      </View>
                    </Pressable>

                    {/* 双列瀑布流 —— 剩余 3 条 */}
                    {rest.length > 0 && (
                      <View className="flex-row px-4 mt-2.5" style={{ gap: 10 }}>
                        <View className="flex-1" style={{ gap: 10 }}>
                          {leftCol.map((entry) => (
                            <Pressable key={entry.s.id}
                              onPress={() => router.push({ pathname: '/story/[id]', params: { id: entry.s.id } })}
                              className="rounded-2xl overflow-hidden active:scale-[0.98]"
                              style={{ width: colW, height: entry.h, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
                              <Image source={entry.img} style={{ width: colW, height: entry.h }} resizeMode="cover" />
                              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }} />
                              <View className="absolute bottom-3 left-3 right-3">
                                <Text numberOfLines={2} className="text-white font-extrabold text-[13px] leading-tight">{entry.s.title}</Text>
                                <Text className="text-white/55 text-[10px] mt-1">{entry.s.author?.username ?? '绿途用户'}</Text>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                        <View className="flex-1" style={{ gap: 10 }}>
                          {rightCol.map((entry) => (
                            <Pressable key={entry.s.id}
                              onPress={() => router.push({ pathname: '/story/[id]', params: { id: entry.s.id } })}
                              className="rounded-2xl overflow-hidden active:scale-[0.98]"
                              style={{ width: colW, height: entry.h, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
                              <Image source={entry.img} style={{ width: colW, height: entry.h }} resizeMode="cover" />
                              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }} />
                              <View className="absolute bottom-3 left-3 right-3">
                                <Text numberOfLines={2} className="text-white font-extrabold text-[13px] leading-tight">{entry.s.title}</Text>
                                <Text className="text-white/55 text-[10px] mt-1">{entry.s.author?.username ?? '绿途用户'}</Text>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                  </Animated.View>
                );
              })()}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
