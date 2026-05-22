// 罗盘朝向订阅 —— web 实现：浏览器 DeviceOrientation 事件。
// 桌面浏览器无磁力计时不会有事件，订阅是安全的空操作。原生实现见 compass.ts。

// onHeading 参数为 0–360 的指南针方位角（0 = 正北）。返回取消订阅函数。
export function subscribeHeading(onHeading: (deg: number) => void): () => void {
  const handler = (e: DeviceOrientationEvent) => {
    const compass = (
      e as DeviceOrientationEvent & { webkitCompassHeading?: number }
    ).webkitCompassHeading;
    let deg: number | null = null;
    if (typeof compass === 'number') {
      deg = compass; // iOS：已是指南针方位角
    } else if (typeof e.alpha === 'number') {
      deg = (360 - e.alpha) % 360; // 其余浏览器：由 alpha 推算
    }
    if (deg != null && !Number.isNaN(deg)) onHeading(deg);
  };

  const DOE = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      })
    | undefined;

  // 授权是异步的，取消订阅可能早于其 resolve —— 用标志位防止监听器泄漏。
  let cancelled = false;

  if (DOE && typeof DOE.requestPermission === 'function') {
    // iOS 13+：需在用户手势内授权（「开始导航」按钮即手势）。
    DOE.requestPermission()
      .then((state) => {
        if (!cancelled && state === 'granted') {
          window.addEventListener('deviceorientation', handler);
        }
      })
      .catch(() => {});
  } else {
    window.addEventListener('deviceorientationabsolute', handler);
    window.addEventListener('deviceorientation', handler);
  }

  return () => {
    cancelled = true;
    window.removeEventListener('deviceorientation', handler);
    window.removeEventListener('deviceorientationabsolute', handler);
  };
}
