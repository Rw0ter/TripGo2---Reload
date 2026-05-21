import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="hello" options={{ headerShown: false }} />
        <Stack.Screen name="login1" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="trip/create" options={{ title: '新建行程' }} />
        <Stack.Screen name="post/story" options={{ title: '发布故事' }} />
        <Stack.Screen name="story/[id]" options={{ title: '动态详情' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
