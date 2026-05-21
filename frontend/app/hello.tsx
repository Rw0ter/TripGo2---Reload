import { useRouter } from 'expo-router';
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 隐私协议确认屏。
export default function HelloScreen() {
  const router = useRouter();

  function agree() {
    // TODO: 启动流程接入后，这里改为持久化"已同意"标记并按登录态分流
    router.replace('/');
  }

  function decline() {
    // 不同意则无法继续：Android 退出 App；iOS 无法自杀进程，给出明确提示
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      Alert.alert('提示', '需同意隐私政策才能使用文脉粤游，您可手动关闭 App。');
    }
  }

  function reject() {
    Alert.alert(
      '确认',
      '若不同意隐私政策，将无法正常使用文脉粤游的相关功能。',
      [
        { text: '仍不同意', style: 'destructive', onPress: decline },
        { text: '同意并继续', onPress: agree },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6" contentContainerClassName="pb-6">
        <Text className="mb-5 text-center text-xl font-bold text-gray-900">
          用户服务协议和隐私政策
        </Text>
        <Text className="text-base leading-7 text-gray-700">
          感谢您信任并使用文脉粤游。我们非常重视您的个人信息与隐私保护。在开始使用前，请您阅读并理解《用户服务协议》与《隐私政策》：
        </Text>
        <Text className="mt-3 text-base leading-7 text-gray-700">
          1. 您可以通过《隐私政策》了解我们收集哪些信息、如何使用与存储，以及您享有的权利。
        </Text>
        <Text className="mt-2 text-base leading-7 text-gray-700">
          2. 我们将严格按照您同意的条款使用您的个人信息，为您提供岭南文化旅游相关服务。
        </Text>
        <Text className="mt-2 text-base leading-7 text-gray-700">
          3. 当您使用定位、相机、相册等功能时，我们会在取得您明示同意后才调用。
        </Text>
        <Text className="mt-4 text-sm leading-6 text-gray-500">
          点击「同意」即表示您已阅读并接受上述条款。
        </Text>
      </ScrollView>
      <View className="flex-row gap-3 px-6 pb-2">
        <Pressable
          onPress={reject}
          accessibilityRole="button"
          accessibilityLabel="拒绝隐私政策"
          className="flex-1 items-center rounded-xl border border-gray-300 py-3.5">
          <Text className="text-base text-gray-600">拒绝</Text>
        </Pressable>
        <Pressable
          onPress={agree}
          accessibilityRole="button"
          accessibilityLabel="同意隐私政策"
          className="flex-1 items-center rounded-xl bg-primary py-3.5">
          <Text className="text-base font-semibold text-white">同意</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
