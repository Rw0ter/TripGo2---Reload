import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { resolveLegacyImage } from '@/lib/legacy-images';

// ── Persistent storage (localStorage on web, SecureStore on native) ──
const storage = Platform.OS === 'web'
  ? {
      getItem: async (k: string) => globalThis.localStorage?.getItem(k) ?? null,
      setItem: async (k: string, v: string) => { globalThis.localStorage?.setItem(k, v); },
      removeItem: async (k: string) => { globalThis.localStorage?.removeItem(k); },
    }
  : {
      getItem: async (k: string) => SecureStore.getItemAsync(k),
      setItem: async (k: string, v: string) => SecureStore.setItemAsync(k, v),
      removeItem: async (k: string) => SecureStore.deleteItemAsync(k),
    };

const HISTORY_KEY = 'search_history_v1';
const MAX_HISTORY = 5;

// ── 调色板（岭南绿 + 暖木金 + 米白，与首页 home.tsx 同源，单一来源）──
const BG = '#F4F1E4';
const PRIMARY = '#386641';
const GOLD = '#D4A76A';
const PRICE = '#ff3e30';
const INK = '#2f3a30';
const MUTE = '#9a9382';

// ── Types ──
interface ScenicItem {
  id: number;
  name: string;
  image: string;
  city: string;
  tag: string;
  summary: string;
  hot?: boolean;
  sort?: number;
}

interface DestinationItem {
  id: number;
  title: string;
  image: string;
  money: string;
  number?: string;
  type?: number;
}

interface SearchResult {
  scenic: ScenicItem[];
  destinations: DestinationItem[];
}

interface RankItem {
  id: number;
  title: string;
  image: string;
  rating: number;
}

// 「猜你想搜」彩色 chip：在「绿 + 暖金」品牌色域内循环取色 + 配套小图标。
const CHIP_PALETTE: { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { bg: '#E7F0E8', fg: '#386641', icon: 'leaf' },
  { bg: '#F6ECD9', fg: '#A9772F', icon: 'compass' },
  { bg: '#E8F0EA', fg: '#3E6B4F', icon: 'location' },
  { bg: '#F4EAD4', fg: '#9C6F26', icon: 'sparkles' },
  { bg: '#EAF1EB', fg: '#4A7359', icon: 'map' },
  { bg: '#F6EFDD', fg: '#B07F32', icon: 'star' },
];

// 文创卡暖色渐变池（destinations 图片未登记 → 禁用图片打底，渐变按 id 取）。
const PRODUCT_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#F3E2C2', '#E7C892'],
  ['#E9EFE2', '#CFE0C2'],
  ['#F5E7CE', '#EAD3A2'],
  ['#EFE6CF', '#DEC79A'],
  ['#EDE7D6', '#D8C9A4'],
  ['#F4ECD6', '#E6D2A6'],
];

// 文创图标按 type 派生（与 products.tsx 的 TYPE_LABELS 体系语义对齐：
// 1 古筝 / 2 曲艺 / 3 技艺 / 4 美术 / 5 民俗 / 6 特产）。
const PRODUCT_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'musical-notes',
  2: 'mic',
  3: 'construct',
  4: 'color-palette',
  5: 'leaf',
  6: 'restaurant',
};

// 排行榜前三名奖牌渐变（金 / 银 / 铜）—— 元组常量，类型更准。
const MEDAL_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#E7C078', GOLD],
  ['#CFCBBE', '#B6B0A0'],
  ['#D9A877', '#C08C57'],
];

// 景点瀑布流高度池——交错取值制造「高低落差」（仿 home MasonryCard）。
const MASONRY_HEIGHTS = [196, 168, 184, 212, 172, 200];

// 文创渐变按 id 取色；图标按 type 取（缺省回退到 id 取一个暖色图标）。
const FALLBACK_PRODUCT_ICONS: readonly (keyof typeof Ionicons.glyphMap)[] = [
  'gift', 'color-palette', 'leaf', 'pricetag', 'sparkles', 'ribbon',
];

function productGradient(id: number): readonly [string, string] {
  return PRODUCT_GRADIENTS[Math.abs(id) % PRODUCT_GRADIENTS.length];
}

function productIcon(item: DestinationItem): keyof typeof Ionicons.glyphMap {
  if (item.type != null && PRODUCT_ICONS[item.type]) return PRODUCT_ICONS[item.type];
  return FALLBACK_PRODUCT_ICONS[Math.abs(item.id) % FALLBACK_PRODUCT_ICONS.length];
}

// ── Helpers ──

/** Derive a stable pseudo-rating (3.5–5.0) from item id for ranking display. */
function computeRating(item: ScenicItem): number {
  const hash = ((item.id * 2654435761) >>> 0) % 100;
  return Math.round((3.5 + (hash / 100) * 1.5) * 10) / 10;
}

// ── Component ──
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // 双列瀑布流列宽：左右各占一半，扣去外边距(16*2)与列间距(12)。
  const colW = Math.floor((width - 32 - 12) / 2);

  // search input
  const [q, setQ] = useState('');
  const inputRef = useRef<TextInput>(null);

  // results
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // initial / idle sections
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [guessTags, setGuessTags] = useState<string[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);

  // ── History persistence ──
  const loadHistory = useCallback(async () => {
    try {
      const raw = await storage.getItem(HISTORY_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }
  }, []);

  const saveHistory = useCallback(async (term: string) => {
    setHistory((prev) => {
      const updated = [term, ...prev.filter((x) => x !== term)].slice(0, MAX_HISTORY);
      void storage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => { /* ignore */ });
      return updated;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    setShowDropdown(false);
    try { await storage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
  }, []);

  // ── Initial data: ranking + guess tags ──
  const loadInitialData = useCallback(async () => {
    setRankingLoading(true);
    try {
      const data = await apiRequest<SearchResult>('/search?q=');
      const scenics = data.scenic || [];
      // ranking: top 10 sorted by computed rating desc
      const ranked = scenics
        .map((s) => ({ id: s.id, title: s.name, image: s.image, rating: computeRating(s) }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);
      setRanking(ranked);
      // guess: 6 random scenic names
      const shuffled = [...scenics].sort(() => 0.5 - Math.random());
      setGuessTags(shuffled.slice(0, 6).map((s) => s.name));
    } catch {
      setRanking([]);
      setGuessTags([]);
    } finally {
      setRankingLoading(false);
    }
  }, []);

  // ── Effects ──
  useEffect(() => {
    const t = setTimeout(() => { inputRef.current?.focus(); }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { void loadHistory(); void loadInitialData(); }, [loadHistory, loadInitialData]);

  // ── Search ──
  const doSearch = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    void saveHistory(trimmed);
    setShowDropdown(false);
    setSearched(true);
    setLoading(true);
    try {
      setResults(await apiRequest<SearchResult>(`/search?q=${encodeURIComponent(trimmed)}`));
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [saveHistory]);

  // ── Type-ahead suggestions (debounced 200ms) ──
  const sugTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchSuggestions = useCallback(async (val: string) => {
    if (!val.trim()) { setSuggestions([]); return; }
    try {
      const data = await apiRequest<SearchResult>(`/search?q=${encodeURIComponent(val.trim())}`);
      setSuggestions([
        ...data.scenic.map((s) => s.name),
        ...data.destinations.map((d) => d.title),
      ].slice(0, MAX_HISTORY));
    } catch { setSuggestions([]); }
  }, []);

  const onChangeText = useCallback((text: string) => {
    setQ(text);
    if (sugTimeout.current) clearTimeout(sugTimeout.current);
    if (!text.trim()) { setSuggestions([]); return; }
    sugTimeout.current = setTimeout(() => { void fetchSuggestions(text); }, 200);
  }, [fetchSuggestions]);

  // ── Dropdown logic ──
  const handleFocus = useCallback(() => {
    if (!q.trim()) setShowDropdown(true);
  }, [q]);

  const handleBlur = useCallback(() => {
    // 轻微延时：让下拉里的 Pressable 在 blur 关闭它之前先命中（配合 keyboardShouldPersistTaps）。
    setTimeout(() => setShowDropdown(false), 160);
  }, []);

  // 回填 + 关下拉 + 搜索三步合一。
  const pickItem = useCallback((item: string) => {
    setQ(item);
    setShowDropdown(false);
    void doSearch(item);
  }, [doSearch]);

  const dropdownItems = q.trim() ? suggestions : history;
  const isHistoryDropdown = !q.trim();

  // ── Visibility flags ──
  const isIdle = !searched && !q.trim() && !loading;
  const hasResults = !!results && (results.scenic.length > 0 || results.destinations.length > 0);
  const showEmpty = searched && !loading && !hasResults;

  const scenicList = results?.scenic ?? [];
  const destinations = results?.destinations ?? [];

  // 景点结果走双列瀑布流——按「较矮列优先」分两列，制造高低落差（仿 home 城市精选）。
  const scenicColumns = useMemo(() => {
    const colA: { item: ScenicItem; h: number }[] = [];
    const colB: { item: ScenicItem; h: number }[] = [];
    let hA = 0;
    let hB = 0;
    (results?.scenic ?? []).forEach((item, i) => {
      const h = MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length];
      if (hA <= hB) { colA.push({ item, h }); hA += h; }
      else { colB.push({ item, h }); hB += h; }
    });
    return { colA, colB };
  }, [results?.scenic]);

  // 文创结果同样按左右两列分发（显式 colA/colB，避免 flex-wrap 在窄屏掉成单列）。
  const destColumns = useMemo(() => {
    const colA: DestinationItem[] = [];
    const colB: DestinationItem[] = [];
    (results?.destinations ?? []).forEach((item, i) => { (i % 2 === 0 ? colA : colB).push(item); });
    return { colA, colB };
  }, [results?.destinations]);

  // ── Render ──
  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* ── 森林绿渐变 Hero 头部：返回 + 标题 + 大号白色搜索胶囊 ── */}
        <LinearGradient colors={['#3E6B4F', '#5C8A6D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Animated.View
            entering={FadeInDown.duration(450)}
            style={{ paddingTop: insets.top + 6 }}
            className="px-4 pb-6">
            {/* 顶栏：返回箭头 + 标题 */}
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
                发现搜索
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* 搜索胶囊：白色大号圆角 + 搜索图标 + 输入框 + 主色按钮 */}
            <View className="mt-3" style={{ zIndex: 20 }}>
              <View
                style={{ boxShadow: '0px 4px 14px rgba(0,0,0,0.16)' }}
                className="h-12 flex-row items-center overflow-hidden rounded-full bg-white pl-4 pr-1.5">
                <Ionicons name="search" size={18} color="#5C8A6D" />
                <TextInput
                  ref={inputRef}
                  value={q}
                  onChangeText={onChangeText}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onSubmitEditing={() => doSearch(q)}
                  placeholder="搜景点 / 文创 · 发现岭南"
                  placeholderTextColor="#A6AFA6"
                  returnKeyType="search"
                  className="ml-2 h-12 flex-1 text-[15px]"
                  style={{ color: INK }}
                />
                <Pressable
                  onPress={() => doSearch(q)}
                  accessibilityRole="button"
                  accessibilityLabel="搜索"
                  style={({ pressed }) => ({ transform: pressed ? [{ scale: 0.95 }] : [] })}>
                  <LinearGradient
                    colors={['#386641', '#5C8A6D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: 36, borderRadius: 999, paddingHorizontal: 20 }}
                    className="items-center justify-center">
                    <Text className="text-[14px] font-bold text-white">搜索</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* 下拉浮层：历史 / 建议 —— 正常流（mt-2，非 absolute），
                  彻底规避 Android 上 absolute 下拉被 -mt-4 米白面板跨兄弟遮挡。 */}
              {showDropdown && dropdownItems.length > 0 ? (
                <View
                  style={{ boxShadow: '0px 8px 22px rgba(0,0,0,0.18)' }}
                  className="mt-2 overflow-hidden rounded-2xl bg-white">
                  {isHistoryDropdown ? (
                    <View className="flex-row items-center justify-between border-b border-[#F0ECDD] px-4 pb-2 pt-3">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color={MUTE} />
                        <Text className="ml-1.5 text-[12px] font-semibold" style={{ color: MUTE }}>搜索历史</Text>
                      </View>
                      <Pressable onPress={() => { void clearHistory(); }} hitSlop={8}>
                        <View className="flex-row items-center">
                          <Ionicons name="trash-outline" size={13} color="#B07F32" />
                          <Text className="ml-1 text-[12px]" style={{ color: '#B07F32' }}>清空历史</Text>
                        </View>
                      </Pressable>
                    </View>
                  ) : null}
                  {dropdownItems.map((item, i) => (
                    <Pressable
                      key={`dd-${i}`}
                      onPress={() => pickItem(item)}
                      className="flex-row items-center px-4 py-3"
                      style={({ pressed }) => ({ backgroundColor: pressed ? '#F7F4EA' : 'transparent' })}>
                      <Ionicons
                        name={isHistoryDropdown ? 'time-outline' : 'search-outline'}
                        size={15}
                        color="#5C8A6D"
                      />
                      <Text numberOfLines={1} className="ml-2.5 flex-1 text-[15px]" style={{ color: INK }}>{item}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#C9C2B0" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── 主体：圆角上提，盖住 Hero 底边（与首页同源）── */}
        <View className="-mt-4 min-h-[420px] rounded-t-[22px] pt-5" style={{ backgroundColor: BG }}>

          {/* ── 空闲态：猜你想搜 + 排行榜 ── */}
          {isIdle ? (
            <>
              {/* 猜你想搜：品牌内彩色标签云 + 小图标 */}
              {guessTags.length > 0 ? (
                <Animated.View entering={FadeInDown.delay(80).duration(450)} className="mb-7">
                  <SectionTitle title="猜你想搜" subtitle="灵感正岭南" icon="sparkles" />
                  <View className="flex-row flex-wrap px-4" style={{ gap: 10 }}>
                    {guessTags.map((tag, i) => {
                      const c = CHIP_PALETTE[i % CHIP_PALETTE.length];
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => pickItem(tag)}
                          accessibilityRole="button"
                          accessibilityLabel={tag}
                          style={({ pressed }) => ({
                            backgroundColor: c.bg,
                            transform: pressed ? [{ scale: 0.96 }] : [],
                          })}
                          className="flex-row items-center rounded-full px-3.5 py-2">
                          <Ionicons name={c.icon} size={13} color={c.fg} />
                          <Text className="ml-1.5 text-[13.5px] font-semibold" style={{ color: c.fg }}>
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              ) : null}

              {/* 排行榜（评分）：白色大卡 + 缩略图 + 金银铜奖牌 + 火苗 + 微金行底 */}
              <Animated.View entering={FadeInDown.delay(160).duration(450)}>
                <SectionTitle title="人气排行榜" subtitle="按评分" icon="trophy" />
                <View
                  className="mx-4 overflow-hidden rounded-2xl bg-white"
                  style={{ boxShadow: '0px 4px 14px rgba(0,0,0,0.06)' }}>
                  {rankingLoading ? (
                    <ActivityIndicator size="small" color="#3E6B4F" style={{ marginVertical: 28 }} />
                  ) : ranking.length === 0 ? (
                    <Text className="py-7 text-center text-[14px]" style={{ color: MUTE }}>暂无排行数据</Text>
                  ) : (
                    ranking.map((item, i) => {
                      const top3 = i < 3;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: item.id } })}
                          accessibilityRole="button"
                          accessibilityLabel={item.title}
                          style={({ pressed }) => ({
                            borderTopWidth: i === 0 ? 0 : 0.5,
                            borderTopColor: '#F2EFE3',
                            backgroundColor: pressed ? '#F7F4EA' : top3 ? '#FBF7EC' : '#fff',
                          })}
                          className="flex-row items-center px-3.5 py-2.5">
                          {/* 名次徽章：前三暖金/银/铜渐变奖牌 */}
                          {top3 ? (
                            <LinearGradient
                              colors={MEDAL_GRADIENTS[i]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{ width: 28, height: 28, borderRadius: 14, boxShadow: '0px 2px 6px rgba(212,167,106,0.40)' }}
                              className="items-center justify-center">
                              <Text className="text-[12px] font-extrabold text-white">{i + 1}</Text>
                            </LinearGradient>
                          ) : (
                            <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: '#F0ECDF' }}>
                              <Text className="text-[12px] font-semibold" style={{ color: MUTE }}>{i + 1}</Text>
                            </View>
                          )}

                          {/* 缩略图（景点图片已登记，用真实照片）*/}
                          <Image
                            source={resolveLegacyImage(item.image)}
                            resizeMode="cover"
                            style={{ width: 42, height: 42, borderRadius: 11, marginLeft: 12 }}
                          />

                          {/* 名称 */}
                          <Text numberOfLines={1} className="ml-3 flex-1 text-[15px] font-medium" style={{ color: INK }}>
                            {item.title}
                          </Text>

                          {/* 评分（前三补火苗强调）*/}
                          {top3 ? (
                            <Ionicons name="flame" size={14} color={GOLD} style={{ marginRight: 4 }} />
                          ) : null}
                          <Ionicons name="star" size={13} color={GOLD} />
                          <Text className="ml-1 w-9 text-[14px] font-bold" style={{ color: '#B07F32' }}>
                            {item.rating.toFixed(1)}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </Animated.View>
            </>
          ) : null}

          {/* ── 结果 / 加载 / 空态 ── */}
          {loading ? (
            <View className="items-center py-24">
              <ActivityIndicator size="large" color="#3E6B4F" />
              <Text className="mt-3 text-[13px]" style={{ color: MUTE }}>正在为你寻找…</Text>
            </View>
          ) : showEmpty ? (
            <View className="items-center py-24">
              <View className="h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: '#E9E4D4' }}>
                <Ionicons name="search-outline" size={38} color="#B7AE97" />
              </View>
              <Text className="mt-4 text-[15px] font-semibold" style={{ color: '#7d7768' }}>未找到相关项目</Text>
              <Text className="mt-1 text-[13px]" style={{ color: '#a8a08d' }}>换个关键词，再探探岭南</Text>
            </View>
          ) : hasResults ? (
            <View className="pt-1">
              {/* 景点：图片打底双列瀑布流 */}
              {scenicList.length > 0 ? (
                <Animated.View entering={FadeInDown.duration(420)} className="mb-2">
                  <SectionTitle title="景点" subtitle={`${scenicList.length} 处岭南胜景`} icon="location" />
                  <View className="flex-row px-4" style={{ gap: 12 }}>
                    <View className="flex-1">
                      {scenicColumns.colA.map(({ item, h }, i) => (
                        <ScenicResultCard
                          key={item.id}
                          item={item}
                          width={colW}
                          height={h}
                          delay={i * 60}
                          onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: item.id } })}
                        />
                      ))}
                    </View>
                    <View className="flex-1">
                      {scenicColumns.colB.map(({ item, h }, i) => (
                        <ScenicResultCard
                          key={item.id}
                          item={item}
                          width={colW}
                          height={h}
                          delay={i * 60 + 30}
                          onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: item.id } })}
                        />
                      ))}
                    </View>
                  </View>
                </Animated.View>
              ) : null}

              {/* 文创：暖色渐变图标卡（双列，禁用占位图打底）*/}
              {destinations.length > 0 ? (
                <Animated.View entering={FadeInDown.delay(120).duration(420)} className="mt-4">
                  <SectionTitle title="文创好物" subtitle={`${destinations.length} 件岭南匠造`} icon="gift" />
                  <View className="flex-row px-4" style={{ gap: 12 }}>
                    <View className="flex-1">
                      {destColumns.colA.map((item, i) => (
                        <DestinationResultCard
                          key={item.id}
                          item={item}
                          delay={i * 60}
                          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                        />
                      ))}
                    </View>
                    <View className="flex-1">
                      {destColumns.colB.map((item, i) => (
                        <DestinationResultCard
                          key={item.id}
                          item={item}
                          delay={i * 60 + 30}
                          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                        />
                      ))}
                    </View>
                  </View>
                </Animated.View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

// ── 区块标题：绿色竖条 + 可选图标 + 粗体标题 + 可选副标题（仿 home SectionHeader）──
function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="mb-2.5 flex-row items-end px-4">
      <View style={{ width: 4, height: 17, borderRadius: 2, backgroundColor: PRIMARY }} />
      {icon ? (
        <Ionicons name={icon} size={15} color={PRIMARY} style={{ marginLeft: 7, marginBottom: 1 }} />
      ) : null}
      <Text className="ml-2 text-[16px] font-extrabold" style={{ color: INK }}>{title}</Text>
      {subtitle ? (
        <Text className="ml-2 text-[11px]" style={{ color: MUTE }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

// ── 景点结果卡：整图铺底 + 底部黑色渐隐浮层 + 名称/summary/城市·tag 叠字 ──
function ScenicResultCard({
  item,
  width,
  height,
  delay,
  onPress,
}: {
  item: ScenicItem;
  width: number;
  height: number;
  delay: number;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(420)} className="mb-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.name}
        style={({ pressed }) => ({
          width,
          height,
          boxShadow: '0px 5px 14px rgba(0,0,0,0.16)',
          transform: pressed ? [{ scale: 0.985 }] : [],
        })}
        className="overflow-hidden rounded-2xl">
        <Image
          source={resolveLegacyImage(item.image)}
          resizeMode="cover"
          style={{ width, height }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.74)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }}
        />
        {/* 顶部城市标签 */}
        {item.city ? (
          <View className="absolute left-2 top-2 rounded-md bg-white/25 px-1.5 py-0.5">
            <Text className="text-[10px] font-medium text-white">{item.city}</Text>
          </View>
        ) : null}
        {/* 热门角标 */}
        {item.hot ? (
          <View className="absolute right-2 top-2 flex-row items-center rounded-full px-2 py-0.5" style={{ backgroundColor: GOLD }}>
            <Ionicons name="flame" size={10} color="#fff" />
            <Text className="ml-0.5 text-[10px] font-bold text-white">热门</Text>
          </View>
        ) : null}
        {/* 底部叠字 */}
        <View className="absolute bottom-2.5 left-3 right-3">
          <Text numberOfLines={1} className="text-[15px] font-extrabold text-white">
            {item.name}
          </Text>
          {item.summary ? (
            <Text numberOfLines={1} className="mt-0.5 text-[11px] text-white/85">
              {item.summary}
            </Text>
          ) : null}
          {item.tag ? (
            <View className="mt-1 flex-row">
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(56,102,65,0.85)' }}>
                <Text className="text-[10px] text-white">{item.tag}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── 文创结果卡：暖色渐变 + Ionicons 图标（图标按 type、渐变按 id）+ 标题 + 价格 + 已售（禁用占位图）──
function DestinationResultCard({
  item,
  delay,
  onPress,
}: {
  item: DestinationItem;
  delay: number;
  onPress: () => void;
}) {
  const grad = productGradient(item.id);
  const icon = productIcon(item);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(420)} className="mb-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={({ pressed }) => ({
          boxShadow: '0px 4px 14px rgba(0,0,0,0.07)',
          transform: pressed ? [{ scale: 0.97 }] : [],
        })}
        className="overflow-hidden rounded-2xl bg-white">
        {/* 暖色渐变图标块取代照片 */}
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 96 }}
          className="items-center justify-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/55">
            <Ionicons name={icon} size={26} color="#9C6F26" />
          </View>
        </LinearGradient>
        <View className="p-3">
          <Text numberOfLines={2} className="text-[14px] font-semibold leading-5" style={{ color: INK, minHeight: 40 }}>
            {item.title}
          </Text>
          <View className="mt-2 flex-row items-end justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-[12px] font-bold" style={{ color: PRICE }}>¥</Text>
              <Text className="text-[17px] font-extrabold" style={{ color: PRICE }}>{item.money}</Text>
            </View>
            {item.number ? (
              <Text className="text-[11px]" style={{ color: '#a8a08d' }}>已售{item.number}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
