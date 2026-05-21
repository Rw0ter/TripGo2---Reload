import type { ReactNode } from 'react';
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

const bg = require('../../assets/legacy/img/beijing.png');

interface AuthScreenLayoutProps {
  children: ReactNode;
}

// 登录 / 注册共用外壳（对应 Legacy login.html）：beijing 岭南山水背景铺满屏幕 + 问候语 + 键盘避让滚动区。
export function AuthScreenLayout({ children }: AuthScreenLayoutProps) {
  const { width, height } = useWindowDimensions();
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
            <Animated.View entering={FadeInDown.duration(500)}>
              <Text className="text-3xl font-bold text-[#00724C]">你好~</Text>
              <Text className="mt-1 text-lg font-semibold text-[#00724C]">
                欢迎来到文脉粤游APP
              </Text>
            </Animated.View>
            <View className="mt-10 flex-1 justify-center">{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
