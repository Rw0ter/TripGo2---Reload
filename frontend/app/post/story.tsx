import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/lib/api';
import { resolveLegacyImage } from '@/lib/legacy-images';
import { useAuthStore } from '@/stores/auth';

// 配图候选——岭南 / 非遗题材的本地素材 key（见 lib/legacy-images.ts）。
const COVER_CHOICES = [
  'xc/xc_guangzhou.jpg',
  'xc/xc_chaozhou.jpeg',
  'xc/xc_dongguan.jpg',
  'xc/xc_huizhou.jpg',
  'xc/xc_jieyang.jpeg',
  'jd/gzcl.png',
  'dgypzzbwg.png',
  'changlong.png',
];
const MAX_IMAGES = 3;

// 发布故事（对应 Legacy add.html）：标题 + 正文 + 可选配图，提交走 POST /stories。
export default function PostStoryScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 未登录引导。
  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F1E4]" edges={['bottom']}>
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="lock-closed-outline" size={36} color="#9C8E7A" />
          <Text className="mt-3 text-center text-[14px] text-[#6b6553]">
            登录后才能发布你的非遗见闻
          </Text>
          <Pressable
            onPress={() => router.replace('/login')}
            accessibilityRole="button"
            className="mt-4 rounded-full bg-[#386641] px-6 py-2.5">
            <Text className="text-[14px] font-semibold text-white">去登录</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function toggleImage(key: string) {
    setPicked((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_IMAGES) return prev;
      return [...prev, key];
    });
  }

  async function onSubmit() {
    const t = title.trim();
    const c = content.trim();
    setError('');
    if (t.length < 2) {
      setError('标题至少 2 个字');
      return;
    }
    if (!c) {
      setError('正文不能为空');
      return;
    }
    setLoading(true);
    try {
      const r = await apiRequest<{ id: number }>('/stories', {
        method: 'POST',
        auth: true,
        body: { title: t, content: c, images: picked },
      });
      router.replace({ pathname: '/story/[id]', params: { id: r.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView className="flex-1 bg-[#F4F1E4]" edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* 标题 */}
          <Text className="text-[13px] font-semibold text-[#6b6553]">标题</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="给你的非遗见闻起个标题"
            placeholderTextColor="#B3A98F"
            maxLength={50}
            style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }}
            className="mt-1.5 rounded-xl bg-white px-3.5 py-3 text-[14px] text-[#3a372f]"
          />

          {/* 正文 */}
          <Text className="mt-4 text-[13px] font-semibold text-[#6b6553]">
            正文
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="分享你遇见的手艺、匠人与故事…"
            placeholderTextColor="#B3A98F"
            multiline
            maxLength={2000}
            textAlignVertical="top"
            style={{ minHeight: 140, boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }}
            className="mt-1.5 rounded-xl bg-white px-3.5 py-3 text-[14px] leading-6 text-[#3a372f]"
          />

          {/* 配图 */}
          <Text className="mt-4 text-[13px] font-semibold text-[#6b6553]">
            配图（可选，最多 {MAX_IMAGES} 张）
          </Text>
          <View className="mt-1.5 flex-row flex-wrap" style={{ gap: 8 }}>
            {COVER_CHOICES.map((key) => {
              const idx = picked.indexOf(key);
              const sel = idx >= 0;
              return (
                <Pressable
                  key={key}
                  onPress={() => toggleImage(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`配图候选 ${key}`}
                  style={{
                    width: 78,
                    height: 78,
                    borderWidth: 2,
                    borderColor: sel ? '#386641' : 'transparent',
                  }}
                  className="overflow-hidden rounded-xl">
                  <Image
                    source={resolveLegacyImage(key)}
                    resizeMode="cover"
                    style={{ width: 74, height: 74 }}
                  />
                  {sel ? (
                    <View className="absolute right-0.5 top-0.5 h-4 w-4 items-center justify-center rounded-full bg-[#386641]">
                      <Text className="text-[10px] font-bold text-white">
                        {idx + 1}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View className="mt-4 rounded-xl bg-[#C0584B] px-3 py-2">
              <Text className="text-center text-[13px] text-white">
                {error}
              </Text>
            </View>
          ) : null}

          {/* 发布 */}
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="发布"
            style={{ opacity: loading ? 0.7 : 1 }}
            className="mt-5 items-center rounded-full bg-[#386641] py-3.5">
            <Text className="text-[15px] font-semibold text-white">
              {loading ? '发布中…' : '发布'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
