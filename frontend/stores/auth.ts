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
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'tripgo-auth',
      storage: createJSONStorage(() => persistStorage),
    },
  ),
);
