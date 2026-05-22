// 离线地图 —— 断网时的旅行地图兜底方案。
// 用随 App 打包的腾讯真实地图瓦片（多级：z9 概览 + z10 细节）渲染底图，
// 可缩放 / 可平移；POI 走 Web 墨卡托投影精确落点、标注随缩放反向补偿保持
// 恒定屏幕尺寸；支持定位当前位置 + 重点景点离线路线规划（haversine 距离）。

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  formatDistance,
  formatDuration,
  haversineMeters,
  type LatLng,
  type OfflineRouteMode,
  projectOnTileGrid,
  routeTotals,
} from '@/lib/geo';
import {
  CATEGORY_COLOR,
  type GdPoi,
  GUANGDONG_POIS,
} from '@/lib/guangdong-poi';
import { getCurrentLocation } from '@/lib/locate';
import {
  OFFLINE_TILE_GRID,
  OFFLINE_TILE_LEVELS,
  type OfflineTileLevel,
} from '@/lib/offline-tiles';

const GRID = OFFLINE_TILE_GRID;
const MIN_SCALE = 1; // 1 = cover 铺满
const MAX_SCALE = 4;
const DETAIL_LEVEL_AT = 2; // 缩放 ≥ 此值切到 z10 细节瓦片

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
// 反向缩放节点（Animated.divide 的返回类型）。
type AnimNumber = ReturnType<typeof Animated.divide>;

// 反向缩放锚点容器：定位在 pos，子节点抵消地图缩放保持恒定屏幕尺寸。
function Anchored({
  pos,
  invScale,
  children,
}: {
  pos: XY;
  invScale: AnimNumber;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 0,
        height: 0,
        transform: [{ scale: invScale }],
      }}>
      {children}
    </Animated.View>
  );
}

// 两个点之间的路线连线：长度随地图缩放、粗细反向补偿保持恒定。
function RouteSegment({
  from,
  to,
  invScale,
}: {
  from: XY;
  to: XY;
  invScale: AnimNumber;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <Animated.View
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        left: (from.x + to.x) / 2 - length / 2,
        top: (from.y + to.y) / 2,
        width: length,
        height: Animated.multiply(invScale, 4),
        marginTop: Animated.multiply(invScale, -2),
        borderRadius: 2,
        backgroundColor: '#1E9E63',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// 画布上的单个 POI 标注（恒定屏幕尺寸）。
function PoiPin({
  poi,
  pos,
  invScale,
  order,
  focused,
  onPress,
}: {
  poi: GdPoi;
  pos: XY;
  invScale: AnimNumber;
  order: number; // 0 = 未加入路线，>0 = 路线中的序号
  focused: boolean;
  onPress: () => void;
}) {
  const inRoute = order > 0;
  const size = focused ? 30 : 24;
  return (
    <Anchored pos={pos} invScale={invScale}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${poi.name}（${poi.city}）`}
        style={{ position: 'absolute', left: -36, top: -size / 2, width: 72, alignItems: 'center' }}>
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
            boxShadow: '0px 2px 6px rgba(0,0,0,0.4)',
          }}>
          {inRoute ? (
            <Text className="text-[12px] font-extrabold text-white">{order}</Text>
          ) : (
            <View
              style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFFFFF' }}
            />
          )}
        </View>
        <View
          style={{ boxShadow: '0px 1px 4px rgba(0,0,0,0.35)' }}
          className="mt-1 rounded-md bg-white/95 px-1.5 py-0.5">
          <Text numberOfLines={1} className="text-[9px] font-semibold text-[#33403A]">
            {poi.name}
          </Text>
        </View>
      </Pressable>
    </Anchored>
  );
}

// 「我的位置」标注。
function UserMarker({ pos, invScale }: { pos: XY; invScale: AnimNumber }) {
  return (
    <Anchored pos={pos} invScale={invScale}>
      <View
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          left: -15,
          top: -15,
          width: 30,
          height: 30,
          borderRadius: 999,
          backgroundColor: 'rgba(47,127,230,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: 15,
            height: 15,
            borderRadius: 999,
            backgroundColor: '#2F7FE6',
            borderWidth: 3,
            borderColor: '#FFFFFF',
          }}
        />
      </View>
    </Anchored>
  );
}

// 单级瓦片图层（铺满 world 矩形）。
function TileLayer({
  level,
  world,
}: {
  level: OfflineTileLevel;
  world: { w: number; h: number };
}) {
  const tw = world.w / level.cols;
  const th = world.h / level.rows;
  return (
    <>
      {level.tiles.map((rowTiles, row) =>
        rowTiles.map((src, col) => (
          <Image
            key={`${level.cols}-${row}-${col}`}
            source={src}
            resizeMode="cover"
            style={{
              position: 'absolute',
              left: col * tw,
              top: row * th,
              width: tw + 0.6,
              height: th + 0.6,
            }}
          />
        )),
      )}
    </>
  );
}

// 缩放 / 复位 / 定位按钮。
function MapButton({
  icon,
  onPress,
  busy,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.16)' }}
      className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-white">
      <Ionicons name={busy ? 'ellipsis-horizontal' : icon} size={20} color="#386641" />
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
  const [level, setLevel] = useState(0); // 0=z9 概览 / 1=z10 细节
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const scaleRef = useRef(1);
  // 标注 / 连线粗细反向缩放：1/scale，抵消地图缩放保持恒定屏幕尺寸。
  // 惰性初始化：Animated.divide 会挂到 scale 的节点图上，只能建一次。
  const invScaleRef = useRef<AnimNumber | null>(null);
  if (invScaleRef.current === null) {
    invScaleRef.current = Animated.divide(1, scale);
  }
  const invScale = invScaleRef.current;
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3200);
  }, []);

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

  // 瓦片网格按「cover」铺满可视区：初始即填满屏幕，靠平移浏览全省。
  const world = useMemo(() => {
    if (!viewport) return null;
    const cell = Math.max(viewport.w / GRID.cols, viewport.h / GRID.rows);
    return { w: GRID.cols * cell, h: GRID.rows * cell };
  }, [viewport]);

  const posOf = useCallback(
    (p: LatLng): XY => {
      if (!world) return { x: 0, y: 0 };
      const u = projectOnTileGrid(p, GRID);
      return { x: u.x * world.w, y: u.y * world.h };
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
  // 路线途经点：定位成功后以「我的位置」为起点。
  const routeLine = useMemo<LatLng[]>(
    () => (userPos ? [userPos, ...routePois] : routePois),
    [userPos, routePois],
  );
  const totals = useMemo(
    () => routeTotals(routeLine, mode),
    [routeLine, mode],
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

  const applyScale = (next: number) => {
    scaleRef.current = next;
    setLevel(next >= DETAIL_LEVEL_AT ? 1 : 0);
    Animated.timing(scale, {
      toValue: next,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };
  const zoomBy = (dir: 1 | -1) => {
    applyScale(
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current + dir * 0.6)),
    );
  };
  const resetView = () => {
    scaleRef.current = 1;
    setLevel(0);
    pan.flattenOffset();
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: false }),
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 把某个世界坐标点平移到可视区中心。
  const centerOnWorld = useCallback(
    (p: XY) => {
      if (!world) return;
      pan.flattenOffset();
      Animated.timing(pan, {
        toValue: {
          x: -(p.x - world.w / 2) * scaleRef.current,
          y: -(p.y - world.h / 2) * scaleRef.current,
        },
        duration: 280,
        useNativeDriver: false,
      }).start();
    },
    [pan, world],
  );

  const onLocate = () => {
    if (locating) return;
    setLocating(true);
    getCurrentLocation()
      .then((pos) => {
        setUserPos(pos);
        centerOnWorld(posOf(pos));
        showNotice('已定位到当前位置');
      })
      .catch((e: Error) => showNotice(e.message || '定位失败'))
      .finally(() => setLocating(false));
  };

  const toggleRoute = (id: string) => {
    setRouteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setFocusedId(null);
  };

  return (
    <View className="flex-1 bg-[#11221C]">
      {/* 可缩放 / 可平移的真实瓦片地图 */}
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
            {/* z9 概览底图常驻；放大后 z10 细节图层叠加在上层，
                切级别不会白屏闪烁。 */}
            <TileLayer level={OFFLINE_TILE_LEVELS[0]} world={world} />
            {level === 1 && (
              <TileLayer level={OFFLINE_TILE_LEVELS[1]} world={world} />
            )}
            {/* 路线连线 */}
            {routeLine.slice(1).map((p, i) => (
              <RouteSegment
                key={`seg-${i}`}
                from={posOf(routeLine[i])}
                to={posOf(p)}
                invScale={invScale}
              />
            ))}
            {/* POI 标注 */}
            {GUANGDONG_POIS.map((poi) => (
              <PoiPin
                key={poi.id}
                poi={poi}
                pos={posOf(poi)}
                invScale={invScale}
                order={routeIds.indexOf(poi.id) + 1}
                focused={focusedId === poi.id}
                onPress={() => setFocusedId(poi.id)}
              />
            ))}
            {/* 我的位置 */}
            {userPos && <UserMarker pos={posOf(userPos)} invScale={invScale} />}
          </Animated.View>
        )}

        {/* 离线徽标 */}
        <View
          style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.25)' }}
          className="absolute left-3 top-3 flex-row items-center rounded-full bg-white px-3 py-1.5">
          <Ionicons name="cloud-offline-outline" size={14} color="#B5503C" />
          <Text className="ml-1.5 text-[11px] font-semibold text-[#6B4740]">
            离线地图 · 地图瓦片随 App 内置
          </Text>
        </View>

        {/* 提示条 */}
        {notice && (
          <View
            style={{ pointerEvents: 'none' }}
            className="absolute left-0 right-0 top-14 items-center">
            <View className="rounded-full bg-black/78 px-4 py-2">
              <Text className="text-[12px] text-white">{notice}</Text>
            </View>
          </View>
        )}

        {/* 缩放 + 定位控件 */}
        <View className="absolute right-3 top-1/4">
          <MapButton icon="add" onPress={() => zoomBy(1)} />
          <MapButton icon="remove" onPress={() => zoomBy(-1)} />
          <MapButton icon="scan-outline" onPress={resetView} />
          <MapButton icon="locate" onPress={onLocate} busy={locating} />
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
            userPos={userPos}
            onToggle={() => toggleRoute(focusedPoi.id)}
            onClose={() => setFocusedId(null)}
          />
        ) : (
          <RoutePlanner
            routePois={routePois}
            userPos={userPos}
            mode={mode}
            onModeChange={setMode}
            totals={totals}
            routeLineLength={routeLine.length}
            onRemove={toggleRoute}
            onClearUser={() => setUserPos(null)}
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
  userPos,
  onToggle,
  onClose,
}: {
  poi: GdPoi;
  inRoute: boolean;
  userPos: LatLng | null;
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
      {userPos && (
        <View className="mt-2 flex-row items-center">
          <Ionicons name="navigate-circle-outline" size={13} color="#2F7FE6" />
          <Text className="ml-1 text-[12px] text-[#2F7FE6]">
            距我的位置直线 {formatDistance(haversineMeters(userPos, poi))}
          </Text>
        </View>
      )}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        className={`mt-3 h-11 flex-row items-center justify-center rounded-xl ${
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
  userPos,
  mode,
  onModeChange,
  totals,
  routeLineLength,
  onRemove,
  onClearUser,
  onClear,
}: {
  routePois: GdPoi[];
  userPos: LatLng | null;
  mode: OfflineRouteMode;
  onModeChange: (m: OfflineRouteMode) => void;
  totals: { distance: number; duration: number };
  routeLineLength: number;
  onRemove: (id: string) => void;
  onClearUser: () => void;
  onClear: () => void;
}) {
  const hasRoute = routeLineLength >= 2;
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
                active ? 'border-primary bg-primary' : 'border-[#E3E2D4] bg-white'
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
            点选地图上的景点加入路线；右侧「定位」可把当前位置设为起点。
          </Text>
        </View>
      ) : (
        <>
          {/* 途经点：定位后以「我的位置」为起点 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ alignItems: 'center' }}>
            {userPos && (
              <View className="flex-row items-center">
                <Pressable
                  onPress={onClearUser}
                  accessibilityRole="button"
                  accessibilityLabel="移除起点「我的位置」"
                  className="flex-row items-center rounded-full bg-[#E7F0FB] py-1 pl-1.5 pr-2">
                  <Ionicons name="navigate" size={12} color="#2F7FE6" />
                  <Text className="ml-1 text-[12px] text-[#2F6FCF]">我的位置</Text>
                  <Ionicons
                    name="close"
                    size={12}
                    color="#9AB6DC"
                    style={{ marginLeft: 3 }}
                  />
                </Pressable>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color="#C0C4BC"
                  style={{ marginHorizontal: 4 }}
                />
              </View>
            )}
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
                  <Text className="ml-1 text-[12px] text-[#3C4A40]">{p.name}</Text>
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

          {hasRoute ? (
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
          ) : (
            <Text className="mt-3 text-[12px] text-[#9AA09A]">
              再选一个景点、或点「定位」加入起点，即可生成离线路线。
            </Text>
          )}
        </>
      )}
    </View>
  );
}
