import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { apiRequest } from '@/lib/api';
import { ScreenHeader } from '@/components/ui/screen-header';

interface Transaction {
  id: number;
  title: string;
  time: string;
  amount: number;
}

// 后端 GET /transactions 返回形状（amount 为带符号字符串，时间为 createdAt）
interface ApiTransaction {
  id: number;
  type: string;
  title: string;
  amount: string;
  createdAt: string;
}

interface Budget {
  name: string;
  spent: number;
  total: number;
}

const FALLBACK_TXNS: Transaction[] = [
  { id: 1, title: '广州塔门票', time: '05-31 14:32', amount: -120.0 },
  { id: 2, title: '岭南印象园车票', time: '05-30 09:15', amount: -6.0 },
  { id: 3, title: '充值', time: '05-29 22:07', amount: 2000.0 },
  { id: 4, title: '羊城通充值返现', time: '05-29 20:18', amount: 10.0 },
  { id: 5, title: '购买广绣团扇', time: '05-28 15:30', amount: -128.0 },
  { id: 6, title: '每日签到奖励', time: '05-28 08:00', amount: 10.0 },
];

const FALLBACK_BUDGETS: Budget[] = [
  { name: '广州三日游预算', spent: 3120, total: 5000 },
  { name: '潮汕美食之旅预算', spent: 2150, total: 2000 },
];

export default function WalletScreen() {
  const [txns, setTxns] = useState<Transaction[]>(FALLBACK_TXNS);
  const [budgets] = useState<Budget[]>(FALLBACK_BUDGETS);

  useEffect(() => {
    (async () => {
      try {
        // 后端真实流水：GET /transactions（按 userId 隔离）。
        // 之前误写成 /wallet/transactions（不存在）→ 永远走假数据；这里修正并映射字段。
        const data = await apiRequest<ApiTransaction[]>('/transactions', { auth: true });
        if (data && data.length > 0) {
          setTxns(
            data.map((t) => ({
              id: t.id,
              title: t.title,
              time: t.createdAt.slice(5, 16).replace('T', ' '),
              amount: parseFloat(t.amount) || 0,
            })),
          );
        }
      } catch {
        /* 网络异常时保留兜底展示 */
      }
    })();
  }, []);

  const totalExpense = txns
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const rechargeBalance = txns
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = rechargeBalance - totalExpense;
  const txCount = txns.length;

  return (
    <View className="flex-1 bg-[#f2f5ff]">
      {/* Header — LinearGradient 135deg matching legacy */}
      <LinearGradient
        colors={['#5b8bff', '#17d7fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-12"
      >
        <ScreenHeader title="钱包" tint="dark" />

        <Text className="text-center text-[40px] font-bold text-white">
          ￥{balance.toFixed(2)}
        </Text>

        {/* Stats row — financial metrics matching legacy */}
        <View className="mx-8 mt-4 flex-row justify-between">
          <View className="flex-1 items-center">
            <Text className="text-[15px] font-bold text-white">
              ￥{totalExpense.toFixed(2)}
            </Text>
            <Text className="mt-1 text-[13px] text-[#e0f2ff]">消费支出</Text>
          </View>
          <View className="flex-1 items-center border-l border-r border-white/40">
            <Text className="text-[15px] font-bold text-white">共{txCount}笔</Text>
            <Text className="mt-1 text-[13px] text-[#e0f2ff]">交易数量</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-[15px] font-bold text-white">
              ￥{rechargeBalance.toFixed(2)}
            </Text>
            <Text className="mt-1 text-[13px] text-[#e0f2ff]">充值余额</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ marginTop: -16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        className="bg-[#f2f5ff]"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 最近流水 */}
        <View className="px-4 pt-5">
          <Text className="mb-3 text-[16px] font-bold text-[#5b8bff]">最近流水</Text>
          {txns.map((t) => {
            const isIncome = t.amount > 0;
            return (
              <View
                key={t.id}
                className="mb-2.5 flex-row items-center justify-between rounded-xl bg-white px-4 py-3.5"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <View>
                  <Text className="text-[15px] font-medium text-[#111]">
                    {t.title}
                  </Text>
                  <Text className="mt-1 text-[13px] text-[#666]">{t.time}</Text>
                </View>
                <Text
                  className={`text-base font-semibold ${
                    isIncome ? 'text-[#30c77e]' : 'text-[#ff4f8a]'
                  }`}
                >
                  {isIncome ? '+' : '-'}￥{Math.abs(t.amount).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 行程预算进度 */}
        <View className="px-4 pt-2">
          <Text className="mb-3 text-[16px] font-bold text-[#5b8bff]">
            行程预算进度
          </Text>
          {budgets.map((b, i) => {
            const pct = Math.min(100, Math.round((b.spent / b.total) * 100));
            const overrun = b.spent > b.total;
            return (
              <View
                key={i}
                className="mb-3 rounded-xl bg-white px-4 py-4"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text className="mb-3 text-[15px] font-medium text-[#111]">
                  {b.name}
                </Text>
                {/* Progress bar */}
                <View className="mb-2 h-3.5 w-full overflow-hidden rounded-full bg-[#e1e4f2]">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: overrun ? '#ff9f43' : '#30c77e',
                    }}
                  />
                </View>
                {/* Labels */}
                <View className="flex-row justify-between">
                  <Text className="text-[13px] text-[#666]">
                    已用 ￥{b.spent.toLocaleString()}
                  </Text>
                  <Text className="text-[13px] font-semibold text-[#333]">
                    {pct}%
                  </Text>
                  <Text className="text-[13px] text-[#666]">
                    预算 ￥{b.total.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
