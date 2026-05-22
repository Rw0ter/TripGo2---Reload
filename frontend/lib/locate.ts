// 获取当前位置 —— 原生实现：expo-location（设备有 GPS 时离线亦可定位）。
// web 实现见 locate.web.ts。
import * as Location from 'expo-location';

import type { LatLng } from './geo';

export async function getCurrentLocation(): Promise<LatLng> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('未授予定位权限');
  }
  // 用 High（GPS 优先）：离线时网络/Wi-Fi 定位不可用，需走卫星定位。
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}
