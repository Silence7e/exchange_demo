import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_BALANCES } from '@exchange/shared';
import { isGte, add, sub } from '@exchange/shared';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async createWalletWithDemoBalances(userId: string) {
    const wallet = await this.prisma.wallet.create({ data: { userId } });
    for (const [asset, amount] of Object.entries(DEMO_BALANCES)) {
      await this.prisma.balance.create({
        data: { walletId: wallet.id, asset, available: amount, frozen: '0' },
      });
    }
    return wallet;
  }

  async getBalances(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });
    if (!wallet) return [];

    return wallet.balances.map((b) => ({
      asset: b.asset,
      available: b.available.toString(),
      frozen: b.frozen.toString(),
      total: add(b.available.toString(), b.frozen.toString()),
    }));
  }

  async freeze(userId: string, asset: string, amount: string) {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        include: { balances: true },
      });
      if (!wallet) throw new BadRequestException({ code: 'NOT_FOUND', message: 'Wallet not found' });

      const balance = wallet.balances.find((b) => b.asset === asset);
      if (!balance || !isGte(balance.available.toString(), amount)) {
        throw new BadRequestException({ code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
      }

      await tx.balance.update({
        where: { id: balance.id },
        data: {
          available: sub(balance.available.toString(), amount),
          frozen: add(balance.frozen.toString(), amount),
        },
      });
    });
  }

  async unfreeze(userId: string, asset: string, amount: string) {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        include: { balances: true },
      });
      if (!wallet) return;

      const balance = wallet.balances.find((b) => b.asset === asset);
      if (!balance) return;

      const unfreezeAmt = isGte(balance.frozen.toString(), amount) ? amount : balance.frozen.toString();
      await tx.balance.update({
        where: { id: balance.id },
        data: {
          available: add(balance.available.toString(), unfreezeAmt),
          frozen: sub(balance.frozen.toString(), unfreezeAmt),
        },
      });
    });
  }

  async settleTrade(
    tx: Prisma.TransactionClient,
    userId: string,
    debitAsset: string,
    debitAmount: string,
    creditAsset: string,
    creditAmount: string,
    fromFrozen = true,
  ) {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });
    if (!wallet) throw new BadRequestException({ code: 'NOT_FOUND', message: 'Wallet not found' });

    const debit = wallet.balances.find((b) => b.asset === debitAsset);
    const credit = wallet.balances.find((b) => b.asset === creditAsset);

    if (!debit) throw new BadRequestException({ code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });

    if (fromFrozen) {
      if (!isGte(debit.frozen.toString(), debitAmount)) {
        throw new BadRequestException({ code: 'INSUFFICIENT_BALANCE', message: 'Insufficient frozen balance' });
      }
      await tx.balance.update({
        where: { id: debit.id },
        data: { frozen: sub(debit.frozen.toString(), debitAmount) },
      });
    } else {
      if (!isGte(debit.available.toString(), debitAmount)) {
        throw new BadRequestException({ code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
      }
      await tx.balance.update({
        where: { id: debit.id },
        data: { available: sub(debit.available.toString(), debitAmount) },
      });
    }

    if (credit) {
      await tx.balance.update({
        where: { id: credit.id },
        data: { available: add(credit.available.toString(), creditAmount) },
      });
    } else {
      await tx.balance.create({
        data: { walletId: wallet.id, asset: creditAsset, available: creditAmount, frozen: '0' },
      });
    }
  }

  async hasAvailable(userId: string, asset: string, amount: string): Promise<boolean> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });
    const balance = wallet?.balances.find((b) => b.asset === asset);
    return balance ? isGte(balance.available.toString(), amount) : false;
  }
}
