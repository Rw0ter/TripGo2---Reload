import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { persistStorage } from '@/lib/persist-storage';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  points: number;
  balance: number;
  couponCount: number;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  // persist 是否已从存储恢复完毕——自动登录路由必须等它为 true 再读 token，
  // 否则首帧读到 null 会把已登录用户误跳到登录页。
  hydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

// 持久化登录态，App 重启 / 刷新不丢登录。
// 跨端存储：web=localStorage、原生=SecureStore（见 lib/persist-storage）。
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'tripgo-auth',
      storage: createJSONStorage(() => persistStorage),
      // 只持久化 token / user；hydrated 是运行期状态。
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);
