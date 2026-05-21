import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { SPLASH_BG } from '@/constants/colors';
import { useOnboardingStore } from '@/stores/onboarding';

// App 入口：首启走引导（hello -> login1 -> login），完成后直接进 login。
export default function Index() {
  const router = useRouter();
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const done = useOnboardingStore((s) => s.done);

  // 只在 index 自身被聚焦时才决定路由。深链接进非首个 tab（itinerary /
  // mine 等）时，index 会作为根 Stack 的锚点被挂载但并不聚焦——用
  // useFocusEffect 而非 <Redirect>，可避免那种情况下误跳转到 login。
  // 等持久化恢复完再跳，避免老用户被闪回引导页。
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;
      router.replace(done ? '/login' : '/hello');
    }, [hydrated, done, router]),
  );

  // 跳转前用启动绿占位，避免白屏闪烁。
  return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
}
