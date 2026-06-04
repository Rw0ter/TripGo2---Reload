// VR 全景查看器 —— 原生实现：用 react-native-webview 承载 Three.js 全景文档，
// 通过 injectJavaScript / onMessage 双向通信。web 实现见 vr-viewer.web.tsx。

import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  buildPanoramaHtml,
  COMMAND_TAG,
  EVENT_TAG,
  type PanoramaParams,
} from './panorama-html';

interface Props {
  params: PanoramaParams;
  onBack: () => void;
  onReady?: () => void;
}

export function VRViewer({ params, onBack, onReady }: Props) {
  const webRef = useRef<WebView>(null);

  const html = buildPanoramaHtml(params);

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (!d || d._src !== EVENT_TAG) return;
      if (d.type === 'back') onBack();
      if (d.type === 'ready') onReady?.();
    } catch { /* ignore */ }
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        ref={webRef}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#000' },
});
