import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CommunityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary">社区</Text>
        <Text className="mt-2 text-sm text-gray-500">待实现</Text>
      </View>
    </SafeAreaView>
  );
}
