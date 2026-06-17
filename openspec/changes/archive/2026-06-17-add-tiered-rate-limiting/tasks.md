## 1. Throttle infrastructure

- [x] 1.1 Create `apps/api/src/common/throttle/rate-limit.config.ts` with semantic tiers (PUBLIC, STANDARD, TRADING, AUTH, STRICT)
- [x] 1.2 Create `apps/api/src/common/throttle/rate-limit.decorator.ts` with `@RateLimit(tier)` and `@NoRateLimit()`
- [x] 1.3 Update `app.module.ts` to use STANDARD as global default throttler config

## 2. Controller tier assignments

- [x] 2.1 Apply `@RateLimit(PUBLIC)` to `MarketController`
- [x] 2.2 Apply `@RateLimit(STANDARD)` to `WalletController`
- [x] 2.3 Apply `@RateLimit(TRADING)` to order place/cancel; `@RateLimit(STANDARD)` to order list in `TradingController`
- [x] 2.4 Apply `@RateLimit(AUTH)` to login, register, refresh in `AuthController`

## 3. Verification

- [x] 3.1 Run `pnpm typecheck` in `apps/api` to confirm no type errors
