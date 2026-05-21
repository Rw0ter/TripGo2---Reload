import {
  Image,
  type ImageSourcePropType,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

interface AuthInputProps {
  icon: ImageSourcePropType;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  accessibilityLabel?: string;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
}

// 白色圆角输入胶囊 + 图标（对应 Legacy .input-group）。
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
  return (
    <View className="h-[52px] flex-row items-center rounded-[20px] bg-white px-5">
      <Image
        source={icon}
        resizeMode="contain"
        style={{ width: 20, height: 20, marginRight: 12, opacity: 0.7 }}
      />
      <TextInput
        className="h-full flex-1 text-base text-[#333]"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        autoComplete={autoComplete}
        textContentType={textContentType}
      />
    </View>
  );
}
