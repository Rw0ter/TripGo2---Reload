import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { comingSoon } from '@/lib/coming-soon';
import { useAuthStore } from '@/stores/auth';

const avatarPlaceholder = require('../../assets/legacy/img/wccpImg/fslncmssh.png');

const ORDERS = [
  { icon: require('../../assets/legacy/img/mine/dfk.png'), label: '待付款' },
  { icon: require('../../assets/legacy/img/mine/dfh.png'), label: '待发货' },
  { icon: require('../../assets/legacy/img/mine/dsh.png'), label: '待收货' },
  { icon: require('../../assets/legacy/img/mine/ywc.png'), label: '已完成' },
  { icon: require('../../assets/legacy/img/mine/sh.png'), label: '售后' },
];

const SERVICES = [
  { icon: require('../../assets/legacy/img/mine/zj.png'), label: '足迹' },
  { icon: require('../../assets/legacy/img/mine/dd.png'), label: '订单' },
  { icon: require('../../assets/legacy/img/mine/hdsc.png'), label: '绿色收藏' },
  { icon: require('../../assets/legacy/img/mine/dkjd.png'), label: '环保打卡' },
  { icon: require('../../assets/legacy/img/mine/dzgl.png'), label: '碳账户' },
  { icon: require('../../assets/legacy/img/mine/wdyx.png'), label: '绿色行动' },
  { icon: require('../../assets/legacy/img/mine/cgyy.png'), label: '积分兑换' },
  { icon: require('../../assets/legacy/img/mine/wdjf.png'), label: '我的积分' },
  { icon: require('../../assets/legacy/img/mine/fbqz.png'), label: '发布圈子' },
  { icon: require('../../assets/legacy/img/mine/wdkc.png'), label: '环保课程' },
  { icon: require('../../assets/legacy/img/mine/yqhy.png'), label: '邀请好友' },
];

// 我的发布：对应底部「+」发布的故事 / 动态内容入口。
const PUBLISH = [
  { icon: 'document-text-outline' as const, label: '我的故事' },
  { icon: 'create-outline' as const, label: '草稿箱' },
  { icon: 'heart-outline' as const, label: '获赞' },
  { icon: 'chatbubble-ellipses-outline' as const, label: '评论' },
];

// 区块卡通用包裹。
function Section({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View
      style={{ boxShadow: '0px 4px 14px rgba(0,0,0,0.06)' }}
      className="mx-4 mt-4 rounded-2xl bg-white px-3.5 py-3.5">
      {children}
    </View>
  );
}

function SectionTitle({
  title,
  onMore,
}: {
  title: string;
  onMore?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View
          style={{ width: 4, height: 16, borderRadius: 2 }}
          className="bg-primary"
        />
        <Text className="ml-2 text-[15px] font-bold text-[#3a372f]">
          {title}
        </Text>
      </View>
      {onMore ? (
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel={`查看全部${title}`}>
          <Text className="text-[12px] text-[#9C8E7A]">查看全部 ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// 个人中心（对应 Legacy mine1.html，整体重设计）：渐变 hero + 资产卡 +
// 我的订单 + 我的发布 + 更多服务 + 退出登录。
export default function MineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const points = user?.points ?? 0;
  const level = Math.floor(points / 100) + 1;
  const intoLevel = points % 100;

  function logout() {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/login');
        },
      },
    ]);
  }

  const stats = [
    { icon: 'wallet-outline' as const, value: `￥${(user?.balance ?? 0).toFixed(2)}`, label: '钱包', color: '#386641' },
    { icon: 'pricetags-outline' as const, value: `${user?.couponCount ?? 0}`, label: '优惠券', color: '#E0892F' },
    { icon: 'star-outline' as const, value: `${points}`, label: '积分', color: '#C9A24B' },
  ];

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        {/* 渐变 hero */}
        <LinearGradient colors={['#3E6B4F', '#5C8A6D']}>
          <View
            style={{ paddingTop: insets.top + 8 }}
            className="px-5 pb-16">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-white">个人中心</Text>
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => router.push('/messages')}
                  accessibilityRole="button"
                  accessibilityLabel="消息">
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="#ffffff"
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/settings')}
                  accessibilityRole="button"
                  accessibilityLabel="设置">
                  <Ionicons name="settings-outline" size={22} color="#ffffff" />
                </Pressable>
              </View>
            </View>

            {/* 资料 */}
            <Pressable
              onPress={() => router.push('/profile/edit')}
              accessibilityRole="button"
              accessibilityLabel="编辑个人资料"
              className="mt-4 flex-row items-center">
              <View
                style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.55)' }}
                className="rounded-full">
                <Image
                  source={avatarPlaceholder}
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                />
              </View>
              <View className="ml-3.5 flex-1">
                <Text className="text-xl font-extrabold text-white">
                  {user?.username ?? '未登录'}
                </Text>
                <View className="mt-1.5 flex-row">
                  <View className="rounded-full bg-white/20 px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-white">
                      Lv.{level} · 绿色生活倡导者
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.75)"
              />
            </Pressable>

            {/* 成长值进度 */}
            <View className="mt-3.5">
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-white/75">成长值</Text>
                <Text className="text-[11px] text-white/75">
                  {intoLevel}/100 升 Lv.{level + 1}
                </Text>
              </View>
              <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                <View
                  style={{ width: `${intoLevel}%` }}
                  className="h-1.5 rounded-full bg-white"
                />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 资产卡（钱包 / 优惠券 / 积分），上浮压住渐变 */}
        <Animated.View
          entering={FadeInDown.duration(420)}
          style={{ boxShadow: '0px 6px 18px rgba(0,0,0,0.10)' }}
          className="-mt-12 mx-4 flex-row rounded-2xl bg-white py-4">
          {stats.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={() => router.push('/wallet')}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              className="flex-1 flex-row items-center justify-center">
              {i > 0 ? (
                <View
                  style={{ width: 1, height: 30 }}
                  className="absolute left-0 bg-[#EFEBDC]"
                />
              ) : null}
              <Ionicons name={s.icon} size={20} color={s.color} />
              <View className="ml-2">
                <Text className="text-[16px] font-extrabold text-[#2e2e2e]">
                  {s.value}
                </Text>
                <Text className="text-[11px] text-[#8C836D]">{s.label}</Text>
              </View>
            </Pressable>
          ))}
        </Animated.View>

        {/* 我的订单 */}
        <Animated.View entering={FadeInDown.delay(80).duration(420)}>
          <Section>
            <SectionTitle
              title="我的订单"
              onMore={() => router.push('/orders')}
            />
            <View className="flex-row justify-between">
              {ORDERS.map((it) => (
                <Pressable
                  key={it.label}
                  onPress={() => router.push('/orders')}
                  accessibilityRole="button"
                  accessibilityLabel={it.label}
                  className="items-center py-1">
                  <Image
                    source={it.icon}
                    resizeMode="contain"
                    style={{ width: 30, height: 30 }}
                  />
                  <Text className="mt-1.5 text-[12px] text-[#726A57]">
                    {it.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>
        </Animated.View>

        {/* 我的发布 —— 对应底部「+」发布的故事内容 */}
        <Animated.View entering={FadeInDown.delay(160).duration(420)}>
          <Section>
            <SectionTitle
              title="我的发布"
              onMore={() => router.push('/my/stories')}
            />
            <View className="flex-row justify-around">
              {PUBLISH.map((it) => {
                const pubRoutes: Record<string, string> = { '我的故事': '/my/stories', '获赞': '/my/likes' };
                const target = pubRoutes[it.label];
                return (
                <Pressable
                  key={it.label}
                  onPress={() => target ? router.push(target as any) : comingSoon(it.label)}
                  accessibilityRole="button"
                  accessibilityLabel={it.label}
                  className="items-center py-1">
                  <Ionicons name={it.icon} size={26} color="#386641" />
                  <Text className="mt-2 text-[12px] text-[#726A57]">
                    {it.label}
                  </Text>
                </Pressable>
                );
              })}
            </View>
          </Section>
        </Animated.View>

        {/* 更多服务 */}
        <Animated.View entering={FadeInDown.delay(240).duration(420)}>
          <Section>
            <SectionTitle title="更多服务" />
            <View className="flex-row flex-wrap">
              {SERVICES.map((it) => {
                const routes: Record<string, string> = { '足迹': '/my/stories', '订单': '/orders', '绿色收藏': '/collections', '环保打卡': '/checkin', '绿色行动': '/green', '我的积分': '/wallet', '环保课程': '/green' };
                const target = routes[it.label];
                return (
                  <Pressable
                    key={it.label}
                    onPress={() => target ? router.push(target as any) : comingSoon(it.label)}
                    accessibilityRole="button"
                    accessibilityLabel={it.label}
                    className="w-1/4 items-center py-3">
                    <Image
                      source={it.icon}
                      resizeMode="contain"
                      style={{ width: 46, height: 46 }}
                    />
                    <Text className="mt-1.5 text-[12px] text-[#6F6756]">
                      {it.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </Animated.View>

        {/* 退出登录 */}
        {user ? (
          <Animated.View entering={FadeInDown.delay(320).duration(420)}>
            <Pressable
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="退出登录"
              style={{ boxShadow: '0px 4px 14px rgba(0,0,0,0.06)' }}
              className="mx-4 mt-4 flex-row items-center justify-center rounded-2xl bg-white py-3.5">
              <Ionicons name="log-out-outline" size={18} color="#C0584B" />
              <Text className="ml-1.5 text-[14px] font-semibold text-[#C0584B]">
                退出登录
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
