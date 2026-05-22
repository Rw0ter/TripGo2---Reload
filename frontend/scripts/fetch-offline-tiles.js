// 一次性构建脚本：下载腾讯地图栅格瓦片（广东范围，zoom 9），
// 打包进 App 供「离线地图」使用，并生成瓦片注册表 lib/offline-tiles.ts。
//
// 运行：node scripts/fetch-offline-tiles.js
// 瓦片落到 assets/offline-map/，注册表落到 lib/offline-tiles.ts。

const fs = require('fs');
const path = require('path');
const https = require('https');

// 瓦片网格（Web 墨卡托 XYZ）。覆盖广东主要景点所在范围，留出留白。
const Z = 9;
const X_MIN = 414; // 含
const X_MAX = 422; // 含 → 9 列
const Y_MIN = 220; // XYZ 规范的 y，含
const Y_MAX = 224; // 含 → 5 行
const TILE = 256;

const OUT_DIR = path.join(__dirname, '..', 'assets', 'offline-map');
const REGISTRY = path.join(__dirname, '..', 'lib', 'offline-tiles.ts');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { timeout: 20000 }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject)
      .on('timeout', function () {
        this.destroy(new Error(`timeout ${url}`));
      });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cols = X_MAX - X_MIN + 1;
  const rows = Y_MAX - Y_MIN + 1;
  let n = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = X_MIN + col;
      const yXyz = Y_MIN + row;
      const yTencent = (1 << Z) - 1 - yXyz; // 腾讯瓦片 y 轴原点在底部
      const server = (col + row) % 4;
      const url =
        `https://rt${server}.map.gtimg.com/tile` +
        `?z=${Z}&x=${x}&y=${yTencent}&styleid=1&version=110`;
      const buf = await get(url);
      fs.writeFileSync(path.join(OUT_DIR, `tile-${col}-${row}.jpg`), buf);
      n++;
      process.stdout.write(`\r下载瓦片 ${n}/${cols * rows}`);
    }
  }
  process.stdout.write('\n');

  // 生成注册表
  const lines = [];
  lines.push('// 此文件由 scripts/fetch-offline-tiles.js 生成，请勿手改。');
  lines.push('// 离线地图的腾讯栅格瓦片（zoom 9，广东范围）。');
  lines.push("import type { ImageSourcePropType } from 'react-native';");
  lines.push('');
  lines.push('export const OFFLINE_TILE_GRID = {');
  lines.push(`  z: ${Z},`);
  lines.push(`  xMin: ${X_MIN},`);
  lines.push(`  yMin: ${Y_MIN},`);
  lines.push(`  cols: ${cols},`);
  lines.push(`  rows: ${rows},`);
  lines.push(`  tileSize: ${TILE},`);
  lines.push('} as const;');
  lines.push('');
  lines.push(
    '// [row][col] 顺序的瓦片资源，与 OFFLINE_TILE_GRID 对应。',
  );
  lines.push('export const OFFLINE_TILES: ImageSourcePropType[][] = [');
  for (let row = 0; row < rows; row++) {
    const items = [];
    for (let col = 0; col < cols; col++) {
      items.push(`require('../assets/offline-map/tile-${col}-${row}.jpg')`);
    }
    lines.push(`  [${items.join(', ')}],`);
  }
  lines.push('];');
  lines.push('');
  fs.writeFileSync(REGISTRY, lines.join('\n'));
  console.log(`完成：${n} 块瓦片 → ${OUT_DIR}`);
  console.log(`注册表 → ${REGISTRY}`);
}

main().catch((e) => {
  console.error('下载失败：', e.message);
  process.exit(1);
});
