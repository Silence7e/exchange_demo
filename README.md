# Exchange Platform

A full-stack digital currency exchange built as a pnpm monorepo. The frontend is a Next.js app; the backend is a NestJS API. Shared types, formatters, and contracts live in a common package.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 15, Tailwind CSS, TanStack Query v5, Zustand |
| Backend | NestJS 10, Prisma, PostgreSQL, Redis |
| Real-time | WebSocket (`ws`) |
| Auth | JWT via httpOnly cookies |
| Shared | TypeScript, `decimal.js` |

## Project Structure

```
mono_test/
├── apps/
│   ├── api/          # NestJS REST + WebSocket API
│   └── web/          # Next.js trading UI
├── packages/
│   ├── shared/       # Types, DTOs, formatters, trading pair config
│   └── config-eslint/
├── openspec/         # OpenSpec change proposals & specs
├── k8s/              # Kubernetes manifests (web×2, api×1)
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for PostgreSQL and Redis)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. Database setup

```bash
pnpm --filter @exchange/shared build
cd apps/api
pnpm prisma migrate dev
pnpm prisma:seed
```

### 5. Start development servers

From the repository root:

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/docs |
| WebSocket | ws://localhost:4000/ws |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode (Turborepo) |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |

### Per-package commands

```bash
# API
pnpm --filter @exchange/api dev
pnpm --filter @exchange/api build
pnpm --filter @exchange/api prisma:migrate

# Web
pnpm --filter @exchange/web dev
pnpm --filter @exchange/web build

# Shared
pnpm --filter @exchange/shared build
```

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://exchange:exchange@localhost:5432/exchange` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | — |
| `PORT` | API port | `4000` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `COOKIE_SECURE` | Set `Secure` flag on cookies | `false` (use `true` in production with HTTPS) |

### Web (`apps/web/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | REST API base URL | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:4000/ws` |

## Features

- **Markets** — Trading pair list with 24h ticker stats
- **Spot trading** — Limit / market orders with in-memory matching engine
- **Wallet** — Asset balances (available / frozen) with demo funds on registration
- **Real-time** — WebSocket ticker, depth, order and balance updates
- **Auth** — Register, login, logout with httpOnly cookie sessions

## Frontend Architecture

| Concern | Solution |
|---------|----------|
| HTTP client | Native `fetch` + typed `apiClient` (`credentials: 'include'`) |
| Server state | TanStack Query v5 |
| Real-time / UI state | Zustand stores |
| Route state | URL path (e.g. `/trade/BTC-USDT`) |
| Auth tokens | httpOnly cookies only — never stored in JS |

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register |
| POST | `/auth/login` | — | Login |
| POST | `/auth/logout` | ✓ | Logout |
| GET | `/auth/me` | ✓ | Current session |
| GET | `/markets` | — | List trading pairs |
| GET | `/markets/:symbol/ticker` | — | Ticker |
| GET | `/markets/:symbol/depth` | — | Order book |
| GET | `/markets/:symbol/klines` | — | Candlestick data |
| GET | `/wallet/balances` | ✓ | User balances |
| POST | `/orders` | ✓ | Place order |
| DELETE | `/orders/:id` | ✓ | Cancel order |
| GET | `/orders` | ✓ | Order history |

## Supported Trading Pairs

| Pair | Price Precision | Qty Precision |
|------|-----------------|---------------|
| BTC-USDT | 2 | 6 |
| ETH-USDT | 2 | 5 |
| SOL-USDT | 2 | 4 |

## Kubernetes (Web ×2, API ×1)

Current production layout: **2 web pods** (stateless, rolling updates) + **1 api pod** (in-memory matching engine and WebSocket require single replica for now).

### Build images

From the repository root:

```bash
# API runtime + migrator targets
docker build -f apps/api/Dockerfile -t exchange/api:latest .
docker build -f apps/api/Dockerfile --target migrator -t exchange/api:migrator .

# Web — set public URLs at build time (baked into Next.js client bundle)
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://your-domain.example.com/api/v1 \
  --build-arg NEXT_PUBLIC_WS_URL=wss://your-domain.example.com/ws \
  -t exchange/web:latest .
```

### Deploy

1. Provision managed PostgreSQL and Redis (or cluster services).
2. Copy `k8s/api-secret.example.yaml` → `k8s/api-secret.yaml`, fill in real values.
3. Update `k8s/api-configmap.yaml` (`CORS_ORIGIN`) and `k8s/ingress.yaml` (host).
4. Apply manifests:

```bash
kubectl apply -f k8s/api-secret.yaml
kubectl apply -f k8s/api-configmap.yaml
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/web-service.yaml
kubectl apply -f k8s/api-deployment.yaml   # replicas: 1
kubectl apply -f k8s/web-deployment.yaml   # replicas: 2
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/migrate-job.yaml      # run once per schema change
```

No PM2 — each container runs a single Node process; Kubernetes handles restarts and web rolling updates.

## OpenSpec

Planning artifacts for this project live under `openspec/changes/archive/`. Active requirements are in `openspec/specs/`. To propose or apply changes, use the OpenSpec workflow (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`).

## Conventions for Contributors & Agents

| Layer | Location | When it applies |
|-------|----------|-----------------|
| Requirements (WHAT) | `openspec/specs/<capability>/spec.md` | Source of truth for behavior |
| OpenSpec context | `openspec/config.yaml` | Auto-injected during OpenSpec propose/apply |
| Cursor rules | `.cursor/rules/*.mdc` | Auto-applied during daily coding in Cursor |

Key stack decisions: `fetch` + `apiClient`, TanStack Query v5, Zustand (realtime/UI only), httpOnly cookie auth, `@exchange/shared` formatters.

## License

Private — not for public distribution.
