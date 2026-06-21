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
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInUp,
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
const CLOUD = require('../../assets/images/forest/cloud.png');

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

// 五类绿色行为 = 浮在森林场景上、可点击收集的「绿色能量球」（与后端 /eco/activity 一一对应）。
const TASKS: {
  type: string;
  label: string;
  icon: IoniconName;
  points: number;
  slot: { top: string; left: string };
}[] = [
  { type: 'green_travel', label: '绿色出行', icon: 'bicycle', points: 30, slot: { top: '25%', left: '7%' } },
  { type: 'waste_sort', label: '垃圾分类', icon: 'trash', points: 25, slot: { top: '19%', left: '67%' } },
  { type: 'eco_quiz', label: '环保答题', icon: 'school', points: 40, slot: { top: '43%', left: '75%' } },
  { type: 'share_green', label: '分享绿色', icon: 'share-social', points: 50, slot: { top: '45%', left: '4%' } },
  { type: 'trade_in', label: '以旧换新', icon: 'swap-horizontal', points: 60, slot: { top: '15%', left: '40%' } },
];

// 底部悬浮 dock 入口（接入项目现有页面）。
const DOCK: { label: string; icon: IoniconName; color: string; route: string }[] = [
  { label: '减排榜', icon: 'trophy', color: '#E8A33D', route: '/leaderboard' },
  { label: '签到', icon: 'calendar', color: '#52B788', route: '/checkin' },
  { label: '答题', icon: 'school', color: '#40916C', route: '/quiz/1' },
  { label: '地图', icon: 'map', color: '#2D6A4F', route: '/map' },
  { label: '良品', icon: 'bag-handle', color: '#74C69D', route: '/products' },
  { label: '资讯', icon: 'newspaper', color: '#1B7A5A', route: '/green' },
];

// 可收集能量球：缓慢浮动 + 点击放大上浮淡出再回调收集。
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
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(bob);
  }, [bob]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value - gone.value * 140 }, { scale: 1 + gone.value * 0.45 }],
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
      style={[{ position: 'absolute', top: task.slot.top as never, left: task.slot.left as never, alignItems: 'center' }, style]}>
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`收集${task.label}能量`}>
        <View style={{ width: 58, height: 58, boxShadow: '0px 8px 18px rgba(45,106,79,0.45)' }} className="items-center justify-center rounded-full">
          <LinearGradient
            colors={['#B7F5C9', '#52B788', '#2D9C6A']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.75)' }}>
            <Ionicons name={task.icon} size={23} color="#ffffff" />
          </LinearGradient>
        </View>
        <View className="mt-1 self-center rounded-full bg-white/90 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-eco-mid">+{task.points}g</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// 随成长进度轻微摇摆 + 缩放的树。
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

  const scale = 0.66 + 0.34 * growth;
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 1.4}deg` }, { scale }],
  }));
  const w = width * 0.56;

  return (
    <Reanimated.Image source={sapling ? SAPLING : TREE} resizeMode="contain" style={[{ width: w, height: w * 1.18 }, style]} />
  );
}

// 缓慢飘移的云。
function DriftingCloud({ width, top, size, duration, delay }: { width: number; top: number; size: number; duration: number; delay: number }) {
  const x = useSharedValue(-size);
  useEffect(() => {
    x.value = -size;
    x.value = withRepeat(withTiming(width + size, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [x, width, size, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Reanimated.Image
      source={CLOUD}
      resizeMode="contain"
      style={[{ position: 'absolute', top, width: size, height: size * 0.5, opacity: 0.85 }, style]}
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
      Alert.alert('积分不足', '浇灌一次需要 50 积分，多点能量球完成绿色任务来攒积分吧');
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
        <Pressable onPress={() => router.push('/login')} className="mt-6 rounded-full bg-eco px-10 py-3" accessibilityRole="button">
          <Text className="text-[15px] font-bold text-white">去登录</Text>
        </Pressable>
      </View>
    );
  }

  if (!hydrated || (!data && !err)) {
    return (
      <View className="flex-1 items-center justify-center bg-eco-cream">
        <ActivityIndicator color="#40916C" />
      </View>
    );
  }

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
  const hour = new Date().getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  // ── 沉浸式森林（整屏即场景，UI 浮于其上，无白色内容区）──
  return (
    <View className="flex-1" style={{ backgroundColor: '#A9DCEF' }}>
      {/* 全屏森林场景 */}
      <Image source={MEADOW} style={{ position: 'absolute', top: 0, left: 0, width, height: '100%' }} resizeMode="cover" />
      {/* 顶部天空压暗，保证白色统计文字可读 */}
      <LinearGradient
        colors={['rgba(12,40,28,0.55)', 'rgba(12,40,28,0.12)', 'transparent']}
        locations={[0, 0.6, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 190 }}
      />

      {/* 飘云 */}
      <DriftingCloud width={width} top={insets.top + 70} size={120} duration={42000} delay={0} />
      <DriftingCloud width={width} top={insets.top + 140} size={80} duration={58000} delay={8000} />

      {/* 树 */}
      <View style={{ position: 'absolute', top: '24%', left: 0, right: 0, alignItems: 'center' }}>
        <GrowingTree growth={growth} sapling={sapling} width={width} />
      </View>

      {/* 能量球 */}
      {available.map((t) => (
        <EnergyOrb key={t.type} task={t} busy={busy.includes(t.type)} onCollect={collect} />
      ))}

      {/* 顶部统计（浮于天空，白字） */}
      <Animated.View entering={FadeIn.duration(500)} style={{ position: 'absolute', top: insets.top + 6, left: 18, right: 18 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] text-white/85">{greeting}，{authUser?.username ?? '绿色行动者'}</Text>
            <Text className="mt-0.5 text-[11px] text-white/65">已种 {d.treesPlanted} 棵真树 · 累计减排 {d.totalCarbonSaved.toFixed(1)} kg</Text>
          </View>
          <Pressable onPress={() => void load()} hitSlop={8} accessibilityLabel="刷新" className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Ionicons name="refresh" size={17} color="#fff" />
          </Pressable>
        </View>
        <View className="mt-2 flex-row items-end">
          <Text className="text-[46px] font-extrabold text-white" style={{ textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }}>
            {d.carbonCredits}
          </Text>
          <Text className="mb-2.5 ml-2 text-[14px] font-semibold text-white/85">碳积分</Text>
        </View>
      </Animated.View>

      {/* 收集提示 */}
      {available.length > 0 ? (
        <View style={{ position: 'absolute', top: '15.5%', left: 0, right: 0, alignItems: 'center' }}>
          <View className="rounded-full bg-eco-dark/55 px-3.5 py-1.5">
            <Text className="text-[12px] font-medium text-white">点击能量球，收集你的绿色能量</Text>
          </View>
        </View>
      ) : (
        <View style={{ position: 'absolute', top: '15.5%', left: 0, right: 0, alignItems: 'center' }}>
          <View className="rounded-full bg-eco-dark/55 px-3.5 py-1.5">
            <Text className="text-[12px] font-medium text-white">今日能量已收完，明天再来呀</Text>
          </View>
        </View>
      )}

      {/* 成长进度（玻璃胶囊，浮于草地上方） */}
      <Animated.View entering={FadeInUp.duration(500)} style={{ position: 'absolute', left: 16, right: 16, bottom: 104 }}>
        <View
          className="rounded-3xl px-4 py-3.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0px 10px 28px rgba(27,67,50,0.2)' }}>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-eco-mid/80">
              距下一棵真树还需 <Text className="text-[15px] font-extrabold text-eco-dark">{remainKg.toFixed(1)} kg</Text>
            </Text>
            <Pressable
              onPress={plant}
              accessibilityRole="button"
              className="flex-row items-center rounded-full bg-eco px-3.5 py-2"
              style={{ boxShadow: '0px 6px 16px rgba(45,106,79,0.4)' }}>
              <Ionicons name="water" size={14} color="#fff" />
              <Text className="ml-1 text-[12px] font-bold text-white">浇灌 · 50分</Text>
            </Pressable>
          </View>
          <View className="h-2.5 overflow-hidden rounded-full bg-eco-pale">
            <View style={{ width: `${growth * 100}%` }} className="h-2.5 rounded-full bg-eco-light" />
          </View>
        </View>
      </Animated.View>

      {/* 底部悬浮 dock（森林广场入口，浮于草地，避开底部 tab 栏） */}
      <Animated.View entering={FadeInUp.delay(120).duration(500)} style={{ position: 'absolute', left: 12, right: 12, bottom: 14 }}>
        <View
          className="flex-row items-center justify-between rounded-3xl px-1.5 py-2.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.94)', boxShadow: '0px 8px 24px rgba(0,0,0,0.14)' }}>
          {DOCK.map((p) => (
            <Pressable key={p.label} onPress={() => router.push(p.route as never)} accessibilityRole="button" className="items-center" style={{ width: (width - 24) / 6 }}>
              <View style={{ backgroundColor: `${p.color}1A` }} className="h-11 w-11 items-center justify-center rounded-2xl">
                <Ionicons name={p.icon} size={22} color={p.color} />
              </View>
              <Text className="mt-1 text-[10px] font-semibold text-eco-dark" numberOfLines={1}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
