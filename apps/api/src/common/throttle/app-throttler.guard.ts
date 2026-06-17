import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../constants/cookies';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storage, reflector);
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as Request;

    const sessionUser = request.user;
    if (sessionUser?.userId) {
      return `user:${sessionUser.userId}`;
    }

    const token = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (token) {
      try {
        const payload = this.jwtService.verify<{ sub?: string }>(token);
        if (payload.sub) {
          return `user:${payload.sub}`;
        }
      } catch {
        // Invalid or expired token — fall back to IP for tracking
      }
    }

    return `ip:${request.ip ?? request.socket.remoteAddress ?? 'unknown'}`;
  }
}
