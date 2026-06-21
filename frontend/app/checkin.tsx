import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '@/lib/api';
import { Animated } from '@/components/ui/animated';

const BG = '#F4F1E4';
const GD = '#1B4332';
const GL = '#40916C';

interface CheckinStatus { checkedIn: boolean; todayPoints: number; totalDays: number; }
interface EcoStatus { carbonCredits: number; points: number; totalCarbonSaved: number; treesPlanted: number; treeProgress: number; treeTarget: number; todayActivities: any[]; weeklyTrend: { date: string; carbonSaved: number }[]; }

// 任务配图（本地）
const TASK_IMAGES: Record<string, ImageSourcePropType> = {
  daily_signin: require('../assets/images/checkin/checkin_tree.jpg'),
  green_travel: require('../assets/images/checkin/checkin_bike.jpg'),
  waste_sort: require('../assets/images/checkin/checkin_waste.jpg'),
  eco_quiz: require('../assets/images/checkin/checkin_quiz.jpg'),
  share_green: require('../assets/images/checkin/checkin_share.jpg'),
};

const TASKS = [
  { id: 'daily_signin', type: 'signin', title: '每日签到', sub: '签到获得碳积分与普通积分', coin: 20 },
  { id: 'green_travel', type: 'green_travel', title: '绿色出行', sub: '步行 / 骑行 / 公交通勤打卡', coin: 30 },
  { id: 'waste_sort', type: 'waste_sort', title: '垃圾分类', sub: '完成分类知识学习并打卡', coin: 25 },
  { id: 'eco_quiz', type: 'eco_quiz', title: '环保答题', sub: '完成环保知识答题挑战', coin: 40 },
  { id: 'share_green', type: 'share_green', title: '绿色分享', sub: '发布一条绿色生活动态', coin: 50 },
];

export default function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checkin, setCheckin] = useState<CheckinStatus | null>(null);
  const [eco, setEco] = useState<EcoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [status, ecoData] = await Promise.all([
        apiRequest<CheckinStatus>('/checkin/status', { auth: true }),
        apiRequest<EcoStatus>('/eco/progress', { auth: true }),
      ]);
      setCheckin(status);
      setEco(ecoData);
      setDoneTasks((prev) => {
        const next = new Set(prev);
        if (status.checkedIn) next.add('daily_signin');
        // 从今天已完成活动中恢复任务状态
        (ecoData?.todayActivities ?? []).forEach((a: any) => {
          if (a.type === 'green_travel') next.add('green_travel');
          if (a.type === 'waste_sort') next.add('waste_sort');
          if (a.type === 'eco_quiz') next.add('eco_quiz');
          if (a.type === 'share_green') next.add('share_green');
        });
        return next;
      });
    } catch { /* stale */ }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function doCheckin() {
    if (loading || checkin?.checkedIn) return;
    setLoading(true);
    try {
      await apiRequest('/checkin', { method: 'POST', auth: true });
      setCheckin((prev) => prev ? { ...prev, checkedIn: true } : null);
      setDoneTasks((prev) => new Set(prev).add('daily_signin'));
      void load();
    } catch { /* done */ }
    finally { setLoading(false); }
  }

  async function handleTask(type: string, taskId: string) {
    if (doneTasks.has(taskId)) return;
    try {
      await apiRequest('/eco/activity', { method: 'POST', auth: true, body: { type } });
      setDoneTasks((prev) => new Set(prev).add(taskId));
      void load();
    } catch { /* done */ }
  }

  const checkedIn = checkin?.checkedIn ?? false;
  const s = eco;
  const treePercent = s ? Math.round((s.treeProgress / s.treeTarget) * 100) : 0;
  const weeklyMax = s ? Math.max(...s.weeklyTrend.map((d) => d.carbonSaved), 1) : 1;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Hero —— 森林大图 + 碳积分浮层 */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <View style={{ height: 240, overflow: 'hidden' }}>
            <Image source={require('../assets/images/checkin/checkin_hero.jpg')}
              style={{ width: '100%', height: 240, position: 'absolute' }} resizeMode="cover" />
            <LinearGradient colors={['rgba(27,67,50,0.82)', 'rgba(27,67,50,0.55)']}
              style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 24 }}>
              {/* Back button */}
              <Pressable onPress={() => router.back()}
                style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10 }}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </Pressable>
              <View className="px-5">
                <Text className="text-[11px] font-medium text-white/60 tracking-widest uppercase">MY CARBON WALLET</Text>
                <View className="flex-row items-baseline mt-1.5">
                  <Text className="text-5xl font-extrabold text-white">{s?.carbonCredits ?? 0}</Text>
                  <Text className="text-lg text-white/70 ml-2 font-medium">碳积分</Text>
                </View>
                <View className="flex-row items-center mt-4" style={{ gap: 16 }}>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-[#95D5B2] mr-1.5" />
                    <Text className="text-xs text-white/70">{s?.treesPlanted ?? 0} 棵树</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-[#95D5B2] mr-1.5" />
                    <Text className="text-xs text-white/70">{s?.totalCarbonSaved?.toFixed(1) ?? 0} kg CO₂</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-[#95D5B2] mr-1.5" />
                    <Text className="text-xs text-white/70">连续 {checkin?.totalDays ?? 0} 天</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* 签到按钮 —— 悬浮在Hero右下 */}
            <Pressable onPress={doCheckin} disabled={loading || checkedIn}
              className="absolute right-5 active:scale-95 rounded-xl"
              style={{ bottom: 60, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: checkedIn ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: checkedIn ? 1 : 0, borderColor: checkedIn ? 'rgba(255,255,255,0.3)' : 'transparent',
                shadowColor: '#000', shadowOpacity: checkedIn ? 0 : 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
              {!checkin ? <ActivityIndicator color={GD} /> :
               checkedIn ? <View className="flex-row items-center"><Ionicons name="checkmark-circle" size={22} color="#74C69D" /><Text className="text-sm font-extrabold text-white/70 ml-1.5">已签到</Text></View> :
               <View className="items-center">
                 <Text className="text-sm font-extrabold" style={{ color: GD }}>{loading ? '...' : '签到打卡'}</Text>
               </View>}
            </Pressable>
          </View>
        </Animated.View>

        {/* 快速数据条 */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} className="mx-4 -mt-4">
          <View className="flex-row rounded-2xl bg-white overflow-hidden"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
            {[
              { label: '碳积分', val: s?.carbonCredits ?? 0, color: '#1B4332' },
              { label: '累计减排', val: `${s?.totalCarbonSaved?.toFixed(1) ?? 0} kg`, color: '#2D6A4F' },
              { label: '已种树', val: `${s?.treesPlanted ?? 0} 棵`, color: '#40916C' },
              { label: '积分', val: s?.points ?? 0, color: '#52B788' },
            ].map((item, i) => (
              <View key={item.label} className="flex-1 items-center py-3.5"
                style={{ borderRightWidth: i < 3 ? 1 : 0, borderColor: '#F3F4F6' }}>
                <Text className="text-lg font-extrabold" style={{ color: item.color }}>{item.val}</Text>
                <Text className="text-[10px] text-[#9CA3AF] mt-0.5">{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* 植树进度 */}
        {s && (
          <Animated.View entering={FadeInDown.delay(140).duration(450)} className="mx-4 mt-4">
            <View className="rounded-2xl bg-white p-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 }}>
              <View className="flex-row justify-between items-end mb-2">
                <Text className="text-sm font-bold text-[#1A1A1A]">植树进度</Text>
                <Text className="text-[11px] text-[#9CA3AF]">{treePercent}%</Text>
              </View>
              <View className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <View className="h-full rounded-full" style={{ width: `${Math.min(treePercent, 100)}%`, backgroundColor: GL }} />
              </View>
              <Text className="text-[11px] text-[#6B7280] mt-2">
                再减排 {(s.treeTarget - s.treeProgress).toFixed(1)} kg 即可种一棵树
              </Text>
            </View>
          </Animated.View>
        )}

        {/* 每日任务 —— 横滑真实图片卡 */}
        <Animated.View entering={FadeInDown.delay(180).duration(450)} className="mt-4">
          <View className="flex-row items-end justify-between px-4 mb-2.5">
            <View className="flex-row items-center">
              <View style={{ width: 4, height: 17, borderRadius: 2 }} className="bg-[#386641]" />
              <Text className="ml-2 text-[16px] font-extrabold text-[#2f3a30]">今日任务</Text>
              <Text className="ml-2 text-[11px] text-[#9a9382]">完成打卡赚积分</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {TASKS.map((task) => {
              const isSignin = task.id === 'daily_signin';
              const isDone = isSignin ? checkedIn : doneTasks.has(task.id);
              const img = TASK_IMAGES[task.id];
              return (
                <Pressable key={task.id}
                  onPress={() => { if (isSignin) doCheckin(); else handleTask(task.type, task.id); }}
                  disabled={isDone || (isSignin && loading)}
                  className="rounded-2xl overflow-hidden active:scale-[0.97]"
                  style={{ width: 180, height: 130, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
                  <Image source={img} style={{ width: 180, height: 130, position: 'absolute' }} resizeMode="cover" />
                  <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 }} />
                  {isDone && (
                    <View className="absolute top-2 right-2 rounded-full bg-[#40916C] px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-white">已完成</Text>
                    </View>
                  )}
                  <View className="absolute bottom-3 left-3 right-3">
                    <Text className="text-sm font-extrabold text-white">{task.title}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-[11px] text-white/65">{task.sub}</Text>
                      <Text className="text-[11px] text-[#95D5B2] font-bold ml-1.5">+{task.coin}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* 7 日趋势 */}
        {s && (
          <Animated.View entering={FadeInDown.delay(220).duration(450)} className="mx-4 mt-4">
            <View className="rounded-2xl bg-white p-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 }}>
              <Text className="text-sm font-bold text-[#1A1A1A] mb-3">近 7 日减排趋势</Text>
              <View className="flex-row items-end justify-between" style={{ height: 72 }}>
                {s.weeklyTrend.map((day, i) => {
                  const h = Math.max(4, (day.carbonSaved / weeklyMax) * 56);
                  const isToday = i === s.weeklyTrend.length - 1;
                  return (
                    <View key={i} className="items-center flex-1">
                      <Text className="text-[9px] text-[#9CA3AF] mb-1">
                        {day.carbonSaved > 0 ? day.carbonSaved.toFixed(1) : ''}
                      </Text>
                      <View className="w-7 rounded-t-md" style={{ height: h, backgroundColor: isToday ? GL : '#95D5B2' }} />
                      <Text className="text-[9px] text-[#9CA3AF] mt-1.5">{day.date.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#F3F4F6]">
                <Text className="text-[11px] text-[#6B7280]">
                  本周 {s.weeklyTrend.reduce((a, d) => a + d.carbonSaved, 0).toFixed(1)} kg
                </Text>
                <Text className="text-[11px] font-medium text-[#40916C]">
                  ~{Math.round(s.weeklyTrend.reduce((a, d) => a + d.carbonSaved, 0) * 0.06)} 棵树/年吸收量
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* 环保贴士 */}
        <Animated.View entering={FadeInDown.delay(260).duration(450)} className="mx-4 mt-4 mb-4">
          <View className="rounded-2xl p-4" style={{ backgroundColor: '#1B4332' }}>
            <View className="flex-row items-center mb-2">
              <Ionicons name="bulb" size={18} color="#95D5B2" />
              <Text className="text-xs font-bold text-white/90 ml-2">今日环保知识</Text>
            </View>
            <Text className="text-[12px] text-white/65 leading-relaxed">
              一棵成年树每年可吸收约 18 kg CO₂。少用一个塑料袋减碳 0.06 kg，多走 1 公里比开车减碳 0.2 kg——坚持绿色行动，你的每一天都在改变地球的未来。
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
