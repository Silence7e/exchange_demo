## 1. Monorepo Foundation

- [x] 1.1 Initialize pnpm workspace with `pnpm-workspace.yaml`, root `package.json`, and `turbo.json`
- [x] 1.2 Create shared `tsconfig.base.json` with TypeScript project references
- [x] 1.3 Scaffold `packages/config-eslint` with shared ESLint and Prettier configs
- [x] 1.4 Add root scripts: `dev`, `build`, `lint`, `typecheck` via Turborepo
- [x] 1.5 Create `docker-compose.yml` with PostgreSQL and Redis services
- [x] 1.6 Add `.env.example` files for `apps/web` and `apps/api`

## 2. Shared Contracts & Standards

- [x] 2.1 Create `packages/shared` with build setup (tsup or tsc)
- [x] 2.2 Define domain types: `Order`, `Trade`, `Balance`, `TradingPair`, `Ticker`, `Kline`
- [x] 2.3 Define enums: `OrderSide`, `OrderType`, `OrderStatus`, `WsChannel`, `ErrorCode`
- [x] 2.4 Define API DTOs: `PlaceOrderDto`, `CancelOrderDto`, auth DTOs
- [x] 2.5 Define WebSocket event types with discriminated unions
- [x] 2.6 Implement number formatters: `formatPrice`, `formatQuantity`, `formatPercent`, `formatVolume`
- [x] 2.7 Define trading pair configs with precision rules (BTC/USDT, ETH/USDT, etc.)
- [x] 2.8 Define semantic color tokens and `COLOR_CONVENTION` config constant
- [x] 2.9 Add `decimal.js` dependency and create `Decimal` utility wrappers

## 3. Backend API Setup

- [x] 3.1 Scaffold `apps/api` with NestJS CLI (modules, main.ts, app.module.ts)
- [x] 3.2 Configure Prisma with PostgreSQL schema (User, Wallet, Balance, Order, Trade, TradingPair, Kline)
- [x] 3.3 Run initial Prisma migration and create seed script (trading pairs, demo balances)
- [x] 3.4 Configure global validation pipe (class-validator, whitelist)
- [x] 3.5 Configure Swagger at `/api/docs`
- [x] 3.6 Implement standardized error filter with `ErrorCode` enum
- [x] 3.7 Configure CORS with `credentials: true`, rate limiting (nestjs-throttler), and pagination interceptor
- [x] 3.8 Configure Redis module for caching and session storage

## 4. User Authentication

- [x] 4.1 Implement `AuthModule` with register and login endpoints
- [x] 4.2 Implement bcrypt password hashing and User entity CRUD
- [x] 4.3 Implement JWT access token (15min) and refresh token (7d) generation with httpOnly `Set-Cookie`
- [x] 4.4 Implement `/auth/refresh` endpoint reading `refreshToken` cookie with token rotation
- [x] 4.5 Implement `/auth/logout` endpoint clearing cookies and invalidating refresh token in Redis
- [x] 4.6 Implement `JwtAuthGuard` reading `accessToken` from cookie and apply to protected routes
- [x] 4.7 Implement `GET /auth/me` session endpoint for frontend login state check
- [x] 4.8 Auto-create wallet with demo balances on user registration

## 5. Wallet & Balance

- [x] 5.1 Implement `WalletModule` with `GET /wallet/balances` endpoint
- [x] 5.2 Implement balance freeze/unfreeze service methods
- [x] 5.3 Implement atomic balance update on trade settlement (transaction)
- [x] 5.4 Add balance validation helper (check sufficient available balance)

## 6. Market Data

- [x] 6.1 Implement `MarketModule` with `GET /markets` (trading pair list + 24h stats)
- [x] 6.2 Implement `GET /markets/:symbol/ticker` endpoint
- [x] 6.3 Implement `GET /markets/:symbol/depth` endpoint with configurable limit
- [x] 6.4 Implement `GET /markets/:symbol/klines` endpoint with interval support
- [x] 6.5 Create mock market data generator for development (ticker, depth, klines)
- [x] 6.6 Seed historical kline data for chart development

## 7. Spot Trading & Matching Engine

- [x] 7.1 Implement `TradingModule` with order placement endpoints (limit + market)
- [x] 7.2 Implement order validation against pair precision and min quantity rules
- [x] 7.3 Implement in-memory order book per trading pair
- [x] 7.4 Implement price-time priority matching engine
- [x] 7.5 Implement order cancellation endpoint
- [x] 7.6 Implement `GET /orders` with status/pair/time filters and pagination
- [x] 7.7 Integrate balance freeze on order place and settlement on fill
- [x] 7.8 Persist orders and trades to database; restore open orders on restart

## 8. WebSocket Real-time

- [x] 8.1 Implement `WsModule` with `/ws` gateway authenticating via `accessToken` httpOnly cookie on handshake
- [x] 8.2 Implement subscribe/unsubscribe protocol for public channels (ticker, depth, trade)
- [x] 8.3 Implement private channels (user.orders, user.balances) with auth check
- [x] 8.4 Implement ping/pong heartbeat (30s interval)
- [x] 8.5 Push market data updates from mock generator via WebSocket
- [x] 8.6 Push order and balance updates on trade events

## 9. Frontend Architecture Setup

- [x] 9.1 Scaffold `apps/web` with Next.js 15 App Router and Tailwind CSS
- [x] 9.2 Install and configure shadcn/ui components
- [x] 9.3 Configure Tailwind with semantic color tokens (price-up, price-down, bid, ask)
- [x] 9.4 Implement typed `apiClient` using native `fetch` with `credentials: 'include'` and `ApiError` handling
- [x] 9.5 Set up TanStack Query v5 provider and query hooks directory (`hooks/queries/`)
- [x] 9.6 Create Zustand stores: `marketStore` (realtime WS data) and `wsStore` (connection status)
- [x] 9.7 Implement `useWebSocket` hook with auto-reconnect, resubscribe, and Zustand integration
- [x] 9.8 Configure trading pair routing via URL (`/trade/[symbol]`) instead of global store
- [x] 9.9 Configure auth cookies: login/register set httpOnly cookies; frontend never reads JWT from JS storage
- [x] 9.10 Implement `useSession` query hook calling `GET /auth/me` with `credentials: 'include'`

## 10. Frontend Pages

- [x] 10.1 Implement login and register pages with form validation
- [x] 10.2 Implement auth middleware / route guard for protected pages
- [x] 10.3 Implement markets overview page (trading pair list with 24h stats)
- [x] 10.4 Implement trading page layout: pair selector, ticker bar, order book, chart, trade form
- [x] 10.5 Implement order book component with bid/ask coloring and depth visualization
- [x] 10.6 Implement K-line chart with lightweight-charts and interval selector
- [x] 10.7 Implement trade form (limit/market, buy/sell) with precision validation
- [x] 10.8 Implement open orders panel with cancel action and `usePlaceOrder` mutation invalidation
- [x] 10.9 Implement order history page with filters
- [x] 10.10 Implement wallet page with `useBalances` query hook and portfolio total
- [x] 10.11 Use shared formatters for all price/quantity/percentage displays

## 11. Integration & Polish

- [x] 11.1 Wire WebSocket real-time updates to trading page (ticker, depth, orders, balances)
- [x] 11.2 Add loading states, error boundaries, and toast notifications
- [x] 11.3 Verify `pnpm dev` starts full stack with one command
- [x] 11.4 Verify all API endpoints documented in Swagger
- [x] 11.5 End-to-end smoke test: register → login → view market → place order → see fill → check balance
