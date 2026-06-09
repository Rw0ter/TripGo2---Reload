import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RagModule } from '../rag/rag.module';

// AI 模块：DeepSeek 代理 + SSE 流式，接入 RagModule 做检索增强。
// ConfigModule 已全局注册，无需在此 import。
@Module({
  imports: [RagModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
