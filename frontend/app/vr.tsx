import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';
import { VRViewer } from '@/components/vr/vr-viewer';
import { resolveLegacyImage } from '@/lib/legacy-images';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

// ── 场景数据（真实本地封面图）─────────────────────────────
interface VRScene {
  id: string;
  name: string;
  subtitle: string;
  city: string;
  weather: string;
  panoramaImage: string;
  coverKey: string; // 本地 legacy 图片 key —— 真实场景缩略图
}

const SCENES: VRScene[] = [
  {
    id: 'gztower',
    name: '广州塔',
    subtitle: '600 米高空俯瞰珠江新城',
    city: '广州',
    weather: '32°C · 晴朗',
    panoramaImage: 'vr-1.jpg',
    coverKey: 'jd/gz.jpg',
  },
  {
    id: 'danxia',
    name: '丹霞山',
    subtitle: '世界自然遗产 · 赤壁丹崖',
    city: '韶关',
    weather: '28°C · 多云',
    panoramaImage: 'vr-1.jpg',
    coverKey: 'jd/dxs.png',
  },
  {
    id: 'kaiping',
    name: '开平碉楼',
    subtitle: '华侨故里 · 世界文化遗产',
    city: '开平',
    weather: '31°C · 晴',
    panoramaImage: 'vr-2.jpg',
    coverKey: 'changlong.png',
  },
  {
    id: 'zhujiang',
    name: '珠江夜游',
    subtitle: '华灯初上 · 一江两岸璀璨',
    city: '广州',
    weather: '29°C · 微风',
    panoramaImage: 'vr-1.jpg',
    coverKey: 'gz2.jpg',
  },
  {
    id: 'yueju',
    name: '粤剧艺术博物馆',
    subtitle: '岭南建筑瑰宝 · 非遗传承',
    city: '广州',
    weather: '30°C · 晴',
    panoramaImage: 'vr-2.jpg',
    coverKey: 'gz3.jpg',
  },
  {
    id: 'chaozhou',
    name: '潮州古城',
    subtitle: '千年牌坊街 · 工夫茶飘香',
    city: '潮州',
    weather: '29°C · 多云',
    panoramaImage: 'vr-3.jpg',
    coverKey: 'xc/xc_chaozhou.jpeg',
  },
];

const FEATURED = SCENES[0];

// ── 场景卡片（带真实封面图 + 渐变叠加层）──────────────────
function SceneCard({
  scene,
  width,
  isLarge,
  index,
  onPress,
}: {
  scene: VRScene;
  width: number;
  isLarge?: boolean;
  index: number;
  onPress: () => void;
}) {
  const cardW = isLarge ? width - 32 : (width - 32 - 12) / 2;
  const cardH = isLarge ? 220 : 180;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).springify()}
      style={{ width: cardW, height: cardH }}>
      <Pressable
        onPress={onPress}
        style={{ borderRadius: 16, overflow: 'hidden' }}
        className="active:scale-[0.97]">
        {/* 背景图 */}
        <Image
          source={resolveLegacyImage(scene.coverKey)}
          style={{ width: cardW, height: cardH, position: 'absolute' }}
          resizeMode="cover"
        />
        {/* 底部渐变遮罩 */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          locations={[0.45, 1]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: cardH * 0.7 }}
        />

        {/* 顶部 360° 标签 */}
        <View className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-0.5 backdrop-blur">
          <Text className="text-[10px] font-semibold text-white">360°</Text>
        </View>

        {/* 底部文字 */}
        <View className="absolute bottom-0 left-0 right-0 p-3.5">
          <Text
            className="text-[15px] font-bold text-white"
            style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>
            {scene.name}
          </Text>
          <Text className="mt-0.5 text-[11px] text-white/75" numberOfLines={1}>
            {scene.subtitle}
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.7)" />
              <Text className="text-[11px] text-white/70">{scene.city}</Text>
            </View>
            <View className="flex-row items-center rounded-full bg-white/20 px-2.5 py-1 backdrop-blur">
              <Ionicons name="play" size={10} color="#fff" />
              <Text className="ml-1 text-[11px] font-semibold text-white">探索</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── 页头 Hero ──────────────────────────────────────────────
function Hero({ insets, onExplore }: { insets: number; onExplore: () => void }) {
  const { width } = useWindowDimensions();
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  // 长按呼吸动画
  function onPressIn() {
    RNAnimated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }
  function onPressOut() {
    RNAnimated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <View style={{ height: 260 + insets }}>
      {/* 背景图 */}
      <Image
        source={resolveLegacyImage(FEATURED.coverKey)}
        style={{ position: 'absolute', top: 0, left: 0, width, height: 260 + insets }}
        resizeMode="cover"
      />
      {/* 暗色渐变叠加 */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* 导航栏 */}
      <ScreenHeader title="全景漫游" subtitle="广东 · 岭南风光" tint="dark" />

      {/* Hero 主体内容 */}
      <View className="flex-1 justify-end px-5 pb-6">
        <Animated.View entering={FadeIn.delay(200).springify()}>
          <Text className="text-[28px] font-bold text-white" style={{ letterSpacing: 0.5 }}>
            {FEATURED.name}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(300).springify()}>
          <Text className="mt-1 text-[14px] leading-5 text-white/75">
            {FEATURED.subtitle} · {FEATURED.city}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(400).springify()}>
          <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              onPress={onExplore}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              className="mt-3 flex-row items-center self-start rounded-full bg-white/20 px-5 py-2.5 backdrop-blur"
              style={{ borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' }}>
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text className="ml-2 text-[14px] font-semibold text-white">
                进入全景体验
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 4 }} />
            </Pressable>
          </RNAnimated.View>
        </Animated.View>
      </View>
    </View>
  );
}

// ── 主屏 ───────────────────────────────────────────────────
export default function VRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<VRScene | null>(null);

  // 全景体验模式
  if (selected) {
    return (
      <View className="flex-1 bg-black">
        <VRViewer
          params={{
            image: selected.panoramaImage,
            name: selected.name,
            city: selected.city,
            weather: selected.weather,
            apiBase: API_BASE,
          }}
          onBack={() => setSelected(null)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <Hero insets={insets.top} onExplore={() => setSelected(FEATURED)} />

        {/* 全场景列表 */}
        <View className="px-4 pt-6">
          <View className="mb-3.5 flex-row items-center">
            <Text className="text-[17px] font-bold text-[#111]">探索场景</Text>
            <Text className="ml-2 text-[13px] text-[#999]">共 {SCENES.length} 处</Text>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {SCENES.map((s, i) => (
              <SceneCard
                key={s.id}
                scene={s}
                width={width}
                isLarge={i === 0}
                index={i}
                onPress={() => setSelected(s)}
              />
            ))}
          </View>
        </View>

        {/* 底部说明 */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          className="mx-4 mt-6 rounded-2xl bg-[#F5F5F5] p-4">
          <View className="flex-row items-start" style={{ gap: 8 }}>
            <Ionicons name="information-circle-outline" size={15} color="#bbb" style={{ marginTop: 1 }} />
            <View>
              <Text className="text-[11px] leading-4 text-[#aaa]">
                点击任一场景进入 360° 全景体验。拖动屏幕旋转视角，双指缩放远近。
              </Text>
              <Text className="mt-1 text-[11px] text-[#ccc]">
                建议在 WiFi 下使用 · Powered by Three.js
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
