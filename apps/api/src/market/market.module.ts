import { Module, OnModuleInit } from '@nestjs/common';
import { MarketService, MarketDataStore, MarketMockService } from './market.service';
import { MarketController } from './market.controller';

@Module({
  controllers: [MarketController],
  providers: [MarketDataStore, MarketService, MarketMockService],
  exports: [MarketService, MarketDataStore],
})
export class MarketModule implements OnModuleInit {
  constructor(private readonly mockService: MarketMockService) {}

  onModuleInit() {
    this.mockService.start();
  }
}
