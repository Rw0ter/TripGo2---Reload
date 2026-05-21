# 页面清单表 — Legacy 67 页 → Expo 重写调度表

> 这是前端重写的总调度表。用法见 CLAUDE.md 第 12 节。
> 开工某页前，把"状态"列改成 `进行中(负责人名)`；完成后改 `完成`。
>
> **最后更新：2026-05-21**

## 汇总

- Legacy 共 **67** 个 HTML 文件。
- 其中 **5 个是废弃草稿 / 测试页**（已确认不重写，详见末尾）。
- 实际需重写 **62 屏**：主线 **26** / 长尾 **36**。
- 经组件复用进一步收敛：
  - **14** 个协议 / 隐私 / 非遗介绍页 → 1 个数据驱动 `StaticPage` 组件
  - **13** 个列表页 → 1 套 `列表` 组件
  - **9** 个详情页 → 1 套 `详情` 组件
  - **7** 个表单页 → 1 套 `Form` 组件
  - 真正"从零写"的独立屏约 **20** 个，其余 ~42 屏是套模板填数据。

## 需新增的后端接口（旧版没有）

| 接口 | 用于页面 |
|------|---------|
| 消息 / 通知 | message.html |
| 收藏列表 | my_star.html |
| 精选目的地列表（或复用 destinations） | moreTrip.html |
| 钱包 / 流水 | wallet.html |
| 线路规划 | xlgh / xlgh-xq / trip_moreinfo |
| 景点 | hotTrip.html |
| 酒店 | hotel.html |
| 翻译 + 语音 TTS（收口到后端，替代旧版 127.0.0.1:5000） | HK.html / Translate.html |

## 高风险屏（W1 必须 spike）

- `VR Map.html` — VR 全景，WebView 套旧版页面。
- `map.html` — 腾讯地图，WebView 套旧版页面。
- `zhifu.html` — 支付为前端模拟，无真实网关，保持 mock。
- `MCP / offline-ai / help` — AI 必须收口到后端代理 + SSE，密钥不上前端。

---

## 主线屏（26）— 深做、打磨

| 文件 | 功能 | 类型 | 复用模式 | 依赖API | 状态 | 备注 |
|------|------|------|----------|---------|------|------|
| login.html | 账号登录 | 认证 | 单独实现 | auth | 完成 | Legacy 像素级复刻；成功跳首页 |
| register.html | 账号注册 | 认证 | 单独实现 | auth | 完成 | Legacy 像素级复刻 |
| forget_sendEmail.html | 找回密码（邮箱+图形验证码） | 认证 | Form组件 | auth | 待开始 | |
| hello.html | 欢迎页 / 隐私协议确认 | 静态文本 | 单独实现 | 无 | 完成 | 卡片式重构 + 滚动到底才可同意；仅首启展示一次 |
| index1.html | 首页（正式版） | 核心Tab | 单独实现 | banners/scenic/quiz | 完成 | 底部导航主屏；已接后端 + 改版升级（高清城市轮播 + 高低落差瀑布流）；入口目标页未建先占位 |
| fywh.html | 首页·非遗文化 Tab | 核心Tab | 单独实现 | search 等 | 待开始 | 与 index1 首页关系待理清 |
| itinerary.html | 行程 Tab | 核心Tab | 单独实现 | scenic | 完成 | 已复刻 + 接后端（城市精选 POI）；「添加行程」日历/时间轴子页待后续单独做 |
| mine1.html | 我的 Tab（正式版） | 核心Tab | 单独实现 | auth | 完成 | 底部导航；接 useAuthStore（含钱包/券包）+ 改版升级（渐变 hero + 资产卡）；入口目标页未建先占位 |
| bianji.html | 编辑个人信息 | 表单 | Form组件 | auth | 待开始 | 头像走 /auth/avatar |
| search.html | 智能搜索 | 列表 | 列表组件 | search | 待开始 | 结果跳 trip_moreinfo |
| activity.html | 搜索结果列表 | 列表 | 列表组件 | search | 待开始 | 旧版硬编码，须接 search |
| chanpin.html | 文创产品列表 | 列表 | 列表组件 | destinations | 待开始 | |
| wccp_info.html | 文创产品详情 | 详情 | 详情组件 | destinations, auth, orders | 待开始 | 下单跳 qrdd |
| xq.html | 景点详情 | 详情 | 详情组件 | destinations, orders | 待开始 | 下单跳 zhifu |
| hotTrip.html | 热门景点详情列表 | 详情 | 详情组件 | 新增:景点 | 待开始 | 旧版硬编码 |
| MCP.html | AI 智能行程规划 | AI | 单独实现 | ai | 待开始 | 须改后端代理 + SSE |
| offline-ai.html | AI 研学对话 | AI | 单独实现 | ai | 待开始 | 须改后端代理 + SSE |
| map.html | 腾讯地图 / POI / 路线 | 地图VR | WebView套旧版 | mapsearch | 待开始 | W1 spike |
| ksgh.html | 线路规划表单 | 表单 | Form组件 | 无 | 待开始 | 提交跳 xlgh |
| xlgh.html | 线路规划结果列表 | 列表 | 列表组件 | 新增:线路 | 待开始 | 旧版硬编码 routes |
| xlgh-xq.html | 线路详情 | 详情 | 详情组件 | 新增:线路 | 待开始 | 旧版数据来自 URL query |
| itinerary-xq.html | 旅行产品 / 线路详情 | 详情 | 详情组件 | orders, destinations | 待开始 | 下单 /orders/trip |
| trip_moreinfo.html | 行程 / 线路详情 | 详情 | 详情组件 | 新增:线路 | 待开始 | 旧版用 sessionStorage |
| qrdd.html | 确认订单 | 详情 | 详情组件 | orders, auth | 待开始 | 跳 zhifu |
| dingdan.html | 我的订单列表 | 列表 | 列表组件 | orders | 待开始 | |
| zhifu.html | 在线支付（模拟） | 复杂屏 | 单独实现 | orders, auth | 待开始 | 无真实网关，保持 mock |

## 长尾屏（36）— 功能正确即可

| 文件 | 功能 | 类型 | 复用模式 | 依赖API | 状态 | 备注 |
|------|------|------|----------|---------|------|------|
| login1.html | 启动闪屏 | 动画屏 | 单独实现 | 无 | 完成 | 复刻 Legacy 启动动画（流动绿渐变+粒子+发光标题+加载环）；引导仅首启展示一次 |
| welcome.html | 启动欢迎页（倒计时） | 静态文本 | 单独实现 | 无 | 待开始 | 可用 Expo SplashScreen |
| resetPW.html | 重置密码 | 认证 | Form组件 | auth | 待开始 | |
| about_us.html | 关于我们 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| xieyi.html | 用户服务协议 | 静态文本 | StaticPage组件 | 无 | 待开始 | 与 yonghuxieyi 主题重叠 |
| yonghuxieyi.html | 用户隐私协议 | 静态文本 | StaticPage组件 | 无 | 待开始 | 与 xieyi 主题重叠 |
| yinsi.html | 隐私政策 | 静态文本 | StaticPage组件 | 无 | 待开始 | 与 yinsizhengce 几乎相同 |
| yinsizhengce.html | 隐私政策 | 静态文本 | StaticPage组件 | 无 | 待开始 | 与 yinsi 几乎相同 |
| shequguifan.html | 社区规范 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| help.html | AI 智能客服 | AI | 单独实现 | ai | 待开始 | 须改后端代理 |
| ctjy.html | 广东传统技艺介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | |
| ctxj.html | 广东传统戏剧介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | 与 ctjy 结构一致 |
| jianzhi.html | 剪纸非遗介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | 共用 fywh.js 模板 |
| pyx.html | 皮影戏非遗介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | 共用 fywh.js 模板 |
| mjms.html | 广东传统美术介绍 | 静态文本 | StaticPage组件 | 无 | 待开始 | 内嵌视频 |
| yueju.html | 粤剧非遗详情 | 静态文本 | StaticPage组件 | 无 | 待开始 | 可展开文本 |
| zhenjiu.html | 岭南针灸非遗详情 | 静态文本 | StaticPage组件 | 无 | 待开始 | 与 yueju 结构一致 |
| study.html | 学习非遗聚合页 | 列表 | 列表组件 | 无 | 待开始 | 全静态导航入口 |
| fyxq.html | 非遗研学工坊详情 | 详情 | 详情组件 | 无 | 待开始 | |
| community.html | 社区动态流 | 复杂屏 | 单独实现 | stories | 完成 | 动态流已接 `GET /stories`；点赞本地乐观切换，详情/评论/发布待后续 |
| Trip_Story.html | 社区故事详情 | 详情 | 详情组件 | stories, auth | 待开始 | |
| add.html | 发布社区动态 | 表单 | Form组件 | stories, auth | 待开始 | 多图上传 |
| message.html | 消息中心 | 列表 | 列表组件 | 新增:消息 | 待开始 | |
| my_star.html | 收藏列表 | 列表 | 列表组件 | 新增:收藏 | 待开始 | |
| history.html | 研学答题系统 | 复杂屏 | 单独实现 | auth(积分) | 待开始 | 答对加积分 |
| top_list.html | 积分排行榜 | 列表 | 列表组件 | auth | 待开始 | /auth/leaderboard |
| qd.html | 签到福利中心 | 表单 | 单独实现 | auth | 待开始 | 积分增减 |
| wallet.html | 钱包 / 流水 | 列表 | 列表组件 | 新增:钱包 | 待开始 | 旧版为假数据 |
| moreTrip.html | 精选目的地列表 | 列表 | 列表组件 | 新增:精选目的地 | 待开始 | |
| settings.html | 设置页 | 列表 | 单独实现 | auth | 待开始 | 我的页子页 |
| create_addr.html | 添加新地址 | 表单 | Form组件 | auth(地址) | 待开始 | |
| wlxx.html | 地址管理列表 | 列表 | 列表组件 | auth(地址) | 待开始 | 旧版为假数据 |
| hotel.html | 酒店预订表单 | 表单 | Form组件 | 新增:酒店 | 待开始 | 旧版未接后端 |
| HK.html | 粤语学习 / 翻译 / 语音 | AI | 单独实现 | 新增:翻译+TTS | 待开始 | 旧版依赖本地 5000 端口 |
| Translate.html | 中译英翻译 | AI | 单独实现 | 新增:翻译 | 待开始 | 旧版依赖本地 5000 端口 |
| VR Map.html | VR 全景浏览 | 地图VR | WebView套旧版 | 无 | 待开始 | W1 spike |

## 废弃草稿 / 测试页（5）— 不重写（2026-05-20 确认）

这 5 个不是功能，是开发过程中的草稿和测试文件。组长已确认不重写，重写范围锁定 62 屏。

| 文件 | 说明 | 被谁取代 |
|------|------|---------|
| index.html | 旧首页设计稿（Tailwind CDN） | index1.html |
| itinerary2.html | 行程时间轴设计稿 | itinerary.html |
| mine.html | 旧"我的"页 | mine1.html |
| top.html | 毛玻璃 CSS 效果演示页，无业务功能 | — |
| wzfdemo.html | 空白测试页（仅含"测试机"二字） | — |

---

## 系统性观察

1. **三组草稿/正式重复**：index/index1、itinerary2/itinerary、mine/mine1 —— 只重写正式版（index1 / itinerary / mine1）。top.html、wzfdemo.html 是废弃文件。
2. **静态模板高度重叠**：14 个协议 / 隐私 / 非遗介绍页可由单个数据驱动 `StaticPage` 组件覆盖；jianzhi / pyx / mjms 共用旧版 `fywh.js` 模板；yueju / zhenjiu 结构一致；yinsi / yinsizhengce 内容几乎相同。
3. **多个屏旧版未接后端**，用硬编码 / sessionStorage / URL 参数充当数据：activity、hotTrip、hotel、xlgh、xlgh-xq、trip_moreinfo、wallet、wlxx、my_star、message、moreTrip —— 重写时必须配套后端接口，否则演示无真实数据。
4. **AI 接入混乱且有安全隐患**：MCP / help 前端直连 DeepSeek 暴露密钥；HK / Translate 依赖本地 127.0.0.1:5000 服务；offline-ai 直连大模型 —— 全部收口到后端 `ai` 代理 + SSE。
