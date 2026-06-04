import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface VRScene { id: number; title: string; subtitle: string; content: string; icon: string; color: string; }

export default function VRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [scenes, setScenes] = useState<VRScene[] | null>(null);

  const load = useCallback(async () => {
    try { setScenes(await apiRequest<VRScene[]>('/cultural?category=vr_scene')); }
    catch { setScenes(null); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center px-4 pb-4">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-[18px] font-bold text-white">VR 全景漫游</Text>
      </View>

      <Text className="mb-4 text-center text-[13px] text-white/50">沉浸式体验岭南风光</Text>

      {!scenes ? (
        <View className="items-center py-20"><ActivityIndicator color="#ffffff40" /></View>
      ) : (
        <View className="flex-row flex-wrap px-4" style={{ gap: 12 }}>
          {scenes.map((s) => (
            <Pressable key={s.id}
              style={{ width: '46%', aspectRatio: 1.3, backgroundColor: s.color + '30', borderRadius: 16, borderWidth: 1, borderColor: s.color + '40' }}
              className="items-center justify-center">
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: s.color + '60' }} className="items-center justify-center">
                <Ionicons name={s.icon as any} size={26} color="#fff" />
              </View>
              <Text className="mt-3 text-[14px] font-bold text-white">{s.title}</Text>
              <Text className="mt-1 text-[11px] text-white/40">{s.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View className="mx-4 mt-6 rounded-xl bg-white/5 p-4">
        <Text className="text-[13px] text-white/60">
          温馨提示：VR 全景功能需要稳定的网络连接。建议在 WiFi 环境下使用以获得最佳体验。
        </Text>
      </View>
    </View>
  );
}
