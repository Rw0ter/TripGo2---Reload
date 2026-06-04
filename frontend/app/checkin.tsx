import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface CheckinStatus { checkedIn: boolean; todayPoints: number; totalDays: number; }

export default function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try { setStatus(await apiRequest<CheckinStatus>('/checkin/status', { auth: true })); }
    catch { setStatus(null); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function doCheckin() {
    setLoading(true);
    try {
      const result = await apiRequest<{ points: number; totalDays: number }>('/checkin', { method: 'POST', auth: true });
      setStatus({ checkedIn: true, todayPoints: result.points, totalDays: result.totalDays });
    } catch { /* already checked in */ }
    finally { setLoading(false); }
  }

  return (
    <View className="flex-1 bg-[#FBF7E9]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top bar matching Legacy qd.html */}
        <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center border-b border-[#f0ead6] bg-[#FBF7E9] px-4 pb-3">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="chevron-back" size={22} color="#3c3a2b" />
          </Pressable>
          <Text className="text-[18px] font-bold text-[#3c3a2b]">福利中心</Text>
          <Text className="ml-2 text-[14px] text-[#b8b29a]">签到</Text>
        </View>

        {/* Points banner matching Legacy qd.html banner */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl">
          <View style={{ backgroundColor: '#FF6B19' }} className="flex-row items-center justify-between px-5 py-7">
            <View>
              <Text className="text-[13px] text-white/90">我的积分</Text>
              <View className="mt-1 flex-row items-baseline gap-2">
                <Text className="text-[40px] font-medium text-white">{status ? status.totalDays * 10 : 0}</Text>
                <Text className="text-[14px] text-white/90">分</Text>
              </View>
              <Text className="mt-1 text-[13px] text-white/80 underline">积分明细 &gt;</Text>
            </View>
            <View className="items-center">
              {!status ? (
                <ActivityIndicator color="#fff" />
              ) : status.checkedIn ? (
                <View className="items-center rounded-2xl bg-white/20 px-5 py-3">
                  <Ionicons name="checkmark-circle" size={28} color="#fff" />
                  <Text className="mt-1 text-[15px] font-bold text-white">已签到</Text>
                </View>
              ) : (
                <Pressable onPress={doCheckin} disabled={loading} className="items-center rounded-2xl bg-white px-6 py-3">
                  <Text className="text-[18px] font-bold text-[#FF6B19]">{loading ? '签到中...' : '签到'}</Text>
                  <Text className="mt-0.5 text-[12px] text-[#FF6B19]/70">+10 积分</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Calendar/checkin streak section */}
        <View className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-[16px] font-bold text-[#3c3a2b]">签到记录</Text>
          <View className="mt-3 flex-row items-center">
            <Ionicons name="calendar-outline" size={40} color="#FF6B19" />
            <View className="ml-3">
              <Text className="text-[15px] font-semibold text-[#333]">累计签到 {status?.totalDays ?? 0} 天</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">连续签到可获得额外积分奖励</Text>
            </View>
          </View>
          {/* Simple 7-day streak visualization */}
          <View className="mt-4 flex-row justify-between">
            {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => {
              const filled = status && ((status.totalDays % 7) > i);
              return (
                <View key={d} className="items-center">
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: filled ? '#FF6B19' : '#f0ead6' }} className="items-center justify-center">
                    <Text style={{ color: filled ? '#fff' : '#b8b29a' }} className="text-[13px] font-bold">{d}</Text>
                  </View>
                  <Text className="mt-1 text-[11px] text-[#b8b29a]">+{10 + i * 2}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Rewards section */}
        <View className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-[16px] font-bold text-[#3c3a2b]">积分好礼</Text>
          <View className="mt-3 flex-row gap-3">
            {[{ name: '文创优惠券', pts: 50 }, { name: '景点门票', pts: 100 }, { name: '非遗体验课', pts: 200 }].map((r) => (
              <View key={r.name} className="flex-1 items-center rounded-xl bg-[#FBF7E9] py-3">
                <Ionicons name="gift-outline" size={24} color="#FF6B19" />
                <Text className="mt-1.5 text-[12px] font-bold text-[#333]">{r.name}</Text>
                <Text className="mt-0.5 text-[11px] text-[#999]">{r.pts} 积分</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
