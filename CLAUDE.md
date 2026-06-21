# CLAUDE.md — TripGo（绿途）2026 重写版

本文件是项目的**唯一约定来源**。所有人（包括 AI 代码助手）在写代码前必须遵守。

## 1. 项目简介

TripGo（绿途）是一款移动应用，2026 重写版。**原为广东 / 岭南文化旅游（非遗）主题，现已全面转型为绿色低碳主题**，贴合"绿色发展、新质生产力（人工智能+）"路线（App 显示名 `绿途`、slug `greentrip`）。
功能范围：用户体系、AI 助手（对话 / 行程规划 / Siri 式语音助手 + 本地 TTS）、碳积分与虚拟植树、每日环保任务与减排趋势、VR 生态全景、生态良品商城（含以旧换新）、订单、社区故事、排行榜 / 签到 / 环保答题。

旧版（DCloud MUI + 脚本式 Express）保留在 `Legacy TripGo ReadOnly!!!/`，**只读，仅作参考**——不要修改它，也不要在新代码中引用它的文件。

## 2. 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Expo (React Native) + Expo Router |
| 前端 UI / 状态 | NativeWind + Zustand |
| 后端 | NestJS (TypeScript) |
| API 文档 | @nestjs/swagger（运行后访问 `/docs`） |
| 数据库 | SQLite 单文件 |
| ORM | Prisma |
| AI | DeepSeek（后端代理 + SSE 流式）；RAG 用 sqlite-vec |

## 3. 仓库结构

```
TripGo2 - Reload/
├── CLAUDE.md                  ← 本文件
├── .gitignore
├── backend/                   ← NestJS 后端
│   ├── prisma/schema.prisma
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma/            ← PrismaModule / PrismaService（全局）
│       ├── common/            ← 过滤器、拦截器、装饰器、公共 DTO
│       └── modules/           ← 业务模块（每个功能一个文件夹）
├── frontend/                  ← Expo 前端（Expo Router，路由在 frontend/app/）
└── Legacy TripGo ReadOnly!!!/ ← 旧项目，只读参考
```

## 4. 通用工作原则

- **先想后写**：把假设说清楚；有多种理解先列出来再确认；有更简单的做法就提出来；不清楚就停下来问。
- **简单优先**：只写需求要的代码，不做没要求的抽象、配置项、防御性分支。
- **外科手术式改动**：只动该动的；不顺手"优化"无关代码；匹配现有风格。
- **目标驱动**：每个任务先定一条可验证的完成标准，再写代码。

## 5. 后端约定（NestJS）

### 5.1 模块结构
每个业务功能 = `src/modules/<name>/` 下一个模块，标准文件：
```
modules/trips/
├── trips.module.ts
├── trips.controller.ts
├── trips.service.ts
└── dto/
    ├── create-trip.dto.ts
    └── update-trip.dto.ts
```
- Controller 只负责 HTTP 入参 / 出参，业务逻辑全部放 Service。
- Service 通过注入的 `PrismaService` 访问数据库。
- 新模块必须在 `app.module.ts` 的 `imports` 里注册。

### 5.2 命名
- 文件 kebab-case：`create-trip.dto.ts`
- 类 PascalCase：`CreateTripDto`、`TripsService`
- 路由前缀用复数：`@Controller('trips')`

### 5.3 统一返回格式
所有正常响应由全局 `TransformInterceptor` 自动包成：
```json
{ "code": 0, "message": "ok", "data": <你的返回值> }
```
Service / Controller 里**只 return 业务数据本身**，不要自己包这层 envelope。
错误由全局 `AllExceptionsFilter` 包成 `{ "code": <HTTP状态码>, "message": "...", "data": null }`。

### 5.4 错误处理
- 业务错误用 Nest 内置异常：`throw new NotFoundException('行程不存在')`、`BadRequestException` 等。
- 不要 try/catch 之后自己 `res.status().json()`。

### 5.5 入参校验
- 所有请求体用 DTO 类 + `class-validator` 装饰器（`@IsString()`、`@IsNotEmpty()` 等）。
- 全局 `ValidationPipe`（`whitelist + transform`）已开启，DTO 未声明的字段会被自动剥离。

### 5.6 Swagger
- 每个 Controller 加 `@ApiTags('xxx')`。
- 每个接口加 `@ApiOperation({ summary: '...' })`。
- DTO 每个字段加 `@ApiProperty()`。
- 需要登录的接口加 `@ApiBearerAuth()`。

### 5.7 鉴权
- JWT，用 `@nestjs/jwt`。
- `auth` 模块提供 `JwtAuthGuard` 和 `@CurrentUser()` 装饰器，其他模块复用。
- 密钥从 `ConfigService` 读 `JWT_SECRET`，**绝不写进代码**。

### 5.8 配置 / 密钥
- 所有密钥、端口、外部地址走 `.env` + `@nestjs/config`。
- `.env` 不入库；`.env.example` 入库作为模板。
- 代码里禁止出现明文密钥 / API Key / 地图 Key（旧版的反面教材）。

## 6. 数据库 / Prisma 约定
- 数据源唯一：`backend/prisma/schema.prisma`，`provider = "sqlite"`。
- 改表结构 = 改 `schema.prisma` → 跑 `npx prisma migrate dev --name <说明>`。
- 查询一律走注入的 `PrismaService`，不要在别处 new `PrismaClient`（`prisma/seed.ts` 等 Nest 容器外的脚本除外）。
- 演示数据用 seed 脚本（`prisma/seed.ts`），不把 `dev.db` 提交进 git；`npx prisma db seed` 运行。

## 7. sqlite-vec / RAG 约定（重要，最容易踩坑）
- **Prisma 的 SQLite 引擎无法加载 SQLite 扩展**，所以向量检索**不能走 Prisma**。
- 方案：RAG 模块单独建一个 `better-sqlite3` 连接，加载 `sqlite-vec` 扩展，与 Prisma **共用同一个 `.db` 文件**。
  - 关系数据 → Prisma
  - 向量写入 / 相似度检索 → better-sqlite3 + sqlite-vec 原生 SQL
- 向量虚拟表（`vec0`）用原生 SQL 建，**不要写进 schema.prisma**（Prisma 不认虚拟表）。
- **动手做 RAG 前先做最小验证 spike**：能加载扩展 → 能写入一条向量 → 能查 top-k。跑通了再往上盖功能。

## 8. AI 接入约定
- DeepSeek 调用**只在后端 `ai` 模块**，密钥从 `.env` 读。
- 前端**永远不接触** DeepSeek 密钥（旧版前端明文直连是必须消除的隐患）。
- 流式输出用 SSE：AI 接口直接操作 response 流，**不经过 `TransformInterceptor`**。
- DeepSeek 模型标识以官方文档为准，默认 `deepseek-chat`。
- TTS（文本转语音）走后端本地 **Piper** 引擎：`ai` 模块调用 `backend/tts/` 下的 `piper.exe` + `*.onnx` 模型，返回 base64 WAV。**模型 / 二进制体积数百 MB，不入库**（见 `.gitignore`），新环境需自行放置到 `backend/tts/`；缺失时仅 TTS 接口报错降级，不影响其余功能。

## 9. 前端约定（Expo）
- 路由用 Expo Router（文件式路由），路由文件在 `frontend/app/`。
- 样式用 NativeWind（Tailwind 写法）；品牌主色用 `primary`（`text-primary` / `bg-primary`），定义在 `tailwind.config.js`，不要散写 `#386641`。
- `<Image>` 的宽 / 高走 `style` prop，**不要用 className**：react-native-web 会用图片原始尺寸的内联 style 覆盖 className，导致 web 端图片尺寸失控。
- 需要 className 的动画组件从 `@/components/ui/animated` 取 `Animated`（已做 cssInterop），**不要**直接用 `react-native-reanimated` 的 `Animated.View`——否则 web 端 className 被静默丢弃。动画工具（`FadeInDown` 等）仍从 `react-native-reanimated` 取。
- 全局状态（Token、AI 会话）用 Zustand，store 放 `frontend/stores/`。
- 图标统一用 `@expo/vector-icons` 的 `Ionicons`（底部导航栏例外：按要求 100% 复刻 Legacy，用 `assets/legacy/img/nav/` 的 PNG 图标，组件见 `components/legacy-tab-bar.tsx`）。
- 屏级复用组件放 `frontend/components/shared/`（StaticPage / List / Detail / Form 四种模板）。
- 文件命名：组件 / 模块文件用 kebab-case（与脚手架一致，如 `list-screen.tsx`）；Expo Router 路由文件名即路由名。
- 后端地址走环境变量 / 配置，**不硬编码 IP**（旧版 `api.js` 写死 IP 是反面教材）。

## 10. Git 约定
- 不提交：`node_modules/`、`dist/`、`.env`、`*.db`、`uploads/`。
- commit message 用 `<类型>: <说明>`，类型为 `feat / fix / refactor / docs / chore`。
- 一个提交只做一件事。

## 11. 开发流程铁律
1. **先做透一个纵向切片**：第一个完整模块做 `auth`（register / login / JWT），打通 Controller → Service → Prisma → DTO → Swagger 全链路。
2. 人工 review 把 `auth` 定型，作为后续所有模块的模板。
3. 之后每个模块照 `auth` 的结构复制，保持风格一致。
4. 每个模块开工前先写一句可验证的完成标准（例如"能 POST /trips 创建并能 GET 查回"）。

## 12. 文档体系与会话纪律（对抗 AI 健忘）

本项目 AI 24 小时连轴转、多人多会话并行，最大风险不是写得慢，而是**会话之间丢失上下文**。靠以下 4 份 git 内文档维持连续性：

| 文档 | 内容 | 性质 |
|------|------|------|
| `CLAUDE.md`（本文件） | 约定、规则、技术栈 | 持久，精简，每会话自动加载 |
| `PROGRESS.md` | 进度、进行中、下一步、已知坑、关键决策记录 | 易变，每会话更新 |
| `docs/page-registry.md` | 67 个页面清单与状态 | 前端进度跟踪 |
| `README.md` | 项目简介、安装运行、架构 | 给人看 / 新会话快速上手 |

### 每个 AI 会话的固定动作
- **开始**：先读 `PROGRESS.md`；要动前端页面再查 `docs/page-registry.md`。
- **结束（强制，不可跳过）**：更新 `PROGRESS.md`——"已完成 / 进行中 / 下一步"三段做相应挪动；新踩的坑记进"已知问题"。任何**改了代码**的会话，结束前必须更新 `PROGRESS.md`；动了前端屏 / 后端模块状态的，必须同步更新 `docs/page-registry.md`。**文档与代码不一致，视为本次工作未完成。**
- **提交即同步文档（硬要求）**：一次提交若改变了"已完成 / 进行中"的事实（新增模块、完成页面、修复已知坑、引入新约定），同一提交或紧随其后的提交必须带上对应文档更新。**禁止"代码先行、文档欠账"**——这正是本项目此前文档严重失真的根因。
- **发现新的通用约定** → 立刻补进本文件对应章节，不要散落在某次对话里。
- **做了架构性取舍** → 追加到 `PROGRESS.md` 的"关键决策记录"，写清"为什么"，避免后续会话重新纠结。
- `PROGRESS.md` 的"进行中"必须写**谁、在做哪个模块**，防止多人多会话撞车。
- 提交信息要能让人和 AI 看懂这次改了什么。

> **给所有 AI 会话的硬性提醒**：本项目曾出现 `PROGRESS.md` 落后真实代码 ~23 个 PR、AI 模块"文档说有、代码没有"的严重漂移。从此以后，**以代码 + `git log` 为真相来源**，文档必须随每次提交保持同步；下一节（第 14 节）的测试门禁与本节的文档门禁同等强制。

### 保持精简
`CLAUDE.md` 每个会话都加载，写进来的每行都有上下文成本——只放**长期有效的规则**，一次性状态放 `PROGRESS.md`。`PROGRESS.md` 的进度三段要定期剪枝，已完成的老条目合并成一句话即可。

## 13. 模块开发与合并流程（每个新模块 / 功能都重复这套）

不直接推 master。每完成一个后端模块、前端屏或共享组件，按以下流程合并：

1. **开分支**：从 master 切 `feat/<名字>`（如 `feat/auth-module`、`feat/screen-login`）。
2. **开发 + 自测**：本地 `npm run build` 通过，关键接口 / 页面手测通过。
3. **子代理 review**：用一个子代理对改动做 code review，对照本文件约定 + 安全性 + 正确性出意见；**阻断项必须修复**后才能进入下一步。
4. **提交 + 推分支**：按第 10 节提交规范，一个提交做一件事。
5. **开 PR**：目标分支 master；PR 描述写清改了什么、自测结果、子代理 review 结论。
6. **CI 门禁**：GitHub Actions（`.github/workflows/ci.yml`）自动跑后端构建，**必须绿**。
7. **合并**：CI 绿 + review 通过后合并到 master，删除分支。
8. **收尾**：更新 `PROGRESS.md`（模块挪入"已完成"），并在 `docs/page-registry.md` 更新对应屏状态。

> CI（`.github/workflows/ci.yml`）= 双质量门禁，PR 与 push 都跑、**必须全绿才能合并**：① 后端 `npm ci` + `prisma generate` + `build` + `test`；② 前端 `npm ci` + `tsc --noEmit` + `expo lint`。
> CD：master push 且门禁绿后，`build-artifacts` job 产出后端 `dist` 与前端 Web 静态站并上传为 artifact。项目无线上部署目标，CD 以"持续产出可部署产物"落地，不做自动发布。
> 已装 `gh` CLI：开 PR / 合并用 `gh pr create`、`gh pr merge`。gh 未做持久登录，靠本机 git 已存的凭据认证——`git credential fill` 取 token 设为 `GH_TOKEN` 环境变量后再调 gh。

## 14. 提交前自检与测试门禁（强制，防回归）

代码可以写错，但不能在"看起来没问题"的状态下被提交。下列由 AI / 人**强制**执行，不通过禁止提交：

### 14.1 提交前必须跑通
- 后端改动：在 `backend/` 跑 `npm run verify`（= `npm run build && npm test`）。
- 前端改动：在 `frontend/` 跑 `npx tsc --noEmit` 与 `npx expo lint`。
- 任一失败 → 先修复再提交，**不允许带着失败的构建 / 测试提交**。

### 14.2 改代码必须配套测试
- 新增功能、修 bug、改既有逻辑，**必须**新增 / 更新自动化测试覆盖其核心逻辑与回归点（例：签到时区边界、AI 的 SSE 解析、鉴权分支）。
- 后端测试用 Jest，放被测源码同目录、命名 `*.spec.ts`（`npm test` 自动发现）。
- 确实无法测的改动，要在提交信息 / PR 说明里写清原因。

### 14.3 本地门禁（pre-commit hook）
- 仓库内置 `.githooks/pre-commit`：按暂存改动自动跑对应子项目的构建 / 测试 / 类型检查，失败即拒绝提交。
- **每个 clone 启用一次**：`git config core.hooksPath .githooks`。
- 这是兜底；即便忘了启用 hook，14.1 / 14.2 仍是硬性要求。

### 14.4 CI 是最后防线，不是第一道
- 远端 GitHub Actions 双门禁再卡一道（见第 13 节），PR 必须全绿才能合并。
- 本地能跑的检查不要留给 CI 才发现。
