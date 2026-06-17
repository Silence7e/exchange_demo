import type { TradingPair } from './types.js';

export const TRADING_PAIRS: TradingPair[] = [
  {
    symbol: 'BTC-USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    pricePrecision: 2,
    quantityPrecision: 6,
    minQuantity: '0.00001',
  },
  {
    symbol: 'ETH-USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    pricePrecision: 2,
    quantityPrecision: 5,
    minQuantity: '0.0001',
  },
  {
    symbol: 'SOL-USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    pricePrecision: 2,
    quantityPrecision: 4,
    minQuantity: '0.001',
  },
];

export const getTradingPair = (symbol: string): TradingPair | undefined =>
  TRADING_PAIRS.find((p) => p.symbol === symbol);

export const DEMO_BALANCES: Record<string, string> = {
  USDT: '10000',
  BTC: '1',
  ETH: '10',
  SOL: '100',
};
