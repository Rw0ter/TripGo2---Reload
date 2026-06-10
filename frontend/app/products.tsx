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
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

// ── 调色板（岭南绿 + 暖木金 + 米白，与 home.tsx / search.tsx 同源，单一来源）──
const PANEL = '#FBFAF3'; // 右侧网格背板：比米白略亮，让白卡浮起
const RAIL = '#ECE7D6'; // 左侧分类栏底色：比主背景略深，形成「目录侧栏」分区
const PRIMARY = '#386641';
const GOLD = '#D4A76A';
const PRICE = '#ff3e30';
const INK = '#2f3a30';
const MUTE = '#9a9382';
const HAIRLINE = '#F0ECDD'; // 卡片信息区细分隔线（与 search 下拉分隔线同色）

// 「热销」角标阈值：已售达此数即点亮。基于真实 number 字段的展示态启发式，
// 后端若补 isHot 字段应改为字段驱动。
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

// type → 卡片角标 / 区头文案。
const TYPE_LABELS: Record<number, string> = {
  1: '古筝工艺',
  2: '曲艺传承',
  3: '传统技艺',
  4: '岭南美术',
  5: '民俗文化',
  6: '地道风味',
};

// type → 卡片角标渐变（品牌内多彩；活泼但不出戏）。下标 1–6 对应分类。
const TYPE_GRADIENTS: Record<number, readonly [string, string]> = {
  1: ['#3E6B4F', '#5C8A6D'],
  2: ['#B07F32', '#D4A76A'],
  3: ['#4A7359', '#6E9B7B'],
  4: ['#9C6F26', '#C79A4E'],
  5: ['#386641', '#6E9B7B'],
  6: ['#A9772F', '#D4A76A'],
};

// 左侧分类栏每项的图标 + 前景色：下标与 CATS 对齐（含「全部」）。
const CAT_STYLE: { icon: keyof typeof Ionicons.glyphMap; fg: string }[] = [
  { icon: 'apps', fg: '#386641' },
  { icon: 'musical-notes', fg: '#9C6F26' },
  { icon: 'mic', fg: '#3E6B4F' },
  { icon: 'construct', fg: '#A9772F' },
  { icon: 'color-palette', fg: '#4A7359' },
  { icon: 'flower', fg: '#B07F32' },
  { icon: 'fast-food', fg: '#9C6F26' },
];

// 右栏排序键（纯前端，不改后端契约、不新增字段）：
// 综合 = 后端原序；销量 = number 降序；价格 = money 升/降可切。
type SortKey = 'default' | 'sales' | 'price';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [type, setType] = useState<number>(0);

  // 排序状态：键 + 价格升降方向（仅价格用到方向）。切换分类时不重置，符合「带着排序逛各类」直觉。
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [priceAsc, setPriceAsc] = useState(true);

  // 左侧分类栏固定窄栏；右侧网格区 = 屏宽 − 栏宽。
  // 右侧双列卡片：扣去内边距(14*2)与列间距(10)后二等分。
  const RAIL_W = 82;
  const gridW = width - RAIL_W;
  const colW = Math.floor((gridW - 14 * 2 - 10) / 2);
  // 网格图固定比例（略竖），让两列等高、电商目录感强。
  const imgH = Math.round(colW * 0.96);

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

  const count = products?.length ?? 0;

  // 纯前端排序：拷贝后排，不改原引用、不碰后端字段。number/money 用 Number()||0 防脏数据。
  // 与卡片热销角标同款解析口径，保证一致性。
  const sorted = useMemo(() => {
    const list = products ?? [];
    if (sortKey === 'default') return list;
    const next = [...list];
    if (sortKey === 'sales') {
      next.sort((a, b) => (Number(b.number) || 0) - (Number(a.number) || 0));
    } else {
      next.sort((a, b) => {
        const d = (Number(a.money) || 0) - (Number(b.money) || 0);
        return priceAsc ? d : -d;
      });
    }
    return next;
  }, [products, sortKey, priceAsc]);

  // 右侧条目等量分到固定两列（电商网格，等高规整，不做高低落差瀑布流——与首页区分）。
  // 显式 colA/colB（沿用 search.tsx 已验证写法，规避 flex-wrap 窄屏掉列）。
  const { colA, colB } = useMemo(() => {
    const a: Product[] = [];
    const b: Product[] = [];
    sorted.forEach((p, i) => (i % 2 === 0 ? a : b).push(p));
    return { colA: a, colB: b };
  }, [sorted]);

  return (
    <View className="flex-1" style={{ backgroundColor: RAIL }}>
      {/* ── 扁平品牌头部条：返回 + 搜索胶囊 + 我的订单（无大 Hero、无圆角上提面板）── */}
      <View style={{ paddingTop: insets.top, backgroundColor: PRIMARY }}>
        <View className="h-12 flex-row items-center px-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="返回"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            className="h-10 w-10 items-center justify-center">
            <Ionicons name="chevron-back" size={23} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/search')}
            accessibilityRole="search"
            accessibilityLabel="搜索文创好物"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            className="ml-1 h-9 flex-1 flex-row items-center rounded-full bg-white/95 px-3.5">
            <Ionicons name="search" size={15} color={PRIMARY} />
            <Text className="ml-2 text-[13px]" style={{ color: '#8f988e' }}>
              搜索文创好物 · 把广东带回家
            </Text>
          </Pressable>

          {/* 我的订单入口（替换原悬空购物袋装饰图标，跳真实 /orders 路由）*/}
          <Pressable
            onPress={() => router.push('/orders')}
            accessibilityRole="button"
            accessibilityLabel="我的订单"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            className="ml-1 h-10 w-10 items-center justify-center">
            <Ionicons name="bag-handle-outline" size={21} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ── 双栏目录主体：左固定分类导航栏 + 右可滚动商品网格 ── */}
      <View className="flex-1 flex-row">
        {/* 左：竖向分类栏（选中态：左侧暖金竖条 + 浅底高亮 + 该类前景色圆形底 + 加粗彩字）*/}
        <View style={{ width: RAIL_W, backgroundColor: RAIL }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 6, paddingBottom: insets.bottom + 24 }}>
            {CATS.map((cat, i) => {
              const active = type === i;
              const s = CAT_STYLE[i];
              return (
                <Pressable
                  key={cat}
                  onPress={() => setType(i)}
                  accessibilityRole="tab"
                  accessibilityLabel={cat}
                  accessibilityState={{ selected: active }}
                  style={{ backgroundColor: active ? PANEL : 'transparent' }}
                  className="relative items-center justify-center py-3.5">
                  {/* 选中指示：左侧暖金竖条 */}
                  {active ? (
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 12,
                        bottom: 12,
                        width: 3.5,
                        borderTopRightRadius: 3,
                        borderBottomRightRadius: 3,
                        backgroundColor: GOLD,
                      }}
                    />
                  ) : null}
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: active ? `${s.fg}1A` : 'transparent' }}>
                    <Ionicons name={s.icon} size={18} color={active ? s.fg : '#A79F8B'} />
                  </View>
                  <Text
                    className="mt-1 text-[12px]"
                    style={{ color: active ? s.fg : '#857E6C', fontWeight: active ? '800' : '500' }}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 右：商品网格区 */}
        <View className="flex-1" style={{ backgroundColor: PANEL }}>
          {/* 区头：当前分类名 + 件数（细条，不是首页绿竖条 SectionTitle 套路）*/}
          <View
            className="flex-row items-center px-3.5"
            style={{ height: 38, borderBottomWidth: 1, borderBottomColor: HAIRLINE }}>
            <Text className="text-[14px] font-extrabold" style={{ color: INK }}>
              {type === 0 ? '岭南匠造 · 全部好物' : `${CATS[type]} · ${TYPE_LABELS[type] ?? ''}`}
            </Text>
            {count > 0 ? (
              <Text className="ml-2 text-[11px]" style={{ color: MUTE }}>
                {count} 件甄选
              </Text>
            ) : null}
          </View>

          {/* 排序 toolbar：综合 / 销量 / 价格（纯前端，无新依赖、不改后端契约）。
              仅在有数据时出现；价格可切升降。 */}
          {!error && products && count > 0 ? (
            <View
              className="flex-row items-center px-3.5"
              style={{ height: 36, borderBottomWidth: 1, borderBottomColor: HAIRLINE }}>
              <SortTab
                label="综合"
                active={sortKey === 'default'}
                onPress={() => setSortKey('default')}
              />
              <SortTab
                label="销量"
                active={sortKey === 'sales'}
                onPress={() => setSortKey('sales')}
              />
              <SortTab
                label="价格"
                active={sortKey === 'price'}
                caret={sortKey === 'price' ? (priceAsc ? 'up' : 'down') : 'both'}
                onPress={() => {
                  if (sortKey === 'price') setPriceAsc((v) => !v);
                  else {
                    setSortKey('price');
                    setPriceAsc(true);
                  }
                }}
              />
            </View>
          ) : null}

          {error ? (
            // 错误重试态：与 home / search 的 cloud-offline 重试模式对齐，避免静默卡死 spinner。
            <Pressable
              onPress={() => void load()}
              accessibilityRole="button"
              accessibilityLabel="加载失败，点此重试"
              className="flex-1 items-center justify-center px-6">
              <View
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: '#E9E4D4' }}>
                <Ionicons name="cloud-offline-outline" size={36} color="#B7AE97" />
              </View>
              <Text className="mt-4 text-[15px] font-semibold" style={{ color: '#7d7768' }}>
                内容加载失败
              </Text>
              <Text className="mt-1 text-[13px]" style={{ color: '#a8a08d' }}>
                点此重试
              </Text>
            </Pressable>
          ) : !products ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text className="mt-3 text-[13px]" style={{ color: MUTE }}>
                正在为你甄选好物…
              </Text>
            </View>
          ) : count === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <View
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: '#E9E4D4' }}>
                <Ionicons name="cube-outline" size={38} color="#B7AE97" />
              </View>
              <Text className="mt-4 text-[15px] font-semibold" style={{ color: '#7d7768' }}>
                该分类暂无产品
              </Text>
              <Text className="mt-1 text-center text-[13px]" style={{ color: '#a8a08d' }}>
                换个分类，再逛逛岭南匠造
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingTop: 12,
                paddingBottom: insets.bottom + 28,
              }}>
              {/* 固定双列网格：左右两列等量分发，规整罗列（区别于首页瀑布流）*/}
              <View className="flex-row" style={{ gap: 10 }}>
                <View className="flex-1" style={{ gap: 12 }}>
                  {colA.map((item, i) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      width={colW}
                      imgH={imgH}
                      index={i * 2}
                      onPress={() =>
                        router.push({ pathname: '/product/[id]', params: { id: item.id } })
                      }
                    />
                  ))}
                </View>
                <View className="flex-1" style={{ gap: 12 }}>
                  {colB.map((item, i) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      width={colW}
                      imgH={imgH}
                      index={i * 2 + 1}
                      onPress={() =>
                        router.push({ pathname: '/product/[id]', params: { id: item.id } })
                      }
                    />
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

// ── 排序 toolbar 单项：文字 + 可选升降 caret（价格用）──
// caret='both' 表示价格未激活时的双向小箭头提示；'up'/'down' 表示当前升/降。
function SortTab({
  label,
  active,
  caret,
  onPress,
}: {
  label: string;
  active: boolean;
  caret?: 'up' | 'down' | 'both';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`按${label}排序`}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      className="mr-5 flex-row items-center">
      <Text
        className="text-[12.5px]"
        style={{ color: active ? PRIMARY : '#857E6C', fontWeight: active ? '800' : '500' }}>
        {label}
      </Text>
      {caret ? (
        <View className="ml-0.5 items-center justify-center">
          <Ionicons
            name="caret-up"
            size={8}
            color={caret === 'up' ? PRIMARY : '#C4BCA8'}
            style={{ marginBottom: -3 }}
          />
          <Ionicons
            name="caret-down"
            size={8}
            color={caret === 'down' ? PRIMARY : '#C4BCA8'}
          />
        </View>
      ) : (
        // 激活下划线：仅综合/销量用暖金下划线作为选中态强调（价格靠 caret 表达方向）。
        active ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -10,
              height: 2,
              borderRadius: 2,
              backgroundColor: GOLD,
            }}
          />
        ) : null
      )}
    </Pressable>
  );
}

// ── 文创网格卡：等高方图 + 热销角标 + type 渐变角标 + 标题 + ¥红价/已售 ──
// 规整等高卡（非瀑布流交错）；按压缩放微交互 + FadeIn 入场。
function ProductCard({
  product: p,
  width,
  imgH,
  index,
  onPress,
}: {
  product: Product;
  width: number;
  imgH: number;
  index: number;
  onPress: () => void;
}) {
  const label = TYPE_LABELS[p.type] ?? null;
  const grad = TYPE_GRADIENTS[p.type] ?? ([PRIMARY, '#5C8A6D'] as const);

  // 角标真实数据驱动：仅当已售达阈值才点亮「热销」，避免伪造无字段支撑的运营信号。
  const sold = Number(p.number) || 0;
  const hot = sold >= HOT_THRESHOLD;

  return (
    <Animated.View entering={FadeIn.delay(Math.min(index, 8) * 45).duration(360)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={p.title}
        style={({ pressed }) => ({
          width,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
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
          {/* 热销角标（左上，真实已售驱动）*/}
          {hot ? (
            <View
              className="absolute left-2 top-2 flex-row items-center rounded-full px-2 py-0.5"
              style={{ backgroundColor: PRICE }}>
              <Ionicons name="flame" size={10} color="#fff" />
              <Text className="ml-0.5 text-[10px] font-bold text-white">热销</Text>
            </View>
          ) : null}
          {/* type 分类渐变角标（右下，呼应品牌内渐变药丸语汇）*/}
          {label ? (
            <View className="absolute bottom-2 right-2 overflow-hidden rounded-full">
              <LinearGradient
                colors={grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 8, paddingVertical: 2.5 }}>
                <Text className="text-[10px] font-semibold text-white">{label}</Text>
              </LinearGradient>
            </View>
          ) : null}
        </View>

        {/* 卡下信息区：标题（两行定高）/ 细分隔线 / 价格 · 已售 */}
        <View className="px-2.5 pb-2.5 pt-2">
          <Text
            numberOfLines={2}
            className="text-[13px] font-semibold leading-[18px]"
            style={{ color: INK, minHeight: 36 }}>
            {p.title}
          </Text>

          <View style={{ height: 1, backgroundColor: HAIRLINE }} className="my-2" />

          <View className="flex-row items-end justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-[11px] font-bold" style={{ color: PRICE }}>
                ¥
              </Text>
              <Text className="text-[17px] font-extrabold" style={{ color: PRICE }}>
                {p.money}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="cart-outline" size={11} color="#b3aa94" />
              <Text className="ml-1 text-[10.5px]" style={{ color: '#a8a08d' }}>
                已售{p.number}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}