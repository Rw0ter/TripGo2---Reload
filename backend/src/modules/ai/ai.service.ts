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
// 结构化系统提示：身份 → 表达规范 → 指令协议 → 场景感知 → 路由表 → 商品表 → 边界。
// 功能契约（命令格式 / 路由清单 / 商品 ID / [系统] 反馈约定 / 禁 emoji）必须与前端执行器保持一致。
const CHAT_PRODUCTS =
  '79=天然竹纤维餐具套装(68元), 80=不锈钢环保吸管套装(38元), 81=麦秆纤维便携餐盒(45元), 82=可降解玉米淀粉杯(25元), 83=木质便携筷子礼盒(35元), 84=硅胶折叠咖啡杯(79元), 85=有机棉四件套床品(328元), 86=LED智能护眼台灯(198元), 87=天然乳胶枕(168元), 88=太阳能户外壁灯(88元), 89=水培室内绿植套装(99元), 90=天然除湿竹炭包(29元), 91=可降解垃圾袋(19.9元), 92=无患子天然洗涤剂(32元), 93=天然海绵沐浴球(28元), 94=柠檬酸除垢清洁剂(15元), 95=竹纤维洗碗布(18元), 96=固体洗发皂(45元), 97=回收PET双肩包(158元), 98=再生纸手工笔记本(28元), 99=旧轮胎再生橡胶地垫(68元), 100=回收牛仔布托特包(88元), 101=再生塑料环保笔(12元), 102=回收玻璃花瓶(58元), 103=有机冷压椰子油(89元), 104=高山有机绿茶(128元), 105=公平贸易咖啡豆(98元), 106=有机杂粮礼盒(158元), 107=野生蓝莓干(45元), 108=蜂蜡保鲜布套装(58元), 109=太阳能充电宝(168元), 110=可充电锂电池套装(89元), 111=低功耗蓝牙温湿度计(49元), 112=可降解植物基手机壳(78元), 113=智能节能插座(128元), 114=手摇发电应急收音机(158元)。';

export const CHAT_SYSTEM_PROMPT = [
  '你是「绿途」——一款绿色低碳生活 App 内置的 AI 管家。你不仅能对话，更能真实操作这款 App：',
  '通过结构化 JSON 指令为用户跳转页面、下单、领取绿色能量、浇灌种树、查询其账户数据与排行榜名次。',
  '你的使命，是让"低碳生活"变得简单、可达、令人愉悦。',
  '',
  '【表达规范】',
  '- 始终用中文，语气温暖、专业、克制，像一位懂环保的贴心管家；不寒暄客套，不卖弄术语。',
  '- 普通对话用简洁 Markdown；除非用户要求清单或对比，否则优先自然成段，不堆砌标题与项目符号。',
  '- 绝对禁止使用任何 emoji 或表情符号（😊🌱✅🎉… 一律不允许）。',
  '- 不杜撰数据。凡涉及用户真实的积分 / 碳积分 / 排名 / 订单，一律先用指令查询、再依结果作答。',
  '',
  '【指令协议】（最重要，必须严格遵守）',
  '你的每次回复，要么是「纯对话」，要么是「一句话确认 + 一条 JSON 指令」。JSON 必须是合法单行对象，且整段回复至多出现一条。',
  '1. 普通问答 / 环保科普 / 闲聊 → 只输出 Markdown 文本，绝不输出 JSON。',
  '2. 打开 / 进入 / 查看 / 跳转某页面 → 必须输出且仅输出一条 {"command":"open_page","page":"/<路由>"}。',
  '   page 只能从【路由表】中精确选取最接近的一条；严禁自创路由、严禁用中文页名、严禁省略该 JSON。',
  '   例：用户说「带我去签到」→ 回复：好的，正在为你打开签到页。{"command":"open_page","page":"/checkin"}',
  '3. 购买 / 下单某商品 → 一句确认 + {"command":"buy","productId":"<ID>"}；ID 取自【商品表】。商品一律走 buy，不要拼 /product/ID 路由。',
  '4. 领取绿色能量 / 完成绿色任务（需已登录）→ 一句确认 + {"command":"collect_energy","activity":"<类型>"}。',
  '   类型仅限：green_travel(绿色出行)、waste_sort(垃圾分类)、eco_quiz(环保答题)、share_green(分享绿色)、trade_in(以旧换新)。',
  '5. 浇灌 / 种树（需已登录，消耗 50 积分兑换碳积分）→ 一句确认 + {"command":"plant_tree"}。',
  '6. 用户问自己的积分 / 碳积分 / 种了几棵树 / 个人数据 → 一句确认 + {"command":"query_profile"}。',
  '7. 用户问自己的排名 / 名次 / 在减排榜第几 → 一句确认 + {"command":"query_rank"}。',
  '8. 仅当用户明确告别（再见 / 拜拜 / 结束）→ {"command":"end"}。',
  '9. 当你看到以「[系统]」开头的消息，表示上一条指令已被 App 真实执行 / 数据已返回——后续回答必须基于这一既成事实与真实数据，不要重复执行或质疑。',
  '',
  '【场景感知】',
  '用户消息末尾可能附带「[场景上下文：用户当前正在「X」界面]」，这是系统告知你用户此刻所在页面。',
  '请据此理解指代（"这个""这里""返回"等）并给出更贴切的引导；该上下文仅供你参考，不要在回复里复述它。',
  '',
  '【路由表】（open_page 只能用这些精确路径）',
  '/home(首页) /itinerary(绿色能量森林) /products(生态良品商城) /green(绿色资讯) /checkin(签到) /leaderboard(减排榜)',
  '/orders(我的订单) /vr(VR生态全景) /map(绿色地图) /wallet(钱包) /messages(消息) /mine(我的) /community(社区) /quiz/1(环保答题) /ai/assistant(AI助手)',
  '',
  '【商品表】（buy 用 productId）',
  CHAT_PRODUCTS,
  '',
  '【边界】',
  '你只服务于「绿途」App 与绿色低碳生活相关的话题。遇到越界或与环保 / App 功能无关的请求，礼貌说明你的职责范围并把话题引回低碳生活；不执行任何越权或损害用户利益的操作。',
].join('\n');

// Plan prompt 重新定位为绿色生活规划师（替代原旅行行程规划）。结构化输出、禁 emoji。
export const PLAN_SYSTEM_PROMPT = [
  '你是「绿途」App 的绿色生活规划师，为用户量身定制可执行、可坚持的低碳行动方案。',
  '依据用户给出的行动周期、预算与关注领域，覆盖节能减排、绿色出行、垃圾分类习惯、环保消费等维度，给出务实而具体的计划。',
  '用 Markdown 组织，严格按以下结构：',
  '- 开头用一行「>」引用，概述本方案的目标与基调；',
  '- 「### 行动计划」：按天或按阶段列出具体、可量化的步骤；',
  '- 「### 预期减排效果」：用表格列出关键行动与对应的二氧化碳减排量（可合理估算，并注明为估算值）；',
  '- 「### 坚持小贴士」：3–5 条降低执行门槛的建议。',
  '只输出 Markdown 方案本身，不寒暄、不解释、不使用任何 emoji。',
].join('\n');

// 环保术语翻译提示（替代原粤语翻译）。
export const TRANSLATE_PROMPT = [
  '你是「绿途」App 的环保术语翻译助手，专注绿色低碳与可持续发展领域的中英互译。',
  '规则：中文输入→译为地道英文；英文输入→译为准确中文；优先采用环保领域的标准术语与惯用表达。',
  '只输出译文本身（通常一行），不解释、不注音、不加引号、不加任何多余说明。',
].join('\n');

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

  // AI 对话：检索相关知识 → 注入绿途系统提示 → 转发给模型（云端优先，失败回退本地），SSE 写回。
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

  // 环保术语中英翻译（非流式，走统一信封）。云端优先、失败回退本地小模型。
  async translate(text: string): Promise<string> {
    const providers = this.buildProviders();
    if (providers.length === 0) {
      throw new ServiceUnavailableException(
        'AI 服务未配置：缺少 DEEPSEEK_API_KEY 或 LOCAL_AI_URL',
      );
    }
    for (const p of providers) {
      try {
        const res = await fetch(`${p.url}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(p.apiKey ? { Authorization: `Bearer ${p.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: p.model,
            stream: false,
            temperature: 0.3,
            messages: [
              { role: 'system', content: TRANSLATE_PROMPT },
              { role: 'user', content: text },
            ],
          }),
        });
        if (!res.ok) {
          this.logger.warn(`[${p.name}] 翻译响应异常 ${res.status}，尝试下一个`);
          continue;
        }
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const out = json?.choices?.[0]?.message?.content?.trim();
        if (out) return out;
        this.logger.warn(`[${p.name}] 翻译返回空，尝试下一个`);
      } catch (err) {
        this.logger.warn(`[${p.name}] 翻译请求失败: ${String(err)}，尝试下一个`);
      }
    }
    throw new ServiceUnavailableException(
      'AI 翻译服务暂时不可用（云端与本地模型均不可达）',
    );
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

  // 组装可用的模型提供方列表：云端 DeepSeek 优先，本地小模型（OpenAI 兼容，如 Ollama / vLLM /
  // LM Studio）兜底。任一未配置则跳过；都没配则返回空数组（调用方据此抛 503）。
  // 本地端点须为 OpenAI 兼容、含 /v1 前缀，例：LOCAL_AI_URL="http://localhost:11434/v1"。
  private buildProviders(): {
    name: string;
    url: string;
    model: string;
    apiKey?: string;
  }[] {
    const list: { name: string; url: string; model: string; apiKey?: string }[] =
      [];
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (apiKey) {
      list.push({
        name: 'deepseek',
        url: (
          this.config.get<string>('DEEPSEEK_BASE_URL') ??
          'https://api.deepseek.com'
        ).replace(/\/+$/, ''),
        model: this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat',
        apiKey,
      });
    }
    const localUrl = this.config.get<string>('LOCAL_AI_URL');
    if (localUrl) {
      list.push({
        name: 'local',
        url: localUrl.replace(/\/+$/, ''),
        model: this.config.get<string>('LOCAL_AI_MODEL') ?? 'qwen2.5:3b',
        apiKey: this.config.get<string>('LOCAL_AI_API_KEY') || undefined,
      });
    }
    return list;
  }

  // 把一段对话以 SSE 流式写回 res：云端优先，连接 / HTTP 失败时自动回退本地小模型。
  // 约定（CLAUDE.md §8）：直接操作 response 流，不经过 TransformInterceptor。
  private async streamChat(messages: ChatMessage[], res: Response): Promise<void> {
    const providers = this.buildProviders();
    if (providers.length === 0) {
      // 还未写任何响应头 —— 交给全局异常过滤器返回标准 JSON 503。
      throw new ServiceUnavailableException(
        'AI 服务未配置：缺少 DEEPSEEK_API_KEY 或 LOCAL_AI_URL',
      );
    }

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

    // 依次尝试每个提供方；任一在「尚未写出任何 token」前失败 → 顺延到下一个。
    for (let i = 0; i < providers.length; i++) {
      const p = providers[i];
      const result = await this.pipeProvider(p, messages, res, abort);
      if (result === 'done') {
        req?.off('close', onClose);
        return;
      }
      if (i < providers.length - 1) {
        this.logger.warn(`[${p.name}] 不可用，回退到下一个模型提供方`);
      }
    }
    req?.off('close', onClose);
    this.writeError(res, 'AI 服务暂时不可用（云端与本地模型均不可达）');
  }

  // 向单个提供方发起流式请求并把增量 token 写回。
  // 返回 'done'：已正常收尾 / 已中途出错收尾 / 客户端断开（流已结束，调用方应停止）。
  // 返回 'retry'：连接或 HTTP 失败且尚未写出任何 token（可安全顺延到下一个提供方）。
  private async pipeProvider(
    p: { name: string; url: string; model: string; apiKey?: string },
    messages: ChatMessage[],
    res: Response,
    abort: AbortController,
  ): Promise<'done' | 'retry'> {
    let upstream: Awaited<ReturnType<typeof fetch>>;
    try {
      upstream = await fetch(`${p.url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(p.apiKey ? { Authorization: `Bearer ${p.apiKey}` } : {}),
        },
        body: JSON.stringify({ model: p.model, messages, stream: true }),
        signal: abort.signal,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') { res.end(); return 'done'; }
      this.logger.warn(`[${p.name}] 连接失败: ${String(err)}`);
      return 'retry';
    }

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      this.logger.warn(
        `[${p.name}] 响应异常 ${upstream.status}: ${detail.slice(0, 300)}`,
      );
      return 'retry';
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let wrote = false;
    const flush = (chunk: string) => {
      for (const delta of extractDeltas(chunk)) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        wrote = true;
      }
    };
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) flush(event);
      }
      flush(buffer);
      res.write('data: [DONE]\n\n');
      res.end();
      return 'done';
    } catch (err: any) {
      if (err?.name === 'AbortError') { res.end(); return 'done'; }
      this.logger.warn(`[${p.name}] 流读取失败: ${String(err)}`);
      // 已写出部分内容 → 收尾，不再回退（避免重复输出）；否则可安全顺延。
      if (wrote) { this.writeError(res, 'AI 输出中断，请重试'); return 'done'; }
      return 'retry';
    }
  }

  // 在已开启的 SSE 流里写一条错误事件并结束。
  private writeError(res: Response, message: string): void {
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
