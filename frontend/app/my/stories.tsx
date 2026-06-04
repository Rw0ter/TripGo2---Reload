import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyStoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#F4F1E4]">
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center bg-[#3E6B4F] px-4 pb-4">
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 6 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-[17px] font-bold text-white">我的故事</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }} className="flex-1">
        <Ionicons name="document-text-outline" size={64} color="#ccc" style={{ marginTop: 60 }} />
        <Text className="mt-4 text-[16px] font-bold text-[#333]">你的非遗故事</Text>
        <Text className="mt-2 text-center text-[14px] leading-5 text-[#999]">发布你的岭南文化体验{'\n'}与更多人分享旅程中的感动</Text>
        <Pressable onPress={() => router.push('/post/story')} className="mt-6 rounded-full bg-[#386641] px-8 py-3">
          <Text className="text-[15px] font-bold text-white">发布故事</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
