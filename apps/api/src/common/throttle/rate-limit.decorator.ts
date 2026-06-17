import { applyDecorators } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { RATE_LIMITS, RateLimitTier } from './rate-limit.config';

export const RateLimit = (tier: RateLimitTier) =>
  applyDecorators(Throttle({ default: RATE_LIMITS[tier] }));

export const NoRateLimit = () => SkipThrottle();
