import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

// ── 调色板（岭南绿 + 暖木金 + 米白，与首页 home.tsx / search.tsx 同源，单一来源）──
const BG = '#F4F1E4';
const PRIMARY = '#386641';
const GOLD = '#D4A76A';
const PRICE = '#ff3e30';
const INK = '#2f3a30';
const MUTE = '#9a9382';
const HAIRLINE = '#F0ECDD'; // 卡片信息区细分隔线（与 search 下拉分隔线同色）

// 「热销」角标的展示态阈值：已售达此数即点亮 flame 角标。
// 注意：这是基于真实 number 字段的展示态启发式；后端若补 isHot 字段应改为字段驱动。
const HOT_THRESHOLD = 100;

// ── 后端数据契约 ──
// 数据走 apiRequest：GET /destinations 取全部；GET /destinations?type=N 取某类。
interface Product {
  id: number;
  title: string;
  image: string;
  money: string;
  number: string;
  type: number;
  description?: string;
  detail?: string;
}

// 分类下标 i 即 type i（0=全部=不传 type）。切换分类重新拉取。
const CATS = ['全部', '古筝', '曲艺', '技艺', '美术', '民俗', '特产'];

// type → 卡片药丸文案。
const TYPE_LABELS: Record<number, string> = {
  1: '古筝工艺',
  2: '曲艺传承',
  3: '传统技艺',
  4: '岭南美术',
  5: '民俗文化',
  6: '地道风味',
};

// type → 标签药丸渐变（品牌内多彩；活泼但不出戏）。下标 1–6 对应分类。
const TYPE_GRADIENTS: Record<number, readonly [string, string]> = {
  1: ['#3E6B4F', '#5C8A6D'],
  2: ['#B07F32', '#D4A76A'],
  3: ['#4A7359', '#6E9B7B'],
  4: ['#9C6F26', '#C79A4E'],
  5: ['#386641', '#6E9B7B'],
  6: ['#A9772F', '#D4A76A'],
};

// 分类 chip 的品牌内前景色 + 小图标：下标与 CATS 对齐（含「全部」）。
const CAT_STYLE: { icon: keyof typeof Ionicons.glyphMap; fg: string }[] = [
  { icon: 'apps', fg: '#386641' },
  { icon: 'musical-notes', fg: '#9C6F26' },
  { icon: 'mic', fg: '#3E6B4F' },
  { icon: 'construct', fg: '#A9772F' },
  { icon: 'color-palette', fg: '#4A7359' },
  { icon: 'flower', fg: '#B07F32' },
  { icon: 'fast-food', fg: '#9C6F26' },
];

// 瀑布流图片高度池——交错取值制造「高低落差」（仿 home / search MasonryCard）。
const IMG_HEIGHTS = [188, 156, 174, 206, 162, 196, 168, 200];

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [type, setType] = useState<number>(0);

  // 双列瀑布流列宽：左右各占一半，扣去外边距(16*2)与列间距(12)。
  const colW = Math.floor((width - 32 - 12) / 2);

  const load = useCallback(async () => {
    setError(false);
    setProducts(null);
    try {
      const qs = type !== 0 ? `?type=${type}` : '';
      setProducts(await apiRequest<Product[]>(`/destinations${qs}`));
    } catch {
      setError(true);
      setProducts(null);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  // 按「较矮列优先」分两列，配交错图高，制造高低落差瀑布流（仿 home / search）。
  const columns = useMemo(() => {
    const colA: { item: Product; h: number }[] = [];
    const colB: { item: Product; h: number }[] = [];
    let hA = 0;
    let hB = 0;
    (products ?? []).forEach((item, i) => {
      const h = IMG_HEIGHTS[i % IMG_HEIGHTS.length];
      if (hA <= hB) {
        colA.push({ item, h });
        hA += h;
      } else {
        colB.push({ item, h });
        hB += h;
      }
    });
    return { colA, colB };
  }, [products]);

  const count = products?.length ?? 0;

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>

        {/* ── 森林绿渐变 Hero 头部：返回 + 岭南文创标题区 + 横滑彩色分类 chip ── */}
        <LinearGradient colors={['#3E6B4F', '#5C8A6D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* 顶栏：返回箭头 + 标题 */}
          <Animated.View
            entering={FadeInDown.duration(450)}
            style={{ paddingTop: insets.top + 6 }}
            className="px-3 pb-1">
            <View className="h-10 flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="返回"
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                className="h-10 w-10 items-center justify-center">
                <Ionicons name="chevron-back" size={23} color="#fff" />
              </Pressable>
              <Text className="ml-1 flex-1 text-[17px] font-bold text-white" style={{ letterSpacing: -0.2 }}>
                文创集市
              </Text>
              <View style={{ width: 40 }} />
            </View>
          </Animated.View>

          {/* 主题标题区：暖金竖条 + 大标题 + 副标语胶囊 + 件数徽章 */}
          <Animated.View
            entering={FadeInDown.delay(70).duration(450)}
            className="px-5 pb-4 pt-1">
            <View className="flex-row items-center">
              <View style={{ width: 4, height: 24, borderRadius: 2, backgroundColor: GOLD }} />
              <Text className="ml-2.5 text-[24px] font-extrabold text-white" style={{ letterSpacing: 0.5 }}>
                岭南匠造
              </Text>
            </View>
            <View className="mt-2 flex-row items-center">
              <View className="flex-row items-center rounded-full bg-white/18 px-2.5 py-1">
                <Ionicons name="leaf" size={11} color="#fff" />
                <Text className="ml-1 text-[12px] font-medium text-white">非遗精选 · 把广东带回家</Text>
              </View>
              {count > 0 ? (
                <Text className="ml-2 text-[12px] text-white/80">{CATS[type]} · {count} 件</Text>
              ) : null}
            </View>
          </Animated.View>

          {/* 横滑彩色分类 chip（图标 + 文字胶囊，选中态白底高亮 + 阴影 + 按压缩放）*/}
          <Animated.View entering={FadeInDown.delay(140).duration(450)} className="pb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 9 }}>
              {CATS.map((cat, i) => {
                const active = type === i;
                const s = CAT_STYLE[i];
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setType(i)}
                    accessibilityRole="button"
                    accessibilityLabel={cat}
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => ({
                      backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.16)',
                      transform: pressed ? [{ scale: 0.95 }] : [],
                      boxShadow: active ? '0px 3px 10px rgba(0,0,0,0.18)' : undefined,
                    })}
                    className="flex-row items-center rounded-full px-3.5 py-2">
                    <Ionicons
                      name={s.icon}
                      size={14}
                      color={active ? s.fg : 'rgba(255,255,255,0.9)'}
                    />
                    <Text
                      className="ml-1.5 text-[13.5px] font-semibold"
                      style={{ color: active ? s.fg : 'rgba(255,255,255,0.92)' }}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </LinearGradient>

        {/* ── 主体：圆角上提，盖住 Hero 底边（与首页 / 搜索同源）── */}
        <View className="-mt-4 min-h-[460px] rounded-t-[22px] pt-5" style={{ backgroundColor: BG }}>
          {/* 区块标题：绿色竖条 + 礼物图标 + 当前分类 + 副文案（仿 search SectionTitle）*/}
          {!error && products && count > 0 ? (
            <View className="mb-3 flex-row items-end px-4">
              <View style={{ width: 4, height: 17, borderRadius: 2, backgroundColor: PRIMARY }} />
              <Ionicons name="gift" size={15} color={PRIMARY} style={{ marginLeft: 7, marginBottom: 1 }} />
              <Text className="ml-2 text-[16px] font-extrabold" style={{ color: INK }}>
                {type === 0 ? '全部好物' : CATS[type]}
              </Text>
              <Text className="ml-2 text-[11px]" style={{ color: MUTE }}>匠心入选</Text>
            </View>
          ) : null}

          {error ? (
            // 错误重试态：与 home / search 的 cloud-offline 重试模式对齐，避免静默卡死 spinner。
            <Pressable
              onPress={() => void load()}
              accessibilityRole="button"
              accessibilityLabel="加载失败，点此重试"
              className="items-center py-24">
              <View className="h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: '#E9E4D4' }}>
                <Ionicons name="cloud-offline-outline" size={36} color="#B7AE97" />
              </View>
              <Text className="mt-4 text-[15px] font-semibold" style={{ color: '#7d7768' }}>内容加载失败</Text>
              <Text className="mt-1 text-[13px]" style={{ color: '#a8a08d' }}>点此重试</Text>
            </Pressable>
          ) : !products ? (
            <View className="items-center py-24">
              <ActivityIndicator size="large" color="#3E6B4F" />
              <Text className="mt-3 text-[13px]" style={{ color: MUTE }}>正在为你甄选好物…</Text>
            </View>
          ) : count === 0 ? (
            <View className="items-center py-24">
              <View className="h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: '#E9E4D4' }}>
                <Ionicons name="cube-outline" size={38} color="#B7AE97" />
              </View>
              <Text className="mt-4 text-[15px] font-semibold" style={{ color: '#7d7768' }}>该分类暂无产品</Text>
              <Text className="mt-1 text-[13px]" style={{ color: '#a8a08d' }}>换个分类，再逛逛岭南匠造</Text>
            </View>
          ) : (
            <View className="flex-row px-4" style={{ gap: 12 }}>
              <View className="flex-1">
                {columns.colA.map(({ item, h }, i) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    width={colW}
                    imgH={h}
                    delay={i * 60}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                  />
                ))}
              </View>
              <View className="flex-1">
                {columns.colB.map(({ item, h }, i) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    width={colW}
                    imgH={h}
                    delay={i * 60 + 30}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── 文创产品卡：真实图打底（交错高度）+ 热销角标 + type 渐变药丸 ──
// 信息区三段式（标题 / 细分隔线 / ¥红价·已售）；按压缩放微交互 + FadeInDown 入场。
function ProductCard({
  product: p,
  width,
  imgH,
  delay,
  onPress,
}: {
  product: Product;
  width: number;
  imgH: number;
  delay: number;
  onPress: () => void;
}) {
  const label = TYPE_LABELS[p.type] ?? null;
  const grad = TYPE_GRADIENTS[p.type] ?? ([PRIMARY, '#5C8A6D'] as const);

  // 角标真实数据驱动：仅当已售达阈值才点亮「热销」，避免伪造「精选」之类无字段支撑的运营信号。
  const sold = Number(p.number) || 0;
  const hot = sold >= HOT_THRESHOLD;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(420)} className="mb-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={p.title}
        style={({ pressed }) => ({
          width,
          boxShadow: '0px 5px 14px rgba(0,0,0,0.10)',
          transform: pressed ? [{ scale: 0.97 }] : [],
        })}
        className="overflow-hidden rounded-2xl bg-white">
        {/* 真实文创图打底（已注册到 legacy-images.ts）*/}
        <View style={{ width, height: imgH }}>
          <Image
            source={resolveLegacyImage(p.image)}
            resizeMode="cover"
            style={{ width, height: imgH }}
          />
          {/* 顶部轻微渐隐，让叠放的角标更清晰 */}
          <LinearGradient
            colors={['rgba(0,0,0,0.30)', 'transparent']}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 58 }}
          />
          {/* 热销角标（左上，真实已售驱动）*/}
          {hot ? (
            <View
              className="absolute left-2.5 top-2.5 flex-row items-center rounded-full px-2 py-0.5"
              style={{ backgroundColor: PRICE }}>
              <Ionicons name="flame" size={10} color="#fff" />
              <Text className="ml-0.5 text-[10px] font-bold text-white">热销</Text>
            </View>
          ) : null}
          {/* type 分类渐变药丸（右下，呼应 home QuizCard / search 奖牌渐变药丸语汇）*/}
          {label ? (
            <View className="absolute bottom-2 right-2 overflow-hidden rounded-full">
              <LinearGradient
                colors={grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 9, paddingVertical: 3 }}>
                <Text className="text-[10px] font-semibold text-white">{label}</Text>
              </LinearGradient>
            </View>
          ) : null}
        </View>

        {/* 卡下信息区：标题 / 细分隔线 / 价格行（三段式，提升精品店质感）*/}
        <View className="p-3">
          <Text numberOfLines={2} className="text-[14px] font-semibold leading-5" style={{ color: INK, minHeight: 40 }}>
            {p.title}
          </Text>

          <View style={{ height: 1, backgroundColor: HAIRLINE }} className="my-2.5" />

          <View className="flex-row items-end justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-[12px] font-bold" style={{ color: PRICE }}>¥</Text>
              <Text className="text-[18px] font-extrabold" style={{ color: PRICE }}>{p.money}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="cart-outline" size={12} color="#b3aa94" />
              <Text className="ml-1 text-[11px]" style={{ color: '#a8a08d' }}>已售{p.number}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}