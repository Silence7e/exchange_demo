# Vercel Deployment Guide

This project runs as two separate Vercel projects sharing the same GitHub repository (`Silence7e/exchange_demo`).

| Project | Vercel Name | Root Directory | Framework |
|---------|-------------|----------------|-----------|
| API | `bin-exchange-api` | `apps/api` | NestJS |
| Web | `bin-exchange-web` | `apps/web` | Next.js |

---

## Prerequisites

- Neon (PostgreSQL) — provisioned via Vercel integration or manually
- Upstash (Redis) — provisioned via Vercel integration or manually
- A generated `JWT_SECRET` (e.g. `openssl rand -base64 32`)

---

## Infrastructure

### PostgreSQL — Neon

Use the **pooler** connection string (hostname contains `-pooler`) for the `DATABASE_URL` environment variable. The non-pooling string is only needed for schema migrations.

```
DATABASE_URL=postgresql://<user>:<pass>@<host>-pooler.<region>.neon.tech/<db>?sslmode=require
```

### Redis — Upstash

Use the `rediss://` (TLS) connection string:

```
REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379
```

---

## API Project (`bin-exchange-api`)

### Vercel Project Settings

| Setting | Value |
|---------|-------|
| Framework Preset | **NestJS** |
| Root Directory | `apps/api` |
| Include source files outside Root Directory | **enabled** |
| Output Directory | *(leave empty)* |

`apps/api/vercel.json` handles the rest:

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@exchange/api && node apps/api/scripts/vercel-postbuild.cjs"
}
```

The `vercel-postbuild.cjs` script copies the compiled `@exchange/shared` dist into
`apps/api/node_modules/@exchange/shared` so Vercel's bundler can find it at
runtime (workspace symlinks are not preserved in the Vercel build output).

### Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooler connection string |
| `REDIS_URL` | Upstash `rediss://` connection string |
| `JWT_SECRET` | Random secret, min 32 characters |
| `CORS_ORIGIN` | Web app origin, e.g. `https://bin-exchange-web.vercel.app` |
| `COOKIE_SECURE` | `true` |

### Prisma Binary Target

`apps/api/prisma/schema.prisma` includes `rhel-openssl-3.0.x` as a binary
target so the Prisma query engine is compatible with Vercel's Linux environment:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

### Database Migration

Run migrations from a machine that has access to the **non-pooling** connection
string (Vercel build environment uses PgBouncer which does not support DDL):

```bash
DATABASE_URL="<non-pooling-url>" pnpm --filter @exchange/api prisma migrate deploy
pnpm --filter @exchange/api prisma:seed   # optional: seed demo data
```

---

## Web Project (`bin-exchange-web`)

### Vercel Project Settings

| Setting | Value |
|---------|-------|
| Framework Preset | **Next.js** |
| Root Directory | `apps/web` |

`apps/web/vercel.json`:

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@exchange/web"
}
```

> **Note:** `output: 'standalone'` must **not** be set in `next.config.ts` for
> Vercel deployments. That mode is intended for Docker / self-hosted setups and
> conflicts with Vercel's own bundling pipeline.

### Environment Variables (Production)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://bin-exchange-api-coral.vercel.app/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://bin-exchange-api-coral.vercel.app/ws` |

---

## Deployment Order

1. **Deploy API first** — get the API domain
2. Set `CORS_ORIGIN` on the API to the Web domain (even a placeholder)
3. **Deploy Web** — get the Web domain
4. Update API's `CORS_ORIGIN` to the actual Web domain and **Redeploy API**

---

## Known Limitations on Vercel Serverless

| Feature | Status | Notes |
|---------|--------|-------|
| REST API | ✅ Works | |
| WebSocket (`/ws`) | ⚠️ Unreliable | Serverless functions are stateless and short-lived; persistent WS connections are not guaranteed |
| In-memory matching engine | ⚠️ Per-invocation | State resets between cold starts; open orders are restored from DB on each bootstrap |
| Rate limiting (Redis) | ✅ Fail-open | If Redis is unavailable, requests are allowed through rather than blocked |

For production use, run the API on a persistent process (Docker / K8s) instead. See [Kubernetes deployment](./deployment-k8s.md) (if applicable).

---

## Troubleshooting

### `ERR_REQUIRE_ESM` in runtime logs

`@exchange/shared` must be compiled to **CommonJS** (`module: CommonJS` in
`packages/shared/tsconfig.json`). NestJS output is CJS and cannot `require()`
an ESM module.

### `Cannot find module '@exchange/shared'`

`packages/shared/dist/` is in `.gitignore`. The postbuild script
(`apps/api/scripts/vercel-postbuild.cjs`) copies it into the API's local
`node_modules` after the Turbo build completes. If the script is not run,
the module will be missing at runtime.

Also ensure `packages/shared/tsconfig.tsbuildinfo` is **not** committed to Git.
If it is, TypeScript may skip compilation on a clean Vercel clone (no `dist/`)
because it thinks nothing changed. The `build` script uses `tsc --build --force`
to prevent this.

### Requests hang / timeout on all throttled routes

The global rate-limit guard uses Redis. If Redis ops hang silently (common
during cold starts when the Upstash TLS handshake is slow), every request
will time out. The throttler storage has a **1.5-second hard timeout** on all
Redis calls and fails open — requests are allowed through if Redis is
unavailable.

Confirm `REDIS_URL` is set and starts with `rediss://` (TLS required by
Upstash). A plain `redis://` URL will fail TLS negotiation.

### `CORS` errors in browser

Set `CORS_ORIGIN` on the API to exactly match the Web origin (no trailing
slash), then **Redeploy** the API. Example:

```
CORS_ORIGIN=https://bin-exchange-web.vercel.app
```
