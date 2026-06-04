// 全局 Toast 置顶弹窗组件 —— 渲染在根 layout 最顶层。
// 支持 4 种类型：success / error / warning / info，每种有对应图标和配色。
// 自动 3s 消失，支持手动点击关闭，带淡入淡出 + 滑入动画。

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated as RNAnimated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/stores/toast';
import type { ToastType } from '@/stores/toast';

// ── 类型配置 ────────────────────────────────────────────────
const CONFIG: Record<ToastType, { icon: React.ComponentProps<typeof Ionicons>['name']; bg: string; text: string; border: string }> = {
  success: { icon: 'checkmark-circle',   bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  error:   { icon: 'close-circle',       bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  warning: { icon: 'alert-circle',       bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  info:    { icon: 'information-circle', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
};

// ── 单个 Toast ──────────────────────────────────────────────
function ToastItem({ id, type, message }: { id: number; type: ToastType; message: string }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const cfg = CONFIG[type];
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(-50)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      RNAnimated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  function dismiss() {
    RNAnimated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => removeToast(id));
  }

  return (
    <RNAnimated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginBottom: 8,
        backgroundColor: cfg.bg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: cfg.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }}>
      <Pressable onPress={dismiss}>
        <View className="flex-row items-center px-4 py-3.5">
          <Ionicons name={cfg.icon} size={22} color={cfg.text} />
          <Text className="ml-2.5 flex-1 text-[14px] font-medium" style={{ color: cfg.text }}>
            {message}
          </Text>
          <Pressable onPress={dismiss} className="ml-2 p-1">
            <Ionicons name="close" size={16} color={cfg.text + '80'} />
          </Pressable>
        </View>
      </Pressable>
    </RNAnimated.View>
  );
}

// ── Toast 容器 ──────────────────────────────────────────────
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute left-0 right-0 z-50 px-3"
      style={{ top: insets.top + 8 }}
      pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} type={t.type} message={t.message} />
      ))}
    </View>
  );
}
