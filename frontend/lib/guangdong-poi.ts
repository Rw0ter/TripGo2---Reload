// 广东重点景点 POI 数据集 —— 随 App 打包，供「离线地图」在断网时使用。
// 在线模式走腾讯地图 service 库实时搜索，不用这份数据。

export type PoiCategory =
  | '城市地标'
  | '历史人文'
  | '自然山水'
  | '岭南名园'
  | '非遗文化'
  | '主题乐园';

export interface GdPoi {
  id: string;
  name: string;
  city: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  summary: string;
}

// 广东地理范围（投影到离线地图画布用）。略放宽，保证所有 POI 落在画布内。
export const GUANGDONG_BBOX = {
  lngMin: 112.0,
  lngMax: 117.3,
  latMin: 21.5,
  latMax: 25.6,
} as const;

// 各分类的主题色（离线地图标注 + 图例）。
export const CATEGORY_COLOR: Record<PoiCategory, string> = {
  城市地标: '#386641',
  历史人文: '#A8763E',
  自然山水: '#2F8F6B',
  岭南名园: '#6A8E3F',
  非遗文化: '#B5503C',
  主题乐园: '#3E72A8',
};

// 16 个广东代表性景点，覆盖珠三角与粤东、粤北、粤西。
export const GUANGDONG_POIS: GdPoi[] = [
  {
    id: 'gz-tower',
    name: '广州塔',
    city: '广州',
    category: '城市地标',
    lat: 23.1066,
    lng: 113.3245,
    summary: '海拔 600 米的羊城地标，珠江夜景与岭南天际线的最佳观景点。',
  },
  {
    id: 'gz-chenjiaci',
    name: '陈家祠',
    city: '广州',
    category: '非遗文化',
    lat: 23.129,
    lng: 113.243,
    summary: '岭南建筑艺术明珠，砖雕、木雕、灰塑、陶塑荟萃一堂。',
  },
  {
    id: 'gz-shamian',
    name: '沙面岛',
    city: '广州',
    category: '历史人文',
    lat: 23.1078,
    lng: 113.241,
    summary: '珠江白鹅潭畔的欧陆建筑群，近代广州对外通商的历史见证。',
  },
  {
    id: 'gz-yuexiu',
    name: '越秀公园',
    city: '广州',
    category: '自然山水',
    lat: 23.142,
    lng: 113.264,
    summary: '广州城区最大综合公园，五羊石像与镇海楼坐落其中。',
  },
  {
    id: 'gz-chimelong',
    name: '长隆旅游度假区',
    city: '广州',
    category: '主题乐园',
    lat: 22.997,
    lng: 113.327,
    summary: '野生动物世界与欢乐世界相邻，华南规模最大的主题度假区。',
  },
  {
    id: 'gz-yuyin',
    name: '余荫山房',
    city: '广州',
    category: '岭南名园',
    lat: 22.937,
    lng: 113.395,
    summary: '番禺南村的清代名园，岭南四大名园之一，以小巧精雅著称。',
  },
  {
    id: 'sz-window',
    name: '世界之窗',
    city: '深圳',
    category: '主题乐园',
    lat: 22.538,
    lng: 113.973,
    summary: '将世界奇观微缩园中，深圳湾畔的经典主题公园。',
  },
  {
    id: 'sz-lianhuashan',
    name: '莲花山公园',
    city: '深圳',
    category: '自然山水',
    lat: 22.557,
    lng: 114.058,
    summary: '登山可俯瞰深圳中心区天际线，市民休闲的城市绿肺。',
  },
  {
    id: 'fs-zumiao',
    name: '佛山祖庙',
    city: '佛山',
    category: '非遗文化',
    lat: 23.029,
    lng: 113.118,
    summary: '供奉北帝的古庙，岭南木雕与粤剧、武术文化的发源地之一。',
  },
  {
    id: 'fs-xiqiaoshan',
    name: '西樵山',
    city: '佛山',
    category: '自然山水',
    lat: 22.928,
    lng: 112.957,
    summary: '七十二峰错落的古火山，岭南理学名山与黄飞鸿故里。',
  },
  {
    id: 'fs-qinghui',
    name: '清晖园',
    city: '佛山',
    category: '岭南名园',
    lat: 22.804,
    lng: 113.29,
    summary: '顺德古园林，岭南四大名园之一，水石亭台布局精巧。',
  },
  {
    id: 'dg-keyuan',
    name: '可园',
    city: '东莞',
    category: '岭南名园',
    lat: 23.043,
    lng: 113.747,
    summary: '东莞莞城的清代园林，岭南四大名园之一，岭南画派策源地。',
  },
  {
    id: 'zh-ocean',
    name: '长隆海洋王国',
    city: '珠海',
    category: '主题乐园',
    lat: 22.103,
    lng: 113.527,
    summary: '横琴岛上的海洋主题乐园，鲸鲨馆与花车巡游为人称道。',
  },
  {
    id: 'jm-diaolou',
    name: '开平碉楼',
    city: '江门',
    category: '历史人文',
    lat: 22.295,
    lng: 112.566,
    summary: '中西合璧的侨乡碉楼群，世界文化遗产，记录华侨百年乡愁。',
  },
  {
    id: 'zq-qixingyan',
    name: '七星岩',
    city: '肇庆',
    category: '自然山水',
    lat: 23.075,
    lng: 112.455,
    summary: '七座石灰岩峰临湖而立，素有「岭南第一奇观」之誉。',
  },
  {
    id: 'cz-guangjiqiao',
    name: '广济桥',
    city: '潮州',
    category: '历史人文',
    lat: 23.659,
    lng: 116.64,
    summary: '韩江上的古浮桥，与赵州桥齐名的中国四大古桥之一。',
  },
];
