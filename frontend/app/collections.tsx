import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEMS = [
  { id: 1, title: '端午龙舟文化节', date: '2026-06-10', loc: '广州珠江', tag: '活动' },
  { id: 2, title: '广绣非遗体验工坊', date: '2026-06-15', loc: '佛山顺德', tag: '研学' },
  { id: 3, title: '粤剧《帝女花》演出', date: '2026-06-20', loc: '广州粤剧艺术博物馆', tag: '演出' },
  { id: 4, title: '潮汕工夫茶品鉴会', date: '2026-06-25', loc: '汕头小公园', tag: '活动' },
  { id: 5, title: '岭南剪纸艺术展', date: '2026-07-01', loc: '广东省博物馆', tag: '展览' },
];

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FAF6F0]">
      {/* Header matching Legacy my_star.html */}
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center bg-white/90 px-4 pb-3 shadow-sm">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[18px] font-bold text-[#2D3748]">活动收藏</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="mb-3 text-center text-[24px] font-bold text-[#2D3748]">
          <Text className="text-[#48BB78]">我的</Text>收藏活动
        </Text>
        <Text className="mb-4 text-center text-[13px] text-[#718096]">探索传统与现代交融的文化盛宴</Text>

        {ITEMS.map((item) => (
          <Pressable key={item.id} className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
            <View className="flex-row items-center p-4">
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#48BB7820' }} className="items-center justify-center">
                <Ionicons name="heart" size={22} color="#C53030" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-[#2D3748]">{item.title}</Text>
                <View className="mt-1 flex-row items-center gap-3">
                  <Text className="text-[12px] text-[#718096]">{item.date}</Text>
                  <Text className="text-[12px] text-[#718096]">{item.loc}</Text>
                </View>
              </View>
              <View className="rounded-full bg-[#48BB7820] px-3 py-1">
                <Text className="text-[11px] font-medium text-[#48BB78]">{item.tag}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
