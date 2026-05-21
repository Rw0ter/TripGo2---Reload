import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { SPLASH_BG } from '@/constants/colors';
import { useOnboardingStore } from '@/stores/onboarding';

// App 入口：首启走引导（hello -> login1 -> login），完成后直接进 login。
export default function Index() {
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const done = useOnboardingStore((s) => s.done);

  // 等持久化恢复完再决定路由，避免老用户被闪回引导页。
  // 用启动绿占位，避免白屏闪烁。
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
  }
  return <Redirect href={done ? '/login' : '/hello'} />;
}
