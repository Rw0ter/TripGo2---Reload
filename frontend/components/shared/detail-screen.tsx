import type { ReactNode } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DetailScreenProps {
  title: string;
  image?: string;
  children: ReactNode;
}

// 详情页统一模板（景点 / 文创 / 线路 / 故事详情等）。
export function DetailScreen({ title, image, children }: DetailScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {image ? (
          <Image source={{ uri: image }} className="h-56 w-full" />
        ) : null}
        <View className="p-5">
          <Text className="mb-3 text-2xl font-bold text-gray-900">{title}</Text>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
