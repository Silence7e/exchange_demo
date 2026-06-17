import { Controller, Post, Get, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { TradingService } from './trading.service';
import { PlaceOrderBodyDto } from './dto/trading.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimit } from '../common/throttle/rate-limit.decorator';
import { RateLimitTier } from '../common/throttle/rate-limit.config';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post()
  @RateLimit(RateLimitTier.TRADING)
  @ApiOperation({ summary: 'Place a new order' })
  place(@Req() req: Request, @Body() body: PlaceOrderBodyDto) {
    return this.tradingService.placeOrder(
      req.user!.userId,
      body.symbol,
      body.side,
      body.type,
      body.quantity,
      body.price,
    );
  }

  @Delete(':id')
  @RateLimit(RateLimitTier.TRADING)
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@Req() req: Request, @Param('id') id: string) {
    return this.tradingService.cancelOrder(req.user!.userId, id);
  }

  @Get()
  @RateLimit(RateLimitTier.STANDARD)
  @ApiOperation({ summary: 'List user orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'symbol', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('symbol') symbol?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.tradingService.listOrders(
      req.user!.userId,
      status,
      symbol,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
