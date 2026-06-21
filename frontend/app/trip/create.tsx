import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { ScreenHeader } from '@/components/ui/screen-header';
import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';

// ── City data ──────────────────────────────────────────────
interface City {
  name: string;
  suggest: string;
  imageKey: string;
}

const CITIES: City[] = [
  { name: '广州市', suggest: '低碳出行 · 减塑生活', imageKey: 'jd/gz.jpg' },
  { name: '深圳市', suggest: '绿色通勤 · 节能减排', imageKey: 'xc/xc_shenzhen.jpg' },
  { name: '珠海市', suggest: '滨海生态 · 绿色出行', imageKey: 'xc/xc_zhuhai.jpg' },
  { name: '佛山市', suggest: '垃圾分类 · 循环利用', imageKey: 'changlong.png' },
  { name: '东莞市', suggest: '节水节电 · 绿色制造', imageKey: 'xc/xc_dongguan.jpg' },
  { name: '惠州市', suggest: '亲近自然 · 低碳健行', imageKey: 'xc/xc_huizhou.jpg' },
  { name: '中山市', suggest: '绿色社区 · 节能生活', imageKey: 'dgypzzbwg.png' },
  { name: '江门市', suggest: '绿色农业 · 减碳生活', imageKey: 'xc/xc_jiangmen.jpg' },
  { name: '肇庆市', suggest: '山水生态 · 守护绿水', imageKey: 'xc/xc_zhaoqing.jpg' },
  { name: '汕头市', suggest: '绿色饮食 · 光盘行动', imageKey: 'xc/xc_chaozhou.jpeg' },
  { name: '潮州市', suggest: '旧物新用 · 以旧换新', imageKey: 'xc/xc_chaozhou.jpeg' },
  { name: '韶关市', suggest: '森林康养 · 守护生态', imageKey: 'jd/dxs.png' },
  { name: '湛江市', suggest: '海洋保护 · 低碳生活', imageKey: 'jd/gzcl.png' },
  { name: '梅州市', suggest: '绿色家园 · 节能减排', imageKey: 'xc/xc_meizhou.jpg' },
  { name: '汕尾市', suggest: '海岸守护 · 绿色出行', imageKey: 'xc/xc_jieyang.jpeg' },
];

const DAYS_OPTIONS = [
  { label: '1 天', value: '1天' },
  { label: '3 天', value: '3天' },
  { label: '7 天', value: '7天' },
  { label: '14 天', value: '14天' },
  { label: '21 天', value: '21天' },
  { label: '30 天', value: '30天' },
];

export default function CreateTripScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [departure, setDeparture] = useState('广州市');
  const [destination, setDestination] = useState<City | null>(null);
  const [days, setDays] = useState('2天');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return CITIES;
    const q = searchQuery.trim().toLowerCase();
    return CITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const canSubmit = departure !== '' && destination !== null;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const tripName = `${destination!.name}低碳计划 · ${days}`;
      const daysNum = parseInt(days) || 7;
      const tripDays = Array.from({ length: daysNum }, (_, i) => ({
        title: `第${i + 1}天`,
        notes: '',
      }));
      await apiRequest('/trips', { method: 'POST', body: { name: tripName, days: tripDays }, auth: true });
      router.replace('/(tabs)/itinerary');
    } catch {
      router.replace({ pathname: '/(tabs)/itinerary' as any, params: { from: departure, to: destination!.name, days } });
    } finally {
      setTimeout(() => setSubmitting(false), 600);
    }
  }, [canSubmit, submitting, departure, destination, days, router]);

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      {/* Header */}
      <View className="bg-[#2D6A4F]">
        <ScreenHeader title="新建绿色计划" tint="dark" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Plan summary pill */}
        <View className="mt-5 flex-row justify-center">
          <View className="flex-row items-center rounded-full bg-[#2D6A4F]/10 px-4 py-2">
            <Ionicons name="leaf-outline" size={13} color="#2D6A4F" />
            <Text className="ml-1.5 text-[13px] font-medium text-[#2D6A4F]">{destination?.name ?? '选择关注领域'} · 行动周期 {days}</Text>
          </View>
        </View>

        {/* Departure card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mt-5 rounded-2xl bg-white p-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 }}>
          <Pressable onPress={() => { setSearchQuery(''); setModalVisible(true); }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#D8F3DC]">
                  <Ionicons name="navigate-outline" size={20} color="#2D6A4F" />
                </View>
                <View>
                  <Text className="text-[11px] font-medium uppercase tracking-wider text-[#999]">行动起点</Text>
                  <Text className="mt-0.5 text-[16px] font-semibold text-[#1a1a1a]">{departure}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Destination card */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mt-4 rounded-2xl bg-white p-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 }}>
          <View className="mb-4 flex-row items-center" style={{ gap: 10 }}>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#D8F3DC]">
              <Ionicons name="leaf-outline" size={20} color="#2D6A4F" />
            </View>
            <View>
              <Text className="text-[11px] font-medium uppercase tracking-wider text-[#999]">关注领域</Text>
              <Text className="mt-0.5 text-[16px] font-semibold text-[#1a1a1a]">{destination?.name ?? '点击选择区域'}</Text>
            </View>
          </View>
          <View className="flex-row items-center rounded-xl bg-[#F2F2F2] px-3 py-2.5">
            <Ionicons name="search" size={16} color="#999" />
            <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="输入区域名称筛选…" placeholderTextColor="#bbb" className="ml-2 flex-1 py-0 text-[14px] text-[#333]" autoCorrect={false} />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-1"><Ionicons name="close-circle" size={18} color="#ccc" /></Pressable>
            )}
          </View>
          <ScrollView horizontal={false} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }} className="mt-3">
            {filteredCities.length === 0 ? (
              <Text className="py-6 text-center text-[13px] text-[#ccc]">未找到匹配区域</Text>
            ) : (
              <View style={{ gap: 6 }}>
                {filteredCities.map((city) => {
                  const selected = destination?.name === city.name;
                  return (
                    <Pressable key={city.name} onPress={() => setDestination(city)} className={`flex-row items-center rounded-xl p-2.5 ${selected ? 'bg-[#D8F3DC]' : 'bg-white active:bg-[#F5F5F5]'}`} style={selected ? { borderWidth: 1.5, borderColor: '#2D6A4F' } : {}}>
                      <Image source={resolveLegacyImage(city.imageKey)} style={{ width: 52, height: 52, borderRadius: 12 }} resizeMode="cover" />
                      <View className="ml-3 flex-1">
                        <Text className={`text-[14px] font-bold ${selected ? 'text-[#2D6A4F]' : 'text-[#333]'}`}>{city.name}</Text>
                        <Text className="mt-0.5 text-[12px] text-[#999]">{city.suggest}</Text>
                      </View>
                      <View className={`h-6 w-6 items-center justify-center rounded-full ${selected ? 'bg-[#2D6A4F]' : 'border-2 border-[#ddd]'}`}>
                        {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Days selector */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-4 rounded-2xl bg-white p-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 }}>
          <View className="mb-3 flex-row items-center" style={{ gap: 10 }}>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#D8F3DC]">
              <Ionicons name="calendar-outline" size={20} color="#2D6A4F" />
            </View>
            <View>
              <Text className="text-[11px] font-medium uppercase tracking-wider text-[#999]">行动周期</Text>
              <Text className="mt-0.5 text-[16px] font-semibold text-[#1a1a1a]">{days}</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {DAYS_OPTIONS.map((d) => {
              const active = days === d.value;
              return (
                <Pressable key={d.value} onPress={() => setDays(d.value)} className={`items-center rounded-xl px-5 py-3 ${active ? 'bg-[#2D6A4F]' : 'border border-[#eee] bg-[#F9F9F9]'}`}>
                  <Text className={`text-[15px] font-bold ${active ? 'text-white' : 'text-[#555]'}`}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Submit button */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable onPress={handleSubmit} disabled={!canSubmit || submitting} className={`w-full items-center justify-center rounded-2xl py-4 ${canSubmit && !submitting ? 'bg-[#2D6A4F]' : 'bg-[#C4D4C8]'}`}>
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name="leaf-outline" size={20} color="#fff" />
              <Text className="text-[16px] font-bold text-white">生成绿色计划</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Departure picker modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable className="flex-1 justify-end bg-black/35" onPress={() => setModalVisible(false)}>
          <Pressable className="rounded-t-3xl bg-white px-5 pt-6" style={{ paddingBottom: insets.bottom + 16, maxHeight: '75%' }} onPress={(e) => e.stopPropagation()}>
            <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#E0E0E0]" />
            <Text className="mb-4 text-center text-[16px] font-bold text-[#1a1a1a]">选择行动起点</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {CITIES.map((city) => {
                  const active = departure === city.name;
                  return (
                    <Pressable key={city.name} onPress={() => { setDeparture(city.name); setModalVisible(false); }} className={`flex-row items-center rounded-xl px-3 py-2.5 ${active ? 'bg-[#2D6A4F]' : 'border border-[#eee] bg-[#F9F9F9]'}`}>
                      <Image source={resolveLegacyImage(city.imageKey)} style={{ width: 24, height: 24, borderRadius: 6 }} resizeMode="cover" />
                      <Text className={`ml-2 text-[13px] font-semibold ${active ? 'text-white' : 'text-[#444]'}`}>{city.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Pressable onPress={() => setModalVisible(false)} className="mt-3 w-full items-center rounded-xl bg-[#F2F2F2] py-3">
              <Text className="text-[14px] font-semibold text-[#666]">取消</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
