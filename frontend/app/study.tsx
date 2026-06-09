import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

// ── 中国红 · 非遗主题色（与党政红呼应；区别于 App 主体岭南绿）──
const RED = '#C8161D';
const RED_DARK = '#8B1F1F';
const RED_INK = '#5E0E10';
const GOLD = '#C9A24B';
const GOLD_DEEP = '#A9772F';
const BG = '#FBF4EC';
const CARD = '#FFFFFF';
const INK = '#3A2A22';
const SUB = '#7a6b60';
const MUTE = '#9b8f86';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// 后端 GET /cultural?category=topic 返回结构（content 为 JSON 串）。
interface CulturalItem {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  color: string;
}

// content 解析结果——后端 seed 写入的完整字段（详见 prisma/seed.ts）。
interface TopicContent {
  quizId?: number;
  image?: string;
  gallery?: string[];
  intro?: string;
  history?: string;
  highlights?: string[];
  funFact?: string;
}

interface ParsedTopic {
  item: CulturalItem;
  c: TopicContent;
}

function parseContent(content: string): TopicContent {
  try {
    return JSON.parse(content) as TopicContent;
  } catch {
    return {};
  }
}

// 近期活动（暂无对应后端，保留静态展示，用 Legacy 真实非遗活动图）。
const ACTIVITIES = [
  { name: '非遗文化周', date: '6 月 14 日 · 周六', place: '广州 · 北京路', image: 'fyxx/syhd.jpg', desc: '剪纸、泥塑、糖画等多项非遗现场体验，匠人亲授。' },
  { name: '传统戏曲展演', date: '6 月 21 日 · 周六', place: '佛山 · 祖庙', image: 'fyxx/sywhz.png', desc: '粤剧、潮剧专场名段连台，领略岭南戏曲风韵。' },
];

// 概览横条数据——「项目/世界级/国家级/门类」速览，给 Hero 之下补信息密度。
const OVERVIEW = [
  { value: '8', label: '入选项目' },
  { value: '1', label: '世界级' },
  { value: '7', label: '国家级' },
  { value: '5', label: '门类' },
];

// 瀑布流卡片高度池——交错取值制造「高低落差」。
const MASONRY_HEIGHTS = [188, 152, 172, 204, 160, 196, 168];

// 印章式区块标题：描金双竖条 + 印章字 + 可选英文小注。
function SectionTitle({ title, en, icon }: { title: string; en?: string; icon?: IconName }) {
  return (
    <View className="mb-3 flex-row items-end px-4">
      <View style={{ width: 4, height: 19, borderRadius: 2, backgroundColor: RED }} />
      <View style={{ width: 4, height: 19, borderRadius: 2, backgroundColor: GOLD, marginLeft: 2 }} />
      {icon ? <Ionicons name={icon} size={14} color={RED} style={{ marginLeft: 8, marginBottom: 1 }} /> : null}
      <Text className="ml-2 text-[18px] font-extrabold" style={{ color: INK, letterSpacing: 0.3 }}>
        {title}
      </Text>
      {en ? (
        <Text className="ml-2 text-[10px] font-semibold" style={{ color: GOLD_DEEP, letterSpacing: 1, marginBottom: 2 }}>
          {en}
        </Text>
      ) : null}
    </View>
  );
}

export default function StudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [topics, setTopics] = useState<CulturalItem[] | null>(null);
  const [error, setError] = useState(false);

  // 「今日非遗冷知识」轮换索引——3.6s 切换一条 funFact。
  const [factIdx, setFactIdx] = useState(0);

  const load = useCallback(async () => {
    setError(false);
    try {
      setTopics(await apiRequest<CulturalItem[]>('/cultural?category=topic'));
    } catch {
      setError(true);
      setTopics(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // 解析所有 topic 的 content（备用于精选卡 / 冷知识轮换 / 名录卡）。
  const parsed = useMemo<ParsedTopic[]>(
    () => (topics ?? []).map((t) => ({ item: t, c: parseContent(t.content) })),
    [topics],
  );

  // 冷知识池：收集所有非空 funFact，配上来源标题。
  const facts = useMemo(
    () =>
      parsed
        .filter((p) => p.c.funFact)
        .map((p) => ({ source: p.item.title, text: p.c.funFact as string })),
    [parsed],
  );

  const factCount = facts.length;
  useEffect(() => {
    if (factCount <= 1) return;
    const timer = setInterval(() => {
      setFactIdx((i) => (i + 1) % factCount);
    }, 3600);
    return () => clearInterval(timer);
  }, [factCount]);

  const goDetail = useCallback(
    (id: number) => router.push({ pathname: '/study/[id]', params: { id } }),
    [router],
  );

  // 精选取第 1 条；其余进瀑布流。双列按「较矮列优先」分发，制造高低落差。
  const featured = parsed[0];
  const restColumns = useMemo(() => {
    const colA: { p: ParsedTopic; h: number; n: number }[] = [];
    const colB: { p: ParsedTopic; h: number; n: number }[] = [];
    let hA = 0;
    let hB = 0;
    parsed.slice(1).forEach((p, i) => {
      const h = MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length];
      if (hA <= hB) {
        colA.push({ p, h, n: i + 1 });
        hA += h;
      } else {
        colB.push({ p, h, n: i + 1 });
        hB += h;
      }
    });
    return { colA, colB };
  }, [parsed]);

  const fact = factCount ? facts[factIdx % factCount] : null;

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>
        {/* ── 中国红 Hero 头部：编辑式大标题 + 导语 + 概览横条 ── */}
        <LinearGradient colors={[RED, RED_DARK, RED_INK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <ScreenHeader title="非遗课堂" subtitle="广东非物质文化遗产" tint="dark" />
          <Animated.View entering={FadeInDown.duration(420)} className="px-5 pb-5 pt-1">
            <View className="flex-row items-center">
              <View style={{ width: 4, height: 24, borderRadius: 2, backgroundColor: GOLD }} />
              <Text className="ml-2.5 text-[24px] font-extrabold text-white" style={{ letterSpacing: 1 }}>
                岭南非遗志
              </Text>
              <View
                className="ml-2.5 rounded-md px-1.5 py-0.5"
                style={{ borderWidth: 1, borderColor: 'rgba(201,162,75,0.85)' }}>
                <Text className="text-[10px] font-bold" style={{ color: GOLD, letterSpacing: 1 }}>
                  图册
                </Text>
              </View>
            </View>
            <Text className="mt-2.5 text-[13px] leading-[21px] text-white/90">
              声韵悠扬的粤剧、精绣入微的广绣、威武腾跃的醒狮、慢斟细品的工夫茶——一帧帧岭南记忆，皆是匠心与岁月的回响。
            </Text>
          </Animated.View>

          {/* 概览横条：金线分隔的四项数据 */}
          <View
            className="mx-5 mb-6 flex-row overflow-hidden rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(201,162,75,0.35)' }}>
            {OVERVIEW.map((o, i) => (
              <View
                key={o.label}
                className="flex-1 items-center py-2.5"
                style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: 'rgba(201,162,75,0.28)' } : undefined}>
                <Text className="text-[19px] font-extrabold" style={{ color: GOLD }}>
                  {o.value}
                </Text>
                <Text className="mt-0.5 text-[10.5px] text-white/75">{o.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── 主体：暖纸白圆角上提 ── */}
        <View className="-mt-4 rounded-t-[26px] pt-5" style={{ backgroundColor: BG }}>
          {!topics && !error ? (
            <View className="items-center py-16">
              <ActivityIndicator color={RED} />
              <Text className="mt-3 text-[13px]" style={{ color: MUTE }}>
                正在翻开非遗图册…
              </Text>
            </View>
          ) : error ? (
            <View className="items-center py-16">
              <Ionicons name="cloud-offline-outline" size={40} color={MUTE} />
              <Text className="mt-2 text-[13px]" style={{ color: MUTE }}>
                加载失败
              </Text>
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                accessibilityLabel="重试"
                className="mt-3 rounded-full px-7 py-2"
                style={{ backgroundColor: RED }}>
                <Text className="text-[13px] font-bold text-white">重试</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* 今日精选：第 1 条非遗大卡（大图 + 导语 + 冷知识脚注）*/}
              {featured ? (
                <View className="mb-6">
                  <SectionTitle title="今日精选" en="FEATURED" icon="bookmark" />
                  <Animated.View entering={FadeInDown.duration(440)} className="px-4">
                    <Pressable
                      onPress={() => goDetail(featured.item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={featured.item.title}
                      style={({ pressed }) => ({
                        transform: pressed ? [{ scale: 0.99 }] : [],
                        boxShadow: '0px 8px 22px rgba(158,17,21,0.18)',
                      })}
                      className="overflow-hidden rounded-3xl">
                      <View style={{ backgroundColor: CARD }}>
                        <View style={{ height: Math.round(width * 0.52) }}>
                          <Image
                            source={resolveLegacyImage(featured.c.image || '')}
                            resizeMode="cover"
                            style={{ width: '100%', height: '100%' }}
                          />
                          <LinearGradient
                            colors={['transparent', 'rgba(94,14,16,0.92)']}
                            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '78%' }}
                          />
                          {/* 描金「今日精选」印章角标 */}
                          <View
                            className="absolute right-3 top-3 rounded-md px-2 py-1"
                            style={{ backgroundColor: 'rgba(94,14,16,0.55)', borderWidth: 1, borderColor: GOLD }}>
                            <Text className="text-[10px] font-bold" style={{ color: GOLD, letterSpacing: 2 }}>
                              今日精选
                            </Text>
                          </View>
                          <View className="absolute bottom-3 left-4 right-4">
                            <Text className="text-[23px] font-extrabold text-white" style={{ letterSpacing: 1 }}>
                              {featured.item.title}
                            </Text>
                            <Text numberOfLines={1} className="mt-0.5 text-[12.5px] text-white/85">
                              {featured.item.subtitle}
                            </Text>
                          </View>
                        </View>
                        <View className="px-4 pb-4 pt-3">
                          <Text numberOfLines={3} className="text-[13.5px] leading-[22px]" style={{ color: SUB }}>
                            {featured.c.intro || featured.item.subtitle}
                          </Text>
                          {featured.c.funFact ? (
                            <View
                              className="mt-3 flex-row rounded-2xl p-3"
                              style={{ backgroundColor: '#FBEFE2', borderWidth: 1, borderColor: '#F0DDC2' }}>
                              <Ionicons name="bulb" size={15} color={GOLD_DEEP} style={{ marginTop: 1 }} />
                              <Text numberOfLines={2} className="ml-2 flex-1 text-[12px] leading-[19px]" style={{ color: '#7c5a2f' }}>
                                {featured.c.funFact}
                              </Text>
                            </View>
                          ) : null}
                          <View className="mt-3 flex-row items-center">
                            <Text className="text-[12.5px] font-bold" style={{ color: RED }}>
                              展开非遗图册
                            </Text>
                            <Ionicons name="arrow-forward" size={13} color={RED} style={{ marginLeft: 4 }} />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                </View>
              ) : null}

              {/* 今日非遗冷知识：轮换知识卡（用各 topic 的 funFact）*/}
              {fact ? (
                <View className="mb-6 px-4">
                  <LinearGradient
                    colors={['#FFFBF4', '#FBEFDD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 20, borderWidth: 1, borderColor: '#EFDCC0' }}
                    className="overflow-hidden p-4">
                    <View className="flex-row items-center">
                      <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: RED }}>
                        <Text className="text-[10.5px] font-bold text-white" style={{ letterSpacing: 1 }}>
                          你知道吗
                        </Text>
                      </View>
                      <Text className="ml-2 text-[11px] font-semibold" style={{ color: GOLD_DEEP }}>
                        今日非遗冷知识
                      </Text>
                      <View className="flex-1" />
                      {/* 轮换进度小点 */}
                      <View className="flex-row items-center">
                        {facts.map((_, i) => {
                          const active = i === factIdx % factCount;
                          return (
                            <View
                              key={i}
                              style={{
                                width: active ? 14 : 5,
                                height: 5,
                                borderRadius: 3,
                                marginLeft: 3,
                                backgroundColor: active ? RED : '#E4CFB2',
                              }}
                            />
                          );
                        })}
                      </View>
                    </View>
                    <Text className="mt-2.5 text-[14px] leading-[23px]" style={{ color: '#6b4f2c' }}>
                      {fact.text}
                    </Text>
                    <Text className="mt-2 text-[11px] font-semibold" style={{ color: GOLD_DEEP }}>
                      — 关于「{fact.source}」
                    </Text>
                  </LinearGradient>
                </View>
              ) : null}

              {/* 非遗名录：双列高低落差真实图卡（照片优先，红金角标，去图标圆）*/}
              <View className="mb-2">
                <SectionTitle title="非遗名录" en="HERITAGE LIST" icon="ribbon" />
                <View className="flex-row px-4" style={{ gap: 12 }}>
                  <View className="flex-1">
                    {restColumns.colA.map(({ p, h, n }) => (
                      <TopicCard
                        key={p.item.id}
                        title={p.item.title}
                        subtitle={p.item.subtitle}
                        image={p.c.image || ''}
                        height={h}
                        index={n}
                        delay={n * 50}
                        onPress={() => goDetail(p.item.id)}
                      />
                    ))}
                  </View>
                  <View className="flex-1">
                    {restColumns.colB.map(({ p, h, n }) => (
                      <TopicCard
                        key={p.item.id}
                        title={p.item.title}
                        subtitle={p.item.subtitle}
                        image={p.c.image || ''}
                        height={h}
                        index={n}
                        delay={n * 50 + 30}
                        onPress={() => goDetail(p.item.id)}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* 近期活动：真实活动图横卡 */}
              <View className="mt-4">
                <SectionTitle title="近期活动" en="EVENTS" icon="calendar" />
                <View className="px-4">
                  {ACTIVITIES.map((item, i) => (
                    <Animated.View
                      key={item.name}
                      entering={FadeInDown.duration(420).delay(80 + i * 80)}
                      style={{ boxShadow: '0px 5px 14px rgba(94,14,16,0.08)', backgroundColor: CARD }}
                      className="mb-3 flex-row overflow-hidden rounded-2xl">
                      <Image source={resolveLegacyImage(item.image)} style={{ width: 116, height: 104 }} resizeMode="cover" />
                      <View className="flex-1 px-3 py-2.5">
                        <Text className="text-[14.5px] font-bold" style={{ color: INK }}>
                          {item.name}
                        </Text>
                        <View className="mt-1 flex-row items-center">
                          <Ionicons name="time-outline" size={11} color={GOLD_DEEP} />
                          <Text className="ml-1 text-[11px]" style={{ color: GOLD_DEEP }}>
                            {item.date}
                          </Text>
                          <Ionicons name="location-outline" size={11} color={GOLD_DEEP} style={{ marginLeft: 8 }} />
                          <Text className="ml-1 text-[11px]" style={{ color: GOLD_DEEP }}>
                            {item.place}
                          </Text>
                        </View>
                        <Text numberOfLines={2} className="mt-1.5 text-[11.5px] leading-[17px]" style={{ color: SUB }}>
                          {item.desc}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>

              {/* 知识测验 CTA → quiz */}
              <View className="mb-4 mt-4 px-4">
                <Pressable
                  onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: '1' } })}
                  accessibilityRole="button"
                  accessibilityLabel="开始非遗知识测验"
                  style={({ pressed }) => ({ transform: pressed ? [{ scale: 0.98 }] : [] })}
                  className="overflow-hidden rounded-2xl">
                  <LinearGradient
                    colors={[RED, RED_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 16, boxShadow: '0px 6px 16px rgba(200,22,29,0.28)' }}
                    className="flex-row items-center justify-center">
                    <Ionicons name="ribbon-outline" size={18} color="#fff" />
                    <Text className="ml-2 text-[16px] font-bold text-white" style={{ letterSpacing: 1 }}>
                      开始非遗知识测验
                    </Text>
                  </LinearGradient>
                </Pressable>
                <Text className="mt-2.5 text-center text-[11px]" style={{ color: MUTE }}>
                  答题闯关 · 解锁非遗成就 · 登上锦绣山河榜
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── 非遗名录卡：整图铺底 + 红色渐隐 + 描金序号印 + 标题/副标题叠字（去图标圆）──
function TopicCard({
  title,
  subtitle,
  image,
  height,
  index,
  delay,
  onPress,
}: {
  title: string;
  subtitle: string;
  image: string;
  height: number;
  index: number;
  delay: number;
  onPress: () => void;
}) {
  const num = index.toString().padStart(2, '0');
  return (
    <Animated.View entering={FadeInDown.duration(420).delay(delay)} className="mb-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => ({
          height,
          boxShadow: '0px 5px 14px rgba(94,14,16,0.16)',
          transform: pressed ? [{ scale: 0.98 }] : [],
        })}
        className="overflow-hidden rounded-2xl">
        <Image source={resolveLegacyImage(image)} resizeMode="cover" style={{ width: '100%', height }} />
        <LinearGradient
          colors={['transparent', 'rgba(94,14,16,0.88)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '74%' }}
        />
        {/* 顶部金边「非遗」印 + 序号 */}
        <View
          className="absolute left-2 top-2 flex-row items-center rounded-md px-1.5 py-0.5"
          style={{ backgroundColor: 'rgba(94,14,16,0.5)', borderWidth: 1, borderColor: 'rgba(201,162,75,0.9)' }}>
          <Text className="text-[10px] font-bold" style={{ color: GOLD, letterSpacing: 1 }}>
            非遗
          </Text>
          <Text className="ml-1 text-[10px] font-bold text-white/80">{num}</Text>
        </View>
        {/* 标题叠字 */}
        <View className="absolute bottom-2.5 left-3 right-3">
          <Text className="text-[16px] font-extrabold text-white" style={{ letterSpacing: 0.5 }}>
            {title}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-[11px] text-white/85">
            {subtitle}
          </Text>
          {/* 描金细线 + 阅读箭头 */}
          <View className="mt-1.5 flex-row items-center">
            <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: GOLD }} />
            <Ionicons name="chevron-forward" size={12} color={GOLD} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}