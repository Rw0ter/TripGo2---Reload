# PROGRESS.md — TripGo 项目进展

> 项目的"活文档"。每个 AI 会话**开始时读它、结束时更新它**（用法见 CLAUDE.md 第 12 / 14 节）。
> **真相来源是代码 + `git log`**，不是本文件的叙述。发现不一致，以代码为准并立刻订正这里。
> "已完成 / 进行中 / 下一步"三段定期剪枝：已完成的老条目合并成概述。

**最后更新：2026-06-09**（对账重写，见下方"对账说明"）

## 当前阶段

主体功能已大面积落地：后端 **18 个业务模块**、前端约 **42 个路由屏**。本会话（2026-06-09）累计合并 **7 个 PR（#66–#72）**：① AI 后端模块（DeepSeek 代理 + SSE）+ 前端接入删假 AI；② 签到 UTC+8；③ Jest + CI/CD 双门禁 + pre-commit；④ 入参校验加固（reviews/favorites DTO）+ 后端筛选（/stories/mine、/stories/liked、DELETE /trips/:id）；⑤ orders 服务端定价 + 事务扣款 + 流水（杜绝 0 元下单）；⑥ quiz 服务端判分（防答案泄露）；⑦ RAG 知识库（本地 embedding + sqlite-vec，32 条，AI 检索增强，已真实联调）；⑧ 5 个法律/说明页 + 死链清理；⑨ study/cantonese 接 cultural。下一步：剩余占位屏真实化（见"下一步"）。

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
> Task 1（校验）/ Task 4（死链法律页）/ Task 5（AI+RAG）已完成；以下为剩余占位屏真实化（Task 2）与后端筛选零头（Task 3）。

1. **接已就绪后端（快）**：product/[id] 评论接 `GET /reviews?itemType=destination`、描述读 `Destination.description`（seed 需补文案）；collections 接 `GET/POST /favorites`（Favorite 缺 image/price 展示字段，需补字段或前端二次查引用对象）；vr 场景接 `GET /cultural?category=vr_scene`（需给 CulturalContent 加 image/panorama 字段 + seed）。
2. **需新建后端**：messages 建 `Message` 模型按 userId 隔离 + 标记已读；profile/edit 加 `PUT /auth/userinfo` + 头像上传；trip/create 编辑加 `PUT /trips/:id`；search 推荐（`/search/hot`、`/search/suggestions`、分页）。
3. **较大 / 需外部依赖**：scenic/[id] 与 guide/[city] 的价格/评分/时长/营业时间需 `Scenic` 大幅扩字段（评分可复用 reviews 聚合）；天气需新增 `GET /weather` 代理（**需外部天气 API key**）；checkin 每日任务/慈善需 `Task`/`Charity` 模型；钱包行程预算需 `Budget` 模型。

## 已知问题 / 坑

> 已修旧条目已移除：bcrypt 高危依赖已于 #65 换 bcryptjs；后端构建缺类型已于本次修复。

- **AI 需配 `DEEPSEEK_API_KEY`**（后端 `.env`）才能真正对话与 RAG 检索增强；缺失时接口 503。RAG 已落地（`modules/rag`，transformers.js + sqlite-vec），知识库数据在 dev.db（gitignore），**新环境需跑 `npm run rag:index` 灌库**。
- 剩余占位/假数据（待真实化，非阻塞，见"下一步"）：messages 后端 DEMO 列表非按用户；vr 场景列表 + 天气写死；scenic/[id]、guide/[city] 价格/评分/天气/时长本地派生；product 详情描述与评论硬编码（reviews 后端已就绪可接）；collections 硬编码（favorites 后端已就绪可接）；profile/edit 无 PUT 端点（本地兜底）；trip/create 无 PUT（不能编辑）；wallet 行程预算静态；checkin 每日任务/慈善本地。
- 已修（本会话）：orders 0 元下单、quiz 答案泄露、reviews/favorites 校验、stories/mine|liked、study/cantonese 接 cultural、wallet 流水路径。
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
- **2026-06-09（续）** 第二批连续推进，按聚焦 PR 合并（#67–#72）：入参校验加固（reviews/favorites DTO、orders $transaction 服务端定价、quiz 服务端判分）+ 后端筛选（/stories/mine|liked、DELETE /trips/:id）+ RAG + 法律页 + study/cantonese 接 cultural。每个 PR 走 feat 分支 → pre-commit 门禁 → CI 双门禁 → squash 合并。
- **2026-06-09（续）** RAG embedding 选**本地 transformers.js（bge-small-zh-v1.5，512 维）**：DeepSeek 无 embedding API，本地方案保留 SQLite"免部署"卖点、零额外 key；与 sqlite-vec 配合（独立 better-sqlite3 连接共用 dev.db）。
- **2026-06-09（续）** orders 改 `itemType+itemId` 服务端定价：移除客户端 price（杜绝 0 元下单），在 `$transaction` 内校验余额 → 扣 `User.balance` → 建订单 → 写 `Transaction` 流水；并给 `Scenic` 加 `price` 字段（支持景点预订定价）。
- **2026-06-09（续）** quiz `GET /quiz/:id` 剥离 answer + 新增 `/check`（逐题）`/submit`（服务端判分发积分），杜绝前端读答案作弊。
- **2026-06-09（续）** 占位屏真实化策略：cultural/reviews/favorites/transactions 后端已就绪的优先接已有接口；messages/profile/trip-edit/scenic 大扩/天气(需外部 key)/checkin 任务/budget 需新建后端模型，作为后续分批。
- **2026-06-09（续）** 搜索页（`search.tsx`）UI 改版：旧版青/薄荷渐变 + 粉价 + 直角文本卡与全 App 岭南风脱节（被判"太丑"），重做对齐 `home.tsx` 设计语言（森林绿渐变 Hero `#3E6B4F→#5C8A6D` + 米白 `#F4F1E4` + 暖金 `#D4A76A` + 圆角卡 + `FadeInDown`）。景点结果用 `resolveLegacyImage` 图片打底双列瀑布流；文创结果因 `wccpImg/*` 图未登记到 `legacy-images.ts`（会回退占位图），改暖色渐变 + 按 type 语义图标卡（不堆占位图）；排行榜加缩略图 + 金/银/铜奖牌。功能契约（自动聚焦 / 200ms 防抖建议 / 历史持久化+清空 / 猜你想搜 / 评分榜 / 结果跳转 / 空·载入态）全保留，并把 `saveHistory` 改函数式 `setState` 修掉连续搜索丢历史的闭包隐患。tsc + lint 绿；`expo export -p web` 后实测空闲态与搜索态 0 console 报错。设计经"三方案竞稿→评审→合成"产出。
- **2026-06-09（续）** 前端小修复批次（PR：ui-batch1）：① search 历史/建议下拉由正常流改 `position:absolute` 悬浮覆盖层（不占布局高度，Hero `zIndex:30` 压住主体面板）；② 首页轮播 `Carousel` 加 `onScroll`+`scrollEventThrottle`，手动滑动时实时更新指示器（原仅 `onMomentumScrollEnd`，不跟手）；③ **wccpImg 40 张文创真实图注册进 `legacy-images.ts`**——图早已打包在 `frontend/assets/legacy/img/wccpImg/` 但 key 未登记，故 products/search 文创一直显占位图；现 products(39 图)与 search 文创结果均显真实图、0 占位（web 导出 DOM 实测 placeholders=0）。search 文创结果卡同步由「图标渐变卡」改「真实图打底卡」。
- **2026-06-09（续）** 后端 + AI 批次（PR：ai-favorites-batch2）：
  ① **行程规划 AI 采纳出发地/目的地**（T5）：实测 bug——`/ai/plan` 把出发地当成游览城市（如「北京→潮州」生成「广州」行程）。根因有二：(a) 规划也注入 RAG 知识，KB 以广深为主、按目的地检索常召回他城内容，叠加「优先采用检索资料」把行程带偏；(b) `PLAN_SYSTEM_PROMPT` 用「岭南行程规划师 + ①②③④ 模板」重措辞触发模型「广州样板行程」先验。修法：规划**不再走 RAG**（只忠于表单）；`buildPlanPrompt` 改为**以目的地为请求主语**、出发地仅作来回交通；`PLAN_SYSTEM_PROMPT` 沿用 CHAT 同款「智能助手」轻框架。node(UTF-8) 实测北京→潮州 / 广州→汕头 / 上海→珠海 均正确（curl 测会因 Windows 壳层 mangle 中文产生假象，须用 UTF-8 客户端）。
  ② **故事收藏真实入库**（T9）：`Favorite` 通用表加 `itemType='story'`（DTO 放行）；`stories.findOne` 回填 `favorited`（按 userId+story 复合键查）；`story/[id].tsx` 收藏按钮接 `POST /favorites`（乐观更新 + 失败回滚），详情加载回填、可见态切换。E2E 实测：toggle→favorited:true 入库（/favorites 出现 story 行）→ reload 仍 true → toggle→false。collections.tsx（活动收藏静态 mock，数据形态不同）本次不动。
  ③ **AI 回复 markdown 渲染**（T4）：引入 `react-native-markdown-display`，`assistant.tsx` 对话气泡与行程结果改用其渲染（替换原手写 split 解析），统一岭南绿 markdown 样式。expo web 静态导出通过（含 SSR 预渲染）。
  > 附带：`ai.service.ts` 含一处既有本地改动（CHAT_SYSTEM_PROMPT 去掉「可适当使用 emoji」、「只回答」→「默认回答」），随本提交一并带上。
