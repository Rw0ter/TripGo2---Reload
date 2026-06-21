// 腾讯地图跨端组件 —— web 实现：用 <iframe srcDoc> 承载 GL JS 文档，
// 通过 window.postMessage 双向通信。原生实现见 tencent-map.tsx。

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { buildMapHtml, COMMAND_TAG, EVENT_TAG } from './tencent-map-html';
import type {
  MapCommand,
  MapEvent,
  TencentMapHandle,
  TencentMapProps,
} from './tencent-map-types';

export const TencentMap = forwardRef<TencentMapHandle, TencentMapProps>(
  function TencentMap({ onEvent }, ref) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const loadedRef = useRef(false);
    const pendingRef = useRef<MapCommand[]>([]);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const post = (cmd: MapCommand) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(JSON.stringify({ ...cmd, __src: COMMAND_TAG }), '*');
    };

    useImperativeHandle(
      ref,
      () => ({
        send: (cmd: MapCommand) => {
          const enqueue = (c: MapCommand) => {
            if (loadedRef.current) post(c);
            else pendingRef.current.push(c);
          };
          // 定位特殊处理：srcDoc iframe 是不透明源，浏览器会拒绝其内部的 geolocation。
          // 改在父窗口（真实 localhost 源、安全上下文）取 GPS，再把坐标喂进 iframe；
          // 失败则退回 iframe 内的 IP 兜底（原 locate）。
          if (
            cmd.type === 'locate' &&
            typeof navigator !== 'undefined' &&
            navigator.geolocation
          ) {
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                enqueue({
                  type: 'locateAt',
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  source: 'gps',
                }),
              () => enqueue({ type: 'locate' }),
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
            );
            return;
          }
          enqueue(cmd);
        },
      }),
      [],
    );

    useEffect(() => {
      const handler = (e: MessageEvent) => {
        if (typeof e.data !== 'string') return;
        let parsed: (MapEvent & { __src?: string }) | null = null;
        try {
          parsed = JSON.parse(e.data) as MapEvent & { __src?: string };
        } catch {
          return;
        }
        if (!parsed || parsed.__src !== EVENT_TAG) return;
        onEventRef.current(parsed);
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, []);

    const handleLoad = () => {
      loadedRef.current = true;
      const queued = pendingRef.current;
      pendingRef.current = [];
      queued.forEach(post);
    };

    return (
      <iframe
        ref={iframeRef}
        title="旅行地图"
        srcDoc={buildMapHtml()}
        allow="geolocation"
        onLoad={handleLoad}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    );
  },
);
