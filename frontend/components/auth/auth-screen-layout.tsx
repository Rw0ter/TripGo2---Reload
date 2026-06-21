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

// 登录 / 注册 / 找回密码 共用外壳：整屏沉浸式森林 + 居中玻璃拟态表单卡。
// 刻意不用"大图在上、白卡在下"的列表式骨架——表单浮于画面中央，独立且有高级感。
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
      {/* 深绿压暗：营造沉浸感，并保证玻璃卡 + 白色文字可读 */}
      <LinearGradient
        colors={['rgba(7,28,19,0.5)', 'rgba(7,28,19,0.72)', 'rgba(7,28,19,0.86)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, width, height }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerClassName="flex-grow justify-center px-6 py-10"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* 品牌时刻 */}
            <Animated.View entering={FadeInDown.duration(600)} className="mb-7 items-center">
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

            {/* 居中玻璃拟态表单卡 */}
            <Animated.View
              entering={FadeInUp.delay(120).duration(600)}
              className="rounded-[28px] px-6 py-7"
              style={[
                {
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  boxShadow: '0px 18px 44px rgba(0,0,0,0.38)',
                },
                Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as object) : null,
              ]}>
              <Text className="text-[22px] font-extrabold text-white">{title}</Text>
              {subtitle ? <Text className="mt-1.5 text-[13px] text-white/65">{subtitle}</Text> : null}
              <View className="mt-6">{children}</View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
