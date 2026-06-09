import { Module } from '@nestjs/common';
import { RagService } from './rag.service';

// RAG 模块：本地 embedding（transformers.js）+ sqlite-vec 向量检索。
// 导出 RagService 供 ai 模块做检索增强。
@Module({
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
