// 腾讯地图跨端组件的桥接协议 —— web（iframe）与原生（WebView）共用。

// 出行方式（与离线路线一致，不含公交：公交路线结构差异大，本期不做）。
export type RouteMode = 'driving' | 'walking' | 'bicycling';

export const ROUTE_MODE_LABEL: Record<RouteMode, string> = {
  driving: '驾车',
  walking: '步行',
  bicycling: '骑行',
};

// 搜索返回的地点。
export interface MapPoi {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
}

// 路线分段指示。
export interface RouteStep {
  instruction: string;
  distance: number; // 米
}

// 一条规划好的路线。
export interface RouteInfo {
  mode: RouteMode;
  distance: number; // 米
  duration: number; // 分钟
  steps: RouteStep[];
}

// 定位结果来源：浏览器 GPS / IP 粗定位 / 默认兜底。
export type LocateSource = 'gps' | 'ip' | 'default';

// React → 地图 的指令。
export type MapCommand =
  | { type: 'locate' }
  | { type: 'search'; keyword: string }
  | { type: 'selectPoi'; lat: number; lng: number; title: string }
  | { type: 'planRoute'; mode: RouteMode; toLat: number; toLng: number }
  | { type: 'clearRoute' }
  | { type: 'startNav' }
  | { type: 'stopNav' }
  | { type: 'rotateMap'; deg: number }
  // web 端在父窗口取得 GPS 坐标后喂进 iframe（srcDoc 不透明源内无法直接定位）。
  | { type: 'locateAt'; lat: number; lng: number; source?: LocateSource };

// 地图 → React 的事件。
export type MapEvent =
  | { type: 'ready' }
  | { type: 'fatal'; message: string } // SDK 加载/初始化失败 → 触发离线兜底
  | { type: 'located'; lat: number; lng: number; source: LocateSource }
  | { type: 'searchResults'; list: MapPoi[] }
  | { type: 'searchError'; message: string }
  | { type: 'routeResult'; route: RouteInfo }
  | { type: 'routeError'; message: string }
  | { type: 'navEnd' };

// 跨端地图组件对外暴露的命令式句柄。
export interface TencentMapHandle {
  send: (cmd: MapCommand) => void;
}

export interface TencentMapProps {
  onEvent: (e: MapEvent) => void;
}
