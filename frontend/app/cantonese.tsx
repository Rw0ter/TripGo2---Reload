import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PHRASES = [
  { canto: '你好 (nei5 hou2)', mandarin: '你好', emoji: '👋' },
  { canto: '多谢 (do1 ze6)', mandarin: '谢谢', emoji: '🙏' },
  { canto: '唔該 (m4 goi1)', mandarin: '麻烦/谢谢', emoji: '😊' },
  { canto: '早晨 (zou2 san4)', mandarin: '早上好', emoji: '🌅' },
  { canto: '食咗飯未？(sik6 zo2 faan6 mei6)', mandarin: '吃饭了吗？', emoji: '🍚' },
  { canto: '好靚 (hou2 leng3)', mandarin: '很漂亮', emoji: '✨' },
  { canto: '慢慢行 (maan6 maan6 haang4)', mandarin: '慢走', emoji: '🚶' },
  { canto: '飲茶 (jam2 caa4)', mandarin: '喝茶/吃点心', emoji: '🍵' },
];

const LESSONS = [
  { title: '粤语拼音入门', desc: '学习粤拼基本规则', icon: 'text', lessons: 5 },
  { title: '日常对话', desc: '问候、购物、出行', icon: 'chatbubbles', lessons: 10 },
  { title: '饮食文化', desc: '茶楼点餐、美食表达', icon: 'restaurant', lessons: 6 },
  { title: '岭南俗语', desc: '地道俚语和谚语', icon: 'book', lessons: 8 },
];

export default function CantoneseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FFF8F0]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header with gradient */}
        <View style={{ paddingTop: insets.top + 6 }} className="bg-[#D4522A] pb-8">
          <View className="flex-row items-center px-4">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Text className="text-[18px] font-bold text-white">粤语课堂</Text>
          </View>
          <Text className="mt-4 text-center text-[40px]">🗣️</Text>
          <Text className="mt-2 text-center text-[15px] text-white/80">学说广东话 · 传承岭南音</Text>
        </View>

        {/* Card section */}
        <View style={{ marginTop: -16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} className="bg-[#FFF8F0] px-4 pt-5">
          {/* Common phrases */}
          <Text className="mb-2 text-[16px] font-bold text-[#333]">常用短语</Text>
          {PHRASES.map((p, i) => (
            <View key={i} className="mb-2 flex-row items-center rounded-xl bg-white p-3 shadow-sm">
              <Text className="text-[24px]">{p.emoji}</Text>
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold text-[#333]">{p.canto}</Text>
                <Text className="mt-0.5 text-[12px] text-[#999]">{p.mandarin}</Text>
              </View>
              <Pressable className="rounded-full bg-[#D4522A]/10 px-3 py-1.5">
                <Ionicons name="volume-high" size={18} color="#D4522A" />
              </Pressable>
            </View>
          ))}

          {/* Lesson cards */}
          <Text className="mb-2 mt-5 text-[16px] font-bold text-[#333]">课程内容</Text>
          {LESSONS.map((l) => (
            <Pressable key={l.title} className="mb-2 flex-row items-center rounded-xl bg-white p-3.5 shadow-sm">
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#D4522A20' }} className="items-center justify-center">
                <Ionicons name={l.icon as any} size={22} color="#D4522A" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold text-[#333]">{l.title}</Text>
                <Text className="mt-0.5 text-[12px] text-[#999]">{l.desc} · {l.lessons} 课时</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
