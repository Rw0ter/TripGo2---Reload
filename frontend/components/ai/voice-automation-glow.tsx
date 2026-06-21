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

// 自动化执行时，页面四周显示一圈缓缓流转的炫彩灯带 + 柔光（pointerEvents none，不挡操作）。
// 每个通道严格落在 [30,185]：既不刺眼纯白、也不死黑，呈高级的"哑光霓虹"质感。
//   rose(185,60,95) amber(185,130,45) lime(150,185,50) green(45,185,110)
//   teal(40,170,175) azure(45,120,185) violet(120,70,185) magenta(185,60,160)
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
      // 3.6s 一圈，缓慢流转更显从容（呼应"放慢自动化节奏"）。
      t.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(t);
    }
    return () => cancelAnimation(t);
  }, [automating, t]);

  // 三层同色错相位：外层弥散柔光晕 → 中层过渡 → 内层清晰灯带 + 发光投影，叠出"灯带 + glow"层次。
  const haze = useAnimatedStyle(() => ({
    borderColor: interpolateColor(t.value, STOPS, HUES),
    // 轻微呼吸：0.14 ↔ 0.22
    opacity: 0.14 + 0.08 * (1 - Math.abs(0.5 - t.value) * 2),
  }));
  const mid = useAnimatedStyle(() => ({
    borderColor: interpolateColor((t.value + 0.05) % 1, STOPS, HUES),
  }));
  const band = useAnimatedStyle(() => ({
    borderColor: interpolateColor((t.value + 0.1) % 1, STOPS, HUES),
  }));

  if (!automating) return null;

  return (
    <>
      {/* 外层：粗而弥散的柔光晕 */}
      <Reanimated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 16, zIndex: 300 },
          haze,
        ]}
      />
      {/* 中层：过渡光带 */}
      <Reanimated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderWidth: 8, borderRadius: 12, opacity: 0.45, zIndex: 300 },
          mid,
        ]}
      />
      {/* 内层：清晰灯带 + 柔和发光投影（glow） */}
      <Reanimated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute', top: 11, left: 11, right: 11, bottom: 11,
            borderWidth: 2.5, borderRadius: 18, zIndex: 300,
            boxShadow: '0px 0px 22px rgba(120,180,150,0.55)',
          },
          band,
        ]}
      />
    </>
  );
}
