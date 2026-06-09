// RAG 最小验证 spike（CLAUDE.md §7）：
// 验证 ① 本地 embedding 模型可加载并生成向量 ② sqlite-vec 能建 vec0 表、写入、top-k 检索。
// 跑通后再在 ai/rag 模块上盖功能。运行：node scripts/rag-spike.js
/* eslint-disable */
const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');

const MODEL = 'Xenova/bge-small-zh-v1.5'; // 中文友好的轻量句向量模型

async function main() {
  console.log('① 加载 embedding 模型（首次会下载，请稍候）...');
  const { pipeline } = await import('@huggingface/transformers');
  const extractor = await pipeline('feature-extraction', MODEL);
  const embed = async (text) => {
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(out.data);
  };

  const probe = await embed('广州塔');
  const dim = probe.length;
  console.log(`   向量维度 = ${dim}`);

  console.log('② sqlite-vec：建表 + 写入 + top-k 检索...');
  const db = new Database(':memory:');
  sqliteVec.load(db);
  db.exec(`CREATE VIRTUAL TABLE vec USING vec0(embedding float[${dim}])`);
  const insert = db.prepare('INSERT INTO vec(rowid, embedding) VALUES (?, ?)');

  const docs = [
    '广州塔（小蛮腰）是广州的城市地标，高 600 米',
    '潮州工夫茶讲究关公巡城、韩信点兵的斟茶手法',
    '广绣是岭南刺绣，与潮绣合称粤绣',
    '开平碉楼是广东首个世界文化遗产',
  ];
  for (let i = 0; i < docs.length; i++) {
    const e = await embed(docs[i]);
    insert.run(BigInt(i + 1), new Float32Array(e)); // rowid 必须 BigInt（见 sqlite-vec spike）
  }

  const query = '广州有什么标志性的塔？';
  const qv = await embed(query);
  const rows = db
    .prepare(
      'SELECT rowid, distance FROM vec WHERE embedding MATCH ? ORDER BY distance LIMIT 2',
    )
    .all(new Float32Array(qv));

  console.log(`   查询「${query}」top-2：`);
  for (const r of rows) console.log(`   - #${r.rowid} dist=${r.distance.toFixed(4)}  ${docs[Number(r.rowid) - 1]}`);

  const top = Number(rows[0].rowid);
  if (top === 1) {
    console.log('✓ RAG spike 通过：最相关命中「广州塔」');
    process.exit(0);
  } else {
    console.error('✗ 检索结果不符合预期');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('spike 失败:', e);
  process.exit(1);
});
