import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Image, type ImageSourcePropType, Pressable, Text, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';

// 底部导航（100% 复刻 Legacy index1.html 的 .mui-bar-tab）：
// 白底 + 顶部浅灰投影，PNG 图标，激活态换 _ac 图 + 绿色文字 + 轻微缩放呼吸。
const ACTIVE = '#357F70';
const INACTIVE = '#BFC3C2';

const TABS: Record<
  string,
  { label: string; icon: ImageSourcePropType; iconActive: ImageSourcePropType }
> = {
  home: {
    label: '首页',
    icon: require('../assets/legacy/img/nav/shouye.png'),
    iconActive: require('../assets/legacy/img/nav/shouye_ac.png'),
  },
  itinerary: {
    label: '行程',
    icon: require('../assets/legacy/img/nav/xingcheng.png'),
    iconActive: require('../assets/legacy/img/nav/xingcheng_ac.png'),
  },
  community: {
    label: '社区',
    icon: require('../assets/legacy/img/nav/shequ.png'),
    iconActive: require('../assets/legacy/img/nav/shequ_ac.png'),
  },
  mine: {
    label: '我的',
    icon: require('../assets/legacy/img/nav/mine.png'),
    iconActive: require('../assets/legacy/img/nav/mine_ac.png'),
  },
};
const addIcon = require('../assets/legacy/img/add.png');

// 普通 tab 项：图标 + 文字，激活时图标做轻微缩放呼吸（对应 Legacy activePulse）。
function TabItem({
  active,
  label,
  icon,
  iconActive,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: ImageSourcePropType;
  iconActive: ImageSourcePropType;
  onPress: () => void;
}) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [active, pulse]);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.1 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      className="flex-1 items-center justify-center">
      <Animated.View style={iconStyle}>
        <Image
          source={active ? iconActive : icon}
          resizeMode="contain"
          style={{ width: 28, height: 28 }}
        />
      </Animated.View>
      <Text
        style={{ color: active ? ACTIVE : INACTIVE }}
        className="mt-1 text-[12px] font-semibold">
        {label}
      </Text>
    </Pressable>
  );
}

interface LegacyTabBarProps extends BottomTabBarProps {
  // 中间「发布」按钮不进入页面，点击弹出创建动作菜单。
  onAddPress: () => void;
}

export function LegacyTabBar({
  state,
  navigation,
  onAddPress,
}: LegacyTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom,
        boxShadow: '0px -2px 14px rgba(213,213,213,0.55)',
      }}
      className="flex-row items-stretch bg-white">
      {state.routes.map((route, index) => {
        const active = state.index === index;

        if (route.name === 'add') {
          return (
            <Pressable
              key={route.key}
              onPress={onAddPress}
              accessibilityRole="button"
              accessibilityLabel="发布"
              className="flex-1 items-center justify-center">
              <Image
                source={addIcon}
                resizeMode="contain"
                style={{ width: 54, height: 48 }}
              />
            </Pressable>
          );
        }

        const cfg = TABS[route.name];
        if (!cfg) return null;
        return (
          <TabItem
            key={route.key}
            active={active}
            label={cfg.label}
            icon={cfg.icon}
            iconActive={cfg.iconActive}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );
}
