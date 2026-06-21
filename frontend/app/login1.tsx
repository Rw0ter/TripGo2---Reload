import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Animated } from '@/components/ui/animated';
import { SPLASH_BG, SPLASH_GRADIENT } from '@/constants/colors';

const beijing = require('../assets/legacy/img/beijing.png');

// 停留时长后自动进入登录页（对应 Legacy login1.html 的 setTimeout）。
const SPLASH_MS = 4200;
const PARTICLE_COUNT = 18;

// 用 index 派生稳定伪随机，避免重渲染时粒子跳变。
function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 单个上浮粒子（对应 Legacy .particle / floatParticle）。
function Particle({
  index,
  screenW,
  screenH,
}: {
  index: number;
  screenW: number;
  screenH: number;
}) {
  const cfg = useMemo(() => {
    const size = 2 + seeded(index + 1) * 4;
    const left = seeded(index + 2) * screenW;
    const duration = 4000 + seeded(index + 3) * 6000;
    const delay = seeded(index + 4) * 4000;
    return { size, left, duration, delay };
  }, [index, screenW]);

  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      cfg.delay,
      withRepeat(
        withTiming(1, { duration: cfg.duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(p);
  }, [p, cfg]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: screenH - p.value * screenH * 1.1 },
      { scale: 0.8 + p.value * 0.4 },
    ],
    opacity: 0.8 * (1 - p.value),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: cfg.left,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size / 2,
          backgroundColor: 'rgba(255,255,255,0.9)',
        },
        style,
      ]}
    />
  );
}

// 旋转加载环（对应 Legacy .loader）。
function Loader() {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [spin]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 84,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
      <Animated.View
        style={[
          {
            width: 46,
            height: 46,
            borderRadius: 23,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.9)',
            borderTopColor: '#00ffb4',
            boxShadow: '0px 0px 14px rgba(0,255,180,0.7)',
          },
          style,
        ]}
      />
    </View>
  );
}

// 启动动画屏（对应 Legacy login1.html）：流动绿渐变 + 上浮粒子 + 发光标题 +
// 加载环。仅首启展示一次，约 4 秒后自动进入登录页。
export default function Login1Screen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/login'), SPLASH_MS);
    return () => clearTimeout(t);
  }, [router]);

  // 流动渐变：超宽渐变层左右缓慢平移。
  const flow = useSharedValue(0);
  useEffect(() => {
    flow.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(flow);
  }, [flow]);
  const flowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -flow.value * width }],
  }));

  // 岭南山水叠加层缓慢淡入到 0.16。
  const bgFade = useSharedValue(0);
  useEffect(() => {
    bgFade.value = withTiming(0.16, {
      duration: 2200,
      easing: Easing.out(Easing.ease),
    });
  }, [bgFade]);
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgFade.value }));

  // 「你好~」发光呼吸。
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(glow);
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 14 + glow.value * 26,
  }));

  const particles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    [],
  );

  return (
    // overflow:hidden —— 流动渐变层是 2 倍视窗宽，必须裁剪，否则 web 端
    // 整页被撑出横向滚动条、超出视窗。
    <View
      style={{ flex: 1, overflow: 'hidden', backgroundColor: SPLASH_BG }}>
      {/* 流动绿色渐变背景 */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, width: width * 2, height },
          flowStyle,
        ]}>
        <LinearGradient
          colors={SPLASH_GRADIENT}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* 岭南山水叠加层 */}
      <Animated.Image
        source={beijing}
        resizeMode="cover"
        style={[
          { position: 'absolute', top: 0, left: 0, width, height },
          bgStyle,
        ]}
      />

      {/* 上浮粒子层 */}
      {particles.map((i) => (
        <Particle key={i} index={i} screenW={width} screenH={height} />
      ))}

      {/* 主标题 */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30 }}>
        <Animated.Text
          entering={FadeInUp.delay(400).duration(1100)}
          style={[
            {
              fontSize: 40,
              fontWeight: '800',
              color: '#fff',
              textShadowColor: 'rgba(0,255,200,0.85)',
              textShadowOffset: { width: 0, height: 0 },
            },
            glowStyle,
          ]}>
          你好~
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(1100).duration(1100)}
          style={{
            marginTop: 10,
            fontSize: 19,
            fontWeight: '600',
            color: '#c8ffea',
          }}>
          欢迎来到绿途APP
        </Animated.Text>
      </View>

      {/* 加载环 */}
      <Loader />
    </View>
  );
}
