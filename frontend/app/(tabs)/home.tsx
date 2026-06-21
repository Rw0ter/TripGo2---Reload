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

// 四宫格 / 五项入口是 App 导航菜单（非后端数据），保持静态。
const GRID4 = [
  { icon: require('../../assets/legacy/img/index_list_4combo/qd.png'), label: '签到' },
  { icon: require('../../assets/legacy/img/lxwd.png'), label: '绿色行动' },
  { icon: require('../../assets/legacy/img/index_list_4combo/phb.png'), label: '排行榜' },
  { icon: require('../../assets/legacy/img/VR.png'), label: 'VR' },
];

const ENTRY5 = [
  { icon: require('../../assets/legacy/img/pipa1.png'), label: '生态良品' },
  { icon: require('../../assets/legacy/img/lxdt3.png'), label: '绿色地图' },
  { icon: require('../../assets/legacy/img/zhushou.png'), label: '智能助手' },
  { icon: require('../../assets/legacy/img/people_dance.png'), label: '环保学堂' },
  { icon: require('../../assets/legacy/img/tieding1.png'), label: '知识库' },
];


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

  // 手动滑动时实时更新指示器：onMomentumScrollEnd 只在惯性结束时触发，跟手性差。
  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
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
  const hotCardW = Math.round(width * 0.62);
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
              style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.12)' }}
              className="mt-3 h-11 flex-row items-center rounded-full bg-white px-4">
              <Ionicons name="search" size={16} color="#5C8A6D" />
              <Text className="ml-2 text-sm text-[#9aa39b]">
                搜索生态良品 / 环保知识 / 活动
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
                const routes: Record<string, string> = { '签到': '/checkin', '绿色行动': '/green', '排行榜': '/leaderboard', 'VR': '/vr' };
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
                const routes: Record<string, string> = { '生态良品': '/products', '绿色地图': '/map', '智能助手': '/ai/assistant', '环保学堂': '/green', '知识库': '/cantonese' };
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
