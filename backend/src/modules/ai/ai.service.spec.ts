import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
  AiService,
  buildPlanPrompt,
  extractDeltas,
} from './ai.service';

function makeConfig(map: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => map[key] } as unknown as ConfigService;
}

// 收集 SSE 写出的假 Response。
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

// 构造一个 DeepSeek 风格的流式 fetch Response。
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

  it('忽略心跳行、空 delta', () => {
    const raw = [
      ': keep-alive',
      'data: {"choices":[{"delta":{}}]}',
      'data: {"choices":[{"delta":{"content":""}}]}',
    ].join('\n');
    expect(extractDeltas(raw)).toEqual([]);
  });

  it('跳过被截断的半条 JSON（不抛错）', () => {
    expect(extractDeltas('data: {"choices":[{"delta":{"content":"半')).toEqual(
      [],
    );
  });
});

describe('buildPlanPrompt', () => {
  it('包含全部字段', () => {
    const p = buildPlanPrompt({
      from: '广州',
      to: '潮州',
      budget: 2000,
      days: 3,
      tags: ['美食之旅', '非遗体验'],
      notes: '带老人',
    });
    expect(p).toContain('出发地：广州');
    expect(p).toContain('目的地：潮州');
    expect(p).toContain('天数：3 天');
    expect(p).toContain('人均预算：¥2000');
    expect(p).toContain('旅行偏好：美食之旅、非遗体验');
    expect(p).toContain('补充说明：带老人');
  });

  it('无 tags / notes 时用默认占位', () => {
    const p = buildPlanPrompt({ from: '深圳', to: '珠海', budget: 1000, days: 2 });
    expect(p).toContain('旅行偏好：综合体验');
    expect(p).toContain('补充说明：无');
  });
});

describe('AiService.chat', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('缺少 DEEPSEEK_API_KEY → 抛 503（未触碰响应流）', async () => {
    const svc = new AiService(makeConfig({}));
    const { res, writes } = makeFakeRes();
    await expect(
      svc.chat([{ role: 'user', content: '介绍广东' }], res),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(writes).toHaveLength(0);
  });

  it('正常流：转发 delta 并以 [DONE] 收尾', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      fakeStreamResponse([
        'data: {"choices":[{"delta":{"content":"你好"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"广东"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    ) as unknown as typeof fetch;

    const svc = new AiService(makeConfig({ DEEPSEEK_API_KEY: 'k' }));
    const { res, writes } = makeFakeRes();
    await svc.chat([{ role: 'user', content: '介绍广东' }], res);

    const all = writes.join('');
    expect(all).toContain('data: {"delta":"你好"}');
    expect(all).toContain('data: {"delta":"广东"}');
    expect(all.trimEnd().endsWith('data: [DONE]')).toBe(true);
    // 关键：发给 DeepSeek 的请求带了 system prompt 且 stream:true
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[0]).toContain('/chat/completions');
    const body = JSON.parse(call[1].body);
    expect(body.stream).toBe(true);
    expect(body.messages[0].role).toBe('system');
  });

  it('上游非 200 → 写出错误事件而非抛出', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(fakeStreamResponse([], 500)) as unknown as typeof fetch;
    const svc = new AiService(makeConfig({ DEEPSEEK_API_KEY: 'k' }));
    const { res, writes } = makeFakeRes();
    await svc.chat([{ role: 'user', content: 'hi' }], res);
    const all = writes.join('');
    expect(all).toContain('"error"');
    expect(all).toContain('data: [DONE]');
  });
});
