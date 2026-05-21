import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';

// 首页（对应 Legacy index1.html）。目标页面尚未建好，入口先用占位提示。
function comingSoon(name: string) {
  Alert.alert('敬请期待', `「${name}」功能正在开发中`);
}

const AD_IMAGES = [
  require('../../assets/legacy/img/top_AD.png'),
  require('../../assets/legacy/img/top_AD2.png'),
  require('../../assets/legacy/img/top_AD3.png'),
];

const GRID4 = [
  { icon: require('../../assets/legacy/img/index_list_4combo/qd.png'), label: '签到' },
  { icon: require('../../assets/legacy/img/lxwd.png'), label: '研学智囊团' },
  { icon: require('../../assets/legacy/img/index_list_4combo/phb.png'), label: '排行榜' },
  { icon: require('../../assets/legacy/img/VR.png'), label: 'VR' },
];

const ENTRY5 = [
  { icon: require('../../assets/legacy/img/pipa1.png'), label: '文创产品' },
  { icon: require('../../assets/legacy/img/lxdt3.png'), label: '旅行地图' },
  { icon: require('../../assets/legacy/img/book1.png'), label: '智能旅行助手' },
  { icon: require('../../assets/legacy/img/people_dance.png'), label: '学习小课堂' },
  { icon: require('../../assets/legacy/img/tieding1.png'), label: '粤语课堂' },
];

const QUIZ = [
  {
    tag: '积分翻倍场',
    title: '非遗文化挑战',
    desc: '限时答题赢最高 88 积分，适合新手快速上分',
    btn: '立即开始挑战',
  },
  {
    tag: '经典问答',
    title: '粤剧知识问答',
    desc: '边看边答，解锁戏台幕后冷知识，累计非遗积分',
    btn: '进入答题房间',
  },
  {
    tag: '进阶挑战',
    title: '广绣工艺挑战',
    desc: '模拟绣线步骤答题，通关可解锁专属勋章与好礼',
    btn: '去闯关赢好礼',
  },
  {
    tag: '人气专场',
    title: '岭南美食问答',
    desc: '一边馋一边答，解锁早茶、煲汤与街头小吃冷知识',
    btn: '马上去答题',
  },
];
const quizIcon = require('../../assets/legacy/img/count.png');

const BIG = [
  { img: require('../../assets/legacy/img/jd/gz.jpg'), name: '广州塔' },
  { img: require('../../assets/legacy/img/jd/gzcl.png'), name: '欢乐谷' },
  { img: require('../../assets/legacy/img/changlong.png'), name: '长隆海洋王国' },
  { img: require('../../assets/legacy/img/dxs.jpg'), name: '鼎湖山' },
];

const WATERFALL = [
  {
    img: require('../../assets/legacy/img/jd/gdsfwzwhycg.png'),
    city: '潮州',
    title: '岭南非遗殿堂，一馆尽览千年匠心与风华',
  },
  {
    img: require('../../assets/legacy/img/jd/dxs.png'),
    city: '丹霞山',
    title: '来丹霞山，观“色如渥丹”的赤壁，览“灿若明霞”的奇景',
  },
  {
    img: require('../../assets/legacy/img/jd/nsthg.png'),
    city: '广州',
    title: '着重助力乡村振兴 汇聚岭南文化特色',
  },
  {
    img: require('../../assets/legacy/img/jd/lnyxy.png'),
    city: '广州',
    title: '访岭南印象园，赏古建、品非遗、尝粤味',
  },
];
const locationPin = require('../../assets/legacy/img/ms3.png');

// 顶部轮播图（对应 Legacy .top_AD），每 3 秒自动切换，可手动滑动。
function Carousel({ pageWidth }: { pageWidth: number }) {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const imgWidth = pageWidth - 32;

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % AD_IMAGES.length;
      indexRef.current = next;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
    }, 3000);
    return () => clearInterval(timer);
  }, [pageWidth]);

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    indexRef.current = i;
    setIndex(i);
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}>
        {AD_IMAGES.map((img, i) => (
          <View key={i} style={{ width: pageWidth }} className="items-center">
            <Image
              source={img}
              resizeMode="cover"
              style={{ width: imgWidth, height: 162, borderRadius: 14 }}
            />
          </View>
        ))}
      </ScrollView>
      <View className="absolute bottom-2.5 left-0 right-0 flex-row justify-center gap-1.5">
        {AD_IMAGES.map((_, i) => (
          <View
            key={i}
            className={`h-2 w-2 rounded-full ${
              i === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>
    </View>
  );
}

// 知识小课堂答题卡（对应 Legacy .list_4）。
function QuizCard({
  item,
  width,
}: {
  item: (typeof QUIZ)[number];
  width: number;
}) {
  return (
    <Pressable
      onPress={() => comingSoon('知识小课堂')}
      accessibilityRole="button"
      style={{ width, boxShadow: '0px 4px 12px rgba(148,116,52,0.18)' }}
      className="mr-3 rounded-2xl bg-white p-3.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <View className="self-start overflow-hidden rounded-full">
            <LinearGradient
              colors={['#f97316', '#ef4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text className="text-[11px] font-semibold text-white">
                {item.tag}
              </Text>
            </LinearGradient>
          </View>
          <Text className="mt-1.5 text-[15px] font-extrabold text-[#3b2f16]">
            {item.title}
          </Text>
          <Text className="mt-1 text-[12px] leading-5 text-[#7d7b6a]">
            {item.desc}
          </Text>
          <View className="mt-2 self-start overflow-hidden rounded-full">
            <LinearGradient
              colors={['#f97316', '#facc15']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text className="text-[12px] font-bold text-white">
                {item.btn}
              </Text>
            </LinearGradient>
          </View>
        </View>
        <Image
          source={quizIcon}
          resizeMode="contain"
          style={{ width: 52, height: 52 }}
        />
      </View>
    </Pressable>
  );
}

// 景点大横卡（对应 Legacy .list_5）。
function BigCard({
  item,
  width,
}: {
  item: (typeof BIG)[number];
  width: number;
}) {
  return (
    <Pressable
      onPress={() => comingSoon('景点详情')}
      accessibilityRole="button"
      style={{ width, height: 112 }}
      className="mr-2.5 overflow-hidden rounded-2xl">
      <Image
        source={item.img}
        resizeMode="cover"
        style={{ width, height: 112 }}
      />
      <LinearGradient
        colors={['#AA9465', 'rgba(170,148,101,0)']}
        locations={[0.35, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute bottom-2.5 left-3">
        <Text className="text-base font-semibold text-white">{item.name}</Text>
        <Text className="mt-0.5 text-[11px] text-white/90">广东景点·人气榜</Text>
      </View>
    </Pressable>
  );
}

// 景点瀑布流卡（对应 Legacy .list_6）。
function WaterfallCard({
  item,
  width,
}: {
  item: (typeof WATERFALL)[number];
  width: number;
}) {
  return (
    <Pressable
      onPress={() => comingSoon('景点详情')}
      accessibilityRole="button"
      style={{ width, boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      className="mb-4 overflow-hidden rounded-2xl bg-white">
      <View>
        <Image
          source={item.img}
          resizeMode="cover"
          style={{ width, height: 158 }}
        />
        <View className="absolute bottom-2 left-2 flex-row items-center rounded-2xl bg-black/40 px-2 py-1">
          <Image source={locationPin} style={{ width: 13, height: 13 }} />
          <Text className="ml-1 text-[11px] font-semibold text-white">
            {item.city}
          </Text>
        </View>
      </View>
      <Text className="px-2.5 py-2.5 text-[13px] leading-5 text-[#333]">
        {item.title}
      </Text>
    </Pressable>
  );
}

// 四宫格 / 五项入口的单个图标入口。
function EntryItem({
  icon,
  label,
  size,
  onPress,
}: {
  icon: ImageSourcePropType;
  label: string;
  size: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center py-2">
      <Image
        source={icon}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      <Text className="mt-1.5 text-[12px] text-[#333]">{label}</Text>
    </Pressable>
  );
}

// 首页（对应 Legacy index1.html）：分段控件 + 搜索 + 轮播 + 入口宫格 +
// 知识小课堂 + 景点大横卡 + 景点瀑布流。
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const quizCardW = Math.round(width * 0.66);
  const bigCardW = Math.round(width * 0.78);
  const waterfallW = Math.floor((width - 32 - 12) / 2);

  return (
    <View className="flex-1 bg-[#476647]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* 顶部：分段控件 + 搜索（绿色背景） */}
        <Animated.View
          entering={FadeInDown.duration(450)}
          style={{ paddingTop: insets.top + 6 }}
          className="bg-[#476647] px-4 pb-3">
          <View className="flex-row items-end justify-center gap-12">
            <Text className="text-lg font-bold text-white">发现</Text>
            <Pressable onPress={() => comingSoon('非遗文化')}>
              <Text className="pb-0.5 text-sm font-bold text-[#D8D0BE]">
                非遗
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => comingSoon('搜索')}
            accessibilityRole="search"
            className="mt-3 h-11 flex-row items-center rounded-full bg-white/30 px-4">
            <Ionicons name="search" size={16} color="#ffffff" />
            <Text className="ml-2 text-sm text-white/90">
              搜索目的地/景点/酒店
            </Text>
          </Pressable>
        </Animated.View>

        {/* 轮播图 */}
        <Animated.View
          entering={FadeInDown.delay(90).duration(450)}
          className="bg-[#476647] pb-4">
          <Carousel pageWidth={width} />
        </Animated.View>

        {/* 主体 */}
        <LinearGradient
          colors={['#CCF6E9', '#D7F9EE', '#E3E2F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}>
          <View className="rounded-t-[18px] bg-[#F8F5E6] pb-2 pt-4">
            {/* 四宫格 */}
            <Animated.View
              entering={FadeInDown.delay(160).duration(450)}
              className="flex-row justify-around px-3">
              {GRID4.map((it) => (
                <EntryItem
                  key={it.label}
                  icon={it.icon}
                  label={it.label}
                  size={42}
                  onPress={() => comingSoon(it.label)}
                />
              ))}
            </Animated.View>

            {/* 五项入口 */}
            <Animated.View
              entering={FadeInDown.delay(220).duration(450)}
              className="mt-1 flex-row justify-around px-2">
              {ENTRY5.map((it) => (
                <EntryItem
                  key={it.label}
                  icon={it.icon}
                  label={it.label}
                  size={46}
                  onPress={() => comingSoon(it.label)}
                />
              ))}
            </Animated.View>

            {/* 知识小课堂 */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(450)}
              className="mx-3 mt-3 rounded-2xl bg-[#EEE6C1] p-3">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-[#9B824A]">
                  知识小课堂
                </Text>
                <Pressable onPress={() => comingSoon('知识小课堂')}>
                  <Text className="text-sm text-[#CAAF75]">更多</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {QUIZ.map((it) => (
                  <QuizCard key={it.title} item={it} width={quizCardW} />
                ))}
              </ScrollView>
            </Animated.View>

            {/* 景点大横卡 */}
            <Animated.View
              entering={FadeInDown.delay(380).duration(450)}
              className="mt-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}>
                {BIG.map((it) => (
                  <BigCard key={it.name} item={it} width={bigCardW} />
                ))}
              </ScrollView>
            </Animated.View>

            {/* 景点瀑布流 */}
            <Animated.View
              entering={FadeInDown.delay(460).duration(450)}
              className="mt-4 flex-row flex-wrap justify-between px-4">
              {WATERFALL.map((it) => (
                <WaterfallCard key={it.title} item={it} width={waterfallW} />
              ))}
            </Animated.View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}
