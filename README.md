# TripGo（文脉粤游）

以广东 / 岭南文化旅游为主题的移动应用 —— 2026 重写版。

## 技术栈

- **前端**：Expo (React Native) + Expo Router + NativeWind + Zustand
- **后端**：NestJS + Prisma + SQLite
- **API 文档**：Swagger（运行后访问 `/docs`）
- **AI**：DeepSeek（后端代理 + SSE 流式），RAG 用 sqlite-vec

## 仓库结构

```
TripGo2 - Reload/
├── CLAUDE.md                  开发约定（所有人 + AI 必读）
├── PROGRESS.md                当前进度与关键决策记录
├── README.md                  本文件
├── docs/page-registry.md      67 页清单与状态
├── backend/                   NestJS 后端
└── frontend/                  Expo 前端（Expo Router）
```

## 后端：安装与运行

```
cd backend
npm install
cp .env.example .env          # 填好 JWT_SECRET、DEEPSEEK_API_KEY
npx prisma migrate dev --name init
npm run start:dev             # API http://localhost:3000  文档 /docs
```

## 文档体系

本项目 AI 24 小时协作、多会话并行，靠以下文档维持上下文连续性：

- `CLAUDE.md` — 开发约定与规则，每个 AI 会话自动加载。
- `PROGRESS.md` — 当前进度、进行中任务、下一步、已知坑、决策记录；每会话更新。
- `docs/page-registry.md` — 67 个页面的清单与完成状态。

新会话开始前请先读 `PROGRESS.md`。

## 旧项目

`Legacy TripGo ReadOnly!!!/` 是旧版（DCloud MUI + 脚本式 Express），**只读参考**，不纳入本仓库。
