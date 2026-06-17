import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getTradingPair, TRADING_PAIRS } from '@exchange/shared';
import type { Ticker, OrderBook, Kline } from '@exchange/shared';
import { KlineInterval } from '@exchange/shared';

@Injectable()
export class MarketDataStore {
  private tickers = new Map<string, Ticker>();
  private orderBooks = new Map<string, OrderBook>();

  constructor() {
    for (const pair of TRADING_PAIRS) {
      const basePrice = pair.symbol === 'BTC-USDT' ? '42000' : pair.symbol === 'ETH-USDT' ? '2200' : '140';
      this.tickers.set(pair.symbol, {
        symbol: pair.symbol,
        lastPrice: basePrice,
        priceChange: '120',
        priceChangePercent: '0.0029',
        high24h: (parseFloat(basePrice) * 1.02).toFixed(pair.pricePrecision),
        low24h: (parseFloat(basePrice) * 0.98).toFixed(pair.pricePrecision),
        volume24h: '1234.56',
      });
      this.orderBooks.set(pair.symbol, this.generateDepth(pair.symbol, basePrice, pair.pricePrecision));
    }
  }

  getTicker(symbol: string): Ticker | undefined {
    return this.tickers.get(symbol);
  }

  getOrderBook(symbol: string): OrderBook | undefined {
    return this.orderBooks.get(symbol);
  }

  updateTicker(symbol: string, ticker: Partial<Ticker>) {
    const current = this.tickers.get(symbol);
    if (current) this.tickers.set(symbol, { ...current, ...ticker });
  }

  updateOrderBook(symbol: string, book: OrderBook) {
    this.orderBooks.set(symbol, book);
  }

  getAllTickers(): Ticker[] {
    return Array.from(this.tickers.values());
  }

  private generateDepth(symbol: string, mid: string, precision: number): OrderBook {
    const midNum = parseFloat(mid);
    const bids = Array.from({ length: 20 }, (_, i) => ({
      price: (midNum - (i + 1) * midNum * 0.0001).toFixed(precision),
      quantity: (Math.random() * 2).toFixed(6),
    }));
    const asks = Array.from({ length: 20 }, (_, i) => ({
      price: (midNum + (i + 1) * midNum * 0.0001).toFixed(precision),
      quantity: (Math.random() * 2).toFixed(6),
    }));
    return { symbol, bids, asks, timestamp: Date.now() };
  }

  tick() {
    for (const pair of TRADING_PAIRS) {
      const ticker = this.tickers.get(pair.symbol);
      if (!ticker) continue;
      const change = (Math.random() - 0.5) * parseFloat(ticker.lastPrice) * 0.001;
      const newPrice = (parseFloat(ticker.lastPrice) + change).toFixed(pair.pricePrecision);
      const pct = (change / parseFloat(ticker.lastPrice)).toFixed(4);
      this.tickers.set(pair.symbol, {
        ...ticker,
        lastPrice: newPrice,
        priceChange: change.toFixed(pair.pricePrecision),
        priceChangePercent: pct,
      });
      this.orderBooks.set(pair.symbol, this.generateDepth(pair.symbol, newPrice, pair.pricePrecision));
    }
  }
}

@Injectable()
export class MarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: MarketDataStore,
  ) {}

  getMarkets() {
    return TRADING_PAIRS.map((pair) => ({
      ...pair,
      ticker: this.store.getTicker(pair.symbol)!,
    }));
  }

  getTicker(symbol: string) {
    const ticker = this.store.getTicker(symbol);
    if (!ticker) throw new Error('Pair not found');
    return ticker;
  }

  getDepth(symbol: string, limit = 20) {
    const book = this.store.getOrderBook(symbol);
    if (!book) throw new Error('Pair not found');
    return {
      ...book,
      bids: book.bids.slice(0, limit),
      asks: book.asks.slice(0, limit),
    };
  }

  async getKlines(symbol: string, interval: string, limit = 100): Promise<Kline[]> {
    const rows = await this.prisma.kline.findMany({
      where: { symbol, interval },
      orderBy: { openTime: 'desc' },
      take: limit,
    });
    return rows
      .map((r) => ({
        symbol: r.symbol,
        interval: interval as KlineInterval,
        openTime: r.openTime.getTime(),
        open: r.open.toString(),
        high: r.high.toString(),
        low: r.low.toString(),
        close: r.close.toString(),
        volume: r.volume.toString(),
      }))
      .reverse();
  }
}

@Injectable()
export class MarketMockService {
  constructor(private readonly store: MarketDataStore) {}

  start() {
    setInterval(() => this.store.tick(), 2000);
  }
}
