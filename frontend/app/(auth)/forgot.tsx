import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { apiRequest } from '@/lib/api';
import { toast } from '@/lib/toast';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// 找回密码：无邮件服务，采用「用户名 + 注册邮箱」身份核验后直接设置新密码。
export default function ForgotScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    const name = username.trim();
    const mail = email.trim();
    setError('');
    if (!name || !mail || !password) {
      setError('请填写用户名、注册邮箱和新密码');
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError('邮箱格式不正确');
      return;
    }
    if (password.length < 6 || password.length > 72) {
      setError('新密码需 6-72 位');
      return;
    }
    setLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { username: name, email: mail, newPassword: password },
      });
      toast.success('密码已重置，请用新密码登录');
      router.replace('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout>
      <AuthInput
        icon="person-outline"
        value={username}
        onChangeText={setUsername}
        placeholder="用户名"
        accessibilityLabel="用户名"
        autoComplete="username"
      />
      <View className="mt-4">
        <AuthInput
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="注册邮箱"
          keyboardType="email-address"
          accessibilityLabel="注册邮箱"
          autoComplete="email"
        />
      </View>
      <View className="mt-4">
        <AuthInput
          icon="key-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="新密码（6-72 位）"
          secureTextEntry
          accessibilityLabel="新密码"
          autoComplete="password"
          textContentType="newPassword"
        />
      </View>

      {error ? (
        <View className="mt-4 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(255,107,107,0.16)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.35)' }}>
          <Text className="text-center text-[13px] text-[#FFD9D2]">{error}</Text>
        </View>
      ) : null}

      <View className="mt-6">
        <AuthButton label={loading ? '重置中…' : '重置密码'} loading={loading} onPress={handleReset} />
      </View>

      <View className="mt-6 flex-row justify-center">
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="button">
          <Text className="text-[14px] font-bold text-eco-accent">返回登录</Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
