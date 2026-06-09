import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

// 后端 GET /cultural?category=topic 返回结构
interface CulturalItem {
  id: number;
  title: string;
  subtitle: string;
  content: string; // JSON，如 {"quizId":1}
  icon: string;
  color: string;
}

function quizIdOf(content: string): string {
  try {
    const o = JSON.parse(content);
    return o?.quizId ? String(o.quizId) : '1';
  } catch {
    return '1';
  }
}

// 8 个非遗分类（纯导航装饰，无后端数据）
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

// 近期活动（暂无对应后端，保留静态展示）
const ACTIVITIES = [
  { name: '非遗文化周', desc: '体验传统手工艺制作，感受非遗魅力，活动包括剪纸、泥塑、糖画等多种非遗项目体验。', image: 'fyxx/syhd.jpg' },
  { name: '传统戏曲展演', desc: '粤剧、潮剧等传统戏曲专场演出，带您领略岭南传统戏曲艺术的独特魅力。', image: 'fyxx/sywhz.png' },
];

export default function StudyScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<CulturalItem[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setTopics(await apiRequest<CulturalItem[]>('/cultural?category=topic'));
    } catch {
      setError(true);
      setTopics(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-[#fdf8f2]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Header ── */}
        <View className="bg-[#476647]">
          <ScreenHeader title="学习非遗文化" subtitle="探索岭南文化瑰宝" tint="dark" />
        </View>

        {/* ── Welcome ── */}
        <Animated.View entering={FadeInDown.duration(400)} className="px-4 pt-6 pb-2">
          <Text className="text-center text-[20px] font-bold text-[#1a4b3c]">走进广东非遗</Text>
          <Text className="mt-3 text-[15px] leading-6 text-[#555]">
            广东非物质文化遗产丰富多彩，从声韵悠扬的粤剧，到精美绝伦的广绣，从热血澎湃的英歌舞，到香气四溢的广式点心，每一项都承载着岭南文化的独特魅力。
          </Text>
        </Animated.View>

        {/* ── Category grid（装饰） ── */}
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

        {/* ── 精选非遗项目（接 GET /cultural?category=topic） ── */}
        <View className="mt-5 px-4">
          <View className="mb-4 flex-row items-center">
            <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#1a4b3c' }} />
            <Text className="ml-2 text-[18px] font-bold text-[#1a4b3c]">精选非遗项目</Text>
          </View>

          {!topics && !error ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#476647" />
            </View>
          ) : error ? (
            <View className="items-center py-10">
              <Ionicons name="cloud-offline-outline" size={40} color="#ccc" />
              <Text className="mt-2 text-[13px] text-[#999]">加载失败</Text>
              <Pressable onPress={() => load()} className="mt-3 rounded-full bg-[#476647] px-6 py-2">
                <Text className="text-[13px] font-bold text-white">重试</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {topics!.map((item, i) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(400).delay(i * 80)}
                  style={{ width: '48%' }}
                  className="mb-3 overflow-hidden rounded-lg border border-[#d0e3da]/50 bg-white/80 shadow-sm"
                >
                  <Pressable
                    onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: quizIdOf(item.content) } })}
                  >
                    <View
                      style={{ height: 88, backgroundColor: item.color || '#476647' }}
                      className="items-center justify-center"
                    >
                      <Ionicons name={(item.icon as any) || 'sparkles'} size={34} color="#fff" />
                    </View>
                    <View className="p-3">
                      <Text className="text-[14px] font-bold text-[#1a4b3c]">{item.title}</Text>
                      <Text numberOfLines={2} className="mt-1.5 text-[12px] leading-[17px] text-[#5a7267]">
                        {item.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* ── 近期活动（静态） ── */}
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
                <Image source={resolveLegacyImage(item.image)} style={{ width: '100%', height: 100 }} resizeMode="cover" />
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

        {/* ── Quiz CTA ── */}
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
