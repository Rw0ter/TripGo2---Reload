import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { KNOWLEDGE } from './knowledge-data';

// 原生模块用 require 引入，避免在 commonjs 下的类型声明/ESM 解析问题。
// （CLAUDE.md §7：向量检索不走 Prisma，单独 better-sqlite3 连接 + sqlite-vec，与 Prisma 共用同一 .db）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BetterSqlite3 = require('better-sqlite3');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqliteVec = require('sqlite-vec');

// @huggingface/transformers 是 ESM-only；用 Function 包一层做动态 import，
// 避免 TS 在 commonjs 下把 import() 降级成 require()（会触发 ERR_REQUIRE_ESM）。
const dynamicImport = new Function('m', 'return import(m)') as (
  m: string,
) => Promise<any>;

const MODEL = 'Xenova/bge-small-zh-v1.5';
const DIM = 512;

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private db: any = null;
  private extractor: any = null;
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    try {
      const db = new BetterSqlite3(this.resolveDbPath());
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 5000');
      sqliteVec.load(db);
      db.exec(
        `CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_vec USING vec0(embedding float[${DIM}])`,
      );
      this.db = db;
      this.ready = true;
      this.logger.log('RAG 向量库就绪（sqlite-vec）');
    } catch (err) {
      // 初始化失败（如缺扩展）不应拖垮整个服务：检索降级为空。
      this.logger.warn(`RAG 初始化失败，检索降级为空：${String(err)}`);
      this.ready = false;
    }
  }

  // DATABASE_URL 形如 file:./dev.db，相对 prisma/schema.prisma 所在目录。
  private resolveDbPath(): string {
    const url = this.config.get<string>('DATABASE_URL') ?? 'file:./dev.db';
    const file = url.replace(/^file:/, '');
    return path.isAbsolute(file)
      ? file
      : path.resolve(process.cwd(), 'prisma', file);
  }

  private async getExtractor() {
    if (!this.extractor) {
      const { pipeline } = await dynamicImport('@huggingface/transformers');
      this.extractor = await pipeline('feature-extraction', MODEL);
    }
    return this.extractor;
  }

  private async embed(text: string): Promise<Float32Array> {
    const extractor = await this.getExtractor();
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    return new Float32Array(out.data as ArrayLike<number>);
  }

  async isIndexed(): Promise<boolean> {
    if (!this.db) return false;
    const row = this.db
      .prepare('SELECT COUNT(*) AS c FROM "KnowledgeChunk"')
      .get() as { c: number };
    return row.c > 0;
  }

  // 重建知识库：清空 KnowledgeChunk + 向量表，重新 embed 全部知识写入。
  async indexAll(): Promise<number> {
    if (!this.db) throw new Error('RAG 未就绪');
    this.db.exec('DELETE FROM "KnowledgeChunk"');
    this.db.exec('DELETE FROM knowledge_vec');
    const insChunk = this.db.prepare(
      'INSERT INTO "KnowledgeChunk" (source, content, createdAt) VALUES (?, ?, ?)',
    );
    const insVec = this.db.prepare(
      'INSERT INTO knowledge_vec (rowid, embedding) VALUES (?, ?)',
    );
    let n = 0;
    for (const item of KNOWLEDGE) {
      const vector = await this.embed(item.content);
      const info = insChunk.run(item.source, item.content, Date.now());
      // rowid 必须用 BigInt（sqlite-vec 拒绝非整数主键）
      insVec.run(BigInt(info.lastInsertRowid), vector);
      n += 1;
    }
    this.logger.log(`RAG 已索引 ${n} 条知识`);
    return n;
  }

  // 检索 top-k 相关知识文本；未就绪或出错时安全返回空数组。
  async search(query: string, k = 4): Promise<string[]> {
    if (!this.ready || !this.db) return [];
    try {
      const vector = await this.embed(query);
      const rows = this.db
        .prepare(
          `SELECT rowid, distance FROM knowledge_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ${Math.max(1, Math.floor(k))}`,
        )
        .all(vector) as { rowid: number; distance: number }[];
      if (rows.length === 0) return [];
      const ids = rows.map((r) => r.rowid);
      const placeholders = ids.map(() => '?').join(',');
      const chunks = this.db
        .prepare(
          `SELECT id, content FROM "KnowledgeChunk" WHERE id IN (${placeholders})`,
        )
        .all(...ids) as { id: number; content: string }[];
      const byId = new Map(chunks.map((c) => [c.id, c.content]));
      return ids
        .map((id) => byId.get(id))
        .filter((c): c is string => typeof c === 'string');
    } catch (err) {
      this.logger.warn(`RAG 检索失败：${String(err)}`);
      return [];
    }
  }
}
