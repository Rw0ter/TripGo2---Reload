import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

interface Order { id: number; title: string; img: string | null; price: number; finalPrice: number; status: string; createdAt: string; }

const TABS = ['全部', '待付款', '待发货', '待收货', '已完成'];
const STATUS_MAP = ['', '待支付', '待发货', '待收货', '已完成'];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    try {
      const st = STATUS_MAP[tab];
      setOrders(await apiRequest<Order[]>(`/orders${st ? `?status=${encodeURIComponent(st)}` : ''}`, { auth: true }));
    } catch { setOrders(null); }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  return (
    <View className="flex-1 bg-[#f7f7f7]">
      {/* Header matching Legacy dingdan.html */}
      <View className="bg-white">
        <View style={{ paddingTop: insets.top + 4 }} className="flex-row items-center justify-center px-4 pb-2">
          <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 4 }}>
            <Ionicons name="chevron-back" size={22} color="#333" />
          </Pressable>
          <Text className="text-[17px] font-bold text-[#333]">我的订单</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
          {TABS.map((t, i) => (
            <Pressable key={t} onPress={() => setTab(i)} className={`px-3 py-2.5 ${i === tab ? 'border-b-2 border-[#17b86c]' : ''}`}>
              <Text className={`text-[13px] ${i === tab ? 'font-semibold text-[#17b86c]' : 'text-[#333]'}`}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        {!orders ? (
          <View className="items-center py-20"><ActivityIndicator color="#17b86c" /></View>
        ) : orders.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="receipt-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">暂无订单</Text>
          </View>
        ) : (
          orders.map((o) => (
            <Pressable key={o.id} className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
              <View className="flex-row items-center p-3">
                {o.img ? (
                  <Image source={resolveLegacyImage(o.img)} style={{ width: 72, height: 72, borderRadius: 8 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: '#f0f0f0' }} className="items-center justify-center">
                    <Ionicons name="image-outline" size={24} color="#ccc" />
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text numberOfLines={1} className="text-[14px] font-bold text-[#333]">{o.title}</Text>
                  <Text className="mt-1 text-[12px] text-[#999]">{o.createdAt?.slice(0, 10)}</Text>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-[16px] font-bold text-[#129258]">￥{o.finalPrice ?? o.price}</Text>
                    <View className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5">
                      <Text className="text-[11px] font-medium text-[#17b86c]">{o.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
