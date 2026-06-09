import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { PlanDto } from './dto/plan.dto';
import { TranslateDto } from './dto/translate.dto';

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

  // 普通话→粤语文字翻译（非流式，走统一信封）。粤语课堂用。
  @Post('translate')
  @ApiOperation({ summary: '普通话→粤语文字翻译（DeepSeek，非流式）' })
  async translate(@Body() dto: TranslateDto): Promise<{ cantonese: string }> {
    return { cantonese: await this.ai.translate(dto.text) };
  }
}
