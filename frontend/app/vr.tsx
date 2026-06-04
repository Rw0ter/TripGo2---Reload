import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

const SCENES = [
  { name: '广州塔 360°', icon: 'eye-outline' as const, color: '#E05C3A', city: '广州' },
  { name: '丹霞山全景', icon: 'image-outline' as const, color: '#5C8A6D', city: '广州' },
  { name: '开平碉楼', icon: 'home-outline' as const, color: '#8E6B3F', city: '东莞' },
  { name: '珠江夜景', icon: 'moon-outline' as const, color: '#3B7CB6', city: '广州' },
  { name: '粤剧艺术博物馆', icon: 'school-outline' as const, color: '#7B68AE', city: '广州' },
  { name: '潮州古城', icon: 'flag-outline' as const, color: '#C0392B', city: '深圳' },
];

export default function VRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedScene, setSelectedScene] = useState<
    (typeof SCENES)[number] | null
  >(null);

  // ── Scene selection grid ────────────────────────────────────────────
  if (!selectedScene) {
    return (
      <View className="flex-1 bg-[#1a1a2e]">
        {/* Header */}
        <View
          style={{ paddingTop: insets.top + 6 }}
          className="flex-row items-center px-4 pb-4"
        >
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text className="text-[18px] font-bold text-white">
            VR 全景漫游
          </Text>
        </View>

        {/* Tip banner */}
        <View className="mx-4 mb-4 rounded-xl border border-[#2dbf7c30] bg-[#2dbf7c12] p-3">
          <Text className="text-center text-[13px] text-[#2dbf7c]">
            选择场景进入沉浸式VR体验
          </Text>
        </View>

        {/* Scene cards grid */}
        <View className="flex-row flex-wrap px-4" style={{ gap: 12 }}>
          {SCENES.map((s) => (
            <Pressable
              key={s.name}
              onPress={() => setSelectedScene(s)}
              style={{
                width: '46%',
                aspectRatio: 1.3,
                backgroundColor: s.color + '22',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: s.color + '40',
              }}
              className="items-center justify-center active:opacity-80"
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: s.color + '60',
                }}
                className="items-center justify-center"
              >
                <Ionicons name={s.icon} size={26} color="#fff" />
              </View>
              <Text className="mt-3 text-[14px] font-bold text-white">
                {s.name}
              </Text>
              <Text className="mt-1 text-[11px] text-white/40">
                点击进入全景
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Footer note */}
        <View className="mx-4 mt-6 rounded-xl bg-white/5 p-4">
          <Text className="text-[13px] text-white/60">
            温馨提示：VR 全景功能需要稳定的网络连接。建议在 WiFi
            环境下使用以获得最佳体验。
          </Text>
        </View>
      </View>
    );
  }

  // ── VR WebView ──────────────────────────────────────────────────────
  const vrUrl = `${API_BASE}/static/legacy/VR%20Map.html?city=${encodeURIComponent(selectedScene.city)}`;

  return (
    <View className="flex-1 bg-black">
      <WebView
        source={{ uri: vrUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        originWhitelist={['*']}
        onMessage={(e: WebViewMessageEvent) => {
          if (e.nativeEvent.data === 'back') {
            setSelectedScene(null);
          }
        }}
      />

      {/* Scene title + close button overlay */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => setSelectedScene(null)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}
          className="items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
        <Text
          style={{
            color: '#fff',
            marginLeft: 10,
            fontSize: 15,
            fontWeight: '600',
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {selectedScene.name}
        </Text>
      </View>
    </View>
  );
}
