import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';

const userIcon = require('../../assets/legacy/img/user-3-line.png');
const emailIcon = require('../../assets/legacy/img/yanzheng.png');
const passwordIcon = require('../../assets/legacy/img/password.png');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // 行内错误提示——Alert 在 react-native-web 上不渲染，不能用它做反馈。
  const [error, setError] = useState('');

  async function handleRegister() {
    const name = username.trim();
    const mail = email.trim();
    setError('');
    if (!name || !mail || !password) {
      setError('用户名、邮箱和密码都不能为空');
      return;
    }
    if (name.length < 2 || name.length > 20) {
      setError('用户名需 2-20 位');
      return;
    }
    if (password.length < 6 || password.length > 72) {
      setError('密码需 6-72 位');
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError('邮箱格式不正确');
      return;
    }
    setLoading(true);
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: { username: name, email: mail, password },
      });
      router.replace('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败，请重试');
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
          placeholder="用户名"
          accessibilityLabel="用户名"
          autoComplete="username"
          textContentType="username"
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(280).duration(500)}
        className="mt-[18px]">
        <AuthInput
          icon={emailIcon}
          value={email}
          onChangeText={setEmail}
          placeholder="邮箱"
          keyboardType="email-address"
          accessibilityLabel="邮箱"
          autoComplete="email"
          textContentType="emailAddress"
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(360).duration(500)}
        className="mt-[18px]">
        <AuthInput
          icon={passwordIcon}
          value={password}
          onChangeText={setPassword}
          placeholder="密码（6-72 位）"
          secureTextEntry
          accessibilityLabel="密码"
          autoComplete="password"
          textContentType="newPassword"
        />
      </Animated.View>

      {error ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="mt-4 rounded-xl bg-[#C0584B] px-3 py-2">
          <Text className="text-center text-[13px] text-white">{error}</Text>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(460).duration(500)}
        className="mt-6">
        <AuthButton
          label={loading ? '注册中…' : '注册'}
          loading={loading}
          onPress={handleRegister}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(540).duration(500)}
        className="mt-5 items-center">
        <Pressable
          onPress={() => router.replace('/login')}
          accessibilityRole="button">
          <Text className="text-sm font-semibold text-white">
            已有账号？去登录
          </Text>
        </Pressable>
      </Animated.View>
    </AuthScreenLayout>
  );
}
