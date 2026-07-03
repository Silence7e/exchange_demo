import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../../redis/redis.module';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

const INCREMENT_SCRIPT = `
local hits_key = KEYS[1]
local block_key = KEYS[2]
local ttl_ms = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local block_duration_ms = tonumber(ARGV[3])

local block_ttl = redis.call('PTTL', block_key)
if block_ttl > 0 then
  local hits = tonumber(redis.call('GET', hits_key) or '0')
  local hits_ttl = redis.call('PTTL', hits_key)
  if hits_ttl < 0 then hits_ttl = ttl_ms end
  return {hits, math.ceil(hits_ttl / 1000), 1, math.ceil(block_ttl / 1000)}
end

local hits = redis.call('INCR', hits_key)
if hits == 1 then
  redis.call('PEXPIRE', hits_key, ttl_ms)
end

local hits_ttl = redis.call('PTTL', hits_key)
if hits_ttl < 0 then hits_ttl = ttl_ms end
local time_to_expire = math.ceil(hits_ttl / 1000)

if hits > limit then
  if block_duration_ms > 0 then
    redis.call('SET', block_key, '1', 'PX', block_duration_ms)
    return {hits, time_to_expire, 1, math.ceil(block_duration_ms / 1000)}
  end
  return {hits, time_to_expire, 1, 0}
end

return {hits, time_to_expire, 0, 0}
`;

const REDIS_OP_TIMEOUT_MS = 1500;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private scriptSha: string | null = null;
  private readonly prefix = 'throttle';

  constructor(private readonly redis: RedisService) {}

  private withTimeout<T>(operation: Promise<T>): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('REDIS_TIMEOUT')), REDIS_OP_TIMEOUT_MS),
      ),
    ]);
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `${this.prefix}:{${key}}:${throttlerName}:hits`;
    const blockKey = `${this.prefix}:{${key}}:${throttlerName}:block`;
    const effectiveBlockDuration = blockDuration > 0 ? blockDuration : ttl;

    try {
      const sha = await this.withTimeout(this.loadScript());
      const result = (await this.withTimeout(
        this.redis.evalsha(
          sha,
          2,
          hitsKey,
          blockKey,
          String(ttl),
          String(limit),
          String(effectiveBlockDuration),
        ),
      )) as [number, number, number, number];

      return {
        totalHits: result[0],
        timeToExpire: result[1],
        isBlocked: result[2] === 1,
        timeToBlockExpire: result[3],
      };
    } catch (error) {
      if (this.isNoScriptError(error)) {
        this.scriptSha = null;
        return this.increment(key, ttl, limit, blockDuration, throttlerName);
      }
      // Fail open: when Redis is unavailable, allow the request through rather
      // than blocking the entire API (important on serverless cold starts).
      this.scriptSha = null;
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  private async loadScript(): Promise<string> {
    if (this.scriptSha) {
      return this.scriptSha;
    }
    this.scriptSha = (await this.redis.script('LOAD', INCREMENT_SCRIPT)) as string;
    return this.scriptSha;
  }

  private isNoScriptError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('NOSCRIPT');
  }
}
