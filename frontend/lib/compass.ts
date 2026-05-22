// 罗盘朝向订阅 —— 原生实现：expo-sensors 磁力计。web 实现见 compass.web.ts。
import { Magnetometer } from 'expo-sensors';

// onHeading 参数为 0–360 的指南针方位角（0 = 正北）。返回取消订阅函数。
export function subscribeHeading(onHeading: (deg: number) => void): () => void {
  Magnetometer.setUpdateInterval(200);
  const sub = Magnetometer.addListener(({ x, y }) => {
    // 由磁场分量推算水平方位角。
    let deg = Math.atan2(y, x) * (180 / Math.PI);
    deg = (deg + 360) % 360;
    onHeading(deg);
  });
  return () => sub.remove();
}
