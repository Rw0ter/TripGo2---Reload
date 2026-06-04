import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface TripData { id: string; name: string; days: any; createdAt: string; }

export default function MyTripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [trips, setTrips] = useState<TripData[] | null>(null);

  const load = useCallback(async () => {
    try { setTrips(await apiRequest<TripData[]>('/trips/mine', { auth: true })); }
    catch { setTrips(null); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <View className="flex-1 bg-[#F8F5E6]">
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center bg-white px-4 pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[17px] font-bold text-[#333]">我的线路</Text>
        <Pressable onPress={() => router.push('/trip/create')} className="absolute right-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="add-circle" size={24} color="#12D29F" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {!trips ? (
          <View className="items-center py-20"><ActivityIndicator color="#12D29F" /></View>
        ) : trips.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="map-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">暂无行程</Text>
            <Pressable onPress={() => router.push('/trip/create')} className="mt-4 rounded-full bg-[#12D29F] px-6 py-2.5">
              <Text className="text-[14px] font-bold text-white">新建行程</Text>
            </Pressable>
          </View>
        ) : (
          trips.map((t) => (
            <Pressable key={t.id} className="mb-3 rounded-xl bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-[#333]">{t.name}</Text>
                  <Text className="mt-1 text-[12px] text-[#999]">{t.createdAt?.slice(0, 10)}</Text>
                </View>
                <View className="rounded-full bg-[#E8F5E9] px-3 py-1.5">
                  <Text className="text-[11px] font-medium text-[#12D29F]">查看详情</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
