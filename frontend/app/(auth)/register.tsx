import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { apiRequest } from '@/lib/api';

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
    <AuthScreenLayout title="创建账号" subtitle="加入绿途，开启你的绿色行动">
      <AuthInput
        icon="person-outline"
        value={username}
        onChangeText={setUsername}
        placeholder="用户名（2-20 位）"
        accessibilityLabel="用户名"
        autoComplete="username"
        textContentType="username"
      />
      <View className="mt-4">
        <AuthInput
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="邮箱"
          keyboardType="email-address"
          accessibilityLabel="邮箱"
          autoComplete="email"
          textContentType="emailAddress"
        />
      </View>
      <View className="mt-4">
        <AuthInput
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="密码（6-72 位）"
          secureTextEntry
          accessibilityLabel="密码"
          autoComplete="password"
          textContentType="newPassword"
        />
      </View>

      {error ? (
        <View className="mt-4 rounded-xl bg-[#FCEDE9] px-3 py-2.5">
          <Text className="text-center text-[13px] text-[#C0584B]">{error}</Text>
        </View>
      ) : null}

      <View className="mt-6">
        <AuthButton label={loading ? '注册中…' : '注册'} loading={loading} onPress={handleRegister} />
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-[14px] text-eco-mid/70">已有账号？</Text>
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="button">
          <Text className="text-[14px] font-bold text-eco"> 去登录</Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
