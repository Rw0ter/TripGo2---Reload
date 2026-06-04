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

export default function ScenicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<Scenic | null>(null);
  const [error, setError] = useState(false);
  const [fav, setFav] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text className="mt-3 text-[15px] text-[#999]">加载失败</Text>
        <Pressable onPress={() => void load()} className="mt-4 rounded-xl bg-[#5BE1B2] px-6 py-2.5">
          <Text className="text-[14px] font-bold text-white">重试</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#5BE1B2" />
      </View>
    );
  }

  const imgH = Math.round(width * 0.6);

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image hero — matching Legacy xq.html header */}
        <View style={{ height: imgH }}>
          <Image
            source={resolveLegacyImage(data.image)}
            style={{ width, height: imgH }}
            resizeMode="cover"
          />
          {/* Back + Favorite overlay buttons */}
          <View
            style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}
            className="flex-row justify-between px-4">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="返回"
              className="h-9 w-9 items-center justify-center rounded-full bg-black/30">
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setFav((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="收藏"
              className="h-9 w-9 items-center justify-center rounded-full bg-black/30">
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? '#ff5252' : '#fff'} />
            </Pressable>
          </View>
          {/* Image dots — show one active to match legacy pattern */}
          <View
            style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}
            className="flex-row justify-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: i === 0 ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </View>
        </View>

        {/* Content card — matching Legacy xq.html .content */}
        <View
          style={{ marginTop: -18, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          className="bg-white px-5 pb-16 pt-4">
          {/* Name + Price row */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-[22px] font-bold text-[#333]">{data.name}</Text>
              <View className="mt-1 flex-row items-center">
                <Text className="text-[13px] text-[#ff9800]">★★★★★</Text>
                <Text className="ml-1.5 text-[13px] text-[#999]">5.0 分</Text>
              </View>
              <View className="mt-1.5 flex-row items-center gap-2">
                <View className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5">
                  <Text className="text-[11px] font-medium text-[#41816c]">{data.tag}</Text>
                </View>
                <Text className="text-[12px] text-[#999]">{data.city}</Text>
              </View>
            </View>
          </View>

          {/* Summary note */}
          {data.note ? (
            <View className="mt-3 rounded-xl bg-[#F8F5E6] px-3.5 py-2.5">
              <View className="flex-row items-center">
                <Ionicons name="information-circle-outline" size={16} color="#C9A24B" />
                <Text className="ml-1.5 text-[13px] font-medium text-[#8C7640]">{data.note}</Text>
              </View>
            </View>
          ) : null}

          {/* Tabs */}
          <View className="mt-5 flex-row border-b border-[#eee]">
            {['景点介绍', '游玩攻略', '交通指南'].map((t, i) => (
              <Pressable
                key={t}
                onPress={() => setActiveTab(i)}
                className={`mr-6 pb-2.5 ${i === activeTab ? 'border-b-2 border-[#41816c]' : ''}`}>
                <Text className={`text-[14px] ${i === activeTab ? 'font-bold text-[#41816c]' : 'text-[#999]'}`}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab content */}
          <View className="mt-4">
            {activeTab === 0 ? (
              <Text className="text-[15px] leading-7 text-[#555]">
                {data.summary || `${data.name}位于广东省${data.city}，是岭南文化的代表性景点之一。这里融合了自然风光与人文历史，每年吸引大量游客前来观光体验。游客可以在此感受浓厚的岭南文化氛围，品味当地特色美食，体验非遗手工技艺，是来广东旅游不可错过的目的地。`}
              </Text>
            ) : activeTab === 1 ? (
              <View>
                <Text className="mb-2 text-[15px] font-semibold text-[#333]">推荐游玩路线</Text>
                <Text className="text-[15px] leading-7 text-[#555]">
                  建议游玩时长：半天至一天{'\n'}
                  最佳游览季节：春秋季{'\n'}
                  推荐上午抵达，先游览核心景区，中午品尝当地美食，下午参观周边文化场馆。建议提前预约门票，避开节假日高峰。
                </Text>
              </View>
            ) : (
              <View>
                <Text className="mb-2 text-[15px] font-semibold text-[#333]">交通信息</Text>
                <Text className="text-[15px] leading-7 text-[#555]">
                  地址：广东省{data.city}市{'\n'}
                  地铁：可乘坐地铁到达附近站点{'\n'}
                  公交：多条公交线路可达{'\n'}
                  自驾：导航搜索「{data.name}」即可
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom action bar — matching legacy */}
      <View
        style={{ paddingBottom: insets.bottom + 6 }}
        className="flex-row items-center border-t border-[#eee] bg-white px-5 pt-3">
        <Pressable
          onPress={() => setFav((v) => !v)}
          accessibilityRole="button"
          className="mr-4 items-center">
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? '#ff5252' : '#666'} />
          <Text className="mt-0.5 text-[11px] text-[#999]">收藏</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/orders')}
          accessibilityRole="button"
          className="flex-1 items-center rounded-full bg-[#40CEA7] py-3">
          <Text className="text-[15px] font-bold text-white">立即预订</Text>
        </Pressable>
      </View>
    </View>
  );
}
