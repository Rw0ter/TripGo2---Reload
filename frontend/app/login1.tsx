import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 引导动画背景：真实 CC0 森林树冠摄影（见 onboarding/CREDITS.md）。
const INTRO_BG = require('../assets/images/onboarding/intro_bg.jpg');

const SPLASH_MS = 4200;
// 非线性贝塞尔缓动：进场用 easeOutExpo 质感，呼吸用对称 in-out。
const BEZIER_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const BEZIER_INOUT = Easing.bezier(0.65, 0, 0.35, 1);

// 启动动画引导屏：森林树冠 Ken Burns 缓推 + 品牌/标语贝塞尔错峰浮入 +
// 叶徽呼吸。约 4 秒后自动进入登录页，可「跳过」。
export default function Login1Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const kb = useSharedValue(0); // 背景 Ken Burns
  const t1 = useSharedValue(0); // 品牌名
  const t2 = useSharedValue(0); // 标语
  const t3 = useSharedValue(0); // 底部说明
  const leaf = useSharedValue(0); // 叶徽呼吸

  useEffect(() => {
    kb.value = withTiming(1, { duration: SPLASH_MS + 1200, easing: BEZIER_INOUT });
    t1.value = withDelay(300, withTiming(1, { duration: 1100, easing: BEZIER_OUT }));
    t2.value = withDelay(820, withTiming(1, { duration: 1100, easing: BEZIER_OUT }));
    t3.value = withDelay(1320, withTiming(1, { duration: 1000, easing: BEZIER_OUT }));
    leaf.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1700, easing: BEZIER_INOUT }),
        withTiming(0, { duration: 1700, easing: BEZIER_INOUT }),
      ),
      -1,
      true,
    );
    const tm = setTimeout(() => router.replace('/login'), SPLASH_MS);
    return () => clearTimeout(tm);
  }, [router, kb, t1, t2, t3, leaf]);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + kb.value * 0.14 }, { translateY: kb.value * -16 }],
  }));
  const s1 = useAnimatedStyle(() => ({ opacity: t1.value, transform: [{ translateY: (1 - t1.value) * 30 }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: t2.value, transform: [{ translateY: (1 - t2.value) * 24 }] }));
  const s3 = useAnimatedStyle(() => ({ opacity: t3.value, transform: [{ translateY: (1 - t3.value) * 18 }] }));
  const leafStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + leaf.value * 0.45,
    transform: [{ scale: 0.92 + leaf.value * 0.16 }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#0E2A1E', overflow: 'hidden' }}>
      <Reanimated.Image
        source={INTRO_BG}
        resizeMode="cover"
        style={[{ position: 'absolute', width, height }, bgStyle]}
      />
      <LinearGradient
        colors={['rgba(10,40,28,0.20)', 'rgba(10,40,28,0.55)', 'rgba(10,40,28,0.94)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', width, height }}
      />

      {/* 跳过 */}
      <Pressable
        onPress={() => router.replace('/login')}
        accessibilityRole="button"
        accessibilityLabel="跳过"
        style={{ position: 'absolute', top: insets.top + 12, right: 18 }}>
        <View className="rounded-full bg-white/15 px-3.5 py-1.5">
          <Text className="text-[13px] text-white">跳过</Text>
        </View>
      </Pressable>

      {/* 品牌 */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 34 }}>
        <Reanimated.View style={leafStyle}>
          <View className="h-[68px] w-[68px] items-center justify-center rounded-[24px] bg-white/15">
            <Ionicons name="leaf" size={36} color="#B7F5C9" />
          </View>
        </Reanimated.View>
        <Reanimated.Text style={[{ marginTop: 24, fontSize: 58, fontWeight: '800', color: '#fff', letterSpacing: 3 }, s1]}>
          绿途
        </Reanimated.Text>
        <Reanimated.Text style={[{ marginTop: 10, fontSize: 18, color: '#D8F3DC', fontWeight: '600', letterSpacing: 1 }, s2]}>
          收集绿色能量 · 种出一片森林
        </Reanimated.Text>
        <Reanimated.View style={[{ marginTop: 18, height: 3, width: 66, borderRadius: 2, backgroundColor: '#52B788' }, s2]} />
      </View>

      {/* 底部说明 */}
      <Reanimated.View style={[{ paddingBottom: insets.bottom + 42, paddingHorizontal: 34 }, s3]}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 21 }}>
          以绿色低碳行动回应「双碳」目标{'\n'}让每一次环保选择都被看见
        </Text>
      </Reanimated.View>
    </View>
  );
}
