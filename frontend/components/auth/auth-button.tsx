import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text } from 'react-native';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

// eco 绿色渐变主按钮。
export function AuthButton({ label, onPress, loading = false }: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      style={({ pressed }) => ({ opacity: pressed || loading ? 0.85 : 1 })}>
      <LinearGradient
        colors={['#52B788', '#2D6A4F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 54,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text className="text-[16px] font-bold text-white">{label}</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}
