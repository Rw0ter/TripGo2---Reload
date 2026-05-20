import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIMARY } from '@/constants/colors';

interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

// 「添加」tab 点击后弹出的创建动作菜单。
const ACTIONS = [
  { icon: 'map-outline', label: '新建行程', route: '/trip/create' },
  { icon: 'create-outline', label: '发布故事', route: '/post/story' },
] as const;

export function CreateActionSheet({ visible, onClose }: CreateActionSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="关闭"
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}>
        {/* 内层吸收触摸，避免点菜单区域误关 */}
        <View
          onStartShouldSetResponder={() => true}
          className="rounded-t-2xl bg-white pt-2"
          style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="mb-1 mt-1 h-1 w-10 self-center rounded-full bg-gray-300" />
          {ACTIONS.map((action) => (
            <Pressable
              key={action.route}
              accessibilityRole="button"
              className="flex-row items-center px-6 py-4"
              onPress={() => {
                router.push(action.route);
                onClose();
              }}>
              <Ionicons name={action.icon} size={24} color={PRIMARY} />
              <Text className="ml-4 text-base text-gray-900">
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            className="mx-6 mt-2 items-center rounded-xl bg-gray-100 py-3"
            onPress={onClose}>
            <Text className="text-base text-gray-500">取消</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
