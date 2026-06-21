// 颜色单一来源（JS 侧用：导航 tint、图标 color、渐变）。
// NativeWind className 用 tailwind.config.js 里的颜色名。

// 绿色低碳主色（原 #386641 保留作为品牌基因）
export const PRIMARY = '#386641';

// 新增环保绿色调色板
export const ECO_GREEN_DARK = '#1B4332';
export const ECO_GREEN_MID = '#2D6A4F';
export const ECO_GREEN = '#40916C';
export const ECO_GREEN_LIGHT = '#52B788';
export const ECO_ACCENT = '#95D5B2';
export const ECO_PALE = '#D8F3DC';
export const ECO_CREAM = '#F7FAF5';
export const ECO_EARTH = '#DDA15E';

// 登录 / 注册 渐变按钮
export const AUTH_BUTTON_GRADIENT = ['#52E8E3', '#40CEA7'] as const;

// hello「同意」按钮渐变
export const HELLO_AGREE_GRADIENT = ['#5CC8A5', '#92F2D1'] as const;

// login1 启动动画的流动绿渐变与底色
export const SPLASH_GRADIENT = [
  '#003d2b',
  '#017a54',
  '#003d2b',
  '#017a54',
  '#003d2b',
] as const;
export const SPLASH_BG = '#003d2b';
