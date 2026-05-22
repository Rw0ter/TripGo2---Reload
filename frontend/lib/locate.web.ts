// 获取当前位置 —— web 实现：浏览器 Geolocation API。原生实现见 locate.ts。
import type { LatLng } from './geo';

export function getCurrentLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('当前环境不支持定位'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || '定位失败')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
