import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { resolveLegacyImage } from '@/lib/legacy-images';

// ── 数据 ──────────────────────────────────────────────

const CATEGORIES = [
  { emoji: '\u{1F3AD}', name: '传统戏剧' },
  { emoji: '✂️', name: '传统技艺' },
  { emoji: '\u{1F3A8}', name: '民间美术' },
  { emoji: '\u{1F3B5}', name: '传统音乐' },
  { emoji: '\u{1F483}', name: '传统舞蹈' },
  { emoji: '\u{1F4DC}', name: '民间文学' },
  { emoji: '\u{1F375}', name: '传统医药' },
  { emoji: '\u{1F3AF}', name: '民俗活动' },
];

const HERITAGE = [
  {
    name: '粤剧艺术',
    desc: '广东地区传统戏曲剧种，又称"广府大戏"，流行于粤语地区，2009年被联合国教科文组织列为"人类非物质文化遗产代表作"。',
    image: 'fyxx/yuejufm.jpg',
  },
  {
    name: '剪纸艺术',
    desc: '中国民间传统装饰艺术，用剪刀或刻刀在纸上剪刻花纹，用于装点生活或配合其他民俗活动。',
    image: 'fyxx/jianzhifm1.jpg',
  },
  {
    name: '广东针灸',
    desc: '岭南地区独特的针灸疗法，融合了传统中医理论与岭南地区气候特点，形成了独具特色的治疗体系。',
    image: 'fyxx/zhenjiufm.jpg',
  },
  {
    name: '皮影戏',
    desc: '中国古老的民间艺术形式，用兽皮或纸板做成人物剪影表演故事，2011年被列入人类非物质文化遗产名录。',
    image: 'fyxx/piyingfm.png',
  },
];

const ACTIVITIES = [
  {
    name: '非遗文化周',
    desc: '体验传统手工艺制作，感受非遗魅力，活动包括剪纸、泥塑、糖画等多种非遗项目体验。',
    image: 'fyxx/syhd.jpg',
  },
  {
    name: '传统戏曲展演',
    desc: '昆曲、京剧、越剧等传统戏曲专场演出，带您领略中国传统戏曲艺术的独特魅力。',
    image: 'fyxx/sywhz.png',
  },
];

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#fdf8f2]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header (matches legacy .header) ── */}
        <View style={{ paddingTop: insets.top + 8 }} className="bg-[#476647] px-4 pb-4 shadow-sm">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm"
            >
              <Ionicons name="chevron-back" size={16} color="#476647" />
            </Pressable>
            <Text className="text-[18px] font-bold text-white">学习非遗文化</Text>
          </View>
        </View>

        {/* ── Welcome section (matches legacy .section) ── */}
        <Animated.View entering={FadeInDown.duration(400)} className="px-4 pt-6 pb-2">
          <Text className="text-center text-[20px] font-bold text-[#1a4b3c]">走进广东非遗</Text>
          <Text className="mt-3 text-[15px] leading-6 text-[#555]">
            广东非物质文化遗产丰富多彩，从声韵悠扬的粤剧，到精美绝伦的广绣，从热血澎湃的英歌舞，到香气四溢的广式点心，每一项都承载着岭南文化的独特魅力。
          </Text>
        </Animated.View>

        {/* ── Category navigation grid (matches legacy .category-nav, 4-col 2-row) ── */}
        <Text className="mt-3 text-center text-[16px] font-bold text-[#1a4b3c]">非遗知识学习卡</Text>
        <View className="mt-3 flex-row flex-wrap px-2">
          {CATEGORIES.map((cat, i) => (
            <View key={i} style={{ width: '25%' }} className="mb-4 items-center">
              <View className="h-[50px] w-[50px] items-center justify-center rounded-full border border-[#1a4b3c]/20 bg-[#d0e3da]/70">
                <Text className="text-[22px]">{cat.emoji}</Text>
              </View>
              <Text className="mt-2 text-center text-[12px] text-[#3a5449]">{cat.name}</Text>
            </View>
          ))}
        </View>

        {/* ── Featured heritage projects (matches legacy .section-title + .heritage-list) ── */}
        <View className="mt-5 px-4">
          <View className="mb-4 flex-row items-center">
            <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#1a4b3c' }} />
            <Text className="ml-2 text-[18px] font-bold text-[#1a4b3c]">精选非遗项目</Text>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {HERITAGE.map((item, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.duration(400).delay(i * 100)}
                style={{ width: '48%' }}
                className="mb-3 overflow-hidden rounded-lg border border-[#d0e3da]/50 bg-white/80 shadow-sm"
              >
                <Image
                  source={resolveLegacyImage(item.image)}
                  style={{ width: '100%', height: 100 }}
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text className="text-[14px] font-bold text-[#1a4b3c]">{item.name}</Text>
                  <Text numberOfLines={2} className="mt-1.5 text-[12px] leading-[17px] text-[#5a7267]">
                    {item.desc}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Recent activities (matches legacy .section-title + .heritage-list) ── */}
        <View className="mt-5 px-4">
          <View className="mb-4 flex-row items-center">
            <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#1a4b3c' }} />
            <Text className="ml-2 text-[18px] font-bold text-[#1a4b3c]">近期活动</Text>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {ACTIVITIES.map((item, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.duration(400).delay((4 + i) * 100)}
                style={{ width: '48%' }}
                className="mb-3 overflow-hidden rounded-lg border border-[#d0e3da]/50 bg-white/80 shadow-sm"
              >
                <Image
                  source={resolveLegacyImage(item.image)}
                  style={{ width: '100%', height: 100 }}
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text className="text-[14px] font-bold text-[#1a4b3c]">{item.name}</Text>
                  <Text numberOfLines={2} className="mt-1.5 text-[12px] leading-[17px] text-[#5a7267]">
                    {item.desc}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Quiz CTA button (matches legacy .learn-btn) ── */}
        <View className="mt-8 mb-6 px-4">
          <Pressable
            onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: '1' } })}
            className="overflow-hidden rounded-[25px] shadow-md"
          >
            <LinearGradient
              colors={['#FFB300', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-[16px] font-semibold text-white">开始知识测验</Text>
            </LinearGradient>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
