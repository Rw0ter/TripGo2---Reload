import { type ReactNode, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';

const bg = require('../../assets/legacy/img/beijing.png');

interface AuthScreenLayoutProps {
  children: ReactNode;
}

// 登录 / 注册共用外壳（对应 Legacy login.html）：beijing 岭南山水背景铺满屏幕 + 问候语 + 键盘避让滚动区。
export function AuthScreenLayout({ children }: AuthScreenLayoutProps) {
  const { width, height } = useWindowDimensions();

  // 「你好~」柔和白色光晕呼吸——提升在山水背景上的可读性，保持克制不做霓虹/赛博感。
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(glow);
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 6 + glow.value * 8,
  }));

  return (
    <View className="flex-1 bg-white">
      <Image
        source={bg}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerClassName="flex-grow px-7 pb-8 pt-10"
            keyboardShouldPersistTaps="handled">
            <View>
              <Animated.Text
                entering={FadeInDown.duration(500)}
                className="text-3xl font-bold text-[#00724C]"
                style={[
                  {
                    textShadowColor: 'rgba(255,255,255,0.9)',
                    textShadowOffset: { width: 0, height: 0 },
                  },
                  glowStyle,
                ]}>
                你好~
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(120).duration(500)}
                className="mt-1 text-lg font-semibold text-[#00724C]"
                style={{
                  textShadowColor: 'rgba(255,255,255,0.85)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                }}>
                欢迎来到绿途APP
              </Animated.Text>
            </View>
            <View className="mt-10 flex-1 justify-center">{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
