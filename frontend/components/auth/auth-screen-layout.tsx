import type { ReactNode } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const bg = require('../../assets/legacy/img/beijing.png');

interface AuthScreenLayoutProps {
  children: ReactNode;
}

// 登录 / 注册共用外壳（对应 Legacy login.css）：beijing 背景 + 问候语 + 键盘避让滚动区。
export function AuthScreenLayout({ children }: AuthScreenLayoutProps) {
  return (
    <ImageBackground source={bg} resizeMode="cover" className="flex-1">
      <SafeAreaView className="flex-1">
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
    </ImageBackground>
  );
}
