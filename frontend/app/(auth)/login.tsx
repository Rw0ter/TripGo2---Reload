import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { apiRequest } from '@/lib/api';
import { toast } from '@/lib/toast';
import { AuthUser, useAuthStore } from '@/stores/auth';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const name = username.trim();
    if (!name || !password) {
      toast.warning('用户名和密码不能为空');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { username: name, password },
      });
      setAuth(data.token, data.user);
      router.replace('/home');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout title="欢迎回来" subtitle="登录绿途，继续你的低碳之旅">
      <AuthInput
        icon="person-outline"
        value={username}
        onChangeText={setUsername}
        placeholder="手机号 / 用户名 / 邮箱"
        accessibilityLabel="用户名"
        autoComplete="username"
        textContentType="username"
      />
      <View className="mt-4">
        <AuthInput
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="密码"
          secureTextEntry
          accessibilityLabel="密码"
          autoComplete="password"
          textContentType="password"
        />
      </View>

      <View className="mt-3 flex-row justify-end">
        <Pressable onPress={() => router.push('/forgot' as never)} accessibilityRole="button">
          <Text className="text-[13px] font-semibold text-eco">忘记密码？</Text>
        </Pressable>
      </View>

      <View className="mt-6">
        <AuthButton label={loading ? '登录中…' : '登录'} loading={loading} onPress={handleLogin} />
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-[14px] text-eco-mid/70">还没有账号？</Text>
        <Pressable onPress={() => router.push('/register')} accessibilityRole="button">
          <Text className="text-[14px] font-bold text-eco"> 立即注册</Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
