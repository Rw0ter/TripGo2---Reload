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
  'fyxx/yx.jpg': require('../assets/legacy/img/fyxx/yx.jpg'), // 醒狮
  // 非遗 study 主题配图：缺 Legacy 图的题材联网补（Wikimedia，见 PROGRESS）
  'study/guangxiu.jpeg': require('../assets/legacy/img/study/guangxiu.jpeg'), // 广绣
  'study/gongfucha.jpg': require('../assets/legacy/img/study/gongfucha.jpg'), // 工夫茶
  'study/longzhou.jpg': require('../assets/legacy/img/study/longzhou.jpg'), // 龙舟
  'study/lnjz.jpg': require('../assets/legacy/img/study/lnjz.jpg'), // 岭南建筑
  // 非遗详情页画廊：Legacy fyxx 多图 + 联网补图（Wikimedia）
  'fyxx/yueju1.jpg': require('../assets/legacy/img/fyxx/yueju1.jpg'),
  'fyxx/yueju2.jpg': require('../assets/legacy/img/fyxx/yueju2.jpg'),
  'fyxx/yueju3.jpg': require('../assets/legacy/img/fyxx/yueju3.jpg'),
  'fyxx/yx1.jpg': require('../assets/legacy/img/fyxx/yx1.jpg'),
  'fyxx/yx2.jpg': require('../assets/legacy/img/fyxx/yx2.jpg'),
  'fyxx/jianzhi1.jpg': require('../assets/legacy/img/fyxx/jianzhi1.jpg'),
  'fyxx/jianzhi2.jpg': require('../assets/legacy/img/fyxx/jianzhi2.jpg'),
  'fyxx/jianzhi3.jpg': require('../assets/legacy/img/fyxx/jianzhi3.jpg'),
  'fyxx/pyxzs.jpg': require('../assets/legacy/img/fyxx/pyxzs.jpg'),
  'fyxx/pyxzs1.jpg': require('../assets/legacy/img/fyxx/pyxzs1.jpg'),
  'fyxx/pyxzs2.jpg': require('../assets/legacy/img/fyxx/pyxzs2.jpg'),
  'study/guangxiu_1.jpg': require('../assets/legacy/img/study/guangxiu_1.jpg'),
  'study/gongfucha_1.jpg': require('../assets/legacy/img/study/gongfucha_1.jpg'),
  'study/longzhou_1.jpg': require('../assets/legacy/img/study/longzhou_1.jpg'),
  'study/longzhou_2.jpg': require('../assets/legacy/img/study/longzhou_2.jpg'),
  'study/lnjz_1.jpg': require('../assets/legacy/img/study/lnjz_1.jpg'),
  'study/lnjz_2.jpg': require('../assets/legacy/img/study/lnjz_2.jpg'),
  // 景点详情页轮播兜底图（与旧版 xq.html 一致）
  'gz.jpg': require('../assets/legacy/img/gz.jpg'),
  'gz2.jpg': require('../assets/legacy/img/gz2.jpg'),
  'gz3.jpg': require('../assets/legacy/img/gz3.jpg'),
  'gz4.jpg': require('../assets/legacy/img/gz4.jpg'),
  // 文创产品（products 列表 + 搜索文创结果）——图随 App 打包，key 即后端 destination.image 全路径。
  '/resources/img/wccpImg/bj.png': require('../assets/legacy/img/wccpImg/bj.png'),
  '/resources/img/wccpImg/cscjbogz.png': require('../assets/legacy/img/wccpImg/cscjbogz.png'),
  '/resources/img/wccpImg/csdcbj.png': require('../assets/legacy/img/wccpImg/csdcbj.png'),
  '/resources/img/wccpImg/csnrwsglh.png': require('../assets/legacy/img/wccpImg/csnrwsglh.png'),
  '/resources/img/wccpImg/cssdnrw.png': require('../assets/legacy/img/wccpImg/cssdnrw.png'),
  '/resources/img/wccpImg/cszzhdmx.png': require('../assets/legacy/img/wccpImg/cszzhdmx.png'),
  '/resources/img/wccpImg/czfhdcc.png': require('../assets/legacy/img/wccpImg/czfhdcc.png'),
  '/resources/img/wccpImg/czmbsynh.png': require('../assets/legacy/img/wccpImg/czmbsynh.png'),
  '/resources/img/wccpImg/czmdsq.png': require('../assets/legacy/img/wccpImg/czmdsq.png'),
  '/resources/img/wccpImg/czzscjtz.png': require('../assets/legacy/img/wccpImg/czzscjtz.png'),
  '/resources/img/wccpImg/dgmfgxfs.png': require('../assets/legacy/img/wccpImg/dgmfgxfs.png'),
  '/resources/img/wccpImg/dlbs.png': require('../assets/legacy/img/wccpImg/dlbs.png'),
  '/resources/img/wccpImg/fschtchp.jpg': require('../assets/legacy/img/wccpImg/fschtchp.jpg'),
  '/resources/img/wccpImg/fsjlgzqmbj.png': require('../assets/legacy/img/wccpImg/fsjlgzqmbj.png'),
  '/resources/img/wccpImg/fslncmssh.png': require('../assets/legacy/img/wccpImg/fslncmssh.png'),
  '/resources/img/wccpImg/fslzsjnbj.png': require('../assets/legacy/img/wccpImg/fslzsjnbj.png'),
  '/resources/img/wccpImg/fsmgb.png': require('../assets/legacy/img/wccpImg/fsmgb.png'),
  '/resources/img/wccpImg/gdfzxlz.png': require('../assets/legacy/img/wccpImg/gdfzxlz.png'),
  '/resources/img/wccpImg/gslcnjzz.png': require('../assets/legacy/img/wccpImg/gslcnjzz.png'),
  '/resources/img/wccpImg/gsyqgzmx.png': require('../assets/legacy/img/wccpImg/gsyqgzmx.png'),
  '/resources/img/wccpImg/gzctfzshtz.png': require('../assets/legacy/img/wccpImg/gzctfzshtz.png'),
  '/resources/img/wccpImg/gzllchgj.png': require('../assets/legacy/img/wccpImg/gzllchgj.png'),
  '/resources/img/wccpImg/gzlnjzysk.png': require('../assets/legacy/img/wccpImg/gzlnjzysk.png'),
  '/resources/img/wccpImg/gzschngh.png': require('../assets/legacy/img/wccpImg/gzschngh.png'),
  '/resources/img/wccpImg/gzxsgytk.png': require('../assets/legacy/img/wccpImg/gzxsgytk.png'),
  '/resources/img/wccpImg/gzydsl.png': require('../assets/legacy/img/wccpImg/gzydsl.png'),
  '/resources/img/wccpImg/gzylcpysh.png': require('../assets/legacy/img/wccpImg/gzylcpysh.png'),
  '/resources/img/wccpImg/gzyqycgptz.png': require('../assets/legacy/img/wccpImg/gzyqycgptz.png'),
  '/resources/img/wccpImg/gzzjgzwdgs.png': require('../assets/legacy/img/wccpImg/gzzjgzwdgs.png'),
  '/resources/img/wccpImg/lnhhlmngz.png': require('../assets/legacy/img/wccpImg/lnhhlmngz.png'),
  '/resources/img/wccpImg/mzkjcmg.png': require('../assets/legacy/img/wccpImg/mzkjcmg.png'),
  '/resources/img/wccpImg/nhhtmgzbt.png': require('../assets/legacy/img/wccpImg/nhhtmgzbt.png'),
  '/resources/img/wccpImg/nhmoxsb.jpg': require('../assets/legacy/img/wccpImg/nhmoxsb.jpg'),
  '/resources/img/wccpImg/nhnjdmsgk.png': require('../assets/legacy/img/wccpImg/nhnjdmsgk.png'),
  '/resources/img/wccpImg/snxhcp.png': require('../assets/legacy/img/wccpImg/snxhcp.png'),
  '/resources/img/wccpImg/szycchmxp.jpg': require('../assets/legacy/img/wccpImg/szycchmxp.jpg'),
  '/resources/img/wccpImg/szymsgjjmx.jpg': require('../assets/legacy/img/wccpImg/szymsgjjmx.jpg'),
  '/resources/img/wccpImg/yjlpzs.png': require('../assets/legacy/img/wccpImg/yjlpzs.png'),
  '/resources/img/wccpImg/zhbkmskh.png': require('../assets/legacy/img/wccpImg/zhbkmskh.png'),
  '/resources/img/wccpImg/zsjqyjzgj.png': require('../assets/legacy/img/wccpImg/zsjqyjzgj.png'),
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
