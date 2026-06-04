import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';

interface SettingItemProps { icon: any; label: string; value?: string; onPress: () => void; }

function SettingItem({ icon, label, value, onPress }: SettingItemProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between border-b border-[#e0e0e0] bg-white px-5 py-3.5">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={20} color="#666" />
        <Text className="ml-3 text-[15px] text-[#333]">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value ? <Text className="text-[13px] text-[#999]">{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginLeft: 4 }} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <View className="flex-1 bg-[#ecf4fd]">
      {/* Header matching Legacy settings.html */}
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-center bg-white pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 8 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[17px] font-bold text-[#333]">设置</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User info */}
        <View className="mt-4 flex-row items-center bg-white px-5 py-4">
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#386641' }} className="items-center justify-center">
            <Text className="text-[18px] font-bold text-white">{user?.username?.slice(0, 1) ?? '?'}</Text>
          </View>
          <View className="ml-3 flex-1 flex-row items-center justify-between">
            <Text className="text-[16px] font-semibold text-[#333]">{user?.username ?? '未登录'}</Text>
            <Pressable onPress={() => router.push('/profile/edit')}>
              <Text className="text-[13px] text-[#888]">编辑资料 &gt;</Text>
            </Pressable>
          </View>
        </View>

        {/* Settings list */}
        <View className="mt-4">
          <SettingItem icon="lock-closed-outline" label="账号安全" onPress={() => Alert.alert('提示', '功能开发中')} />
          <SettingItem icon="notifications-outline" label="消息通知" value="已开启" onPress={() => Alert.alert('提示', '功能开发中')} />
          <SettingItem icon="moon-outline" label="深色模式" value="跟随系统" onPress={() => Alert.alert('提示', '功能开发中')} />
          <SettingItem icon="language-outline" label="语言" value="简体中文" onPress={() => Alert.alert('提示', '功能开发中')} />
        </View>

        <View className="mt-4">
          <SettingItem icon="document-text-outline" label="用户协议" onPress={() => Alert.alert('提示', '功能开发中')} />
          <SettingItem icon="shield-checkmark-outline" label="隐私政策" onPress={() => Alert.alert('提示', '功能开发中')} />
          <SettingItem icon="information-circle-outline" label="关于我们" onPress={() => Alert.alert('提示', '功能开发中')} />
        </View>

        <View className="mt-4">
          <SettingItem icon="trash-outline" label="清除缓存" value="12.3 MB" onPress={() => Alert.alert('提示', '缓存已清除')} />
        </View>

        {/* Logout */}
        <Pressable onPress={() => { clearAuth(); router.replace('/login'); }} className="mx-5 mt-8 items-center rounded-2xl bg-[#56b5a3] py-3">
          <Text className="text-[15px] font-semibold text-white">退出登录</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
