import { router } from 'expo-router';

import { useAuthStore } from '@/stores/auth';

// 后端 API 基址走环境变量（见 .env.example），不硬编码 IP。
// 导出供 SSE 流式客户端（lib/ai.ts）复用，保持单一来源。
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TIMEOUT_MS = 10000;

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

// 统一请求：解包后端 {code,message,data}；auth:true 时带 JWT；含超时；
// 网络错误 / 非 JSON 响应 / 业务错误统一转成中文 Error 抛出。
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    // fetch 抛错：网络不通、超时（abort）等
    throw new Error('网络连接失败，请检查网络后重试');
  } finally {
    clearTimeout(timer);
  }

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // 非 JSON 响应：后端崩溃、网关错误等
    throw new Error(`服务异常（HTTP ${res.status}）`);
  }

  if (json.code !== 0) {
    // 带 token 的请求被判 401 —— 登录态已失效（过期 / 被服务端判废）。
    // 清掉本地登录态并回登录页，避免「僵尸会话」。仅在仍有 token 时处理一次，
    // 防止并发失败请求重复跳转。
    if (auth && json.code === 401) {
      const { token: stale, clearAuth } = useAuthStore.getState();
      if (stale) {
        clearAuth();
        router.replace('/login');
      }
    }
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}
