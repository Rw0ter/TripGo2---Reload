import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';

// 真实 CC0 阳光森林树冠（见 onboarding/CREDITS.md）。
const bg = require('../../assets/images/onboarding/intro_bg.jpg');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const FEATURES: { icon: IoniconName; label: string }[] = [
  { icon: 'flash', label: '绿色能量' },
  { icon: 'leaf', label: '虚拟种树' },
  { icon: 'people', label: '低碳社区' },
];

// 登录 / 注册 / 找回密码 共用外壳：全屏沉浸式森林 + 品牌时刻 + 价值主张行 +
// 浮起的表单卡片（入场动画），追求现代大厂高级感。
export function AuthScreenLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();

  return (
    <View className="flex-1 bg-eco-dark">
      <Image source={bg} resizeMode="cover" style={{ position: 'absolute', top: 0, width, height }} />
      <LinearGradient
        colors={['rgba(8,30,20,0.35)', 'rgba(8,30,20,0.55)', 'rgba(8,30,20,0.93)']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', top: 0, width, height }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerClassName="flex-grow justify-end"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* 品牌时刻 */}
            <View className="items-center px-7 pb-7 pt-14">
              <Animated.View
                entering={FadeInDown.duration(600)}
                className="h-[74px] w-[74px] items-center justify-center rounded-[26px] bg-white/15"
                style={{ boxShadow: '0px 10px 34px rgba(82,183,136,0.5)' }}>
                <Ionicons name="leaf" size={40} color="#B7F5C9" />
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.delay(120).duration(600)}
                className="mt-4 text-[30px] font-extrabold text-white"
                style={{ letterSpacing: 3 }}>
                绿途
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(220).duration(600)}
                className="mt-1.5 text-[14px] text-white/75">
                每一次绿色选择，都在为地球减负
              </Animated.Text>

              {/* 价值主张行 */}
              <Animated.View entering={FadeIn.delay(380).duration(700)} className="mt-6 flex-row gap-7">
                {FEATURES.map((f) => (
                  <View key={f.label} className="items-center">
                    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                      <Ionicons name={f.icon} size={20} color="#D8F3DC" />
                    </View>
                    <Text className="mt-1.5 text-[11px] text-white/70">{f.label}</Text>
                  </View>
                ))}
              </Animated.View>
            </View>

            {/* 表单卡片 */}
            <Animated.View
              entering={FadeInUp.duration(600)}
              className="rounded-t-[34px] bg-white px-7 pb-10 pt-7"
              style={{ minHeight: height * 0.5, boxShadow: '0px -12px 44px rgba(0,0,0,0.32)' }}>
              <Text className="text-[23px] font-extrabold text-eco-dark">{title}</Text>
              {subtitle ? <Text className="mt-1.5 text-[14px] text-eco-mid/70">{subtitle}</Text> : null}
              <View className="mt-6">{children}</View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
