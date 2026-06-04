import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/lib/api';
import { toast } from '@/lib/toast';

interface TripDay {
  day?: number;
  items?: unknown[];
  destinations?: unknown[];
  [key: string]: unknown;
}

interface TripData {
  id: string;
  name: string;
  days: TripDay[];
  createdAt: string;
  updatedAt?: string;
}

function parseTripStats(days: TripDay[]) {
  let dayCount = 0;
  let destCount = 0;
  if (Array.isArray(days)) {
    dayCount = days.length;
    for (const d of days) {
      const items = d?.items ?? d?.destinations;
      if (Array.isArray(items)) destCount += items.length;
    }
  }
  return { dayCount, destCount };
}

export default function MyTripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [trips, setTrips] = useState<TripData[] | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError('');
    try {
      setTrips(await apiRequest<TripData[]>('/trips/mine', { auth: true }));
    } catch {
      setTrips(null);
      setError('加载失败，请下拉重试');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleDelete(id: string) {
    Alert.alert('删除行程', '确定要删除这条行程吗？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setDeleting((prev) => new Set(prev).add(id));
          try {
            await apiRequest(`/trips/${id}`, { method: 'DELETE', auth: true });
            void load();
          } catch {
            toast.error('删除失败，操作失败，请重试');
          } finally {
            setDeleting((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      {/* 绿色品牌头部，与 stories / likes 统一 */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="flex-row items-center justify-center bg-[#3E6B4F] px-4 pb-4"
      >
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4"
          style={{ top: insets.top + 6 }}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-[17px] font-bold text-white">我的线路</Text>
        <Pressable
          onPress={() => router.push('/trip/create')}
          className="absolute right-4"
          style={{ top: insets.top + 6 }}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {!trips && !error ? (
          <View className="items-center py-20">
            <ActivityIndicator color="#3E6B4F" />
          </View>
        ) : error ? (
          <View className="items-center py-20">
            <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
            <Text className="mt-3 text-[14px] text-[#999]">{error}</Text>
            <Pressable
              onPress={() => load()}
              className="mt-4 rounded-full bg-[#3E6B4F] px-6 py-2.5"
            >
              <Text className="text-[14px] font-bold text-white">重试</Text>
            </Pressable>
          </View>
        ) : trips!.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="map-outline" size={48} color="#ccc" />
            <Text className="mt-3 text-[14px] text-[#999]">暂无行程</Text>
            <Pressable
              onPress={() => router.push('/trip/create')}
              className="mt-4 rounded-full bg-[#3E6B4F] px-6 py-2.5"
            >
              <Text className="text-[14px] font-bold text-white">新建行程</Text>
            </Pressable>
          </View>
        ) : (
          trips!.map((t) => {
            const { dayCount, destCount } = parseTripStats(t.days);
            const isDeleting = deleting.has(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() =>
                  router.push({ pathname: '/trip/create', params: { id: t.id } })
                }
                disabled={isDeleting}
                style={{ opacity: isDeleting ? 0.5 : 1 }}
                className="mb-3 rounded-xl bg-white p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-[#333]" numberOfLines={1}>
                      {t.name}
                    </Text>
                    <View className="mt-1.5 flex-row items-center">
                      {dayCount > 0 ? (
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={13} color="#999" />
                          <Text className="ml-1 text-[12px] text-[#999]">
                            {dayCount} 天
                          </Text>
                        </View>
                      ) : null}
                      {destCount > 0 ? (
                        <View className="ml-3 flex-row items-center">
                          <Ionicons name="location-outline" size={13} color="#999" />
                          <Text className="ml-1 text-[12px] text-[#999]">
                            {destCount} 个目的地
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="mt-1 text-[12px] text-[#bbb]">
                      {(t.updatedAt ?? t.createdAt).slice(0, 10)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Pressable
                      onPress={() => handleDelete(t.id)}
                      disabled={isDeleting}
                      hitSlop={8}
                      style={{ marginRight: 10 }}
                    >
                      <Ionicons
                        name={isDeleting ? 'hourglass-outline' : 'trash-outline'}
                        size={20}
                        color="#C0584B"
                      />
                    </Pressable>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
