import { PrismaClient } from '@prisma/client';
import { TRADING_PAIRS, DEMO_BALANCES } from '@exchange/shared';

const prisma = new PrismaClient();

const main = async () => {
  for (const pair of TRADING_PAIRS) {
    await prisma.tradingPair.upsert({
      where: { symbol: pair.symbol },
      update: {},
      create: {
        symbol: pair.symbol,
        baseAsset: pair.baseAsset,
        quoteAsset: pair.quoteAsset,
        pricePrecision: pair.pricePrecision,
        quantityPrecision: pair.quantityPrecision,
        minQuantity: pair.minQuantity,
      },
    });
  }

  const now = Date.now();
  for (const pair of TRADING_PAIRS) {
    const basePrice = pair.symbol === 'BTC-USDT' ? 42000 : pair.symbol === 'ETH-USDT' ? 2200 : 140;
    for (let i = 100; i >= 0; i--) {
      const openTime = new Date(now - i * 3600_000);
      const open = basePrice + Math.sin(i / 10) * basePrice * 0.01;
      const close = open + (Math.random() - 0.5) * open * 0.005;
      const high = Math.max(open, close) * 1.002;
      const low = Math.min(open, close) * 0.998;
      await prisma.kline.upsert({
        where: {
          symbol_interval_openTime: {
            symbol: pair.symbol,
            interval: '1h',
            openTime,
          },
        },
        update: {},
        create: {
          symbol: pair.symbol,
          interval: '1h',
          openTime,
          open: open.toFixed(pair.pricePrecision),
          high: high.toFixed(pair.pricePrecision),
          low: low.toFixed(pair.pricePrecision),
          close: close.toFixed(pair.pricePrecision),
          volume: (Math.random() * 100).toFixed(2),
        },
      });
    }
  }

  console.log('Seed complete: trading pairs and klines');
};

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export { DEMO_BALANCES };
