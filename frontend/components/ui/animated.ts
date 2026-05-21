// reanimated 的 Animated.* 不在 NativeWind 的 className 白名单内，
// 直接 <Animated.View className="..."> 样式会被静默丢弃（web 端表现为布局错乱）。
// 这里用 cssInterop 把 className 映射到 style，并导出包装后的组件。
//
// 约定：屏幕里要做动画又要 className 时，从本模块 import { Animated }，
// 不要直接 import Animated from 'react-native-reanimated'。
// 动画工具（FadeInDown、useAnimatedStyle 等）仍从 react-native-reanimated 取。
import { cssInterop } from 'nativewind';
import Reanimated from 'react-native-reanimated';

export const Animated = {
  View: cssInterop(Reanimated.View, { className: 'style' }),
  Text: cssInterop(Reanimated.Text, { className: 'style' }),
  Image: cssInterop(Reanimated.Image, { className: 'style' }),
  ScrollView: cssInterop(Reanimated.ScrollView, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  }),
};
