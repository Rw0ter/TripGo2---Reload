import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CreateActionSheet } from '@/components/create-action-sheet';
import { PRIMARY } from '@/constants/colors';

export default function TabLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: PRIMARY,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '首页',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="itinerary"
          options={{
            title: '行程',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '添加',
            // 中间 tab 不进入页面：自定义按钮，点击弹出创建动作菜单
            tabBarButton: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="创建"
                accessibilityHint="打开创建菜单"
                className="flex-1 items-center justify-center"
                onPress={() => setSheetOpen(true)}>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Ionicons name="add" size={26} color="white" />
                </View>
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: '社区',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mine"
          options={{
            title: '我的',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <CreateActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
