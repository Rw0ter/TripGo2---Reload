import { LinearGradient } from 'expo-linear-gradient';
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
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import type { Scenic } from '@/lib/api-types';
import { comingSoon } from '@/lib/coming-soon';
import { resolveLegacyImage } from '@/lib/legacy-images';

const addIcon = require('../../assets/legacy/img/add_xc.png');
const mapBg = require('../../assets/legacy/img/ditu2.png');
const mapIcon = require('../../assets/legacy/img/dw.png');

// 线路规划地图上的地点气泡。
const BUBBLES: {
  text: string;
  pos: Partial<Record<'left' | 'right' | 'top' | 'bottom', number>>;
}[] = [
  { text: '人民公园', pos: { left: 14, top: 16 } },
  { text: '东莞博物馆', pos: { left: 116, top: 30 } },
  { text: '环城绿道', pos: { right: 14, top: 18 } },
  { text: '东莞火车站', pos: { left: 26, bottom: 58 } },
  { text: '酒店', pos: { right: 20, bottom: 62 } },
];

// 城市精选 POI 卡（对应 Legacy .poi-card）。
function PoiCard({ item, width }: { item: Scenic; width: number }) {
  return (
    <Pressable
      onPress={() => comingSoon('景点详情')}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={{ width }}
      className="mr-3 overflow-hidden rounded-xl bg-white">
      <View>
        <Image
          source={resolveLegacyImage(item.image)}
          resizeMode="cover"
          style={{ width, height: 104 }}
        />
        <View className="absolute left-0 top-0 rounded-br-xl bg-black/65 px-2 py-1">
          <Text className="text-[11px] text-white">{item.tag}</Text>
        </View>
      </View>
      <View className="px-2.5 pb-3 pt-2">
        <Text className="mb-1.5 text-[11px] text-[#6E746F]">{item.note}</Text>
        <Text
          numberOfLines={2}
          className="text-[12px] leading-5 text-[#2A2A2A]">
          {item.summary}
        </Text>
      </View>
    </Pressable>
  );
}

// 行程首页（对应 Legacy itinerary.html）：智能行程入口 + 线路规划地图 +
// 旅游地图入口 + 城市精选 POI（走后端）。
export default function ItineraryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [poi, setPoi] = useState<Scenic[] | null>(null);
  const [error, setError] = useState(false);

  const mapW = width - 48; // 卡片两侧留白：(mx-3.5 14 + p-2.5 10) × 2
  const poiW = Math.round(width * 0.4);

  const load = useCallback(async () => {
    setError(false);
    try {
      setPoi(await apiRequest<Scenic[]>('/scenic?section=poi'));
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View className="flex-1 bg-[#F8F5E6]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}>
        {/* 智能行程入口 */}
        <Animated.View
          entering={FadeInDown.duration(420)}
          style={{ paddingTop: insets.top + 10 }}
          className="flex-row items-center justify-between px-4 pb-1">
          <Text className="text-base font-bold text-[#6B4740]">暂无行程</Text>
          <Pressable
            onPress={() => comingSoon('智能行程')}
            accessibilityRole="button"
            accessibilityLabel="添加智能行程"
            style={{ width: Math.round(width * 0.6), boxShadow: '0px 0px 8px rgba(0,0,0,0.08)' }}
            className="h-10 flex-row items-center rounded-full bg-white px-3.5">
            <View className="h-5 w-5 items-center justify-center rounded-full bg-[#EDEFF0]">
              <Image source={addIcon} resizeMode="contain" style={{ width: 11, height: 11 }} />
            </View>
            <Text className="ml-2 text-[13px] text-[#9AA09A]">
              点击添加您的智能行程
            </Text>
          </Pressable>
        </Animated.View>

        {/* 线路规划 */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(420)}
          style={{ boxShadow: '0px 0px 8px rgba(0,0,0,0.08)' }}
          className="mx-3.5 mt-2.5 rounded-2xl border border-[#EEE7D4] bg-white p-2.5">
          <View className="flex-row items-center justify-between px-1 pb-2">
            <Text className="text-sm font-bold text-[#000000]">线路规划</Text>
            <Pressable onPress={() => comingSoon('我的线路')}>
              <Text className="text-[12px] text-[#9B9F9A]">我的线路 &gt;</Text>
            </Pressable>
          </View>
          <View style={{ height: 170 }} className="overflow-hidden rounded-xl">
            <Image
              source={mapBg}
              resizeMode="cover"
              style={{ width: mapW, height: 170 }}
            />
            {BUBBLES.map((b) => (
              <View
                key={b.text}
                style={{
                  position: 'absolute',
                  ...b.pos,
                  boxShadow: '0px 3px 10px rgba(0,0,0,0.08)',
                }}
                className="rounded-xl border border-[#ECF0EA] bg-white px-2.5 py-1.5">
                <Text className="text-[11px] text-[#6E746F]">{b.text}</Text>
              </View>
            ))}
            <View className="absolute bottom-3 left-0 right-0 items-center">
              <Pressable
                onPress={() => comingSoon('线路规划')}
                accessibilityRole="button"
                accessibilityLabel="开始规划线路"
                style={{ boxShadow: '0px 6px 14px rgba(30,190,121,0.35)' }}>
                <LinearGradient
                  colors={['#56DAB7', '#12D29F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 26,
                    paddingVertical: 8,
                    alignItems: 'center',
                  }}>
                  <Text className="text-[13px] font-bold text-white">
                    开始规划
                  </Text>
                  <Text className="mt-0.5 text-[10px] font-light text-white">
                    支持智能推荐线路
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* 旅游地图 */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(420)}
          style={{ boxShadow: '0px 0px 8px rgba(0,0,0,0.08)' }}
          className="mx-3.5 mt-2.5 rounded-2xl border border-[#EEE7D4] bg-white">
          <Pressable
            onPress={() => comingSoon('旅游地图')}
            accessibilityRole="button"
            accessibilityLabel="旅游地图"
            className="flex-row items-center justify-between rounded-2xl bg-white px-3 py-2.5">
            <View className="flex-row items-center">
              <Image source={mapIcon} resizeMode="contain" style={{ width: 24, height: 24 }} />
              <Text className="ml-2 text-sm font-bold text-[#6E746F]">
                旅游地图
              </Text>
            </View>
            <Text className="text-[12px] text-[#9B9F9A]">
              发现你的旅行灵感 &gt;
            </Text>
          </Pressable>
        </Animated.View>

        {/* 城市精选 */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(420)}
          className="mx-3.5 mt-2.5 overflow-hidden rounded-2xl">
          <LinearGradient
            colors={['#FFFFFF', '#F1FFF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 10 }}>
            <View className="flex-row items-center justify-between px-1 pb-1">
              <Text className="text-base font-extrabold text-[#2A2A2A]">
                东莞
              </Text>
              <Pressable
                onPress={() => comingSoon('城市攻略')}
                style={{ boxShadow: '0px 0px 4px #f5f5f5' }}
                className="rounded-xl border border-[#ECECEC] bg-white px-2.5 py-1">
                <Text className="text-[12px] text-[#000000]">攻略 &gt;</Text>
              </Pressable>
            </View>
            {error ? (
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                className="items-center py-8">
                <Text className="text-[12px] text-[#9AA09A]">
                  加载失败，点此重试
                </Text>
              </Pressable>
            ) : !poi ? (
              <View className="items-center py-10">
                <ActivityIndicator color="#12D29F" />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {poi.map((p) => (
                  <PoiCard key={p.id} item={p} width={poiW} />
                ))}
              </ScrollView>
            )}
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
