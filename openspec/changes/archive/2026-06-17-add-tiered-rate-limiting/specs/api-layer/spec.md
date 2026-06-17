## MODIFIED Requirements

### Requirement: Rate limiting
The API SHALL enforce tiered rate limits using semantic tiers defined in `apps/api/src/common/throttle/rate-limit.config.ts`. Limits SHALL be applied globally by `ThrottlerGuard` with per-route tier overrides via the `@RateLimit(tier)` decorator.

Tier definitions:

| Tier | Window | Limit | Applied to |
|------|--------|-------|------------|
| PUBLIC | 10 seconds | 20 requests | Public market read endpoints (`GET /markets/*`) |
| STANDARD | 10 seconds | 10 requests | Default fallback; wallet reads, order list, auth session endpoints |
| TRADING | 10 seconds | 3 requests | Order placement and cancellation (`POST /orders`, `DELETE /orders/:id`) |
| AUTH | 10 seconds | 1 request | Login, register, and token refresh (`POST /auth/login`, `register`, `refresh`) |
| STRICT | 60 seconds | 1 request | Reserved for future sensitive operations (e.g. withdraw, password change) |

Rate limit counters SHALL be tracked per client IP (default `@nestjs/throttler` behavior). Routes without an explicit `@RateLimit` decorator SHALL use the STANDARD tier.

#### Scenario: Rate limit exceeded
- **WHEN** a client exceeds the tier limit for an endpoint
- **THEN** the API returns 429 with `Retry-After` header and error code `RATE_LIMITED`

#### Scenario: Auth endpoint strict limit
- **WHEN** a client sends more than 1 login request within 10 seconds from the same IP
- **THEN** the API returns 429 before executing login logic

#### Scenario: Trading write limit
- **WHEN** a client sends more than 3 order placement or cancellation requests within 10 seconds from the same IP
- **THEN** the API returns 429

#### Scenario: Public market read limit
- **WHEN** a client sends more than 20 market data requests within 10 seconds from the same IP
- **THEN** the API returns 429

#### Scenario: Default tier for undecorated routes
- **WHEN** a client calls an authenticated read endpoint without an explicit `@RateLimit` decorator (e.g. `GET /auth/me`)
- **THEN** the STANDARD tier (10 requests per 10 seconds) applies
