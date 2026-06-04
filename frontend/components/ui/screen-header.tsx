// 精品导航栏 —— 参考 Twitter/X · Discord · QQ 设计语言
// 简约、轻盈、无圆背景的返回箭头 + 居中标题 + 可选右侧操作

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  subtitle?: string;
  tint?: 'dark' | 'light';  // dark=白字透明底, light=深字浅底
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, tint = 'dark', right }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isDark = tint === 'dark';

  return (
    <View
      style={{
        paddingTop: insets.top + 6,
        backgroundColor: isDark ? 'transparent' : '#fff',
        borderBottomWidth: isDark ? 0 : 0.5,
        borderBottomColor: isDark ? 'transparent' : '#E5E5E5',
      }}
      className="px-3 pb-3">
      <View className="flex-row items-center">
        {/* 返回 —— 纯粹箭头，无背景圆 */}
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          hitSlop={8}>
          <Ionicons
            name="chevron-back"
            size={23}
            color={isDark ? '#fff' : '#1a1a1a'}
          />
        </Pressable>

        {/* 标题区 */}
        <View className="ml-1 flex-1">
          <Text
            className="text-[17px] font-bold"
            style={{ color: isDark ? '#fff' : '#1a1a1a', letterSpacing: -0.2 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="mt-0.5 text-[12px]"
              style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#8E8E93' }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* 右侧操作 */}
        {right ? (
          <View className="ml-2 flex-row items-center">{right}</View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
    </View>
  );
}
