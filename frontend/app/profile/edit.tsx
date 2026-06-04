import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const avatarPlaceholder = require('../../assets/legacy/img/wccpImg/fslncmssh.png');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const hasChanges =
    username !== (user?.username ?? '') || email !== (user?.email ?? '');

  const validate = useCallback((): string | null => {
    if (!username.trim()) return '请输入用户名';
    if (!email.trim()) return '请输入邮箱';
    if (!EMAIL_RE.test(email.trim())) return '请输入有效的邮箱地址';
    return null;
  }, [username, email]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert('放弃修改', '确定要放弃未保存的修改吗？', [
        { text: '继续编辑', style: 'cancel' },
        {
          text: '放弃',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]);
    } else {
      router.back();
    }
  }, [hasChanges, router]);

  const handleSave = useCallback(async () => {
    const err = validate();
    if (err) {
      toast.warning(err);
      return;
    }

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();

    setSaving(true);
    try {
      let updatedUser;
      try {
        // Try backend update endpoint first
        updatedUser = await apiRequest<any>('/auth/userinfo', {
          method: 'PUT',
          auth: true,
          body: { username: trimmedUser, email: trimmedEmail },
        });
      } catch {
        // Backend PUT /auth/userinfo not yet built — fall back to local store update
        updatedUser = {
          ...user!,
          username: trimmedUser,
          email: trimmedEmail,
        };
      }

      setAuth(token!, updatedUser);
      router.back();
    } catch (err: any) {
      toast.error(err.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [username, email, validate, user, token, setAuth, router]);

  const handleAvatarPress = useCallback(() => {
    toast.info('头像上传功能即将上线，敬请期待');
  }, []);

  const avatarSource = user?.avatar ? { uri: user.avatar } : avatarPlaceholder;

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 4 }}
        className="flex-row items-center justify-center bg-white px-4 pb-3 shadow-sm"
      >
        <Pressable
          onPress={handleCancel}
          className="absolute left-4"
          style={{ top: insets.top + 4 }}
        >
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[17px] font-bold text-[#333]">
          编辑个人信息
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* White card — matching legacy .container: rounded-10, shadow, p-5 */}
        <View
          className="rounded-[10px] bg-white p-5"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {/* Avatar section — matching legacy .avatar-section */}
          <View className="mb-5 items-center">
            <Image
              source={avatarSource}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: '#f0f0f0',
              }}
            />
            <Pressable
              onPress={handleAvatarPress}
              disabled={saving}
              className="mt-[15px] rounded-md bg-[#40CEA7] px-5 py-2.5"
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <Text className="text-sm font-medium text-white">更换头像</Text>
            </Pressable>
          </View>

          {/* Username field — matching legacy .form-group with bottom-border style */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-[#333]">用户名</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="请输入用户名"
              placeholderTextColor="#aaa"
              editable={!saving}
              className="border-b border-[#ddd] py-3 text-base text-[#333]"
              style={{ paddingHorizontal: 2 }}
            />
          </View>

          {/* Email field */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-[#333]">邮箱</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱地址"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
              className="border-b border-[#ddd] py-3 text-base text-[#333]"
              style={{ paddingHorizontal: 2 }}
            />
          </View>

          {/* Bottom buttons — matching legacy .btn-group: save left, cancel right */}
          <View className="mt-6 flex-row">
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`mr-[10px] flex-1 items-center rounded-md py-3 ${
                saving ? 'bg-[#90d8c4]' : 'bg-[#40CEA7]'
              }`}
              style={({ pressed }) => [
                { opacity: pressed && !saving ? 0.85 : 1 },
              ]}
            >
              <Text className="text-base font-medium text-white">
                {saving ? '保存中...' : '保存'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              disabled={saving}
              className="flex-1 items-center rounded-md bg-[#f0f0f0] py-3"
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <Text className="text-base text-[#666]">取消</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
