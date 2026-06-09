import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

// ── 中国红 · 非遗主题色（与党政红呼应；区别于 App 主体岭南绿）──
const RED = '#C8161D';
const RED_DARK = '#9E1115';
const GOLD = '#C9A24B';
const BG = '#FBF4EC';
const INK = '#3A2A22';
const MUTE = '#9b8f86';

// 后端 GET /cultural/:id 返回结构（content 为 JSON：{ quizId, image, intro }）
interface CulturalItem {
  id: number;
  category: string;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  color: string;
}
interface TopicContent {
  quizId?: number;
  image?: string;
  intro?: string;
}

function parseContent(s: string): TopicContent {
  try {
    return JSON.parse(s) as TopicContent;
  } catch {
    return {};
  }
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// 非遗详情：全幅封面 + 上浮内容卡 + 项目简介 + 「开始答题」CTA。
export default function StudyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [item, setItem] = useState<CulturalItem | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setItem(await apiRequest<CulturalItem>(`/cultural/${topicId}`));
    } catch {
      setError(true);
    }
  }, [topicId]);

  useEffect(() => {
    void load();
  }, [load]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/study');
  }

  const Back = (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="返回"
      style={{
        position: 'absolute',
        top: insets.top + 6,
        left: 12,
        height: 38,
        width: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.28)',
      }}>
      <Ionicons name="chevron-back" size={22} color="#fff" />
    </Pressable>
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: BG }}>
        {Back}
        <Pressable onPress={() => void load()} accessibilityRole="button" className="items-center">
          <Ionicons name="cloud-offline-outline" size={32} color={MUTE} />
          <Text className="mt-2 text-[14px]" style={{ color: MUTE }}>加载失败，点此重试</Text>
        </Pressable>
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: BG }}>
        {Back}
        <ActivityIndicator color={RED} />
      </View>
    );
  }

  const c = parseContent(item.content);
  const paragraphs = (c.intro || item.subtitle).split('\n').map((s) => s.trim()).filter(Boolean);
  const icon: IconName = (item.icon as IconName) || 'sparkles';
  const heroH = Math.min(300, Math.round(width * 0.72));

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        {/* ── 全幅封面（真实非遗图）+ 红色渐隐 + 标题叠字 ── */}
        <View>
          <Image
            source={resolveLegacyImage(c.image || '')}
            resizeMode="cover"
            style={{ width, height: heroH }}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.18)', 'transparent', 'rgba(158,17,21,0.94)']}
            locations={[0, 0.45, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="absolute bottom-4 left-4 right-4">
            <View className="flex-row">
              <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: GOLD }}>
                <Ionicons name="ribbon" size={12} color="#fff" />
                <Text className="ml-1 text-[11px] font-bold text-white">广东非物质文化遗产</Text>
              </View>
            </View>
            <Text className="mt-2 text-[27px] font-extrabold text-white" style={{ letterSpacing: 0.5 }}>
              {item.title}
            </Text>
            <Text className="mt-0.5 text-[13.5px] text-white/90">{item.subtitle}</Text>
          </View>
        </View>

        {/* ── 上浮内容卡 ── */}
        <Animated.View
          entering={FadeInDown.duration(420)}
          style={{ marginTop: -22, backgroundColor: BG }}
          className="rounded-t-[26px] px-5 pt-5">
          {/* 非遗名片行 */}
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: '#FBE3E1' }}>
              <Ionicons name={icon} size={24} color={RED} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[12px] font-semibold" style={{ color: GOLD }}>非遗名片</Text>
              <Text numberOfLines={1} className="mt-0.5 text-[16px] font-extrabold" style={{ color: INK }}>
                {item.title}
              </Text>
            </View>
          </View>

          {/* 项目简介 */}
          <View className="mt-6 flex-row items-center">
            <View style={{ width: 4, height: 17, borderRadius: 2, backgroundColor: RED }} />
            <Text className="ml-2 text-[16px] font-extrabold" style={{ color: INK }}>项目简介</Text>
          </View>
          {paragraphs.map((p, i) => (
            <Text key={i} className="mt-3 text-[15px] leading-7" style={{ color: '#5b4d44' }}>
              {p}
            </Text>
          ))}

          {/* 装饰分隔 */}
          <View className="mt-6 flex-row items-center justify-center">
            <View style={{ height: 1, flex: 1, backgroundColor: '#EADfce' }} />
            <Ionicons name="leaf" size={14} color={GOLD} style={{ marginHorizontal: 8 }} />
            <View style={{ height: 1, flex: 1, backgroundColor: '#EADfce' }} />
          </View>

          {/* 开始答题 CTA → 对应 quiz */}
          <Pressable
            onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: String(c.quizId ?? 1) } })}
            accessibilityRole="button"
            accessibilityLabel="开始知识答题"
            style={({ pressed }) => ({ transform: pressed ? [{ scale: 0.98 }] : [], marginTop: 20 })}
            className="overflow-hidden rounded-2xl">
            <LinearGradient
              colors={[RED, RED_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 15, boxShadow: '0px 6px 16px rgba(200,22,29,0.30)' }}
              className="flex-row items-center justify-center">
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text className="ml-2 text-[16px] font-bold text-white">开始知识答题</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {Back}
    </View>
  );
}
