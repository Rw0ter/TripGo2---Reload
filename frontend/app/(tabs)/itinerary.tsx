import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

// 真实下载的卡通插画素材（CC0/开放授权，见 assets/images/forest/CREDITS.md）。
const MEADOW = require('../../assets/images/forest/meadow_bg.jpg');
const TREE = require('../../assets/images/forest/tree.png');
const SAPLING = require('../../assets/images/forest/tree_sapling.png');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface EcoActivityRow {
  id: number;
  type: string;
  points: number;
  carbonSaved: number;
  date: string;
}

interface EcoProgress {
  carbonCredits: number;
  points: number;
  totalCarbonSaved: number;
  treesPlanted: number;
  treeProgress: number;
  treeTarget: number;
  todayActivities: EcoActivityRow[];
  weeklyTrend: { date: string; carbonSaved: number }[];
}

// 五类绿色行为 = 可收集的「绿色能量」来源（与后端 /eco/activity 类型一一对应）。
const TASKS: {
  type: string;
  label: string;
  desc: string;
  icon: IoniconName;
  points: number;
  slot: { top: number; left: string };
}[] = [
  { type: 'green_travel', label: '绿色出行', desc: '步行 / 骑行 / 公共交通', icon: 'bicycle', points: 30, slot: { top: 64, left: '10%' } },
  { type: 'waste_sort', label: '垃圾分类', desc: '正确分类投放', icon: 'trash', points: 25, slot: { top: 46, left: '66%' } },
  { type: 'eco_quiz', label: '环保答题', desc: '答对低碳知识', icon: 'school', points: 40, slot: { top: 150, left: '80%' } },
  { type: 'share_green', label: '分享绿色', desc: '传播低碳生活', icon: 'share-social', points: 50, slot: { top: 142, left: '4%' } },
  { type: 'trade_in', label: '以旧换新', desc: '旧物循环利用', icon: 'swap-horizontal', points: 60, slot: { top: 24, left: '40%' } },
];

// 森林广场入口（接入项目现有页面）。
const PLAZA: { label: string; icon: IoniconName; color: string; route: string }[] = [
  { label: '减排榜', icon: 'trophy', color: '#E8A33D', route: '/leaderboard' },
  { label: '每日签到', icon: 'calendar', color: '#52B788', route: '/checkin' },
  { label: '环保答题', icon: 'school', color: '#40916C', route: '/quiz/1' },
  { label: '绿色地图', icon: 'map', color: '#2D6A4F', route: '/map' },
  { label: '生态良品', icon: 'bag-handle', color: '#74C69D', route: '/products' },
  { label: '绿色资讯', icon: 'newspaper', color: '#1B7A5A', route: '/green' },
];

// 可收集的绿色能量球：缓慢上下浮动，点击后放大上浮淡出再回调收集。
function EnergyOrb({
  task,
  busy,
  onCollect,
}: {
  task: (typeof TASKS)[number];
  busy: boolean;
  onCollect: (type: string) => void;
}) {
  const bob = useSharedValue(0);
  const gone = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(bob);
  }, [bob]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value - gone.value * 130 }, { scale: 1 + gone.value * 0.4 }],
    opacity: 1 - gone.value,
  }));

  function handlePress() {
    if (busy) return;
    gone.value = withTiming(1, { duration: 520, easing: Easing.in(Easing.cubic) }, (fin) => {
      if (fin) runOnJS(onCollect)(task.type);
    });
  }

  return (
    <Animated.View
      style={[{ position: 'absolute', top: task.slot.top, left: task.slot.left as never, alignItems: 'center' }, style]}>
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`收集${task.label}能量`}>
        <View
          style={{ width: 56, height: 56, boxShadow: '0px 6px 16px rgba(45,106,79,0.4)' }}
          className="items-center justify-center rounded-full">
          <LinearGradient
            colors={['#B7F5C9', '#52B788', '#2D9C6A']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' }}>
            <Ionicons name={task.icon} size={22} color="#ffffff" />
          </LinearGradient>
        </View>
        <View className="mt-1 self-center rounded-full bg-white/90 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-eco-mid">+{task.points}g</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// 树木：随成长进度轻微摇摆 + 缩放。
function GrowingTree({ growth, sapling, width }: { growth: number; sapling: boolean; width: number }) {
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(sway);
  }, [sway]);

  const scale = 0.64 + 0.36 * growth;
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 1.4}deg` }, { scale }],
  }));
  const w = width * 0.56;

  return (
    <Reanimated.Image
      source={sapling ? SAPLING : TREE}
      resizeMode="contain"
      style={[{ width: w, height: w * 1.18, transform: [{ scale }] }, style]}
    />
  );
}

export default function ForestScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const authUser = useAuthStore((s) => s.user);

  const [data, setData] = useState<EcoProgress | null>(null);
  const [err, setErr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(false);
    try {
      setData(await apiRequest<EcoProgress>('/eco/progress', { auth: true }));
    } catch {
      setErr(true);
    }
  }, [token]);

  useEffect(() => {
    if (hydrated && token) void load();
  }, [hydrated, token, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const collect = useCallback(
    async (type: string) => {
      if (busy.includes(type)) return;
      setBusy((b) => [...b, type]);
      try {
        await apiRequest('/eco/activity', { method: 'POST', body: { type }, auth: true });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await load();
      } catch (e) {
        Alert.alert('提示', e instanceof Error ? e.message : '收集失败，请稍后再试');
      } finally {
        setBusy((b) => b.filter((t) => t !== type));
      }
    },
    [busy, load],
  );

  const plant = useCallback(async () => {
    if (!data) return;
    if (data.points < 50) {
      Alert.alert('积分不足', '浇灌一次需要 50 积分，多完成绿色任务攒积分吧');
      return;
    }
    try {
      const r = await apiRequest<{ message: string }>('/eco/plant', { method: 'POST', auth: true });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('浇灌成功', r.message ?? '你为小树浇了一次水');
      await load();
    } catch (e) {
      Alert.alert('提示', e instanceof Error ? e.message : '操作失败，请稍后再试');
    }
  }, [data, load]);

  // ── 未登录 ──
  if (hydrated && !token) {
    return (
      <View className="flex-1 items-center justify-center bg-eco-cream px-10" style={{ paddingTop: insets.top }}>
        <Ionicons name="leaf" size={64} color="#40916C" />
        <Text className="mt-4 text-lg font-bold text-eco-dark">登录开启你的绿色森林</Text>
        <Text className="mt-2 text-center text-[13px] leading-5 text-eco-mid/70">
          收集绿色能量、浇灌小树，把低碳行动变成一片真实的森林
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          className="mt-6 rounded-full bg-eco px-10 py-3"
          accessibilityRole="button">
          <Text className="text-[15px] font-bold text-white">去登录</Text>
        </Pressable>
      </View>
    );
  }

  // ── 加载中 ──
  if (!hydrated || (!data && !err)) {
    return (
      <View className="flex-1 items-center justify-center bg-eco-cream">
        <ActivityIndicator color="#40916C" />
      </View>
    );
  }

  // ── 加载失败 ──
  if (err && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-eco-cream px-10">
        <Ionicons name="cloud-offline-outline" size={56} color="#9CB3A6" />
        <Text className="mt-3 text-[14px] text-eco-mid/70">加载失败</Text>
        <Pressable onPress={() => void load()} className="mt-4 rounded-full bg-eco px-8 py-2.5">
          <Text className="text-[14px] font-bold text-white">点此重试</Text>
        </Pressable>
      </View>
    );
  }

  const d = data!;
  const growth = Math.max(0, Math.min(1, d.treeTarget > 0 ? d.treeProgress / d.treeTarget : 0));
  const sapling = d.treesPlanted === 0 && growth < 0.5;
  const doneTypes = new Set(d.todayActivities.map((a) => a.type));
  const available = TASKS.filter((t) => !doneTypes.has(t.type));
  const remainKg = Math.max(0, d.treeTarget - d.treeProgress);
  const heroH = 372;
  const maxTrend = Math.max(1, ...d.weeklyTrend.map((w) => w.carbonSaved));

  return (
    <View className="flex-1 bg-eco-cream">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#40916C" />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        {/* ── 顶部用户条 ── */}
        <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
          <View className="flex-row items-center">
            {authUser?.avatar ? (
              <Image source={{ uri: authUser.avatar }} style={{ width: 38, height: 38, borderRadius: 19 }} />
            ) : (
              <Ionicons name="person-circle" size={40} color="#52B788" />
            )}
            <View className="ml-2.5">
              <Text className="text-[15px] font-bold text-eco-dark">{authUser?.username ?? '绿色行动者'}</Text>
              <Text className="text-[11px] text-eco-mid/70">已种 {d.treesPlanted} 棵 · 减排 {d.totalCarbonSaved.toFixed(1)}kg</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/leaderboard')}
            className="flex-row items-center rounded-full bg-white px-3 py-1.5"
            style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' }}>
            <Ionicons name="leaf" size={14} color="#40916C" />
            <Text className="ml-1 text-[13px] font-extrabold text-eco">{d.carbonCredits}</Text>
            <Text className="ml-0.5 text-[11px] text-eco-mid/70">碳积分</Text>
          </Pressable>
        </View>

        {/* ── 森林场景 ── */}
        <View style={{ height: heroH }} className="overflow-hidden">
          <Image source={MEADOW} style={{ position: 'absolute', width, height: heroH }} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(247,250,245,0)', 'rgba(247,250,245,0.7)', '#F7FAF5']}
            locations={[0.55, 0.85, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
          />

          {/* 树 */}
          <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' }}>
            <GrowingTree growth={growth} sapling={sapling} width={width} />
          </View>

          {/* 能量球 */}
          {available.map((t) => (
            <EnergyOrb key={t.type} task={t} busy={busy.includes(t.type)} onCollect={collect} />
          ))}

          {/* 收集提示 */}
          {available.length > 0 ? (
            <Animated.View
              entering={FadeIn.duration(500)}
              style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center' }}>
              <View className="rounded-full bg-eco-dark/75 px-3.5 py-1.5">
                <Text className="text-[12px] font-medium text-white">点击能量球收集，绿色行动汇成一片森林</Text>
              </View>
            </Animated.View>
          ) : null}
        </View>

        {/* ── 成长进度 ── */}
        <Animated.View
          entering={FadeInDown.duration(420)}
          className="mx-4 -mt-3 rounded-3xl bg-white p-4"
          style={{ boxShadow: '0px 6px 20px rgba(45,106,79,0.1)' }}>
          <View className="mb-2 flex-row items-end justify-between">
            <View>
              <Text className="text-[13px] text-eco-mid/70">距下一棵真树还需</Text>
              <Text className="text-[22px] font-extrabold text-eco-dark">
                {remainKg.toFixed(1)}
                <Text className="text-[13px] font-medium text-eco-mid/70"> kg 减排</Text>
              </Text>
            </View>
            <Pressable onPress={plant} className="flex-row items-center rounded-full bg-eco px-4 py-2.5">
              <Ionicons name="water" size={15} color="#fff" />
              <Text className="ml-1 text-[13px] font-bold text-white">浇灌 · 50积分</Text>
            </Pressable>
          </View>
          <View className="h-2.5 overflow-hidden rounded-full bg-eco-pale">
            <View style={{ width: `${growth * 100}%` }} className="h-2.5 rounded-full bg-eco-light" />
          </View>
        </Animated.View>

        {/* ── 今日绿色任务 ── */}
        <View className="mt-5 px-4">
          <Text className="mb-2.5 text-[16px] font-extrabold text-eco-dark">今日绿色任务</Text>
          {TASKS.map((t, i) => {
            const done = doneTypes.has(t.type);
            return (
              <Animated.View key={t.type} entering={FadeInDown.delay(i * 50).duration(380)}>
                <Pressable
                  disabled={done || busy.includes(t.type)}
                  onPress={() => collect(t.type)}
                  className="mb-2.5 flex-row items-center rounded-2xl bg-white p-3"
                  style={{ boxShadow: '0px 3px 12px rgba(0,0,0,0.05)', opacity: done ? 0.6 : 1 }}>
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-eco-pale">
                    <Ionicons name={t.icon} size={22} color="#2D6A4F" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-bold text-eco-dark">{t.label}</Text>
                    <Text className="text-[12px] text-eco-mid/70">{t.desc}</Text>
                  </View>
                  {done ? (
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={20} color="#52B788" />
                      <Text className="ml-1 text-[12px] font-semibold text-eco-light">已完成</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center rounded-full bg-eco-pale px-3 py-1.5">
                      <Text className="text-[12px] font-bold text-eco-mid">+{t.points} 能量</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* ── 近 7 日减排趋势 ── */}
        <Animated.View entering={FadeInDown.duration(420)} className="mx-4 mt-3 rounded-3xl bg-white p-4" style={{ boxShadow: '0px 3px 12px rgba(0,0,0,0.05)' }}>
          <Text className="mb-3 text-[15px] font-extrabold text-eco-dark">近 7 日减排</Text>
          <View className="flex-row items-end justify-between" style={{ height: 96 }}>
            {d.weeklyTrend.map((w, i) => {
              const h = 12 + (w.carbonSaved / maxTrend) * 72;
              return (
                <View key={i} className="flex-1 items-center">
                  <Text className="mb-1 text-[9px] text-eco-mid/60">{w.carbonSaved > 0 ? w.carbonSaved.toFixed(1) : ''}</Text>
                  <View style={{ height: h, width: 14 }} className="rounded-full bg-eco-light" />
                  <Text className="mt-1.5 text-[9px] text-eco-mid/50">{w.date.slice(5)}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 森林广场 ── */}
        <View className="mt-5 px-4">
          <Text className="mb-3 text-[16px] font-extrabold text-eco-dark">森林广场</Text>
          <View className="flex-row flex-wrap justify-between">
            {PLAZA.map((p, i) => (
              <Animated.View key={p.label} entering={FadeInDown.delay(i * 40).duration(360)} style={{ width: '31%' }} className="mb-3">
                <Pressable
                  onPress={() => router.push(p.route as never)}
                  className="items-center rounded-2xl bg-white py-4"
                  style={{ boxShadow: '0px 3px 12px rgba(0,0,0,0.05)' }}>
                  <View style={{ backgroundColor: `${p.color}1A` }} className="h-12 w-12 items-center justify-center rounded-2xl">
                    <Ionicons name={p.icon} size={24} color={p.color} />
                  </View>
                  <Text className="mt-2 text-[12px] font-semibold text-eco-dark">{p.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
