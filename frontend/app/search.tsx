import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/lib/api';

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
  rating: number;
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
    const updated = [term, ...history.filter(x => x !== term)].slice(0, MAX_HISTORY);
    setHistory(updated);
    try { await storage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }, [history]);

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
        .map(s => ({ id: s.id, title: s.name, rating: computeRating(s) }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);
      setRanking(ranked);
      // guess: 6 random scenic names
      const shuffled = [...scenics].sort(() => 0.5 - Math.random());
      setGuessTags(shuffled.slice(0, 6).map(s => s.name));
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
    await saveHistory(trimmed);
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

  // ── Type-ahead suggestions (debounced) ──
  const sugTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchSuggestions = useCallback(async (val: string) => {
    if (!val.trim()) { setSuggestions([]); return; }
    try {
      const data = await apiRequest<SearchResult>(`/search?q=${encodeURIComponent(val.trim())}`);
      setSuggestions([
        ...data.scenic.map(s => s.name),
        ...data.destinations.map(d => d.title),
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
    // brief delay so Pressable inside dropdown can fire
    setTimeout(() => setShowDropdown(false), 160);
  }, []);

  const dropdownItems = q.trim() ? suggestions : history;
  const isHistoryDropdown = !q.trim();

  // ── Visibility flags ──
  const isIdle = !searched && !q.trim() && !loading;
  const hasResults = results && (results.scenic.length > 0 || results.destinations.length > 0);
  const showEmpty = searched && !loading && !hasResults;

  // Merge results for card grid
  const resultCards = hasResults
    ? [
        ...results.scenic.map(s => ({
          key: `s-${s.id}`, type: 'scenic' as const, id: s.id,
          title: s.name, desc: s.summary || `${s.city} · ${s.tag}`, price: '',
        })),
        ...results.destinations.map(d => ({
          key: `d-${d.id}`, type: 'product' as const, id: d.id,
          title: d.title, desc: d.number || '', price: d.money,
        })),
      ]
    : [];

  // ── Render ──
  return (
    <LinearGradient
      colors={['#F2F2F2', '#EEFFFB']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}>

      {/* ── Top bar (fixed) ── */}
      <View
        style={{ paddingTop: insets.top + 4 }}
        className="flex-row items-center justify-between bg-white px-3 pb-3 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="返回"
          hitSlop={8}
          className="p-1">
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[18px] font-semibold text-[#333]">搜索</Text>
        <View className="w-8" />
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Search input + button ── */}
        <View className="mx-auto mt-6 w-[90%]" style={{ maxWidth: 600 }}>
          <View className="relative flex-row">
            <TextInput
              ref={inputRef}
              value={q}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={() => doSearch(q)}
              placeholder="请输入研学或思政套票…"
              placeholderTextColor="#aaa"
              returnKeyType="search"
              className="flex-1 border border-[#fff] bg-white px-4 py-3 text-[16px] text-[#333]"
              style={{ borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}
            />
            <Pressable onPress={() => doSearch(q)}>
              <LinearGradient
                colors={['#5BE1B2', '#A7F1FF']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                className="px-5 py-3"
                style={{ borderTopRightRadius: 6, borderBottomRightRadius: 6 }}>
                <Text className="text-[16px] font-bold text-white">搜索</Text>
              </LinearGradient>
            </Pressable>

            {/* Dropdown */}
            {showDropdown && dropdownItems.length > 0 ? (
              <View
                className="absolute left-0 right-0 top-full z-10 rounded-b-md border border-[#ccc] border-t-0 bg-white">
                {dropdownItems.map((item, i) => (
                  <Pressable
                    key={`dd-${i}`}
                    onPress={() => { setQ(item); setShowDropdown(false); void doSearch(item); }}
                    className="px-4 py-2.5">
                    <Text className="text-[15px] text-[#333]">{item}</Text>
                  </Pressable>
                ))}
                {isHistoryDropdown ? (
                  <Pressable
                    onPress={() => { void clearHistory(); }}
                    className="items-end px-4 py-2">
                    <Text className="text-[13px] text-[#888]">清空历史</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* ── 猜你想搜 ── */}
        {isIdle && guessTags.length > 0 ? (
          <View className="mx-auto mt-5 w-[90%]" style={{ maxWidth: 1000 }}>
            <Text className="mb-2 text-[14px] font-semibold text-[#555]">猜你想搜</Text>
            <View className="flex-row flex-wrap gap-2">
              {guessTags.map(tag => (
                <Pressable
                  key={tag}
                  onPress={() => { setQ(tag); void doSearch(tag); }}
                  className="rounded-full bg-[#BBF2E0] px-3 py-1.5">
                  <Text className="text-[14px] text-[#333]">{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── 排行榜（评分）── */}
        {isIdle ? (
          <View
            className="mx-auto mt-5 w-[90%] rounded-xl bg-white px-5 py-4 shadow-sm"
            style={{ maxWidth: 600 }}>
            <Text className="mb-2 text-[15px] font-semibold text-[#41816c]">排行榜（评分）</Text>
            {rankingLoading ? (
              <ActivityIndicator size="small" color="#5BE1B2" style={{ marginVertical: 16 }} />
            ) : ranking.length === 0 ? (
              <Text className="py-4 text-center text-[14px] text-[#999]">暂无排行数据</Text>
            ) : (
              ranking.map((item, i) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: item.id } })}
                  className="flex-row items-center border-b border-[#f1f1f1] py-2.5 last:border-b-0">
                  {i < 3 ? (
                    <LinearGradient
                      colors={
                        i === 0 ? ['#FFD700', '#FFEA74']
                        : i === 1 ? ['#C0C0C0', '#DCDCDC']
                        : ['#CD7F32', '#E8AD69']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="h-8 w-8 items-center justify-center rounded-full">
                      <Text className="text-[13px] font-bold text-white">{i + 1}</Text>
                    </LinearGradient>
                  ) : (
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-[#ced4da]">
                      <Text className="text-[13px] font-bold text-white">{i + 1}</Text>
                    </View>
                  )}
                  <Text
                    numberOfLines={1}
                    className="mx-2.5 flex-1 text-[15px] text-[#333]">
                    {item.title}
                  </Text>
                  <Text className="text-[14px] font-semibold text-[#e69138]">
                    {'⭐'} {item.rating.toFixed(1)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        {/* ── Results ── */}
        {loading ? (
          <View className="items-center py-20">
            <ActivityIndicator color="#5BE1B2" />
          </View>
        ) : showEmpty ? (
          <View className="items-center py-20">
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text className="mt-3 text-[15px] text-[#999]">未找到相关项目</Text>
          </View>
        ) : hasResults ? (
          <View className="mx-auto mt-4 flex w-[90%] flex-row flex-wrap gap-4" style={{ maxWidth: 1000 }}>
            {resultCards.map(card => (
              <Pressable
                key={card.key}
                onPress={() =>
                  router.push({
                    pathname: card.type === 'scenic' ? '/scenic/[id]' : '/product/[id]',
                    params: { id: card.id },
                  })
                }
                className="flex-1 rounded-md bg-white px-4 py-4 shadow-sm"
                style={({ pressed }) => ({
                  minWidth: 240,
                  transform: pressed ? [{ translateY: -2 }] : [],
                  opacity: pressed ? 0.9 : 1,
                })}>
                <Text className="mb-1 text-[17px] font-bold text-[#41816c]">{card.title}</Text>
                <Text className="mb-4 text-[14px] text-[#555]">{card.desc}</Text>
                <Text className="text-right text-[15px] font-bold text-[#e91e63]">
                  {card.price ? `¥${card.price}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

      </ScrollView>
    </LinearGradient>
  );
}
