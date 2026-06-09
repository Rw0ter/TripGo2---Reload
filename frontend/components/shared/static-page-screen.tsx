import { ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';

interface StaticPageScreenProps {
  title: string;
  body: string; // 段落以空行（\n\n）分隔，逐段渲染
}

// 协议 / 隐私 / 社区规范 / 关于我们等纯文本页的统一模板。
// 自带返回头（ScreenHeader），body 按空行分段渲染，保留段内换行。
export function StaticPageScreen({ title, body }: StaticPageScreenProps) {
  const paragraphs = body
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={title} tint="light" />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {paragraphs.map((p, i) => (
          <Text key={i} className="mb-3 text-[15px] leading-7 text-[#444]">
            {p}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
