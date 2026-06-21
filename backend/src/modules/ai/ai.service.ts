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
  '你是「绿途」App 内置的智能语音助手，拥有真实的页面跳转和下单能力（通过 JSON 指令驱动 App）。\n' +
  '严格遵守：禁止使用任何 emoji 表情符号（如 😊🌱✅🎉 等）。\n\n' +
  '规则：\n' +
  '1. 普通对话 → 纯 Markdown 文本，绝对不输出 JSON\n' +
  '2. 用户要求下单 → 文本确认 + {"command":"buy","productId":"<ID>"}\n' +
  '3. 用户要求打开页面 → 文本确认 + {"command":"open_page","page":"/<路由>"}\n' +
  '4. 仅用户明确告别时说"再见/拜拜" → {"command":"end"}\n' +
  '5. 看到"[系统]"消息 = 操作已执行，后续回答必须承认这个事实\n\n' +
  'open_page 路由（仅此12个）：\n' +
  '/products /green /checkin /leaderboard /orders /vr /ai/assistant /map /wallet /messages /mine /community\n' +
  '商品详情用 buy 指令，不要拼 /product/ID 路由。\n\n' +
  '产品ID：79=天然竹纤维餐具套装(68元), 80=不锈钢环保吸管套装(38元), 81=麦秆纤维便携餐盒(45元), 82=可降解玉米淀粉杯(25元), 83=木质便携筷子礼盒(35元), 84=硅胶折叠咖啡杯(79元), 85=有机棉四件套床品(328元), 86=LED智能护眼台灯(198元), 87=天然乳胶枕(168元), 88=太阳能户外壁灯(88元), 89=水培室内绿植套装(99元), 90=天然除湿竹炭包(29元), 91=可降解垃圾袋(19.9元), 92=无患子天然洗涤剂(32元), 93=天然海绵沐浴球(28元), 94=柠檬酸除垢清洁剂(15元), 95=竹纤维洗碗布(18元), 96=固体洗发皂(45元), 97=回收PET双肩包(158元), 98=再生纸手工笔记本(28元), 99=旧轮胎再生橡胶地垫(68元), 100=回收牛仔布托特包(88元), 101=再生塑料环保笔(12元), 102=回收玻璃花瓶(58元), 103=有机冷压椰子油(89元), 104=高山有机绿茶(128元), 105=公平贸易咖啡豆(98元), 106=有机杂粮礼盒(158元), 107=野生蓝莓干(45元), 108=蜂蜡保鲜布套装(58元), 109=太阳能充电宝(168元), 110=可充电锂电池套装(89元), 111=低功耗蓝牙温湿度计(49元), 112=可降解植物基手机壳(78元), 113=智能节能插座(128元), 114=手摇发电应急收音机(158元)。';

// Plan prompt 重新定位为环保活动规划助手（替代原旅行行程规划）。
export const PLAN_SYSTEM_PROMPT =
  '你是「绿途」App 的绿色生活规划助手，帮助用户制定低碳环保行动计划。' +
  '根据用户输入的目标和偏好，制定具体的绿色行动方案：节能减排目标、绿色出行计划、' +
  '垃圾分类习惯养成、环保消费选择等。' +
  '用 Markdown 输出：先写一行用 > 引用的目标概览；再按「### 行动计划」列出具体步骤；' +
  '然后给「### 📊 预期减排效果」表格；最后给「### 📝 小贴士」列表。' +
  '内容贴合用户实际情况，只输出 Markdown 方案、不要寒暄。';

// 环保术语翻译提示（替代原粤语翻译）。
export const TRANSLATE_PROMPT =
  '你是环保术语中英翻译助手。把用户输入的内容翻译成对应的环保/绿色低碳专业术语或英文表达。' +
  '只输出翻译结果本身（一行即可）；不要解释、不要注音、不要加引号或多余说明。' +
  '如果是中文输入请翻译成英文；如果是英文输入请翻译成中文。';

// 把环保规划表单拼成发给模型的用户消息。导出为纯函数便于单测。
export function buildPlanPrompt(dto: PlanInput): string {
  const tags = dto.tags && dto.tags.length > 0 ? dto.tags.join('、') : '综合方案';
  return [
    `请为我制定一份绿色低碳行动计划。`,
    `行动周期：${dto.days} 天；预算参考：¥${dto.budget}；关注领域：${tags}。`,
    `补充说明：${dto.notes?.trim() || '无'}。`,
  ].join('\n');
}

// 把 RAG 检索到的知识拼进 system prompt；无知识则原样返回。导出便于单测。
export function buildSystemWithContext(base: string, context: string[]): string {
  if (!context || context.length === 0) return base;
  const refs = context.map((c, i) => `[${i + 1}] ${c}`).join('\n');
  return (
    `${base}\n\n以下是与用户问题相关的「绿途」知识库参考资料，` +
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

  // 普通话 → 地道粤语文字翻译（非流式，走统一信封）。供粤语课堂调用，返回单行粤语译文。
  async translate(text: string): Promise<string> {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI 服务未配置：后端缺少 DEEPSEEK_API_KEY',
      );
    }
    const baseUrl =
      this.config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';
    const model = this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';

    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: false,
          temperature: 0.3,
          messages: [
            { role: 'system', content: TRANSLATE_PROMPT },
            { role: 'user', content: text },
          ],
        }),
      });
    } catch (err) {
      this.logger.error(`DeepSeek 翻译请求失败: ${String(err)}`);
      throw new ServiceUnavailableException('AI 翻译服务暂时不可用，请稍后再试');
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(
        `DeepSeek 翻译响应异常 ${res.status}: ${detail.slice(0, 200)}`,
      );
      throw new ServiceUnavailableException(`AI 翻译服务返回错误（${res.status}）`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json?.choices?.[0]?.message?.content?.trim() ?? '';
  }

  // TTS 语音合成：调用本地 Piper 引擎（极速 <0.05s），返回 base64 WAV
  async speak(text: string): Promise<{ audio: string }> {
    const { execSync } = require('child_process');
    const { readFileSync, unlinkSync } = require('fs');
    const { tmpdir } = require('os');
    const path = require('path');
    const ttsDir = path.resolve(process.cwd(), 'tts');
    const piperExe = path.join(ttsDir, 'piper', 'piper', 'piper.exe');
    const model = path.join(ttsDir, 'zh_CN-huayan-medium.onnx');
    const tmpWav = path.join(tmpdir(), `tts_${Date.now()}.wav`);
    try {
      execSync(`"${piperExe}" --model "${model}" --output_file "${tmpWav}"`, {
        input: text, timeout: 5000, shell: 'cmd.exe',
      });
      const buf = readFileSync(tmpWav);
      unlinkSync(tmpWav);
      return { audio: buf.toString('base64') };
    } catch (e: any) {
      this.logger.error(`Piper TTS 失败: ${e?.message}`);
      throw new ServiceUnavailableException('语音合成暂不可用');
    }
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

    const abort = new AbortController();
    const req = res.req;
    const onClose = () => { abort.abort(); };
    req?.on('close', onClose);

    let upstream: Awaited<ReturnType<typeof fetch>>;
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream: true }),
        signal: abort.signal,
      });
    } catch (err: any) {
      req?.off('close', onClose);
      if (err?.name === 'AbortError') { res.end(); return; }
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
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          for (const delta of extractDeltas(event)) {
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        }
      }
      for (const delta of extractDeltas(buffer)) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      if (err?.name === 'AbortError') { res.end(); return; }
      this.logger.error(`DeepSeek 流读取失败: ${String(err)}`);
      this.writeError(res, 'AI 输出中断，请重试');
    } finally {
      req?.off('close', onClose);
    }
  }

  // 在已开启的 SSE 流里写一条错误事件并结束。
  private writeError(res: Response, message: string): void {
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
