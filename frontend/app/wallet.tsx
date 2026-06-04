import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface Txn { id: number; type: string; title: string; amount: string; createdAt: string; }

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [txns, setTxns] = useState<Txn[] | null>(null);

  const load = useCallback(async () => {
    try { setTxns(await apiRequest<Txn[]>('/transactions', { auth: true })); }
    catch { setTxns(null); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const balance = user?.balance ?? 200;
  const points = user?.points ?? 0;
  const coupons = user?.couponCount ?? 2;

  return (
    <View className="flex-1 bg-[#f2f5ff]">
      <View style={{ paddingTop: insets.top + 6 }} className="bg-[#5b8bff] pb-12">
        <Pressable onPress={() => router.back()} className="absolute left-4 flex-row items-center" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-center text-[18px] font-bold text-white">我的钱包</Text>
        <Text className="mt-5 text-center text-[40px] font-bold text-white">￥{balance.toFixed(2)}</Text>
        <View className="mx-8 mt-4 flex-row justify-between">
          {[{ label: '积分', v: String(points) }, { label: '优惠券', v: String(coupons) }, { label: '红包', v: '0' }].map((s, i) => (
            <View key={s.label} className={`flex-1 items-center ${i > 0 ? 'border-l border-white/30' : ''}`}>
              <Text className="text-[14px] text-white/80">{s.label}</Text>
              <Text className="mt-1 text-[18px] font-bold text-white">{s.v}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={{ marginTop: -16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} className="bg-white">
        <View className="px-4 pt-5 pb-8">
          <Text className="text-[15px] font-bold text-[#5b8bff]">交易流水</Text>
          {!txns ? (
            <View className="items-center py-8"><ActivityIndicator color="#5b8bff" /></View>
          ) : txns.length === 0 ? (
            <Text className="mt-4 text-center text-[13px] text-[#999]">暂无交易记录</Text>
          ) : (
            txns.map((t) => (
              <View key={t.id} className="flex-row items-center justify-between border-b border-[#f0f0f0] py-3.5">
                <View>
                  <Text className="text-[14px] font-semibold text-[#333]">{t.title}</Text>
                  <Text className="mt-0.5 text-[12px] text-[#999]">{t.createdAt?.slice(0, 10)}</Text>
                </View>
                <Text className={`text-[15px] font-bold ${t.type === 'in' ? 'text-[#30c77e]' : 'text-[#ff5252]'}`}>{t.amount}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
