// VR 全景查看器 —— web 实现：用 <iframe srcDoc> 承载 Three.js 全景文档，
// 通过 window.postMessage 双向通信。原生实现见 vr-viewer.tsx。

import { useEffect, useRef } from 'react';

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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const html = buildPanoramaHtml(params);

  // Listen for postMessage events from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      let d: any;
      try { d = JSON.parse(e.data); } catch { return; }
      if (!d || d._src !== EVENT_TAG) return;
      if (d.type === 'back') onBack();
      if (d.type === 'ready') onReady?.();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onBack, onReady]);

  return (
    <iframe
      ref={iframeRef}
      title="VR 全景漫游"
      srcDoc={html}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: '#000',
      }}
    />
  );
}
