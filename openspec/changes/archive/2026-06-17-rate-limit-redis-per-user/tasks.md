## 1. Redis storage

- [x] 1.1 Create `RedisThrottlerStorage` implementing `ThrottlerStorage` with atomic Lua script
- [x] 1.2 Wire `ThrottlerModule.forRootAsync` to inject `RedisService` and use Redis storage

## 2. Per-user tracker

- [x] 2.1 Create `AppThrottlerGuard` extending `ThrottlerGuard` with JWT-aware `getTracker`
- [x] 2.2 Register `AppThrottlerGuard` as global `APP_GUARD` in `app.module.ts`

## 3. Verification

- [x] 3.1 Run `pnpm typecheck` in `apps/api`
