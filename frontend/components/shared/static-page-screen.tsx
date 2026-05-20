import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StaticPageScreenProps {
  title: string;
  body: string;
}

// 协议 / 隐私 / 非遗介绍等纯文本页的统一模板（覆盖 Legacy 约 14 个静态页）。
export function StaticPageScreen({ title, body }: StaticPageScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 py-4">
        <Text className="mb-4 text-xl font-bold text-gray-900">{title}</Text>
        <Text className="text-base leading-7 text-gray-700">{body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
