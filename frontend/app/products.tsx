import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

interface Product { id: number; title: string; image: string; money: string; number: string; type: number; }

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [type, setType] = useState<number | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const qs = type !== undefined ? `?type=${type}` : '';
      setProducts(await apiRequest<Product[]>(`/destinations${qs}`));
    } catch { setProducts(null); }
  }, [type]);

  useEffect(() => { void load(); }, [load]);

  const cardW = Math.floor((width - 32 - 12) / 2);
  const CATS = ['全部', '非遗手作', '岭南美食', '文创周边'];

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      {/* Header — matching Legacy chanpin.html style */}
      <View style={{ paddingTop: insets.top + 6 }} className="bg-[#3E6B4F] pb-4">
        <View className="flex-row items-center px-4">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text className="text-[18px] font-bold text-white">文创产品</Text>
        </View>
        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 px-4" contentContainerStyle={{ gap: 8 }}>
          {CATS.map((cat, i) => {
            const t = i === 0 ? undefined : i;
            const active = type === t;
            return (
              <Pressable key={cat} onPress={() => setType(t)}
                className={`rounded-full px-4 py-1.5 ${active ? 'bg-white' : 'bg-white/20'}`}>
                <Text className={`text-[13px] font-semibold ${active ? 'text-[#3E6B4F]' : 'text-white'}`}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {!products ? (
          <View className="items-center py-20"><ActivityIndicator color="#3E6B4F" /></View>
        ) : products.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="cube-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">暂无产品</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {products.map((p) => (
              <Pressable key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
                style={{ width: cardW, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}>
                <Image source={resolveLegacyImage(p.image)} style={{ width: cardW, height: 130 }} resizeMode="cover" />
                <View className="p-2.5">
                  <Text numberOfLines={1} className="text-[14px] font-bold text-[#333]">{p.title}</Text>
                  <View className="mt-1.5 flex-row items-center justify-between">
                    <Text className="text-[16px] font-bold text-[#ff3d00]">{p.money}</Text>
                    <Text className="text-[11px] text-[#999]">{p.number} 人购买</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
