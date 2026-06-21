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
import { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';

// 真实 CC0 阳光森林树冠（见 onboarding/CREDITS.md）。
const bg = require('../../assets/images/onboarding/intro_bg.jpg');

// 登录 / 注册 / 找回密码 共用外壳：整屏沉浸式森林 + 居中表单（无卡片背景/描边，
// 表单直接浮于画面），仅留品牌时刻。外层左右内边距 0.5rem。
export function AuthScreenLayout({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();

  return (
    <View className="flex-1 bg-eco-dark">
      <Image source={bg} resizeMode="cover" style={{ position: 'absolute', top: 0, width, height }} />
      <LinearGradient
        colors={['rgba(7,28,19,0.45)', 'rgba(7,28,19,0.68)', 'rgba(7,28,19,0.85)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, width, height }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerClassName="flex-grow justify-center px-4 py-10"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* 品牌时刻 */}
            <Animated.View entering={FadeInDown.duration(600)} className="mb-9 items-center">
              <View
                className="h-[72px] w-[72px] items-center justify-center rounded-[26px] bg-white/15"
                style={{ boxShadow: '0px 12px 36px rgba(82,183,136,0.55)' }}>
                <Ionicons name="leaf" size={40} color="#B7F5C9" />
              </View>
              <Text className="mt-4 text-[30px] font-extrabold text-white" style={{ letterSpacing: 3 }}>
                绿途
              </Text>
              <Text className="mt-1.5 text-[13px] text-white/70">每一次绿色选择，都在为地球减负</Text>
            </Animated.View>

            {/* 表单（直接浮于森林，无卡片包裹） */}
            <Animated.View entering={FadeInUp.delay(120).duration(600)}>{children}</Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
