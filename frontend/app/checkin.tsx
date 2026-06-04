import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

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

// ---------------------------------------------------------------------------
// Daily task definitions (matching legacy visual design with the 5 tasks
// requested: 每日签到 / 浏览景点 / 发布动态 / 邀请好友 / 完成答题)
// ---------------------------------------------------------------------------

interface TaskDef {
  id: string;
  title: string;
  /** subtitle prefix - coin amount will be appended in orange */
  sub: string;
  coin: number;
  action: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const DAILY_TASKS: TaskDef[] = [
  {
    id: 'daily_signin',
    title: '每日签到',
    sub: '签到得积分，每日签到得',
    coin: 20,
    action: '去签到',
    icon: 'calendar-outline',
  },
  {
    id: 'browse_spots',
    title: '浏览景点',
    sub: '浏览指定景点15s，得',
    coin: 30,
    action: '去浏览',
    icon: 'eye-outline',
  },
  {
    id: 'post_story',
    title: '发布动态',
    sub: '发布一条社区动态，得',
    coin: 50,
    action: '去发布',
    icon: 'chatbubble-outline',
  },
  {
    id: 'invite_friend',
    title: '邀请好友',
    sub: '邀请好友注册，得',
    coin: 100,
    action: '去邀请',
    icon: 'person-add-outline',
  },
  {
    id: 'complete_quiz',
    title: '完成答题',
    sub: '完成当日答题挑战，得',
    coin: 40,
    action: '去答题',
    icon: 'school-outline',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CheckinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ---- server data ------------------------------------------------
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [userPoints, setUserPoints] = useState(0);

  // ---- UI state ---------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());
  const [donated, setDonated] = useState(false);
  const [donateExpanded, setDonateExpanded] = useState(true);

  // ---- load: checkin status + user profile (real points) ----------
  const load = useCallback(async () => {
    try {
      const [status, profile] = await Promise.all([
        apiRequest<CheckinStatus>('/checkin/status', { auth: true }),
        apiRequest<UserProfile>('/auth/me', { auth: true }),
      ]);
      setCheckinStatus(status);
      setUserPoints(profile.points);
      if (status.checkedIn) {
        setDoneTasks((prev) => new Set(prev).add('daily_signin'));
      }
    } catch {
      // Keep stale data
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ---- sign-in (real API) -----------------------------------------
  async function doCheckin() {
    if (loading || checkinStatus?.checkedIn) return;
    setLoading(true);
    try {
      const result = await apiRequest<{ points: number; totalDays: number }>(
        '/checkin',
        { method: 'POST', auth: true },
      );
      setCheckinStatus({
        checkedIn: true,
        todayPoints: result.points,
        totalDays: result.totalDays,
      });
      setDoneTasks((prev) => new Set(prev).add('daily_signin'));
      // refresh actual user points from server
      const profile =
        await apiRequest<UserProfile>('/auth/me', { auth: true });
      setUserPoints(profile.points);
    } catch {
      // already checked in or network error — ignore
    } finally {
      setLoading(false);
    }
  }

  // ---- non-signin task (client-side tracking, no backend endpoint yet)
  function doTask(taskId: string) {
    setDoneTasks((prev) => new Set(prev).add(taskId));
  }

  // ---- donate (deduct 50 points client-side) ----------------------
  async function doDonate() {
    if (donated || userPoints < 50) return;
    setUserPoints((p) => p - 50);
    setDonated(true);
  }

  // ---- derived ----------------------------------------------------
  const checkedIn = checkinStatus?.checkedIn ?? false;

  // =================================================================
  // Render
  // =================================================================
  return (
    <View className="flex-1 bg-[#FBF7E9]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* Top bar — matching Legacy qd.html topbar                  */}
        {/* ========================================================= */}
        <View
          style={{ paddingTop: insets.top + 6 }}
          className="flex-row items-center border-b border-[#f0ead6] bg-[#FBF7E9] px-[3.5vw] pb-3"
        >
          {/* Back button: round, white circle (36px) */}
          <Pressable
            onPress={() => router.back()}
            className="mr-[2vw] h-[36px] w-[36px] items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="chevron-back" size={20} color="#3c3a2b" />
          </Pressable>

          <Text className="text-[18px] font-bold text-[#3c3a2b]">
            福利中心
          </Text>
          <Text className="ml-[2vw] text-[14px] text-[#b8b29a]">
            福利商城
          </Text>
        </View>

        {/* ========================================================= */}
        {/* Points banner — orange-red gradient card                 */}
        {/* ========================================================= */}
        <View className="mx-[3.5vw] mt-4 overflow-hidden rounded-[12px]">
          <LinearGradient
            colors={['#FF6B19', '#ff4040', '#ff7070']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 15, paddingVertical: 26 }}
          >
            <View className="flex-row items-center justify-between">
              {/* ---- Left: points overview ---- */}
              <View>
                <Text className="text-[13px] text-white/90">积分总览</Text>
                <View className="mt-0.5 flex-row items-baseline gap-2">
                  <Text className="text-[40px] font-medium leading-[48px] text-white">
                    {userPoints}
                  </Text>
                  <Text className="text-[14px] text-white/95">积分</Text>
                </View>
                <Text className="mt-0.5 text-[13px] text-white/95 underline">
                  积分明细 &gt;
                </Text>
              </View>

              {/* ---- Right: sign-in state ---- */}
              <View className="items-center justify-center gap-1">
                {!checkinStatus ? (
                  <ActivityIndicator color="#fff" />
                ) : checkedIn ? (
                  <View className="items-center rounded-2xl bg-white/20 px-5 py-3">
                    <Ionicons
                      name="checkmark-circle"
                      size={28}
                      color="#fff"
                    />
                    <Text className="mt-1 text-[15px] font-bold text-white">
                      已签到
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={doCheckin}
                    disabled={loading}
                    className="items-center rounded-lg bg-white px-5 py-2.5 shadow-sm"
                  >
                    <Text className="text-[15px] font-bold text-[#FF6F3D]">
                      {loading ? '签到中...' : '立即签到'}
                    </Text>
                    <Text className="mt-0.5 text-[12px] text-[#FF6F3D]/70">
                      +20 积分
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ========================================================= */}
        {/* Daily tasks card ("日常活动")                              */}
        {/* ========================================================= */}
        <View className="mx-[3.5vw] mt-[1.8vh] rounded-[9px] bg-white px-[2.8vw] py-[1.4vh] shadow-sm">
          {/* Card header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {/* dot matching legacy */}
              <View className="h-[14px] w-[14px] rounded-full bg-[#e3dcc2]" />
              <Text className="text-[16px] font-extrabold text-[#3c3a2b]">
                日常活动
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="wifi-outline" size={14} color="#b3ad96" />
              <Text className="text-[13px] text-[#b3ad96]">在线</Text>
            </View>
          </View>

          {/* Task rows */}
          {DAILY_TASKS.map((task) => {
            const isDone =
              task.id === 'daily_signin' ? checkedIn : doneTasks.has(task.id);
            const isSigninTask = task.id === 'daily_signin';

            return (
              <View
                key={task.id}
                className="flex-row items-center gap-[2.8vw] border-t border-[#F0EFE8] py-[1.6vh]"
              >
                {/* ---- Icon placeholder (40px circle, peach bg) ---- */}
                <View className="h-[40px] w-[40px] items-center justify-center rounded-full bg-[#FFF3E9]">
                  <Ionicons name={task.icon} size={20} color="#F39D62" />
                </View>

                {/* ---- Task info ---- */}
                <View className="flex-1 gap-0.5">
                  <Text className="text-[14px] font-bold text-[#3b392b]">
                    {task.title}
                  </Text>
                  <Text className="text-[12px] text-[#b0ac96]">
                    {task.sub}
                    <Text className="mx-0.5 font-extrabold text-[#F5A232]">
                      {task.coin}
                    </Text>
                    积分
                  </Text>
                </View>

                {/* ---- Action button ---- */}
                <Pressable
                  onPress={() => {
                    if (isSigninTask) doCheckin();
                    else doTask(task.id);
                  }}
                  disabled={isDone || (isSigninTask && loading)}
                  className={`rounded-full px-[2.6vw] py-[0.8vh] ${
                    isDone ? 'bg-[#f4f4f4]' : 'bg-[#FFEDE4]'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-bold ${
                      isDone ? 'text-[#999]' : 'text-[#FF7E53]'
                    }`}
                  >
                    {isDone ? '已完成' : task.action}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* ========================================================= */}
        {/* Charity / Donate card ("积分慈爱心")                      */}
        {/* ========================================================= */}
        <View className="mx-[3.5vw] mt-[1.8vh] rounded-[9px] bg-white px-[2.8vw] py-[1.4vh] shadow-sm">
          {/* Header with collapse toggle */}
          <Pressable
            onPress={() => setDonateExpanded((v) => !v)}
            className="flex-row items-center justify-between"
          >
            <Text className="text-[16px] font-extrabold text-[#3c3a2b]">
              积分慈爱心
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[13px] text-[#b3ad96]">
                {donateExpanded ? '▼' : '▲'} 爱心公益
              </Text>
            </View>
          </Pressable>

          {donateExpanded && (
            <View className="mt-[1.2vh] flex-row items-center gap-[2.4vw] rounded-[9px] border border-dashed border-[#F3E2C8] bg-[#FFF8ED] px-[2.4vw] py-[1.6vh]">
              {/* Thumbnail placeholder */}
              <View className="h-[18vh] w-[28vw] items-center justify-center rounded-[7px] bg-[#EDEDED]">
                <Ionicons name="book-outline" size={28} color="#8c8c8c" />
              </View>

              {/* Body */}
              <View className="flex-1 gap-[0.8vh]">
                <Text className="text-[14px] font-extrabold text-[#4a4736]">
                  助力古籍修复传承
                </Text>
                <Text
                  className="text-[12px] leading-[1.4] text-[#8f8a75]"
                  numberOfLines={3}
                >
                  每一分积分都可变成一份修复材料，累计帮助修复更多古籍文献。
                </Text>
              </View>

              {/* Help button */}
              <Pressable
                onPress={doDonate}
                disabled={donated || userPoints < 50}
                className={`rounded-full px-[2.8vw] py-[1vh] ${
                  donated ? 'bg-[#ffb49a]' : 'bg-[#FF8B5E]'
                }`}
                style={
                  donated
                    ? undefined
                    : {
                        shadowColor: '#FF7846',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.28,
                        shadowRadius: 6,
                        elevation: 4,
                      }
                }
              >
                <Text className="text-[14px] font-extrabold text-white">
                  {donated ? '已捐助' : '帮助TA'}
                </Text>
                {!donated && (
                  <Text className="text-center text-[10px] text-white/80">
                    50积分
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
