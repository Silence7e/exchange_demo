## Why

Tiered rate limiting is in place but counters live in process memory and track clients by IP only. Multi-instance deployments would apply limits independently per pod, and authenticated users behind the same NAT share one bucket. Redis-backed storage and per-user tracking fix both gaps for production readiness.

## What Changes

- Add `RedisThrottlerStorage` implementing `ThrottlerStorage` with atomic Redis Lua script (reuses existing `RedisService` / ioredis)
- Add `AppThrottlerGuard` extending `ThrottlerGuard` with tracker resolution: valid JWT → `user:{userId}`, otherwise → `ip:{ip}`
- Wire `ThrottlerModule.forRootAsync` to use Redis storage; replace global `ThrottlerGuard` with `AppThrottlerGuard`
- Update `api-layer` spec: counters stored in Redis; authenticated requests tracked per user when a valid access token is present

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `api-layer`: Update Rate limiting requirement for Redis storage and per-user tracker behavior

## Impact

- **Code**: `apps/api/src/common/throttle/*`, `apps/api/src/app.module.ts`
- **Dependencies**: No new packages (uses existing `ioredis` via `RedisService`)
- **Infrastructure**: Requires Redis (`REDIS_URL`) for rate limit counters; API still starts if Redis is used elsewhere already
- **Behavior**: Logged-in users get independent rate limit buckets; unauthenticated routes (markets, auth login) remain IP-based
