## Context

本项目为全新数字货币交易所，采用前后端分离架构：Next.js（App Router）前端 + NestJS 后端，通过 pnpm monorepo 统一管理。当前仓库仅有 OpenSpec 规划文件，无业务代码。

交易所类应用具有高度跨切面的一致性要求：价格精度、涨跌色、订单状态、资产余额等规则必须前后端统一，否则会导致用户信任问题和联调成本激增。

## Goals / Non-Goals

**Goals:**

- 建立可扩展的 monorepo 骨架，支持独立部署前端与后端
- 在项目初期确定跨端共享规范（类型契约、数字格式化、颜色语义）
- 在项目初期确定前端架构规范（fetch、TanStack Query、Zustand 状态分层）
- 实现现货交易核心闭环：行情 → 下单 → 撮合 → 结算 → 实时推送
- 提供开发环境一键启动与 API 文档

**Non-Goals（首期不做）:**

- 链上充提、法币出入金
- 合约/杠杆/期权交易
- KYC/AML 合规流程
- 多语言 i18n（但颜色 convention 预留配置点）
- 生产级撮合引擎性能优化（首期 in-memory/Redis 够用）
- 移动端原生 App

## Decisions

### 前端技术选型（已确定）

| 领域 | 选型 | 说明 |
|------|------|------|
| HTTP 客户端 | 原生 `fetch` + `apiClient` 封装 | 与 Next.js 原生集成，类型安全，统一错误处理 |
| 服务端状态 | **TanStack Query v5**（已确定） | REST 数据的缓存、请求、mutation 与失效 |
| 实时 / UI 状态 | **Zustand stores**（已确定） | WebSocket 推送数据、连接状态等跨组件 UI 状态 |
| 路由状态 | URL path / searchParams | 当前交易对、K 线周期等可分享的路由级状态 |
| 认证凭证存储 | **httpOnly Cookie**（已确定） | access/refresh token 由服务端 Set-Cookie，前端不持有明文 token |


### 1. Monorepo 结构与工具链

```
mono_test/
├── apps/
│   ├── web/          # Next.js 15 (App Router)
│   └── api/          # NestJS 10
├── packages/
│   ├── shared/       # 类型、常量、formatter、枚举
│   ├── ui/           # 共享 React 组件（可选，初期可放 web 内）
│   └── config-eslint/ # 共享 ESLint/Prettier 配置
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

- **包管理**: pnpm（节省磁盘、严格依赖隔离、workspace 协议 `workspace:*`）
- **任务编排**: Turborepo（比 Nx 更轻量，足够当前规模；后续可迁移 Nx）
- **TypeScript**: project references + 共享 `tsconfig.base.json`

**备选**: Nx — 功能更强但配置更重，适合更大团队；当前阶段 Turborepo 足够。

### 2. 哪些规范需要在项目初期确定？

| 类别 | 是否初期确定 | 理由 |
|------|-------------|------|
| **数字/价格格式化规则** | ✅ 必须 | 前后端展示不一致是交易所最常见 bug；需在 `packages/shared` 实现统一 formatter |
| **交易对精度配置** | ✅ 必须 | 影响下单校验、撮合、展示，是 domain 核心常量 |
| **颜色语义 token（涨/跌/买卖盘）** | ✅ 必须 | 全站一致的视觉语义；改动成本高 |
| **涨跌色 convention（绿涨红跌 vs 红涨绿跌）** | ✅ 必须（但做成可配置） | 中国区习惯红涨绿跌，国际习惯相反；用单一 config 常量控制 |
| **API 错误码枚举** | ✅ 必须 | 前后端联调依赖统一错误契约 |
| **WebSocket 事件类型** | ✅ 必须 | 实时推送契约，变更影响大 |
| **API 客户端方案（fetch）** | ✅ 必须 | 统一 `apiClient` 封装，与 Next.js 原生集成 |
| **状态管理分层（Query + Zustand）** | ✅ 必须 | REST 走 Query，WS/实时走 Zustand，职责清晰 |
| **具体 UI 配色值（hex）** | ⏳ 可后定 | 语义 token 名先定，具体色值可用 Tailwind/shadcn 默认值 |
| **完整设计稿/Figma** | ⏳ 可后定 | 不影响逻辑开发；有 wireframe 即可开工 |
| **图表库选型** | ⏳ 可后定 | K 线可用 lightweight-charts 或 tradingview；接口层先抽象 |
| **数据库选型** | ✅ 建议初期定 | PostgreSQL（关系型，适合订单/余额事务） |

**结论**: color token 的**语义命名**、number format 的**规则**、以及前端状态分层必须在第一天确定并写入 spec / `packages/shared`；具体 hex 色值和视觉细节可以迭代。

### 3. 颜色 Token 设计

在 `packages/shared` 或 `apps/web` 的 Tailwind 配置中定义语义 token：

```typescript
// packages/shared/src/theme/tokens.ts
export const COLOR_CONVENTION = 'green-up' as const; // or 'red-up' for CN market

export const SEMANTIC_COLORS = {
  priceUp: 'var(--color-price-up)',
  priceDown: 'var(--color-price-down)',
  priceNeutral: 'var(--color-price-neutral)',
  bid: 'var(--color-bid)',
  ask: 'var(--color-ask)',
} as const;
```

Tailwind 扩展：

```css
/* apps/web/app/globals.css */
:root {
  --color-price-up: #22c55e;    /* green-500 */
  --color-price-down: #ef4444;  /* red-500 */
  --color-bid: #22c55e;
  --color-ask: #ef4444;
}
```

组件通过语义 class 使用：`text-price-up`、`text-price-down`，禁止硬编码 hex。

### 4. 数字格式化设计

```typescript
// packages/shared/src/format/number.ts
import Decimal from 'decimal.js';

export const formatPrice = (value: string | Decimal, precision: number): string => { ... };
export const formatQuantity = (value: string | Decimal, precision: number): string => { ... };
export const formatPercent = (value: string | Decimal): string => { ... };
export const formatVolume = (value: string | Decimal): string => { ... };
```

规则：
- 所有原始金额用 `string` 传输（JSON），避免浮点精度丢失
- 后端计算用 `decimal.js`，前端展示用 shared formatter
- 千分位分隔符、小数位数、舍入模式（round half-up）统一配置
- 百分比正数显式 `+` 号

### 5. 后端架构

- **框架**: NestJS 模块化（`AuthModule`, `MarketModule`, `TradingModule`, `WalletModule`, `WsModule`）
- **ORM**: Prisma + PostgreSQL（类型安全、migration 友好）
- **缓存**: Redis（行情快照、session、rate limit counter）
- **撮合**: 首期 in-memory `Map` per pair + 价格-时间优先；后续可拆为独立 matching service
- **WebSocket**: `@nestjs/websockets` + `ws` adapter
- **鉴权**: Passport JWT strategy；token 通过 httpOnly Cookie 下发；refresh token 存 Redis

### 6. 前端架构

- **框架**: Next.js 15 App Router
- **样式**: Tailwind CSS + shadcn/ui
- **图表**: `lightweight-charts`（TradingView 开源版，轻量）

#### 6.1 API 客户端：fetch + apiClient

使用原生 `fetch` + 薄封装 `apiClient`：

- Next.js App Router / RSC 原生支持 `fetch`
- 所有请求携带 `credentials: 'include'`，由浏览器自动附带 httpOnly Cookie
- JSON 解析、非 2xx 抛 `ApiError`、超时与 `AbortController` 在封装层实现
- 基于 `packages/shared` DTO 实现类型安全请求

```typescript
// apps/web/lib/api-client.ts
export const apiClient = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await res.json();
  if (!res.ok) throw new ApiError(body.code, body.message);
  return body as T;
};
```

#### 6.1.1 Cookie 认证约定

| Cookie | 属性 | 用途 |
|--------|------|------|
| `accessToken` | httpOnly, SameSite=Lax, Secure(prod) | 短期 JWT（15 min），API 鉴权 |
| `refreshToken` | httpOnly, SameSite=Lax, Secure(prod), path=`/api/v1/auth` | 长期 refresh（7 d），仅 refresh/logout 端点 |

- 登录/注册成功：NestJS `Set-Cookie` 写入上述 cookie，响应 body **不返回**明文 token
- 刷新 token：`POST /auth/refresh` 从 `refreshToken` cookie 读取并轮换
- 登出：清除 cookie + 服务端作废 refresh token
- CORS 配置：`credentials: true`，前端 origin 白名单

#### 6.2 状态管理：TanStack Query + Zustand（职责分离）

| 状态类型 | 方案 | 示例 |
|----------|------|------|
| REST 服务端数据 | TanStack Query v5 | 余额、订单列表、K 线历史、交易对列表 |
| WebSocket 实时推送 | Zustand store | ticker、order book 增量、WS 连接状态 |
| 路由级 UI 状态 | URL path/searchParams | 当前交易对 `/trade/BTC-USDT`、K 线周期 |
| 表单草稿 | 组件内 `useState` | 下单价格/数量输入 |
| Auth token | httpOnly Cookie | 由服务端 Set-Cookie；**禁止**存入 Zustand / localStorage / 响应 body 明文 |

**TanStack Query 负责**:
- loading / error / retry / cache / dedup
- mutation 后 `invalidateQueries`（下单成功 → 刷新 orders + balances）
- 窗口聚焦时 stale 数据自动刷新

**Zustand 负责**:
- `marketStore`: WS 推送的 ticker、depth 实时快照
- `wsStore`: 连接状态、已订阅 channel 列表
- 不把 REST 拉取的数据复制进 Zustand

**WebSocket 与 Query 协作**:
- `useWebSocket` hook 收到事件后写入 Zustand
- 必要时用 `queryClient.setQueryData` 将特定事件同步到 Query 缓存（如订单状态变更）

#### 6.3 目录约定

```
apps/web/
├── app/                    # App Router pages
├── components/             # UI components
├── hooks/
│   ├── use-websocket.ts
│   └── queries/            # TanStack Query hooks (useBalances, useOrders, ...)
├── lib/
│   └── api-client.ts
└── stores/
    ├── market-store.ts     # Zustand: realtime market data
    └── ws-store.ts         # Zustand: connection state
```

### 7. 数据库核心模型

```
User → Wallet → Balance (per asset: available, frozen)
User → Order (pair, side, type, price, quantity, status)
Order → Trade (matched records)
TradingPair (symbol, base, quote, pricePrecision, qtyPrecision, minQty)
Kline (pair, interval, OHLCV, timestamp)
```

所有金额字段用 `DECIMAL(36, 18)` 存储。

### 8. 安全考量

- 密码 bcrypt (cost 12)
- JWT 通过 httpOnly Cookie 传递（非 Authorization header / 非 localStorage）
- JWT 短期 + refresh token 轮换
- 所有交易操作需鉴权 + 幂等 key（防重复下单）
- 输入校验 whitelist mode
- Rate limiting（nestjs-throttler）
- CORS 白名单
- 敏感操作日志审计（后续）
- JWT 禁止明文存入 Zustand / localStorage；仅通过 httpOnly Cookie 传递

### 9. 开发环境

- Docker Compose 提供 PostgreSQL + Redis
- `pnpm dev` 同时启动 web + api
- API Swagger 文档 `localhost:4000/api/docs`
- 种子数据：交易对 + 模拟行情 generator

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| In-memory 撮合引擎重启丢单 | 首期可接受；订单持久化到 DB，重启后从 DB 恢复 open orders |
| WebSocket 连接数增长 | 首期单实例够用；后续引入 Redis pub/sub 做水平扩展 |
| 浮点精度问题 | 全链路 `decimal.js` + DB `DECIMAL` + API 传 string |
| Monorepo 构建变慢 | Turborepo 缓存 + 按包独立 build |
| 过度设计 shared 包 | 初期只放 types + formatters + constants，UI 组件暂留 web 内 |
| 行情数据模拟不真实 | 开发阶段用 mock generator；接口层抽象 data source 便于切换真实 feed |
| REST 与 WS 数据双写 | 严格状态分层 spec；Code review 检查 Zustand 不存 REST 数据 |
| fetch 无自动 reject | `apiClient` 统一处理非 2xx |

## Migration Plan

不适用（全新项目）。部署建议：

1. Phase 1: 本地开发环境 + Docker Compose
2. Phase 2: CI（GitHub Actions: lint → typecheck → test → build）
3. Phase 3: 容器化部署（web → Vercel/容器, api → 容器 + PG + Redis）

## Open Questions

1. **目标用户市场**: 国内（红涨绿跌）还是国际（绿涨红跌）？→ 建议默认国际 convention，config 可切换
2. **K 线数据源**: 首期 mock 还是对接第三方 API（如 Binance public API）？→ 建议 mock + 可选对接
3. **是否需要 Nx**: 团队规模与 CI 复杂度增长后再评估
4. **UI 组件库**: shadcn/ui 是否满足交易界面需求？→ 建议先用，复杂组件（order book 深度图）自定义
