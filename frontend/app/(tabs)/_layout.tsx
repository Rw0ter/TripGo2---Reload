import { Tabs } from 'expo-router';
import { useState } from 'react';

import { CreateActionSheet } from '@/components/create-action-sheet';
import { LegacyTabBar } from '@/components/legacy-tab-bar';

export default function TabLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Tabs
        // animation: 'shift' —— 切换 tab 时屏幕横向平移过渡，而非瞬间刷新。
        screenOptions={{ headerShown: false, animation: 'shift' }}
        tabBar={(props) => (
          <LegacyTabBar {...props} onAddPress={() => setSheetOpen(true)} />
        )}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="itinerary" />
        <Tabs.Screen name="add" />
        <Tabs.Screen name="community" />
        <Tabs.Screen name="mine" />
      </Tabs>
      <CreateActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
