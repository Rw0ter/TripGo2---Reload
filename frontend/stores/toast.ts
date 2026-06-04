// 全局 Toast 状态管理 —— 一个简单的发布/订阅队列。
// 组件用 toast.error / toast.success 等方法来触发，自动在顶部弹出并 3 秒后消失。

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    // 3 秒后自动移除
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
