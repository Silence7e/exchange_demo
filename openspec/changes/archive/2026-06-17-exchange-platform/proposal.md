## Why

需要构建一个前后端分离的数字货币交易所，以 pnpm monorepo 统一管理 Next.js 前端与 NestJS 后端。交易所对跨端一致性要求极高（价格精度、涨跌色、订单状态、API 契约），必须在项目初期通过 OpenSpec 规范固化架构决策与实现约束，避免后期联调返工。

## What Changes

- 初始化 pnpm monorepo 工作区，包含 `apps/web`（Next.js）、`apps/api`（NestJS）及共享包
- 建立跨端共享的类型定义、常量、工具函数（价格/数量格式化、精度规则）
- 定义设计系统基础规范：颜色语义 token、数字与货币展示规则
- 定义前端架构规范：fetch API 客户端、TanStack Query v5 服务端状态、Zustand stores 实时/UI 状态、httpOnly Cookie 认证
- 实现核心交易能力：行情展示、下单、订单管理、资产余额
- 实现用户认证与会话管理（JWT httpOnly Cookie + refresh token 轮换）
- 实现 WebSocket 实时推送（行情、订单、余额变更）
- 建立 API 契约（OpenAPI/Swagger）与前后端联调约定
- 配置开发/构建/测试的 monorepo 工具链（Turborepo、ESLint、Prettier、TypeScript project references）

## Capabilities

### New Capabilities

- `monorepo-foundation`: pnpm workspace 结构、包划分、构建与开发脚本约定
- `shared-contracts`: 前后端共享的 TypeScript 类型、枚举、API DTO、WebSocket 事件契约
- `design-system-standards`: 颜色 token、排版、数字/价格/数量格式化规则及共享 formatter 实现
- `frontend-architecture`: API 客户端（fetch）、TanStack Query v5、Zustand stores 状态分层、httpOnly Cookie 认证、URL 路由状态约定
- `user-auth`: 注册、登录、JWT httpOnly Cookie 鉴权、refresh token 轮换、路由守卫
- `market-data`: 交易对列表、Ticker、深度（Order Book）、K 线数据接口与展示
- `spot-trading`: 限价/市价下单、撤单、订单状态机
- `wallet-balance`: 用户资产余额查询、可用/冻结区分
- `realtime-websocket`: 行情与账户事件的 WebSocket 订阅、重连与心跳
- `api-layer`: REST API 规范、错误码、分页、Swagger 文档

### Modified Capabilities

（无——本项目为全新能力，无既有 spec 需修改）

## Impact

- **新建代码库结构**：`apps/web`、`apps/api`、`packages/shared`、`packages/ui`（可选）、`packages/config-eslint` 等
- **依赖**：pnpm、Next.js 15+、NestJS 10+、TypeScript、Tailwind CSS、shadcn/ui、TanStack Query v5、Zustand、Prisma、Redis、PostgreSQL
- **基础设施**：PostgreSQL、Redis（缓存/会话/行情快照）、WebSocket 网关
- **安全与合规**：API 鉴权、速率限制、输入校验、敏感操作二次确认（后续迭代）
- **非目标（首期）**：链上充提、合约/杠杆交易、KYC、多语言、移动端 App
