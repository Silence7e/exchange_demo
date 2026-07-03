import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TradingService, MatchingEngineService } from './trading.service';
import { TradingController } from './trading.controller';
import { WalletModule } from '../wallet/wallet.module';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [WalletModule, forwardRef(() => WsModule)],
  controllers: [TradingController],
  providers: [TradingService, MatchingEngineService],
  exports: [TradingService],
})
export class TradingModule implements OnModuleInit {
  constructor(private readonly tradingService: TradingService) {}

  onModuleInit() {
    // Fire-and-forget so a slow or unreachable database never blocks
    // application bootstrap (critical on serverless cold starts).
    void this.tradingService.restoreOpenOrders().catch(() => undefined);
  }
}
