// 腾讯地图跨端组件 —— 原生实现：用 react-native-webview 承载 GL JS 文档，
// 通过 injectJavaScript / onMessage 双向通信。web 实现见 tencent-map.web.tsx。

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildMapHtml } from './tencent-map-html';
import type {
  MapCommand,
  MapEvent,
  TencentMapHandle,
  TencentMapProps,
} from './tencent-map-types';

export const TencentMap = forwardRef<TencentMapHandle, TencentMapProps>(
  function TencentMap({ onEvent }, ref) {
    const webRef = useRef<WebView>(null);
    const loadedRef = useRef(false);
    const pendingRef = useRef<MapCommand[]>([]);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const inject = (cmd: MapCommand) => {
      // 双重 JSON.stringify：内层得到 JSON 文本，外层把它变成 JS 字符串字面量。
      const arg = JSON.stringify(JSON.stringify(cmd));
      webRef.current?.injectJavaScript(`window.__tmapCmd(${arg});true;`);
    };

    useImperativeHandle(
      ref,
      () => ({
        send: (cmd: MapCommand) => {
          if (loadedRef.current) inject(cmd);
          else pendingRef.current.push(cmd);
        },
      }),
      [],
    );

    const handleMessage = (e: WebViewMessageEvent) => {
      let parsed: MapEvent | null = null;
      try {
        parsed = JSON.parse(e.nativeEvent.data) as MapEvent;
      } catch {
        return;
      }
      if (parsed && typeof parsed.type === 'string') onEventRef.current(parsed);
    };

    const handleLoadEnd = () => {
      loadedRef.current = true;
      const queued = pendingRef.current;
      pendingRef.current = [];
      queued.forEach(inject);
    };

    return (
      <View style={StyleSheet.absoluteFill}>
        <WebView
          ref={webRef}
          source={{ html: buildMapHtml() }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          onMessage={handleMessage}
          onLoadEnd={handleLoadEnd}
          onError={() =>
            onEventRef.current({ type: 'fatal', message: '地图页面加载失败' })
          }
          style={styles.web}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: 'transparent' },
});
