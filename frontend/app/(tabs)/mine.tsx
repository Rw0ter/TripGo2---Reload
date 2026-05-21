import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { comingSoon } from '@/lib/coming-soon';
import { useAuthStore } from '@/stores/auth';

const avatarPlaceholder = require('../../assets/legacy/img/wccpImg/fslncmssh.png');
const iconMsg = require('../../assets/legacy/img/mine/xx.png');
const iconSet = require('../../assets/legacy/img/mine/sz.png');
const iconArrow = require('../../assets/legacy/img/mine/jinru.png');
const iconWallet = require('../../assets/legacy/img/mine/qb.png');
const iconCoupon = require('../../assets/legacy/img/mine/jb.png');

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
  { icon: require('../../assets/legacy/img/mine/hdsc.png'), label: '活动收藏' },
  { icon: require('../../assets/legacy/img/mine/dkjd.png'), label: '打卡景点' },
  { icon: require('../../assets/legacy/img/mine/dzgl.png'), label: '跑团管理' },
  { icon: require('../../assets/legacy/img/mine/wdyx.png'), label: '我的研学' },
  { icon: require('../../assets/legacy/img/mine/cgyy.png'), label: '场馆购票' },
  { icon: require('../../assets/legacy/img/mine/wdjf.png'), label: '我的积分' },
  { icon: require('../../assets/legacy/img/mine/fbqz.png'), label: '发布圈子' },
  { icon: require('../../assets/legacy/img/mine/wdkc.png'), label: '我的课程' },
  { icon: require('../../assets/legacy/img/mine/yqhy.png'), label: '邀请好友' },
];

// 我的（对应 Legacy mine1.html）：标题栏 + 资料卡 + 钱包/券包 + 我的订单 + 更多服务。
export default function MineScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  return (
    <View className="flex-1 bg-[#F8F5E6]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}>
        {/* 标题栏 */}
        <Animated.View
          entering={FadeInDown.duration(420)}
          style={{ paddingTop: insets.top + 10 }}
          className="px-4 pb-2">
          <Text className="text-center text-lg font-bold text-[#2f2f2f]">
            我的
          </Text>
          <View className="absolute right-4 flex-row gap-4" style={{ top: insets.top + 8 }}>
            <Pressable onPress={() => comingSoon('消息')} accessibilityLabel="消息">
              <Image source={iconMsg} resizeMode="contain" style={{ width: 22, height: 22 }} />
            </Pressable>
            <Pressable onPress={() => comingSoon('设置')} accessibilityLabel="设置">
              <Image source={iconSet} resizeMode="contain" style={{ width: 22, height: 22 }} />
            </Pressable>
          </View>
        </Animated.View>

        {/* 资料卡 */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(420)}
          className="mx-4 mb-4 mt-1 flex-row items-center">
          <View
            className="h-[60px] w-[60px] items-center justify-center rounded-full"
            style={{ borderWidth: 4, borderColor: '#9F8B5D' }}>
            <Image
              source={avatarPlaceholder}
              style={{ width: 46, height: 46, borderRadius: 23 }}
            />
          </View>
          <Pressable
            onPress={() => comingSoon('编辑资料')}
            accessibilityRole="button"
            accessibilityLabel="编辑个人资料"
            className="ml-4 flex-1 flex-row items-center">
            <View className="flex-1">
              <Text className="text-base font-bold text-[#292826]">
                {user?.username ?? '未登录'}
              </Text>
              <Text className="mt-1 text-[13px] text-[#8C836D]">
                积分：{user?.points ?? 0}
              </Text>
            </View>
            <Image
              source={iconArrow}
              resizeMode="contain"
              style={{ width: 18, height: 18 }}
            />
          </Pressable>
        </Animated.View>

        {/* 钱包 / 券包 —— 余额与券数取自后端用户档案（auth /me） */}
        <Animated.View
          entering={FadeInDown.delay(140).duration(420)}
          className="mx-4 mb-4 flex-row gap-3">
          <Pressable
            onPress={() => comingSoon('钱包')}
            accessibilityRole="button"
            accessibilityLabel="钱包"
            className="flex-1 flex-row items-center justify-around rounded-2xl bg-[#ECD8AD] px-3 py-3">
            <View>
              <Text className="text-[13px] text-[#7B6F55]">钱包</Text>
              <Text className="mt-0.5 text-base font-bold text-[#2e2e2e]">
                ￥{(user?.balance ?? 0).toFixed(2)}
              </Text>
            </View>
            <Image source={iconWallet} resizeMode="contain" style={{ width: 32, height: 32 }} />
          </Pressable>
          <Pressable
            onPress={() => comingSoon('券包')}
            accessibilityRole="button"
            accessibilityLabel="券包"
            className="flex-1 flex-row items-center justify-around rounded-2xl bg-[#ECD8AD] px-3 py-3">
            <View>
              <Text className="text-[13px] text-[#7B6F55]">券包</Text>
              <Text className="mt-0.5 text-base font-bold text-[#2e2e2e]">
                {user?.couponCount ?? 0} 张可用
              </Text>
            </View>
            <Image source={iconCoupon} resizeMode="contain" style={{ width: 32, height: 32 }} />
          </Pressable>
        </Animated.View>

        {/* 我的订单 */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(420)}
          style={{ boxShadow: '0px 3px 10px rgba(0,0,0,0.03)' }}
          className="mx-4 rounded-2xl bg-[#FDFAF2] px-3 pb-3 pt-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-[#3a372f]">我的订单</Text>
            <Pressable onPress={() => comingSoon('全部订单')}>
              <Text className="text-[13px] text-[#9C8E7A]">全部订单 &gt;</Text>
            </Pressable>
          </View>
          <View className="flex-row justify-between">
            {ORDERS.map((it) => (
              <Pressable
                key={it.label}
                onPress={() => comingSoon(it.label)}
                accessibilityRole="button"
                accessibilityLabel={it.label}
                className="items-center py-1">
                <Image source={it.icon} resizeMode="contain" style={{ width: 30, height: 30 }} />
                <Text className="mt-1.5 text-[12px] text-[#726A57]">
                  {it.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* 更多服务 */}
        <Animated.View
          entering={FadeInDown.delay(260).duration(420)}
          style={{ boxShadow: '0px 3px 10px rgba(0,0,0,0.03)' }}
          className="mx-4 mt-4 rounded-2xl bg-[#FDFAF2] px-3 pb-2 pt-3">
          <Text className="mb-1 text-[15px] font-bold text-[#3a372f]">
            更多服务
          </Text>
          <View className="flex-row flex-wrap">
            {SERVICES.map((it) => (
              <Pressable
                key={it.label}
                onPress={() => comingSoon(it.label)}
                accessibilityRole="button"
                accessibilityLabel={it.label}
                className="w-1/4 items-center py-3">
                <Image source={it.icon} resizeMode="contain" style={{ width: 36, height: 36 }} />
                <Text className="mt-1.5 text-[12px] text-[#6F6756]">
                  {it.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
