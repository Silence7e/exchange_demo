import { create } from 'zustand';
import type { Ticker, OrderBook } from '@exchange/shared';

interface MarketState {
  tickers: Record<string, Ticker>;
  orderBooks: Record<string, OrderBook>;
  setTicker: (symbol: string, ticker: Ticker) => void;
  setOrderBook: (symbol: string, book: OrderBook) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  tickers: {},
  orderBooks: {},
  setTicker: (symbol, ticker) =>
    set((s) => ({ tickers: { ...s.tickers, [symbol]: ticker } })),
  setOrderBook: (symbol, book) =>
    set((s) => ({ orderBooks: { ...s.orderBooks, [symbol]: book } })),
}));
