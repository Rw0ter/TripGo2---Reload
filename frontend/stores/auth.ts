import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  points: number;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

// 全局登录态。持久化（expo-secure-store）待登录屏接入时再加。
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}));
