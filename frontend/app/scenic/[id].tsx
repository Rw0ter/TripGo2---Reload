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

// ── helpers ──────────────────────────────────────────────────────────
// 绿色地标详情：用生态维度替代旅游的价格/距离/天气等 chrome。

// 推荐绿色到达方式（按类型给出最低碳的出行建议）。
function getGreenTransit(data: Scenic): string {
  const tag = (data.tag || '');
  if (tag.includes('城市地标')) return '地铁直达';
  if (tag.includes('博物馆')) return '公交直达';
  if (tag.includes('文化街区')) return '步行漫游';
  if (tag.includes('自然风光')) return '骑行慢游';
  if (tag.includes('山水景观')) return '徒步健行';
  return '公交 / 骑行';
}

// 建议停留时长（鼓励放慢节奏、深度体验）。
function getStayDuration(data: Scenic): string {
  const tag = (data.tag || '');
  if (tag.includes('博物馆')) return '半日';
  if (tag.includes('城市地标')) return '半日';
  if (tag.includes('文化街区')) return '半日';
  if (tag.includes('自然风光')) return '一日';
  if (tag.includes('山水景观')) return '一日';
  return '半日';
}

// 生态指数（由名称稳定派生，作为绿色程度的轻量展示）。
function getGreenIndex(name: string): { value: string; label: string } {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const score = 88 + (h % 12); // 88-99
  const label = score >= 95 ? '生态优' : '生态良';
  return { value: String(score), label };
}

// 由城市名稳定派生「距您」公里数（演示用，无真实定位）。
function getDistance(city: string): string {
  let h = 0;
  for (let i = 0; i < city.length; i += 1) h = (h * 31 + city.charCodeAt(i)) & 0xffff;
  return `${8 + (h % 120)}.${h % 10}`;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
// 顶部快捷卡（参考携程「相册/必去理由/达人实拍/园内必玩」→ 绿色化）。
const QUICK: { label: string; icon: IoniconName; tab: number }[] = [
  { label: '相册', icon: 'images', tab: 0 },
  { label: '生态亮点', icon: 'sparkles', tab: 0 },
  { label: '低碳玩法', icon: 'bicycle', tab: 1 },
  { label: '绿色到达', icon: 'navigate', tab: 2 },
];

// ── component ────────────────────────────────────────────────────────

export default function ScenicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [data, setData] = useState<Scenic | null>(null);
  const [error, setError] = useState(false);
  const [fav, setFav] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

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
  // 生态维度替代旅游 chrome：到达方式 / 停留时长 / 生态指数。
  const greenIndex = useMemo(() => (data ? getGreenIndex(data.name) : { value: '—', label: '生态良' }), [data]);

  // ── loading / error states ─────────────────────────────────────────

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text className="mt-3 text-[15px] text-[#999]">加载失败</Text>
        <Pressable onPress={() => void load()} className="mt-4 rounded-full bg-[#2D6A4F] px-8 py-2.5">
          <Text className="text-[14px] font-bold text-white">重试</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2D6A4F" />
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
          {/* 快捷卡行（参考携程 相册/必去理由/达人实拍/园内必玩 → 绿色化），overlap 卡片顶部 */}
          <View className="-mt-12 mb-4 flex-row gap-2.5">
            {QUICK.map((q, i) => (
              <Pressable
                key={q.label}
                onPress={() => setActiveTab(q.tab)}
                accessibilityRole="button"
                className="flex-1 overflow-hidden rounded-2xl"
                style={{ boxShadow: '0px 6px 16px rgba(0,0,0,0.18)' }}
              >
                <Image source={resolveLegacyImage(carouselImages[i % carouselImages.length])} style={{ width: '100%', height: 72 }} resizeMode="cover" />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(27,67,50,0.45)' }} className="items-center justify-center">
                  <Ionicons name={q.icon} size={18} color="#fff" />
                  <Text className="mt-0.5 text-[11px] font-bold text-white">{q.label}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* 标题 + 绿色地标/热度 + 生态指数 */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[24px] font-extrabold text-[#1B4332]">{data.name}</Text>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center rounded-md bg-[#D8F3DC] px-2 py-0.5">
                  <Ionicons name="leaf" size={11} color="#2D6A4F" />
                  <Text className="ml-1 text-[11px] font-bold text-[#2D6A4F]">绿色地标</Text>
                </View>
                <View className="flex-row items-center rounded-md px-2 py-0.5" style={{ backgroundColor: '#FFF1E6' }}>
                  <Ionicons name="flame" size={11} color="#E8853D" />
                  <Text className="ml-0.5 text-[11px] font-bold" style={{ color: '#E8853D' }}>{greenIndex.value}</Text>
                </View>
                <Text className="text-[12px] text-[#9CB3A6]">{data.tag || data.city}</Text>
              </View>
            </View>
            <View className="items-center rounded-2xl bg-[#EAF7EF] px-3.5 py-2">
              <Text className="text-[20px] font-extrabold text-[#1B4332]">{greenIndex.value}</Text>
              <Text className="text-[10px] text-[#52B788]">生态指数</Text>
            </View>
          </View>

          {/* 榜单 banner */}
          <View className="mt-3 flex-row items-center rounded-xl px-3 py-2.5" style={{ backgroundColor: '#F3FAF5' }}>
            <Ionicons name="trophy" size={15} color="#C9A24B" />
            <Text className="ml-2 flex-1 text-[13px] font-semibold text-[#1B4332]">2026 绿色低碳生态地标推荐榜</Text>
            <Ionicons name="chevron-forward" size={15} color="#9CB3A6" />
          </View>

          {/* 信息胶囊行（开放 / 生态评价 / 出行） */}
          <View className="mt-3 flex-row gap-2.5">
            <View className="flex-1 rounded-xl border border-[#E4EFE7] px-3 py-2">
              <View className="flex-row items-center"><Ionicons name="time-outline" size={13} color="#40916C" /><Text className="ml-1 text-[12px] font-bold text-[#2D6A4F]">全天开放</Text></View>
              <Text className="mt-0.5 text-[11px] text-[#9CB3A6]">户外生态地标</Text>
            </View>
            <View className="flex-1 rounded-xl border border-[#E4EFE7] px-3 py-2">
              <View className="flex-row items-center"><Ionicons name="leaf-outline" size={13} color="#40916C" /><Text className="ml-1 text-[12px] font-bold text-[#2D6A4F]">{greenIndex.label}</Text></View>
              <Text className="mt-0.5 text-[11px] text-[#9CB3A6]">生态指数 {greenIndex.value}</Text>
            </View>
            <View className="flex-1 rounded-xl border border-[#E4EFE7] px-3 py-2">
              <View className="flex-row items-center"><Ionicons name="bicycle-outline" size={13} color="#40916C" /><Text className="ml-1 text-[12px] font-bold text-[#2D6A4F]">出行友好</Text></View>
              <Text className="mt-0.5 text-[11px] text-[#9CB3A6]" numberOfLines={1}>{getGreenTransit(data)}</Text>
            </View>
          </View>

          {/* 距离 + 地图 */}
          <View className="mt-3 flex-row items-center rounded-xl bg-[#F7FAF5] px-3.5 py-3">
            <Ionicons name="location-outline" size={16} color="#40916C" />
            <View className="ml-2 flex-1">
              <Text className="text-[13px] font-semibold text-[#1B4332]">距您约 {getDistance(data.city)} km</Text>
              <Text className="mt-0.5 text-[12px] text-[#9CB3A6]" numberOfLines={1}>广东省{data.city}市 · 建议{getGreenTransit(data)}</Text>
            </View>
            <Pressable onPress={() => router.push('/map')} accessibilityLabel="地图" className="items-center px-2">
              <Ionicons name="map" size={20} color="#40916C" />
              <Text className="mt-0.5 text-[10px] text-[#52B788]">地图</Text>
            </Pressable>
          </View>

          {/* Tabs — 生态简介 / 低碳玩法 / 到达方式 */}
          <View className="mt-5 flex-row border-b border-[#eee]">
            {['生态简介', '低碳玩法', '绿色到达'].map((t, i) => (
              <Pressable
                key={t}
                onPress={() => setActiveTab(i)}
                className={`mr-6 pb-2.5 ${i === activeTab ? 'border-b-2 border-[#2D6A4F]' : ''}`}
              >
                <Text
                  className={`text-[14px] ${i === activeTab ? 'font-bold text-[#2D6A4F]' : 'text-[#999]'}`}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab content */}
          <View className="mt-4">
            {activeTab === 0 ? (
              <Text className="text-[15px] leading-7 text-[#555]">
                {data.summary || `${data.name}位于${data.city}，是周边颇具代表性的绿色生态地标之一。这里自然风光优美、生态环境宜人，是亲近自然、绿色生活的理想去处。你可以在此呼吸新鲜空气、感受生态之美，体验低碳健行与自然教育，是绿色低碳出行不可错过的生态场所。`}
              </Text>
            ) : activeTab === 1 ? (
              <View>
                <Text className="mb-2 text-[15px] font-semibold text-[#333]">绿色低碳玩法</Text>
                <Text className="text-[14px] leading-7 text-[#555]">
                  {'建议停留：'}{getStayDuration(data)}{'\n'}
                  {'最佳时节：春秋两季，气候宜人、能耗更低'}{'\n'}
                  {'自带水杯与环保袋，践行减塑；优先步行与骑行，放慢节奏深度体验；离开时带走垃圾、做到无痕生态。'}
                </Text>
              </View>
            ) : (
              <View>
                <Text className="mb-2 text-[15px] font-semibold text-[#333]">绿色到达方式</Text>
                <Text className="text-[14px] leading-7 text-[#555]">
                  {'所在区域：广东省'}{data.city}{'市'}{'\n'}
                  {'推荐方式：'}{getGreenTransit(data)}{'，低碳又省心'}{'\n'}
                  {'公共交通：多条公交 / 地铁线路可达，减少自驾排放'}{'\n'}
                  {'慢行接驳：抵达后以步行或共享单车接驳，零碳出行'}
                </Text>
              </View>
            )}
          </View>

          {/* Info row — 绿色到达 / 建议停留 / 生态指数 */}
          <View className="mt-5 flex-row justify-between px-2">
            {/* 绿色到达 */}
            <View className="items-center">
              <Ionicons name="bicycle-outline" size={24} color="#40916C" />
              <Text className="mt-1 text-[14px] font-bold text-[#333]">{getGreenTransit(data)}</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">绿色到达</Text>
            </View>
            {/* 建议停留 */}
            <View className="items-center">
              <Ionicons name="time-outline" size={24} color="#40916C" />
              <Text className="mt-1 text-[14px] font-bold text-[#333]">{getStayDuration(data)}</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">建议停留</Text>
            </View>
            {/* 生态指数 */}
            <View className="items-center">
              <Ionicons name="leaf-outline" size={24} color="#40916C" />
              <Text className="mt-1 text-[14px] font-bold text-[#333]">{greenIndex.value}</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">生态指数</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ====== Bottom action bar — 绿色地标动作 ====== */}
      <View
        style={{ paddingBottom: insets.bottom + 6 }}
        className="flex-row items-center gap-3 border-t border-[#eee] bg-white px-5 pt-3"
      >
        {/* 收藏 outline 按钮 */}
        <Pressable
          onPress={() => setFav((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="收藏"
          className="flex-row items-center justify-center rounded-full border-2 border-[#2D6A4F] px-6 py-3"
        >
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color="#2D6A4F" />
          <Text style={{ color: '#2D6A4F', fontSize: 15, fontWeight: 'bold', marginLeft: 6 }}>
            {fav ? '已收藏' : '收藏'}
          </Text>
        </Pressable>

        {/* 加入绿色计划 primary 按钮 */}
        <Pressable
          onPress={() => router.push('/trip/create')}
          accessibilityRole="button"
          accessibilityLabel="加入绿色计划"
          className="flex-1 flex-row items-center justify-center rounded-full py-3"
          style={{ backgroundColor: '#2D6A4F' }}
        >
          <Ionicons name="leaf-outline" size={18} color="#fff" />
          <Text className="ml-1.5 text-[16px] font-bold text-white">加入绿色计划</Text>
        </Pressable>
      </View>
    </View>
  );
}
