import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

// AI 模块：DeepSeek 代理 + SSE 流式。ConfigModule 已全局注册，无需在此 import。
@Module({
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
