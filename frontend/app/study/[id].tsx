import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
const RED_DARK = '#8B1F1F';
const RED_INK = '#5E0E10';
const GOLD = '#C9A24B';
const GOLD_LIGHT = '#F5D58A';
const GOLD_DEEP = '#A9772F';
const BG = '#FBF4EC';
const PAPER = '#FFFDF8';
const INK = '#3A2A22';
const SUB = '#5b4d44';
const MUTE = '#a89a8f';

// 后端 GET /cultural/:id 返回结构（content 为 JSON 串）。
interface CulturalItem {
  id: number;
  category: string;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  color: string;
}

// content 解析结果——后端 seed 写入的完整字段（详见 prisma/seed.ts）。
interface TopicContent {
  quizId?: number;
  image?: string;
  gallery?: string[];
  intro?: string;
  history?: string;
  highlights?: string[];
  funFact?: string;
}

function parseContent(s: string): TopicContent {
  try {
    return JSON.parse(s) as TopicContent;
  } catch {
    return {};
  }
}

// 中式段落标题：朱金双竖条 + 标题 + 副题（去通用图标圆，纯排版承载）。
function BlockTitle({ title, en }: { title: string; en?: string }) {
  return (
    <View className="mt-7">
      <View className="flex-row items-center">
        <View style={{ width: 3, height: 19, borderRadius: 2, backgroundColor: RED }} />
        <View style={{ width: 3, height: 19, borderRadius: 2, backgroundColor: GOLD, marginLeft: 3 }} />
        <Text className="ml-2.5 text-[18px] font-extrabold" style={{ color: INK, letterSpacing: 1 }}>
          {title}
        </Text>
      </View>
      {en ? (
        <Text className="ml-2 mt-1 text-[11px]" style={{ color: MUTE, letterSpacing: 2 }}>
          {en}
        </Text>
      ) : null}
    </View>
  );
}

// 描金小菱形（45° 旋转方块）——替代项目符号点 / 段首装饰。
function GoldDiamond({ size = 6 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        backgroundColor: GOLD,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

// 非遗详情：大幅封面 hero + 上浮内容卡（展签信息行）+ 导读朱印 + 历史 + 艺术特色钤印 +
// 横向画廊（Modal 灯箱看大图）+ 红底「你知道吗」引文卡 + 描金分隔 + 红金 CTA。
export default function StudyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [item, setItem] = useState<CulturalItem | null>(null);
  const [error, setError] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

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

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/study');
  }, [router]);

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
        backgroundColor: 'rgba(94,14,16,0.42)',
      }}>
      <Ionicons name="chevron-back" size={22} color="#fff" />
    </Pressable>
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: BG }}>
        {Back}
        <Pressable onPress={() => void load()} accessibilityRole="button" className="items-center">
          <Ionicons name="cloud-offline-outline" size={36} color={MUTE} />
          <Text className="mt-2 text-[14px]" style={{ color: MUTE }}>
            加载失败，点此重试
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: BG }}>
        {Back}
        <ActivityIndicator color={RED} size="large" />
      </View>
    );
  }

  const c = parseContent(item.content);
  const intro = c.intro || item.subtitle;
  const history = c.history || '';
  const highlights = c.highlights ?? [];
  const gallery = (c.gallery ?? []).filter(Boolean);
  const funFact = c.funFact || '';
  const heroH = Math.min(330, Math.round(width * 0.84));
  // 画廊单图宽度：留出左右边距与窥视下一张的余量。
  const galleryW = Math.round(width * 0.66);
  const galleryH = Math.round(galleryW * 0.7);

  // 展签信息行三格——编辑/展陈语言，数据现成（编号 / 画廊图数 / 艺术特色条数）。
  const meta = [
    { label: '项目编号', value: `No.${item.id.toString().padStart(2, '0')}` },
    { label: '展厅画廊', value: `${gallery.length} 图` },
    { label: '艺术特色', value: `${highlights.length} 项` },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {/* ── 大幅封面 hero（真实非遗图）+ 红色三段渐隐 + 标题/副标题叠字 ── */}
        <View>
          <Image source={resolveLegacyImage(c.image || '')} resizeMode="cover" style={{ width, height: heroH }} />
          <LinearGradient
            colors={['rgba(0,0,0,0.28)', 'transparent', 'rgba(94,14,16,0.96)']}
            locations={[0, 0.42, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          {/* 描金压角（左上）——中式钤印质感 */}
          <View
            style={{
              position: 'absolute',
              left: 16,
              top: insets.top + 52,
              width: 28,
              height: 28,
              borderLeftWidth: 2,
              borderTopWidth: 2,
              borderColor: 'rgba(245,213,138,0.8)',
            }}
          />
          <View className="absolute bottom-5 left-5 right-5">
            <View className="flex-row">
              <View
                className="flex-row items-center rounded-full px-2.5 py-1"
                style={{ backgroundColor: 'rgba(94,14,16,0.4)', borderWidth: 1, borderColor: 'rgba(245,213,138,0.7)' }}>
                <GoldDiamond size={5} />
                <Text className="ml-1.5 text-[11px] font-bold" style={{ color: GOLD_LIGHT, letterSpacing: 1 }}>
                  广东非物质文化遗产
                </Text>
              </View>
            </View>
            <Text className="mt-2.5 text-[32px] font-black text-white" style={{ letterSpacing: 3 }}>
              {item.title}
            </Text>
            <View className="mt-1 flex-row items-center">
              <View style={{ width: 22, height: 2, borderRadius: 1, backgroundColor: GOLD }} />
              <Text className="ml-2 text-[14px] text-white/90" style={{ letterSpacing: 1 }}>
                {item.subtitle}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 上浮内容卡 ── */}
        <Animated.View
          entering={FadeInDown.duration(440)}
          style={{ marginTop: -24, backgroundColor: BG }}
          className="rounded-t-[28px] px-5 pt-6">
          {/* 展签信息行：编号 / 画廊图数 / 艺术特色——描金边框分隔，无彩色圆图标 */}
          <View
            className="flex-row overflow-hidden rounded-2xl"
            style={{ backgroundColor: PAPER, borderWidth: 1, borderColor: 'rgba(201,162,75,0.4)' }}>
            {meta.map((m, i) => (
              <View
                key={m.label}
                className="flex-1 items-center py-3"
                style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: 'rgba(201,162,75,0.3)' } : undefined}>
                <Text className="text-[15px] font-extrabold" style={{ color: RED, letterSpacing: 0.5 }}>
                  {m.value}
                </Text>
                <Text className="mt-1 text-[10.5px] font-semibold" style={{ color: GOLD_DEEP, letterSpacing: 1 }}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>

          {/* 导读：朱印竖排 + 引文体导语 */}
          <View className="mt-6 flex-row">
            <View
              className="mr-3 items-center justify-center"
              style={{
                backgroundColor: RED,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.6)',
                paddingHorizontal: 6,
                paddingVertical: 8,
                alignSelf: 'flex-start',
              }}>
              <Text className="font-black text-white" style={{ fontSize: 14, lineHeight: 17, letterSpacing: 2 }}>
                导{'\n'}读
              </Text>
            </View>
            <Text className="flex-1 text-[15px]" style={{ color: SUB, lineHeight: 26 }}>
              {intro}
            </Text>
          </View>

          {/* ── 历史渊源（seed 为单段无换行，整段渲染 + 段首描金菱形）── */}
          {history ? (
            <>
              <BlockTitle title="历史渊源" en="源流 · 传承" />
              <View
                className="mt-3.5 flex-row rounded-2xl p-4"
                style={{ backgroundColor: PAPER, borderWidth: 1, borderColor: 'rgba(201,162,75,0.24)' }}>
                <View style={{ paddingTop: 8, width: 14 }}>
                  <GoldDiamond size={6} />
                </View>
                <Text className="flex-1 text-[15px]" style={{ color: SUB, lineHeight: 27 }}>
                  {history}
                </Text>
              </View>
            </>
          ) : null}

          {/* ── 艺术特色（旋转 45° 描金菱形钤印序号，无 emoji）── */}
          {highlights.length > 0 ? (
            <>
              <BlockTitle title="艺术特色" en="技艺 · 看点" />
              <View className="mt-3.5">
                {highlights.map((h, i) => (
                  <View
                    key={i}
                    className="mb-2.5 flex-row items-start rounded-2xl p-3.5"
                    style={{ backgroundColor: PAPER, borderWidth: 1, borderColor: 'rgba(201,162,75,0.28)' }}>
                    <View
                      className="mr-3 items-center justify-center"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        backgroundColor: 'rgba(200,22,29,0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(201,162,75,0.5)',
                        transform: [{ rotate: '45deg' }],
                      }}>
                      <Text
                        className="text-[12px] font-black"
                        style={{ color: RED, transform: [{ rotate: '-45deg' }] }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text className="flex-1 text-[14px]" style={{ color: INK, lineHeight: 22 }}>
                      {h}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* ── 横向画廊（snap 吸附 + 点开 Modal 灯箱看大图）── */}
          {gallery.length > 0 ? (
            <>
              <BlockTitle title="非遗影像" en="点击查看大图" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 14, paddingRight: 5 }}
                snapToInterval={galleryW + 12}
                decelerationRate="fast">
                {gallery.map((key, i) => (
                  <Pressable
                    key={`${key}-${i}`}
                    onPress={() => setLightbox(key)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`${item.title} 影像 ${i + 1}`}
                    style={({ pressed }) => ({
                      marginRight: 12,
                      transform: pressed ? [{ scale: 0.98 }] : [],
                      boxShadow: '0px 6px 16px rgba(94,14,16,0.16)',
                    })}
                    className="overflow-hidden rounded-2xl">
                    <View style={{ width: galleryW, height: galleryH }}>
                      <Image
                        source={resolveLegacyImage(key)}
                        resizeMode="cover"
                        style={{ width: galleryW, height: galleryH }}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(60,8,10,0.55)']}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }}
                      />
                      <View className="absolute bottom-2 left-2.5 flex-row items-center">
                        <Text className="text-[12px] font-bold text-white">
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                        <Text className="ml-1 text-[11px] text-white/75">
                          / {String(gallery.length).padStart(2, '0')}
                        </Text>
                      </View>
                      <View
                        className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.32)' }}>
                        <Ionicons name="expand-outline" size={13} color="#fff" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* ── 你知道吗 —— 红底大「?」水印引文卡 ── */}
          {funFact ? (
            <View className="mt-7">
              <View className="overflow-hidden rounded-3xl" style={{ boxShadow: '0px 8px 20px rgba(94,14,16,0.22)' }}>
                <LinearGradient colors={[RED, RED_DARK, RED_INK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-5">
                  {/* 大问号背景水印 */}
                  <Text
                    className="font-black"
                    style={{ position: 'absolute', top: -6, right: 10, fontSize: 90, color: 'rgba(245,213,138,0.18)' }}>
                    ?
                  </Text>
                  <View className="flex-row items-center">
                    {/* 描金菱形钤印——bulb 旋入，非彩色圆底 */}
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 5,
                        borderWidth: 1.2,
                        borderColor: 'rgba(245,213,138,0.9)',
                        transform: [{ rotate: '45deg' }],
                      }}>
                      <Ionicons name="bulb" size={12} color={GOLD_LIGHT} style={{ transform: [{ rotate: '-45deg' }] }} />
                    </View>
                    <Text className="ml-2.5 text-[15px] font-extrabold" style={{ color: GOLD_LIGHT, letterSpacing: 2 }}>
                      你知道吗
                    </Text>
                  </View>
                  <Text className="mt-3 text-[15px] text-white" style={{ lineHeight: 25 }}>
                    {funFact}
                  </Text>
                  <View className="mt-3 flex-row items-center">
                    <View style={{ width: 18, height: 2, backgroundColor: GOLD }} />
                    <Text className="ml-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
                      {item.title} · 非遗冷知识
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          ) : null}

          {/* ── 描金菱形金线分隔 ── */}
          <View className="mt-7 flex-row items-center justify-center">
            <LinearGradient
              colors={['rgba(201,162,75,0)', 'rgba(201,162,75,0.6)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: 1 }}
            />
            <View
              className="mx-3 items-center justify-center"
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                borderWidth: 1.2,
                borderColor: GOLD,
                transform: [{ rotate: '45deg' }],
              }}>
              <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: RED }} />
            </View>
            <LinearGradient
              colors={['rgba(201,162,75,0.6)', 'rgba(201,162,75,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: 1 }}
            />
          </View>

          {/* ── 开始知识答题 CTA → 对应 quiz（中国红渐变）── */}
          <Pressable
            onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: String(c.quizId ?? 1) } })}
            accessibilityRole="button"
            accessibilityLabel="开始知识答题"
            style={({ pressed }) => ({ transform: pressed ? [{ scale: 0.98 }] : [], marginTop: 18 })}
            className="overflow-hidden rounded-2xl">
            <LinearGradient
              colors={[RED, RED_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, boxShadow: '0px 8px 18px rgba(200,22,29,0.30)' }}
              className="flex-row items-center justify-center">
              {/* pencil 旋入描金菱形钤印（非圆底图标）*/}
              <View
                className="mr-2.5 items-center justify-center"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  borderWidth: 1.2,
                  borderColor: 'rgba(245,213,138,0.9)',
                  transform: [{ rotate: '45deg' }],
                }}>
                <Ionicons name="pencil" size={11} color={GOLD_LIGHT} style={{ transform: [{ rotate: '-45deg' }] }} />
              </View>
              <Text className="text-[16.5px] font-bold text-white" style={{ letterSpacing: 2 }}>
                开始知识答题
              </Text>
            </LinearGradient>
          </Pressable>
          <Text className="mt-2.5 text-center text-[11px]" style={{ color: MUTE, letterSpacing: 1 }}>
            学有所得 · 答题赢积分 · 登上锦绣山河榜
          </Text>
        </Animated.View>
      </ScrollView>

      {Back}

      {/* ── 画廊大图灯箱 ── */}
      <Modal visible={!!lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <Pressable
          onPress={() => setLightbox(null)}
          accessibilityRole="button"
          accessibilityLabel="关闭大图"
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }}>
          {lightbox ? (
            <Image
              source={resolveLegacyImage(lightbox)}
              resizeMode="contain"
              style={{ width, height: Math.round(width * 0.95) }}
            />
          ) : null}
          <View
            style={{
              position: 'absolute',
              top: insets.top + 10,
              right: 16,
              height: 40,
              width: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.16)',
            }}>
            <Ionicons name="close" size={22} color="#fff" />
          </View>
          <Text className="absolute text-[12px]" style={{ bottom: insets.bottom + 24, color: 'rgba(255,255,255,0.6)' }}>
            轻触任意处关闭
          </Text>
        </Pressable>
      </Modal>
    </View>
  );
}