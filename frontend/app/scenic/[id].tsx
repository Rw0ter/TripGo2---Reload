import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/lib/api';
import type { Scenic } from '@/lib/api-types';
import { resolveLegacyImage } from '@/lib/legacy-images';
import { useAuthStore } from '@/stores/auth';

// ── helpers ──────────────────────────────────────────────────────────

const ESTIMATED_PRICES: Record<string, number> = {
  '自然风光': 580,
  '历史古迹': 380,
  '非遗文化': 280,
  '主题乐园': 680,
  '城市地标': 200,
  '博物馆': 120,
  '山水景观': 520,
  '文化街区': 300,
  '宗教圣地': 150,
};

function getDefaultPrice(data: Scenic): number {
  const tag = (data.tag || '');
  for (const [key, price] of Object.entries(ESTIMATED_PRICES)) {
    if (tag.includes(key)) return price;
  }
  const cityPrices: Record<string, number> = {
    '广州': 450, '深圳': 380, '珠海': 520, '东莞': 320, '佛山': 350,
    '惠州': 400, '汕头': 300, '潮州': 280, '梅州': 260, '韶关': 350,
    '肇庆': 380, '江门': 320, '河源': 340, '清远': 420, '揭阳': 290,
  };
  return cityPrices[data.city] || 380;
}

function getDuration(data: Scenic): string {
  const tag = (data.tag || '');
  if (tag.includes('主题乐园')) return '1 天';
  if (tag.includes('博物馆')) return '1 天';
  if (tag.includes('城市地标')) return '1 天';
  if (tag.includes('历史古迹')) return '1-2 天';
  if (tag.includes('非遗文化')) return '1-2 天';
  if (tag.includes('宗教圣地')) return '1 天';
  if (tag.includes('自然风光')) return '2-3 天';
  if (tag.includes('山水景观')) return '2-3 天';
  if (tag.includes('文化街区')) return '1-2 天';
  return '1-2 天';
}

function getDistance(city: string): string {
  const distances: Record<string, string> = {
    '广州': '0 公里', '深圳': '135 公里', '珠海': '140 公里', '东莞': '70 公里',
    '佛山': '30 公里', '惠州': '150 公里', '汕头': '440 公里', '潮州': '420 公里',
    '梅州': '400 公里', '韶关': '220 公里', '肇庆': '110 公里', '江门': '100 公里',
    '河源': '210 公里', '清远': '80 公里', '揭阳': '380 公里',
  };
  return distances[city] || '200 公里';
}

function getWeather(): { value: string; label: string } {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return { value: '25°C', label: '宜人' };
  if (month >= 5 && month <= 9) return { value: '32°C', label: '炎热' };
  if (month >= 10 && month <= 11) return { value: '22°C', label: '凉爽' };
  return { value: '16°C', label: '微凉' };
}

// ── component ────────────────────────────────────────────────────────

export default function ScenicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const token = useAuthStore((s) => s.token);

  const [data, setData] = useState<Scenic | null>(null);
  const [error, setError] = useState(false);
  const [fav, setFav] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const carouselRef = useRef<ScrollView>(null);
  const headerRef = useRef<View>(null);

  // ── data loading ──────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!id) return;
    setError(false);
    try {
      setData(await apiRequest<Scenic>(`/scenic/${id}`));
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  // ── carousel images ────────────────────────────────────────────────

  const carouselImages = useMemo(() => {
    if (!data) return [] as string[];
    // API 只返回一张图，用 3 张兜底图补齐为 4 张（与旧版 xq.html 一致）
    return [data.image, 'gz.jpg', 'gz2.jpg', 'gz3.jpg'];
  }, [data]);

  // ── carousel auto-advance ──────────────────────────────────────────

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % carouselImages.length;
        carouselRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [carouselImages.length, width]);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(idx);
  };

  const handleDotPress = (idx: number) => {
    carouselRef.current?.scrollTo({ x: idx * width, animated: true });
    setActiveSlide(idx);
  };

  // ── scroll-responsive header ──────────────────────────────────────

  const imgH = Math.round(width * 0.6);
  const [headerH, setHeaderH] = useState(imgH);
  const lastHRef = useRef(imgH);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.y;
    const newH = Math.max(Math.round(imgH * 0.65), imgH - offset);
    // 避免像素级重渲染
    if (Math.abs(newH - lastHRef.current) >= 3) {
      lastHRef.current = newH;
      setHeaderH(newH);
    }
  };

  // ── derived values ─────────────────────────────────────────────────

  // 价格优先用后端 scenic.price，缺省（0）时回退到按类型/城市估算
  const price = useMemo(() => (data ? data.price || getDefaultPrice(data) : 0), [data]);
  const rating = useMemo(() => {
    // Scenic 无评分字段，按景区类型给出合理默认值
    const tag = (data?.tag || '');
    if (tag.includes('主题乐园')) return { stars: 5, score: '4.8', count: '1.2K' };
    if (tag.includes('历史古迹')) return { stars: 5, score: '4.9', count: '2.1K' };
    return { stars: 5, score: '4.9', count: '2.7K' };
  }, [data]);
  const weather = useMemo(() => getWeather(), []);

  // ── order booking ──────────────────────────────────────────────────

  const handleBook = useCallback(async () => {
    if (!data || booking) return;
    setBookError(null);

    if (!token) {
      router.push('/login');
      return;
    }

    setBooking(true);
    try {
      // 价格由后端按 scenic.id 取 price 定价，前端不再传 price
      const order = await apiRequest<{ id: number }>('/orders', {
        method: 'POST',
        auth: true,
        body: { itemType: 'scenic', itemId: data.id },
      });
      router.push(`/orders?id=${order.id}`);
    } catch (e) {
      setBookError(e instanceof Error ? e.message : '下单失败，请重试');
    } finally {
      setBooking(false);
    }
  }, [data, booking, token, router]);

  // ── loading / error states ─────────────────────────────────────────

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text className="mt-3 text-[15px] text-[#999]">加载失败</Text>
        <Pressable onPress={() => void load()} className="mt-4 rounded-full bg-[#00c853] px-8 py-2.5">
          <Text className="text-[14px] font-bold text-white">重试</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#00c853" />
      </View>
    );
  }

  // ── render ─────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* ====== Image carousel header ====== */}
        <View ref={headerRef} style={{ height: headerH }}>
          {/* Horizontal image carousel — matching legacy .carousel */}
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            decelerationRate="fast"
            nestedScrollEnabled
          >
            {carouselImages.map((imgKey, i) => (
              <Image
                key={i}
                source={resolveLegacyImage(imgKey)}
                style={{ width, height: headerH }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Back + Favorite overlay — matching legacy .back-button / .favorite-button */}
          <View
            style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}
            className="flex-row justify-between px-4"
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="返回"
              className="h-9 w-9 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={23} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setFav((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="收藏"
              className="h-9 w-9 items-center justify-center rounded-full bg-black/30"
            >
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={20}
                color={fav ? '#ff5252' : '#fff'}
              />
            </Pressable>
          </View>

          {/* Dot indicators — matching legacy .dots */}
          <View
            style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}
            className="flex-row justify-center gap-1.5"
          >
            {carouselImages.map((_, i) => (
              <Pressable key={i} onPress={() => handleDotPress(i)}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ====== Content card — matching legacy .content ====== */}
        <View
          style={{
            marginTop: -18,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
          className="bg-white px-5 pb-16 pt-4"
        >
          {/* Name + Price row — matching legacy .destination */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-[24px] font-bold text-[#333]">{data.name}</Text>
            </View>
            {/* Price — matching legacy .price */}
            <Text style={{ color: '#00c853', fontSize: 28, fontWeight: 'bold' }}>
              {'¥'}{price}
            </Text>
          </View>

          {/* Rating — matching legacy .rating */}
          <View className="mt-1 flex-row items-center">
            <Text className="text-[13px] text-[#ff9800]">
              {'★'.repeat(rating.stars)}
            </Text>
            <Text className="ml-1.5 text-[13px] text-[#999]">
              {rating.score} ({rating.count})
            </Text>
          </View>

          {/* Estimated cost label — matching legacy .estimated */}
          <Text className="mt-0.5 text-[13px] text-[#999]">* 估算费用</Text>

          {/* Tag + City badge */}
          <View className="mt-2 flex-row items-center gap-2">
            <View className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5">
              <Text className="text-[11px] font-medium text-[#00a844]">{data.tag}</Text>
            </View>
            <Text className="text-[12px] text-[#999]">{data.city}</Text>
          </View>

          {/* Summary note — keep from existing */}
          {data.note ? (
            <View className="mt-3 rounded-xl bg-[#F8F5E6] px-3.5 py-2.5">
              <View className="flex-row items-center">
                <Ionicons name="information-circle-outline" size={16} color="#C9A24B" />
                <Text className="ml-1.5 text-[13px] font-medium text-[#8C7640]">{data.note}</Text>
              </View>
            </View>
          ) : null}

          {/* Tabs — matching legacy .tabs */}
          <View className="mt-5 flex-row border-b border-[#eee]">
            {['景点介绍', '游玩攻略', '交通指南'].map((t, i) => (
              <Pressable
                key={t}
                onPress={() => setActiveTab(i)}
                className={`mr-6 pb-2.5 ${i === activeTab ? 'border-b-2 border-[#00c853]' : ''}`}
              >
                <Text
                  className={`text-[14px] ${i === activeTab ? 'font-bold text-[#00c853]' : 'text-[#999]'}`}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab content — matching legacy .description */}
          <View className="mt-4">
            {activeTab === 0 ? (
              <Text className="text-[15px] leading-7 text-[#555]">
                {data.summary || `${data.name}位于${data.city}，是周边颇具代表性的绿色生态地标之一。这里自然风光优美、生态环境宜人，是亲近自然、绿色出行的理想去处。你可以在此呼吸新鲜空气、感受生态之美，体验低碳健行与自然教育，是绿色低碳出行不可错过的目的地。`}
              </Text>
            ) : activeTab === 1 ? (
              <View>
                <Text className="mb-2 text-[15px] font-semibold text-[#333]">推荐游玩路线</Text>
                <Text className="text-[14px] leading-7 text-[#555]">
                  {'建议游玩时长：'} {getDuration(data)}{'\n'}
                  {'最佳游览季节：春秋季'}{'\n'}
                  {'推荐上午抵达，先游览核心景区，中午品尝当地美食，下午参观周边文化场馆。建议提前预约门票，避开节假日高峰。'}
                </Text>
              </View>
            ) : (
              <View>
                <Text className="mb-2 text-[15px] font-semibold text-[#333]">交通信息</Text>
                <Text className="text-[14px] leading-7 text-[#555]">
                  {'地址：广东省'}{data.city}{'市'}{'\n'}
                  {'距离广州市区约 '}{getDistance(data.city)}{'\n'}
                  {'地铁：可乘坐地铁到达附近站点'}{'\n'}
                  {'公交：多条公交线路可达'}{'\n'}
                  {'自驾：导航搜索「'}{data.name}{'」即可'}
                </Text>
              </View>
            )}
          </View>

          {/* Info row — matching legacy .info */}
          <View className="mt-5 flex-row justify-between px-2">
            {/* Duration */}
            <View className="items-center">
              <Ionicons name="time-outline" size={24} color="#40916C" />
              <Text className="mt-1 text-[14px] font-bold text-[#333]">{getDuration(data)}</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">时长</Text>
            </View>
            {/* Distance */}
            <View className="items-center">
              <Ionicons name="location-outline" size={24} color="#40916C" />
              <Text className="mt-1 text-[14px] font-bold text-[#333]">{getDistance(data.city)}</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">距离</Text>
            </View>
            {/* Weather */}
            <View className="items-center">
              <Ionicons name="partly-sunny-outline" size={24} color="#40916C" />
              <Text className="mt-1 text-[14px] font-bold text-[#333]">{weather.value}</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">{weather.label}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ====== Bottom action bar — matching legacy .buttons ====== */}
      <View
        style={{ paddingBottom: insets.bottom + 6 }}
        className="flex-row items-center gap-3 border-t border-[#eee] bg-white px-5 pt-3"
      >
        {/* Book error */}
        {bookError ? (
          <View
            style={{ position: 'absolute', top: -38, left: 16, right: 16 }}
            className="rounded-lg bg-[#fff3f0] px-3 py-1.5"
          >
            <Text className="text-[12px] text-[#ff3d00]">{bookError}</Text>
          </View>
        ) : null}

        {/* Outline price button — matching legacy .price-button */}
        <Pressable
          onPress={() => router.push('/orders')}
          className="flex-1 items-center rounded-full border-2 border-[#00c853] py-3"
        >
          <Text style={{ color: '#00c853', fontSize: 16, fontWeight: 'bold' }}>
            {'¥'}{price}
          </Text>
        </Pressable>

        {/* Solid book button — matching legacy .book-button */}
        <Pressable
          onPress={handleBook}
          disabled={booking}
          className="flex-1 items-center rounded-full py-3"
          style={{ backgroundColor: booking ? '#80e0a7' : '#00c853' }}
        >
          {booking ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-[16px] font-bold text-white">立即预订</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
