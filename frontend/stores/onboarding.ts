import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 跨端持久化：web 用 localStorage（SecureStore 不支持 web），原生用 SecureStore。
// 引导标记不是机密，用哪种都行，关键是 web 端也能持久化。
const crossPlatformStorage =
  Platform.OS === 'web'
    ? {
        getItem: (k: string) =>
          Promise.resolve(globalThis.localStorage?.getItem(k) ?? null),
        setItem: (k: string, v: string) => {
          globalThis.localStorage?.setItem(k, v);
          return Promise.resolve();
        },
        removeItem: (k: string) => {
          globalThis.localStorage?.removeItem(k);
          return Promise.resolve();
        },
      }
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k),
        setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
        removeItem: (k: string) => SecureStore.deleteItemAsync(k),
      };

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
      storage: createJSONStorage(() => crossPlatformStorage),
      // 只持久化 done；hydrated 是运行期状态。
      partialize: (s) => ({ done: s.done }),
      onRehydrateStorage: () => () => {
        useOnboardingStore.setState({ hydrated: true });
      },
    },
  ),
);
