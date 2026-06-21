import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { apiRequest } from '@/lib/api';

interface RankUser {
  rank: number;
  id: string;
  username: string;
  points: number;
  carbonCredits: number;
  score: number;
}

interface LeaderboardData {
  list: RankUser[];
  total: number;
  page: number;
  pageSize: number;
  self: RankUser | null;
}

// ── 绿色主题色 ──
const GD = '#1B4332';
const GM = '#2D6A4F';
const GL = '#40916C';
const GA = '#95D5B2';
const BG = '#F5FAF5';
const CARD = '#FFFFFF';

function PodiumCard({ user, rank, cw }: { user: RankUser | null; rank: 1 | 2 | 3; cw: number }) {
  const heights = { 1: 160, 2: 130, 3: 110 };
  const sizes = { 1: 58, 2: 44, 3: 40 };
  const medals = { 1: '#F59E0B', 2: '#94A3B8', 3: '#D97706' };
  const labels = { 1: '碳路先锋', 2: '减排能手', 3: '绿色卫士' };
  const h = heights[rank];
  const s = sizes[rank];

  if (!user) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }} />;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        className="rounded-2xl items-center overflow-hidden"
        style={{
          height: h,
          width: '100%',
          maxWidth: cw,
          backgroundColor: CARD,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      >
        {/* Rank badge */}
        <View
          className="rounded-full items-center justify-center mt-4"
          style={{ width: s, height: s, backgroundColor: medals[rank] + '18' }}
        >
          <Text style={{ fontSize: s * 0.45, fontWeight: '800', color: medals[rank] }}>{rank}</Text>
        </View>

        <Text numberOfLines={1} className="mt-2 text-sm font-semibold text-[#2D2D2D] px-2">
          {user.username}
        </Text>
        <Text className="text-[11px] text-[#6B7280] mt-0.5">{labels[rank]}</Text>
        <View className="flex-row items-center mt-1.5 space-x-2">
          <Text className="text-xs text-[#40916C] font-bold">{user.points} 分</Text>
          <Text className="text-[11px] text-[#95D5B2]">{user.carbonCredits} 碳</Text>
        </View>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1) => {
    try {
      setError(false);
      const res = await apiRequest<LeaderboardData>(`/leaderboard?page=${p}&pageSize=20`, { auth: true });
      setData(res);
      setPage(p);
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(1);
    }, [load]),
  );

  const loading = !data && !error;
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  // Build podium: 1st (center), 2nd (left), 3rd (right)
  const sorted = data?.list ?? [];
  const first = sorted.find((u) => u.rank === 1) ?? null;
  const second = sorted.find((u) => u.rank === 2) ?? null;
  const third = sorted.find((u) => u.rank === 3) ?? null;
  const rest = sorted.filter((u) => u.rank > 3);

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      {/* Header */}
      <Pressable
        onPress={() => router.back()}
        className="absolute left-4 z-10"
        style={{ top: insets.top + 8 }}
      >
        <Ionicons name="chevron-back" size={24} color={GM} />
      </Pressable>

      <View className="items-center" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-2xl font-bold tracking-tight" style={{ color: GD }}>
          绿色先锋榜
        </Text>
        <Text className="mt-1 text-xs" style={{ color: '#6B7280' }}>
          践行低碳生活 守护绿水青山
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color={GL} />
          </View>
        ) : error ? (
          <View className="items-center py-20">
            <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
            <Text className="mt-2 text-sm text-[#9CA3AF]">加载失败，请稍后重试</Text>
          </View>
        ) : sorted.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
            <Text className="mt-2 text-sm text-[#9CA3AF]">暂无排行榜数据</Text>
          </View>
        ) : (
          <>
            {/* Podium */}
            <View className="flex-row items-end justify-center mt-6 px-4" style={{ gap: 8 }}>
              <PodiumCard user={second} rank={2} cw={88} />
              <PodiumCard user={first} rank={1} cw={100} />
              <PodiumCard user={third} rank={3} cw={88} />
            </View>

            {/* Rank list */}
            <View className="mx-4 mt-6 rounded-2xl overflow-hidden" style={{ backgroundColor: CARD }}>
              {/* Table header */}
              <View
                className="flex-row items-center px-4 py-2.5"
                style={{ backgroundColor: GD + '08', borderBottomWidth: 1, borderColor: '#F3F4F6' }}
              >
                <Text className="text-xs font-medium text-[#9CA3AF] w-10 text-center">排名</Text>
                <Text className="text-xs font-medium text-[#9CA3AF] flex-1 ml-2">用户</Text>
                <Text className="text-xs font-medium text-[#9CA3AF] w-16 text-center">积分</Text>
                <Text className="text-xs font-medium text-[#9CA3AF] w-16 text-center">碳积分</Text>
              </View>

              {rest.map((u, i) => (
                <View
                  key={u.id}
                  className={`flex-row items-center px-4 py-3 ${i % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'}`}
                  style={i < rest.length - 1 ? { borderBottomWidth: 1, borderColor: '#F3F4F6' } : undefined}
                >
                  <Text className="w-10 text-center text-sm font-semibold" style={{ color: u.rank <= 10 ? GM : '#9CA3AF' }}>
                    {u.rank}
                  </Text>
                  <View className="flex-row items-center flex-1 ml-2">
                    <View
                      className="rounded-full items-center justify-center"
                      style={{ width: 32, height: 32, backgroundColor: GA + '30' }}
                    >
                      <Ionicons name="person" size={16} color={GM} />
                    </View>
                    <Text numberOfLines={1} className="ml-2 text-sm text-[#2D2D2D]">
                      {u.username}
                    </Text>
                  </View>
                  <Text className="w-16 text-center text-sm font-medium text-[#40916C]">{u.points}</Text>
                  <Text className="w-16 text-center text-sm font-medium text-[#95D5B2]">{u.carbonCredits}</Text>
                </View>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <View className="flex-row items-center justify-center py-3 space-x-2" style={{ borderTopWidth: 1, borderColor: '#F3F4F6' }}>
                  <Pressable
                    onPress={() => page > 1 && load(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg"
                    style={{ opacity: page <= 1 ? 0.3 : 1 }}
                  >
                    <Ionicons name="chevron-back" size={16} color={GM} />
                  </Pressable>
                  <Text className="text-xs text-[#6B7280]">
                    {page} / {totalPages}
                  </Text>
                  <Pressable
                    onPress={() => page < totalPages && load(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg"
                    style={{ opacity: page >= totalPages ? 0.3 : 1 }}
                  >
                    <Ionicons name="chevron-forward" size={16} color={GM} />
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom self bar */}
      {data?.self && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t bg-white/95"
          style={{
            borderColor: '#F3F4F6',
            paddingBottom: Math.max(insets.bottom, 8),
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: -2 },
            elevation: 4,
          }}
        >
          <View className="flex-row items-center px-4 py-3">
            <View
              className="rounded-full items-center justify-center"
              style={{ width: 42, height: 42, backgroundColor: GA + '30' }}
            >
              <Ionicons name="person-circle" size={34} color={GM} />
            </View>
            <View className="ml-3 flex-1">
              <Text numberOfLines={1} className="text-sm font-medium text-[#2D2D2D]">
                {data.self.username}
              </Text>
              <View className="flex-row items-center space-x-3 mt-0.5">
                <Text className="text-xs text-[#40916C]">排名 {data.self.rank}</Text>
                <Text className="text-xs text-[#6B7280]">{data.self.points} 积分</Text>
                <Text className="text-xs text-[#95D5B2]">{data.self.carbonCredits} 碳积分</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
