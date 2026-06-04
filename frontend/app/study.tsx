import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOPICS = [
  { name: '粤剧', icon: 'musical-notes', desc: '岭南文化瑰宝，世界级非遗', color: '#E05C3A', route: '/quiz/1' },
  { name: '广绣', icon: 'color-palette', desc: '一针一线绣出岭南风华', color: '#D44A7A', route: '/quiz/2' },
  { name: '醒狮', icon: 'paw', desc: '威武雄壮，驱邪纳福', color: '#E0892F', route: '/quiz/3' },
  { name: '工夫茶', icon: 'cafe', desc: '潮汕茶道，品味人生', color: '#5C8A6D', route: '/quiz/4' },
  { name: '龙舟', icon: 'boat', desc: '百舸争流，奋勇争先', color: '#3B7CB6', route: '/quiz/5' },
  { name: '岭南建筑', icon: 'home', desc: '镬耳山墙，骑楼连廊', color: '#7B68AE', route: '/quiz/1' },
  { name: '广东剪纸', icon: 'cut', desc: '纸上生花，非遗技艺', color: '#C0392B', route: '/quiz/1' },
  { name: '皮影戏', icon: 'film', desc: '光影故事，千年传承', color: '#8E6B3F', route: '/quiz/1' },
];

const VIDEOS = [
  { title: '粤剧《帝女花》经典片段', duration: '5:32', thumb: 'musical-notes' },
  { title: '广绣传承人现场演示', duration: '8:15', thumb: 'color-palette' },
  { title: '佛山醒狮采青表演', duration: '3:48', thumb: 'paw' },
];

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#fdf8f2]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header — matching Legacy study.html */}
        <View style={{ paddingTop: insets.top + 8 }} className="bg-[#476647] px-4 pb-5 shadow-sm">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </Pressable>
            <Text className="text-[18px] font-bold text-white">学习小课堂</Text>
          </View>
          <Text className="mt-2 text-[13px] text-white/75">探索岭南非遗文化，传承中华文明</Text>
        </View>

        {/* Topics grid — matching Legacy .card-list */}
        <View className="px-4 pt-4">
          <View className="mb-2 flex-row items-center">
            <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#476647' }} />
            <Text className="ml-2 text-[16px] font-bold text-[#333]">非遗主题</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {TOPICS.map((t) => (
              <Pressable key={t.name} onPress={() => router.push(t.route as any)}
                style={{ width: '46%' }} className="rounded-xl bg-white p-3 shadow-sm">
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.color + '20' }} className="items-center justify-center">
                  <Ionicons name={t.icon as any} size={20} color={t.color} />
                </View>
                <Text className="mt-2 text-[14px] font-bold text-[#222]">{t.name}</Text>
                <Text numberOfLines={1} className="mt-0.5 text-[12px] text-[#888]">{t.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Videos section — matching Legacy .video-box */}
        <View className="mt-5 px-4">
          <View className="mb-2 flex-row items-center">
            <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#476647' }} />
            <Text className="ml-2 text-[16px] font-bold text-[#333]">视频学习</Text>
          </View>
          {VIDEOS.map((v, i) => (
            <Pressable key={i} className="mb-3 flex-row items-center overflow-hidden rounded-xl bg-white shadow-sm">
              <View style={{ width: 100, height: 64, backgroundColor: '#476647' + '30' }} className="items-center justify-center">
                <Ionicons name={v.thumb as any} size={24} color="#476647" />
              </View>
              <View className="flex-1 px-3">
                <Text numberOfLines={2} className="text-[13px] font-semibold text-[#333]">{v.title}</Text>
                <Text className="mt-1 text-[11px] text-[#999]">{v.duration}</Text>
              </View>
              <Ionicons name="play-circle" size={28} color="#476647" />
              <View style={{ width: 8 }} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
