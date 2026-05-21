import { Redirect } from 'expo-router';

// App 入口：始终先进隐私协议引导页（启动流程 hello -> login -> 首页）。
export default function Index() {
  return <Redirect href="/hello" />;
}
