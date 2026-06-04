import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

const TRENDING = ['广州塔', '粤剧', '广绣', '潮汕工夫茶', '醒狮', '丹霞山', '开平碉楼', '南粤古驿道'];

interface SearchResult {
  scenic: { id: number; name: string; image: string; city: string; tag: string; summary: string }[];
  destinations: { id: number; title: string; image: string; money: string }[];
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const doSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      setResults(await apiRequest<SearchResult>(`/search?q=${encodeURIComponent(keyword.trim())}`));
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { inputRef.current?.focus(); }, 300);
    return () => clearTimeout(t);
  }, []);

  const hasResults = results && (results.scenic.length > 0 || results.destinations.length > 0);
  const showEmpty = searched && !loading && !hasResults;

  return (
    <View className="flex-1 bg-[#F2F2F2]">
      {/* Top bar matching Legacy search.html */}
      <View
        style={{ paddingTop: insets.top + 4 }}
        className="flex-row items-center bg-white px-3 pb-3 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="返回"
          className="mr-2 p-1">
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <View className="flex-1 flex-row items-center rounded-lg bg-[#F2F2F2]">
          <Ionicons name="search" size={16} color="#999" style={{ marginLeft: 10 }} />
          <TextInput
            ref={inputRef}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => doSearch(q)}
            placeholder="搜索目的地 / 景点 / 酒店"
            placeholderTextColor="#aaa"
            returnKeyType="search"
            className="flex-1 px-2 py-2.5 text-[15px] text-[#333]"
          />
          {q.length > 0 ? (
            <Pressable onPress={() => { setQ(''); setResults(null); setSearched(false); }} className="mr-2 p-1">
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => doSearch(q)}
          accessibilityRole="button"
          className="ml-2 rounded-md bg-[#5BE1B2] px-4 py-2.5">
          <Text className="text-[14px] font-bold text-white">搜索</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" keyboardShouldPersistTaps="handled">
        {loading ? (
          <View className="items-center py-20">
            <ActivityIndicator color="#5BE1B2" />
          </View>
        ) : showEmpty ? (
          <View className="items-center py-20">
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text className="mt-3 text-[15px] text-[#999]">未找到相关结果</Text>
          </View>
        ) : hasResults ? (
          <View className="px-4 pt-4">
            {results.scenic.length > 0 ? (
              <View className="mb-5">
                <Text className="mb-2.5 text-[16px] font-bold text-[#41816c]">景点</Text>
                {results.scenic.map((s) => (
                  <Pressable
                    key={`s-${s.id}`}
                    onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: s.id } })}
                    className="mb-2.5 flex-row overflow-hidden rounded-xl bg-white shadow-sm">
                    <Image
                      source={resolveLegacyImage(s.image)}
                      style={{ width: 100, height: 80 }}
                      resizeMode="cover"
                    />
                    <View className="flex-1 justify-center px-3">
                      <Text className="text-[15px] font-bold text-[#333]">{s.name}</Text>
                      <Text className="mt-0.5 text-[12px] text-[#999]">{s.city} · {s.tag}</Text>
                      <Text numberOfLines={1} className="mt-0.5 text-[12px] text-[#777]">{s.summary}</Text>
                    </View>
                    <View className="justify-center pr-3">
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {results.destinations.length > 0 ? (
              <View className="mb-5">
                <Text className="mb-2.5 text-[16px] font-bold text-[#41816c]">文创产品</Text>
                {results.destinations.map((d) => (
                  <Pressable
                    key={`d-${d.id}`}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: d.id } })}
                    className="mb-2.5 flex-row overflow-hidden rounded-xl bg-white shadow-sm">
                    <Image
                      source={resolveLegacyImage(d.image)}
                      style={{ width: 80, height: 80 }}
                      resizeMode="cover"
                    />
                    <View className="flex-1 justify-center px-3">
                      <Text className="text-[15px] font-bold text-[#333]">{d.title}</Text>
                      <Text className="mt-0.5 text-[14px] font-bold text-[#ff3d00]">{d.money}</Text>
                    </View>
                    <View className="justify-center pr-3">
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View className="px-5 pt-6">
            <Text className="mb-3 text-[14px] font-semibold text-[#555]">热门搜索</Text>
            <View className="flex-row flex-wrap gap-2">
              {TRENDING.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setQ(t); doSearch(t); }}
                  className="rounded-full bg-[#BBF2E0] px-3.5 py-2">
                  <Text className="text-[13px] text-[#333]">{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
