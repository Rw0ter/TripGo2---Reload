import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

interface Message { id: number; type: string; title: string; text: string; time: string; unread: boolean; }
interface MsgData { list: Message[]; unreadCount: number; }

const TABS = ['全部', '点赞', '评论', '系统'];
const TAB_KEYS = ['all', 'like', 'comment', 'system'];
const ICON_MAP: Record<string, { name: any; color: string }> = {
  like: { name: 'heart', color: '#ff5252' },
  comment: { name: 'chatbubble', color: '#5b8bff' },
  order: { name: 'cart', color: '#ff9800' },
  system: { name: 'notifications', color: '#4CAF50' },
};

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<MsgData | null>(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    try {
      const t = TAB_KEYS[tab];
      setData(await apiRequest<MsgData>(`/messages${t !== 'all' ? `?tab=${t}` : ''}`, { auth: true }));
    } catch { setData(null); }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      {/* Header matching Legacy message.html */}
      <View style={{ paddingTop: insets.top + 4 }} className="bg-white px-4 pb-3 shadow-sm">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={22} color="#333" />
          </Pressable>
          <Text className="text-[17px] font-semibold text-[#333]">消息中心</Text>
          <View style={{ width: 28 }} />
        </View>
      </View>

      {/* Tabs matching Legacy */}
      <View className="flex-row border-b border-[#eee] bg-white">
        {TABS.map((t, i) => (
          <Pressable key={t} onPress={() => setTab(i)} className="flex-1 items-center py-2.5">
            <Text className={`text-[13px] ${i === tab ? 'font-bold text-[#333]' : 'text-[#999]'}`}>{t}</Text>
            {i === tab ? <View style={{ height: 2, width: 24, backgroundColor: '#56b5a3', marginTop: 4, borderRadius: 1 }} /> : null}
          </Pressable>
        ))}
      </View>

      <ScrollView>
        {!data ? (
          <View className="items-center py-20"><ActivityIndicator color="#56b5a3" /></View>
        ) : data.list.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">暂无消息</Text>
          </View>
        ) : (
          data.list.map((m) => {
            const icon = ICON_MAP[m.type] ?? ICON_MAP.system;
            return (
              <Pressable key={m.id} className="flex-row items-center border-b border-[#f0f0f0] bg-white px-4 py-3.5">
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: icon.color + '20' }} className="items-center justify-center">
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                  {m.unread ? <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff5252' }} /> : null}
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-[14px] ${m.unread ? 'font-bold text-[#333]' : 'text-[#333]'}`}>{m.title}</Text>
                    <Text className="text-[11px] text-[#bbb]">{m.time}</Text>
                  </View>
                  <Text numberOfLines={1} className="mt-0.5 text-[12px] text-[#999]">{m.text}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
