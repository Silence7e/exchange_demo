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

  async onModuleInit() {
    await this.tradingService.restoreOpenOrders();
  }
}
