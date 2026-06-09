import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { PlanDto } from './dto/plan.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // SSE 流式：直接操作 response，绕开统一信封拦截器（CLAUDE.md §8）。
  @Post('chat')
  @ApiOperation({
    summary: 'AI 对话（SSE 流式，DeepSeek 后端代理）',
    description:
      '请求体为对话历史 messages[]，响应为 text/event-stream：' +
      '逐段返回 data: {"delta":"..."}，错误为 data: {"error":"..."}，以 data: [DONE] 结束。',
  })
  async chat(@Body() dto: ChatDto, @Res() res: Response): Promise<void> {
    await this.ai.chat(dto.messages, res);
  }

  @Post('plan')
  @ApiOperation({
    summary: 'AI 行程规划（SSE 流式，DeepSeek 后端代理）',
    description:
      '请求体为出发地 / 目的地 / 预算 / 天数 / 偏好，响应为 text/event-stream，' +
      '逐段返回 Markdown 行程，协议同 /ai/chat。',
  })
  async plan(@Body() dto: PlanDto, @Res() res: Response): Promise<void> {
    await this.ai.plan(dto, res);
  }
}
