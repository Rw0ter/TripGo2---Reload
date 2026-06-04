import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';
import { useAuthStore } from '@/stores/auth';

interface Order {
  id: number;
  type: string;
  title: string;
  img: string | null;
  price: number;
  oriPrice: number;
  finalPrice: number;
  status: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

const STORE_LOGO = require('../assets/legacy/img/logo.png');

const TABS = ['全部', '待付款', '待发货', '待收货', '退款/售后'];
const STATUS_MAP: (string | null)[] = [null, '待支付', '待发货', '待收货', '已结束'];

function isClosedStatus(s: string) {
  return s.includes('结束') || s.includes('关闭') || s.includes('取消');
}

function skuText(o: Order): string {
  const m = o.meta;
  if (o.type === '行程订单') {
    const parts: string[] = [];
    if (m?.startDate) parts.push('出行:' + String(m.startDate));
    if (m?.travelers) parts.push(String(m.travelers) + '人');
    return parts.join('；') || '行程订单';
  }
  if (m?.tags && Array.isArray(m.tags) && m.tags.length > 0) return m.tags.join(' ');
  if (m?.description) return String(m.description).substring(0, 15) + '...';
  return o.type || '普通订单';
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    try {
      const st = STATUS_MAP[tab];
      const data = await apiRequest<Order[]>(
        `/orders${st ? `?status=${encodeURIComponent(st)}` : ''}`,
        { auth: true },
      );
      setOrders(data);
    } catch { setOrders(null); }
  }, [tab]);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    void load();
  }, [load, token, router]);

  return (
    <View className="flex-1 bg-[#f7f7f7]">
      {/* Fixed header matching Legacy dingdan.html */}
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        {/* Search bar row: back | search input | more */}
        <View className="flex-row items-center px-3" style={{ height: 44 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 24, height: 24, marginRight: 10, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={20} color="#333" />
          </Pressable>
          <View className="flex-1 rounded-[20px] bg-[#f7f7f7] flex-row items-center" style={{ height: 32, paddingHorizontal: 12 }}>
            <Ionicons name="search" size={14} color="#999" style={{ marginRight: 4 }} />
            <Text className="text-[13px] text-[#999]">搜索订单...</Text>
          </View>
          <Pressable style={{ width: 30, marginLeft: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333', lineHeight: 22 }}>···</Text>
          </Pressable>
        </View>

        {/* Tabs row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, minWidth: '100%', justifyContent: 'space-between' }}
        >
          {TABS.map((t, i) => (
            <Pressable
              key={t}
              onPress={() => setTab(i)}
              style={{ height: 40, justifyContent: 'center', paddingHorizontal: 4, marginRight: 4 }}
            >
              <Text
                className={i === tab ? 'font-semibold text-[#17b86c]' : 'text-[#333]'}
                style={{ fontSize: i === tab ? 15 : 14 }}
              >
                {t}
              </Text>
              {i === tab && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    alignSelf: 'center',
                    width: 20,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: '#17b86c',
                  }}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 12, paddingBottom: 32 }}>
        {!orders ? (
          <View style={{ alignItems: 'center', paddingVertical: 100 }}>
            <ActivityIndicator color="#17b86c" />
          </View>
        ) : orders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 100 }}>
            <Ionicons name="receipt-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">暂无相关订单</Text>
          </View>
        ) : (
          orders.map((o) => {
            const closed = isClosedStatus(o.status);
            const imgSource = o.img ? resolveLegacyImage(o.img) : null;
            const oriP = (o.oriPrice ?? o.price ?? 0).toFixed(2);
            const dotIdx = oriP.indexOf('.');
            const oriInt = dotIdx >= 0 ? oriP.substring(0, dotIdx) : oriP;
            const oriDec = dotIdx >= 0 ? oriP.substring(dotIdx + 1) : '00';
            const finalP = (o.finalPrice ?? o.price ?? 0).toFixed(2);

            return (
              <View key={o.id} className="mb-2.5 rounded-xl bg-white p-3">
                {/* Card Header: store + status */}
                <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
                  <View className="flex-row items-center">
                    <Image
                      source={STORE_LOGO}
                      style={{ width: 18, height: 18, marginRight: 6 }}
                      resizeMode="contain"
                    />
                    <Text className="font-semibold text-[14px] text-[#111]">文脉粤游官方旗舰店</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: closed ? '#999' : '#17b86c' }}>
                    {o.status || '交易关闭'}
                  </Text>
                </View>

                {/* Card Body: image | info | price */}
                <View className="flex-row" style={{ marginBottom: 10 }}>
                  {imgSource ? (
                    <Image
                      source={imgSource}
                      style={{ width: 90, height: 90, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="items-center justify-center bg-[#f0f0f0]"
                      style={{ width: 90, height: 90, borderRadius: 8 }}
                    >
                      <Ionicons name="image-outline" size={28} color="#ccc" />
                    </View>
                  )}
                  <View className="ml-2.5 flex-1">
                    <Text
                      numberOfLines={2}
                      className="text-[13px] font-medium text-[#111]"
                      style={{ marginBottom: 6 }}
                    >
                      {o.title || '未命名订单'}
                    </Text>
                    <View
                      className="mb-1 self-start rounded bg-[#f6f6f6]"
                      style={{ paddingHorizontal: 6, paddingVertical: 2 }}
                    >
                      <Text numberOfLines={1} style={{ fontSize: 11, color: '#999', maxWidth: 180 }}>
                        {skuText(o)}
                      </Text>
                    </View>
                    <View className="flex-row" style={{ gap: 6, marginBottom: 8 }}>
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: 'rgba(23,184,108,0.2)',
                          borderRadius: 2,
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: '#17b86c' }}>7天无理由退货</Text>
                      </View>
                    </View>
                  </View>
                  {/* Original price + qty */}
                  <View style={{ marginLeft: 8, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: '#111' }}>
                      ￥<Text style={{ fontSize: 16 }}>{oriInt}</Text>.{oriDec}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#999' }}>x1</Text>
                  </View>
                </View>

                {/* Total Row */}
                <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: '#111' }}>
                    含运费及优惠 实付款 ￥<Text style={{ fontSize: 14, fontWeight: '600' }}>{finalP}</Text>
                  </Text>
                </View>

                {/* Card Footer: action buttons */}
                <View className="flex-row justify-end" style={{ gap: 8 }}>
                  {o.status === '待支付' ? (
                    <>
                      <Pressable
                        className="items-center justify-center rounded-[15px] border border-[#cdcdcd] bg-white"
                        style={{ paddingHorizontal: 14, height: 30 }}
                      >
                        <Text className="text-[13px] text-[#333]">取消订单</Text>
                      </Pressable>
                      <Pressable
                        className="items-center justify-center rounded-[15px] border border-[#17b86c] bg-white"
                        style={{ paddingHorizontal: 14, height: 30 }}
                      >
                        <Text className="text-[13px] text-[#17b86c]">去支付</Text>
                      </Pressable>
                    </>
                  ) : closed ? (
                    <>
                      <Pressable
                        className="items-center justify-center rounded-[15px] border border-[#cdcdcd] bg-white"
                        style={{ paddingHorizontal: 14, height: 30 }}
                      >
                        <Text className="text-[13px] text-[#333]">删除订单</Text>
                      </Pressable>
                      <Pressable
                        className="items-center justify-center rounded-[15px] border border-[#17b86c] bg-white"
                        style={{ paddingHorizontal: 14, height: 30 }}
                      >
                        <Text className="text-[13px] text-[#17b86c]">再买一单</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable
                        className="items-center justify-center rounded-[15px] border border-[#cdcdcd] bg-white"
                        style={{ paddingHorizontal: 14, height: 30 }}
                      >
                        <Text className="text-[13px] text-[#333]">查看物流</Text>
                      </Pressable>
                      <Pressable
                        className="items-center justify-center rounded-[15px] border border-[#17b86c] bg-white"
                        style={{ paddingHorizontal: 14, height: 30 }}
                      >
                        <Text className="text-[13px] text-[#17b86c]">确认收货</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
