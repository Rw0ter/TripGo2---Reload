// 颜色单一来源（JS 侧用：导航 tint、图标 color、渐变）。
// NativeWind className 用 tailwind.config.js 里的颜色名。
export const PRIMARY = '#386641';

// 登录 / 注册 渐变按钮（对应 Legacy .login-btn）
export const AUTH_BUTTON_GRADIENT = ['#52E8E3', '#40CEA7'] as const;

// hello「同意」按钮渐变（对应 Legacy hello #ty）
export const HELLO_AGREE_GRADIENT = ['#5CC8A5', '#92F2D1'] as const;

// login1 启动动画的流动绿渐变与底色（对应 Legacy login1.html bgFlow）
export const SPLASH_GRADIENT = [
  '#003d2b',
  '#017a54',
  '#003d2b',
  '#017a54',
  '#003d2b',
] as const;
export const SPLASH_BG = '#003d2b';
