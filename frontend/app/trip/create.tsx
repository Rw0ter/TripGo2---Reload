import { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '@/lib/api';

// ── Data ──────────────────────────────────────────────────────────────────────

interface City {
  name: string;
  suggest: string;
  img: string;
}

const CITIES: City[] = [
  { name: '广州市', suggest: '建议游玩4天',   img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop' },
  { name: '深圳市', suggest: '建议游玩3天',   img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop' },
  { name: '珠海市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop' },
  { name: '佛山市', suggest: '建议游玩2-3天', img: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?q=80&w=600&auto=format&fit=crop' },
  { name: '东莞市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1559131397-f94da358f7ca?q=80&w=600&auto=format&fit=crop' },
  { name: '惠州市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop' },
  { name: '中山市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=600&auto=format&fit=crop' },
  { name: '江门市', suggest: '建议游玩1-2天', img: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=600&auto=format&fit=crop' },
  { name: '肇庆市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=600&auto=format&fit=crop' },
  { name: '汕头市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1537531383496-f4749b88b535?q=80&w=600&auto=format&fit=crop' },
  { name: '潮州市', suggest: '建议游玩1-2天', img: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=600&auto=format&fit=crop' },
  { name: '韶关市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop' },
  { name: '湛江市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop' },
  { name: '茂名市', suggest: '建议游玩1-2天', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop' },
  { name: '梅州市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=600&auto=format&fit=crop' },
  { name: '汕尾市', suggest: '建议游玩2天',   img: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=600&auto=format&fit=crop' },
];

const DAYS_OPTIONS = ['任意天数', '1天', '2天', '3天', '4天', '5天', '7天+'];
const HOT_LIMIT = 8;

const CITY_NAMES = CITIES.map((c) => c.name);

const HOT_CITIES = CITIES.slice(0, HOT_LIMIT).map((c) => c.name);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Highlight matched substring inside a Text tree (React Native has no <mark>). */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <Text className="text-sm font-bold text-gray-800">{text}</Text>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <Text className="text-sm font-bold text-gray-800">{text}</Text>;

  return (
    <Text className="text-sm font-bold text-gray-800">
      {text.slice(0, idx)}
      <Text className="bg-yellow-100 rounded-sm">{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

/** Derive an Unsplash image URL for a city not in the hardcoded list. */
function fallbackImg(name: string) {
  return `https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop&text=${encodeURIComponent(name)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateTripScreen() {
  const insets = useSafeAreaInsets();
  const searchRef = useRef<TextInput>(null);

  // ---- form state ----
  const [departure, setDeparture] = useState('广州市');
  const [destination, setDestination] = useState<City | null>(null);
  const [days, setDays] = useState('2天');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- sheet state ----
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<'departure' | 'days'>('departure');

  // ---- submit state ----
  const [submitting, setSubmitting] = useState(false);

  // ---- derived ----
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return CITIES;
    const q = searchQuery.trim().toLowerCase();
    return CITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const sheetOptions = sheetMode === 'departure' ? CITY_NAMES : DAYS_OPTIONS;
  const sheetCurrent = sheetMode === 'departure' ? departure : days;

  const canSubmit =
    departure !== '' && destination !== null && days !== '任意天数';

  // ---- handlers ----
  const openSheet = (mode: 'departure' | 'days') => {
    setSheetMode(mode);
    setSheetVisible(true);
  };

  const handleSheetSelect = (value: string) => {
    if (sheetMode === 'departure') {
      setDeparture(value);
    } else {
      setDays(value);
    }
    setSheetVisible(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const tripName = `${departure} → ${destination!.name} ${days}`;
      const daysNum = parseInt(days) || 2;
      const tripDays = Array.from({ length: daysNum }, (_, i) => ({
        title: `第${i + 1}天`,
        notes: '',
      }));

      // Try backend first; fall back to local navigation on any failure.
      await apiRequest('/trips', {
        method: 'POST',
        body: { name: tripName, days: tripDays },
        auth: true,
      });
      router.replace('/(tabs)/itinerary');
    } catch {
      // Navigate with query params as fallback (no auth / offline / backend down).
      router.replace({
        pathname: '/(tabs)/itinerary' as any,
        params: {
          from: departure,
          to: destination!.name,
          days,
        },
      });
    } finally {
      // keep button disabled briefly to avoid double-tap
      setTimeout(() => setSubmitting(false), 600);
    }
  };

  // ---- render ----
  return (
    <View className="flex-1">
      {/* Full-screen dark-green gradient overlay (Legacy: bg.png + gradient) */}
      <LinearGradient
        colors={['#0f291c', '#0b1a12', '#12281d']}
        locations={[0, 0.3, 1]}
        className="absolute inset-0"
      />

      {/* Status bar spacer */}
      <View style={{ height: insets.top }} />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="ml-3 text-xl font-bold text-white">线路规划</Text>
      </View>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Departure card ───────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => openSheet('departure')}
            className="mb-4 rounded-2xl bg-white px-5 py-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-800">出发地</Text>
              <View className="flex-row items-center rounded-xl bg-gray-100 px-3 py-2">
                <Text className="mr-1 text-sm text-gray-900">{departure}</Text>
                <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
              </View>
            </View>
          </TouchableOpacity>

          {/* ── Destination card ─────────────────────────────────────────── */}
          <View className="mb-4 rounded-2xl bg-white px-5 pt-4 pb-5">
            <Text className="mb-3 text-base font-semibold text-gray-800">
              目的地
            </Text>

            {/* Search */}
            <View className="relative mb-3">
              <Ionicons
                name="search"
                size={18}
                color="#9ca3af"
                style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
              />
              <TextInput
                ref={searchRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="城市"
                placeholderTextColor="#9ca3af"
                className="rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900"
                autoCorrect={false}
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 12, top: 12 }}
                >
                  <Ionicons name="close" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Chips — only visible when search is empty */}
            {!searchQuery && (
              <View className="mb-2">
                <Text className="mb-2 text-xs text-gray-400">热门推荐</Text>
                <View className="flex-row flex-wrap gap-2">
                  {HOT_CITIES.map((city) => (
                    <TouchableOpacity
                      key={city}
                      onPress={() => setSearchQuery(city)}
                      className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5"
                      activeOpacity={0.7}
                    >
                      <Text className="text-xs text-gray-700">{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Destination list */}
            {filteredCities.length > 0 ? (
              <View style={{ maxHeight: 320 }}>
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {filteredCities.map((city) => {
                    const isSelected = destination?.name === city.name;
                    return (
                      <TouchableOpacity
                        key={city.name}
                        onPress={() => setDestination(city)}
                        className={`mb-1 flex-row items-center gap-3 rounded-xl p-3 ${
                          isSelected ? 'border border-green-200 bg-green-50' : ''
                        }`}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: city.img || fallbackImg(city.name) }}
                          className="h-12 w-12 rounded-xl bg-gray-200"
                        />
                        <View className="flex-1">
                          <HighlightText text={city.name} query={searchQuery} />
                          <Text className="mt-0.5 text-xs text-gray-400">
                            {city.suggest}
                          </Text>
                        </View>
                        <View
                          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                            isSelected
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View className="items-center py-5">
                <Text className="text-sm text-gray-400">
                  没有找到与"{searchQuery}"相关的目的地
                </Text>
              </View>
            )}
          </View>

          {/* ── Days card ────────────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => openSheet('days')}
            className="mb-6 rounded-2xl bg-white px-5 py-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-gray-800">游玩天数</Text>
              <View className="flex-row items-center rounded-xl bg-gray-100 px-3 py-2">
                <Text className="mr-1 text-sm text-gray-900">{days}</Text>
                <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Spacer so content doesn't hide behind the fixed submit button */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Submit button (fixed at bottom) ──────────────────────────────── */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-2 pb-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full items-center justify-center rounded-2xl py-3.5 ${
            canSubmit && !submitting
              ? 'bg-green-500'
              : 'bg-[#367D6A]'
          }`}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">下一步</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Bottom sheet modal ───────────────────────────────────────────── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/35"
          onPress={() => setSheetVisible(false)}
        >
          <Pressable
            className="rounded-t-2xl bg-white px-6 pt-6"
            style={{
              paddingBottom: insets.bottom + 16,
              maxHeight: Platform.OS === 'ios' ? '80%' : '75%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-4 text-center text-lg font-semibold text-gray-900">
              {sheetMode === 'departure' ? '选择出发地' : '选择游玩天数'}
            </Text>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              className="max-h-80"
            >
              <View className="flex-row flex-wrap gap-3">
                {sheetOptions.map((option) => {
                  const isActive = option === sheetCurrent;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => handleSheetSelect(option)}
                      className={`rounded-xl border px-4 py-3 ${
                        isActive
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm ${
                          isActive
                            ? 'font-semibold text-green-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setSheetVisible(false)}
              className="mt-4 w-full items-center rounded-xl bg-gray-900 py-3"
              activeOpacity={0.8}
            >
              <Text className="text-base text-white">取消</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
