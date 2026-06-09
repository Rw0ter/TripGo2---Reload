// 重建 RAG 知识库：embed knowledge-data 并写入 KnowledgeChunk + sqlite-vec 向量表。
// 运行：npm run rag:index（首次会下载 embedding 模型）。
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RagService } from '../src/modules/rag/rag.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const rag = app.get(RagService);
    const n = await rag.indexAll();
    console.log(`✓ RAG 知识库索引完成：${n} 条`);
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error('RAG 索引失败:', e);
  process.exit(1);
});
