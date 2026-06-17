import { Controller, Post, Get, Body, Res, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterBodyDto, LoginBodyDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { REFRESH_TOKEN_COOKIE } from '../common/constants/cookies';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() body: RegisterBodyDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(body.email, body.password, res);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  login(@Body() body: LoginBodyDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(body.email, body.password, res);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req.cookies?.[REFRESH_TOKEN_COOKIE], res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req.user!.userId, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user session' })
  me(@Req() req: Request) {
    return this.authService.me(req.user!.userId);
  }
}
