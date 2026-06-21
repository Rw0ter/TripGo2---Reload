import { useEffect } from 'react';
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useVoiceAssistant } from '@/stores/voice-assistant';

// 自动化执行时，页面四周泛起一圈"向内"流转的炫彩柔光（只有 inset shadow 变色，无 border 描边）。
// 每个通道严格落 [30,185]：哑光霓虹，不刺眼也不死黑。范围放大成内扩柔光晕，pointerEvents none 不挡操作。
const HUES = [
  '#B93C5F', '#B9822D', '#96B932', '#2DB96E',
  '#28AAAF', '#2D78B9', '#7846B9', '#B93CA0', '#B93C5F',
];
const STOPS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

export function VoiceAutomationGlow() {
  const automating = useVoiceAssistant((s) => s.automating);
  const t = useSharedValue(0);

  useEffect(() => {
    if (automating) {
      t.value = 0;
      // 3.6s 一圈，缓慢流转更从容。
      t.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(t);
    }
    return () => cancelAnimation(t);
  }, [automating, t]);

  // 双层内阴影、错相位：内圈较亮收口 + 外扩大范围柔光，共同变色；不画 border。
  const style = useAnimatedStyle(() => {
    const c1 = interpolateColor(t.value, STOPS, HUES);
    const c2 = interpolateColor((t.value + 0.5) % 1, STOPS, HUES);
    return {
      boxShadow: `inset 0px 0px 60px 6px ${c1}, inset 0px 0px 150px 48px ${c2}`,
    };
  });

  if (!automating) return null;

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300 },
        style,
      ]}
    />
  );
}
