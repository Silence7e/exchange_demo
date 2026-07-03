import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  onModuleInit() {
    // Connect in the background. Prisma also connects lazily on the first
    // query, so bootstrap must not block on this (critical on serverless,
    // where a blocked boot makes every request time out).
    void this.$connect().catch(() => undefined);
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => undefined);
  }
}
