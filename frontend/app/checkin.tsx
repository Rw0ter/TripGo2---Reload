import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { apiRequest } from '@/lib/api';
import { ScreenHeader } from '@/components/ui/screen-header';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckinStatus {
  checkedIn: boolean;
  todayPoints: number;
  totalDays: number;
}

interface UserProfile {
  points: number;
}

interface TaskDef {
  id: string;
  title: string;
  sub: string;
  coin: number;
  action: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const DAILY_TASKS: TaskDef[] = [
  { id: 'daily_signin',  title: '每日签到', sub: '签到得积分，每日签到得', coin: 20,  action: '去签到', icon: 'calendar-outline' },
  { id: 'browse_spots',  title: '浏览景点', sub: '浏览指定景点15s，得',  coin: 30,  action: '去浏览', icon: 'eye-outline' },
  { id: 'post_story',    title: '发布动态', sub: '发布一条社区动态，得',  coin: 50,  action: '去发布', icon: 'chatbubble-outline' },
  { id: 'invite_friend', title: '邀请好友', sub: '邀请好友注册，得',      coin: 100, action: '去邀请', icon: 'person-add-outline' },
  { id: 'complete_quiz', title: '完成答题', sub: '完成当日答题挑战，得',  coin: 40,  action: '去答题', icon: 'school-outline' },
];

const CHARITY_IMAGE = 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=300&fit=crop';

// ---------------------------------------------------------------------------
// Collapsible charity panel with animated chevron
// ---------------------------------------------------------------------------

function CharitySection({
  expanded, onToggle, donated, userPoints, onDonate,
}: {
  expanded: boolean; onToggle: () => void;
  donated: boolean; userPoints: number; onDonate: () => void;
}) {
  const rotateAnim = useRef(new RNAnimated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View className="mx-[3.5vw] mt-[1.8vh] rounded-[9px] bg-white px-[2.8vw] py-[1.4vh]"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      {/* Header */}
      <Pressable onPress={onToggle} className="flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-[#3c3a2b]">积分慈爱心</Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[12px] text-[#b3ad96]">爱心公益</Text>
          <RNAnimated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-forward" size={14} color="#b3ad96" />
          </RNAnimated.View>
        </View>
      </Pressable>

      {/* Collapsible body */}
      {expanded && (
        <View className="mt-[1.2vh] overflow-hidden rounded-xl bg-[#F9FBF9]">
          {/* Real image */}
          <Image
            source={{ uri: CHARITY_IMAGE }}
            style={{ width: '100%', height: 140 }}
            resizeMode="cover"
          />
          {/* Info section */}
          <View className="p-4">
            <Text className="text-[15px] font-extrabold text-[#2D3748]">助力古籍修复传承</Text>
            <Text className="mt-1.5 text-[13px] leading-5 text-[#718096]">
              每一分积分都可变成一份修复材料，累计帮助修复更多古籍文献。广东省立中山图书馆每年修复古籍逾千册，您的支持将直接助力岭南文化保护。
            </Text>
            {/* Stats row */}
            <View className="mt-4 flex-row items-center justify-between rounded-xl bg-[#F3FAF5] px-4 py-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="people-outline" size={18} color="#386641" />
                <View>
                  <Text className="text-[16px] font-extrabold text-[#386641]">2,847</Text>
                  <Text className="text-[10px] text-[#8CAA95]">已参与人数</Text>
                </View>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: '#C8E6CD' }} />
              <View className="flex-row items-center gap-2">
                <Ionicons name="library-outline" size={18} color="#386641" />
                <View>
                  <Text className="text-[16px] font-extrabold text-[#386641]">1,023</Text>
                  <Text className="text-[10px] text-[#8CAA95]">已修复册数</Text>
                </View>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: '#C8E6CD' }} />
              <View className="flex-row items-center gap-2">
                <Ionicons name="star-outline" size={18} color="#386641" />
                <View>
                  <Text className="text-[16px] font-extrabold text-[#386641]">142,350</Text>
                  <Text className="text-[10px] text-[#8CAA95]">已捐积分</Text>
                </View>
              </View>
            </View>

            {/* Donate CTA */}
            <View className="mt-4 flex-row items-center justify-between rounded-xl bg-[#E8F5E9] px-4 py-3.5">
              <View>
                <Text className="text-[14px] font-bold text-[#386641]">捐赠 50 积分</Text>
                <Text className="mt-0.5 text-[11px] text-[#8CAA95]">为古籍修复贡献一份力</Text>
              </View>
              <Pressable
                onPress={onDonate}
                disabled={donated || userPoints < 50}
                className={`rounded-full px-6 py-2.5 ${donated ? 'bg-[#8CAA95]' : 'bg-[#386641]'}`}>
                <Text className="text-[14px] font-bold text-white">
                  {donated ? '已捐助' : '立即捐赠'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CheckinScreen() {
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());
  const [donated, setDonated] = useState(false);
  const [donateExpanded, setDonateExpanded] = useState(true);

  const load = useCallback(async () => {
    try {
      const [status, profile] = await Promise.all([
        apiRequest<CheckinStatus>('/checkin/status', { auth: true }),
        apiRequest<UserProfile>('/auth/me', { auth: true }),
      ]);
      setCheckinStatus(status);
      setUserPoints(profile.points);
      if (status.checkedIn) setDoneTasks((prev) => new Set(prev).add('daily_signin'));
    } catch { /* stale */ }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function doCheckin() {
    if (loading || checkinStatus?.checkedIn) return;
    setLoading(true);
    try {
      const result = await apiRequest<{ points: number; totalDays: number }>('/checkin', { method: 'POST', auth: true });
      setCheckinStatus({ checkedIn: true, todayPoints: result.points, totalDays: result.totalDays });
      setDoneTasks((prev) => new Set(prev).add('daily_signin'));
      const profile = await apiRequest<UserProfile>('/auth/me', { auth: true });
      setUserPoints(profile.points);
    } catch { /* already checked in */ }
    finally { setLoading(false); }
  }

  function doTask(taskId: string) { setDoneTasks((prev) => new Set(prev).add(taskId)); }

  async function doDonate() {
    if (donated || userPoints < 50) return;
    setUserPoints((p) => p - 50);
    setDonated(true);
  }

  const checkedIn = checkinStatus?.checkedIn ?? false;

  return (
    <View className="flex-1 bg-[#FBF7E9]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="福利中心" subtitle="福利商城" tint="light" />

        {/* ── Points banner — green gradient ─────────────────────── */}
        <View className="mx-[3.5vw] mt-4 overflow-hidden rounded-[12px]">
          <LinearGradient
            colors={['#1B4332', '#2D6A4F', '#40916C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.7 }}
            style={{ paddingHorizontal: 15, paddingVertical: 26 }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[13px] text-white/90">积分总览</Text>
                <View className="mt-0.5 flex-row items-baseline gap-2">
                  <Text className="text-[40px] font-medium leading-[48px] text-white">{userPoints}</Text>
                  <Text className="text-[14px] text-white/95">积分</Text>
                </View>
                <Text className="mt-0.5 text-[13px] text-white/95">积分明细 &gt;</Text>
              </View>

              <View className="items-center justify-center gap-1">
                {!checkinStatus ? (
                  <ActivityIndicator color="#fff" />
                ) : checkedIn ? (
                  <View className="items-center rounded-2xl bg-white/20 px-5 py-3">
                    <Ionicons name="checkmark-circle" size={28} color="#fff" />
                    <Text className="mt-1 text-[15px] font-bold text-white">已签到</Text>
                  </View>
                ) : (
                  <Pressable onPress={doCheckin} disabled={loading}
                    className="items-center rounded-lg bg-white px-5 py-2.5 shadow-sm">
                    <Text className="text-[15px] font-bold text-[#386641]">{loading ? '签到中...' : '立即签到'}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Daily tasks card ──────────────────────────────────── */}
        <View className="mx-[3.5vw] mt-[1.8vh] rounded-[9px] bg-white px-[2.8vw] py-[1.4vh]"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
          <Text className="text-[16px] font-extrabold text-[#3c3a2b]">日常活动</Text>

          {DAILY_TASKS.map((task) => {
            const isDone = task.id === 'daily_signin' ? checkedIn : doneTasks.has(task.id);
            const isSigninTask = task.id === 'daily_signin';
            return (
              <View key={task.id} className="flex-row items-center gap-[2.8vw] border-t border-[#F0EFE8] py-[1.6vh]">
                <View className="h-[40px] w-[40px] items-center justify-center rounded-full bg-[#E8F5E9]">
                  <Ionicons name={task.icon} size={20} color="#386641" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[14px] font-bold text-[#3b392b]">{task.title}</Text>
                  <Text className="text-[12px] text-[#b0ac96]">
                    {task.sub}<Text className="mx-0.5 font-extrabold text-[#386641]">{task.coin}</Text>积分
                  </Text>
                </View>
                <Pressable
                  onPress={() => { if (isSigninTask) doCheckin(); else doTask(task.id); }}
                  disabled={isDone || (isSigninTask && loading)}
                  className={`rounded-full px-[2.6vw] py-[0.8vh] ${isDone ? 'bg-[#f4f4f4]' : 'bg-[#E8F5E9]'}`}>
                  <Text className={`text-[13px] font-bold ${isDone ? 'text-[#999]' : 'text-[#386641]'}`}>
                    {isDone ? '已完成' : task.action}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* ── Charity section ──────────────────────────────────── */}
        <CharitySection
          expanded={donateExpanded}
          onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setDonateExpanded((v) => !v); }}
          donated={donated}
          userPoints={userPoints}
          onDonate={doDonate}
        />
      </ScrollView>
    </View>
  );
}
