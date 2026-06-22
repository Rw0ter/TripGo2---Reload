# TripGo（绿途）

以**绿色低碳生活**为主题的移动应用（2026 重写版）：碳积分、虚拟植树（绿色能量森林）、环保答题、
生态良品商城、绿色地图、AI 低碳助手（含语音）。贴合「绿色发展 + 新质生产力」路线。

- **前端**：Expo (React Native) + Expo Router + NativeWind + Zustand
- **后端**：NestJS + Prisma + SQLite；AI 走 DeepSeek（后端代理，SSE 流式），RAG 用 sqlite-vec

---

## 在新电脑上跑起来

> 只需 **Node 20+** 和 npm。后端、前端各开一个终端。演示走 **web 最快**（开箱即用）。

### 1. 后端（终端 A）

```bash
cd backend
npm install
cp .env.example .env       # 至少把 JWT_SECRET 改成随机长串；AI 的 key 可先留空
npx prisma migrate dev     # 一步搞定：建库 + 生成 Client + 自动灌入演示数据（轮播/商城/答题/社区）
npm run start:dev          # 跑在 http://localhost:3000 ，接口文档在 /docs
```

### 2. 前端（终端 B）

```bash
cd frontend
npm install
npx expo start             # 按 w 开网页版（推荐演示）；按 a 开 Android
```

**先起后端再起前端**：前端默认连本机后端 `http://localhost:3000`。
真机 / 模拟器访问时，设环境变量 `EXPO_PUBLIC_API_URL` 指向后端地址（如本机局域网 IP）即可。

搞定 —— 浏览器里就能看到「绿途」。

---

## AI 助手（可选）

AI 对话 / 行程规划由后端 `ai` 模块代理，**密钥只在后端**。在 `backend/.env` 里二选一：

- **联网**：填 `DEEPSEEK_API_KEY`（默认模型 `deepseek-chat`）。
- **离线兜底**：key 留空，按 `.env.example` 注释起本地模型（`backend/scripts/run-local-ai.ps1`，首次自动下载约 7.5GB），再填 `LOCAL_AI_URL`。

两者都没配时，AI 接口降级提示「未配置」，**不影响 App 其余功能**。
知识库检索（RAG）首次需在 `backend/` 跑 `npm run rag:index` 灌入知识。

---

## 提交前门禁

```bash
git config core.hooksPath .githooks   # 每台机器克隆后执行一次，启用本地提交门禁
```

启用后每次 `git commit` 会按改动的子项目自动跑检查，失败即拒绝提交：

- 后端：`cd backend && npm run verify`（= `build` + `test`）
- 前端：`cd frontend && npx tsc --noEmit && npx expo lint`

CI（GitHub Actions）再卡一道，PR 必须全绿才能合并。

---

## 项目结构

```
backend/      NestJS 后端（src/modules/* 每功能一个模块；prisma/ 是表结构与种子数据）
frontend/     Expo 前端（app/ 是文件式路由）
docs/         页面清单等文档
CLAUDE.md     开发约定（人 + AI 必读）
PROGRESS.md   当前进度与决策记录（新会话先读这个）
```

旧版在 `Legacy TripGo ReadOnly!!!/`，**只读参考**，不要修改、不要在新代码里引用。
