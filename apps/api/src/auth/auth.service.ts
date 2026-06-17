import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.module';
import { WalletService } from '../wallet/wallet.service';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getCookieOptions,
} from '../common/constants/cookies';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly walletService: WalletService,
  ) {}

  async register(email: string, password: string, res: Response) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({ code: 'CONFLICT', message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    await this.walletService.createWalletWithDemoBalances(user.id);
    await this.setAuthCookies(user.id, user.email, res);

    return { message: 'Registration successful' };
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    await this.setAuthCookies(user.id, user.email, res);
    return { message: 'Login successful' };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'No refresh token' });
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_SECRET || 'dev-secret',
      });
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid refresh token' });
    }

    const stored = await this.redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid refresh token' });
    }

    await this.setAuthCookies(payload.sub, payload.email, res);
    return { message: 'Token refreshed' };
  }

  async logout(userId: string, res: Response) {
    await this.redis.del(`refresh:${userId}`);
    res.clearCookie(ACCESS_TOKEN_COOKIE, getCookieOptions(0));
    res.clearCookie(REFRESH_TOKEN_COOKIE, getCookieOptions(0, '/api/v1/auth'));
    return { message: 'Logged out' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'User not found' });
    }
    return { user: { id: user.id, email: user.email } };
  }

  private async setAuthCookies(userId: string, email: string, res: Response) {
    const payload: JwtPayload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.redis.set(`refresh:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      getCookieOptions(7 * 24 * 60 * 60 * 1000, '/api/v1/auth'),
    );
  }
}
