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

// 自动化执行时，页面四周显示一圈循环流转的 RGB 灯带（pointerEvents none，不挡操作）。
const HUES = ['#FF4D6D', '#FF9F1C', '#F4E04D', '#52FF8E', '#3BE0FF', '#7B61FF', '#FF4D6D'];
const STOPS = [0, 0.17, 0.34, 0.5, 0.67, 0.84, 1];

export function VoiceAutomationGlow() {
  const automating = useVoiceAssistant((s) => s.automating);
  const t = useSharedValue(0);

  useEffect(() => {
    if (automating) {
      t.value = 0;
      t.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(t);
    }
    return () => cancelAnimation(t);
  }, [automating, t]);

  const outer = useAnimatedStyle(() => ({
    borderColor: interpolateColor(t.value, STOPS, HUES),
  }));
  const inner = useAnimatedStyle(() => ({
    borderColor: interpolateColor((t.value + 0.5) % 1, STOPS, HUES),
    opacity: 0.5 + 0.5 * Math.abs(0.5 - t.value) * 2,
  }));

  if (!automating) return null;

  return (
    <>
      {/* 外圈粗灯带 */}
      <Reanimated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 5, zIndex: 300 },
          outer,
        ]}
      />
      {/* 内圈错相位细灯带，营造流光层次 */}
      <Reanimated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderWidth: 2, borderRadius: 6, zIndex: 300 },
          inner,
        ]}
      />
    </>
  );
}
