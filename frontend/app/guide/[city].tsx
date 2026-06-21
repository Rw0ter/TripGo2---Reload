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
import { FadeInDown } from 'react-native-reanimated';
import { Animated } from '@/components/ui/animated';

import { apiRequest } from '@/lib/api';
import type { Scenic } from '@/lib/api-types';
import { resolveLegacyImage } from '@/lib/legacy-images';

// Static address / hours for known scenic spots (matches Legacy hotTrip.html).
const SPOT_DETAILS: Record<string, { address: string; hours: string }> = {
  '广州塔': { address: '广东省广州市海珠区阅江西路222号', hours: '09:00-22:30' },
  '丹霞山': { address: '广东省韶关市仁化县境内', hours: '00:00-24:00' },
  '长隆海洋王国': { address: '广东省珠海市横琴新区富祥湾', hours: '10:00-19:00' },
  '欢乐谷': { address: '广东省广州市番禺区迎宾路', hours: '09:30-21:00' },
  '东莞虎门大桥': { address: '广东省东莞市虎门镇', hours: '全天开放' },
  '东莞战争博物馆': { address: '广东省东莞市虎门镇威远岛', hours: '09:00-17:00' },
  '山谷古村落': { address: '广东省东莞市清溪镇', hours: '08:00-18:00' },
};

function getSpotDetail(name: string, city: string): { address: string; hours: string } {
  if (SPOT_DETAILS[name]) return SPOT_DETAILS[name];
  return { address: `广东省${city}市境内`, hours: '08:00-18:00' };
}

// 生态指数（由名称稳定派生）：取代旅游星级评分。
function computeGreenIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return 88 + (h % 12); // 88-99
}

export default function CityGuideScreen() {
  const { city } = useLocalSearchParams<{ city: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [spots, setSpots] = useState<Scenic[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!city) return;
    setError(false);
    try {
      setSpots(await apiRequest<Scenic[]>(`/scenic?city=${encodeURIComponent(city)}`));
    } catch {
      setError(true);
    }
  }, [city]);

  useEffect(() => { void load(); }, [load]);

  const cardW = width - 32; // full-width cards matching Legacy hotTrip.html

  return (
    <View className="flex-1 bg-[#eef2f5]">
      {/* Hero header — matching Legacy moreTrip.html */}
      <View className="relative items-center justify-end bg-[#2D6A4F] pb-6" style={{ height: '20%' }}>
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: insets.top + 6, left: 12 }}
          className="z-10 h-10 w-10 items-center justify-center">
          <Ionicons name="chevron-back" size={23} color="#fff" />
        </Pressable>
        <Text className="text-[28px] font-bold text-white">{city || '城市低碳指南'}</Text>
        <Text className="mt-1 text-[13px] text-white/75">探索{city}的绿色生活方式</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        {error ? (
          <View className="items-center py-16">
            <Ionicons name="alert-circle-outline" size={40} color="#aaa" />
            <Text className="mt-2 text-[14px] text-[#999]">加载失败</Text>
            <Pressable onPress={() => void load()} className="mt-3 rounded-xl bg-[#2D6A4F] px-5 py-2">
              <Text className="text-[14px] font-bold text-white">重试</Text>
            </Pressable>
          </View>
        ) : !spots ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#2D6A4F" />
          </View>
        ) : spots.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="leaf-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[15px] text-[#999]">该城市暂无绿色地标数据</Text>
          </View>
        ) : (
          spots.map((s, idx) => {
            const detail = getSpotDetail(s.name, city ?? '');
            const greenIndex = computeGreenIndex(s.name);
            return (
              <Animated.View
                key={s.id}
                entering={FadeInDown.delay(idx * 100).springify()}
                style={{
                  width: cardW,
                  borderRadius: 20,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0px 6px 20px rgba(0,0,0,0.12)',
                }}>
                {/* Image */}
                <Image
                  source={resolveLegacyImage(s.image)}
                  style={{ width: cardW, height: 180 }}
                  resizeMode="cover"
                />

                {/* Card content */}
                <View className="p-4">
                  {/* Title + 绿色地标标识 */}
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-[18px] font-bold text-[#333]" numberOfLines={1}>{s.name}</Text>
                    <View className="ml-2 flex-row items-center rounded-full bg-[#D8F3DC] px-2.5 py-1">
                      <Ionicons name="leaf" size={11} color="#2D6A4F" />
                      <Text className="ml-1 text-[11px] font-semibold text-[#2D6A4F]">绿色地标</Text>
                    </View>
                  </View>

                  {/* 生态指数 */}
                  <View className="mt-1.5 flex-row items-center">
                    <Ionicons name="trending-up" size={14} color="#52B788" />
                    <Text className="ml-1 text-[13px] font-semibold text-[#40916C]">生态指数 {greenIndex}</Text>
                  </View>

                  {/* Description */}
                  <Text numberOfLines={2} className="mt-2 text-[13px] leading-5 text-[#555]">
                    {s.summary}
                  </Text>

                  {/* Address & hours */}
                  <View className="mt-3 space-y-1">
                    <View className="flex-row items-center">
                      <Ionicons name="location-outline" size={14} color="#888" />
                      <Text className="ml-1.5 text-[12px] text-[#666]">地址：{detail.address}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color="#888" />
                      <Text className="ml-1.5 text-[12px] text-[#666]">时间：{detail.hours}</Text>
                    </View>
                  </View>

                  {/* Map placeholder */}
                  <View
                    className="mt-3 items-center justify-center rounded-2xl bg-[#e8e8e8]"
                    style={{ height: 100 }}>
                    <Ionicons name="map" size={32} color="#bbb" />
                    <Text className="mt-1 text-[12px] text-[#aaa]">{detail.address}</Text>
                  </View>

                  {/* Action buttons — 查看详情 + 分享 */}
                  <View className="mt-3 flex-row" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: s.id } })}
                      className="flex-1 items-center rounded-xl bg-[#2D6A4F] py-2.5 active:opacity-80">
                      <View className="flex-row items-center">
                        <Ionicons name="leaf-outline" size={16} color="#fff" />
                        <Text className="ml-1.5 text-[14px] font-semibold text-white">查看详情</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      className="flex-1 items-center rounded-xl border border-[#2D6A4F] bg-white py-2.5 active:opacity-80">
                      <View className="flex-row items-center">
                        <Ionicons name="share-outline" size={16} color="#2D6A4F" />
                        <Text className="ml-1.5 text-[14px] font-semibold text-[#2D6A4F]">分享</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
