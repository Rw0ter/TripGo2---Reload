import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';
import { ScreenHeader } from '@/components/ui/screen-header';

interface Product { id: number; title: string; image: string; money: string; number: string; type: number; }

const CATS = ['全部', '古筝', '曲艺', '技艺', '美术', '民俗', '特产'];

const TYPE_LABELS: Record<number, string> = {
  1: '古筝工艺',
  2: '曲艺传承',
  3: '传统技艺',
  4: '岭南美术',
  5: '民俗文化',
  6: '地道风味',
};

export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [type, setType] = useState<number>(0);

  const load = useCallback(async () => {
    try {
      const qs = type !== 0 ? `?type=${type}` : '';
      setProducts(await apiRequest<Product[]>(`/destinations${qs}`));
    } catch { setProducts(null); }
  }, [type]);

  useEffect(() => { void load(); }, [load]);

  const gap = 12;
  const padX = 16;
  const cardW = Math.floor((width - padX * 2 - gap) / 2);

  // Waterfall — alternate left/right columns (matching Legacy chanpin.html).
  const columns = useMemo(() => {
    if (!products) return { left: [], right: [] };
    const reversed = [...products].reverse();
    const left: Product[] = [];
    const right: Product[] = [];
    reversed.forEach((p, i) => {
      if (i % 2 === 0) left.push(p); else right.push(p);
    });
    return { left, right };
  }, [products]);

  // Adaptive image height: pseudo-random aspect ratio per product id.
  function imgHeight(id: number): number {
    return Math.floor(cardW * (0.75 + ((id * 7) % 5) * 0.06));
  }

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      {/* Header */}
      <View className="bg-[#3E6B4F]">
        <ScreenHeader title="文创产品" tint="dark" />
      </View>

      {/* Category tabs — separate bar like Legacy */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-[#e9e3d7]"
        contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12, gap: 12 }}>
        {CATS.map((cat, i) => {
          const active = type === i;
          return (
            <Pressable key={cat} onPress={() => setType(i)} className="relative pb-3">
              <Text className={`text-[15px] ${active ? 'font-medium text-[#CA4D4E]' : 'text-[#481E25]'}`}>
                {cat}
              </Text>
              {active && (
                <View
                  className="absolute bottom-0 left-1/2 ml-[-35%] h-[5px] w-[70%] rounded-[10px] bg-[#CA4D4E]"
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: padX, paddingBottom: 32 }}>
        {!products ? (
          <View className="items-center py-20"><ActivityIndicator color="#3E6B4F" /></View>
        ) : products.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="cube-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">暂无产品</Text>
          </View>
        ) : (
          <View className="flex-row" style={{ gap }}>
            {/* Left column */}
            <View className="flex-1" style={{ gap }}>
              {columns.left.map((p) => (
                <ProductCard key={p.id} product={p} cardW={cardW} imgH={imgHeight(p.id)} router={router} />
              ))}
            </View>
            {/* Right column */}
            <View className="flex-1" style={{ gap }}>
              {columns.right.map((p) => (
                <ProductCard key={p.id} product={p} cardW={cardW} imgH={imgHeight(p.id)} router={router} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProductCard({
  product: p,
  cardW,
  imgH,
  router,
}: {
  product: Product;
  cardW: number;
  imgH: number;
  router: ReturnType<typeof useRouter>;
}) {
  const extra = TYPE_LABELS[p.type] ?? null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
      style={{
        width: cardW,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
      }}>
      <Image
        source={resolveLegacyImage(p.image)}
        style={{ width: cardW, height: imgH }}
        resizeMode="cover"
      />
      <View className="p-2.5">
        <Text numberOfLines={2} className="text-[14px] leading-[1.4] text-[#333]" style={{ height: 40 }}>
          {p.title}
        </Text>

        {/* Extra info line — green text + leaf icon */}
        {extra && (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="leaf" size={14} color="#40CEA7" />
            <Text className="ml-1 text-[12px] text-[#40CEA7]">{extra}</Text>
          </View>
        )}

        {/* Price row */}
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row items-baseline">
            <Text className="text-[12px] text-[#ff3e30]">¥</Text>
            <Text className="text-[16px] font-bold text-[#ff3e30]">{p.money}</Text>
          </View>
          <Text className="text-[11px] text-[#999]">已售{p.number}件</Text>
        </View>
      </View>
    </Pressable>
  );
}
