// 地理计算工具 —— 离线地图的距离、投影、路线估算。

import { GUANGDONG_BBOX } from './guangdong-poi';

export interface LatLng {
  lat: number;
  lng: number;
}

// 离线路线支持的出行方式（公交无法离线估算，故不含 transit）。
export type OfflineRouteMode = 'driving' | 'walking' | 'bicycling';

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// 两点球面距离（米）。
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// 经纬度 → 离线地图画布上的归一化坐标 [0,1]。
// y 轴翻转：纬度越大越靠画布上方。
export function projectToUnit(p: LatLng): { x: number; y: number } {
  const { lngMin, lngMax, latMin, latMax } = GUANGDONG_BBOX;
  return {
    x: clamp01((p.lng - lngMin) / (lngMax - lngMin)),
    y: clamp01(1 - (p.lat - latMin) / (latMax - latMin)),
  };
}

// 各出行方式平均速度（米/分钟），用于离线时长估算。
// 离线规划主要服务跨城景点路线，驾车取含高速的综合均速。
const SPEED_M_PER_MIN: Record<OfflineRouteMode, number> = {
  driving: 78000 / 60, // ≈ 78 km/h
  bicycling: 15000 / 60, // ≈ 15 km/h
  walking: 4800 / 60, // ≈ 4.8 km/h
};

// 直线距离换算成「道路距离」的迂回系数 —— 直线总是偏短。
const DETOUR_FACTOR = 1.2;

// 一组途经点按顺序连成路线的直线总距离（米）与估算时长（分钟）。
export function routeTotals(
  points: LatLng[],
  mode: OfflineRouteMode,
): { distance: number; duration: number } {
  let distance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    distance += haversineMeters(points[i], points[i + 1]);
  }
  const duration =
    points.length < 2
      ? 0
      : Math.max(1, Math.round((distance * DETOUR_FACTOR) / SPEED_M_PER_MIN[mode]));
  return { distance, duration };
}

// 距离格式化：< 1km 显示米，否则显示公里。
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} 米`;
  return `${(meters / 1000).toFixed(1)} 公里`;
}

// 时长格式化：跨小时显示「x 小时 y 分钟」。
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}
