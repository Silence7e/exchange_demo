## Context

The API uses `@nestjs/throttler` with a global `ThrottlerGuard` registered via `APP_GUARD` in `AppModule`. The original configuration applied a single limit (100 requests per 60 seconds) to all routes. The `api-layer` spec described coarse per-IP/per-user minute limits that were never fully implemented as tiered rules.

This change introduces semantic rate-limit tiers so different endpoint categories can enforce appropriate limits without duplicating `ttl`/`limit` values across controllers.

## Goals / Non-Goals

**Goals:**

- Define 5 semantic tiers (PUBLIC, STANDARD, TRADING, AUTH, STRICT) in a single config file
- Provide `@RateLimit(tier)` decorator for declarative per-route tier assignment
- Keep global `ThrottlerGuard` enforcement; override limits via `@Throttle` metadata
- Apply tiers to existing controllers (market, wallet, trading, auth)

**Non-Goals:**

- Per-user rate limiting by `userId` (still tracks by IP via default throttler)
- Redis-backed throttler storage for multi-instance deployments
- Frontend changes or new error-handling UI for 429 responses
- WebSocket rate limiting

## Decisions

### 1. Semantic tier names over numeric names (e.g. `TEN_TIMES`)

**Choice:** `PUBLIC`, `STANDARD`, `TRADING`, `AUTH`, `STRICT`

**Rationale:** Tier names express business intent. Limit values can change in config without renaming constants or updating controller annotations.

**Alternative considered:** Numeric names (`FIVE_TIMES`, `ONE_TIME`) — rejected because they become misleading when limits change.

### 2. Single named throttler (`default`) + `@Throttle` overrides

**Choice:** One throttler in `ThrottlerModule.forRoot`, per-route overrides via `@RateLimit` → `@Throttle({ default: ... })`

**Rationale:** Avoids the complexity of multiple named throttlers where every route must `@SkipThrottle` the others.

**Alternative considered:** Multiple named throttlers in `forRoot` — rejected due to high maintenance cost at 4–5 tiers.

### 3. Central config file

**Choice:** `apps/api/src/common/throttle/rate-limit.config.ts`

**Rationale:** Single source of truth for all tier `ttl`/`limit` values. Controllers import semantic tier enum only.

### 4. Tier assignments

| Controller / Route | Tier |
|---|---|
| `GET /markets/*` | PUBLIC (10s / 20) |
| `GET /wallet/*`, `GET /orders`, `GET /auth/me`, `POST /auth/logout` | STANDARD (10s / 10) — global default |
| `POST /orders`, `DELETE /orders/:id` | TRADING (10s / 3) |
| `POST /auth/login`, `register`, `refresh` | AUTH (10s / 1) |
| Future sensitive ops (withdraw, password change) | STRICT (60s / 1) — reserved |

## Risks / Trade-offs

- **[Risk] Stricter auth limits may affect rapid retry UX** → Mitigation: AUTH tier (1 req / 10s) is intentional for brute-force protection; clients should show clear error on 429
- **[Risk] IP-based tracking groups users behind NAT** → Mitigation: Acceptable for MVP; per-user tracking deferred to future change
- **[Risk] In-memory counter not shared across instances** → Mitigation: Document as known limitation; Redis storage is a follow-up
- **[Trade-off] Spec previously described per-user limits for authenticated routes** → Current implementation uses IP for all tiers; spec updated to reflect tiered IP-based limits

## Migration Plan

1. Deploy updated API — no database migration required
2. No frontend changes required
3. Rollback: revert `app.module.ts`, remove `common/throttle/*`, remove `@RateLimit` from controllers

## Open Questions

- Should authenticated endpoints track by `userId` instead of IP? (Deferred)
- Should Redis storage be added before production multi-instance deployment? (Deferred)
