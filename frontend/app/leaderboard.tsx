import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface RankUser { id: string; username: string; points: number; }
interface LeaderboardData { list: RankUser[]; self: RankUser | null; }

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);

  const load = useCallback(async () => {
    try { setData(await apiRequest<LeaderboardData>('/leaderboard', { auth: true })); }
    catch { setData(null); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <View className="flex-1 bg-[#f2f5ff]">
      {/* Header matching Legacy top_list.html */}
      <View style={{ paddingTop: insets.top + 8 }} className="bg-[#5b8bff] pb-6">
        <Pressable onPress={() => router.back()} className="absolute left-4 flex-row items-center" style={{ top: insets.top + 8 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-center text-[18px] font-bold text-white">积分排行榜</Text>
        <Text className="mt-1 text-center text-[13px] text-white/75">学非遗 · 攒积分 · 争上游</Text>
      </View>

      <ScrollView className="flex-1" style={{ marginTop: -12 }}>
        {/* Top 3 podium */}
        {data?.list.slice(0, 3) ? (
          <View className="mx-4 flex-row items-end justify-center rounded-2xl bg-white py-5 shadow-sm" style={{ gap: 8 }}>
            {[data.list[1], data.list[0], data.list[2]].map((u, i) => {
              if (!u) return <View key={i} className="flex-1" />;
              const pos = [1, 0, 2][i];
              const h = [90, 110, 80][i];
              return (
                <View key={u.id} className="flex-1 items-center">
                  <View style={{ width: h * 0.5, height: h, borderRadius: 12, backgroundColor: MEDAL_COLORS[pos] }} className="items-center justify-end pb-2">
                    <Text className="text-[22px] font-bold text-white">#{pos + 1}</Text>
                  </View>
                  <Text numberOfLines={1} className="mt-1.5 text-[13px] font-bold text-[#333]">{u.username}</Text>
                  <Text className="text-[11px] text-[#999]">{u.points} 分</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="mx-4 items-center rounded-2xl bg-white py-8">
            <ActivityIndicator color="#5b8bff" />
          </View>
        )}

        {/* Ranking list */}
        <View className="mx-4 mt-3 rounded-2xl bg-white pb-4 shadow-sm">
          <Text className="px-4 pt-4 text-[15px] font-bold text-[#41816c]">全部排名</Text>
          {!data ? (
            <View className="items-center py-8"><ActivityIndicator color="#5b8bff" /></View>
          ) : (
            data.list.map((u, i) => (
              <View key={u.id} className="mx-4 flex-row items-center border-b border-[#f1f1f1] py-3">
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i < 3 ? MEDAL_COLORS[i] : '#ced4da' }} className="items-center justify-center">
                  <Text className="text-[12px] font-bold text-white">{i + 1}</Text>
                </View>
                <Text className="ml-3 flex-1 text-[14px] font-semibold text-[#333]">{u.username}</Text>
                <Text className="text-[14px] font-bold text-[#5b8bff]">{u.points} 分</Text>
              </View>
            ))
          )}
        </View>

        {/* Self rank */}
        {data?.self ? (
          <View className="mx-4 mb-8 mt-3 rounded-2xl bg-[#5b8bff]/10 p-4">
            <Text className="text-[13px] font-bold text-[#5b8bff]">我的排名</Text>
            <View className="mt-1.5 flex-row items-center justify-between">
              <Text className="text-[16px] font-bold text-[#333]">{data.self.username}</Text>
              <Text className="text-[16px] font-bold text-[#5b8bff]">{data.self.points} 分</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
