import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { toast } from '@/lib/toast';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import { AuthUser, useAuthStore } from '@/stores/auth';

const userIcon = require('../../assets/legacy/img/user-3-line.png');
const passwordIcon = require('../../assets/legacy/img/password.png');

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
      const data = await apiRequest<{ token: string; user: AuthUser }>(
        '/auth/login',
        { method: 'POST', body: { username: name, password } },
      );
      setAuth(data.token, data.user);
      router.replace('/home');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout>
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <AuthInput
          icon={userIcon}
          value={username}
          onChangeText={setUsername}
          placeholder="请输入手机号/用户名/邮箱"
          accessibilityLabel="用户名"
          autoComplete="username"
          textContentType="username"
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(300).duration(500)}
        className="mt-[18px]">
        <AuthInput
          icon={passwordIcon}
          value={password}
          onChangeText={setPassword}
          placeholder="密码"
          secureTextEntry
          accessibilityLabel="密码"
          autoComplete="password"
          textContentType="password"
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        className="mt-4 flex-row justify-between">
        <Pressable
          onPress={() => router.push('/register')}
          accessibilityRole="button">
          <Text className="text-sm font-semibold text-white">账号注册</Text>
        </Pressable>
        <Pressable
          onPress={() => toast.info('找回密码功能开发中')}
          accessibilityRole="button">
          <Text className="text-sm font-semibold text-white">忘记密码</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(500).duration(500)}
        className="mt-6">
        <AuthButton
          label={loading ? '登录中…' : '登录'}
          loading={loading}
          onPress={handleLogin}
        />
      </Animated.View>
    </AuthScreenLayout>
  );
}
