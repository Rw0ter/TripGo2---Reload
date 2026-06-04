import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';

const avatarPlaceholder = require('../../assets/legacy/img/wccpImg/fslncmssh.png');

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  function save() {
    Alert.alert('提示', '资料已保存（本地修改）');
    router.back();
  }

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      {/* Header matching Legacy bianji.html */}
      <View style={{ paddingTop: insets.top + 4 }} className="flex-row items-center justify-center bg-white px-4 pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 4 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[17px] font-bold text-[#333]">编辑个人信息</Text>
        <Pressable onPress={save} className="absolute right-4" style={{ top: insets.top + 4 }}>
          <Text className="text-[15px] font-semibold text-[#40CEA7]">保存</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Avatar */}
        <View className="items-center">
          <Image source={avatarPlaceholder} style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#f0f0f0' }} />
          <Pressable className="mt-3 rounded-xl bg-[#40CEA7] px-5 py-2">
            <Text className="text-[13px] font-semibold text-white">更换头像</Text>
          </Pressable>
        </View>

        {/* Form */}
        <View className="mt-6 rounded-xl bg-white p-4 shadow-sm">
          <View className="mb-4">
            <Text className="mb-1.5 text-[13px] font-medium text-[#555]">用户名</Text>
            <TextInput value={username} onChangeText={setUsername} className="rounded-lg border border-[#ddd] px-3 py-2.5 text-[15px] text-[#333]" />
          </View>
          <View className="mb-4">
            <Text className="mb-1.5 text-[13px] font-medium text-[#555]">邮箱</Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" className="rounded-lg border border-[#ddd] px-3 py-2.5 text-[15px] text-[#333]" />
          </View>
        </View>

        <Pressable onPress={save} className="mt-8 items-center rounded-xl bg-[#40CEA7] py-3.5">
          <Text className="text-[15px] font-bold text-white">保存修改</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
