# PROGRESS.md — TripGo 项目进展

> 项目的"活文档"。每个 AI 会话**开始时读它、结束时更新它**（用法见 CLAUDE.md 第 12 节）。
> "已完成 / 进行中 / 下一步"三段要定期剪枝，别让文档越长越没人读。

**最后更新：2026-05-20**

## 当前阶段

W1 进行中。auth 模块已合并（PR #1）；Expo 前端工程初始化完成，在 PR `feat/expo-init` 待合并。

## 已完成

- 项目约定文档 `CLAUDE.md`（含会话纪律）
- 后端 NestJS + Prisma 骨架：`main.ts` / `app.module` / 全局 `PrismaModule` / 全局异常过滤器 + 响应拦截器 / `/health` 接口 / Swagger
- Prisma schema：User / Address / Trip / Order / Story / Comment / Like / Destination / KnowledgeChunk
- `.gitignore`（已排除 Legacy 文件夹、node_modules、.env、*.db）
- 文档体系：`PROGRESS.md` / `README.md` / `docs/page-registry.md`
- 页面盘点：67 页全部分析完毕 → 62 屏需重写（主线 26 / 长尾 36）+ 5 废弃草稿，详见 `docs/page-registry.md`
- 后端依赖安装完成（NestJS 11 / Prisma 6，432 包）
- Prisma 迁移完成：`dev.db` + 首个 migration `init`
- auth 模块完成并验证：`register` / `login` / `me` + `JwtAuthGuard` + `@CurrentUser`
- auth 模块经子代理 code review 并修复（3 阻断 + 6 建议项）：鉴权基础设施抽到 `common/`、JwtModule 全局化、注册改用 P2002 兜底防竞态、对外字段用白名单 select
- GitHub Actions CI 流水线（`.github/workflows/ci.yml`）：后端构建门禁
- Expo 前端工程初始化：create-expo-app 脚手架 + NativeWind v4 + Zustand + 5-tab 底部导航 + 4 个共享组件骨架（StaticPage / List / Detail / Form）

## 进行中

> 格式：`[负责人] 模块/任务 — 起始时间`。开工前在此登记，防止多人多会话撞车。

- 暂无

## 下一步（按优先级）

1. 风险 spike：sqlite-vec 扩展加载验证（独立 better-sqlite3 连接）
2. backend：按 auth 模板推进 destinations / trips / orders 等模块
3. frontend：按 4 个共享组件铺 62 屏

## 已知问题 / 坑

- Prisma 的 SQLite 引擎无法加载扩展，sqlite-vec 必须走独立 `better-sqlite3` 连接（CLAUDE.md 第 7 节）。
- `VR Map` / `map` / `zhifu` / `offline-ai` 计划用 WebView 套旧版页面兜底，方案尚未验证。
- 旧版 11 屏未接后端、用假数据，重写需新增接口：消息 / 收藏 / 钱包 / 线路 / 景点 / 酒店 / 翻译+TTS（见 `docs/page-registry.md`）。
- `npm install` 报告 2 个 high severity 漏洞，位于 bcrypt 的旧 node-pre-gyp 依赖链；暂不阻塞，后续可评估改用纯 JS 的 bcryptjs。

## 关键决策记录

> append-only，只增不改。每条写清"为什么"，让后续会话不必重新纠结。

- **2026-05-20** 后端选 NestJS + Prisma + SQLite：模块化专业感强、AI 易生成代码、SQLite 免部署便于评委开箱即用。
- **2026-05-20** RAG 向量存储选 sqlite-vec（非 pgvector）：保留 SQLite"免部署"卖点；pgvector 需要 PostgreSQL 服务，会毁掉该优势。
- **2026-05-20** 向量检索不走 Prisma：Prisma 的 SQLite 引擎不能加载扩展，改用独立 better-sqlite3 连接，与 Prisma 共用同一 `.db` 文件。
- **2026-05-20** 统一返回格式：成功 `{code:0,message:'ok',data}`，失败 `{code:<HTTP码>,message,data:null}`；SSE 流式接口不经过响应拦截器。
- **2026-05-20** 67 个页面"只多不能少"：数量锁死，打磨度作为变量——演示主线 ~12 屏深做，长尾 ~40 屏功能级即可。
- **2026-05-20** VR / 地图 / 支付等硬骨头屏：用 `react-native-webview` 套旧版 HTML 兜底，保计数、不沉成本。
- **2026-05-20** 团队 4 人、无专职后端、全栈、AI 24h：W1 由组长搭后端地基，之后按"垂直切片"（一个功能的前后端由同一人一起做）推进。
- **2026-05-20** 5 个废弃草稿/测试页（index / itinerary2 / mine / top / wzfdemo）确认不重写：前三者是被 index1/itinerary/mine1 取代的设计草稿，后两者是 CSS 演示页和空白测试页，均非功能。重写范围锁定 62 屏。
- **2026-05-20** 确立模块合并流程：feat 分支 → 子代理 code review → PR → CI 门禁 → 合并（见 CLAUDE.md 第 13 节），每个模块/页面都重复。
- **2026-05-20** 鉴权基础设施（JwtAuthGuard / @CurrentUser）放 `common/`、JwtModule 全局化：让后续模块零 import 即可 `@UseGuards(JwtAuthGuard)`，避免被复制十几次时产生跨模块耦合。
- **2026-05-20** 前端工程放 `frontend/`（非 `app/`）：避免与 Expo Router 自身的 `app/` 路由目录嵌成 `app/app/`。
- **2026-05-20** auth store 暂不做持久化（token 内存态）：待登录屏接入时用 `expo-secure-store` 加，属简单优先的有意推迟，非未完成。
