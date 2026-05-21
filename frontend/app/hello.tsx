import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Animated } from '@/components/ui/animated';
import { HELLO_AGREE_GRADIENT } from '@/constants/colors';
import { useOnboardingStore } from '@/stores/onboarding';

const bg = require('../assets/legacy/img/beijing.png');

// 协议正文——需滚动阅读到底部才能点「同意」。
const POLICY = [
  '感谢您信任并使用文脉粤游。我们非常重视您的个人信息与隐私保护，并依据相关法律法规更新了《用户服务协议》与《隐私政策》，特向您说明如下。',
  '1. 在您使用浏览、搜索等基本功能时，我们仅收集为实现该功能所必需的最少信息。',
  '2. 在您注册账号、发布社区内容或下单时，我们会收集您主动提供的用户名、邮箱、订单与地址等信息，用于提供对应服务。',
  '3. 为实现地图导航、行程规划与 VR 全景浏览，经您授权后我们可能访问设备的位置信息；您可随时在系统设置中关闭该授权。',
  '4. 我们会采用加密传输、访问控制等措施保护您的信息安全，未经您同意不会向第三方出售您的个人信息。',
  '5. 部分功能依赖第三方 SDK（如地图、AI 服务），我们会在取得您的明示同意后，按最小必要原则与其共享相应信息。',
  '6. 您有权查询、更正、删除您的个人信息并注销账号，具体操作路径见《隐私政策》对应章节。',
  '7. 我们仅在实现服务目的所必需的期限内保存您的信息，超出期限将进行删除或匿名化处理。',
  '8. 如您对本协议有任何疑问，可通过 App 内「设置 - 关于我们」中的联系方式与我们沟通。',
  '请您在使用前仔细阅读并充分理解上述全部条款。点击「同意」即表示您已阅读并接受《用户服务协议》与《隐私政策》。',
];

// 「下滑阅读」提示——轻微上下浮动引导用户滚动。
function ScrollDownHint() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withTiming(5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(y);
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View className="mt-3 flex-row items-center justify-center">
      <Animated.View style={style}>
        <Ionicons name="chevron-down" size={15} color="#07B67C" />
      </Animated.View>
      <Text className="ml-1 text-xs text-[#8A8A8A]">下滑阅读全部条款后可同意</Text>
    </View>
  );
}

// 隐私协议确认屏（对应 Legacy hello.html）：需滚动阅读到底才能同意，仅首启展示一次。
export default function HelloScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [atBottom, setAtBottom] = useState(false);

  const boxHeight = Math.min(260, Math.round(height * 0.34));

  // 滚动到底部即解锁「同意」；解锁后保持，不再回退。
  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 16) {
      setAtBottom(true);
    }
  }

  function handleContentSize(_w: number, h: number) {
    // 内容比可视区还短时无需滚动，直接放行。
    if (h <= boxHeight) setAtBottom(true);
  }

  function agree() {
    useOnboardingStore.getState().complete();
    router.replace('/login1');
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
      <View className="absolute inset-0 bg-black/25" />

      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            entering={FadeInDown.duration(450)}
            className="w-full max-w-[460px] overflow-hidden rounded-3xl bg-white"
            style={{ boxShadow: '0px 12px 32px rgba(0,0,0,0.22)' }}>
            {/* 头部 */}
            <View className="items-center px-6 pt-7">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#E7F5EF]">
                <Ionicons name="shield-checkmark" size={28} color="#07B67C" />
              </View>
              <Text className="mt-3 text-lg font-bold text-[#2A2A2A]">
                用户服务协议和隐私政策
              </Text>
              <Text className="mt-1 text-xs text-[#9A9A9A]">
                请阅读并同意以下条款后开始使用
              </Text>
            </View>

            {/* 协议滚动区 */}
            <View className="px-6 pt-4">
              <View
                className="overflow-hidden rounded-2xl border border-[#E6E9E8] bg-[#F7F9F8]"
                style={{ height: boxHeight }}>
                <ScrollView
                  style={{ flex: 1 }}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={handleContentSize}
                  contentContainerClassName="p-4">
                  {POLICY.map((para, i) => (
                    <Text
                      key={i}
                      className={`text-[13px] leading-6 text-[#5A5A5A] ${
                        i > 0 ? 'mt-2.5' : ''
                      }`}>
                      {para}
                    </Text>
                  ))}
                </ScrollView>
              </View>

              {atBottom ? (
                <View className="mt-3 flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle" size={15} color="#07B67C" />
                  <Text className="ml-1 text-xs text-[#07B67C]">
                    已阅读完整条款
                  </Text>
                </View>
              ) : (
                <ScrollDownHint />
              )}
            </View>

            {/* 操作按钮 */}
            <View className="flex-row gap-3 px-6 pb-7 pt-4">
              <Pressable
                onPress={reject}
                accessibilityRole="button"
                accessibilityLabel="拒绝隐私政策"
                className="h-12 flex-1 items-center justify-center rounded-2xl border border-[#D8DCDA]">
                <Text className="text-base text-[#7B7B7B]">拒绝</Text>
              </Pressable>

              {atBottom ? (
                <Pressable
                  onPress={agree}
                  accessibilityRole="button"
                  accessibilityLabel="同意隐私政策"
                  className="flex-1"
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                  <LinearGradient
                    colors={HELLO_AGREE_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 48,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text className="text-base font-semibold text-white">
                      同意
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <View
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                  className="h-12 flex-1 items-center justify-center rounded-2xl bg-[#CBD3CF]">
                  <Text className="text-base font-semibold text-white">同意</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
