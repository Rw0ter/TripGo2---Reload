import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

const TOKEN_KEYS = [
  'tripgo-auth',
  'token',
  'access_token',
  'refresh_token',
  'auth_token',
  'Authorization',
  'jwt',
  'id_token',
];

async function clearCache(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Backup token values from localStorage
      const tokenBackup: Record<string, string | null> = {};
      TOKEN_KEYS.forEach((k) => {
        const v = localStorage.getItem(k);
        if (v !== null) tokenBackup[k] = v;
      });

      // Clear localStorage except token keys
      const localToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !TOKEN_KEYS.some((t) => t.toLowerCase() === key.toLowerCase())) {
          localToDelete.push(key);
        }
      }
      localToDelete.forEach((k) => localStorage.removeItem(k));

      // Clear sessionStorage
      try {
        sessionStorage.clear();
      } catch {}

      // Clear non-token cookies
      try {
        const pairs = document.cookie.split(';').map((s) => s.trim()).filter(Boolean);
        pairs.forEach((pair) => {
          const eqPos = pair.indexOf('=');
          const name = eqPos > -1 ? pair.substring(0, eqPos).trim() : pair.trim();
          if (!TOKEN_KEYS.some((t) => t.toLowerCase() === name.toLowerCase())) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      } catch {}

      // Clear Cache API
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((n) => caches.delete(n)));
        }
      } catch {}

      // Clear IndexedDB
      try {
        if ('indexedDB' in window && typeof indexedDB.databases === 'function') {
          const dbs = await indexedDB.databases();
          await Promise.all(
            (dbs || []).map(
              (db) =>
                new Promise<void>((resolve) => {
                  const req = indexedDB.deleteDatabase(db.name!);
                  req.onsuccess = () => resolve();
                  req.onerror = () => resolve();
                  req.onblocked = () => resolve();
                }),
            ),
          );
        }
      } catch {}

      // Restore token backups
      Object.entries(tokenBackup).forEach(([k, v]) => {
        if (v !== null) localStorage.setItem(k, v);
      });
    }
    Alert.alert('成功', '已清除本地缓存并保留登录状态');
  } catch {
    Alert.alert('提示', '清除缓存失败，请稍后重试');
  }
}

interface SettingItemProps {
  label: string;
  value?: string;
  showChevron?: boolean;
  onPress?: () => void;
}

function SettingItem({ label, value, showChevron = false, onPress }: SettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-[#e0e0e0] bg-white px-[5vw] py-3"
    >
      <Text className="text-[15px] text-[#333]">{label}</Text>
      <View className="flex-row items-center">
        {value ? <Text className="text-[3.6vw] text-[#999]">{value}</Text> : null}
        {showChevron ? (
          <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginLeft: 4 }} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const avatarUrl = user?.avatar ?? null;

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-[#ecf4fd]">
      {/* Header — 3-column grid matching Legacy: back / title / spacer */}
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <View className="h-[10vh] flex-row items-center justify-center">
          <Pressable onPress={() => router.back()} className="absolute left-[5vw]">
            <Ionicons name="chevron-back" size={22} color="#333" />
          </Pressable>
          <Text className="text-[4.5vw] font-bold text-[#333]">设置</Text>
          {/* right spacer for grid balance — intentionally empty */}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User info row */}
        <Pressable
          onPress={() => router.push('/profile/edit')}
          className="my-[2vh] flex-row items-center bg-white py-[2vh]"
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 48, height: 48, borderRadius: 24, marginLeft: '5vw' as any, marginRight: 10 }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#386641',
                marginLeft: '5vw' as any,
                marginRight: 10,
              }}
              className="items-center justify-center"
            >
              <Text className="text-[18px] font-bold text-white">
                {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View className="flex-1 flex-row items-center justify-between pr-[5vw]">
            <Text className="text-[16px] font-semibold text-[#333]">
              {user?.username ?? '未登录'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </View>
        </Pressable>

        {/* Settings list — matches Legacy exact order */}
        <View className="bg-white" style={{ marginTop: 20 }}>
          <SettingItem label="清除缓存" onPress={clearCache} />

          <SettingItem
            label="隐私政策"
            showChevron
            onPress={() => router.push('/yinsizhengce' as any)}
          />

          <SettingItem
            label="用户协议"
            showChevron
            onPress={() => router.push('/yonghuxieyi' as any)}
          />

          <SettingItem
            label="应用权限说明"
            showChevron
            onPress={() => router.push('/permissions' as any)}
          />

          <SettingItem
            label="好评一下"
            showChevron
            onPress={() => Alert.alert('好评一下', '如果您喜欢 TripGo，欢迎前往应用商店给我们打分！')}
          />

          <SettingItem label="版本信息" value={VERSION} />

          <SettingItem
            label="社区规范"
            showChevron
            onPress={() => router.push('/shequguifan' as any)}
          />

          <SettingItem
            label="关于我们"
            showChevron
            onPress={() => router.push('/about_us' as any)}
          />
        </View>

        {/* Logout button — capsule shape with icon, matching Legacy style */}
        <Pressable
          onPress={handleLogout}
          className="mx-[5vw] mt-7 flex-row items-center justify-center rounded-[1.5rem] bg-[#56b5a3] py-3 shadow-sm active:scale-[0.98]"
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text className="text-[16px] font-semibold text-white">退出登录</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
