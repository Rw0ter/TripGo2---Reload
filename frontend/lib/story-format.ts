// 社区动态展示用的小工具：作者字母头像配色 + 相对时间。

// 作者字母头像配色池（取岭南大地色）。
const AVATAR_COLORS = ['#3E6B4F', '#C2622A', '#B98A1E', '#2E7B74', '#BC5447', '#3F6C9C'];

// 用户名稳定映射到一个配色。
export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[h];
}

// 相对时间，如「3 小时前」。
export function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return `${Math.floor(d / 30)} 个月前`;
}
