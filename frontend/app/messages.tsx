import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface Message {
  id: number;
  type: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
}

interface MsgData {
  list: Message[];
  unreadCount: number;
}

const TABS = [
  { key: 'like', label: '获赞', icon: 'heart' as const },
  { key: 'comment', label: '私信', icon: 'chatbubble-ellipses' as const },
  { key: 'favorite', label: '收藏', icon: 'star' as const },
  { key: 'follow', label: '关注', icon: 'people' as const },
];

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F39C12',
  '#DDA0DD', '#98D8C8', '#E74C3C', '#BB8FCE', '#85C1E9',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const data = await apiRequest<MsgData>('/messages', { auth: true });
      setAllMessages(data.list);
    } catch {
      setError(true);
      setAllMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currentKey = TABS[tab].key;
  const filtered = allMessages.filter((m) => m.type === currentKey);

  const badgeCounts = TABS.map((t) =>
    allMessages.filter((m) => m.type === t.key && m.unread).length,
  );

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      {/* Header — matching Legacy message.html title bar */}
      <View style={{ paddingTop: insets.top }} className="bg-white px-4 pb-3 shadow-sm">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={22} color="#333" />
          </Pressable>
          <Text className="text-[17px] font-semibold text-[#333]">消息</Text>
          <View style={{ width: 28 }} />
        </View>
      </View>

      {/* Sticky Tabs — outside ScrollView so they stay fixed below header */}
      <View className="flex-row border-b border-[#eee] bg-white">
        {TABS.map((t, i) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(i)}
            className="flex-1 items-center justify-center py-2.5"
          >
            <View className="relative">
              <Ionicons
                name={t.icon}
                size={22}
                color={i === tab ? '#333' : '#999'}
              />
              {badgeCounts[i] > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#ff5252',
                  }}
                  className="items-center justify-center px-1"
                >
                  <Text className="text-[10px] font-bold text-white">
                    {badgeCounts[i] > 99 ? '99+' : badgeCounts[i]}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={`mt-1 text-[11px] ${i === tab ? 'font-bold text-[#333]' : 'text-[#999]'}`}
            >
              {t.label}
            </Text>
            {i === tab && (
              <View
                style={{
                  height: 2,
                  width: 24,
                  backgroundColor: '#56b5a3',
                  marginTop: 4,
                  borderRadius: 1,
                }}
              />
            )}
          </Pressable>
        ))}
      </View>

      {/* Scrollable message list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#56b5a3" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="cloud-offline-outline" size={48} color="#ddd" />
          <Text className="mt-3 text-[14px] text-[#999]">加载失败，请检查网络</Text>
          <Pressable
            onPress={() => load()}
            className="mt-4 rounded-full bg-[#56b5a3] px-6 py-2"
          >
            <Text className="text-[14px] font-medium text-white">重试</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
          <Text className="mt-3 text-[14px] text-[#999]">暂无消息</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {filtered.map((m) => {
            const initial = m.title.charAt(0);
            const avatarColor = getAvatarColor(m.title);
            return (
              <Pressable
                key={m.id}
                className="flex-row items-center border-b border-[#eee] bg-white px-4 py-3"
              >
                {/* Avatar — colored letter circle, matching legacy avatar placement */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: avatarColor,
                  }}
                  className="items-center justify-center"
                >
                  <Text className="text-[16px] font-bold text-white">
                    {initial}
                  </Text>
                </View>

                {/* Content — title + preview, matching legacy message-content */}
                <View className="ml-3 flex-1 justify-center">
                  <Text
                    className={`text-[15px] ${m.unread ? 'font-semibold' : 'font-medium'} text-[#333]`}
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                  <Text numberOfLines={1} className="mt-0.5 text-[13px] text-[#999]">
                    {m.text}
                  </Text>
                </View>

                {/* Time — right-aligned, #999 matching legacy message-time */}
                <Text className="ml-2 self-start text-[11px] text-[#999]">
                  {m.time}
                </Text>
              </Pressable>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}
