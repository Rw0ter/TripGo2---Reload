# PROGRESS.md — TripGo 项目进展

> 项目的"活文档"。每个 AI 会话**开始时读它、结束时更新它**（用法见 CLAUDE.md 第 12 节）。
> "已完成 / 进行中 / 下一步"三段要定期剪枝，别让文档越长越没人读。

**最后更新：2026-05-20**

## 当前阶段

W0 — 项目初始化。后端骨架已搭好，尚未 `npm install`。

## 已完成

- 项目约定文档 `CLAUDE.md`（含会话纪律）
- 后端 NestJS + Prisma 骨架：`main.ts` / `app.module` / 全局 `PrismaModule` / 全局异常过滤器 + 响应拦截器 / `/health` 接口 / Swagger
- Prisma schema：User / Address / Trip / Order / Story / Comment / Like / Destination / KnowledgeChunk
- `.gitignore`（已排除 Legacy 文件夹、node_modules、.env、*.db）
- 文档体系：`PROGRESS.md` / `README.md` / `docs/page-registry.md`
- 页面盘点：67 页全部分析完毕 → 62 屏需重写（主线 26 / 长尾 36）+ 5 废弃草稿，详见 `docs/page-registry.md`

## 进行中

> 格式：`[负责人] 模块/任务 — 起始时间`。开工前在此登记，防止多人多会话撞车。

- 暂无

## 下一步（按优先级）

1. backend：`npm install` + `npx prisma migrate dev --name init`，跑通 `/docs`
2. backend：auth 模块做透（register / login / JWT / JwtAuthGuard / `@CurrentUser`）—— 作为后续所有模块的模板
3. 风险 spike：sqlite-vec 扩展加载验证（独立 better-sqlite3 连接）
4. frontend：Expo 工程初始化 + Expo Router 路由表 + 5 tab 导航 + 共享组件（StaticPage / 列表 / 详情 / Form）

## 已知问题 / 坑

- Prisma 的 SQLite 引擎无法加载扩展，sqlite-vec 必须走独立 `better-sqlite3` 连接（CLAUDE.md 第 7 节）。
- `VR Map` / `map` / `zhifu` / `offline-ai` 计划用 WebView 套旧版页面兜底，方案尚未验证。
- 旧版 11 屏未接后端、用假数据，重写需新增接口：消息 / 收藏 / 钱包 / 线路 / 景点 / 酒店 / 翻译+TTS（见 `docs/page-registry.md`）。

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
