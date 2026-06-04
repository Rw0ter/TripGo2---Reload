import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { resolveLegacyImage } from '@/lib/legacy-images';

// ── API base ──────────────────────────────────────────────
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

// ── Scene data ────────────────────────────────────────────
interface VRScene {
  id: string;
  name: string;
  subtitle: string;
  city: string;
  weather: string;
  panoramaImage: string;
  thumb: string;
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
    thumb: 'gz.jpg',
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
    thumb: 'jd/dxs.png',
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
    thumb: 'changlong.png',
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
    thumb: 'gz2.jpg',
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
    thumb: 'gz3.jpg',
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
    thumb: 'gz4.jpg',
    color: '#C0392B',
    icon: 'flag-outline',
    tags: ['千年古城', '工夫茶'],
  },
];

const FEATURED_IDX = 0; // featured scene index

// ── VR Viewer (wraps WebView/iframe) ──────────────────────
function VRViewer({
  scene,
  onBack,
  onSwitchScene,
}: {
  scene: VRScene;
  onBack: () => void;
  onSwitchScene: (s: VRScene) => void;
}) {
  const webViewRef = useRef<WebView>(null);

  const url = `${API_BASE}/static/legacy/panorama.html?image=${scene.panoramaImage}&name=${encodeURIComponent(scene.name)}&city=${encodeURIComponent(scene.city)}&weather=${encodeURIComponent(scene.weather)}`;

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d.type === 'back') onBack();
    } catch { /* ignore */ }
  }

  // Inject scene switch command
  function switchTo(s: VRScene) {
    const cmd = JSON.stringify({
      _src: 'vr-cmd',
      type: 'switchScene',
      image: s.panoramaImage,
      name: s.name,
      city: s.city,
      weather: s.weather,
    });
    if (Platform.OS === 'web') {
      // Use postMessage for iframe
      webViewRef.current?.injectJavaScript?.(
        `window.postMessage('${cmd.replace(/'/g, "\\'")}', '*');`
      );
    } else {
      webViewRef.current?.injectJavaScript?.(`window.__vrCmd('${cmd.replace(/'/g, "\\'")}');`);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        originWhitelist={['*']}
        onMessage={handleMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
      />

      {/* Top overlay: close + scene name */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140 }}
        pointerEvents="none">
        <View
          className="flex-row items-center justify-between px-3 pt-4"
          pointerEvents="auto"
          style={{ paddingTop: 50 }}>
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/25"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <Text
            className="text-[16px] font-semibold text-white"
            style={{ textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }}>
            {scene.name}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Bottom: quick scene switcher */}
      <View
        className="absolute bottom-0 left-0 right-0 px-2 pb-6"
        pointerEvents="box-none">
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 }}
          pointerEvents="none"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}
          style={{ marginBottom: 16 }}
          pointerEvents="auto">
          {SCENES.map((s) => {
            const isActive = s.id === scene.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  if (!isActive) {
                    onSwitchScene(s);
                    switchTo(s);
                  }
                }}
                className={`items-center rounded-2xl px-4 py-2.5 ${
                  isActive ? 'bg-white/20' : 'bg-black/30'
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: isActive ? s.color + '80' : 'rgba(255,255,255,0.1)',
                }}>
                <Text className={`text-[12px] font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {s.name}
                </Text>
                <Text className="mt-0.5 text-[10px] text-white/40">{s.city}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Scene info */}
        <View className="flex-row items-center justify-center gap-6 px-4" pointerEvents="auto">
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <Ionicons name="location-outline" size={12} color="#2dd4bf" />
            <Text className="text-[11px] text-white/70">{scene.city}</Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <Ionicons name="sunny-outline" size={12} color="#fbbf24" />
            <Text className="text-[11px] text-white/70">{scene.weather}</Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#2dd4bf' }} />
            <Text className="text-[11px] text-white/70">360° 全景</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Scene selection screen ────────────────────────────────
function SceneCard({
  scene,
  width,
  isFeatured,
  onPress,
}: {
  scene: VRScene;
  width: number;
  isFeatured?: boolean;
  onPress: () => void;
}) {
  const h = isFeatured ? 180 : 160;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: isFeatured ? width - 32 : (width - 32 - 12) / 2,
        height: h,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: scene.color + '18',
        borderWidth: 1,
        borderColor: scene.color + '30',
      }}
      className="active:scale-[0.97]">
      {/* Background gradient blob */}
      <View
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: scene.color + '15',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: scene.color + '10',
        }}
      />

      {isFeatured ? (
        /* Featured layout: horizontal with image */
        <View className="flex-1 flex-row">
          <View className="flex-1 justify-between p-4">
            <View className="flex-row items-center" style={{ gap: 4 }}>
              {scene.tags.map((t) => (
                <View
                  key={t}
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: scene.color + '25' }}>
                  <Text className="text-[10px] font-medium" style={{ color: scene.color }}>
                    {t}
                  </Text>
                </View>
              ))}
            </View>
            <View>
              <Text className="text-[20px] font-bold text-white">{scene.name}</Text>
              <Text className="mt-1 text-[12px] text-white/50">{scene.subtitle}</Text>
            </View>
            <View
              className="mt-2 flex-row items-center self-start rounded-full px-3 py-1.5"
              style={{ backgroundColor: scene.color + '30' }}>
              <Ionicons name="play-circle" size={14} color="#fff" />
              <Text className="ml-1.5 text-[12px] font-semibold text-white">
                立即探索
              </Text>
            </View>
          </View>
          <View className="items-center justify-center pr-4">
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: scene.color + '40',
              }}
              className="items-center justify-center">
              <Ionicons name={scene.icon} size={28} color="#fff" />
            </View>
          </View>
        </View>
      ) : (
        /* Grid card */
        <View className="flex-1 justify-between p-3.5">
          <View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: scene.color + '35',
              }}
              className="items-center justify-center">
              <Ionicons name={scene.icon} size={22} color="#fff" />
            </View>
            <Text className="mt-3 text-[15px] font-bold text-white">{scene.name}</Text>
            <Text numberOfLines={1} className="mt-0.5 text-[11px] text-white/45">
              {scene.subtitle}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] text-white/35">{scene.city}</Text>
            <Ionicons name="arrow-forward-circle" size={18} color={scene.color + '80'} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ── Main VR screen ────────────────────────────────────────
export default function VRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedScene, setSelectedScene] = useState<VRScene | null>(null);

  // Show VR viewer when a scene is selected
  if (selectedScene) {
    return (
      <VRViewer
        scene={selectedScene}
        onBack={() => setSelectedScene(null)}
        onSwitchScene={(s) => setSelectedScene(s)}
      />
    );
  }

  // ── Scene selection screen ──────────────────────────────
  return (
    <View className="flex-1 bg-[#0b0b14]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <LinearGradient
          colors={['#1a1040', '#0d1b2a', '#0b0b14']}
          locations={[0, 0.5, 1]}
          style={{ paddingTop: insets.top + 10 }}
          className="pb-2">
          {/* Top bar */}
          <View className="flex-row items-center px-3">
            <Pressable
              onPress={() => router.back()}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/8"
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Ionicons name="chevron-back" size={19} color="#fff" />
            </Pressable>
            <View className="ml-3 flex-1">
              <Text className="text-[20px] font-bold text-white">VR 全景漫游</Text>
              <Text className="mt-0.5 text-[12px] text-white/40">
                沉浸式探索岭南文化瑰宝
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View className="mt-5 flex-row justify-center" style={{ gap: 24 }}>
            {[
              { v: '6', l: '全景场景' },
              { v: '360°', l: '沉浸视角' },
              { v: '4K', l: '高清画质' },
            ].map((s) => (
              <View key={s.l} className="items-center">
                <Text className="text-[20px] font-bold text-[#2dd4bf]">{s.v}</Text>
                <Text className="mt-0.5 text-[10px] text-white/35">{s.l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Featured scene */}
        <View className="mt-4 px-4">
          <View className="mb-2 flex-row items-center" style={{ gap: 6 }}>
            <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: '#f59e0b' }} />
            <Text className="text-[13px] font-bold text-amber-400">精选推荐</Text>
          </View>
          <SceneCard
            scene={SCENES[FEATURED_IDX]}
            width={width}
            isFeatured
            onPress={() => setSelectedScene(SCENES[FEATURED_IDX])}
          />
        </View>

        {/* All scenes grid */}
        <View className="mt-5 px-4">
          <View className="mb-2 flex-row items-center" style={{ gap: 6 }}>
            <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: '#2dd4bf' }} />
            <Text className="text-[13px] font-bold text-white">全部场景</Text>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {SCENES.map((s, i) =>
              i !== FEATURED_IDX ? (
                <SceneCard
                  key={s.id}
                  scene={s}
                  width={width}
                  onPress={() => setSelectedScene(s)}
                />
              ) : null,
            )}
          </View>
        </View>

        {/* Powered by */}
        <View className="my-8 items-center">
          <View
            className="flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
            <Ionicons name="cube-outline" size={13} color="rgba(255,255,255,0.3)" />
            <Text className="ml-1.5 text-[11px] text-white/30">
              Powered by Three.js · 拖动查看 360° 全景
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
