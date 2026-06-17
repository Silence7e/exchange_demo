import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { getTradingPair } from '@exchange/shared';

@ApiTags('markets')
@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get()
  @ApiOperation({ summary: 'List all trading pairs with 24h stats' })
  list() {
    return this.marketService.getMarkets();
  }

  @Get(':symbol/ticker')
  @ApiOperation({ summary: 'Get ticker for a trading pair' })
  ticker(@Param('symbol') symbol: string) {
    if (!getTradingPair(symbol)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Pair not found' });
    }
    return this.marketService.getTicker(symbol);
  }

  @Get(':symbol/depth')
  @ApiOperation({ summary: 'Get order book depth' })
  @ApiQuery({ name: 'limit', required: false })
  depth(@Param('symbol') symbol: string, @Query('limit') limit?: string) {
    if (!getTradingPair(symbol)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Pair not found' });
    }
    return this.marketService.getDepth(symbol, limit ? parseInt(limit, 10) : 20);
  }

  @Get(':symbol/klines')
  @ApiOperation({ summary: 'Get kline/candlestick data' })
  @ApiQuery({ name: 'interval', required: true })
  @ApiQuery({ name: 'limit', required: false })
  klines(
    @Param('symbol') symbol: string,
    @Query('interval') interval: string,
    @Query('limit') limit?: string,
  ) {
    if (!getTradingPair(symbol)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Pair not found' });
    }
    return this.marketService.getKlines(symbol, interval, limit ? parseInt(limit, 10) : 100);
  }
}
