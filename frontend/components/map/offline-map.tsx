// 离线地图 —— 断网时的旅行地图兜底方案。
// 静态可缩放/可平移画布 + 随 App 内置的广东景点 POI + 重点景点离线路线规划
// （直线距离 + 出行方式时长估算，全程不依赖网络）。

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  formatDistance,
  formatDuration,
  type OfflineRouteMode,
  projectToUnit,
  routeTotals,
} from '@/lib/geo';
import {
  CATEGORY_COLOR,
  type GdPoi,
  GUANGDONG_POIS,
} from '@/lib/guangdong-poi';

const PAD = 34; // 画布内边距，避免边缘 POI 被裁
const MIN_SCALE = 1;
const MAX_SCALE = 3;

const MODES: {
  key: OfflineRouteMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'driving', label: '驾车', icon: 'car-outline' },
  { key: 'walking', label: '步行', icon: 'walk-outline' },
  { key: 'bicycling', label: '骑行', icon: 'bicycle-outline' },
];

interface XY {
  x: number;
  y: number;
}

// 两个 POI 之间的路线连线（一条按夹角旋转的细条）。
function RouteSegment({ from, to }: { from: XY; to: XY }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <View
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        left: (from.x + to.x) / 2 - length / 2,
        top: (from.y + to.y) / 2 - 2,
        width: length,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#1E9E63',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// 画布上的单个 POI 标注。
function PoiPin({
  poi,
  pos,
  order,
  focused,
  onPress,
}: {
  poi: GdPoi;
  pos: XY;
  order: number; // 0 = 未加入路线，>0 = 路线中的序号
  focused: boolean;
  onPress: () => void;
}) {
  const inRoute = order > 0;
  const size = focused ? 30 : 24;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${poi.name}（${poi.city}）`}
      style={{
        position: 'absolute',
        left: pos.x - 36,
        top: pos.y - size / 2,
        width: 72,
        alignItems: 'center',
      }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: inRoute ? '#1E9E63' : CATEGORY_COLOR[poi.category],
          borderWidth: 2.5,
          borderColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 2px 6px rgba(0,0,0,0.28)',
        }}>
        {inRoute ? (
          <Text className="text-[12px] font-extrabold text-white">{order}</Text>
        ) : (
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: '#FFFFFF',
            }}
          />
        )}
      </View>
      <View
        style={{ boxShadow: '0px 1px 4px rgba(0,0,0,0.18)' }}
        className="mt-1 rounded-md bg-white/95 px-1.5 py-0.5">
        <Text
          numberOfLines={1}
          className="text-[9px] font-semibold text-[#33403A]">
          {poi.name}
        </Text>
      </View>
    </Pressable>
  );
}

// 缩放 / 复位按钮。
function ZoomButton({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.16)' }}
      className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-white">
      <Ionicons name={icon} size={20} color="#386641" />
    </Pressable>
  );
}

export function OfflineMap() {
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [mode, setMode] = useState<OfflineRouteMode>('driving');
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const scaleRef = useRef(1);

  // 拖拽平移：阈值外才接管，保证点选 POI 的 tap 不被吞。
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => pan.extractOffset(),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => pan.flattenOffset(),
        onPanResponderTerminate: () => pan.flattenOffset(),
      }),
    [pan],
  );

  // 画布铺满可视区（POI 按经纬度归一化投影，轻微拉伸对示意地图无碍）。
  const world = useMemo(
    () => (viewport ? { w: viewport.w, h: viewport.h } : null),
    [viewport],
  );

  const posOf = useCallback(
    (poi: GdPoi): XY => {
      if (!world) return { x: 0, y: 0 };
      const u = projectToUnit(poi);
      return {
        x: PAD + u.x * (world.w - 2 * PAD),
        y: PAD + u.y * (world.h - 2 * PAD),
      };
    },
    [world],
  );

  const routePois = useMemo(
    () =>
      routeIds
        .map((id) => GUANGDONG_POIS.find((p) => p.id === id))
        .filter((p): p is GdPoi => Boolean(p)),
    [routeIds],
  );
  const totals = useMemo(
    () => routeTotals(routePois, mode),
    [routePois, mode],
  );
  const focusedPoi = focusedId
    ? GUANGDONG_POIS.find((p) => p.id === focusedId) ?? null
    : null;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport((v) =>
      v && v.w === width && v.h === height ? v : { w: width, h: height },
    );
  };

  const zoomBy = (dir: 1 | -1) => {
    const next = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, scaleRef.current + dir * 0.5),
    );
    scaleRef.current = next;
    Animated.timing(scale, {
      toValue: next,
      duration: 160,
      useNativeDriver: false,
    }).start();
  };
  const resetView = () => {
    scaleRef.current = 1;
    pan.flattenOffset();
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const toggleRoute = (id: string) => {
    setRouteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setFocusedId(null);
  };

  return (
    <View className="flex-1 bg-[#EDEAD9]">
      {/* 可缩放 / 可平移画布 */}
      <View
        className="flex-1 items-center justify-center overflow-hidden"
        onLayout={onLayout}
        {...panResponder.panHandlers}>
        {world && (
          <Animated.View
            style={{
              width: world.w,
              height: world.h,
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale },
              ],
            }}>
            <LinearGradient
              colors={['#DCEAD7', '#E8E6CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  pointerEvents: 'none',
                  borderWidth: 1,
                  borderColor: '#C7C6A6',
                  borderRadius: 6,
                },
              ]}
            />
            {/* 装饰网格 */}
            {[0.25, 0.5, 0.75].map((f) => (
              <View
                key={`v${f}`}
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: world.w * f,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: 'rgba(120,140,110,0.16)',
                }}
              />
            ))}
            {[0.33, 0.66].map((f) => (
              <View
                key={`h${f}`}
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: world.h * f,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(120,140,110,0.16)',
                }}
              />
            ))}
            {/* 水印 */}
            <View
              style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
              className="items-center justify-center">
              <Text
                style={{
                  fontSize: world.w * 0.17,
                  fontWeight: '900',
                  color: 'rgba(56,102,65,0.08)',
                  letterSpacing: 6,
                }}>
                广东
              </Text>
            </View>
            {/* 路线连线 */}
            {routePois.slice(1).map((p, i) => (
              <RouteSegment
                key={`seg-${p.id}`}
                from={posOf(routePois[i])}
                to={posOf(p)}
              />
            ))}
            {/* POI 标注 */}
            {GUANGDONG_POIS.map((poi) => (
              <PoiPin
                key={poi.id}
                poi={poi}
                pos={posOf(poi)}
                order={routeIds.indexOf(poi.id) + 1}
                focused={focusedId === poi.id}
                onPress={() => setFocusedId(poi.id)}
              />
            ))}
          </Animated.View>
        )}

        {/* 离线徽标 */}
        <View
          style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.12)' }}
          className="absolute left-3 top-3 flex-row items-center rounded-full bg-white px-3 py-1.5">
          <Ionicons name="cloud-offline-outline" size={14} color="#B5503C" />
          <Text className="ml-1.5 text-[11px] font-semibold text-[#6B4740]">
            离线地图 · 数据随 App 内置
          </Text>
        </View>

        {/* 缩放控件 */}
        <View className="absolute right-3 top-1/3">
          <ZoomButton icon="add" onPress={() => zoomBy(1)} />
          <ZoomButton icon="remove" onPress={() => zoomBy(-1)} />
          <ZoomButton icon="scan-outline" onPress={resetView} />
        </View>
      </View>

      {/* 底部面板：选中景点卡 / 离线路线规划 */}
      <View
        style={{ boxShadow: '0px -4px 16px rgba(0,0,0,0.1)' }}
        className="rounded-t-3xl bg-white px-4 pb-5 pt-4">
        {focusedPoi ? (
          <FocusedCard
            poi={focusedPoi}
            inRoute={routeIds.includes(focusedPoi.id)}
            onToggle={() => toggleRoute(focusedPoi.id)}
            onClose={() => setFocusedId(null)}
          />
        ) : (
          <RoutePlanner
            routePois={routePois}
            mode={mode}
            onModeChange={setMode}
            totals={totals}
            onRemove={toggleRoute}
            onClear={() => setRouteIds([])}
          />
        )}
      </View>
    </View>
  );
}

// 选中景点的详情卡。
function FocusedCard({
  poi,
  inRoute,
  onToggle,
  onClose,
}: {
  poi: GdPoi;
  inRoute: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <View>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-[#2A2A2A]">{poi.name}</Text>
          <View className="mt-1.5 flex-row items-center">
            <View className="flex-row items-center rounded-full bg-[#F1F0E4] px-2 py-0.5">
              <Ionicons name="location-outline" size={11} color="#6E746F" />
              <Text className="ml-1 text-[11px] text-[#6E746F]">{poi.city}</Text>
            </View>
            <View
              style={{ backgroundColor: CATEGORY_COLOR[poi.category] }}
              className="ml-2 rounded-full px-2 py-0.5">
              <Text className="text-[11px] font-medium text-white">
                {poi.category}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="关闭"
          hitSlop={8}
          className="h-7 w-7 items-center justify-center rounded-full bg-[#F1F0E4]">
          <Ionicons name="close" size={16} color="#6E746F" />
        </Pressable>
      </View>
      <Text className="mt-2.5 text-[12px] leading-5 text-[#5A5F58]">
        {poi.summary}
      </Text>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        className={`mt-3.5 h-11 flex-row items-center justify-center rounded-xl ${
          inRoute ? 'bg-[#F1F0E4]' : 'bg-primary'
        }`}>
        <Ionicons
          name={inRoute ? 'remove-circle-outline' : 'add-circle-outline'}
          size={17}
          color={inRoute ? '#6E746F' : '#FFFFFF'}
        />
        <Text
          className={`ml-1.5 text-[13px] font-bold ${
            inRoute ? 'text-[#6E746F]' : 'text-white'
          }`}>
          {inRoute ? '移出路线' : '加入路线'}
        </Text>
      </Pressable>
    </View>
  );
}

// 离线路线规划面板。
function RoutePlanner({
  routePois,
  mode,
  onModeChange,
  totals,
  onRemove,
  onClear,
}: {
  routePois: GdPoi[];
  mode: OfflineRouteMode;
  onModeChange: (m: OfflineRouteMode) => void;
  totals: { distance: number; duration: number };
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-[#2A2A2A]">离线路线规划</Text>
        {routePois.length > 0 && (
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            hitSlop={6}
            className="flex-row items-center">
            <Ionicons name="trash-outline" size={13} color="#B5503C" />
            <Text className="ml-1 text-[12px] text-[#B5503C]">清空</Text>
          </Pressable>
        )}
      </View>

      {/* 出行方式 */}
      <View className="mt-3 flex-row">
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <Pressable
              key={m.key}
              onPress={() => onModeChange(m.key)}
              accessibilityRole="button"
              className={`mr-2 flex-row items-center rounded-full border px-3 py-1.5 ${
                active
                  ? 'border-primary bg-primary'
                  : 'border-[#E3E2D4] bg-white'
              }`}>
              <Ionicons
                name={m.icon}
                size={14}
                color={active ? '#FFFFFF' : '#6E746F'}
              />
              <Text
                className={`ml-1 text-[12px] ${
                  active ? 'font-bold text-white' : 'text-[#6E746F]'
                }`}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {routePois.length === 0 ? (
        <View className="mt-3 flex-row items-center rounded-xl bg-[#F7F6EC] px-3 py-3">
          <Ionicons name="hand-left-outline" size={15} color="#9AA09A" />
          <Text className="ml-2 flex-1 text-[12px] leading-5 text-[#9AA09A]">
            点选地图上的景点加入路线，离线即可估算总距离与用时。
          </Text>
        </View>
      ) : (
        <>
          {/* 途经景点 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ alignItems: 'center' }}>
            {routePois.map((p, i) => (
              <View key={p.id} className="flex-row items-center">
                {i > 0 && (
                  <Ionicons
                    name="arrow-forward"
                    size={12}
                    color="#C0C4BC"
                    style={{ marginHorizontal: 4 }}
                  />
                )}
                <Pressable
                  onPress={() => onRemove(p.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`从路线移除 ${p.name}`}
                  className="flex-row items-center rounded-full bg-[#EEF4EC] py-1 pl-1 pr-2">
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Text className="text-[10px] font-bold text-white">
                      {i + 1}
                    </Text>
                  </View>
                  <Text className="ml-1 text-[12px] text-[#3C4A40]">
                    {p.name}
                  </Text>
                  <Ionicons
                    name="close"
                    size={12}
                    color="#9AA09A"
                    style={{ marginLeft: 3 }}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {routePois.length < 2 ? (
            <Text className="mt-3 text-[12px] text-[#9AA09A]">
              再选一个景点即可生成离线路线。
            </Text>
          ) : (
            <View className="mt-3 flex-row rounded-xl bg-[#F1FAF4] px-3 py-3">
              <View className="flex-1 flex-row items-center">
                <Ionicons name="git-branch-outline" size={16} color="#1E9E63" />
                <View className="ml-2">
                  <Text className="text-[10px] text-[#6E746F]">直线总距离</Text>
                  <Text className="text-[14px] font-bold text-[#1E7A52]">
                    {formatDistance(totals.distance)}
                  </Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center">
                <Ionicons name="time-outline" size={16} color="#1E9E63" />
                <View className="ml-2">
                  <Text className="text-[10px] text-[#6E746F]">预计用时</Text>
                  <Text className="text-[14px] font-bold text-[#1E7A52]">
                    {formatDuration(totals.duration)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
