import type { ReactElement } from 'react';
import { FlatList, type ListRenderItem, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ListScreenProps<T> {
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  ListHeaderComponent?: ReactElement;
  emptyText?: string;
}

// 列表页统一模板（搜索结果 / 文创列表 / 订单列表等）。
export function ListScreen<T>({
  title,
  data,
  keyExtractor,
  renderItem,
  ListHeaderComponent,
  emptyText = '暂无数据',
}: ListScreenProps<T>) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Text className="px-5 py-4 text-xl font-bold text-gray-900">{title}</Text>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerClassName="px-5 pb-8"
        ListEmptyComponent={
          <Text className="mt-10 text-center text-gray-400">{emptyText}</Text>
        }
      />
    </SafeAreaView>
  );
}
