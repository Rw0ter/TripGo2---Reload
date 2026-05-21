import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { persistStorage } from '@/lib/persist-storage';

interface OnboardingState {
  // 是否已完成首启引导（已同意隐私协议）。true 后不再展示 hello / login1。
  done: boolean;
  // persist 是否已从存储恢复完毕——路由判断必须等它为 true 再决定，
  // 否则老用户会被闪回引导页。
  hydrated: boolean;
  complete: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      done: false,
      hydrated: false,
      complete: () => set({ done: true }),
    }),
    {
      name: 'tripgo-onboarding',
      storage: createJSONStorage(() => persistStorage),
      // 只持久化 done；hydrated 是运行期状态。
      partialize: (s) => ({ done: s.done }),
      onRehydrateStorage: () => () => {
        useOnboardingStore.setState({ hydrated: true });
      },
    },
  ),
);
