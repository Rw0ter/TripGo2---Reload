// 此文件由 scripts/fetch-offline-tiles.js 生成，请勿手改。
// 离线地图的腾讯栅格瓦片（zoom 9，广东范围）。
import type { ImageSourcePropType } from 'react-native';

export const OFFLINE_TILE_GRID = {
  z: 9,
  xMin: 414,
  yMin: 220,
  cols: 9,
  rows: 5,
  tileSize: 256,
} as const;

// [row][col] 顺序的瓦片资源，与 OFFLINE_TILE_GRID 对应。
export const OFFLINE_TILES: ImageSourcePropType[][] = [
  [require('../assets/offline-map/tile-0-0.jpg'), require('../assets/offline-map/tile-1-0.jpg'), require('../assets/offline-map/tile-2-0.jpg'), require('../assets/offline-map/tile-3-0.jpg'), require('../assets/offline-map/tile-4-0.jpg'), require('../assets/offline-map/tile-5-0.jpg'), require('../assets/offline-map/tile-6-0.jpg'), require('../assets/offline-map/tile-7-0.jpg'), require('../assets/offline-map/tile-8-0.jpg')],
  [require('../assets/offline-map/tile-0-1.jpg'), require('../assets/offline-map/tile-1-1.jpg'), require('../assets/offline-map/tile-2-1.jpg'), require('../assets/offline-map/tile-3-1.jpg'), require('../assets/offline-map/tile-4-1.jpg'), require('../assets/offline-map/tile-5-1.jpg'), require('../assets/offline-map/tile-6-1.jpg'), require('../assets/offline-map/tile-7-1.jpg'), require('../assets/offline-map/tile-8-1.jpg')],
  [require('../assets/offline-map/tile-0-2.jpg'), require('../assets/offline-map/tile-1-2.jpg'), require('../assets/offline-map/tile-2-2.jpg'), require('../assets/offline-map/tile-3-2.jpg'), require('../assets/offline-map/tile-4-2.jpg'), require('../assets/offline-map/tile-5-2.jpg'), require('../assets/offline-map/tile-6-2.jpg'), require('../assets/offline-map/tile-7-2.jpg'), require('../assets/offline-map/tile-8-2.jpg')],
  [require('../assets/offline-map/tile-0-3.jpg'), require('../assets/offline-map/tile-1-3.jpg'), require('../assets/offline-map/tile-2-3.jpg'), require('../assets/offline-map/tile-3-3.jpg'), require('../assets/offline-map/tile-4-3.jpg'), require('../assets/offline-map/tile-5-3.jpg'), require('../assets/offline-map/tile-6-3.jpg'), require('../assets/offline-map/tile-7-3.jpg'), require('../assets/offline-map/tile-8-3.jpg')],
  [require('../assets/offline-map/tile-0-4.jpg'), require('../assets/offline-map/tile-1-4.jpg'), require('../assets/offline-map/tile-2-4.jpg'), require('../assets/offline-map/tile-3-4.jpg'), require('../assets/offline-map/tile-4-4.jpg'), require('../assets/offline-map/tile-5-4.jpg'), require('../assets/offline-map/tile-6-4.jpg'), require('../assets/offline-map/tile-7-4.jpg'), require('../assets/offline-map/tile-8-4.jpg')],
];
