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

// 玻璃拟态输入框（半透明白底 + 白字），用于沉浸式森林背景上的玻璃表单卡。
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
      className="h-[52px] flex-row items-center rounded-2xl px-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
      }}>
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.75)" />
      <TextInput
        className="h-full flex-1 px-3 text-[15px] text-white"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.55)"
        selectionColor="#B7F5C9"
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
          <Ionicons name={hide ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
      ) : null}
    </View>
  );
}
