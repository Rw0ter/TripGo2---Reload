import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIMARY } from '@/constants/colors';
import { useVoiceAssistant } from '@/stores/voice-assistant';

interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

// 「添加」tab 点击后弹出的创建动作菜单。
const ACTIONS = [
  { icon: 'leaf-outline' as const, label: '新建绿色计划', route: '/trip/create', isAction: false },
  { icon: 'create-outline' as const, label: '发布故事', route: '/post/story', isAction: false },
  { icon: 'sparkles-outline' as const, label: 'AI 语音助手', route: null as any, isAction: true },
];

export function CreateActionSheet({ visible, onClose }: CreateActionSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showVA = useVoiceAssistant((s) => s.show);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable
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
              key={action.label}
              accessibilityRole="button"
              className="flex-row items-center px-6 py-4"
              onPress={() => {
                onClose();
                if (action.isAction) {
                  setTimeout(() => showVA(), 300);
                } else {
                  router.push(action.route);
                }
              }}>
              <Ionicons name={action.icon} size={24} color={action.isAction ? '#40916C' : PRIMARY} />
              <Text className={`ml-4 text-base ${action.isAction ? 'text-[#40916C] font-semibold' : 'text-gray-900'}`}>
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
