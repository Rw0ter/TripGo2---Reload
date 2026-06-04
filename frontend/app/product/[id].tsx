import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

interface Product { id: number; title: string; image: string; money: string; number: string; type: number; description?: string; detail?: string; }
interface Review { id: number; rating: number; text: string; createdAt: string; author: { username: string }; }

const TYPE_NAMES: Record<number, string> = {
  1: '古筝工艺 · 匠心传承', 2: '曲艺周边 · 岭南韵味', 3: '陶瓷玉雕 · 精工细作',
  4: '书画印刷 · 笔墨生花', 5: '民俗手作 · 非遗技艺', 6: '广东特产 · 地道风味',
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [product, revs] = await Promise.all([
        apiRequest<Product>(`/destinations/${id}`),
        apiRequest<Review[]>(`/reviews?itemType=destination&itemId=${id}`).catch(() => []),
      ]);
      setData(product);
      setReviews(revs);
    } catch { setData(null); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (!data) return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color="#ff3d00" />
    </View>
  );

  return (
    <View className="flex-1 bg-[#f7f7f7]">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={resolveLegacyImage(data.image)} style={{ width, height: 280 }} resizeMode="cover" />
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, left: 16 }}
          className="h-9 w-9 items-center justify-center rounded-full bg-black/30">
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>

        <View style={{ marginTop: -18, borderTopLeftRadius: 14, borderTopRightRadius: 14 }} className="bg-white px-4 pb-16 pt-5 shadow-lg">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-[18px] font-semibold text-[#111]">{data.title}</Text>
              <View className="mt-1.5 flex-row items-center">
                <Ionicons name="leaf" size={14} color="#0da884" />
                <Text className="ml-1 text-[13px] text-[#0da884]">{TYPE_NAMES[data.type] || '非遗文创'}</Text>
              </View>
            </View>
          </View>

          <View className="mt-3 flex-row items-baseline justify-between">
            <Text className="text-[24px] font-bold text-[#ff3d00]">{data.money}</Text>
            <Text className="text-[13px] text-[#999]">{data.number} 人已购买</Text>
          </View>

          <View className="mt-5 border-t border-[#eee] pt-4">
            <Text className="text-[15px] font-bold text-[#333]">产品详情</Text>
            <Text className="mt-2 text-[14px] leading-6 text-[#666]">
              {data.description || `这是一件精美的岭南非遗文创作品，由非遗传承人纯手工制作。每一件都承载着匠人的心血与岭南文化的独特韵味。\n\n• 材质：天然环保材料\n• 工艺：传统非遗手工艺\n• 产地：广东\n• 适用场景：家居装饰、送礼佳品、文化收藏`}
            </Text>
          </View>

          <View className="mt-5 border-t border-[#eee] pt-4">
            <Text className="text-[15px] font-bold text-[#333]">用户评价 ({reviews?.length ?? 0})</Text>
            {!reviews ? (
              <View className="items-center py-6"><ActivityIndicator color="#ff3d00" /></View>
            ) : reviews.length === 0 ? (
              <Text className="mt-3 text-[13px] text-[#ccc]">暂无评价，成为第一个评价的人吧</Text>
            ) : (
              reviews.map((r) => (
                <View key={r.id} className="mt-3 border-b border-[#f5f5f5] pb-3">
                  <View className="flex-row items-center">
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0da884' }} className="items-center justify-center">
                      <Text className="text-[11px] font-bold text-white">{r.author.username[0]}</Text>
                    </View>
                    <Text className="ml-2 text-[13px] font-semibold text-[#333]">{r.author.username}</Text>
                    <Text className="ml-2 text-[12px] text-[#ff9800]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                    <Text className="ml-auto text-[11px] text-[#ccc]">{r.createdAt?.slice(0, 10)}</Text>
                  </View>
                  <Text className="mt-1 ml-10 text-[13px] text-[#666]">{r.text}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 6 }} className="flex-row items-center border-t border-[#eee] bg-white px-4 pt-3">
        <Pressable onPress={() => router.push('/orders')} className="mr-3 items-center">
          <Ionicons name="cart-outline" size={20} color="#666" />
          <Text className="text-[10px] text-[#999]">购物车</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/orders')} className="flex-1 items-center rounded-full bg-[#ff3d00] py-3">
          <Text className="text-[15px] font-bold text-white">立即购买</Text>
        </Pressable>
      </View>
    </View>
  );
}
