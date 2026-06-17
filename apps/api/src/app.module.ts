import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DEFAULT_RATE_LIMIT_TIER, RATE_LIMITS } from './common/throttle/rate-limit.config';
import { AppThrottlerGuard } from './common/throttle/app-throttler.guard';
import { RedisThrottlerStorage } from './common/throttle/redis-throttler.storage';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule, RedisService } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { MarketModule } from './market/market.module';
import { TradingModule } from './trading/trading.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [{ name: 'default', ...RATE_LIMITS[DEFAULT_RATE_LIMIT_TIER] }],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    WalletModule,
    MarketModule,
    TradingModule,
    WsModule,
  ],
  providers: [AppThrottlerGuard, { provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
