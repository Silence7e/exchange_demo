import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimit } from '../common/throttle/rate-limit.decorator';
import { RateLimitTier } from '../common/throttle/rate-limit.config';

@ApiTags('wallet')
@Controller('wallet')
@RateLimit(RateLimitTier.STANDARD)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balances')
  @ApiOperation({ summary: 'Get user balances' })
  getBalances(@Req() req: Request) {
    return this.walletService.getBalances(req.user!.userId);
  }
}
