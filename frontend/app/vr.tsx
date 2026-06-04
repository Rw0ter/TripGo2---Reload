import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { VRViewer } from '@/components/vr/vr-viewer';

// ── Backend base URL ─────────────────────────────────────
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

// ── Scene data ──────────────────────────────────────────
interface VRScene {
  id: string;
  name: string;
  subtitle: string;
  city: string;
  weather: string;
  panoramaImage: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tags: string[];
}

const SCENES: VRScene[] = [
  {
    id: 'gztower',
    name: '广州塔 360°',
    subtitle: '城市地标 · 云端视角',
    city: '广州市',
    weather: '32°C · 晴朗',
    panoramaImage: 'vr-1.jpg',
    color: '#E05C3A',
    icon: 'business-outline',
    tags: ['城市地标', '360°观景'],
  },
  {
    id: 'danxia',
    name: '丹霞山全景',
    subtitle: '世界遗产 · 丹霞地貌',
    city: '韶关市',
    weather: '28°C · 多云',
    panoramaImage: 'vr-1.jpg',
    color: '#D4522A',
    icon: 'image-outline',
    tags: ['世界遗产', '自然奇观'],
  },
  {
    id: 'kaiping',
    name: '开平碉楼',
    subtitle: '华侨文化 · 世遗古建',
    city: '开平市',
    weather: '31°C · 晴',
    panoramaImage: 'vr-2.jpg',
    color: '#8E6B3F',
    icon: 'home-outline',
    tags: ['世界遗产', '华侨文化'],
  },
  {
    id: 'zhujiang',
    name: '珠江夜景',
    subtitle: '璀璨灯火 · 浪漫夜色',
    city: '广州市',
    weather: '29°C · 微风',
    panoramaImage: 'vr-1.jpg',
    color: '#3B7CB6',
    icon: 'moon-outline',
    tags: ['城市夜景', '浪漫之旅'],
  },
  {
    id: 'yueju',
    name: '粤剧艺术博物馆',
    subtitle: '非遗传承 · 岭南雅韵',
    city: '广州市',
    weather: '30°C · 晴',
    panoramaImage: 'vr-2.jpg',
    color: '#7B68AE',
    icon: 'musical-notes-outline',
    tags: ['非遗文化', '岭南艺术'],
  },
  {
    id: 'chaozhou',
    name: '潮州古城',
    subtitle: '千年历史 · 工夫茶道',
    city: '潮州市',
    weather: '29°C · 多云',
    panoramaImage: 'vr-3.jpg',
    color: '#C0392B',
    icon: 'flag-outline',
    tags: ['千年古城', '工夫茶'],
  },
];

const FEATURED_IDX = 0;

// ── Scene card ──────────────────────────────────────────
function SceneCard({
  scene,
  width,
  isFeatured,
  onPress,
  index,
}: {
  scene: VRScene;
  width: number;
  isFeatured?: boolean;
  onPress: () => void;
  index: number;
}) {
  const cardW = isFeatured ? width - 32 : (width - 32 - 14) / 2;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={{ width: cardW }}>
      <Pressable
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        }}
        className="active:scale-[0.97]">
        {/* Top color strip */}
        <View
          style={{
            height: isFeatured ? 6 : 4,
            backgroundColor: scene.color,
          }}
        />

        {isFeatured ? (
          /* Featured: horizontal layout */
          <View className="flex-row p-4">
            <View className="flex-1 justify-between">
              {/* Tags */}
              <View className="flex-row" style={{ gap: 6 }}>
                {scene.tags.map((t) => (
                  <View
                    key={t}
                    className="rounded-full px-2.5 py-0.5"
                    style={{ backgroundColor: scene.color + '12' }}>
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: scene.color }}>
                      {t}
                    </Text>
                  </View>
                ))}
              </View>
              {/* Name + subtitle */}
              <View>
                <Text className="text-[18px] font-bold text-[#1a1a1a]">
                  {scene.name}
                </Text>
                <Text className="mt-0.5 text-[13px] text-[#888]">
                  {scene.subtitle}
                </Text>
              </View>
              {/* CTA */}
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: scene.color + '20',
                  }}
                  className="items-center justify-center">
                  <Ionicons name={scene.icon} size={20} color={scene.color} />
                </View>
                <View
                  className="flex-row items-center rounded-full px-3.5 py-1.5"
                  style={{ backgroundColor: '#386641' }}>
                  <Ionicons name="play-circle" size={14} color="#fff" />
                  <Text className="ml-1.5 text-[13px] font-semibold text-white">
                    立即探索
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* Grid card */
          <View className="p-3.5">
            {/* Icon */}
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: scene.color + '15',
              }}
              className="items-center justify-center">
              <Ionicons name={scene.icon} size={22} color={scene.color} />
            </View>
            {/* Title */}
            <Text className="mt-3 text-[15px] font-bold text-[#222]">
              {scene.name}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-[12px] text-[#999]">
              {scene.subtitle}
            </Text>
            {/* Bottom row */}
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-[11px] text-[#bbb]">{scene.city}</Text>
              <Ionicons name="arrow-forward-circle" size={18} color="#386641" />
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Main ────────────────────────────────────────────────
export default function VRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedScene, setSelectedScene] = useState<VRScene | null>(null);

  // ── VR Viewer mode ────────────────────────────────────
  if (selectedScene) {
    return (
      <View className="flex-1 bg-black">
        <VRViewer
          params={{
            image: selectedScene.panoramaImage,
            name: selectedScene.name,
            city: selectedScene.city,
            weather: selectedScene.weather,
            apiBase: API_BASE,
          }}
          onBack={() => setSelectedScene(null)}
        />
      </View>
    );
  }

  // ── Scene selection ───────────────────────────────────
  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 6 }}
          className="flex-row items-center bg-[#3E6B4F] px-4 pb-5">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-[19px] font-bold text-white">
              VR 全景漫游
            </Text>
            <Text className="mt-0.5 text-[12px] text-white/65">
              沉浸式探索岭南文化瑰宝
            </Text>
          </View>
        </View>

        {/* Stats pill row */}
        <View
          style={{ marginTop: -14 }}
          className="mx-5 flex-row justify-center rounded-2xl bg-white py-3.5 shadow-sm"
          pointerEvents="none">
          {[
            { v: '6', l: '全景场景', icon: 'map-outline' as const },
            { v: '360°', l: '沉浸视角', icon: 'globe-outline' as const },
            { v: '4K', l: '高清画质', icon: 'aperture-outline' as const },
          ].map((s) => (
            <View key={s.l} className="flex-1 items-center">
              <Ionicons name={s.icon} size={14} color="#386641" />
              <Text className="mt-1 text-[17px] font-bold text-[#386641]">
                {s.v}
              </Text>
              <Text className="mt-0.5 text-[11px] text-[#999]">{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Featured scene */}
        <View className="mt-5 px-4">
          <View className="mb-2.5 flex-row items-center" style={{ gap: 8 }}>
            <View
              style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                backgroundColor: '#f59e0b',
              }}
            />
            <Text className="text-[15px] font-bold text-[#2D3748]">
              精选推荐
            </Text>
          </View>
          <SceneCard
            scene={SCENES[FEATURED_IDX]}
            width={width}
            isFeatured
            onPress={() => setSelectedScene(SCENES[FEATURED_IDX])}
            index={0}
          />
        </View>

        {/* All scenes grid */}
        <View className="mt-5 px-4 pb-8">
          <View className="mb-2.5 flex-row items-center" style={{ gap: 8 }}>
            <View
              style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                backgroundColor: '#386641',
              }}
            />
            <Text className="text-[15px] font-bold text-[#2D3748]">
              全部场景
            </Text>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 14 }}>
            {SCENES.map((s, i) =>
              i !== FEATURED_IDX ? (
                <SceneCard
                  key={s.id}
                  scene={s}
                  width={width}
                  onPress={() => setSelectedScene(s)}
                  index={i}
                />
              ) : null,
            )}
          </View>
        </View>

        {/* Footer note */}
        <View className="mx-4 mb-10 items-center rounded-xl bg-[#E8E2CB]/50 p-4">
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="information-circle-outline" size={14} color="#999" />
            <Text className="text-[12px] text-[#999]">
              建议在 WiFi 环境下使用以获得最佳体验
            </Text>
          </View>
          <Text className="mt-1 text-[11px] text-[#bbb]">
            Powered by Three.js · 拖动查看 360° 全景
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
