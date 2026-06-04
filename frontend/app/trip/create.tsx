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
  { name: '广州市', suggest: '建议 4 天', imageKey: 'jd/gz.jpg' },
  { name: '深圳市', suggest: '建议 3 天', imageKey: 'xc/xc_shenzhen.jpg' },
  { name: '珠海市', suggest: '建议 2 天', imageKey: 'xc/xc_zhuhai.jpg' },
  { name: '佛山市', suggest: '建议 2 天', imageKey: 'changlong.png' },
  { name: '东莞市', suggest: '建议 2 天', imageKey: 'xc/xc_dongguan.jpg' },
  { name: '惠州市', suggest: '建议 2 天', imageKey: 'xc/xc_huizhou.jpg' },
  { name: '中山市', suggest: '建议 2 天', imageKey: 'dgypzzbwg.png' },
  { name: '江门市', suggest: '建议 2 天', imageKey: 'xc/xc_jiangmen.jpg' },
  { name: '肇庆市', suggest: '建议 2 天', imageKey: 'xc/xc_zhaoqing.jpg' },
  { name: '汕头市', suggest: '建议 2 天', imageKey: 'xc/xc_chaozhou.jpeg' },
  { name: '潮州市', suggest: '建议 2 天', imageKey: 'xc/xc_chaozhou.jpeg' },
  { name: '韶关市', suggest: '建议 2 天', imageKey: 'jd/dxs.png' },
  { name: '湛江市', suggest: '建议 2 天', imageKey: 'jd/gzcl.png' },
  { name: '梅州市', suggest: '建议 2 天', imageKey: 'xc/xc_meizhou.jpg' },
  { name: '汕尾市', suggest: '建议 2 天', imageKey: 'xc/xc_jieyang.jpeg' },
];

const DAYS_OPTIONS = [
  { label: '1 天', value: '1天' },
  { label: '2 天', value: '2天' },
  { label: '3 天', value: '3天' },
  { label: '4 天', value: '4天' },
  { label: '5 天', value: '5天' },
  { label: '7 天', value: '7天' },
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
      const tripName = `${departure} → ${destination!.name} · ${days}`;
      const daysNum = parseInt(days) || 2;
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
      <View className="bg-[#3E6B4F]">
        <ScreenHeader title="新建行程" tint="dark" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Trip summary pill */}
        <View className="mt-5 flex-row justify-center">
          <View className="flex-row items-center rounded-full bg-[#3E6B4F]/10 px-4 py-2">
            <Ionicons name="location-outline" size={13} color="#386641" />
            <Text className="ml-1.5 text-[13px] font-medium text-[#386641]">{departure} → {destination?.name ?? '...'} · {days}</Text>
          </View>
        </View>

        {/* Departure card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mt-5 rounded-2xl bg-white p-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 }}>
          <Pressable onPress={() => { setSearchQuery(''); setModalVisible(true); }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#E8F5E9]">
                  <Ionicons name="navigate-outline" size={20} color="#386641" />
                </View>
                <View>
                  <Text className="text-[11px] font-medium uppercase tracking-wider text-[#999]">出发地</Text>
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
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#E8F5E9]">
              <Ionicons name="flag-outline" size={20} color="#386641" />
            </View>
            <View>
              <Text className="text-[11px] font-medium uppercase tracking-wider text-[#999]">目的地</Text>
              <Text className="mt-0.5 text-[16px] font-semibold text-[#1a1a1a]">{destination?.name ?? '点击选择城市'}</Text>
            </View>
          </View>
          <View className="flex-row items-center rounded-xl bg-[#F2F2F2] px-3 py-2.5">
            <Ionicons name="search" size={16} color="#999" />
            <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="输入城市名称筛选..." placeholderTextColor="#bbb" className="ml-2 flex-1 py-0 text-[14px] text-[#333]" autoCorrect={false} />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-1"><Ionicons name="close-circle" size={18} color="#ccc" /></Pressable>
            )}
          </View>
          <ScrollView horizontal={false} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }} className="mt-3">
            {filteredCities.length === 0 ? (
              <Text className="py-6 text-center text-[13px] text-[#ccc]">未找到匹配城市</Text>
            ) : (
              <View style={{ gap: 6 }}>
                {filteredCities.map((city) => {
                  const selected = destination?.name === city.name;
                  return (
                    <Pressable key={city.name} onPress={() => setDestination(city)} className={`flex-row items-center rounded-xl p-2.5 ${selected ? 'bg-[#E8F5E9]' : 'bg-white active:bg-[#F5F5F5]'}`} style={selected ? { borderWidth: 1.5, borderColor: '#386641' } : {}}>
                      <Image source={resolveLegacyImage(city.imageKey)} style={{ width: 52, height: 52, borderRadius: 12 }} resizeMode="cover" />
                      <View className="ml-3 flex-1">
                        <Text className={`text-[14px] font-bold ${selected ? 'text-[#386641]' : 'text-[#333]'}`}>{city.name}</Text>
                        <Text className="mt-0.5 text-[12px] text-[#999]">{city.suggest}</Text>
                      </View>
                      <View className={`h-6 w-6 items-center justify-center rounded-full ${selected ? 'bg-[#386641]' : 'border-2 border-[#ddd]'}`}>
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
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#E8F5E9]">
              <Ionicons name="calendar-outline" size={20} color="#386641" />
            </View>
            <View>
              <Text className="text-[11px] font-medium uppercase tracking-wider text-[#999]">游玩天数</Text>
              <Text className="mt-0.5 text-[16px] font-semibold text-[#1a1a1a]">{days}</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {DAYS_OPTIONS.map((d) => {
              const active = days === d.value;
              return (
                <Pressable key={d.value} onPress={() => setDays(d.value)} className={`items-center rounded-xl px-5 py-3 ${active ? 'bg-[#386641]' : 'border border-[#eee] bg-[#F9F9F9]'}`}>
                  <Text className={`text-[15px] font-bold ${active ? 'text-white' : 'text-[#555]'}`}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Submit button */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable onPress={handleSubmit} disabled={!canSubmit || submitting} className={`w-full items-center justify-center rounded-2xl py-4 ${canSubmit && !submitting ? 'bg-[#386641]' : 'bg-[#C4D4C8]'}`}>
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name="compass-outline" size={20} color="#fff" />
              <Text className="text-[16px] font-bold text-white">开始规划行程</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Departure picker modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable className="flex-1 justify-end bg-black/35" onPress={() => setModalVisible(false)}>
          <Pressable className="rounded-t-3xl bg-white px-5 pt-6" style={{ paddingBottom: insets.bottom + 16, maxHeight: '75%' }} onPress={(e) => e.stopPropagation()}>
            <View className="mb-4 self-center h-1 w-10 rounded-full bg-[#E0E0E0]" />
            <Text className="mb-4 text-center text-[16px] font-bold text-[#1a1a1a]">选择出发城市</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {CITIES.map((city) => {
                  const active = departure === city.name;
                  return (
                    <Pressable key={city.name} onPress={() => { setDeparture(city.name); setModalVisible(false); }} className={`flex-row items-center rounded-xl px-3 py-2.5 ${active ? 'bg-[#386641]' : 'border border-[#eee] bg-[#F9F9F9]'}`}>
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
