import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { FormField } from '@/components/shared/form-field';
import { FormScreen } from '@/components/shared/form-screen';
import { apiRequest } from '@/lib/api';
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
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: AuthUser }>(
        '/auth/login',
        { method: 'POST', body: { username: name, password } },
      );
      setAuth(data.token, data.user);
      router.replace('/');
    } catch (e) {
      Alert.alert('登录失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormScreen
      title="登录"
      submitLabel={loading ? '登录中…' : '登录'}
      loading={loading}
      onSubmit={handleLogin}>
      <FormField
        label="用户名"
        value={username}
        onChangeText={setUsername}
        placeholder="请输入用户名"
      />
      <FormField
        label="密码"
        value={password}
        onChangeText={setPassword}
        placeholder="请输入密码"
        secureTextEntry
      />
      <View className="mt-4 flex-row justify-center">
        <Text className="text-sm text-gray-500">还没有账号？</Text>
        <Pressable onPress={() => router.push('/register')}>
          <Text className="text-sm font-medium text-primary">去注册</Text>
        </Pressable>
      </View>
    </FormScreen>
  );
}
