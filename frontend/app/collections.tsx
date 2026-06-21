import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInDown } from 'react-native-reanimated';
import { Animated } from '@/components/ui/animated';
import { resolveLegacyImage } from '@/lib/legacy-images';

interface CollectionItem {
  id: number;
  title: string;
  date: string;
  loc: string;
  time: string;
  tag: string;
  image: string;
  desc: string;
  price: string;
}

const ITEMS: CollectionItem[] = [
  {
    id: 1, title: '城市植树公益日', date: '2025-06-18', loc: '城市生态公园', time: '09:30',
    tag: '虚拟植树', image: 'fyxx/yuejufm.jpg',
    desc: '参与城市绿化志愿行动，亲手种下一棵树，认领专属碳汇，为城市增添一片绿意。',
    price: '免费报名',
  },
  {
    id: 2, title: '旧物改造工作坊', date: '2025-06-22', loc: '社区环保中心', time: '14:00-16:30',
    tag: '循环利用', image: 'fyxx/syhd.jpg',
    desc: '把闲置旧物改造成实用好物，学习升级再造与零废弃理念，让资源在生活里循环流转。',
    price: '¥198/人',
  },
  {
    id: 3, title: '可再生能源科普展', date: '2025-06-25', loc: '低碳科技馆', time: '19:00',
    tag: '节能减排', image: 'fyxx/sywhz.png',
    desc: '走近太阳能、风能与储能技术，沉浸式了解清洁能源如何驱动我们的低碳未来。',
    price: '¥320起',
  },
  {
    id: 4, title: '低碳生活美食节', date: '2025-07-01', loc: '绿色生活广场', time: '09:00-17:00',
    tag: '低碳饮食', image: 'changlong.png',
    desc: '本地时令食材、植物基餐饮与零浪费料理，发现低碳饮食也能酸甜可口、健康满足。',
    price: '¥268起',
  },
  {
    id: 5, title: '碳中和主题讲座', date: '2025-07-08', loc: '城市图书馆', time: '14:00-16:00',
    tag: '环保讲座', image: 'fyxx/jianzhifm1.jpg',
    desc: '环境领域专家讲解碳达峰、碳中和的来龙去脉与个人行动路径，现场互动答疑。',
    price: '¥120/人',
  },
  {
    id: 6, title: '世界环境日骑行', date: '2025-06-10', loc: '滨江绿道', time: '全天',
    tag: '绿色出行', image: 'jd/dxs.png',
    desc: '绿道低碳骑行、垃圾分类挑战、环保市集与公益打卡，一站式体验绿色出行的乐趣。',
    price: '免费入场',
  },
  {
    id: 7, title: '垃圾分类体验工坊', date: '2025-07-15', loc: '社区回收驿站', time: '10:00-12:00',
    tag: '循环利用', image: 'fyxx/zhenjiufm.jpg',
    desc: '环保志愿者现场教学，从源头分类到资源回收，亲手实践让每一份垃圾各归其位。',
    price: '¥158/人',
  },
  {
    id: 8, title: '净滩护河志愿行', date: '2025-07-22', loc: '城市湿地公园', time: '14:30-16:30',
    tag: '生态保护', image: 'xc/xc_chaozhou.jpeg',
    desc: '加入净滩护河队伍，清理岸线垃圾、记录水质数据，守护身边的蓝色生态家园。',
    price: '¥88/人',
  },
];

const CATEGORIES = ['所有类别', '绿色出行', '循环利用', '节能减排', '环保讲座'];
const TIME_FILTERS = ['时间排序', '近期活动', '即将开始'];

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('所有类别');
  const [timeFilter, setTimeFilter] = useState('时间排序');
  const [favorites, setFavorites] = useState<Set<number>>(new Set(ITEMS.map((i) => i.id)));

  const filtered = useMemo(() => {
    let list = ITEMS.filter((item) => favorites.has(item.id));
    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q),
      );
    }
    // Category filter
    if (category !== '所有类别') {
      list = list.filter((i) => i.tag.includes(category) || category.includes(i.tag));
    }
    // Time filter
    const now = new Date();
    if (timeFilter === '近期活动') {
      const week = new Date(now.getTime() + 7 * 86400000);
      list = list.filter((i) => {
        const d = new Date(i.date);
        return d >= now && d <= week;
      });
    } else if (timeFilter === '即将开始') {
      list = list.filter((i) => new Date(i.date) >= now);
    }
    return list;
  }, [search, category, timeFilter, favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const gap = 12;
  const padX = 16;
  const cardW = Math.floor((width - padX * 2 - gap) / 2);
  const imgH = Math.floor(cardW * 0.7);

  return (
    <View className="flex-1 bg-[#FAF6F0]">
      {/* Header matching Legacy my_star.html */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="flex-row items-center justify-center bg-white/90 px-4 pb-3 shadow-sm">
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4"
          style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text className="text-[18px] font-bold text-[#2D3748]">活动收藏</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: padX, paddingBottom: 32 }}>
        {/* Title section */}
        <Text className="mt-6 text-center text-[24px] font-bold text-[#2D3748]">
          <Text className="text-primary">我的</Text>收藏活动
        </Text>
        <Text className="mb-4 mt-1 text-center text-[13px] text-[#718096]">
          发现身边的绿色低碳环保行动
        </Text>

        {/* Search & filter bar — matching Legacy style */}
        <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          {/* Search input */}
          <View className="flex-row items-center rounded-lg border border-primary/20 bg-white px-3 py-2.5">
            <Ionicons name="search" size={18} color="#aaa" />
            <TextInput
              className="ml-2 flex-1 text-[14px] text-[#333]"
              placeholder="搜索活动..."
              placeholderTextColor="#aaa"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#ccc" />
              </Pressable>
            )}
          </View>

          {/* Filter row */}
          <View className="mt-3 flex-row" style={{ gap: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ gap: 6 }}>
              {CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    className={`rounded-full border px-3 py-1.5 ${
                      active ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'
                    }`}>
                    <Text
                      className={`text-[12px] ${
                        active ? 'font-semibold text-primary' : 'text-[#666]'
                      }`}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View className="flex-row" style={{ gap: 6 }}>
              {TIME_FILTERS.map((tf) => {
                const active = timeFilter === tf;
                return (
                  <Pressable
                    key={tf}
                    onPress={() => setTimeFilter(tf)}
                    className={`rounded-full border px-3 py-1.5 ${
                      active ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'
                    }`}>
                    <Text
                      className={`text-[11px] ${
                        active ? 'font-semibold text-primary' : 'text-[#666]'
                      }`}>
                      {tf}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="heart-outline" size={48} color="#ddd" />
            <Text className="mt-3 text-[14px] text-[#999]">
              {favorites.size === 0 ? '暂无收藏' : '没有匹配的活动'}
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap" style={{ gap }}>
            {filtered.map((item, idx) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(idx * 80).springify()}
                style={{
                  width: cardW,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
                }}>
                {/* Image section */}
                <View>
                  <Image
                    source={resolveLegacyImage(item.image)}
                    style={{ width: cardW, height: imgH }}
                    resizeMode="cover"
                  />
                  {/* Gradient overlay — bottom-darkening for text legibility */}
                  <View
                    className="absolute bottom-0 left-0 right-0 bg-black/40"
                    style={{ height: imgH * 0.5 }}
                  />

                  {/* Category tag — top right */}
                  <View className="absolute right-2 top-2 rounded-full bg-[#48BB78]/90 px-2 py-0.5">
                    <Text className="text-[10px] text-white">{item.tag}</Text>
                  </View>

                  {/* Heart button — top left */}
                  <Pressable
                    onPress={() => toggleFavorite(item.id)}
                    className="absolute left-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow">
                    <Ionicons
                      name={favorites.has(item.id) ? 'heart' : 'heart-outline'}
                      size={16}
                      color={favorites.has(item.id) ? '#C53030' : '#999'}
                    />
                  </Pressable>

                  {/* Title & date on image */}
                  <View className="absolute bottom-2 left-2 right-2">
                    <Text numberOfLines={1} className="text-[13px] font-bold text-white">
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-white/80">{item.date}</Text>
                  </View>
                </View>

                {/* Info section */}
                <View className="p-2.5">
                  {/* Location + time */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center">
                      <Ionicons name="location-outline" size={11} color="#718096" />
                      <Text numberOfLines={1} className="ml-0.5 flex-1 text-[11px] text-[#718096]">
                        {item.loc}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={11} color="#718096" />
                      <Text className="ml-0.5 text-[11px] text-[#718096]">{item.time}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text numberOfLines={2} className="mt-1.5 text-[11px] leading-4 text-[#555]">
                    {item.desc}
                  </Text>

                  {/* Price + action */}
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-[13px] font-bold text-primary">{item.price}</Text>
                    <Pressable
                      onPress={() => router.push({ pathname: '/story/[id]', params: { id: item.id } })}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 active:bg-primary/20">
                      <Text className="text-[11px] font-semibold text-primary">查看详情</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
