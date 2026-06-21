// 绿色低碳地图 —— 在旅行地图基础上重定位为环保地图。
// 在线：腾讯地图 GL SDK（定位 / 搜索 / 路线规划走 service 库，无后端代理），
//       顶部提供绿色品类快捷搜索（回收点 / 充电站 / 公园 / 地铁 / 共享单车），鼓励绿色出行。
// 离线：检测到地图不可用时自动切换到内置的离线地图（见 components/map/offline-map）。

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineMap } from '@/components/map/offline-map';
import { TencentMap } from '@/components/map/tencent-map';
import {
  type MapEvent,
  type MapPoi,
  ROUTE_MODE_LABEL,
  type RouteInfo,
  type RouteMode,
  type TencentMapHandle,
} from '@/components/map/tencent-map-types';
import { subscribeHeading } from '@/lib/compass';
import { formatDistance, formatDuration } from '@/lib/geo';

const ROUTE_MODES: {
  key: RouteMode;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'driving', icon: 'car-outline' },
  { key: 'walking', icon: 'walk-outline' },
  { key: 'bicycling', icon: 'bicycle-outline' },
];

type Destination = { lat: number; lng: number; title: string };

// 绿色出行 / 环保设施 快捷品类（点击即在地图上搜索对应 POI）。
const GREEN_CATEGORIES: { label: string; kw: string }[] = [
  { label: '回收点', kw: '垃圾分类回收点' },
  { label: '充电站', kw: '新能源汽车充电站' },
  { label: '公园绿地', kw: '公园' },
  { label: '地铁站', kw: '地铁站' },
  { label: '共享单车', kw: '共享单车' },
];

export default function TravelMapScreen() {
  const insets = useSafeAreaInsets();
  const headerH = insets.top + 52;

  const isWebOffline =
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    navigator.onLine === false;

  const [mapMode, setMapMode] = useState<'online' | 'offline'>(
    isWebOffline ? 'offline' : 'online',
  );
  const [attempt, setAttempt] = useState(0); // 重连时递增 → 重挂 TencentMap
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<MapPoi[] | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>('driving');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [planning, setPlanning] = useState(false);
  const [navving, setNavving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const mapRef = useRef<TencentMapHandle>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  // 在线地图加载兜底：15s 内未就绪（含内嵌文档根本没加载完的情况）
  // 自动切到离线地图，避免一直卡在「地图加载中…」。
  useEffect(() => {
    if (mapMode !== 'online' || status !== 'loading') return;
    const timer = setTimeout(() => {
      setMapMode('offline');
      showNotice('在线地图加载超时，已切换到离线地图');
    }, 15000);
    return () => clearTimeout(timer);
  }, [mapMode, status, attempt, showNotice]);

  // 导航中：地图随设备罗盘方向实时旋转。
  // 「开始导航」是用户手势，满足 iOS DeviceOrientation 的授权要求。
  useEffect(() => {
    if (!navving) return;
    let lastSent = -999;
    const unsubscribe = subscribeHeading((deg) => {
      // 节流：方位变化超过 2° 才下发（按圆周计算，跨 0/360 不误判）。
      const diff = Math.abs(deg - lastSent) % 360;
      if (Math.min(diff, 360 - diff) < 2) return;
      lastSent = deg;
      // 用实时 mapRef，避免重连换实例后指向旧地图。
      mapRef.current?.send({ type: 'rotateMap', deg });
    });
    // 停止导航时地图复位由内嵌文档的 doStopNav 负责，这里只需退订。
    return unsubscribe;
  }, [navving]);

  const handleEvent = useCallback(
    (e: MapEvent) => {
      switch (e.type) {
        case 'ready':
          setStatus('ready');
          break;
        case 'fatal':
          setMapMode('offline');
          setNavving(false);
          showNotice('在线地图不可用，已切换到离线地图');
          break;
        case 'located':
          if (e.source === 'ip') showNotice('已按 IP 大致定位到所在城市');
          else if (e.source === 'default')
            showNotice('定位不可用，已显示默认位置（广州）');
          break;
        case 'searchResults':
          setResults(e.list);
          if (e.list.length === 0) showNotice('未找到相关地点');
          break;
        case 'searchError':
          showNotice(e.message || '搜索失败');
          break;
        case 'routeResult':
          setPlanning(false);
          setRoute(e.route);
          break;
        case 'routeError':
          setPlanning(false);
          showNotice(e.message || '路线规划失败');
          break;
        case 'navEnd':
          setNavving(false);
          showNotice('导航结束');
          break;
        default:
          break;
      }
    },
    [showNotice],
  );

  const send = (cmd: Parameters<TencentMapHandle['send']>[0]) =>
    mapRef.current?.send(cmd);

  const onSearch = () => {
    const kw = keyword.trim();
    if (!kw) return;
    setResults(null);
    send({ type: 'search', keyword: kw });
  };

  const onCategory = (kw: string) => {
    setKeyword(kw);
    setResults(null);
    send({ type: 'search', keyword: kw });
  };

  const onPickResult = (poi: MapPoi) => {
    setDestination({ lat: poi.lat, lng: poi.lng, title: poi.title });
    setKeyword(poi.title);
    setResults(null);
    setRoute(null);
    setNavving(false);
    send({ type: 'selectPoi', lat: poi.lat, lng: poi.lng, title: poi.title });
  };

  const onPlan = (mode: RouteMode) => {
    if (!destination) return;
    setRouteMode(mode);
    setPlanning(true);
    setNavving(false);
    send({
      type: 'planRoute',
      mode,
      toLat: destination.lat,
      toLng: destination.lng,
    });
  };

  const onClearRoute = () => {
    setRoute(null);
    setDestination(null);
    setKeyword('');
    setResults(null);
    setNavving(false);
    send({ type: 'clearRoute' });
  };

  const onToggleNav = () => {
    if (navving) {
      setNavving(false);
      send({ type: 'stopNav' });
    } else {
      setNavving(true);
      send({ type: 'startNav' });
    }
  };

  const goOnline = () => {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.onLine === false
    ) {
      showNotice('当前无网络连接，暂无法使用在线地图');
      return;
    }
    setMapMode('online');
    setStatus('loading');
    setAttempt((a) => a + 1);
    setRoute(null);
    setDestination(null);
    setResults(null);
    setKeyword('');
    setNavving(false);
  };

  return (
    <View className="flex-1 bg-[#E7ECE8]">
      {/* 地图层 */}
      {mapMode === 'online' ? (
        <TencentMap key={attempt} ref={mapRef} onEvent={handleEvent} />
      ) : (
        <View className="flex-1" style={{ paddingTop: headerH }}>
          <OfflineMap />
        </View>
      )}

      {/* 顶部栏 */}
      <View
        style={{ paddingTop: insets.top, height: headerH }}
        className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="返回"
          hitSlop={8}
          style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.16)' }}
          className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <Ionicons name="arrow-back" size={20} color="#386641" />
        </Pressable>
        <View
          style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.12)' }}
          className="rounded-full bg-white px-4 py-1.5">
          <Text className="text-[15px] font-bold text-[#33403A]">绿色地图</Text>
        </View>
        <Pressable
          onPress={() => (mapMode === 'online' ? setMapMode('offline') : goOnline())}
          accessibilityRole="button"
          style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.16)' }}
          className="h-9 flex-row items-center rounded-full bg-white px-2.5">
          <Ionicons
            name={mapMode === 'online' ? 'cloud-offline-outline' : 'globe-outline'}
            size={15}
            color="#386641"
          />
          <Text className="ml-1 text-[11px] font-semibold text-[#386641]">
            {mapMode === 'online' ? '离线' : '在线'}
          </Text>
        </Pressable>
      </View>

      {/* 在线模式的交互层 */}
      {mapMode === 'online' && (
        <>
          {/* 搜索栏 */}
          <View
            style={{ top: headerH + 6 }}
            className="absolute left-3 right-3">
            <View
              style={{ boxShadow: '0px 3px 12px rgba(0,0,0,0.14)' }}
              className="h-11 flex-row items-center rounded-2xl bg-white px-3">
              <Ionicons name="search" size={17} color="#9AA09A" />
              <TextInput
                value={keyword}
                onChangeText={setKeyword}
                onSubmitEditing={onSearch}
                returnKeyType="search"
                placeholder="搜索回收点 / 环保设施 / 地址"
                placeholderTextColor="#B3B7B0"
                className="ml-2 flex-1 text-[14px] text-[#33403A]"
              />
              {keyword.length > 0 && (
                <Pressable
                  onPress={() => {
                    setKeyword('');
                    setResults(null);
                  }}
                  hitSlop={8}
                  accessibilityLabel="清空">
                  <Ionicons name="close-circle" size={17} color="#C8CCC4" />
                </Pressable>
              )}
              <Pressable
                onPress={onSearch}
                accessibilityRole="button"
                className="ml-2 rounded-xl bg-primary px-3 py-1.5">
                <Text className="text-[12px] font-bold text-white">搜索</Text>
              </Pressable>
            </View>

            {/* 绿色品类快捷搜索 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-2"
              keyboardShouldPersistTaps="handled">
              {GREEN_CATEGORIES.map((c) => (
                <Pressable
                  key={c.kw}
                  onPress={() => onCategory(c.kw)}
                  accessibilityRole="button"
                  style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }}
                  className="mr-2 flex-row items-center rounded-full bg-white px-3 py-1.5">
                  <Ionicons name="leaf" size={12} color="#40916C" />
                  <Text className="ml-1 text-[12px] font-medium text-[#33403A]">{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* 搜索结果 */}
            {results && results.length > 0 && (
              <View
                style={{ boxShadow: '0px 6px 18px rgba(0,0,0,0.16)' }}
                className="mt-1.5 overflow-hidden rounded-2xl bg-white">
                <ScrollView style={{ maxHeight: 232 }} keyboardShouldPersistTaps="handled">
                  {results.map((poi, i) => (
                    <Pressable
                      key={poi.id || `${poi.lat},${poi.lng}-${i}`}
                      onPress={() => onPickResult(poi)}
                      accessibilityRole="button"
                      className={`flex-row items-center px-3.5 py-2.5 ${
                        i > 0 ? 'border-t border-[#F0F0EA]' : ''
                      }`}>
                      <Ionicons name="location" size={16} color="#386641" />
                      <View className="ml-2.5 flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-[13px] font-semibold text-[#33403A]">
                          {poi.title}
                        </Text>
                        {!!poi.address && (
                          <Text
                            numberOfLines={1}
                            className="mt-0.5 text-[11px] text-[#9AA09A]">
                            {poi.address}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 加载浮层 */}
          {status === 'loading' && (
            <View className="absolute inset-0 items-center justify-center">
              <View
                style={{ boxShadow: '0px 4px 16px rgba(0,0,0,0.12)' }}
                className="flex-row items-center rounded-2xl bg-white px-5 py-3.5">
                <ActivityIndicator color="#386641" />
                <Text className="ml-2.5 text-[13px] text-[#5A5F58]">
                  地图加载中…
                </Text>
              </View>
            </View>
          )}

          {/* 提示条 */}
          {notice && (
            <View
              style={{ top: headerH + 60, pointerEvents: 'none' }}
              className="absolute left-0 right-0 items-center">
              <View className="rounded-full bg-black/78 px-4 py-2">
                <Text className="text-[12px] text-white">{notice}</Text>
              </View>
            </View>
          )}

          {/* 底部操作区 */}
          <View
            style={{ bottom: insets.bottom + 12 }}
            className="absolute left-0 right-0">
            {/* 定位按钮 */}
            <View className="mb-2.5 items-end px-4">
              <Pressable
                onPress={() => send({ type: 'locate' })}
                accessibilityRole="button"
                accessibilityLabel="定位到我的位置"
                style={{ boxShadow: '0px 3px 12px rgba(0,0,0,0.2)' }}
                className="h-12 w-12 items-center justify-center rounded-full bg-white">
                <Ionicons name="locate" size={22} color="#386641" />
              </Pressable>
            </View>

            {/* 路线信息面板 */}
            {route ? (
              <View
                style={{ boxShadow: '0px -4px 16px rgba(0,0,0,0.1)' }}
                className="mx-3 rounded-2xl bg-white p-3.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="rounded-full bg-[#EEF4EC] px-2 py-0.5">
                      <Text className="text-[11px] font-medium text-primary">
                        {ROUTE_MODE_LABEL[route.mode]}
                      </Text>
                    </View>
                    <Text className="ml-2 text-[15px] font-bold text-[#1E7A52]">
                      {formatDistance(route.distance)}
                    </Text>
                    <Text className="ml-2 text-[13px] text-[#6E746F]">
                      约 {formatDuration(route.duration)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onClearRoute}
                    accessibilityRole="button"
                    hitSlop={6}>
                    <Ionicons name="close" size={18} color="#9AA09A" />
                  </Pressable>
                </View>

                {route.steps.length > 0 && (
                  <ScrollView
                    style={{ maxHeight: 132 }}
                    className="mt-2"
                    showsVerticalScrollIndicator={false}>
                    {route.steps.map((s, i) => (
                      <View
                        key={i}
                        className="flex-row border-b border-[#F2F2EC] py-1.5">
                        <Text className="text-[12px] font-bold text-primary">
                          {i + 1}
                        </Text>
                        <Text className="ml-2 flex-1 text-[12px] leading-5 text-[#5A5F58]">
                          {s.instruction}
                        </Text>
                        {s.distance > 0 && (
                          <Text className="ml-2 text-[11px] text-[#9AA09A]">
                            {formatDistance(s.distance)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}

                <Pressable
                  onPress={onToggleNav}
                  accessibilityRole="button"
                  className={`mt-3 h-11 flex-row items-center justify-center rounded-xl ${
                    navving ? 'bg-[#B5503C]' : 'bg-primary'
                  }`}>
                  <Ionicons
                    name={navving ? 'stop-circle-outline' : 'navigate-circle-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text className="ml-1.5 text-[13px] font-bold text-white">
                    {navving ? '结束导航' : '开始导航'}
                  </Text>
                </Pressable>
                <View className="mt-2 flex-row items-center justify-center">
                  <Ionicons name="compass-outline" size={12} color="#9AA09A" />
                  <Text className="ml-1 text-[11px] text-[#9AA09A]">
                    {navving
                      ? '地图正随设备罗盘方向实时转向'
                      : '导航中地图将随设备罗盘方向转向'}
                  </Text>
                </View>
              </View>
            ) : destination ? (
              <View
                style={{ boxShadow: '0px -4px 16px rgba(0,0,0,0.1)' }}
                className="mx-3 rounded-2xl bg-white p-3.5">
                <View className="flex-row items-center">
                  <Ionicons name="flag" size={15} color="#E8552D" />
                  <Text
                    numberOfLines={1}
                    className="ml-1.5 flex-1 text-[13px] font-semibold text-[#33403A]">
                    前往 {destination.title}
                  </Text>
                  <Pressable onPress={onClearRoute} hitSlop={6} accessibilityLabel="取消">
                    <Ionicons name="close" size={17} color="#9AA09A" />
                  </Pressable>
                </View>
                <View className="mt-2.5 flex-row">
                  {ROUTE_MODES.map((m) => {
                    const active = m.key === routeMode;
                    return (
                      <Pressable
                        key={m.key}
                        onPress={() => onPlan(m.key)}
                        disabled={planning}
                        accessibilityRole="button"
                        className={`mr-2 flex-1 flex-row items-center justify-center rounded-xl border py-2 ${
                          active
                            ? 'border-primary bg-primary'
                            : 'border-[#E3E2D4] bg-white'
                        }`}>
                        <Ionicons
                          name={m.icon}
                          size={15}
                          color={active ? '#FFFFFF' : '#6E746F'}
                        />
                        <Text
                          className={`ml-1 text-[12px] ${
                            active ? 'font-bold text-white' : 'text-[#6E746F]'
                          }`}>
                          {ROUTE_MODE_LABEL[m.key]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text className="mt-2 text-[11px] text-[#9AA09A]">
                  {planning ? '正在规划路线…' : '选择出行方式即可规划路线'}
                </Text>
              </View>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}
