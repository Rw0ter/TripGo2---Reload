// Toast 调用入口 —— 任何页面只需 import { toast } from '@/lib/toast'
// 然后直接 toast.error('消息') / toast.success('消息') / toast.warning('消息') / toast.info('消息')

import { useToastStore, type ToastType } from '@/stores/toast';

function show(type: ToastType, message: string) {
  useToastStore.getState().addToast(type, message);
}

export const toast = {
  success: (msg: string) => show('success', msg),
  error:   (msg: string) => show('error', msg),
  warning: (msg: string) => show('warning', msg),
  info:    (msg: string) => show('info', msg),
};
