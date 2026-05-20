import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormScreenProps {
  title: string;
  submitLabel?: string;
  onSubmit: () => void;
  children: ReactNode;
}

// 表单页统一模板（登录 / 注册 / 编辑资料 / 新增地址等）。
export function FormScreen({
  title,
  submitLabel = '提交',
  onSubmit,
  children,
}: FormScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1 px-5 py-4"
          keyboardShouldPersistTaps="handled">
          <Text className="mb-5 text-xl font-bold text-gray-900">{title}</Text>
          {children}
          <TouchableOpacity
            onPress={onSubmit}
            className="mt-6 items-center rounded-xl bg-primary py-3.5">
            <Text className="text-base font-semibold text-white">
              {submitLabel}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
