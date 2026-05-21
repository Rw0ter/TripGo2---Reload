import type { ImageSourcePropType } from 'react-native';

// 后端数据里的图片字段是 key（图片随 App 打包，不走网络）。
// 屏幕拿到后端数据后，用 key 在此表解析出本地资源。
// 新数据用到的图片，在此登记 key -> require。
export const legacyImages: Record<string, ImageSourcePropType> = {
  // 首页轮播
  'top_AD.png': require('../assets/legacy/img/top_AD.png'),
  'top_AD2.png': require('../assets/legacy/img/top_AD2.png'),
  'top_AD3.png': require('../assets/legacy/img/top_AD3.png'),
  // 景点（首页人气榜 + 瀑布流）
  'jd/gz.jpg': require('../assets/legacy/img/jd/gz.jpg'),
  'jd/gzcl.png': require('../assets/legacy/img/jd/gzcl.png'),
  'changlong.png': require('../assets/legacy/img/changlong.png'),
  'dxs.jpg': require('../assets/legacy/img/dxs.jpg'),
  'jd/gdsfwzwhycg.png': require('../assets/legacy/img/jd/gdsfwzwhycg.png'),
  'jd/dxs.png': require('../assets/legacy/img/jd/dxs.png'),
  'jd/nsthg.png': require('../assets/legacy/img/jd/nsthg.png'),
  'jd/lnyxy.png': require('../assets/legacy/img/jd/lnyxy.png'),
  // 行程城市精选 POI
  'dghmdq.jpg': require('../assets/legacy/img/dghmdq.jpg'),
  'dgypzzbwg.png': require('../assets/legacy/img/dgypzzbwg.png'),
  'gysgjslgy.png': require('../assets/legacy/img/gysgjslgy.png'),
};

// 按 key 取本地图；key 未登记时返回占位图并告警，
// 避免 <Image source={undefined}> 在端上崩溃 / 空白。
export function resolveLegacyImage(key: string): ImageSourcePropType {
  const img = legacyImages[key];
  if (!img) {
    if (__DEV__) {
      console.warn(`[legacy-images] 未登记的图片 key：${key}`);
    }
    return legacyImages['top_AD.png'];
  }
  return img;
}
