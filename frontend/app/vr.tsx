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
import { resolveLegacyImage } from '@/lib/legacy-images';

const VRViewer = Platform.OS === 'web'
  ? require('@/components/vr/vr-viewer.web').VRViewer
  : require('@/components/vr/vr-viewer').VRViewer;

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

interface VRScene {
  id: string; name: string; subtitle: string; city: string;
  weather: string; panoramaImage: string; coverKey: string;
}

// panoramaImage 为后端 /static/legacy/ 下的等距柱状(2:1) 360° 全景图，每个场景一张真实图。
const SCENES: VRScene[] = [
  { id: 'shennongjia', name: '神农架原始森林', subtitle: '华中绿肺 · 生物多样性宝库', city: '神农架', weather: '18°C', panoramaImage: 'vr-shennongjia.jpg', coverKey: 'vr/shennongjia' },
  { id: 'xixi',        name: '西溪湿地',       subtitle: '城市之肾 · 湿地生态保育',   city: '杭州',   weather: '26°C', panoramaImage: 'vr-xixi.jpg',        coverKey: 'vr/xixi' },
  { id: 'solar',       name: '光伏电站',       subtitle: '清洁能源 · 沙漠变绿洲',     city: '敦煌',   weather: '35°C', panoramaImage: 'vr-solar.jpg',       coverKey: 'vr/solar' },
  { id: 'zhangjiajie', name: '张家界国家森林公园', subtitle: '奇峰三千 · 苍翠欲滴',   city: '张家界', weather: '22°C', panoramaImage: 'vr-zhangjiajie.jpg', coverKey: 'vr/zhangjiajie' },
  { id: 'jiuzhaigou',  name: '九寨沟',         subtitle: '人间仙境 · 青山碧水',       city: '九寨沟', weather: '15°C', panoramaImage: 'vr-jiuzhaigou.jpg',  coverKey: 'vr/jiuzhaigou' },
  { id: 'windfarm',    name: '海上风电场',     subtitle: '绿色能源 · 零碳未来',       city: '阳江',   weather: '28°C', panoramaImage: 'vr-windfarm.jpg',    coverKey: 'vr/windfarm' },
];

const FEATURED = SCENES[0];


// ── 卡片 ────────────────────────────────────────────────
function SceneCard({ s, w, large, i, onPress }: {
  s: VRScene; w: number; large?: boolean; i: number; onPress: () => void;
}) {
  const cw = large ? w - 32 : (w - 32 - 12) / 2;
  const ch = large ? 220 : 180;

  return (
    <Animated.View entering={FadeInDown.delay(i * 80).springify()} style={{ width: cw, height: ch }}>
      <Pressable onPress={onPress} className="active:scale-[0.97]" style={{ flex: 1 }}>
        <Image source={resolveLegacyImage(s.coverKey)}
          style={{ width: cw, height: ch, borderRadius: 12, position: 'absolute' }}
          resizeMode="cover" />

        {/* 渐变遮罩 */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
          locations={[0.35, 1]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ch * 0.6, borderRadius: 12 }}
        />

        <View className="absolute right-2.5 top-2.5 rounded-md bg-black/40 px-2 py-0.5">
          <Text className="text-[10px] font-semibold text-white">360°</Text>
        </View>

        <View className="absolute bottom-0 left-0 right-0 p-3">
          <Text className="text-[15px] font-bold text-white">{s.name}</Text>
          <Text className="mt-0.5 text-[11px] text-white/70" numberOfLines={1}>{s.subtitle}</Text>
          <View className="mt-1.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.6)" />
              <Text className="text-[11px] text-white/60">{s.city}</Text>
            </View>
            <View className="flex-row items-center rounded-full bg-white/20 px-2 py-0.5">
              <Ionicons name="play" size={10} color="#fff" />
              <Text className="ml-1 text-[10px] font-semibold text-white">探索</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Hero ──────────────────────────────────────────────────
function Hero({ insets, onExplore }: { insets: number; onExplore: () => void }) {
  const { width } = useWindowDimensions();
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  const onPressIn = () => RNAnimated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => RNAnimated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  const H = 280 + insets;

  return (
    <View style={{ height: H }}>
      <Image source={resolveLegacyImage(FEATURED.coverKey)}
        style={{ position: 'absolute', top: 0, left: 0, width, height: H }}
        resizeMode="cover" />

      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', inset: 0 }}
      />

      <ScreenHeader title="全景漫游" subtitle="绿途 · 生态风光" tint="dark" />

      <View className="flex-1 justify-end px-5 pb-6">
        <Animated.View entering={FadeIn.delay(200).springify()}>
          <Text className="text-[30px] font-bold text-white">{FEATURED.name}</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(300).springify()}>
          <Text className="mt-1 text-[14px] text-white/80">{FEATURED.subtitle} · {FEATURED.city}</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(400).springify()}>
          <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable onPress={onExplore} onPressIn={onPressIn} onPressOut={onPressOut}
              className="mt-4 flex-row items-center self-start rounded-full bg-white/20 px-5 py-2.5"
              style={{ borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' }}>
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text className="ml-2 text-[14px] font-semibold text-white">进入全景体验</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 4 }} />
            </Pressable>
          </RNAnimated.View>
        </Animated.View>
      </View>
    </View>
  );
}

// ── 主屏 ──────────────────────────────────────────────────
export default function VRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<VRScene | null>(null);

  if (selected) {
    return (
      <View className="flex-1 bg-black">
        <VRViewer params={{ image: selected.panoramaImage, name: selected.name,
          city: selected.city, weather: selected.weather, apiBase: API_BASE }}
          onBack={() => setSelected(null)} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Hero insets={insets.top} onExplore={() => setSelected(FEATURED)} />

        <View className="px-4 pt-6" style={{ paddingBottom: 5 }}>
          <View className="mb-3.5 flex-row items-center">
            <Text className="text-[20px] font-extrabold text-white">探索场景</Text>
            <Text className="ml-2 text-[14px] font-medium text-white/60">共 {SCENES.length} 处</Text>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {SCENES.map((s, i) => (
              <SceneCard key={s.id} s={s} w={width} large={i === 0} i={i} onPress={() => setSelected(s)} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
