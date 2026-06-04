import type { ImageSourcePropType } from 'react-native';

// 后端数据里的图片字段是 key（图片随 App 打包，不走网络）。
// 屏幕拿到后端数据后，用 key 在此表解析出本地资源。
// 新数据用到的图片，在此登记 key -> require。
export const legacyImages: Record<string, ImageSourcePropType> = {
  // 兜底占位图（见 resolveLegacyImage）
  'top_AD.png': require('../assets/legacy/img/top_AD.png'),
  // 热门景点（首页大横卡）
  'jd/gz.jpg': require('../assets/legacy/img/jd/gz.jpg'),
  'jd/dxs.png': require('../assets/legacy/img/jd/dxs.png'),
  'jd/gzcl.png': require('../assets/legacy/img/jd/gzcl.png'),
  'changlong.png': require('../assets/legacy/img/changlong.png'),
  // 行程城市精选 POI
  'dghmdq.jpg': require('../assets/legacy/img/dghmdq.jpg'),
  'dgypzzbwg.png': require('../assets/legacy/img/dgypzzbwg.png'),
  'gysgjslgy.png': require('../assets/legacy/img/gysgjslgy.png'),
  // 广东城市大图（首页轮播 + 城市精选瀑布流）
  'xc/xc_guangzhou.jpg': require('../assets/legacy/img/xc/xc_guangzhou.jpg'),
  'xc/xc_shenzhen.jpg': require('../assets/legacy/img/xc/xc_shenzhen.jpg'),
  'xc/xc_zhuhai.jpg': require('../assets/legacy/img/xc/xc_zhuhai.jpg'),
  'xc/xc_chaozhou.jpeg': require('../assets/legacy/img/xc/xc_chaozhou.jpeg'),
  'xc/xc_dongguan.jpg': require('../assets/legacy/img/xc/xc_dongguan.jpg'),
  'xc/xc_huizhou.jpg': require('../assets/legacy/img/xc/xc_huizhou.jpg'),
  'xc/xc_jiangmen.jpg': require('../assets/legacy/img/xc/xc_jiangmen.jpg'),
  'xc/xc_heyuan.png': require('../assets/legacy/img/xc/xc_heyuan.png'),
  'xc/xc_qingyuan.jpg': require('../assets/legacy/img/xc/xc_qingyuan.jpg'),
  'xc/xc_zhaoqing.jpg': require('../assets/legacy/img/xc/xc_zhaoqing.jpg'),
  'xc/xc_jieyang.jpeg': require('../assets/legacy/img/xc/xc_jieyang.jpeg'),
  'xc/xc_meizhou.jpg': require('../assets/legacy/img/xc/xc_meizhou.jpg'),
  // 非遗学习页 (study)
  'fyxx/yuejufm.jpg': require('../assets/legacy/img/fyxx/yuejufm.jpg'),
  'fyxx/jianzhifm1.jpg': require('../assets/legacy/img/fyxx/jianzhifm1.jpg'),
  'fyxx/zhenjiufm.jpg': require('../assets/legacy/img/fyxx/zhenjiufm.jpg'),
  'fyxx/piyingfm.png': require('../assets/legacy/img/fyxx/piyingfm.png'),
  'fyxx/syhd.jpg': require('../assets/legacy/img/fyxx/syhd.jpg'),
  'fyxx/sywhz.png': require('../assets/legacy/img/fyxx/sywhz.png'),
  // 景点详情页轮播兜底图（与旧版 xq.html 一致）
  'gz.jpg': require('../assets/legacy/img/gz.jpg'),
  'gz2.jpg': require('../assets/legacy/img/gz2.jpg'),
  'gz3.jpg': require('../assets/legacy/img/gz3.jpg'),
  'gz4.jpg': require('../assets/legacy/img/gz4.jpg'),
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
