import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface Favorite { id: number; itemType: string; itemId: number; title: string; date: string; location: string; tag: string; }

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Favorite[] | null>(null);

  const load = useCallback(async () => {
    try { setItems(await apiRequest<Favorite[]>('/favorites', { auth: true })); }
    catch { setItems(null); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View className="flex-1 bg-[#FAF6F0]">
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center bg-white/90 px-4 pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[18px] font-bold text-[#2D3748]">活动收藏</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="mb-2 text-center text-[24px] font-bold text-[#2D3748]">
          <Text className="text-[#48BB78]">我的</Text>收藏
        </Text>
        <Text className="mb-4 text-center text-[13px] text-[#718096]">探索传统与现代交融的文化盛宴</Text>

        {!items ? (
          <View className="items-center py-12"><ActivityIndicator color="#48BB78" /></View>
        ) : items.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="heart-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">还没有收藏，去发现精彩内容吧</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (item.itemType === 'scenic') router.push({ pathname: '/scenic/[id]', params: { id: item.itemId } });
                else if (item.itemType === 'destination') router.push({ pathname: '/product/[id]', params: { id: item.itemId } });
              }}
              className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
              <View className="flex-row items-center p-4">
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#48BB7820' }} className="items-center justify-center">
                  <Ionicons name={item.itemType === 'scenic' ? 'map' : 'cart'} size={22} color="#C53030" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-bold text-[#2D3748]">{item.title}</Text>
                  <View className="mt-1 flex-row items-center gap-3">
                    {item.date ? <Text className="text-[12px] text-[#718096]">{item.date}</Text> : null}
                    {item.location ? <Text className="text-[12px] text-[#718096]">{item.location}</Text> : null}
                  </View>
                </View>
                <View className="rounded-full bg-[#48BB7820] px-3 py-1">
                  <Text className="text-[11px] font-medium text-[#48BB78]">{item.tag}</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
