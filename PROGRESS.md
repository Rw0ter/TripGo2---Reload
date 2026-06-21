# PROGRESS.md — TripGo 项目进展

> 项目的"活文档"。每个 AI 会话**开始时读它、结束时更新它**（用法见 CLAUDE.md 第 12 / 14 节）。
> **真相来源是代码 + `git log`**，不是本文件的叙述。发现不一致，以代码为准并立刻订正这里。

**最后更新：2026-06-17**（绿色低碳主题转型）

## 当前阶段

**2026-06-17：完成绿色低碳主题转型**。App 从非遗文化旅游全面转型为绿色低碳主题，贴合"绿色发展、国内大循环、新质生产力（人工智能+）"思政路线。后端新增 **Eco 模块**（19 个模块），Prisma Schema 扩展（carbonCredits/EcoActivity/tradeIn），RAG 知识库全部重写为绿色低碳内容（39 条），前端删除 study 页 → 新建 green 绿色行动页，排行榜/签到/产品/答题/社区/AI 全部重写为新主题，新增 AI 语音助手（Siri式悬浮球+语音识别+TTS+指令跳转），清理全部残留旅游引用。

## 已完成（概述）

**基础设施 / 工程**
- 后端 NestJS + Prisma + SQLite 骨架：全局 PrismaModule、ValidationPipe、AllExceptionsFilter、TransformInterceptor、Swagger `/docs`、`/health`；统一信封 `{code,message,data}`。
- 鉴权：JWT（JwtModule 全局），`common/` 提供 `JwtAuthGuard` / `OptionalJwtAuthGuard` / `@CurrentUser` / `@CurrentUserIdOptional`。
- 文档体系：PROGRESS.md / README / `docs/page-registry.md`（67 页清单）。
- 前端 Expo + Expo Router + NativeWind + Zustand 骨架。

**本次会话：绿色低碳主题转型（2026-06-17）**

### 后端改动
1. **Schema 扩展**：User 加 `carbonCredits`；新增 `EcoActivity` 模型；Order 加 `tradeIn`/`carbonCreditsAwarded` 字段。
2. **Eco 模块**：`GET /eco/status`、`POST /eco/plant`、`POST /eco/activity`、`GET /eco/progress`。
3. **Leaderboard 重写**：综合分排序 `(carbonCredits×10)+points`，分页 top100/20条/页。
4. **Orders 以旧换新**：tradeIn 字段 + 碳积分奖励（50/单）+ 流水记录。
5. **RAG 重写**：47 条知识全部替换为绿色低碳内容（eco_knowledge/green_living/eco_products）。
6. **AI Prompt 重写**：CHAT/PLAN/TRANSLATE 全部改为绿色低碳助手。
7. **Seed 全部替换**：产品/社区文章/轮播/答题/VR场景/文化内容。

### 前端改动
1. **删除 study 页**，新建 `green/` 绿色行动页（植树进度+碳积分+每日任务+7日趋势）。
2. **VR 场景** 6 个岭南场景 → 6 个绿色生态场景。
3. **排行榜** 完全重写：红金古风 → 绿色专业调色板 + 分页。
4. **产品页** 文创 → 生态良品（6 个新分类 + 40 个新商品）。
5. **签到页** 完全重写：专业商业级设计。
6. **答题页** 非遗问题 → 环保科学问题。
7. **社区** 8 篇非遗故事 → 8 篇绿色生活故事。
8. **AI 助手** 系统提示重写 + 建议话题更新。
9. **AI 语音助手**（全新功能）：Zustand store + 悬浮渐变球 + 语音识别 + SSE对话 + 指令JSON解析 + 导航跳转 + TTS朗读 + 多轮对话。
10. **全局文案更新**：home/mine/search/cantonese/community 等。

## 进行中
> 暂无。

## 下一步（按优先级）

1. 前端 type errors 清理（约 12 个 pre-existing TS 错误）
2. 全景图文件替换（vr-*.jpg 需替换为实际绿色主题全景图）
3. 生态良品图从网络加载改为本地资源

## 已知问题 / 坑

- RAG 需配 `DEEPSEEK_API_KEY` 后端 `.env`；缺失时 AI 接口 503。
- 前端 pre-existing TS 错误（react-native-markdown-display/expo-speech-recognition 类型声明缺失、Expo Router 类型化路由不完整）。
- 全景图文件仍为旧文件名（vr-gztower.jpg 等），需替换为实际绿色主题全景图。
- 生态良品图片当前指向无效路径（旧 wccpImg 路径不存在对应新图），前端有占位图兜底。

## 关键决策记录

- **2026-06-17** 绿色低碳主题转型：从非遗文化旅游全面转向绿色低碳，植入碳积分/环保活动/以旧换新/"人工智能+"语音助手，贴合"绿色发展+新质生产力"思政路线。策略：改进而非重写，最大化复用现有后端 API 与前端组件。
- **2026-06-17** 签到页设计原则：禁止大圆角、无意义渐变、默认配色；追求专业商业级而非 demo 感。
- **2026-06-17** AI 语音助手：Siri 式悬浮球 + Web Speech API / expo-speech-recognition 语音识别 + DeepSeek SSE 对话 + JSON 指令解析（open_page/buy/end）+ TTS 朗读 + 多轮对话。
- **2026-06-17** RAG 知识库重写：47 条旅游/非遗知识 → 39 条绿色低碳知识（环保科学/绿色生活/生态良品），embedding 模型不变（bge-small-zh-v1.5）。
- 此前关键决策见 git 历史（2026-05-20 ~ 2026-06-10）。
