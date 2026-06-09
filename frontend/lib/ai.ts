import { BASE_URL } from './api';
import { useAuthStore } from '@/stores/auth';

// AI 流式客户端：对接后端 ai 模块的 SSE 接口（DeepSeek 代理）。
// 为什么用 XMLHttpRequest 而非 fetch：React Native 的 fetch 不支持读取流式
// response body（无 getReader），而 XHR 的 onprogress + 增量 responseText 在
// web 与 RN 上都可用，是跨端读取 SSE 的稳妥方案。无新增依赖。

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PlanRequest {
  from: string;
  to: string;
  budget: number;
  days: number;
  tags?: string[];
  notes?: string;
}

export interface StreamHandlers {
  onToken: (delta: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

const STREAM_TIMEOUT_MS = 60000; // AI 流式较慢，给足时间

// 发起一个 SSE POST 流，返回取消函数。
function streamSSE(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
  auth = false,
): () => void {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${BASE_URL}${path}`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  if (auth) {
    const token = useAuthStore.getState().token;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  }
  xhr.timeout = STREAM_TIMEOUT_MS;

  let seen = 0; // 已消费的 responseText 长度
  let carry = ''; // 跨 chunk 的残留缓冲
  let finished = false;

  const finish = (fn: () => void) => {
    if (finished) return;
    finished = true;
    fn();
  };

  // 解析后端 SSE：data: {"delta":"..."} / data: {"error":"..."} / data: [DONE]
  const consume = () => {
    const text = xhr.responseText;
    if (text.length <= seen) return;
    carry += text.slice(seen);
    seen = text.length;
    const events = carry.split('\n\n');
    carry = events.pop() ?? '';
    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') {
        finish(handlers.onDone);
        return;
      }
      try {
        const obj = JSON.parse(payload);
        if (typeof obj.delta === 'string') handlers.onToken(obj.delta);
        else if (typeof obj.error === 'string')
          finish(() => handlers.onError(obj.error));
      } catch {
        // 半条 JSON（被分块截断）：等待下次拼接
      }
    }
  };

  xhr.onprogress = () => {
    // status 未就绪（0）或错误响应（JSON 信封）：不按 SSE 解析，留给 onload 处理
    if (xhr.status === 0 || xhr.status >= 400) return;
    consume();
  };

  xhr.onload = () => {
    if (xhr.status >= 400) {
      let msg = `AI 服务异常（${xhr.status}）`;
      try {
        const j = JSON.parse(xhr.responseText);
        if (j?.message) msg = j.message;
      } catch {
        // 非 JSON：保留默认提示
      }
      finish(() => handlers.onError(msg));
      return;
    }
    consume();
    finish(handlers.onDone);
  };

  xhr.onerror = () =>
    finish(() => handlers.onError('网络连接失败，请检查网络后重试'));
  xhr.ontimeout = () => finish(() => handlers.onError('AI 响应超时，请重试'));

  xhr.send(JSON.stringify(body));

  return () => {
    if (!finished) {
      finished = true;
      xhr.abort();
    }
  };
}

// AI 对话：传完整对话历史（含本轮用户消息）。
export function streamChat(
  messages: ChatMessage[],
  handlers: StreamHandlers,
): () => void {
  return streamSSE('/ai/chat', { messages }, handlers);
}

// AI 行程规划。
export function streamPlan(
  req: PlanRequest,
  handlers: StreamHandlers,
): () => void {
  return streamSSE('/ai/plan', req, handlers);
}
