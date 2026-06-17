## Why

The API currently applies a single global rate limit (100 requests per minute), which is too coarse for an exchange platform. Public market reads, authenticated queries, trading writes, and auth endpoints have different abuse profiles and need different limits. A tiered, semantic rate-limiting model lets us protect sensitive endpoints without throttling legitimate usage elsewhere.

## What Changes

- Replace the single global `ThrottlerModule` config with semantic rate-limit tiers (PUBLIC, STANDARD, TRADING, AUTH, STRICT)
- Add centralized tier definitions in `apps/api/src/common/throttle/rate-limit.config.ts`
- Add `@RateLimit(tier)` and `@NoRateLimit()` decorators wrapping `@nestjs/throttler`
- Apply per-controller or per-route tier annotations across auth, market, wallet, and trading controllers
- **BREAKING**: Rate limit behavior changes from "100/min per IP (public), 300/min per user (authenticated)" to tiered limits per endpoint category (see spec)

## Capabilities

### New Capabilities

_(none — extends existing api-layer capability)_

### Modified Capabilities

- `api-layer`: Update Rate limiting requirement to define semantic tiers, per-endpoint assignments, and 429 behavior

## Impact

- **Code**: `apps/api/src/app.module.ts`, new `apps/api/src/common/throttle/*`, auth/market/wallet/trading controllers
- **Dependencies**: No new packages (`@nestjs/throttler` already installed)
- **API behavior**: Clients hitting auth/trading endpoints will see stricter 429 limits than before; market reads remain relatively permissive
- **Frontend**: No code changes required; clients should already handle 429 responses
- **Future work**: Per-user tracking (authenticated endpoints by `userId`) and Redis-backed storage for multi-instance deployments are out of scope for this change
