import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    super(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
      ...(url.startsWith('rediss://') ? { tls: {} } : {}),
    });
    // Swallow connection errors so an unavailable Redis never crashes the
    // process; consumers (e.g. the throttler storage) fail open instead.
    this.on('error', () => undefined);
  }

  async onModuleDestroy() {
    await this.quit().catch(() => undefined);
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
