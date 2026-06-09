import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastContainer } from '@/components/ui/toast';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View className="flex-1">
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="hello" options={{ headerShown: false }} />
          <Stack.Screen name="login1" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="map" options={{ headerShown: false }} />
          <Stack.Screen name="trip/create" options={{ headerShown: false }} />
          <Stack.Screen name="post/story" options={{ headerShown: false }} />
          <Stack.Screen name="story/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="scenic/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="guide/[city]" options={{ headerShown: false }} />
          <Stack.Screen name="checkin" options={{ headerShown: false }} />
          <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
          <Stack.Screen name="products" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="study" options={{ headerShown: false }} />
          <Stack.Screen name="quiz/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="messages" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
          <Stack.Screen name="wallet" options={{ headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: false }} />
          <Stack.Screen name="collections" options={{ headerShown: false }} />
          <Stack.Screen name="vr" options={{ headerShown: false }} />
          <Stack.Screen name="cantonese" options={{ headerShown: false }} />
          <Stack.Screen name="ai/assistant" options={{ headerShown: false }} />
          <Stack.Screen name="my/trips" options={{ headerShown: false }} />
          <Stack.Screen name="my/stories" options={{ headerShown: false }} />
          <Stack.Screen name="my/likes" options={{ headerShown: false }} />
          <Stack.Screen name="yinsizhengce" options={{ headerShown: false }} />
          <Stack.Screen name="yonghuxieyi" options={{ headerShown: false }} />
          <Stack.Screen name="permissions" options={{ headerShown: false }} />
          <Stack.Screen name="shequguifan" options={{ headerShown: false }} />
          <Stack.Screen name="about_us" options={{ headerShown: false }} />
        </Stack>
        <ToastContainer />
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
