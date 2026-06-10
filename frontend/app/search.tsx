import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
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

// ── 调色板（与首页同源单一来源；本屏走中性浅底，不用绿渐变 Hero）──
const BG = '#F4F1E4';
const SURFACE = '#FBFAF3';
const PRIMARY = '#386641';
const GOLD = '#D4A76A';
const PRICE = '#ff3e30';
const INK = '#2f3a30';
const MUTE = '#9a9382';
const LINE = '#EBE6D6';

// 类目色系：景点走岭南绿、文创走暖金 —— 给混排结果一眼可辨的品类标识。
const CAT = {
  scenic: { tint: '#E7F0E8', ink: PRIMARY },
  product: { tint: '#F6ECD8', ink: '#A4762E' },
};

// 猜你想搜 chip 的绿 / 金双系描边交替，比单一描边更有岭南配色层次。
const TAG_TINTS = [
  { bg: '#EEF4EC', border: '#D6E4D2', ink: '#436A45' },
  { bg: '#F7EFDD', border: '#EBDCC0', ink: '#90662A' },
];

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

// 排行榜前三名名次色（金 / 银 / 铜）—— 仅作数字与标尺强调，不做整卡渐变。
const RANK_ACCENT = ['#C9952F', '#9CA09A', '#B07F4F'];

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

  // 文创结果双列卡宽：外边距(14*2) + 列间距(12)。
  const prodColW = Math.floor((width - 28 - 12) / 2);

  // search input
  const [q, setQ] = useState('');
  const inputRef = useRef<TextInput>(null);

  // results
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // 搜索框实测高度：用于把悬浮下拉精确挂在框底，避免硬编码 top 偏移随框高漂移。
  const [boxHeight, setBoxHeight] = useState(56);

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
    setShowDropdown(true);
    if (sugTimeout.current) clearTimeout(sugTimeout.current);
    if (!text.trim()) { setSuggestions([]); return; }
    sugTimeout.current = setTimeout(() => { void fetchSuggestions(text); }, 200);
  }, [fetchSuggestions]);

  // ── Dropdown logic ──
  const handleFocus = useCallback(() => {
    setFocused(true);
    setShowDropdown(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    // 轻微延时：让下拉里的 Pressable 在 blur 关闭它之前先命中（配合 keyboardShouldPersistTaps）。
    setTimeout(() => setShowDropdown(false), 160);
  }, []);

  // 回填 + 关下拉 + 搜索三步合一。
  const pickItem = useCallback((item: string) => {
    setQ(item);
    setShowDropdown(false);
    void doSearch(item);
  }, [doSearch]);

  const clearInput = useCallback(() => {
    setQ('');
    setSuggestions([]);
    setSearched(false);
    setResults(null);
    inputRef.current?.focus();
  }, []);

  // 实测搜索框高度，浮层据此挂底（取代脆弱的硬编码 top）。
  const onBoxLayout = useCallback((e: LayoutChangeEvent) => {
    setBoxHeight(e.nativeEvent.layout.height);
  }, []);

  const dropdownItems = q.trim() ? suggestions : history;
  const isHistoryDropdown = !q.trim();
  const overlayVisible = showDropdown && dropdownItems.length > 0;

  // ── Visibility flags ──
  const isIdle = !searched && !q.trim() && !loading;
  const hasResults = !!results && (results.scenic.length > 0 || results.destinations.length > 0);
  const showEmpty = searched && !loading && !hasResults;

  const scenicList = results?.scenic ?? [];
  const destinations = results?.destinations ?? [];

  // 文创结果两列分发（显式 colA/colB，避免 flex-wrap 在窄屏掉成单列）。
  const destColumns = useMemo(() => {
    const colA: DestinationItem[] = [];
    const colB: DestinationItem[] = [];
    (results?.destinations ?? []).forEach((item, i) => { (i % 2 === 0 ? colA : colB).push(item); });
    return { colA, colB };
  }, [results?.destinations]);

  // ── Render ──
  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      {/* ── 顶栏：返回 + 一行式标识，紧贴刘海，刻意低调（搜索框才是主角）── */}
      <View
        style={{ paddingTop: insets.top + 8, paddingHorizontal: 14, paddingBottom: 4, zIndex: 60 }}
        className="flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="返回"
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Ionicons name="arrow-back" size={22} color={INK} />
        </Pressable>
        <Text className="ml-1 text-[13px] font-semibold tracking-[2px]" style={{ color: MUTE }}>
          SEARCH
        </Text>
      </View>

      {/* ── 主角：大号独立搜索框（聚焦时描金边）。下方挂悬浮下拉层。 ── */}
      <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10, zIndex: 50 }}>
        <View
          onLayout={onBoxLayout}
          style={{
            height: 56,
            borderRadius: 18,
            backgroundColor: '#fff',
            borderWidth: 1.5,
            borderColor: focused ? GOLD : LINE,
            boxShadow: focused
              ? '0px 6px 18px rgba(212,167,106,0.22)'
              : '0px 3px 10px rgba(0,0,0,0.05)',
          }}
          className="flex-row items-center px-4"
        >
          <Ionicons name="search" size={21} color={focused ? PRIMARY : '#B7B09B'} />
          <TextInput
            ref={inputRef}
            value={q}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={() => doSearch(q)}
            placeholder="搜景点 · 文创 · 发现岭南"
            placeholderTextColor="#B7B09B"
            returnKeyType="search"
            className="ml-2.5 h-14 flex-1 text-[17px] font-medium"
            style={{ color: INK }}
          />
          {q.length > 0 ? (
            <Pressable
              onPress={clearInput}
              accessibilityRole="button"
              accessibilityLabel="清空"
              hitSlop={10}
              className="h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: '#EDE8D8' }}
            >
              <Ionicons name="close" size={14} color="#8C846F" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => doSearch(q)}
            accessibilityRole="button"
            accessibilityLabel="搜索"
            disabled={!q.trim()}
            style={({ pressed }) => ({
              marginLeft: 10,
              height: 40,
              paddingHorizontal: 18,
              borderRadius: 13,
              backgroundColor: q.trim() ? PRIMARY : '#DAD5C4',
              transform: pressed ? [{ scale: 0.95 }] : [],
            })}
            className="items-center justify-center"
          >
            <Text className="text-[14px] font-bold text-white">搜索</Text>
          </Pressable>
        </View>

        {/* 下拉浮层：历史 / 建议 —— 绝对定位悬浮覆盖，不占布局高度。
            top 由「框顶内边距(6) + 实测框高 + 间隙(8)」算出，框高一变即自适应。 */}
        {overlayVisible ? (
          <Animated.View
            entering={FadeIn.duration(140)}
            style={{
              position: 'absolute',
              top: 6 + boxHeight + 8,
              left: 14,
              right: 14,
              zIndex: 80,
              elevation: 14,
              borderWidth: 1,
              borderColor: LINE,
              boxShadow: '0px 12px 28px rgba(0,0,0,0.16)',
            }}
            className="overflow-hidden rounded-2xl bg-white"
          >
            <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
              <View className="flex-row items-center">
                <Ionicons
                  name={isHistoryDropdown ? 'time-outline' : 'sparkles-outline'}
                  size={13}
                  color={MUTE}
                />
                <Text className="ml-1.5 text-[11.5px] font-semibold tracking-wide" style={{ color: MUTE }}>
                  {isHistoryDropdown ? '搜索历史' : '搜索建议'}
                </Text>
              </View>
              {isHistoryDropdown ? (
                <Pressable onPress={() => { void clearHistory(); }} hitSlop={8}>
                  <Text className="text-[12px] font-medium" style={{ color: '#B07F32' }}>清空</Text>
                </Pressable>
              ) : null}
            </View>
            {dropdownItems.map((item, i) => (
              <Pressable
                key={`dd-${i}`}
                onPress={() => pickItem(item)}
                className="flex-row items-center px-4 py-3"
                style={({ pressed }) => ({
                  borderTopWidth: 1,
                  borderTopColor: '#F4F0E2',
                  backgroundColor: pressed ? '#F7F4EA' : 'transparent',
                })}
              >
                <Ionicons
                  name={isHistoryDropdown ? 'time-outline' : 'search'}
                  size={15}
                  color="#9C9580"
                />
                <Text numberOfLines={1} className="ml-3 flex-1 text-[15px]" style={{ color: INK }}>{item}</Text>
                <Ionicons name="arrow-up-outline" size={14} color="#CFC9B6" style={{ transform: [{ rotate: '45deg' }] }} />
              </Pressable>
            ))}
          </Animated.View>
        ) : null}
      </View>

      {/* ── 内容区 ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 4 }}
      >
        {/* ── 空闲态：猜你想搜 chip 行 + 热搜编号榜 ── */}
        {isIdle ? (
          <>
            {/* 猜你想搜：清爽 chip 流，绿 / 金双系描边交替，浅描边而非彩底大色块 */}
            {guessTags.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(60).duration(420)} style={{ paddingHorizontal: 14 }} className="mt-1 mb-7">
                <View className="mb-3 flex-row items-center">
                  <Ionicons name="bulb-outline" size={15} color={PRIMARY} />
                  <Text className="ml-1.5 text-[14px] font-bold" style={{ color: INK }}>猜你想搜</Text>
                  <Text className="ml-2 text-[11px]" style={{ color: MUTE }}>随手探探岭南</Text>
                </View>
                <View className="flex-row flex-wrap" style={{ gap: 9 }}>
                  {guessTags.map((tag, i) => {
                    const tint = TAG_TINTS[i % TAG_TINTS.length];
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => pickItem(tag)}
                        accessibilityRole="button"
                        accessibilityLabel={tag}
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? tint.border : tint.bg,
                          borderWidth: 1,
                          borderColor: tint.border,
                        })}
                        className="rounded-full px-4 py-2"
                      >
                        <Text className="text-[13.5px] font-medium" style={{ color: tint.ink }}>{tag}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            ) : null}

            {/* 热搜榜：极简编号榜单（大号名次数字为视觉锚点，无绿竖条标题、无瀑布流）*/}
            <Animated.View entering={FadeInDown.delay(140).duration(420)} style={{ paddingHorizontal: 14 }}>
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="flame" size={16} color={GOLD} />
                  <Text className="ml-1.5 text-[14px] font-bold" style={{ color: INK }}>热搜榜</Text>
                </View>
                <Text className="text-[11px]" style={{ color: MUTE }}>实时评分 · TOP 10</Text>
              </View>

              {rankingLoading ? (
                <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 36 }} />
              ) : ranking.length === 0 ? (
                <Text className="py-9 text-center text-[14px]" style={{ color: MUTE }}>暂无排行数据</Text>
              ) : (
                <View
                  className="overflow-hidden rounded-2xl"
                  style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE }}
                >
                  {ranking.map((item, i) => {
                    const top3 = i < 3;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: item.id } })}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                        style={({ pressed }) => ({
                          borderTopWidth: i === 0 ? 0 : 1,
                          borderTopColor: '#F1ECDD',
                          backgroundColor: pressed ? '#F1ECDC' : 'transparent',
                        })}
                        className="flex-row items-center px-3.5 py-3"
                      >
                        {/* 名次：大号数字，前三描金色 —— 编号榜的灵魂 */}
                        <Text
                          className="w-7 text-center font-extrabold"
                          style={{
                            fontSize: top3 ? 21 : 16,
                            color: top3 ? RANK_ACCENT[i] : '#C4BCA6',
                            fontStyle: 'italic',
                          }}
                        >
                          {i + 1}
                        </Text>
                        <Image
                          source={resolveLegacyImage(item.image)}
                          resizeMode="cover"
                          style={{ width: 38, height: 38, borderRadius: 10, marginLeft: 10 }}
                        />
                        <Text numberOfLines={1} className="ml-3 flex-1 text-[15px] font-medium" style={{ color: INK }}>
                          {item.title}
                        </Text>
                        {top3 ? (
                          <View className="mr-2 rounded-md px-1.5 py-0.5" style={{ backgroundColor: '#FBF3E2' }}>
                            <Text className="text-[9.5px] font-bold tracking-wide" style={{ color: '#B07F32' }}>HOT</Text>
                          </View>
                        ) : null}
                        <Ionicons name="star" size={12} color={GOLD} />
                        <Text className="ml-1 w-8 text-[13px] font-bold" style={{ color: '#A37C30' }}>
                          {item.rating.toFixed(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          </>
        ) : null}

        {/* ── 结果 / 加载 / 空态 ── */}
        {loading ? (
          <View className="items-center py-24">
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text className="mt-3 text-[13px]" style={{ color: MUTE }}>正在为你寻找…</Text>
          </View>
        ) : showEmpty ? (
          <View className="items-center py-24" style={{ paddingHorizontal: 32 }}>
            <View className="h-[72px] w-[72px] items-center justify-center rounded-3xl" style={{ backgroundColor: '#EAE5D4' }}>
              <Ionicons name="search-outline" size={34} color="#B7AE97" />
            </View>
            <Text className="mt-4 text-[15px] font-semibold" style={{ color: '#7d7768' }}>没有「{q.trim()}」的结果</Text>
            <Text className="mt-1 text-center text-[13px] leading-5" style={{ color: '#a8a08d' }}>
              试试更短的关键词，或从下方热搜榜挑一个，再探探岭南
            </Text>
          </View>
        ) : hasResults ? (
          <View style={{ paddingHorizontal: 14 }} className="pt-1">
            {/* 结果计数条：紧凑 framing，明确「这是结果」*/}
            <Animated.View entering={FadeIn.duration(260)} className="mb-3 flex-row items-center">
              <Text className="text-[13px]" style={{ color: MUTE }}>
                找到{' '}
                <Text className="font-bold" style={{ color: PRIMARY }}>
                  {scenicList.length + destinations.length}
                </Text>{' '}
                条与「{q.trim()}」相关
              </Text>
            </Animated.View>

            {/* 景点：横向行式列表（缩略图 + 文字 + 评分），刻意不用瀑布流 */}
            {scenicList.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(360)} className="mb-5">
                <ResultGroupLabel category="scenic" title="景点" count={scenicList.length} unit="处" />
                <View
                  className="overflow-hidden rounded-2xl"
                  style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE }}
                >
                  {scenicList.map((item, i) => (
                    <ScenicRow
                      key={item.id}
                      item={item}
                      first={i === 0}
                      onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: item.id } })}
                    />
                  ))}
                </View>
              </Animated.View>
            ) : null}

            {/* 文创：整齐双列商品卡（白底立卡，区别于景点行式与首页瀑布流）*/}
            {destinations.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(100).duration(360)} className="mb-2">
                <ResultGroupLabel category="product" title="文创好物" count={destinations.length} unit="件" />
                <View className="flex-row" style={{ gap: 12 }}>
                  <View className="flex-1">
                    {destColumns.colA.map((item, i) => (
                      <DestinationCard
                        key={item.id}
                        item={item}
                        width={prodColW}
                        delay={i * 60}
                        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                      />
                    ))}
                  </View>
                  <View className="flex-1">
                    {destColumns.colB.map((item, i) => (
                      <DestinationCard
                        key={item.id}
                        item={item}
                        width={prodColW}
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
      </ScrollView>
    </View>
  );
}

// ── 结果分组小标题：类目色点 + 类目名 + 计数（左对齐内联，非绿竖条 SectionTitle）──
// 景点=岭南绿、文创=暖金，给混排结果一眼可辨的品类锚点。
function ResultGroupLabel({
  category,
  title,
  count,
  unit,
}: {
  category: keyof typeof CAT;
  title: string;
  count: number;
  unit: string;
}) {
  const c = CAT[category];
  return (
    <View className="mb-2.5 flex-row items-center">
      <Ionicons name={category === 'scenic' ? 'location' : 'gift'} size={14} color={c.ink} />
      <Text className="ml-1.5 text-[14px] font-bold" style={{ color: INK }}>{title}</Text>
      <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: c.tint }}>
        <Text className="text-[10.5px] font-semibold" style={{ color: c.ink }}>{count} {unit}</Text>
      </View>
    </View>
  );
}

// ── 景点结果行：左缩略图 + 名称/摘要 + 类目徽标·城市·标签 + 评分（行式列表，非瀑布流图卡）──
function ScenicRow({
  item,
  first,
  onPress,
}: {
  item: ScenicItem;
  first: boolean;
  onPress: () => void;
}) {
  const rating = computeRating(item);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={({ pressed }) => ({
        borderTopWidth: first ? 0 : 1,
        borderTopColor: '#F1ECDD',
        backgroundColor: pressed ? '#F1ECDC' : 'transparent',
      })}
      className="flex-row items-center p-3"
    >
      <View className="overflow-hidden rounded-xl" style={{ boxShadow: '0px 2px 6px rgba(0,0,0,0.10)' }}>
        <Image source={resolveLegacyImage(item.image)} resizeMode="cover" style={{ width: 76, height: 76 }} />
        {item.hot ? (
          <View className="absolute left-1 top-1 flex-row items-center rounded-md px-1 py-0.5" style={{ backgroundColor: GOLD }}>
            <Ionicons name="flame" size={8} color="#fff" />
            <Text className="ml-0.5 text-[8px] font-bold text-white">热</Text>
          </View>
        ) : null}
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          {/* 类目徽标：岭南绿胶囊，一眼区分这是景点 */}
          <View className="mr-1.5 rounded px-1.5 py-0.5" style={{ backgroundColor: CAT.scenic.tint }}>
            <Text className="text-[9.5px] font-bold" style={{ color: CAT.scenic.ink }}>景点</Text>
          </View>
          <Text numberOfLines={1} className="flex-1 text-[15.5px] font-bold" style={{ color: INK }}>{item.name}</Text>
        </View>
        {item.summary ? (
          <Text numberOfLines={1} className="mt-0.5 text-[12px]" style={{ color: '#8C8473' }}>{item.summary}</Text>
        ) : null}
        <View className="mt-1.5 flex-row items-center">
          {item.city ? (
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={11} color={PRIMARY} />
              <Text className="ml-0.5 text-[11px] font-medium" style={{ color: PRIMARY }}>{item.city}</Text>
            </View>
          ) : null}
          {item.tag ? (
            <View className="ml-2 rounded px-1.5 py-0.5" style={{ backgroundColor: '#EFEAD9' }}>
              <Text className="text-[10px]" style={{ color: '#8C846F' }}>{item.tag}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View className="ml-2 items-center">
        <View className="flex-row items-center">
          <Ionicons name="star" size={12} color={GOLD} />
          <Text className="ml-0.5 text-[13px] font-bold" style={{ color: '#A37C30' }}>{rating.toFixed(1)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#CFC9B6" style={{ marginTop: 6 }} />
      </View>
    </Pressable>
  );
}

// ── 文创结果卡：真实图打底 + 类目徽标 + 标题 + 价格 + 已售（白底立卡，双列）──
function DestinationCard({
  item,
  width,
  delay,
  onPress,
}: {
  item: DestinationItem;
  width: number;
  delay: number;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(360)} className="mb-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={({ pressed }) => ({
          boxShadow: '0px 4px 13px rgba(0,0,0,0.07)',
          transform: pressed ? [{ scale: 0.97 }] : [],
        })}
        className="overflow-hidden rounded-2xl bg-white"
      >
        <View>
          <Image
            source={resolveLegacyImage(item.image)}
            resizeMode="cover"
            style={{ width, height: 134 }}
          />
          {/* 类目徽标：暖金胶囊，一眼区分这是文创 */}
          <View className="absolute left-2 top-2 rounded-md px-1.5 py-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
            <Text className="text-[9.5px] font-bold" style={{ color: CAT.product.ink }}>文创</Text>
          </View>
        </View>
        <View className="p-3">
          <Text numberOfLines={2} className="text-[14px] font-semibold leading-5" style={{ color: INK, minHeight: 40 }}>
            {item.title}
          </Text>
          <View className="mt-2 flex-row items-end justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-[12px] font-bold" style={{ color: PRICE }}>¥</Text>
              <Text className="text-[18px] font-extrabold" style={{ color: PRICE }}>{item.money}</Text>
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