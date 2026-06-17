import { Module, forwardRef } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { MarketModule } from '../market/market.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MarketModule, WalletModule, forwardRef(() => AuthModule)],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class WsModule {}
