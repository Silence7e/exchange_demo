import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  OrderSide,
  OrderType,
  OrderStatus,
  getTradingPair,
  mul,
  isGte,
  sub,
} from '@exchange/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { WsGateway } from '../ws/ws.gateway';

interface BookOrder {
  id: string;
  userId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: string | null;
  quantity: string;
  filledQuantity: string;
  createdAt: Date;
}

@Injectable()
export class MatchingEngineService {
  private books = new Map<string, { bids: BookOrder[]; asks: BookOrder[] }>();

  getBook(symbol: string) {
    if (!this.books.has(symbol)) {
      this.books.set(symbol, { bids: [], asks: [] });
    }
    return this.books.get(symbol)!;
  }

  addOrder(order: BookOrder) {
    const book = this.getBook(order.symbol);
    if (order.side === OrderSide.BUY) {
      book.bids.push(order);
      book.bids.sort((a, b) => {
        const priceDiff = parseFloat(b.price || '0') - parseFloat(a.price || '0');
        return priceDiff !== 0 ? priceDiff : a.createdAt.getTime() - b.createdAt.getTime();
      });
    } else {
      book.asks.push(order);
      book.asks.sort((a, b) => {
        const priceDiff = parseFloat(a.price || '0') - parseFloat(b.price || '0');
        return priceDiff !== 0 ? priceDiff : a.createdAt.getTime() - b.createdAt.getTime();
      });
    }
  }

  removeOrder(symbol: string, orderId: string, side: OrderSide) {
    const book = this.getBook(symbol);
    const list = side === OrderSide.BUY ? book.bids : book.asks;
    const idx = list.findIndex((o) => o.id === orderId);
    if (idx >= 0) list.splice(idx, 1);
  }

  getOpenOrders(symbol: string): BookOrder[] {
    const book = this.getBook(symbol);
    return [...book.bids, ...book.asks];
  }
}

@Injectable()
export class TradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly matchingEngine: MatchingEngineService,
    private readonly wsGateway: WsGateway,
  ) {}

  async restoreOpenOrders() {
    const openOrders = await this.prisma.order.findMany({
      where: { status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] } },
    });
    for (const o of openOrders) {
      this.matchingEngine.addOrder({
        id: o.id,
        userId: o.userId,
        symbol: o.symbol,
        side: o.side as OrderSide,
        type: o.type as OrderType,
        price: o.price?.toString() ?? null,
        quantity: o.quantity.toString(),
        filledQuantity: o.filledQuantity.toString(),
        createdAt: o.createdAt,
      });
    }
  }

  async placeOrder(
    userId: string,
    symbol: string,
    side: OrderSide,
    type: OrderType,
    quantity: string,
    price?: string,
  ) {
    const pair = getTradingPair(symbol);
    if (!pair) {
      throw new BadRequestException({ code: 'INVALID_PAIR', message: 'Invalid trading pair' });
    }

    if (type === OrderType.LIMIT && !price) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Price required for limit orders' });
    }

    const freezeAsset = side === OrderSide.BUY ? pair.quoteAsset : pair.baseAsset;
    const freezeAmount =
      side === OrderSide.BUY ? mul(price || '0', quantity) : quantity;

    if (type === OrderType.MARKET && side === OrderSide.BUY) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Market buy not supported in MVP' });
    }

    const hasBalance = await this.walletService.hasAvailable(userId, freezeAsset, freezeAmount);
    if (!hasBalance) {
      throw new BadRequestException({ code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
    }

    await this.walletService.freeze(userId, freezeAsset, freezeAmount);

    const order = await this.prisma.order.create({
      data: {
        userId,
        symbol,
        side,
        type,
        price: price ?? null,
        quantity,
        filledQuantity: '0',
        status: OrderStatus.OPEN,
      },
    });

    const bookOrder: BookOrder = {
      id: order.id,
      userId,
      symbol,
      side,
      type,
      price: price ?? null,
      quantity,
      filledQuantity: '0',
      createdAt: order.createdAt,
    };

    if (type === OrderType.MARKET) {
      await this.executeMarketOrder(bookOrder, pair.baseAsset, pair.quoteAsset);
    } else {
      this.matchingEngine.addOrder(bookOrder);
      await this.matchLimitOrder(bookOrder, pair.baseAsset, pair.quoteAsset);
    }

    const updated = await this.prisma.order.findUnique({ where: { id: order.id } });
    return this.formatOrder(updated!);
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    if (![OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED].includes(order.status as OrderStatus)) {
      throw new BadRequestException({ code: 'ORDER_NOT_CANCELLABLE', message: 'Order cannot be cancelled' });
    }

    const pair = getTradingPair(order.symbol)!;
    const remaining = sub(order.quantity.toString(), order.filledQuantity.toString());
    const freezeAsset = order.side === OrderSide.BUY ? pair.quoteAsset : pair.baseAsset;
    const freezeAmount =
      order.side === OrderSide.BUY
        ? mul(order.price?.toString() || '0', remaining)
        : remaining;

    await this.walletService.unfreeze(userId, freezeAsset, freezeAmount);
    this.matchingEngine.removeOrder(order.symbol, order.id, order.side as OrderSide);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    const formatted = this.formatOrder(updated);
    this.wsGateway.pushOrderUpdate(userId, formatted);
    return formatted;
  }

  async listOrders(userId: string, status?: string, symbol?: string, limit = 20, offset = 0) {
    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;
    if (symbol) where.symbol = symbol;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((o) => this.formatOrder(o)),
      pagination: { total, limit, offset },
    };
  }

  private async matchLimitOrder(order: BookOrder, baseAsset: string, quoteAsset: string) {
    const book = this.matchingEngine.getBook(order.symbol);
    const opposite = order.side === OrderSide.BUY ? book.asks : book.bids;

    for (const match of [...opposite]) {
      if (order.side === OrderSide.BUY && order.price && parseFloat(match.price || '0') > parseFloat(order.price)) break;
      if (order.side === OrderSide.SELL && order.price && parseFloat(match.price || '0') < parseFloat(order.price)) break;

      const remaining = sub(order.quantity, order.filledQuantity);
      const matchRemaining = sub(match.quantity, match.filledQuantity);
      const fillQty = isGte(remaining, matchRemaining) ? matchRemaining : remaining;
      const fillPrice = match.price || order.price || '0';

      await this.executeFill(order, match, fillQty, fillPrice, baseAsset, quoteAsset);
      if (isGte(order.filledQuantity, order.quantity)) break;
    }
  }

  private async executeMarketOrder(order: BookOrder, baseAsset: string, quoteAsset: string) {
    const book = this.matchingEngine.getBook(order.symbol);
    const opposite = order.side === OrderSide.SELL ? book.bids : book.asks;

    for (const match of [...opposite]) {
      const remaining = sub(order.quantity, order.filledQuantity);
      const matchRemaining = sub(match.quantity, match.filledQuantity);
      const fillQty = isGte(remaining, matchRemaining) ? matchRemaining : remaining;
      const fillPrice = match.price || '0';

      await this.executeFill(order, match, fillQty, fillPrice, baseAsset, quoteAsset);
      if (isGte(order.filledQuantity, order.quantity)) break;
    }
  }

  private async executeFill(
    taker: BookOrder,
    maker: BookOrder,
    fillQty: string,
    fillPrice: string,
    baseAsset: string,
    quoteAsset: string,
  ) {
    const quoteAmount = mul(fillPrice, fillQty);

    await this.prisma.$transaction(async (tx) => {
      for (const [order, isBuyer] of [
        [taker, taker.side === OrderSide.BUY],
        [maker, maker.side === OrderSide.BUY],
      ] as const) {
        const newFilled = (parseFloat(order.filledQuantity) + parseFloat(fillQty)).toString();
        const status = isGte(newFilled, order.quantity) ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;
        order.filledQuantity = newFilled;
        await tx.order.update({
          where: { id: order.id },
          data: { filledQuantity: newFilled, status },
        });
      }

      await tx.trade.createMany({
        data: [
          { orderId: taker.id, symbol: taker.symbol, side: taker.side, price: fillPrice, quantity: fillQty },
          { orderId: maker.id, symbol: maker.symbol, side: maker.side, price: fillPrice, quantity: fillQty },
        ],
      });

      await this.walletService.settleTrade(tx, taker.userId, quoteAsset, quoteAmount, baseAsset, fillQty, taker.side === OrderSide.BUY);
      await this.walletService.settleTrade(tx, maker.userId, baseAsset, fillQty, quoteAsset, quoteAmount, maker.side === OrderSide.SELL);
    });

    if (isGte(taker.filledQuantity, taker.quantity)) {
      this.matchingEngine.removeOrder(taker.symbol, taker.id, taker.side);
    }
    if (isGte(maker.filledQuantity, maker.quantity)) {
      this.matchingEngine.removeOrder(maker.symbol, maker.id, maker.side);
    }

    const takerOrder = await this.prisma.order.findUnique({ where: { id: taker.id } });
    const makerOrder = await this.prisma.order.findUnique({ where: { id: maker.id } });
    if (takerOrder) this.wsGateway.pushOrderUpdate(taker.userId, this.formatOrder(takerOrder));
    if (makerOrder) this.wsGateway.pushOrderUpdate(maker.userId, this.formatOrder(makerOrder));
    this.wsGateway.pushBalanceUpdate(taker.userId);
    this.wsGateway.pushBalanceUpdate(maker.userId);
  }

  private formatOrder(o: {
    id: string;
    userId: string;
    symbol: string;
    side: string;
    type: string;
    price: { toString(): string } | null;
    quantity: { toString(): string };
    filledQuantity: { toString(): string };
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: o.id,
      userId: o.userId,
      symbol: o.symbol,
      side: o.side,
      type: o.type,
      price: o.price?.toString() ?? null,
      quantity: o.quantity.toString(),
      filledQuantity: o.filledQuantity.toString(),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }
}
