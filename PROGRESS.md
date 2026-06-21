# PROGRESS.md — TripGo（绿途）项目进展

> 项目的"活文档"。每个 AI 会话**开始时读它、结束时更新它**（用法见 CLAUDE.md 第 12 / 14 节）。
> **真相来源是代码 + `git log`**，不是本文件的叙述。发现不一致，以代码为准并立刻订正这里。

**最后更新：2026-06-21**（四轮·AI 深度融合：助手输入修复 / 自动化节奏 / 场景感知 / 大厂级 system prompt / 离线本地模型兜底 / 灯带优化；分支 `feat/ai-deep-integration`。一~三轮已合并 PR #85、#86、#87、#88）

## 当前阶段

**2026-06-21：绿色低碳转型深化**。此前（06-17）的"绿色低碳转型"一直**未提交、压在工作区 4 天**；
本会话先把它安全落库并修绿 CI 基线，再围绕"蚂蚁森林式"主线深化重做多屏，全程开 `feat/green-deepening`
分支、增量提交、每次提交过 pre-commit 全量门禁（后端 build+test、前端 tsc+lint）。

## 已完成（概述）

**基础设施 / 工程**（历史，详见 git）
- 后端 NestJS + Prisma + SQLite；JWT 鉴权；统一信封；Swagger；CI 双门禁 + pre-commit hook。
- 前端 Expo Router + NativeWind + Zustand；RAG（sqlite-vec 本地 embedding）；AI(DeepSeek+SSE)。
- 本地 Piper TTS（后端 ai 模块，模型不入库）。

**一轮：绿色低碳转型深化（2026-06-21，分支 feat/green-deepening，已合并 PR #85）**
1. **落库 + 基线**：把未提交的绿色转型整体落库；修陈旧测试（ai plan prompt、orders 生态良品）、
   前端 TS/lint error，后端 55 测试全过、前端 0 error。`.gitignore` 挡住 400MB 本地 TTS 与 db-wal。
2. **改名**：全局「文脉粤游」→「绿途」（slug greentrip）；CLAUDE.md/AGENTS.md 同步主题 + 记录 TTS 约定。
3. **旗舰·行程 tab → 绿色能量森林**（蚂蚁森林**风格**，原创排版+CC0 真实卡通插画）：
   能量球收集动画、虚拟树成长、浇灌、今日任务、7 日减排、森林广场；接 `/eco/*` 完整打通积分/碳积分。底部 tab「行程」→「森林」。
4. **答题系统重构**：后端题库由非遗（粤剧/广绣…）换为绿色低碳/环保科学（4 卡×5 题，答案打散）+ 更新 spec；
   前端企业级答题/结果页（分段进度、对错动效、正确率环），离线兜底改绿色。**修了"绿色 quiz 落到通用兜底"的根因。**
5. **引导链**：login1 动画引导页贝塞尔(Easing.bezier)重写 + CC0 森林背景 Ken Burns；hello 询问页换绿色背景。
6. **认证页**：login/register/找回密码/重置 重做输入框/按钮/排版（森林背景+白色表单卡片），复用底层 auth 逻辑；
   新增 `(auth)/forgot` + 后端 `POST /auth/reset-password`（用户名+邮箱身份核验，无邮件服务）+ 测试。
7. **AI 语音助手深化**：新增 collect_energy / plant_tree 自动化指令（接 eco 积分）；原生 TTS(expo-speech)；
   去除助手文案 emoji + 调试日志；悬浮球/面板配色紫→绿。
8. **绿色地图**：map.tsx 由旅行地图重定位为绿色地图（回收点/充电站/公园/地铁/共享单车 快捷搜索），保留地图引擎。
9. 删除废弃 kokoro TTS 脚本。

**二轮：UI 高级感 + 沉浸式重排（2026-06-21，分支 feat/green-polish）**
1. **eco 补测试**：eco.service.spec（status/plant/recordActivity/progress，8 例），后端共 63 测试。
2. **AI 助手交互重构**：修覆盖层拦截正常点击（去全屏 dismiss、气泡 pointerEvents none、加关闭按钮）；
   自动化执行时页面四周 RGB 流光灯带（automating 状态 + VoiceAutomationGlow）。
3. **认证页大改版**：弃"大图+底部白卡"骨架 → 整屏沉浸森林 + 居中玻璃拟态表单（玻璃输入 + 辉光 CTA）。
4. **森林页沉浸式重排**：删顶部栏，整屏即场景，统计浮于天空 + 能量球环绕树 + 玻璃进度/底部 dock，无白卡流。

**三轮：登录玻璃化 / 助手增强 / 真实素材 / 景点详情（2026-06-21，分支 feat/green-polish-2）**
1. **登录** 外层边距 0.5→1.0rem，输入框透明度 0.9→0.45（更通透）。
2. **AI 助手**：气泡 box-none 恢复滚动 + 多轮历史可查看；resolveRoute 把中文页名/非精确路径归一化（修跳转失败）；
   prompt 强化 open_page；新增 query_profile/query_rank（查积分/碳积分/减排榜名次，复用 /leaderboard self）。
3. **真实景点照片**：24 张 Wikimedia 真实地点照（广州塔/丹霞山/虎门大桥/开平碉楼/七星岩/围龙屋…），
   repoint legacy-images.ts；CREDITS 记 CC-BY(-SA)/CC0 署名。
4. **VR 真实生态全景**：6 个等距 3840×1920 全景（神农架/西溪湿地/张家界/九寨沟 + 光伏/海上风电封面），
   并修复原 vr.tsx 引用全景文件不存在(全 404)的 bug。
5. **scenic 详情重构**：参考携程布局 → 快捷卡 + 标题/热度/榜单 + 信息胶囊 + 距离地图 + 分区，绿色地标主题。

**四轮：AI 深度融合 + 离线兜底（2026-06-21，分支 feat/ai-deep-integration）**
1. **修助手输入框无法输入**：`value={listening ? transcript : ''}` 强制清空 → 改为 `value={transcript}`（已截图验证）。
2. **自动化"看得见"**：执行指令时分步提示「正在为你打开「X」…」→ 跳转 →「[系统] 已到达「X」」，跳转放慢到 ~2s（不再一闪而过）。
3. **场景感知（深度融合）**：`usePathname` → `screenNameOf` 把"用户当前所在界面"作为上下文喂给 AI（不污染气泡），prompt 新增【场景感知】段。
4. **大厂级 system prompt 重写**：参考 docs 模板，CHAT/PLAN/TRANSLATE 全部改结构化（身份→表达规范→指令协议→场景感知→路由表→商品表→边界）；
   保留全部功能契约（命令/路由/商品ID/[系统]反馈/禁 emoji），并删掉 PLAN 残留的 📊📝 emoji + 修陈旧"岭南/粤语"注释。
5. **离线本地小模型兜底**：`ai.service` 抽 `buildProviders()`（DeepSeek 优先 → 本地 OpenAI 兼容端点），`streamChat` 改 `pipeProvider` 提供方轮询；
   无法 fetch DeepSeek（断网/无 key/上游错误）时自动回退本地（Ollama 等，`.env` 配 `LOCAL_AI_URL`/`LOCAL_AI_MODEL`）；translate 同步兜底；新增 2 个回退单测（后端共 65 测试过）。
6. **灯带优化**：VoiceAutomationGlow 三层（弥散柔光晕 + 过渡 + 清晰灯带 + boxShadow glow），RGB 每通道严格落 [30,185] 哑光霓虹；3.6s 缓转 + 呼吸（已 eval 验证渲染）。
7. **删加号菜单「规划行程」**：create-action-sheet 去掉「新建绿色计划」(/trip/create)，仅留发布故事 + AI 语音助手（已截图验证）。

## 进行中
- 暂无（四轮收尾：待提交、PR、过 CI、合并）。

## 下一步（按优先级）
1. **本批次剩余 3 项（下一轮）**：① 地图腾讯 GL 右上角指南针/控件与顶部搜索框 + 在线离线切换冲突、web 端定位补全；
   ② /home 顶部轮播+搜索框样式/逻辑重设计 + 上图下文功能按钮换联网真实图标；③ CI/CD 增加 APK 打包测试（正式进安卓）。
2. cultural 后端数据为非遗内容、study 页已删，已成孤儿——评估移除或改造。
3. 真机原生构建前确认 expo-speech-recognition 的 config plugin（CI 仅跑 web）。
4. 部分景点照片为 CC-BY(-SA)，已在 CREDITS 署名；如需更严格可换 CC0/PD。

## 已知问题 / 坑
- RAG / AI 需后端 `.env` 配 `DEEPSEEK_API_KEY`，缺失时 AI 接口 503。
- 后端本地 Piper TTS 依赖 `backend/tts/`（数百 MB，已 gitignore，不入库）；新环境需自放模型，缺失仅 TTS 降级。
- **素材获取**：子代理环境里 WebSearch/WebFetch 不可用（模型错误）；可靠链路是 `curl` + Pixabay API /
  Wikimedia/WordPress Photo Directory（CC0）。素材许可见各 `assets/images/*/CREDITS.md`。
- 前端 lint 余 ~12 个 warning（旧文件 unused/require 风格），非 error，不阻断 CI。
- Windows 上 git 会提示 LF→CRLF，无害。

## 关键决策记录
- **2026-06-21** 森林页复用现有 `/eco/*` 接口实现蚂蚁森林循环（能量=5 类绿色行为），**不加 schema**，降风险。
- **2026-06-21** 蚂蚁森林为**风格借鉴**，美术全用 CC0 开放授权真实素材自行组合，不抄袭支付宝版权资源。
- **2026-06-21** 找回密码无邮件服务，采用"用户名+注册邮箱"身份核验后直接重置，且不区分账号是否存在以防枚举。
- **2026-06-21** 行程 tab 直接承载森林主页（路由仍 `/itinerary`，不改路由降风险）；原 green/index informational 页保留为"绿色资讯"。
- **2026-06-21** 地图保留腾讯 GL 引擎，仅换内容/文案为绿色出行，避免重造地图能力。
- 此前关键决策（2026-05~06）见 git 历史与旧版本记录。
