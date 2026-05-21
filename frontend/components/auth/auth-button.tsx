import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { AUTH_BUTTON_GRADIENT } from '@/constants/colors';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

// 渐变胶囊按钮（对应 Legacy .login-btn）。
export function AuthButton({ label, onPress, loading = false }: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}>
      <LinearGradient
        colors={AUTH_BUTTON_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 50,
          borderRadius: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text className="text-base font-semibold text-white">{label}</Text>
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}
