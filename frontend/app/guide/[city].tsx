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
import type { Scenic } from '@/lib/api-types';
import { resolveLegacyImage } from '@/lib/legacy-images';

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

  const cardW = Math.floor((width - 32 - 12) / 2);

  return (
    <View className="flex-1 bg-[#f4f5f7]">
      {/* Hero header — matching Legacy moreTrip.html */}
      <View className="relative h-[20vh] items-center justify-end bg-[#3E6B4F] pb-6">
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: insets.top + 6, left: 16 }}
          accessibilityRole="button"
          className="z-10 h-9 w-9 items-center justify-center rounded-full bg-black/25">
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text className="text-[28px] font-bold text-white">{city || '城市攻略'}</Text>
        <Text className="mt-1 text-[13px] text-white/75">发现{city}的旅行灵感</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {error ? (
          <View className="items-center py-16">
            <Ionicons name="alert-circle-outline" size={40} color="#aaa" />
            <Text className="mt-2 text-[14px] text-[#999]">加载失败</Text>
            <Pressable onPress={() => void load()} className="mt-3 rounded-xl bg-[#41816c] px-5 py-2">
              <Text className="text-[14px] font-bold text-white">重试</Text>
            </Pressable>
          </View>
        ) : !spots ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#41816c" />
          </View>
        ) : spots.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="map-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[15px] text-[#999]">该城市暂无景点数据</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {spots.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => router.push({ pathname: '/scenic/[id]', params: { id: s.id } })}
                accessibilityRole="button"
                style={{
                  width: cardW,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
                }}>
                <Image
                  source={resolveLegacyImage(s.image)}
                  style={{ width: cardW, height: 120 }}
                  resizeMode="cover"
                />
                <View className="p-2.5">
                  <Text numberOfLines={1} className="text-[15px] font-bold text-[#1a1a1a]">
                    {s.name}
                  </Text>
                  <Text numberOfLines={2} className="mt-1 text-[12px] leading-4 text-[#777]">
                    {s.summary}
                  </Text>
                  {s.note ? (
                    <View className="mt-2 flex-row items-center">
                      <Ionicons name="star" size={12} color="#ffb400" />
                      <Text className="ml-1 text-[11px] text-[#ffb400]">{s.note}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
