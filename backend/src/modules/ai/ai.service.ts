import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { RagService } from '../rag/rag.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PlanInput {
  from: string;
  to: string;
  budget: number;
  days: number;
  tags?: string[];
  notes?: string;
}

// ── Prompts（提示词收口在后端，前端不持有）──────────────────
export const CHAT_SYSTEM_PROMPT =
  '你是「文脉粤游」App 的智能旅行助手，专注广东 / 岭南文化旅游：非遗（粤剧、醒狮、广绣、工夫茶等）、' +
  '美食（广府菜、潮汕菜、顺德菜、客家菜）、景点与行程规划。回答务必准确、简洁、实用，' +
  '使用 Markdown 排版（标题、列表、加粗）。默认回答与广东旅游和文化相关的问题，';

// 注意：开头沿用 CHAT_SYSTEM_PROMPT 同款「智能旅行助手」框架——实测该框架下模型会忠实
// follow 用户消息里的目的地；而换成「岭南行程规划师 + ①②③④ 固定模板」的重措辞会触发
// 模型的「广州样板行程」先验，时而把目的地（如潮州）改写成广州甚至无关城市。结构要求放轻、
// 让目的地主语（在用户消息里）主导。
export const PLAN_SYSTEM_PROMPT =
  '你是「文脉粤游」App 的智能旅行助手，专注广东 / 岭南文化旅游。请严格按用户消息中明确指定的目的地与出发地生成行程：' +
  '目的地是唯一安排游览（景点、美食、住宿）的城市，出发地只用于第一天的来程交通与最后一天的返程交通，除交通外不要在出发地安排游览。' +
  '用 Markdown 输出：先写一行用 > 引用的概览；再按「### 第 N 天」分天（每天含上午 / 午餐 / 下午 / 晚上，首日含来程、末日含返程）；' +
  '然后给「### 💰 预算明细」表格；最后给「### 📝 行前贴士」列表。景点与美食贴合目的地真实情况，只输出 Markdown 行程、不要寒暄。';

// 把规划表单拼成发给模型的用户消息。导出为纯函数便于单测。
export function buildPlanPrompt(dto: PlanInput): string {
  const tags = dto.tags && dto.tags.length > 0 ? dto.tags.join('、') : '综合体验';
  // 把目的地作为请求主语（模仿用户自然提问），出发地仅作来回交通——
  // 否则模型会锚定「出发地」当成游览城市（实测 from=广州 时整份行程被写成广州）。
  return [
    `请为我规划一份【${dto.to}】的 ${dto.days} 天旅行行程。`,
    `这是一趟「${dto.to}」之旅：全部景点、餐饮、住宿、活动都必须安排在 ${dto.to}，不要写成其它城市的行程。`,
    `我从 ${dto.from} 出发——请在第 1 天安排「从 ${dto.from} 到 ${dto.to}」的来程交通、最后一天安排返回 ${dto.from} 的返程交通；除交通外不要在 ${dto.from} 安排游览。`,
    `人均预算：¥${dto.budget}；旅行偏好：${tags}；补充说明：${dto.notes?.trim() || '无'}。`,
  ].join('\n');
}

// 把 RAG 检索到的知识拼进 system prompt；无知识则原样返回。导出便于单测。
export function buildSystemWithContext(base: string, context: string[]): string {
  if (!context || context.length === 0) return base;
  const refs = context.map((c, i) => `[${i + 1}] ${c}`).join('\n');
  return (
    `${base}\n\n以下是与用户问题相关的「文脉粤游」知识库参考资料，` +
    `回答时优先采用其中信息，但请用自己的话组织、不要照搬：\n${refs}`
  );
}

// 从 DeepSeek（OpenAI 兼容）流式响应的一段原始 SSE 文本里提取增量 token。
// 每个事件形如：data: {"choices":[{"delta":{"content":"x"}}]}；以 data: [DONE] 结束。
// 导出为纯函数便于单测；不完整 / 非 JSON 的行会被安全跳过。
export function extractDeltas(raw: string): string[] {
  const out: string[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const json = JSON.parse(payload);
      const delta = json?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) out.push(delta);
    } catch {
      // 被分块截断的半条 JSON：跳过，等下一块拼接后再解析
    }
  }
  return out;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly rag: RagService,
  ) {}

  // AI 对话：检索相关知识 → 注入岭南旅游系统提示 → 转发给 DeepSeek，SSE 写回。
  async chat(userMessages: ChatMessage[], res: Response): Promise<void> {
    const lastUser = [...userMessages].reverse().find((m) => m.role === 'user');
    const context = lastUser ? await this.rag.search(lastUser.content, 4) : [];
    const messages: ChatMessage[] = [
      { role: 'system', content: buildSystemWithContext(CHAT_SYSTEM_PROMPT, context) },
      // 过滤掉客户端可能注入的 system 消息，防提示词注入
      ...userMessages.filter((m) => m.role !== 'system'),
    ];
    await this.streamChat(messages, res);
  }

  // AI 行程规划：只依据用户表单（出发地 / 目的地 / 天数 / 预算 / 偏好），不注入 RAG 知识。
  // 原因（实测 bug）：知识库以广州 / 深圳为主，按目的地向量检索常召回他城条目，且系统提示
  // 要求「优先采用检索资料」，导致模型围绕召回的广深内容生成行程、无视用户真正的目的地
  // （如「北京→潮州」被规划成「深圳→广州」）。规划要忠于用户输入，故此处不走 RAG。
  async plan(input: PlanInput, res: Response): Promise<void> {
    const messages: ChatMessage[] = [
      { role: 'system', content: PLAN_SYSTEM_PROMPT },
      { role: 'user', content: buildPlanPrompt(input) },
    ];
    await this.streamChat(messages, res);
  }

  // 把一段对话转发给 DeepSeek 的流式补全接口，并把增量 token 以 SSE 写回 res。
  // 约定（CLAUDE.md §8）：直接操作 response 流，不经过 TransformInterceptor。
  private async streamChat(messages: ChatMessage[], res: Response): Promise<void> {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      // 还未写任何响应头 —— 交给全局异常过滤器返回标准 JSON 503。
      throw new ServiceUnavailableException(
        'AI 服务未配置：后端缺少 DEEPSEEK_API_KEY',
      );
    }
    const baseUrl =
      this.config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';
    const model = this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';

    // 开启 SSE 响应
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 关掉反向代理缓冲
    res.flushHeaders();

    let upstream: Awaited<ReturnType<typeof fetch>>;
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream: true }),
      });
    } catch (err) {
      this.logger.error(`DeepSeek 请求失败: ${String(err)}`);
      this.writeError(res, 'AI 服务暂时不可用，请稍后再试');
      return;
    }

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      this.logger.error(
        `DeepSeek 响应异常 ${upstream.status}: ${detail.slice(0, 300)}`,
      );
      this.writeError(res, `AI 服务返回错误（${upstream.status}）`);
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE 事件以空行分隔；保留最后一段不完整事件等待下次拼接
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          for (const delta of extractDeltas(event)) {
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        }
      }
      // 收尾：flush 残留缓冲
      for (const delta of extractDeltas(buffer)) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      this.logger.error(`DeepSeek 流读取失败: ${String(err)}`);
      this.writeError(res, 'AI 输出中断，请重试');
    }
  }

  // 在已开启的 SSE 流里写一条错误事件并结束。
  private writeError(res: Response, message: string): void {
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
