import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
  AiService,
  buildPlanPrompt,
  buildSystemWithContext,
  extractDeltas,
} from './ai.service';
import type { RagService } from '../rag/rag.service';

function makeConfig(map: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => map[key] } as unknown as ConfigService;
}

// 默认 RAG 检索返回空（不影响纯流式逻辑测试）。
function makeRag(result: string[] = []): RagService {
  return { search: jest.fn().mockResolvedValue(result) } as unknown as RagService;
}

function makeFakeRes() {
  const writes: string[] = [];
  const res = {
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: (chunk: string) => {
      writes.push(chunk);
      return true;
    },
    end: jest.fn(),
  } as unknown as Response;
  return { res, writes };
}

function fakeStreamResponse(chunks: string[], status = 200): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return new Response(status === 200 ? stream : 'err', {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  }) as unknown as Response;
}

describe('extractDeltas（DeepSeek SSE 解析）', () => {
  it('提取单个事件的 delta', () => {
    expect(
      extractDeltas('data: {"choices":[{"delta":{"content":"你好"}}]}'),
    ).toEqual(['你好']);
  });
  it('多事件 + [DONE] 混合', () => {
    const raw = [
      'data: {"choices":[{"delta":{"content":"广"}}]}',
      'data: {"choices":[{"delta":{"content":"州"}}]}',
      'data: [DONE]',
    ].join('\n');
    expect(extractDeltas(raw)).toEqual(['广', '州']);
  });
  it('跳过被截断的半条 JSON（不抛错）', () => {
    expect(extractDeltas('data: {"choices":[{"delta":{"content":"半')).toEqual(
      [],
    );
  });
});

describe('buildPlanPrompt', () => {
  it('以目的地为行程主语，出发地仅作来回交通（回归点：曾把出发地当成游览城市）', () => {
    const p = buildPlanPrompt({
      from: '广州',
      to: '潮州',
      budget: 2000,
      days: 3,
      tags: ['美食之旅', '非遗体验'],
      notes: '带老人',
    });
    // 目的地是行程主语，全部游览都在目的地
    expect(p).toContain('【潮州】');
    expect(p).toContain('都必须安排在 潮州');
    // 出发地只用于第一天来程 / 最后一天返程，不在出发地安排游览
    expect(p).toContain('从 广州 到 潮州');
    expect(p).toContain('除交通外不要在 广州 安排游览');
    expect(p).toContain('旅行偏好：美食之旅、非遗体验');
    expect(p).toContain('带老人');
  });
  it('无 tags / notes 用默认占位', () => {
    const p = buildPlanPrompt({ from: '深圳', to: '珠海', budget: 1000, days: 2 });
    expect(p).toContain('旅行偏好：综合体验');
    expect(p).toContain('补充说明：无');
  });
});

describe('buildSystemWithContext（RAG 注入）', () => {
  it('无知识 → 原样返回 base', () => {
    expect(buildSystemWithContext('BASE', [])).toBe('BASE');
  });
  it('有知识 → 追加带编号的参考资料', () => {
    const out = buildSystemWithContext('BASE', ['广州塔很高', '工夫茶讲究']);
    expect(out).toContain('BASE');
    expect(out).toContain('[1] 广州塔很高');
    expect(out).toContain('[2] 工夫茶讲究');
  });
});

describe('AiService.chat', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('缺少 DEEPSEEK_API_KEY → 抛 503（未触碰响应流）', async () => {
    const svc = new AiService(makeConfig({}), makeRag());
    const { res, writes } = makeFakeRes();
    await expect(
      svc.chat([{ role: 'user', content: '介绍广东' }], res),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(writes).toHaveLength(0);
  });

  it('正常流：先检索 RAG，再转发 delta 并以 [DONE] 收尾', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      fakeStreamResponse([
        'data: {"choices":[{"delta":{"content":"你好"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    ) as unknown as typeof fetch;

    const rag = makeRag(['广州塔是地标']);
    const svc = new AiService(makeConfig({ DEEPSEEK_API_KEY: 'k' }), rag);
    const { res, writes } = makeFakeRes();
    await svc.chat([{ role: 'user', content: '介绍广州塔' }], res);

    // 检索被调用，且 system prompt 注入了知识
    expect(rag.search).toHaveBeenCalledWith('介绍广州塔', 4);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('广州塔是地标');
    expect(body.stream).toBe(true);

    const all = writes.join('');
    expect(all).toContain('data: {"delta":"你好"}');
    expect(all.trimEnd().endsWith('data: [DONE]')).toBe(true);
  });

  it('上游非 200 → 写出错误事件而非抛出', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(fakeStreamResponse([], 500)) as unknown as typeof fetch;
    const svc = new AiService(makeConfig({ DEEPSEEK_API_KEY: 'k' }), makeRag());
    const { res, writes } = makeFakeRes();
    await svc.chat([{ role: 'user', content: 'hi' }], res);
    const all = writes.join('');
    expect(all).toContain('"error"');
    expect(all).toContain('data: [DONE]');
  });
});
