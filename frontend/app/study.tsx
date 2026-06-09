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

// ── 中国红 · 非遗主题色（与党政红呼应；区别于 App 主体岭南绿）──
const RED = '#C8161D';
const RED_DARK = '#9E1115';
const GOLD = '#C9A24B';
const BG = '#FBF4EC';
const INK = '#3A2A22';
const MUTE = '#9b8f86';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// 后端 GET /cultural?category=topic 返回结构（content 为 JSON：{ quizId, image, intro }）
interface CulturalItem {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  color: string;
}

function topicImage(content: string): string {
  try {
    return (JSON.parse(content) as { image?: string }).image ?? '';
  } catch {
    return '';
  }
}

// 近期活动（暂无对应后端，保留静态展示，用 Legacy 真实非遗活动图）
const ACTIVITIES = [
  { name: '非遗文化周', desc: '体验传统手工艺制作，剪纸、泥塑、糖画等多种非遗项目现场体验。', image: 'fyxx/syhd.jpg' },
  { name: '传统戏曲展演', desc: '粤剧、潮剧等传统戏曲专场演出，领略岭南戏曲艺术的独特魅力。', image: 'fyxx/sywhz.png' },
];

// 区块标题：红色竖条 + 可选图标 + 粗体标题。
function SectionTitle({ title, icon }: { title: string; icon?: IconName }) {
  return (
    <View className="mb-3 flex-row items-center px-4">
      <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: RED }} />
      {icon ? <Ionicons name={icon} size={15} color={RED} style={{ marginLeft: 7 }} /> : null}
      <Text className="ml-2 text-[17px] font-extrabold" style={{ color: INK }}>{title}</Text>
    </View>
  );
}

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
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── 中国红 Hero 头部 ── */}
        <LinearGradient colors={[RED, RED_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <ScreenHeader title="非遗课堂" subtitle="广东非物质文化遗产" tint="dark" />
          <Animated.View entering={FadeInDown.duration(420)} className="px-5 pb-6 pt-1">
            <View className="flex-row items-center">
              <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: GOLD }} />
              <Text className="ml-2.5 text-[22px] font-extrabold text-white" style={{ letterSpacing: 0.5 }}>
                走进广东非遗
              </Text>
            </View>
            <Text className="mt-2.5 text-[13.5px] leading-6 text-white/90">
              从声韵悠扬的粤剧，到精美绝伦的广绣；从热血澎湃的醒狮，到香气四溢的工夫茶——每一项非遗都承载着岭南的匠心与记忆。
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* ── 主体：圆角上提 ── */}
        <View className="-mt-4 rounded-t-[24px] pt-5" style={{ backgroundColor: BG }}>
          {/* 精选非遗项目（接 GET /cultural?category=topic，真实图打底卡）*/}
          <SectionTitle title="非遗名录" icon="ribbon" />

          {!topics && !error ? (
            <View className="items-center py-12">
              <ActivityIndicator color={RED} />
            </View>
          ) : error ? (
            <View className="items-center py-12">
              <Ionicons name="cloud-offline-outline" size={38} color={MUTE} />
              <Text className="mt-2 text-[13px]" style={{ color: MUTE }}>加载失败</Text>
              <Pressable onPress={() => void load()} className="mt-3 rounded-full px-6 py-2" style={{ backgroundColor: RED }}>
                <Text className="text-[13px] font-bold text-white">重试</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between px-4">
              {topics!.map((item, i) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(400).delay(i * 70)}
                  style={{ width: '48%' }}
                  className="mb-3.5">
                  <Pressable
                    onPress={() => router.push({ pathname: '/study/[id]', params: { id: item.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    style={({ pressed }) => ({
                      transform: pressed ? [{ scale: 0.97 }] : [],
                      boxShadow: '0px 4px 12px rgba(158,17,21,0.14)',
                    })}
                    className="overflow-hidden rounded-2xl">
                    <View style={{ height: 142 }}>
                      <Image
                        source={resolveLegacyImage(topicImage(item.content))}
                        resizeMode="cover"
                        style={{ width: '100%', height: 142 }}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(120,12,16,0.85)']}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '74%' }}
                      />
                      {/* 非遗角标 */}
                      <View
                        className="absolute left-2 top-2 flex-row items-center rounded-full px-2 py-0.5"
                        style={{ backgroundColor: 'rgba(201,162,75,0.95)' }}>
                        <Ionicons name={(item.icon as IconName) || 'sparkles'} size={10} color="#fff" />
                        <Text className="ml-1 text-[10px] font-bold text-white">非遗</Text>
                      </View>
                      {/* 标题叠字 */}
                      <View className="absolute bottom-2 left-2.5 right-2.5">
                        <Text className="text-[15px] font-extrabold text-white">{item.title}</Text>
                        <Text numberOfLines={1} className="mt-0.5 text-[11px] text-white/85">
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}

          {/* 近期活动 */}
          <View className="mt-5">
            <SectionTitle title="近期活动" icon="calendar" />
            <View className="flex-row flex-wrap justify-between px-4">
              {ACTIVITIES.map((item, i) => (
                <Animated.View
                  key={item.name}
                  entering={FadeInDown.duration(400).delay((8 + i) * 80)}
                  style={{ width: '48%', boxShadow: '0px 4px 12px rgba(0,0,0,0.07)' }}
                  className="mb-3.5 overflow-hidden rounded-2xl bg-white">
                  <Image source={resolveLegacyImage(item.image)} style={{ width: '100%', height: 104 }} resizeMode="cover" />
                  <View className="p-3">
                    <Text className="text-[14px] font-bold" style={{ color: INK }}>{item.name}</Text>
                    <Text numberOfLines={2} className="mt-1.5 text-[12px] leading-[17px]" style={{ color: '#7a6b60' }}>
                      {item.desc}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* 知识测验 CTA */}
          <View className="mb-6 mt-4 px-4">
            <Pressable
              onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: '1' } })}
              accessibilityRole="button"
              accessibilityLabel="开始知识测验"
              style={({ pressed }) => ({ transform: pressed ? [{ scale: 0.98 }] : [] })}
              className="overflow-hidden rounded-2xl">
              <LinearGradient
                colors={[RED, RED_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 15, boxShadow: '0px 6px 16px rgba(200,22,29,0.28)' }}
                className="flex-row items-center justify-center">
                <Ionicons name="ribbon-outline" size={18} color="#fff" />
                <Text className="ml-2 text-[16px] font-bold text-white">开始非遗知识测验</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
