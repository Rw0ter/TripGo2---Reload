import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { SPLASH_BG } from '@/constants/colors';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';

// App 入口：首启走引导（hello -> login1 -> login）；已登录则自动进首页。
export default function Index() {
  const router = useRouter();
  const onboardingHydrated = useOnboardingStore((s) => s.hydrated);
  const done = useOnboardingStore((s) => s.done);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  // 只在 index 自身被聚焦时才决定路由。深链接进非首个 tab 时，index 会作为
  // 根 Stack 的锚点被挂载但并不聚焦——用 useFocusEffect 而非 <Redirect>，
  // 可避免那种情况下误跳转。
  // 等两个 store 都从存储恢复完再跳：onboarding 决定是否首启引导，
  // auth 决定是否自动登录。
  useFocusEffect(
    useCallback(() => {
      if (!onboardingHydrated || !authHydrated) return;
      if (!done) {
        router.replace('/hello');
      } else if (token) {
        // 已登录 —— 自动登录跳首页；同时静默校验 token 是否仍有效，
        // 失效（过期 / 被判废）时 apiRequest 的 401 处理会清登录态并跳回登录。
        router.replace('/home');
        void apiRequest('/auth/me', { auth: true }).catch(() => {});
      } else {
        router.replace('/login');
      }
    }, [onboardingHydrated, authHydrated, done, token, router]),
  );

  // 跳转前用启动绿占位，避免白屏闪烁。
  return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
}
