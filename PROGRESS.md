# PROGRESS.md — TripGo 项目进展

> 项目的"活文档"。每个 AI 会话**开始时读它、结束时更新它**（用法见 CLAUDE.md 第 12 节）。
> "已完成 / 进行中 / 下一步"三段要定期剪枝，别让文档越长越没人读。

**最后更新：2026-05-21**

## 当前阶段

W2。底部 5 个 Tab 中 home / itinerary / mine 三屏已复刻、接真后端，home 与个人中心并做了改版升级 —— PR #1–#22 均已合并、均浏览器实测通过。下一步：复刻剩余核心 Tab（community 社区、add 发布），并按 auth 模板补对应后端模块。

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
- 方案 A：「添加」tab 改为创建动作菜单（PR #3，子代理 review + CI 通过）
- sqlite-vec 风险 spike 通过：扩展加载 + vec0 写入 + top-k 检索全部正常（better-sqlite3 12 + sqlite-vec 0.1.9）
- 后端 destinations 文创产品模块（PR #5）+ `prisma/seed.ts` 迁移 Legacy 文创数据
- 前端 API 层（`frontend/api/`，后端地址走配置不硬编码）
- auth store 接入持久化：Zustand `persist` + `expo-secure-store`（token 落地）
- 登录 / 注册 / hello 三屏：先功能版（PR #6/#7）后按 Legacy 像素级复刻（PR #9）—— beijing 背景、渐变胶囊按钮、白色圆角输入框、对应图标
- 复用组件 `components/auth/`：auth-screen-layout / auth-input / auth-button；颜色单一来源 `constants/colors.ts`
- Legacy 图片资源迁移到 `frontend/assets/legacy/img/`（~460 文件，全打包进 App）；非遗视频改由后端静态服务（`backend/static/`，`/static/` 前缀）
- 启动路由：`/` 重定向到 hello 引导页（PR #10）；首页 tab 路由从 `index` 改名 `home`
- web 预览修复（PR #11）：`babel-preset-expo` 加 `unstable_transformImportMeta`，转译 Expo SDK 54 web 产物里的 `import.meta`，消除浏览器白屏
- auth 三屏 web 布局修复（PR #12）：NativeWind 不给非核心组件启用 className —— 新增 `components/ui/animated.ts`（cssInterop 包装 reanimated 的 Animated.*），屏幕改从此处取 `Animated`；`<Image>` 尺寸改走 `style` prop；修正被错误迁移覆盖的 `beijing.png`/`dingwei.png`。三屏已在浏览器实测渲染正确
- 首启引导流程（PR #13）：① 登录页问候语柔光 + 去输入框聚焦描边；② hello 隐私协议页卡片式重构 + 滚动到底才可同意；③ 新增 `app/login1.tsx` 复刻 Legacy 启动动画；④ 新增 `stores/onboarding.ts` 跨端持久化引导标记，`/` 引导感知路由 —— 首启 hello→login1→login，完成后直达 login，hello/login1 仅首启各展示一次。全流程浏览器实测通过
- index1 首页复刻（PR #14）：`app/(tabs)/home.tsx` 按 Legacy 还原——分段控件 + 搜索 + 轮播 + 四宫格/五入口 + 知识小课堂答题卡 + 景点大横卡 + 景点瀑布流，区块带进场动画。入口目标页未建，先「敬请期待」占位
- login1 裁剪溢出修复（PR #15）；底部导航栏复刻（PR #16）：新增 `components/legacy-tab-bar.tsx` 自定义 tabBar 100% 复刻 Legacy `.mui-bar-tab`（白底 + PNG 图标 + 激活态 _ac 图/绿字/呼吸），`animation:'shift'` 实现 tab 切换横向过渡
- mine1 我的 + itinerary 行程 两个核心 Tab 复刻（PR #17）：`(tabs)/mine.tsx`（资料卡接 useAuthStore + 钱包券包 + 订单 + 更多服务）、`(tabs)/itinerary.tsx`（智能行程入口 + 线路规划地图 + 城市精选 POI）。新增 `lib/coming-soon.ts` 统一占位提示
- 三个核心 Tab 接真后端（PR #18/#19/#20）：新增后端只读模块 `banners` / `scenic` / `quiz`；schema 加 `Banner.title/subtitle`、`Scenic.section`、`User.balance/couponCount`；`prisma/seed.ts` 灌入轮播 / 景点 / 知识课堂演示数据；前端 home / itinerary / mine 三屏改为 `apiRequest` 拉真实数据，图片字段存"本地资源 key"由 `lib/legacy-images.ts` 解析。PR #20 顺带修复 web 登录崩溃 —— 新增 `lib/persist-storage.ts` 跨端存储（web=localStorage / 原生=SecureStore），`auth` store 切到此存储
- 首页改版（PR #21）：绿渐变头部 + 高清广东城市轮播（4 图，4s 自动轮播 + 翻页 + 动画圆点）+ 卡片化入口宫格 + 知识小课堂 / 热门景点横滑 + 高低落差双列瀑布流（按较矮列优先分配 `MASONRY_HEIGHTS`）；精简 `lib/legacy-images.ts` 注册表至在用 key
- 个人中心改版（PR #22）：渐变 hero 头部（右上角图标换 `Ionicons` 的 `notifications-outline` / `settings-outline`）+ 等级徽章 + 成长值进度条 + 钱包 / 券 / 积分资产卡（上浮压渐变）+ 卡片化「我的订单」「更多服务」+ 退出登录按钮

## 进行中

> 格式：`[负责人] 模块/任务 — 起始时间`。开工前在此登记，防止多人多会话撞车。

- 暂无

## 下一步（按优先级）

1. frontend：核心 Tab 还剩 community 社区 + add 发布；itinerary 的「添加行程」日历子页待补；之后继续主线详情/列表屏
2. backend：按 auth 模板推进 trips / orders / stories 等模块（配合前端垂直切片）
3. frontend：协议 / 隐私 / 非遗介绍等长尾屏套共享组件批量铺
4. RAG 模块：基于已验证的 sqlite-vec 方案搭建（后续）

## 已知问题 / 坑

- Prisma 的 SQLite 引擎无法加载扩展，sqlite-vec 必须走独立 `better-sqlite3` 连接（CLAUDE.md 第 7 节）。
- `VR Map` / `map` / `zhifu` / `offline-ai` 计划用 WebView 套旧版页面兜底，方案尚未验证。
- 旧版 11 屏未接后端、用假数据，重写需新增接口：消息 / 收藏 / 钱包 / 线路 / 景点 / 酒店 / 翻译+TTS（见 `docs/page-registry.md`）。
- `npm install` 报告 2 个 high severity 漏洞，位于 bcrypt 的旧 node-pre-gyp 依赖链；暂不阻塞，后续可评估改用纯 JS 的 bcryptjs。
- sqlite-vec 写 vec0 表时 rowid 必须用 `BigInt` 传入：better-sqlite3 会把普通 JS number 绑成浮点，sqlite-vec 拒绝非整数主键（spike 已踩，参考 `backend/scripts/sqlite-vec-spike.js`）。
- web 端 `import.meta` 报错（已修，PR #11）：Expo SDK 54 web 产物多处用 `import.meta`，浏览器 classic script 不支持 → 整页白屏。修法是 `babel.config.js` 给 `babel-preset-expo` 加 `unstable_transformImportMeta: true`。注意项目 `babel.config.js` 的 `plugins` 不作用于 node_modules，所以 `babel-plugin-transform-import-meta` 那条路走不通。
- NativeWind 只给 RN 核心组件启用 className（已修，PR #12）：`Animated.View`（reanimated）/`SafeAreaView` 等第三方组件的 className 被静默丢弃。约定见 CLAUDE.md §9——动画组件从 `@/components/ui/animated` 取。`cssInterop` 全局副作用注册**不能**让内联 `<Animated.View>` 生效，必须用 `cssInterop` 的**返回值**组件。
- `<Image>` 用 className 设宽高在 web 失效（已修，PR #12）：react-native-web 用图片原始尺寸的内联 style 覆盖 className。宽高一律走 `style` prop（CLAUDE.md §9）。
- Legacy 图片迁移曾有错配（已修，PR #12）：迁移时 `tripgo-backend/resources/img/` 覆盖了 `public/img/`，`beijing.png`/`dingwei.png` 被换错。`public/img/` 才是前端图片的唯一来源，已重新同步并核对一致。
- web 登录崩溃 `setValueWithKeyAsync is not a function`（已修，PR #20）：`auth` store 直接用 `expo-secure-store`，该库不支持 web。修法是新增 `lib/persist-storage.ts` 跨端存储（web=localStorage / 原生=SecureStore）。
- 非首个 tab 的深链接会被拦截跳登录（已修，PR #25）：深链接非首 tab 时，`index.tsx` 作为根 Stack 锚点被挂载，其 `<Redirect>` 在 mount 时即触发跳转。修法是改用 `useFocusEffect`——只在 `index` 自身被聚焦时才跳转。
- `Alert.alert` 在 react-native-web 上不渲染（已修，PR #25）：注册成功后的跳转写在 `Alert` 按钮的 `onPress` 里，web 端 Alert 是 no-op → 注册"走不通"。约定：auth 等关键反馈不能依赖 `Alert`，用行内错误/直接跳转。`comingSoon` 仍用 Alert，web 端同样静默——后续可统一换成跨端轻提示。

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
- **2026-05-20** sqlite-vec spike 通过：扩展加载 / vec0 写入 / top-k 检索均 OK，RAG 技术路线确认可行，最大风险点解除。
- **2026-05-21** 前端页面"全部像素级复刻 Legacy"：62 屏的布局 / 样式 / 图标照 Legacy 还原，允许用 React/RN 特性做动画 / 性能 / 响应式优化。质量基线"只能比去年更好不能更差"。
- **2026-05-21** Legacy 资源迁移：图片全打包进 App（`frontend/assets/legacy/img/`），视频体积大改由后端静态服务。
- **2026-05-21** 开发与非正规演示均走 web，运行优先级：虚拟机（Android 模拟器）第一、web 第二；项目不会在真机或评委机上跑。故 web 预览必须可用，不能用 Expo Go 兜底。
- **2026-05-21** auth store 启用持久化：用 `expo-secure-store` 落地 token（兑现 2026-05-20"待登录屏接入时再加"的推迟项）。
- **2026-05-21** 第三方组件用 className 统一走 `cssInterop` 返回值：reanimated `Animated.*` 等不在 NativeWind 白名单内，全局副作用注册无效，必须导出包装后的组件（`@/components/ui/animated`）。后续 60 屏都走这个 `Animated`，避免每屏踩坑。
- **2026-05-21** 前端用浏览器实测验收，不只 `tsc`/`expo export`：本次布局错乱 tsc 与 export 全过，问题只在运行时可见。屏级改动应起 dev server 截图核对。
- **2026-05-21** 启动流程定为 `/` → 首启 hello → login1 → login、完成后 `/` 直达 login：hello（隐私协议）与 login1（启动动画）仅首启各展示一次，用 `stores/onboarding.ts` 的 `done` 标记控制，在 hello 点「同意」时落库。
- **2026-05-21** 引导标记用跨端存储（web=localStorage，原生=SecureStore）：`expo-secure-store` 不支持 web，而本项目开发/演示走 web，必须保证 web 端也能持久化。注：现有 `auth.ts` 仍纯用 SecureStore，web 端登录态不持久化——后续可同样切到跨端存储。
- **2026-05-21** `auth` store 切到跨端存储：兑现上一条"后续切跨端"的推迟项——`expo-secure-store` 在 web 直接崩溃（`setValueWithKeyAsync is not a function`），把跨端逻辑统一抽到 `lib/persist-storage.ts`，`auth` 与 `onboarding` 两个 store 共用，web 端登录态自此持久化。
- **2026-05-21** 三个核心 Tab 接真后端：home / itinerary / mine 全部改为拉后端数据（PR #18-20），后端新增 `banners` / `scenic` / `quiz` 三个只读模块，演示数据走 `prisma/seed.ts`。前端图片字段存"本地资源 key"，由 `lib/legacy-images.ts` 的 `resolveLegacyImage` 解析为打包资源——图片不走网络，避免后端托管大量图。
- **2026-05-21** 首页 / 个人中心在像素级复刻基础上做改版升级（PR #21/#22）：质量基线"只能比去年更好"，故在 Legacy 结构上重做配色分层、高清城市轮播、高低落差瀑布流、渐变 hero 等——属允许范围内的 RN 增强，不算偏离复刻。
