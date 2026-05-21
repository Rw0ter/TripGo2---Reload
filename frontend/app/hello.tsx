import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Alert,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { HELLO_AGREE_GRADIENT } from '@/constants/colors';

const bg = require('../assets/legacy/img/beijing.png');

// 隐私协议确认屏（对应 Legacy hello.html）。
export default function HelloScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  function agree() {
    router.replace('/login');
  }

  function decline() {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      Alert.alert('提示', '需同意隐私政策才能使用文脉粤游，您可手动关闭 App。');
    }
  }

  function reject() {
    Alert.alert('确认退出', '若您不同意隐私保护政策，将无法正常使用相关功能。', [
      { text: '仍不同意并退出', style: 'destructive', onPress: decline },
      { text: '同意并继续', onPress: agree },
    ]);
  }

  return (
    <View className="flex-1">
      <Image
        source={bg}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerClassName="flex-grow items-center justify-center px-5 py-8">
          <Animated.View
            entering={FadeInDown.duration(500)}
            className="w-full max-w-[480px] rounded-2xl bg-white p-7"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}>
            <Text className="mb-4 text-center text-lg font-bold text-[#333]">
              用户服务协议和隐私政策
            </Text>

            <Text className="text-sm leading-7 text-[#333]">
              感谢您信任并使用文脉粤游，我们非常注重您的个人信息和隐私保护，并依据法律要求更新
              <Text className="font-bold text-[#07B67C]">《用户服务协议》</Text>和
              <Text className="font-bold text-[#07B67C]">《隐私政策》</Text>
              ，特向您推送本提示：
            </Text>

            <Text className="mt-3 text-[13px] leading-7 text-[#444]">
              1. 您可以通过《隐私政策》了解我们会收集哪些个人信息、如何使用和存储信息，方便您了解自己的权利。
              2. 我们将严格按照经您同意的条款使用您的个人信息，以便为您提供更好的服务。
              3. 如果您同意此政策，请点击「同意」并开始使用我们的产品和服务。
              4. 当您使用部分功能时，我们可能会在获得您的明示同意后，从授权的第三方 SDK 获取、共享或向其提供信息。
            </Text>

            <Text className="mt-3 text-[13px] leading-7 text-[#555]">
              请您仔细阅读并充分理解《用户服务协议》和《隐私政策》。
            </Text>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={reject}
                accessibilityRole="button"
                accessibilityLabel="拒绝隐私政策"
                className="h-12 flex-1 items-center justify-center rounded-[20px] border border-[#707070]">
                <Text className="text-base text-[#7B7B7B]">拒绝</Text>
              </Pressable>
              <Pressable
                onPress={agree}
                accessibilityRole="button"
                accessibilityLabel="同意隐私政策"
                className="flex-1">
                <LinearGradient
                  colors={HELLO_AGREE_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 48,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text className="text-base font-semibold text-white">
                    同意
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
