import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface RankUser { id: string; username: string; points: number; }
interface LeaderboardData { list: RankUser[]; self: RankUser | null; }

const CHINESE_NUMS = ['四', '五', '六', '七', '八', '九', '十'];
const PODIUM_TITLES = ['状元', '榜眼', '探花'];
const PODIUM_SIZES = {
  center: { height: 172, avatarSize: 64, flex: 1.2, maxWidth: 140 },
  left:   { height: 148, avatarSize: 48, flex: 1,   maxWidth: 110 },
  right:  { height: 130, avatarSize: 48, flex: 1,   maxWidth: 110 },
};

function PodiumCard({
  user,
  pos,
}: {
  user: RankUser | null;
  pos: 'left' | 'center' | 'right';
}) {
  const sz = PODIUM_SIZES[pos];
  const title = PODIUM_TITLES[pos === 'center' ? 0 : pos === 'left' ? 1 : 2];
  const isChampion = pos === 'center';
  const ringWidth = isChampion ? 3 : 2;

  if (!user) {
    return <View style={{ flex: sz.flex }} />;
  }

  return (
    <View style={{ flex: sz.flex }} className="flex-col items-center justify-end">
      <View
        className="relative items-center overflow-hidden rounded-xl"
        style={{
          height: sz.height,
          width: '100%',
          maxWidth: sz.maxWidth,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderWidth: 1,
          borderColor: 'rgba(212,167,106,0.3)',
        }}
      >
        {/* Top accent bar: red -> gold -> green */}
        <LinearGradient
          colors={['#8B2E2E', '#D4A76A', '#5B8C5A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 }}
        />

        {/* Rank title pill */}
        <View
          className="absolute top-2 z-10 rounded px-2 py-0.5"
          style={{ backgroundColor: 'rgba(139,46,46,0.9)' }}
        >
          <Text className="text-xs font-bold text-white">{title}</Text>
        </View>

        {/* Avatar circle */}
        <View
          className="mt-8 items-center justify-center rounded-full bg-[#F8F4E9]"
          style={{
            width: sz.avatarSize + ringWidth * 2,
            height: sz.avatarSize + ringWidth * 2,
            borderWidth: ringWidth,
            borderColor: '#D4A76A',
          }}
        >
          <Ionicons name="person-circle" size={sz.avatarSize} color="#8B2E2E" />
        </View>

        {/* Name */}
        <Text
          numberOfLines={1}
          className="mt-2 font-bold text-[#3A3226]"
          style={{ fontSize: isChampion ? 16 : 13 }}
        >
          {user.username}
        </Text>

        {/* Points */}
        <Text
          className="text-[#D4A76A]"
          style={{
            fontSize: isChampion ? 13 : 11,
            marginBottom: isChampion ? 20 : 12,
          }}
        >
          {user.points} 分
        </Text>

        {/* Bottom gradient bar */}
        <LinearGradient
          colors={[
            'rgba(91,140,90,0.3)',
            'rgba(212,167,106,0.3)',
            'rgba(139,46,46,0.3)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 }}
        />
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      setData(
        await apiRequest<LeaderboardData>('/leaderboard', { auth: true }),
      );
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Build podium layout: left=2nd, center=1st, right=3rd
  const top3 = data?.list?.slice(0, 3) ?? [];
  let podium: (RankUser | null)[] = [];
  if (top3.length === 0) {
    podium = [null, null, null];
  } else if (top3.length === 1) {
    podium = [null, top3[0], null];
  } else if (top3.length === 2) {
    podium = [top3[1], top3[0], null];
  } else {
    podium = [top3[1] ?? null, top3[0] ?? null, top3[2] ?? null];
  }

  const ranks4to10 = data?.list?.slice(3, 10) ?? [];
  const loading = !data && !error;
  const empty = data && data.list.length === 0;

  // Find self rank position
  const selfRankIdx =
    data?.self
      ? data.list.findIndex((u) => u.id === data.self!.id)
      : -1;
  const selfRankDisplay =
    selfRankIdx >= 0 ? selfRankIdx + 1 : '未上榜';

  return (
    <View className="flex-1 bg-[#F8F4E9]">
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute left-4 z-10"
        style={{ top: insets.top + 8 }}
      >
        <Ionicons name="chevron-back" size={24} color="#8B2E2E" />
      </Pressable>

      {/* Main scrollable area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View
          className="items-center"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Text
            className="text-3xl font-bold text-[#8B2E2E]"
            style={{ fontFamily: 'serif' }}
          >
            锦绣山河榜
          </Text>
          <Text className="mt-1 text-sm text-[#D4A76A]">
            万里江山如画 行者无疆
          </Text>
        </View>

        <View className="mt-8 px-4">
          {/* Loading state */}
          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#8B2E2E" />
            </View>
          ) : error ? (
            /* Error state */
            <View className="items-center py-16">
              <Ionicons
                name="cloud-offline-outline"
                size={48}
                color="#D4A76A"
              />
              <Text className="mt-2 text-sm text-[#D4A76A]">
                加载失败，请稍后重试
              </Text>
            </View>
          ) : empty ? (
            /* Empty state */
            <View className="items-center py-16">
              <Ionicons name="trophy-outline" size={48} color="#D4A76A" />
              <Text className="mt-2 text-sm text-[#D4A76A]">
                暂无排行榜数据
              </Text>
            </View>
          ) : (
            <>
              {/* Top-3 podium */}
              <View
                className="flex-row items-end justify-center"
                style={{ gap: 6 }}
              >
                <PodiumCard user={podium[0]} pos="left" />
                <PodiumCard user={podium[1]} pos="center" />
                <PodiumCard user={podium[2]} pos="right" />
              </View>

              {/* Ranks 4-10 */}
              {ranks4to10.length > 0 && (
                <View
                  className="mt-6 overflow-hidden rounded-xl px-3 py-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    borderWidth: 1,
                    borderColor: 'rgba(212,167,106,0.3)',
                  }}
                >
                  {ranks4to10.map((u, i) => (
                    <View key={u.id}>
                      <View className="flex-row items-center px-2 py-3">
                        {/* Chinese number badge */}
                        <LinearGradient
                          colors={['#D4A76A', '#8B2E2E']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="items-center justify-center rounded-full"
                          style={{ width: 36, height: 36 }}
                        >
                          <Text className="text-sm font-bold text-white">
                            {CHINESE_NUMS[i]}
                          </Text>
                        </LinearGradient>

                        {/* Avatar placeholder */}
                        <View
                          className="ml-3 items-center justify-center rounded-full bg-[#F8F4E9]"
                          style={{
                            width: 40,
                            height: 40,
                            borderWidth: 1,
                            borderColor: 'rgba(212,167,106,0.2)',
                          }}
                        >
                          <Ionicons
                            name="person-circle"
                            size={32}
                            color="#8B2E2E"
                          />
                        </View>

                        {/* Name */}
                        <Text
                          numberOfLines={1}
                          className="ml-3 flex-1 text-sm font-medium text-[#33312E]"
                        >
                          {u.username}
                        </Text>

                        {/* Points pill */}
                        <View
                          className="rounded-full bg-[#F8F4E9] px-3 py-1"
                          style={{
                            borderWidth: 1,
                            borderColor: 'rgba(212,167,106,0.1)',
                          }}
                        >
                          <Text className="text-xs text-[#8B2E2E]">
                            {u.points} 分
                          </Text>
                        </View>
                      </View>

                      {/* Decorative divider: gradient line fading at edges */}
                      {i < ranks4to10.length - 1 && (
                        <LinearGradient
                          colors={[
                            'rgba(212,167,106,0)',
                            'rgba(212,167,106,0.5)',
                            'rgba(212,167,106,0)',
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            height: 1,
                            marginLeft: '10%',
                            marginRight: '10%',
                          }}
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Footer */}
          <View className="mt-8 mb-4 items-center">
            <Text className="text-xs text-[#D4A76A]/80">
              岁次乙巳年 锦绣山河榜
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom bar: self info */}
      {!loading && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t bg-white/90"
          style={{
            borderColor: 'rgba(212,167,106,0.2)',
            paddingBottom: Math.max(insets.bottom, 8),
          }}
        >
          {data?.self ? (
            <View className="flex-row items-center px-4 py-3">
              {/* Avatar */}
              <View
                className="items-center justify-center rounded-full bg-[#F8F4E9]"
                style={{
                  width: 44,
                  height: 44,
                  borderWidth: 1,
                  borderColor: 'rgba(212,167,106,0.2)',
                }}
              >
                <Ionicons
                  name="person-circle"
                  size={36}
                  color="#8B2E2E"
                />
              </View>

              {/* Name + rank */}
              <View className="ml-3 min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-[#3A3226]"
                >
                  {data.self.username}
                </Text>
                <Text className="text-xs text-[#D4A76A]">
                  我的排名：
                  <Text className="font-semibold text-[#8B2E2E]">
                    {selfRankDisplay}
                  </Text>
                </Text>
              </View>

              {/* Points */}
              <View
                className="rounded-full bg-[#F8F4E9] px-3 py-1"
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(212,167,106,0.1)',
                }}
              >
                <Text className="text-xs text-[#8B2E2E]">
                  当前积分：
                  <Text className="font-semibold">{data.self.points}</Text> 分
                </Text>
              </View>
            </View>
          ) : (
            <View className="px-4 py-3">
              <Text className="text-sm text-[#D4A76A]">
                未登录或获取信息失败，无法展示本地用户。
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
