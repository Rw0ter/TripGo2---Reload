# 页面清单表 — Legacy 67 页 → Expo 重写调度表

> 这是前端重写的总调度表。用法见 CLAUDE.md 第 12 / 14 节。
> 开工某页前，把"状态"列改成 `进行中(负责人名)`；完成后改 `完成`。**状态以代码为准**。
>
> **最后更新：2026-06-09**（对账重写：此前状态停在 2026-05-22、几乎全标"待开始"，与代码严重不符，已按 `frontend/app/**` 实况订正。）

## 汇总

- Legacy 共 **67** 个 HTML 文件；**5 个**废弃草稿/测试页不重写；实际需重写 **62 屏**（主线 26 / 长尾 36）。
- **进度（2026-06-09 对账）：约 30 / 62 屏已完成**（主线 ~16 完成 + ~2 部分；长尾 ~14 完成）。其余为长尾静态页（协议/隐私/非遗介绍）、线路规划、酒店、翻译、支付、找回密码等。
- 另有 Legacy 无对应的新增屏：`my/trips`（我的线路）、`my/stories`（我的故事）、`my/likes`（我的点赞），位于"我的"子页。
- 组件复用收敛：14 个协议/隐私/非遗介绍页 → 1 个 `StaticPage`；13 列表 → 1 套列表组件；9 详情 → 1 套详情；7 表单 → 1 套 `Form`。

## 需新增的后端接口（旧版没有）

| 接口 | 用于页面 | 状态（2026-06-09） |
|------|---------|------|
| 消息 / 通知 | message.html | ✅ `messages` 模块（GET /messages，当前为 DEMO 数据） |
| 收藏列表 | my_star.html | ✅ `favorites` 模块（GET/POST /favorites） |
| 精选目的地列表 | moreTrip.html | ✅ 复用 `destinations` |
| 钱包 / 流水 | wallet.html | 部分：`transactions` 模块提供流水；wallet 屏预算仍为静态兜底 |
| 线路规划 | xlgh / xlgh-xq / trip_moreinfo | ⛔ 待开始 |
| 景点 | hotTrip.html | ✅ `scenic` 模块 |
| 酒店 | hotel.html | ⛔ 待开始 |
| 翻译 + 语音 TTS | HK.html / Translate.html | 完成：cantonese 翻译器（文字/原生语音输入→粤语→TTS），后端 POST /ai/translate（DeepSeek）|
| **AI 对话 / 规划** | MCP / offline-ai / help | ✅ `ai` 模块（POST /ai/chat、/ai/plan，DeepSeek 代理 + SSE） |

## 高风险屏（W1 必须 spike）

- `VR Map.html` — ✅ 已自研 Three.js 全景屏（`app/vr.tsx`），未走 WebView 套旧版。
- `map.html` — ✅ 已重写为 React 屏（腾讯 GL JS + service 库 + 离线兜底地图）。
- `zhifu.html` — 支付为前端模拟、无真实网关，保持 mock（待重写为屏）。
- `MCP / offline-ai / help` — ✅ AI 已收口到后端 `ai` 代理 + SSE，密钥不上前端（前端 `app/ai/assistant.tsx` 已接入）。help 独立客服页未单独建。

---

## 主线屏（26）— 深做、打磨

| 文件 | 功能 | 类型 | 复用模式 | 依赖API | 状态 | 备注 |
|------|------|------|----------|---------|------|------|
| login.html | 账号登录 | 认证 | 单独实现 | auth | 完成 | Legacy 像素级复刻 |
| register.html | 账号注册 | 认证 | 单独实现 | auth | 完成 | Legacy 像素级复刻 |
| forget_sendEmail.html | 找回密码 | 认证 | Form组件 | auth | 待开始 | |
| hello.html | 欢迎 / 隐私协议确认 | 静态文本 | 单独实现 | 无 | 完成 | 滚动到底才可同意；仅首启展示 |
| index1.html | 首页（正式版） | 核心Tab | 单独实现 | banners/scenic/quiz | 完成 | `(tabs)/home.tsx`，接后端 + 改版升级 |
| fywh.html | 首页·非遗文化 Tab | 核心Tab | 单独实现 | search 等 | 待开始 | 与 index1 关系待理清 |
| itinerary.html | 行程 Tab | 核心Tab | 单独实现 | scenic | 完成 | `(tabs)/itinerary.tsx`，接后端 POI |
| mine1.html | 我的 Tab（正式版） | 核心Tab | 单独实现 | auth | 完成 | `(tabs)/mine.tsx`，接 authStore + 改版 |
| bianji.html | 编辑个人信息 | 表单 | Form组件 | auth | 完成 | `profile/edit.tsx`；PUT /auth/userinfo 失败有本地兜底，头像占位 |
| search.html | 智能搜索 | 列表 | 单独实现 | search | 完成 | `search.tsx` 搜索工具式独立排版（搜索框即主角 + 悬浮历史/建议覆盖层 + 热搜榜 TOP10 编号榜 + 猜你想搜 chip；结果景点/文创真实图卡跳详情）；不沿用首页骨架 |
| activity.html | 搜索结果列表 | 列表 | 列表组件 | search | 完成 | 已并入 `search.tsx` 结果区 |
| chanpin.html | 文创产品列表 | 列表 | 单独实现 | destinations | 完成 | `products.tsx` 电商目录式独立排版（左侧竖向分类导航栏 + 右侧商品网格 + 综合/销量/价格排序，真实图/¥红价/已售，跳 /product/[id]）；不沿用首页瀑布流骨架 |
| wccp_info.html | 文创产品详情 | 详情 | 详情组件 | destinations, orders | 完成 | `product/[id].tsx`，下单 POST /orders（评论/详情部分硬编码） |
| xq.html | 景点详情 | 详情 | 详情组件 | scenic, orders | 完成 | `scenic/[id].tsx`（价格/天气等本地派生） |
| hotTrip.html | 城市攻略 / 景点列表 | 详情 | 详情组件 | scenic | 完成 | `guide/[city].tsx`，接 GET /scenic?city= |
| MCP.html | AI 智能行程规划 | AI | 单独实现 | ai | 完成 | `ai/assistant.tsx` 规划模式，POST /ai/plan（SSE）；行程以目的地为主语（修出发地被当成游览城市的 bug），结果用 markdown 渲染 |
| offline-ai.html | AI 研学对话 | AI | 单独实现 | ai | 完成 | 并入 `ai/assistant.tsx` 对话模式，POST /ai/chat（SSE）；回复用 react-native-markdown-display 渲染 |
| map.html | 旅行地图 | 地图VR | 单独实现 | 腾讯GL SDK | 完成 | `map.tsx`，在线 GL + 离线兜底 |
| ksgh.html | 线路规划表单 | 表单 | Form组件 | trips | 部分 | `trip/create.tsx` 提供新建行程；完整线路规划待做 |
| xlgh.html | 线路规划结果列表 | 列表 | 列表组件 | 新增:线路 | 待开始 | |
| xlgh-xq.html | 线路详情 | 详情 | 详情组件 | 新增:线路 | 待开始 | |
| itinerary-xq.html | 旅行产品 / 线路详情 | 详情 | 详情组件 | orders, destinations | 待开始 | |
| trip_moreinfo.html | 行程 / 线路详情 | 详情 | 详情组件 | 新增:线路 | 待开始 | |
| qrdd.html | 确认订单 | 详情 | 详情组件 | orders, auth | 待开始 | 当前下单直接 POST /orders，无独立确认页 |
| dingdan.html | 我的订单列表 | 列表 | 列表组件 | orders | 完成 | `orders.tsx`，按状态筛选（底部操作为展示态） |
| zhifu.html | 在线支付（模拟） | 复杂屏 | 单独实现 | orders, auth | 待开始 | 保持 mock |

## 长尾屏（36）— 功能正确即可

| 文件 | 功能 | 类型 | 复用模式 | 依赖API | 状态 | 备注 |
|------|------|------|----------|---------|------|------|
| login1.html | 启动闪屏 | 动画屏 | 单独实现 | 无 | 完成 | 复刻启动动画，仅首启展示 |
| welcome.html | 启动欢迎页 | 静态文本 | 单独实现 | 无 | 待开始 | 可用 Expo SplashScreen |
| resetPW.html | 重置密码 | 认证 | Form组件 | auth | 待开始 | |
| about_us.html | 关于我们 | 静态文本 | StaticPage组件 | 无 | 完成 | `app/about_us.tsx`，数据驱动 StaticPage（#71） |
| xieyi.html | 用户服务协议 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| yonghuxieyi.html | 用户协议 | 静态文本 | StaticPage组件 | 无 | 完成 | `app/yonghuxieyi.tsx`，采用 xieyi 服务协议文案（#71） |
| yinsi.html | 隐私政策 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| yinsizhengce.html | 隐私政策 | 静态文本 | StaticPage组件 | 无 | 完成 | `app/yinsizhengce.tsx`（#71）；另含新撰 `app/permissions.tsx` 应用权限说明 |
| shequguifan.html | 社区规范 | 静态文本 | StaticPage组件 | 无 | 完成 | `app/shequguifan.tsx`（#71） |
| help.html | AI 智能客服 | AI | 单独实现 | ai | 待开始 | 可复用 ai 模块；独立客服页未建 |
| ctjy.html | 广东传统技艺介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| ctxj.html | 广东传统戏剧介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| jianzhi.html | 剪纸非遗介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| pyx.html | 皮影戏非遗介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| mjms.html | 广东传统美术介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | 内嵌视频 |
| yueju.html | 粤剧非遗详情 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| zhenjiu.html | 岭南针灸非遗详情 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| study.html | 学习非遗聚合页 | 列表 | 列表组件 | cultural | 完成 | `study.tsx` 中国红编辑式改版（概览横条 + 今日精选大卡 + 冷知识轮换 + 真实图名录瀑布流 + 近期活动 + 测验 CTA，照片优先/去图标圆），GET /cultural?category=topic |
| fyxq.html | 非遗详情 | 详情 | 详情组件 | cultural | 完成 | `study/[id].tsx` 富内容详情（封面 hero + 历史渊源 + 艺术特色清单 + 多图画廊灯箱 + 冷知识卡 + 答题 CTA），GET /cultural/:id；topic content 扩 image/gallery/intro/history/highlights/funFact |
| community.html | 社区动态流 | 复杂屏 | 单独实现 | stories | 完成 | `(tabs)/community.tsx` |
| Trip_Story.html | 社区故事详情 | 详情 | 单独实现 | stories, auth, favorites | 完成 | `story/[id].tsx`，点赞 + 评论 + 收藏（真实入库：POST /favorites itemType=story，详情回填 favorited） |
| add.html | 发布社区动态 | 表单 | 单独实现 | stories, auth | 完成 | `post/story.tsx`（仅预置图） |
| message.html | 消息中心 | 列表 | 列表组件 | messages | 完成 | `messages.tsx`（DEMO 数据，非按用户） |
| my_star.html | 收藏列表 | 列表 | 列表组件 | favorites | 完成 | `collections.tsx`（活动收藏，当前静态） |
| history.html | 研学答题系统 | 复杂屏 | 单独实现 | quiz, auth(积分) | 完成 | `quiz/[id].tsx`，含离线兜底题库 |
| top_list.html | 积分排行榜 | 列表 | 列表组件 | leaderboard | 完成 | `leaderboard.tsx` |
| qd.html | 签到福利中心 | 表单 | 单独实现 | checkin, auth | 完成 | `checkin.tsx`；签到按 UTC+8 判定当天 |
| wallet.html | 钱包 / 流水 | 列表 | 列表组件 | transactions | 完成 | `wallet.tsx`（流水接后端，预算静态兜底） |
| moreTrip.html | 精选目的地列表 | 列表 | 列表组件 | destinations | 待开始 | |
| settings.html | 设置页 | 列表 | 单独实现 | auth | 完成 | `settings.tsx`（5 个法律页为死链，待补 StaticPage） |
| create_addr.html | 添加新地址 | 表单 | Form组件 | 新增:地址 | 待开始 | |
| wlxx.html | 地址管理列表 | 列表 | 列表组件 | 新增:地址 | 待开始 | |
| hotel.html | 酒店预订表单 | 表单 | Form组件 | 新增:酒店 | 待开始 | |
| HK.html | 粤语课堂（翻译器）| AI | 单独实现 | ai, cultural | 完成 | `cantonese.tsx` 双面板翻译器式独立排版（普通话输入面板 + 译/换向 + 粤语译文面板 + 朗读 + 横滑常用语）：文字/原生语音 STT → POST /ai/translate → expo-speech TTS。原生语音需 dev build；不沿用首页骨架 |
| Translate.html | 中译英翻译 | AI | 单独实现 | 新增:翻译 | 待开始 | 可接 ai 模块 |
| VR Map.html | VR 全景浏览 | 地图VR | 单独实现 | 无 | 完成 | `vr.tsx`，自研 Three.js 全景（非 WebView）；修复「一直全景加载中」（TextureLoader onLoad 回调错位）+ three.js 改本地静态 + 6 场景真实等距 360 全景图（~2MB，Wikimedia） |

## 废弃草稿 / 测试页（5）— 不重写（2026-05-20 确认）

| 文件 | 说明 | 被谁取代 |
|------|------|---------|
| index.html | 旧首页设计稿 | index1.html |
| itinerary2.html | 行程时间轴设计稿 | itinerary.html |
| mine.html | 旧"我的"页 | mine1.html |
| top.html | CSS 效果演示页 | — |
| wzfdemo.html | 空白测试页 | — |

---

## 系统性观察

1. **三组草稿/正式重复**：只重写正式版（index1 / itinerary / mine1）。
2. **静态模板高度重叠**：14 个协议/隐私/非遗介绍页可由单个 `StaticPage` 覆盖——这是长尾完成率的主要缺口，下一步批量铺。
3. **多个旧版未接后端的屏已补接口**：消息（messages）、收藏（favorites）、景点（scenic）、精选（destinations）已建；线路、酒店、翻译仍待。
4. **AI 接入已整改**：MCP / offline-ai 已收口到后端 `ai` 代理 + SSE，密钥不上前端；前端假 AI 已删除。help（客服）与 Translate（翻译）可复用同一 `ai` 模块，尚未单独建屏。
