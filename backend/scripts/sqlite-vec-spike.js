// sqlite-vec 最小验证 spike —— 见 CLAUDE.md 第 7 节。
// 目的：在动手做 RAG 前确认 sqlite-vec 能用。
// 验证三步：加载扩展 → 建 vec0 虚拟表写入向量 → top-k 相似度检索。
// 运行：node scripts/sqlite-vec-spike.js
const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');

const db = new Database(':memory:');

// [1] 加载 sqlite-vec 扩展（Prisma 引擎做不到，所以走 better-sqlite3）
sqliteVec.load(db);
const { vec_version } = db
  .prepare('SELECT vec_version() AS vec_version')
  .get();
console.log('[1] sqlite-vec 扩展已加载，版本:', vec_version);

// [2] 建 vec0 虚拟表并写入向量
db.exec('CREATE VIRTUAL TABLE demo USING vec0(embedding float[4])');
const insert = db.prepare('INSERT INTO demo(rowid, embedding) VALUES (?, ?)');
const items = [
  [1, [0.1, 0.1, 0.1, 0.1]],
  [2, [0.9, 0.9, 0.9, 0.9]],
  [3, [0.2, 0.1, 0.1, 0.1]],
];
for (const [id, vec] of items) {
  // rowid 必须用 BigInt：better-sqlite3 会把普通 JS number 绑成浮点，sqlite-vec 要整数主键
  insert.run(BigInt(id), JSON.stringify(vec));
}
console.log('[2] 已写入', items.length, '条向量');

// [3] top-k 相似度检索
const query = [0.12, 0.1, 0.1, 0.1];
const rows = db
  .prepare(
    `SELECT rowid, distance FROM demo
     WHERE embedding MATCH ? ORDER BY distance LIMIT 2`,
  )
  .all(JSON.stringify(query));
console.log('[3] 查询向量', query, '的 top-2:');
for (const r of rows) {
  console.log('     rowid', r.rowid, ' distance', r.distance.toFixed(4));
}

// 期望：最近的是 rowid 1（[0.1,0.1,0.1,0.1]），其次 rowid 3
const ok = rows.length === 2 && rows[0].rowid === 1 && rows[1].rowid === 3;
console.log(
  ok
    ? '\n[OK] SPIKE 通过：扩展加载 + 写入 + top-k 全部正常'
    : '\n[FAIL] SPIKE 结果不符合预期',
);
db.close();
process.exit(ok ? 0 : 1);
