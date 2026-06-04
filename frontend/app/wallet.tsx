import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';

const TXN = [
  { title: '每日签到', time: '2026-06-04 08:00', amount: '+10', type: 'in' },
  { title: '购买广绣团扇', time: '2026-06-03 15:30', amount: '-128.00', type: 'out' },
  { title: '答题奖励', time: '2026-06-02 10:15', amount: '+10', type: 'in' },
  { title: '文创优惠券兑换', time: '2026-06-01 14:00', amount: '-50', type: 'out' },
  { title: '签到奖励', time: '2026-05-31 08:00', amount: '+10', type: 'in' },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const balance = user?.balance ?? 200;
  const points = user?.points ?? 0;
  const coupons = user?.couponCount ?? 2;

  return (
    <View className="flex-1 bg-[#f2f5ff]">
      {/* Header matching Legacy wallet.html */}
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
        <View className="px-4 pt-5">
          <Text className="text-[15px] font-bold text-[#5b8bff]">最近流水</Text>
          {TXN.map((t, i) => (
            <View key={i} className="flex-row items-center justify-between border-b border-[#f0f0f0] py-3.5">
              <View>
                <Text className="text-[14px] font-semibold text-[#333]">{t.title}</Text>
                <Text className="mt-0.5 text-[12px] text-[#999]">{t.time}</Text>
              </View>
              <Text className={`text-[15px] font-bold ${t.type === 'in' ? 'text-[#30c77e]' : 'text-[#ff5252]'}`}>{t.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
