# PROGRESS.md — TripGo 项目进展

> 项目的"活文档"。每个 AI 会话**开始时读它、结束时更新它**（用法见 CLAUDE.md 第 12 / 14 节）。
> **真相来源是代码 + `git log`**，不是本文件的叙述。发现不一致，以代码为准并立刻订正这里。
> "已完成 / 进行中 / 下一步"三段定期剪枝：已完成的老条目合并成概述。

**最后更新：2026-06-09**（对账重写，见下方"对账说明"）

## 当前阶段

主体功能已大面积落地：后端 **17 个业务模块**、前端约 **37 个路由屏**均已存在并接入真实数据。本次（2026-06-09）补做三件硬骨头并修复了文档失真：① 后端真正实现 `ai` 模块（DeepSeek 代理 + SSE 流式），前端 AI 助手接真后端、删除假回复；② 签到改用 UTC+8 判定当天；③ 建立 Jest 测试 + CI/CD 双门禁 + pre-commit 提交门禁，并顺手修复了 master 已破损的后端构建（缺 `@types/bcryptjs`）。下一步推进 RAG、支付/线路/酒店等剩余接口、长尾静态页批量铺开。

## 对账说明（2026-06-09，为何本文件此前不可信）

此前 `PROGRESS.md` 内容停在 ~PR #42、`docs/page-registry.md` 停在 2026-05-22，而代码已到 **PR #65 / 135 commits**；且"AI 走后端代理 + RAG"在 CLAUDE.md / README 写着、后端却**没有** `ai` 模块（前端是纯假 AI）。本次按代码 + git 全面对账重写，并在 CLAUDE.md §12 / §14 加入**强制**的文档与测试门禁，防止再次漂移。

## 已完成（概述）

**基础设施 / 工程**
- 后端 NestJS + Prisma + SQLite 骨架：全局 PrismaModule、ValidationPipe、AllExceptionsFilter、TransformInterceptor（对 SSE/已发头响应放行）、Swagger `/docs`、`/health`；统一信封 `{code,message,data}`。
- 鉴权：JWT（JwtModule 全局），`common/` 提供 `JwtAuthGuard` / `OptionalJwtAuthGuard` / `@CurrentUser` / `@CurrentUserIdOptional`。
- **测试 + CI/CD（2026-06-09 新增）**：后端 Jest（`npm test` / `npm run verify`），GitHub Actions 双门禁（后端 build+test、前端 tsc+lint），master push 增 CD 产物 job（后端 dist + 前端 web export），`.githooks/pre-commit` 本地强制门禁。
- 文档体系：本文件 / README / `docs/page-registry.md`（67 页清单）。
- 前端 Expo + Expo Router + NativeWind + Zustand 骨架：跨端持久化（auth/onboarding，web=localStorage / 原生=SecureStore）、统一 `apiRequest`（解信封 + 401 自动登出）、**跨端 SSE 客户端 `lib/ai.ts`（新增）**、cssInterop Animated、legacy 图片打包解析、共享模板（StaticPage/List/Detail/Form）、自定义 LegacyTabBar。

**后端模块（17）**：auth、**ai（DeepSeek 代理 + SSE，新增）**、banners、scenic、quiz、destinations（文创）、orders、transactions、search、stories（社区，含可选鉴权点赞回填）、reviews、favorites、checkin（UTC+8）、leaderboard、messages、cultural、trips。

**前端屏（~37）**：启动/引导（index、hello、login1）、认证（login、register）、五 Tab（home、itinerary、community、mine + add 动作菜单）、search、scenic/[id]、guide/[city]、products、product/[id]、checkin、leaderboard、study、quiz/[id]、messages、settings、profile/edit、wallet、orders、collections、my/{trips,stories,likes}、trip/create、map（腾讯 GL + 离线兜底）、vr（Three.js 全景）、**ai/assistant（本次接真后端）**、cantonese、story/[id]、post/story。

**本次会话变更（2026-06-09）**
- `fix`：补 `@types/bcryptjs`，修复 master 后端 `npm run build` 失败（PR #65 换 bcryptjs 遗留）。
- `feat(ai)`：`backend/src/modules/ai`（`POST /ai/chat`、`POST /ai/plan`，SSE 流式代理 DeepSeek，密钥仅后端、无 key 优雅 503）；前端 `lib/ai.ts`（XMLHttpRequest 增量读 SSE）、`assistant.tsx` 改流式接真后端，**删除 `generateReply` / `generatePlan` 假逻辑**。
- `feat(checkin)`：`beijingDateKey()` 以 UTC+8 计算当天。
- `chore`：Jest + `jest.config.js`、CI 双门禁 + CD 产物、`.githooks/pre-commit`。
- `docs`：本文件 + page-registry 对账重写、CLAUDE.md §12/§14 硬条款。

## 进行中
> 格式：`[负责人] 模块/任务 — 起始时间`。开工前在此登记，防止多人多会话撞车。

- 暂无。

## 下一步（按优先级）
1. **配置 `DEEPSEEK_API_KEY`**（后端 `.env`）端到端联调 AI 对话 / 规划——当前无 key 时 `/ai/chat`、`/ai/plan` 返回 503，前端显示"AI 服务未配置"。
2. **RAG 模块**：基于已验证的 sqlite-vec spike（独立 better-sqlite3 连接），为 `ai` 模块加检索增强。
3. 后端剩余接口：线路规划、酒店、地址、翻译 + TTS（见 page-registry"需新增接口"表）。
4. 前端长尾静态屏（协议 / 隐私 / 非遗介绍等 ~14 屏）套 `StaticPage` 批量铺。
5. 补业务缺口：orders（价格信任客户端、未写流水/扣余额）、messages（假数据 → Prisma）、reviews/favorites（补 DTO 校验）。

## 已知问题 / 坑

> 已修旧条目已移除：bcrypt 高危依赖已于 #65 换 bcryptjs；后端构建缺类型已于本次修复。

- **AI 需配 `DEEPSEEK_API_KEY`**（后端 `.env`）才能真正对话；缺失时接口 503、前端提示"AI 服务未配置"。RAG / sqlite-vec 仍只是 spike，未建模块。
- 业务缺口（非阻塞、演示可用）：orders 价格由客户端传入且不校验商品、下单不写 Transaction / 不扣余额；messages 返回硬编码 DEMO 列表且非按用户；reviews / favorites 的 POST 用内联类型未走 DTO 校验；quiz 详情下发正确答案；my/stories、my/likes 前端全量过滤（后端无 `/stories/mine`、`/stories/liked`）；study / cantonese / collections / vr 场景为静态数据。
- Prisma 的 SQLite 引擎无法加载扩展，sqlite-vec 必须独立 better-sqlite3 连接（CLAUDE.md §7）；写 vec0 表 rowid 须用 `BigInt`。
- 地图腾讯 GL JS Key 为公开客户端 key（内置 demo key 兜底）；离线瓦片随 App 打包，改范围需重跑 `scripts/fetch-offline-tiles.js` 并 `expo start --clear`；GL 旋转需 3D viewMode。
- 前端既有 ~14 条 lint warnings（unused / require / hook-deps，非本次引入）；CI lint 不因 warning 失败，逐步清理。
- 前端 `expo-image-picker` 未装，发布故事只能选预置图。
- 历史 web 坑均已修（import.meta / NativeWind className / Image 尺寸 / Alert 不渲染 / SecureStore web / 深链接误跳），详见关键决策与 git 历史。

## 关键决策记录

> append-only，只增不改。每条写清"为什么"，让后续会话不必重新纠结。

- **2026-05-20** 后端选 NestJS + Prisma + SQLite：模块化专业感强、AI 易生成代码、SQLite 免部署便于评委开箱即用。
- **2026-05-20** RAG 向量存储选 sqlite-vec（非 pgvector）：保留 SQLite"免部署"卖点；pgvector 需要 PostgreSQL 服务，会毁掉该优势。
- **2026-05-20** 向量检索不走 Prisma：Prisma 的 SQLite 引擎不能加载扩展，改用独立 better-sqlite3 连接，与 Prisma 共用同一 `.db` 文件。
- **2026-05-20** 统一返回格式：成功 `{code:0,message:'ok',data}`，失败 `{code:<HTTP码>,message,data:null}`；SSE 流式接口不经过响应拦截器。
- **2026-05-20** 67 个页面"只多不能少"：数量锁死，打磨度作为变量——演示主线 ~12 屏深做，长尾 ~40 屏功能级即可。
- **2026-05-20** VR / 地图 / 支付等硬骨头屏：用 `react-native-webview` 套旧版 HTML 兜底，保计数、不沉成本。（注：map、VR 后续改为自研重写，见 05-22 条。）
- **2026-05-20** 团队 4 人、无专职后端、全栈、AI 24h：W1 由组长搭后端地基，之后按"垂直切片"推进。
- **2026-05-20** 5 个废弃草稿/测试页（index / itinerary2 / mine / top / wzfdemo）确认不重写，重写范围锁定 62 屏。
- **2026-05-20** 确立模块合并流程：feat 分支 → 子代理 code review → PR → CI 门禁 → 合并（见 CLAUDE.md 第 13 节）。
- **2026-05-20** 鉴权基础设施（JwtAuthGuard / @CurrentUser）放 `common/`、JwtModule 全局化：让后续模块零 import 即可用。
- **2026-05-20** 前端工程放 `frontend/`（非 `app/`）：避免与 Expo Router 自身的 `app/` 路由目录嵌成 `app/app/`。
- **2026-05-20** auth store 暂不做持久化（后改），sqlite-vec spike 通过，RAG 技术路线确认可行。
- **2026-05-21** 前端页面"全部像素级复刻 Legacy"，允许用 React/RN 做动画 / 性能 / 响应式优化；质量基线"只能比去年更好"。
- **2026-05-21** Legacy 资源迁移：图片全打包进 App，视频改由后端静态服务（`/static/`）。
- **2026-05-21** 开发 / 演示走 web（优先级：Android 模拟器 > web），不靠 Expo Go；web 预览必须可用。
- **2026-05-21** auth store 启用持久化（expo-secure-store → 后切跨端 `lib/persist-storage.ts`）。
- **2026-05-21** 第三方组件 className 统一走 `cssInterop` 返回值（`@/components/ui/animated`）。
- **2026-05-21** 前端用浏览器实测验收，不只 `tsc`/`expo export`。
- **2026-05-21** 启动流程：`/` → 首启 hello → login1 → login，完成后直达 login（`stores/onboarding`）。
- **2026-05-21** 引导/登录态用跨端存储（web=localStorage、原生=SecureStore）。
- **2026-05-21** 三个核心 Tab 接真后端（banners/scenic/quiz），图片字段存"本地资源 key"由 `lib/legacy-images.ts` 解析。
- **2026-05-21** 首页 / 个人中心在像素级复刻基础上做改版升级（属允许范围内的 RN 增强）。
- **2026-05-22** 社区打通完整闭环（stories 发布/详情/点赞/评论），后续加可选鉴权点赞回填。
- **2026-05-22** 发布配图用"精选本地素材多选"而非真图上传（无图片存储后端）。
- **2026-05-22** 旅行地图放弃"WebView 套旧版"，重写为真 React 屏：腾讯 GL JS + service 库客户端直连（去后端代理）+ 离线真瓦片兜底 + 罗盘旋转（3D viewMode）。
- **2026-06-09** **AI 落地为后端 `ai` 模块（DeepSeek 代理 + SSE）**：兑现 CLAUDE.md §8 与 page-registry 的"AI 收口后端、密钥不上前端"。`POST /ai/chat`（注入岭南旅游 system prompt）/ `POST /ai/plan`（行程规划），用 `@Res()` 手写 SSE 直透 DeepSeek 流、绕开 TransformInterceptor（拦截器对 event-stream/已发头响应放行）。前端弃 fetch 流（RN 不支持流式读），改用 XMLHttpRequest 增量读 SSE（跨端、无新依赖）；删除 `generateReply`/`generatePlan` 假 AI；无 key 时 503 优雅降级。
- **2026-06-09** **签到日界改 UTC+8**：`beijingDateKey()` 基于 epoch+8h 取 UTC 日期，与服务器时区无关，修正北京 0–8 点签到落到前一天的 bug。
- **2026-06-09** **建立测试 + CI/CD 门禁防回归**：后端引入 Jest（同目录 `*.spec.ts`），CI 升级为后端 build+test、前端 tsc+lint 双门禁，master push 增 CD 产物 job；新增 `.githooks/pre-commit` 本地强制门禁。起因：发现 master 构建已破损（缺 `@types/bcryptjs`）却被合并，旧 CI 没拦住。
- **2026-06-09** **文档强制同步**：CLAUDE.md §12/§14 把"会话结束更新 PROGRESS/page-registry"与"提交前跑通构建+测试、改代码必须配套测试"列为**硬性阻断**要求，根治文档落后代码的历史问题。
