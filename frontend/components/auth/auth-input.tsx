import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface AuthInputProps {
  icon: IoniconName;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  accessibilityLabel?: string;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
}

// 浅色填充圆角输入框 + Ionicons 前置图标；密码框带显隐切换。
export function AuthInput({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  accessibilityLabel,
  autoComplete,
  textContentType,
}: AuthInputProps) {
  const [hide, setHide] = useState(!!secureTextEntry);
  return (
    <View
      className="h-14 flex-row items-center rounded-2xl bg-eco-cream px-4"
      style={{ borderWidth: 1, borderColor: '#E4EFE7' }}>
      <Ionicons name={icon} size={20} color="#6E9A85" />
      <TextInput
        className="h-full flex-1 px-3 text-[15px] text-eco-dark"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CB3A6"
        secureTextEntry={secureTextEntry ? hide : false}
        keyboardType={keyboardType}
        autoCapitalize="none"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        autoComplete={autoComplete}
        textContentType={textContentType}
      />
      {secureTextEntry ? (
        <Pressable
          onPress={() => setHide((h) => !h)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hide ? '显示密码' : '隐藏密码'}>
          <Ionicons name={hide ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CB3A6" />
        </Pressable>
      ) : null}
    </View>
  );
}
