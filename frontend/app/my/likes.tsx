import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIKES = [
  { title: '粤剧传承人的一天', author: '岭南行者', time: '2026-06-03' },
  { title: '手作广绣体验记', author: '绣娘小陈', time: '2026-06-02' },
  { title: '端午龙舟赛现场', author: '潮汕阿明', time: '2026-06-01' },
  { title: '工夫茶里品人生', author: '茶道中人', time: '2026-05-30' },
];

export default function MyLikesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center bg-white px-4 pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <View className="flex-row items-center">
          <Ionicons name="heart" size={18} color="#C0584B" />
          <Text className="ml-1.5 text-[17px] font-bold text-[#333]">我的点赞</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {LIKES.map((l, i) => (
          <View key={i} className="mb-3 flex-row items-center rounded-xl bg-white p-4 shadow-sm">
            <Ionicons name="heart" size={18} color="#C0584B" />
            <View className="ml-3 flex-1">
              <Text className="text-[14px] font-semibold text-[#333]">{l.title}</Text>
              <Text className="mt-0.5 text-[12px] text-[#999]">{l.author} · {l.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
