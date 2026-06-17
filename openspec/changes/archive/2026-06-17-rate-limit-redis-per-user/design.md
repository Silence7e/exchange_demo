## Context

Tiered rate limits use `@nestjs/throttler` with a global guard and semantic `@RateLimit` decorators. Current storage is in-memory (`ThrottlerStorageService`) and the default tracker is `req.ip`. The project already runs Redis for refresh tokens (`RedisService` in `redis.module.ts`).

`ThrottlerGuard` runs before route-level `JwtAuthGuard`, so `req.user` is not set when the tracker is resolved. Per-user tracking must optionally verify the access token cookie inside the custom guard.

## Goals / Non-Goals

**Goals:**

- Store rate limit counters in Redis for cross-instance consistency
- Track authenticated requests by `userId` when a valid `accessToken` cookie is present
- Fall back to IP tracking for public and auth (login/register) endpoints
- Reuse existing `RedisService` connection — no new Redis client or npm package

**Non-Goals:**

- WebSocket rate limiting
- Separate Redis instance for throttling
- Changing tier definitions or controller assignments

## Decisions

### 1. Custom Redis storage vs `@nest-lab/throttler-storage-redis`

**Choice:** Custom `RedisThrottlerStorage` with Lua `EVALSHA`

**Rationale:** Reuses injected `RedisService`; avoids an extra dependency; implements the same atomic increment contract as `@nestjs/throttler` expects.

### 2. Per-user tracker via optional JWT verify in guard

**Choice:** `AppThrottlerGuard.getTracker()` verifies `accessToken` cookie with `JwtService`; returns `user:{sub}` or `ip:{ip}`

**Rationale:** Global throttler runs before `JwtAuthGuard`; optional verify is safe for tracking only (invalid tokens fall back to IP; auth guard still enforces access).

**Alternative considered:** Middleware to populate `req.user` early — rejected as duplicate auth pipeline.

### 3. Redis key prefix

**Choice:** `throttle:{hashedKey}:{throttlerName}:hits|block`

**Rationale:** Namespace isolation from `refresh:{userId}` keys; throttler name supports future multi-throttler configs.

## Risks / Trade-offs

- **[Risk] Redis unavailable** → Mitigation: ioredis reconnect; throttler failures surface as 500 — acceptable given Redis is already required for refresh tokens
- **[Risk] JWT verify on every throttled request** → Mitigation: Lightweight verify; only runs inside throttler guard
- **[Trade-off] Invalid/expired token uses IP bucket** → Acceptable; user re-authenticates via auth guard anyway

## Migration Plan

1. Deploy API with Redis available — counters migrate automatically (new keys in Redis)
2. No frontend or database migration
3. Rollback: revert to `ThrottlerGuard` + in-memory storage in `app.module.ts`

## Open Questions

_(none)_
