import { Alert } from 'react-native';

// 目标页面 / 功能尚未建好时的统一占位提示。
// 等对应屏建好后，把调用处换成真实导航即可。
export function comingSoon(name: string) {
  Alert.alert('敬请期待', `「${name}」功能正在开发中`);
}
