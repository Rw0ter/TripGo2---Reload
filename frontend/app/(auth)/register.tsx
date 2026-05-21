import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
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

  async function handleRegister() {
    const name = username.trim();
    const mail = email.trim();
    if (!name || !mail || !password) {
      Alert.alert('提示', '用户名、邮箱和密码都不能为空');
      return;
    }
    if (name.length < 2 || name.length > 20) {
      Alert.alert('提示', '用户名需 2-20 位');
      return;
    }
    if (password.length < 6 || password.length > 72) {
      Alert.alert('提示', '密码需 6-72 位');
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      Alert.alert('提示', '邮箱格式不正确');
      return;
    }
    setLoading(true);
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: { username: name, email: mail, password },
      });
      Alert.alert('注册成功', '请用新账号登录', [
        { text: '去登录', onPress: () => router.replace('/login') },
      ]);
    } catch (e) {
      Alert.alert('注册失败', e instanceof Error ? e.message : '请重试');
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
