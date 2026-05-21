import { Redirect } from 'expo-router';

// 「添加」是动作入口（点击弹出创建菜单，见 (tabs)/_layout.tsx），不是真实页面。
// 本文件仅为占住底部 tab 槽位；若被深链接直达则重定向回首页。
export default function AddRoute() {
  return <Redirect href="/home" />;
}
