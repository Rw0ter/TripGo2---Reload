// 一次性构建脚本：下载腾讯地图栅格瓦片，打包进 App 供「离线地图」使用。
// 下载两级瓦片 —— z9 概览 + z10 细节，离线地图按缩放切换级别。
//
// 运行：node scripts/fetch-offline-tiles.js
// 瓦片落到 assets/offline-map/，注册表落到 lib/offline-tiles.ts。

const fs = require('fs');
const path = require('path');
const https = require('https');

// 两级瓦片网格（Web 墨卡托 XYZ）。z10 是 z9 的精确 2 倍细分，覆盖同一地理范围。
const LEVELS = [
  { z: 9, xMin: 414, yMin: 220, cols: 9, rows: 5 }, // 概览
  { z: 10, xMin: 828, yMin: 440, cols: 18, rows: 10 }, // 细节
];
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
  // 清空旧瓦片，避免换命名后残留。
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;
  for (const lv of LEVELS) {
    for (let row = 0; row < lv.rows; row++) {
      for (let col = 0; col < lv.cols; col++) {
        const x = lv.xMin + col;
        const yXyz = lv.yMin + row;
        const yTencent = (1 << lv.z) - 1 - yXyz; // 腾讯瓦片 y 轴原点在底部
        const server = (col + row) % 4;
        const url =
          `https://rt${server}.map.gtimg.com/tile` +
          `?z=${lv.z}&x=${x}&y=${yTencent}&styleid=1&version=110`;
        const buf = await get(url);
        fs.writeFileSync(
          path.join(OUT_DIR, `z${lv.z}-${col}-${row}.jpg`),
          buf,
        );
        total++;
        process.stdout.write(`\r下载瓦片 ${total}`);
      }
    }
  }
  process.stdout.write('\n');

  // 生成注册表
  const L = [];
  L.push('// 此文件由 scripts/fetch-offline-tiles.js 生成，请勿手改。');
  L.push('// 离线地图的腾讯栅格瓦片（z9 概览 + z10 细节，广东范围）。');
  L.push("import type { ImageSourcePropType } from 'react-native';");
  L.push('');
  L.push('// POI 投影基准网格（取 z9，与渲染用的瓦片级别无关）。');
  const base = LEVELS[0];
  L.push('export const OFFLINE_TILE_GRID = {');
  L.push(`  z: ${base.z},`);
  L.push(`  xMin: ${base.xMin},`);
  L.push(`  yMin: ${base.yMin},`);
  L.push(`  cols: ${base.cols},`);
  L.push(`  rows: ${base.rows},`);
  L.push(`  tileSize: ${TILE},`);
  L.push('} as const;');
  L.push('');
  L.push('export interface OfflineTileLevel {');
  L.push('  cols: number;');
  L.push('  rows: number;');
  L.push('  tiles: ImageSourcePropType[][]; // [row][col]');
  L.push('}');
  L.push('');
  L.push('// 多级瓦片，按缩放从概览到细节。');
  L.push('export const OFFLINE_TILE_LEVELS: OfflineTileLevel[] = [');
  for (const lv of LEVELS) {
    L.push(`  {`);
    L.push(`    cols: ${lv.cols},`);
    L.push(`    rows: ${lv.rows},`);
    L.push(`    tiles: [`);
    for (let row = 0; row < lv.rows; row++) {
      const items = [];
      for (let col = 0; col < lv.cols; col++) {
        items.push(
          `require('../assets/offline-map/z${lv.z}-${col}-${row}.jpg')`,
        );
      }
      L.push(`      [${items.join(', ')}],`);
    }
    L.push(`    ],`);
    L.push(`  },`);
  }
  L.push('];');
  L.push('');
  fs.writeFileSync(REGISTRY, L.join('\n'));
  console.log(`完成：${total} 块瓦片 → ${OUT_DIR}`);
  console.log(`注册表 → ${REGISTRY}`);
}

main().catch((e) => {
  console.error('下载失败：', e.message);
  process.exit(1);
});
