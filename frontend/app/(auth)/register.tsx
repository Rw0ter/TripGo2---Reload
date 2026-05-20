import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { FormField } from '@/components/shared/form-field';
import { FormScreen } from '@/components/shared/form-screen';
import { apiRequest } from '@/lib/api';

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
      Alert.alert('提示', '请填写完整信息');
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
    <FormScreen
      title="注册"
      submitLabel={loading ? '注册中…' : '注册'}
      loading={loading}
      onSubmit={handleRegister}>
      <FormField
        label="用户名"
        value={username}
        onChangeText={setUsername}
        placeholder="2-20 位"
      />
      <FormField
        label="邮箱"
        value={email}
        onChangeText={setEmail}
        placeholder="请输入邮箱"
        keyboardType="email-address"
      />
      <FormField
        label="密码"
        value={password}
        onChangeText={setPassword}
        placeholder="6-72 位"
        secureTextEntry
      />
      <View className="mt-4 flex-row justify-center">
        <Text className="text-sm text-gray-500">已有账号？</Text>
        <Pressable onPress={() => router.push('/login')}>
          <Text className="text-sm font-medium text-primary">去登录</Text>
        </Pressable>
      </View>
    </FormScreen>
  );
}
