/**
 * Semantic tier names — limits live in RATE_LIMITS and can change without
 * touching controllers. Prefer PUBLIC / AUTH / TRADING over TEN_TIMES etc.
 */
export const RateLimitTier = {
  PUBLIC: 'public',
  STANDARD: 'standard',
  TRADING: 'trading',
  AUTH: 'auth',
  STRICT: 'strict',
} as const;

export type RateLimitTier = (typeof RateLimitTier)[keyof typeof RateLimitTier];

export const RATE_LIMITS: Record<RateLimitTier, { ttl: number; limit: number }> = {
  [RateLimitTier.PUBLIC]: { ttl: 10_000, limit: 20 },
  [RateLimitTier.STANDARD]: { ttl: 10_000, limit: 10 },
  [RateLimitTier.TRADING]: { ttl: 10_000, limit: 3 },
  [RateLimitTier.AUTH]: { ttl: 10_000, limit: 1 },
  [RateLimitTier.STRICT]: { ttl: 60_000, limit: 1 },
};

/** Global fallback when a route has no @RateLimit decorator */
export const DEFAULT_RATE_LIMIT_TIER = RateLimitTier.STANDARD;
