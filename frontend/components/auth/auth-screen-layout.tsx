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
import { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';

// 真实 CC0 绿色森林背景（见 onboarding/CREDITS.md）。
const bg = require('../../assets/images/onboarding/auth_bg.jpg');

interface AuthScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

// 登录 / 注册 / 找回密码 共用外壳：上半屏森林背景 + 品牌徽标，
// 下半屏白色圆角卡片承载表单（现代登录排版）。
export function AuthScreenLayout({ title, subtitle, children }: AuthScreenLayoutProps) {
  const { width, height } = useWindowDimensions();
  const bgH = Math.round(height * 0.46);

  return (
    <View className="flex-1 bg-eco-dark">
      <Image source={bg} resizeMode="cover" style={{ position: 'absolute', top: 0, width, height: bgH }} />
      <LinearGradient
        colors={['rgba(14,42,30,0.2)', 'rgba(14,42,30,0.5)']}
        style={{ position: 'absolute', top: 0, width, height: bgH }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerClassName="flex-grow justify-end"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* 背景上的品牌 */}
            <View className="items-center pb-7 pt-16">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
                <Ionicons name="leaf" size={34} color="#ffffff" />
              </View>
              <Text className="mt-3 text-2xl font-extrabold tracking-wide text-white">绿途</Text>
            </View>

            {/* 表单卡片 */}
            <Animated.View
              entering={FadeInDown.duration(500)}
              className="rounded-t-[32px] bg-white px-7 pb-10 pt-8"
              style={{ minHeight: height * 0.56 }}>
              <Text className="text-[24px] font-extrabold text-eco-dark">{title}</Text>
              {subtitle ? <Text className="mt-1.5 text-[14px] text-eco-mid/70">{subtitle}</Text> : null}
              <View className="mt-7">{children}</View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
