import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';
import { useAuthStore } from '@/stores/auth';

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

interface Review {
  id: number;
  rating: number;
  text: string;
  createdAt: string;
  author: { username: string };
}

const TYPE_LABELS = ['全部', '古筝', '曲艺', '技艺', '美术', '民俗', '特产'];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const token = useAuthStore((s) => s.token);

  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiRequest<Product>(`/destinations/${id}`));
    } catch {
      setError('加载产品信息失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // 评价列表（接已有 reviews 模块，按 destination + id 查）
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!id) return;
    apiRequest<Review[]>(`/reviews?itemType=destination&itemId=${id}`)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [id]);

  const handleBuy = useCallback(async () => {
    if (!data || buying) return;
    setBuyError(null);

    if (!token) {
      router.push('/login');
      return;
    }

    setBuying(true);
    try {
      // 价格由后端按 destinationId 取真实 money 定价，前端不再传 price
      const order = await apiRequest<{ id: number }>('/orders', {
        method: 'POST',
        auth: true,
        body: { itemType: 'destination', itemId: data.id },
      });
      router.push(`/orders?id=${order.id}`);
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : '下单失败，请重试');
    } finally {
      setBuying(false);
    }
  }, [data, buying, token, router]);

  // --- Loading state ---
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#ff3d00" />
      </View>
    );
  }

  // --- Error state ---
  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text className="mt-3 text-[15px] text-[#999]">{error || '产品不存在'}</Text>
        <Pressable
          onPress={() => load()}
          className="mt-4 rounded-full bg-[#ff3d00] px-6 py-2"
        >
          <Text className="text-[14px] font-semibold text-white">重试</Text>
        </Pressable>
      </View>
    );
  }

  const productType = TYPE_LABELS[data.type] || '未知';

  return (
    <View className="flex-1 bg-[#f7f7f7]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ====== Product image ====== */}
        <Image
          source={resolveLegacyImage(data.image)}
          style={{ width, height: 300 }}
          resizeMode="cover"
        />

        {/* ====== Back button (overlay on image) ====== */}
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: insets.top + 8, left: 16 }}
          className="h-9 w-9 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={23} color="#fff" />
        </Pressable>

        {/* ====== Info card — matching Legacy .card ====== */}
        <View
          style={{
            marginTop: -18,
            marginHorizontal: 14,
            borderRadius: 14,
          }}
          className="bg-white px-4 pb-5 pt-[18px] shadow-lg"
        >
          {/* Title */}
          <Text className="text-[18px] font-semibold text-[#111]">
            {data.title}
          </Text>

          {/* Trust badge — matching Legacy .tag */}
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="shield-checkmark" size={15} color="#0da884" />
            <Text className="ml-1 text-[13px] text-[#0da884]">
              退换货包运费 · 假一赔十
            </Text>
          </View>

          {/* Price + sales */}
          <View className="mt-3 flex-row items-baseline justify-between">
            <Text className="text-[22px] font-bold text-[#ff3d00]">
              {'¥'} {data.money}
            </Text>
            <Text className="text-[13px] text-[#666]">
              已售 {data.number} 件
            </Text>
          </View>
        </View>

        {/* ====== Detail card — matching Legacy .detail ====== */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 10,
            marginBottom: 80,
            borderRadius: 14,
          }}
          className="bg-white px-4 py-4 shadow-sm"
        >
          {/* Section header with orange accent */}
          <View className="mb-3 flex-row items-center">
            <View
              style={{
                width: 4,
                height: 18,
                backgroundColor: '#ff6a00',
                borderRadius: 2,
                marginRight: 8,
              }}
            />
            <Text className="text-[15px] font-semibold text-[#333]">
              产品详情
            </Text>
          </View>

          {/* 2-column detail grid — matching Legacy .detail-table */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: '名称', value: data.title },
              { label: '价格', value: `¥ ${data.money}` },
              { label: '已售', value: `${data.number} 件` },
              { label: '类型', value: productType },
            ].map((row, i) => (
              <View
                key={i}
                style={{
                  width: '50%',
                  paddingVertical: 6,
                  borderBottomWidth: i < 2 ? 1 : 0,
                  borderColor: '#f3f3f3',
                }}
                className="flex-row"
              >
                <Text className="w-[56px] text-[14px] font-medium text-[#333]">
                  {row.label}
                </Text>
                <Text className="flex-1 text-[14px] text-[#666]">
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Product description */}
          <View className="mt-5 border-t border-[#eee] pt-4">
            <View className="mb-3 flex-row items-center">
              <View
                style={{
                  width: 4,
                  height: 18,
                  backgroundColor: '#ff6a00',
                  borderRadius: 2,
                  marginRight: 8,
                }}
              />
              <Text className="text-[15px] font-semibold text-[#333]">
                产品描述
              </Text>
            </View>
            <Text className="text-[14px] leading-6 text-[#666]">
              {data.description?.trim()
                ? data.description
                : '这是一件精美的岭南非遗文创作品，由非遗传承人纯手工制作，承载着匠人的心血与岭南文化的独特韵味。'}
            </Text>
          </View>
        </View>

        {/* ====== Reviews section ====== */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: -70,
            marginBottom: 24,
            borderRadius: 14,
          }}
          className="bg-white px-4 py-4 shadow-sm"
        >
          <View className="mb-3 flex-row items-center">
            <View
              style={{
                width: 4,
                height: 18,
                backgroundColor: '#ff6a00',
                borderRadius: 2,
                marginRight: 8,
              }}
            />
            <Text className="text-[15px] font-semibold text-[#333]">
              用户评价 ({reviews.length})
            </Text>
          </View>

          {reviews.length === 0 ? (
            <Text className="py-3 text-[13px] text-[#999]">还没有评价，快来抢沙发～</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} className="border-b border-[#f5f5f5] py-3">
                <View className="flex-row items-center">
                  <View
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0da884' }}
                    className="items-center justify-center"
                  >
                    <Text className="text-[11px] font-bold text-white">
                      {r.author.username.slice(0, 1)}
                    </Text>
                  </View>
                  <Text className="ml-2 text-[13px] font-semibold text-[#333]">
                    {r.author.username}
                  </Text>
                  <Text className="ml-2 text-[12px] text-[#ff9800]">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </Text>
                  <Text className="ml-auto text-[11px] text-[#bbb]">{r.createdAt.slice(0, 10)}</Text>
                </View>
                <Text className="ml-10 mt-1 text-[13px] text-[#666]">{r.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ====== Bottom fixed bar — matching Legacy .bottom-bar ====== */}
      <View
        style={{
          paddingBottom: insets.bottom + 6,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
        }}
        className="flex-row items-center border-t border-[#eee] bg-white px-4 pt-3"
      >
        {/* Customer service */}
        <Pressable
          onPress={() => router.push('/')}
          className="mr-5 items-center"
        >
          <Ionicons name="headset-outline" size={22} color="#555" />
          <Text className="mt-0.5 text-[11px] text-[#666]">客服</Text>
        </Pressable>

        {/* Like / favorite */}
        <Pressable
          onPress={() => setLiked((v) => !v)}
          className="mr-5 items-center"
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#ff3d3d' : '#555'}
          />
          <Text
            className={`mt-0.5 text-[11px] ${liked ? 'text-[#ff3d3d]' : 'text-[#666]'}`}
          >
            {liked ? '已喜欢' : '喜欢'}
          </Text>
        </Pressable>

        {/* Buy error message */}
        {buyError && (
          <View className="absolute -top-9 left-4 right-4 rounded-lg bg-[#fff3f0] px-3 py-1.5">
            <Text className="text-[12px] text-[#ff3d00]">{buyError}</Text>
          </View>
        )}

        {/* Buy button — gradient orange matching Legacy .buy-btn */}
        <Pressable
          onPress={handleBuy}
          disabled={buying}
          className="ml-auto flex-1 items-center rounded-full py-3"
          style={{
            backgroundColor: buying ? '#ffb199' : '#ff3d00',
          }}
        >
          {buying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-[15px] font-semibold text-white">
              立即购买
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
